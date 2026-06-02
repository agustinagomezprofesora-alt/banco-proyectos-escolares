import path from 'path'

export const saveFile = async (buffer: Buffer, filename: string) => {
  const filePath = path.join(process.cwd(), 'uploads', filename)
  // Placeholder: escribir archivo con fs si se desea
  return filePath
}
