import { Link, useLocation } from 'react-router-dom'

type NavItemProps = {
  to: string
  label: string
  match?: (pathname: string) => boolean
  onClick?: () => void
}

export default function NavItem({ to, label, match, onClick }: NavItemProps) {
  const location = useLocation()
  const isActive = match ? match(location.pathname) : location.pathname === to || location.pathname.startsWith(`${to}/`)

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`app-nav-item ${isActive ? 'active' : ''}`}
    >
      <span>{label}</span>
    </Link>
  )
}
