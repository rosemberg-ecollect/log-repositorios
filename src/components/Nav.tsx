import { useEffect, useState, type ReactNode } from 'react'

import './Nav.css'

type UserSession = {
  login?: string
  name?: string
}

type NavProps = {
  logo?: ReactNode
  brandName?: string
  title?: string
  user?: UserSession | null
  onLogout?: () => void
}

function Nav({ logo, brandName = 'Report Git', title = 'Modulo de versiones', user, onLogout }: NavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const displayName = user?.name || user?.login || 'Usuario'
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U'

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.site-nav__user-menu')) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isMenuOpen])

  return (
    <header className="site-nav">
      <a className="site-nav__brand" href="/" aria-label={brandName}>
        {logo ?? <span className="site-nav__fallback-logo">ecollect</span>}
      </a>
      <span className="site-nav__title">{title}</span>

      {user && onLogout && (
        <div className="site-nav__user-menu">
          <button
            type="button"
            className="site-nav__user-trigger"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span className="site-nav__avatar" aria-hidden="true">{initials}</span>
            <span className="site-nav__user-name">{displayName}</span>
            <span className="site-nav__chevron" aria-hidden="true">▾</span>
          </button>

          {isMenuOpen && (
            <div className="site-nav__dropdown" role="menu" aria-label="Menú de usuario">
              <button
                type="button"
                className="site-nav__logout"
                onClick={() => {
                  setIsMenuOpen(false)
                  onLogout()
                }}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

export default Nav