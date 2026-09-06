import type { ReactNode } from 'react'

import './Nav.css'

type NavProps = {
  logo?: ReactNode
  brandName?: string
  title?: string
}

function Nav({ logo, brandName = 'Report Git', title = 'Modulo de versiones' }: NavProps) {
  return (
    <header className="site-nav">
      <a className="site-nav__brand" href="/" aria-label={brandName}>
        {logo ?? <span className="site-nav__fallback-logo">ecollect</span>}
      </a>
      <span className="site-nav__title">{title}</span>
    </header>
  )
}

export default Nav