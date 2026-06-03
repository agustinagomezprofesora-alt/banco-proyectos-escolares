import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

type TopbarProps = {
  onMenuClick: () => void
}

const resolvePageMeta = (pathname: string) => {
  if (pathname === '/dashboard' || pathname === '/projects') {
    return {
      title: 'Mis proyectos',
      subtitle: 'Gestioná tus experiencias y fichas institucionales.'
    }
  }

  if (pathname === '/projects/new') {
    return {
      title: 'Cargar nueva experiencia',
      subtitle: 'Registrá los datos básicos para iniciar una ficha institucional.'
    }
  }

  if (pathname.startsWith('/projects/') && pathname.endsWith('/materials')) {
    return {
      title: 'Recursos visuales',
      subtitle: 'Juegos, presentación y materiales imprimibles del proyecto.'
    }
  }

  if (pathname.startsWith('/projects/') && pathname.endsWith('/edit')) {
    return {
      title: 'Editar proyecto',
      subtitle: 'Actualizá la experiencia, sus materiales y datos institucionales.'
    }
  }

  if (pathname.startsWith('/projects/')) {
    return {
      title: 'Ficha del proyecto',
      subtitle: 'Consulta, edita y descarga los materiales de la experiencia.'
    }
  }

  if (pathname === '/bank') {
    return {
      title: 'Banco de proyectos',
      subtitle: 'Explora experiencias publicadas y reutilizables.'
    }
  }

  if (pathname.startsWith('/bank/') && pathname.endsWith('/materials')) {
    return {
      title: 'Recursos visuales',
      subtitle: 'Materiales imprimibles de una experiencia publicada.'
    }
  }

  if (pathname.startsWith('/bank/')) {
    return {
      title: 'Proyecto publicado',
      subtitle: 'Ficha institucional disponible en el banco.'
    }
  }

  if (pathname === '/admin') {
    return {
      title: 'Administración',
      subtitle: 'Seguimiento general del banco institucional.'
    }
  }

  if (pathname === '/admin/projects') {
    return {
      title: 'Gestión de proyectos',
      subtitle: 'Revisión, publicación y archivo de experiencias.'
    }
  }

  if (pathname.startsWith('/admin/projects/') && pathname.endsWith('/materials')) {
    return {
      title: 'Recursos visuales',
      subtitle: 'Materiales imprimibles del proyecto administrado.'
    }
  }

  if (pathname.startsWith('/admin/projects/') && pathname.endsWith('/edit')) {
    return {
      title: 'Editar proyecto',
      subtitle: 'Edición administrativa de la experiencia.'
    }
  }

  if (pathname.startsWith('/admin/projects/')) {
    return {
      title: 'Revisión de proyecto',
      subtitle: 'Gestión de estado, evidencias y materiales generados.'
    }
  }

  if (pathname === '/admin/settings') {
    return {
      title: 'Configuración institucional',
      subtitle: 'Personalización básica de la institución y de la app.'
    }
  }

  if (pathname === '/admin/backup') {
    return {
      title: 'Respaldo',
      subtitle: 'Generación y restauración segura de backups locales.'
    }
  }

  return {
    title: 'Memoria Pedagógica Digital',
    subtitle: 'Memoria institucional viva de experiencias pedagógicas.'
  }
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation()
  const { user } = useAuth()
  const meta = resolvePageMeta(location.pathname)

  return (
    <header className="app-topbar no-print">
      <div className="topbar-left">
        <button type="button" className="topbar-menu-button" onClick={onMenuClick} aria-label="Abrir menú">
          <span />
          <span />
          <span />
        </button>
        <div>
          <h1>{meta.title}</h1>
          <p>{meta.subtitle}</p>
        </div>
      </div>

      <div className="topbar-user">
        <span>{user?.name}</span>
        <strong>{user?.role === 'ADMIN' ? 'Administrador' : 'Docente'}</strong>
      </div>
    </header>
  )
}
