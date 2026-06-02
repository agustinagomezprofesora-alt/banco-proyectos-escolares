import express from 'express'
import cors from 'cors'
import routes from './routes'
import { uploadsDir } from './services/uploadService'

const app = express()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(uploadsDir, {
  dotfiles: 'deny',
  index: false,
  fallthrough: false
}))
app.use('/api', routes)

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ message: 'Error interno del servidor' })
})

export default app
