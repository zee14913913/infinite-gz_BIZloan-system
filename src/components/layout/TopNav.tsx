'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/banks',     label: 'Products' },
  { href: '/cases',     label: 'Cases' },
  { href: '/evidence',  label: 'Evidence' },
]

export function TopNav() {
  const pathname = usePathname()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <nav className="top-nav">
      <Link href="/dashboard" className="brand">BCIS</Link>
      <div style={{ flex: 1, display: 'flex', gap: 24, alignItems: 'center' }}>
        {NAV_LINKS.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`nav-link${pathname.startsWith(l.href) ? ' active' : ''}`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <button
        onClick={toggleTheme}
        style={{
          background: 'transparent', border: '1px solid var(--color-border-medium)',
          borderRadius: 'var(--radius-full)', padding: '6px 14px',
          color: 'var(--color-text-muted)', fontSize: 12, cursor: 'pointer',
          fontFamily: 'var(--font-playfair)', textTransform: 'uppercase', letterSpacing: '0.04em',
        }}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </nav>
  )
}
