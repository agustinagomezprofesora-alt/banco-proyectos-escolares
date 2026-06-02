import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </SettingsProvider>
  )
}
