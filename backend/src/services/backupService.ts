import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { fileURLToPath } from 'url'

type ZipEntry = {
  archivePath: string
  data: Buffer
  modifiedAt: Date
}

type BackupOptions = {
  appName?: string | null
  backendRoot?: string
  saveToBackupsDir?: boolean
  fileNamePrefix?: string
}

export type GeneratedBackup = {
  buffer: Buffer
  fileName: string
  filePath?: string
  fileCount: number
}

const pad = (value: number) => String(value).padStart(2, '0')

export const buildBackupTimestamp = () => {
  const now = new Date()
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate())
  ].join('-') + `-${pad(now.getHours())}-${pad(now.getMinutes())}`
}

const stripQuery = (value: string) => value.split('?')[0]

export const resolveDatabasePath = (backendRoot = process.cwd()) => {
  const prismaDir = path.join(backendRoot, 'prisma')
  const databaseUrl = process.env.DATABASE_URL?.trim()
  if (!databaseUrl) return path.join(prismaDir, 'dev.db')

  if (!databaseUrl.startsWith('file:')) {
    throw new Error('DATABASE_URL debe apuntar a una base SQLite local con formato file:...')
  }

  if (databaseUrl.startsWith('file://')) {
    return fileURLToPath(stripQuery(databaseUrl))
  }

  const sqlitePath = decodeURIComponent(stripQuery(databaseUrl.replace(/^file:/, '')))
  return path.isAbsolute(sqlitePath) ? sqlitePath : path.resolve(prismaDir, sqlitePath)
}

const toArchivePath = (value: string) => value.split(path.sep).join('/')

const collectUploads = async (dir: string, relativeDir = ''): Promise<ZipEntry[]> => {
  if (!fs.existsSync(dir)) return []

  const entries = await fs.promises.readdir(dir, { withFileTypes: true })
  const files: ZipEntry[] = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relativePath = path.join(relativeDir, entry.name)

    if (entry.isDirectory()) {
      files.push(...await collectUploads(fullPath, relativePath))
      continue
    }

    if (!entry.isFile()) continue

    const stat = await fs.promises.stat(fullPath)
    files.push({
      archivePath: toArchivePath(path.join('uploads', relativePath)),
      data: await fs.promises.readFile(fullPath),
      modifiedAt: stat.mtime
    })
  }

  return files
}

const makeCrcTable = () => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let crc = i
    for (let j = 0; j < 8; j += 1) {
      crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1)
    }
    table[i] = crc >>> 0
  }
  return table
}

const crcTable = makeCrcTable()

const crc32 = (buffer: Buffer) => {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

const toDosDateTime = (date: Date) => {
  const year = Math.max(1980, date.getFullYear())
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  return { dosDate, dosTime }
}

const uint16 = (value: number) => {
  const buffer = Buffer.alloc(2)
  buffer.writeUInt16LE(value, 0)
  return buffer
}

const uint32 = (value: number) => {
  const buffer = Buffer.alloc(4)
  buffer.writeUInt32LE(value >>> 0, 0)
  return buffer
}

const createZip = (entries: ZipEntry[]) => {
  const localParts: Buffer[] = []
  const centralParts: Buffer[] = []
  let offset = 0

  for (const entry of entries) {
    const fileName = Buffer.from(entry.archivePath, 'utf8')
    const compressed = zlib.deflateRawSync(entry.data)
    const checksum = crc32(entry.data)
    const { dosDate, dosTime } = toDosDateTime(entry.modifiedAt)

    const localHeader = Buffer.concat([
      uint32(0x04034b50),
      uint16(20),
      uint16(0x0800),
      uint16(8),
      uint16(dosTime),
      uint16(dosDate),
      uint32(checksum),
      uint32(compressed.length),
      uint32(entry.data.length),
      uint16(fileName.length),
      uint16(0),
      fileName
    ])

    const centralHeader = Buffer.concat([
      uint32(0x02014b50),
      uint16(20),
      uint16(20),
      uint16(0x0800),
      uint16(8),
      uint16(dosTime),
      uint16(dosDate),
      uint32(checksum),
      uint32(compressed.length),
      uint32(entry.data.length),
      uint16(fileName.length),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(offset),
      fileName
    ])

    localParts.push(localHeader, compressed)
    centralParts.push(centralHeader)
    offset += localHeader.length + compressed.length
  }

  const centralDirectory = Buffer.concat(centralParts)
  const endOfCentralDirectory = Buffer.concat([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(entries.length),
    uint16(entries.length),
    uint32(centralDirectory.length),
    uint32(offset),
    uint16(0)
  ])

  return Buffer.concat([...localParts, centralDirectory, endOfCentralDirectory])
}

const buildMetadata = (appName: string, generatedAt: Date, fileCount: number) => ({
  app: 'Memoria Pedagógica Digital',
  generatedAt: generatedAt.toISOString(),
  appName,
  includedFilesApprox: fileCount,
  warning: 'Este backup incluye base de datos y archivos subidos. No incluye secretos, .env ni claves privadas.'
})

export const generateBackupZip = async (options: BackupOptions = {}): Promise<GeneratedBackup> => {
  const backendRoot = options.backendRoot ?? process.cwd()
  const databasePath = resolveDatabasePath(backendRoot)

  if (!fs.existsSync(databasePath)) {
    throw new Error('No se encontró la base de datos para respaldar.')
  }

  const generatedAt = new Date()
  const timestamp = buildBackupTimestamp()
  const fileNamePrefix = options.fileNamePrefix || 'backup-memoria-pedagógica'
  const fileName = `${fileNamePrefix}-${timestamp}.zip`
  const databaseStat = await fs.promises.stat(databasePath)
  const entries: ZipEntry[] = [{
    archivePath: 'database/dev.db',
    data: await fs.promises.readFile(databasePath),
    modifiedAt: databaseStat.mtime
  }]

  entries.push(...await collectUploads(path.join(backendRoot, 'uploads')))

  const metadata = buildMetadata(options.appName || 'Memoria Pedagógica Digital', generatedAt, entries.length)
  entries.push({
    archivePath: 'metadata.json',
    data: Buffer.from(JSON.stringify(metadata, null, 2), 'utf8'),
    modifiedAt: generatedAt
  })

  const buffer = createZip(entries)
  let filePath: string | undefined

  if (options.saveToBackupsDir) {
    const backupsDir = path.join(backendRoot, 'backups')
    await fs.promises.mkdir(backupsDir, { recursive: true })

    filePath = path.join(backupsDir, fileName)
    let suffix = 2
    while (fs.existsSync(filePath)) {
      filePath = path.join(backupsDir, `${fileNamePrefix}-${timestamp}-${suffix}.zip`)
      suffix += 1
    }

    await fs.promises.writeFile(filePath, buffer, { flag: 'wx' })
  }

  return {
    buffer,
    fileName: filePath ? path.basename(filePath) : fileName,
    filePath,
    fileCount: entries.length
  }
}
