'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Workflow,
  Sparkles,
  LogOut,
  Bell,
  Search,
  Settings,
  Zap,
  Menu,
} from 'lucide-react'
import { clearAuth, loadAuth } from '@/lib/auth'
import { disconnectSocket } from '@/lib/socket'
import { cn } from '@/lib/utils'
import { useUsage } from '@/hooks/useUsage'
import { SettingsModal } from './SettingsModal'
import { ThemeToggle } from './ThemeToggle'

interface ShellProps {
  children: ReactNode
  title?: string
  subtitle?: string
  actions?: ReactNode
}

export function AppShell({ children, title, subtitle, actions }: ShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr] bg-[color:var(--background)]">
      <div className="hidden lg:block">
        <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
      </div>
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-[280px] lg:hidden">
            <Sidebar
              onNavigate={() => setDrawerOpen(false)}
              onOpenSettings={() => {
                setDrawerOpen(false)
                setSettingsOpen(true)
              }}
            />
          </div>
        </>
      )}
      <div className="flex flex-col min-h-0">
        {(title || actions) && (
          <TopBar
            title={title}
            subtitle={subtitle}
            actions={actions}
            onMenu={() => setDrawerOpen(true)}
          />
        )}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

function Sidebar({
  onNavigate,
  onOpenSettings,
}: {
  onNavigate?: () => void
  onOpenSettings: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const auth = typeof window !== 'undefined' ? loadAuth() : null

  function onLogout() {
    clearAuth()
    disconnectSocket()
    router.push('/login')
  }

  const initials = (auth?.user.email ?? '?').slice(0, 2).toUpperCase()

  return (
    <aside className="h-screen lg:sticky lg:top-0 flex flex-col bg-[color:var(--surface)] border-r border-[color:var(--border)] p-4">
      <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)]">
        <div className="h-9 w-9 rounded-full bg-[color:var(--accent)] grid place-items-center text-[color:var(--accent-fg)] text-xs font-semibold">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">
            {auth?.user.email?.split('@')[0] ?? 'User'}
          </div>
          <div className="text-[11px] text-[color:var(--muted)] truncate">
            @{auth?.user.email?.split('@')[0] ?? 'guest'}
          </div>
        </div>
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[rgb(var(--brand-rgb)/0.12)] border border-[rgb(var(--brand-rgb)/0.3)] text-[color:var(--brand)]">
          Pro
        </span>
      </div>

      <div className="mt-6 px-2 text-[11px] font-medium tracking-wider text-[color:var(--muted-2)]">
        MENU
      </div>
      <nav className="mt-2 space-y-1">
        <NavItem
          href="/dashboard"
          icon={<LayoutDashboard className="h-4 w-4" />}
          label="Dashboard"
          active={pathname === '/dashboard'}
          onNavigate={onNavigate}
        />
        <NavItem
          href="/dashboard#workflows"
          icon={<Workflow className="h-4 w-4" />}
          label="Workflows"
          active={pathname.startsWith('/workflows')}
          onNavigate={() => {
            onNavigate?.()
            if (pathname === '/dashboard') {
              document
                .getElementById('workflows')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }}
        />
      </nav>

      <div className="mt-6 px-2 text-[11px] font-medium tracking-wider text-[color:var(--muted-2)]">
        ACCOUNT
      </div>
      <nav className="mt-2 space-y-1">
        <NavButton
          icon={<Settings className="h-4 w-4" />}
          label="Settings"
          onClick={onOpenSettings}
        />
        <ThemeToggle />
      </nav>

      <div className="mt-auto">
        <div className="relative rounded-2xl border border-[rgb(var(--brand-rgb)/0.25)] bg-gradient-to-br from-[rgb(var(--brand-rgb)/0.1)] to-[color:var(--surface)] p-4 overflow-hidden">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[rgb(var(--brand-rgb)/0.2)] blur-2xl" />
          <div className="relative">
            <div className="h-8 w-8 rounded-lg bg-[rgb(var(--brand-rgb)/0.15)] border border-[rgb(var(--brand-rgb)/0.25)] grid place-items-center mb-3">
              <Sparkles className="h-4 w-4 text-[color:var(--brand)]" />
            </div>
            <div className="text-[11px] text-[color:var(--muted)] mb-1">new era</div>
            <div className="text-sm font-medium leading-tight">
              Your AI <span className="text-[color:var(--muted)]">friend</span>
              <br /> in workflows
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--surface-2)] transition-colors"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </aside>
  )
}

function NavButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--surface-2)] transition-colors"
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
    </button>
  )
}

function NavItem({
  href,
  icon,
  label,
  active,
  badge,
  onNavigate,
}: {
  href: string
  icon: ReactNode
  label: string
  active?: boolean
  badge?: string
  onNavigate?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors',
        active
          ? 'bg-[color:var(--surface-2)] text-[color:var(--foreground)] border border-[color:var(--border)]'
          : 'text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--surface-2)]',
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[color:var(--surface-3)] text-[color:var(--muted)]">
          {badge}
        </span>
      )}
    </Link>
  )
}

function TopBar({
  title,
  subtitle,
  actions,
  onMenu,
}: {
  title?: string
  subtitle?: string
  actions?: ReactNode
  onMenu?: () => void
}) {
  const [query, setQuery] = useState('')
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 lg:py-5 gap-3 lg:gap-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenu}
          aria-label="Open menu"
          className="lg:hidden h-10 w-10 shrink-0 grid place-items-center rounded-xl bg-[color:var(--surface)] border border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          {subtitle && (
            <div className="text-xs text-[color:var(--muted)] mb-1">{subtitle}</div>
          )}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight truncate">
            {title}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:block">
          <UsagePill />
        </div>
        <div className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl bg-[color:var(--surface)] border border-[color:var(--border)] w-60">
          <Search className="h-4 w-4 text-[color:var(--muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-[color:var(--muted-2)]"
          />
        </div>
        <button className="hidden sm:grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--surface)] border border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors">
          <Bell className="h-4 w-4" />
        </button>
        {actions}
      </div>
    </header>
  )
}

function UsagePill() {
  const { data } = useUsage()
  if (!data) return null
  if (data.plan !== 'trial') {
    return (
      <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-[color:var(--success)]/30 bg-[color:var(--success)]/10 text-[color:var(--success)]">
        {data.plan}
      </span>
    )
  }
  const aiLeft = Math.max(0, data.aiCallLimit - data.aiCallsUsed)
  const runsLeft = Math.max(0, data.testRunLimit - data.testRunsUsed)
  const low = aiLeft <= 1 || runsLeft === 0
  return (
    <div
      className={cn(
        'flex items-center gap-3 h-10 px-3 rounded-xl border bg-[color:var(--surface)] text-xs',
        low
          ? 'border-[color:var(--warning)]/40 text-[color:var(--warning)]'
          : 'border-[color:var(--border)] text-[color:var(--muted)]',
      )}
      title="Free trial usage"
    >
      <span className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5" />
        {data.aiCallsUsed}/{data.aiCallLimit}
      </span>
      <span className="h-3 w-px bg-[color:var(--border)]" />
      <span className="flex items-center gap-1.5">
        <Zap className="h-3.5 w-3.5" />
        {data.testRunsUsed}/{data.testRunLimit}
      </span>
    </div>
  )
}

export function PrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'h-10 px-4 rounded-xl bg-[color:var(--accent)] text-[color:var(--accent-fg)] text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center gap-2',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'h-10 px-4 rounded-xl bg-[color:var(--surface)] border border-[color:var(--border)] text-sm text-[color:var(--foreground)] hover:bg-[color:var(--surface-2)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
