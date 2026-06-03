import path from 'path'
import dotenv from 'dotenv'
import { generateBackupZip } from '../src/services/backupService'

const backendRoot = process.cwd()
dotenv.config({ path: path.join(backendRoot, '.env') })

async function main() {
  const backup = await generateBackupZip({
    appName: process.env.APP_NAME,
    backendRoot,
    saveToBackupsDir: true
  })

  console.log(`Backup generado correctamente: ${backup.filePath}`)
}

main().catch((error) => {
  console.error('No se pudo generar el backup.')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
