'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTheme(readTheme())
    setMounted(true)
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    if (next === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    try {
      localStorage.setItem('wf-theme', next)
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label={mounted ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : 'Toggle theme'}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--surface-2)] transition-colors"
    >
      {mounted && theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="flex-1 text-left">
        {mounted ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : 'Theme'}
      </span>
    </button>
  )
}
