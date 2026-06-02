import fs from 'fs'
import path from 'path'

const backendRoot = process.cwd()
const databasePath = path.join(backendRoot, 'prisma', 'dev.db')
const backupsDir = path.join(backendRoot, 'backups')

const pad = (value: number) => String(value).padStart(2, '0')

const buildTimestamp = () => {
  const now = new Date()
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate())
  ].join('-') + `-${pad(now.getHours())}-${pad(now.getMinutes())}`
}

async function main() {
  if (!fs.existsSync(databasePath)) {
    throw new Error(`No se encontró la base SQLite en ${databasePath}`)
  }

  await fs.promises.mkdir(backupsDir, { recursive: true })

  const timestamp = buildTimestamp()
  let backupPath = path.join(backupsDir, `backup-${timestamp}.db`)
  let suffix = 2
  while (fs.existsSync(backupPath)) {
    backupPath = path.join(backupsDir, `backup-${timestamp}-${suffix}.db`)
    suffix += 1
  }

  await fs.promises.copyFile(databasePath, backupPath, fs.constants.COPYFILE_EXCL)

  console.log('Respaldo generado correctamente.')
  console.log(backupPath)
}

main().catch((error) => {
  console.error('No se pudo generar el respaldo.')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
