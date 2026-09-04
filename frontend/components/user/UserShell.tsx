'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  CalendarCheck2,
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react'
import SkipLink from '../SkipLink'
import { getCurrentUser } from '../../lib/auth-guard'
import { logoutSession } from '../../lib/auth'
import Button, { buttonVariants } from '../ui/Button'
import { cn } from '../../lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Meus eventos', icon: LayoutDashboard },
  { href: '/events', label: 'Descobrir eventos', icon: Compass },
]

function Brand({ className }: { className?: string }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <CalendarCheck2 className="size-5" aria-hidden="true" />
      </span>
      <span className="truncate text-sm font-bold tracking-tight text-foreground sm:text-base">
        Event-Check
      </span>
    </div>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  const activeHref = NAV_ITEMS.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0]?.href

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Navegação principal">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active = item.href === activeHref
        return (
          <Link
            prefetch
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              active
                ? 'bg-accent text-accent-foreground'
                : 'text-foreground/80 hover:bg-accent/50 hover:text-foreground',
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarContent({
  onNavigate,
  onLogout,
  hideBrand = false,
  showAdminLink = false,
  onAdminNavigate,
}: {
  onNavigate?: () => void
  onLogout: () => void
  hideBrand?: boolean
  showAdminLink?: boolean
  onAdminNavigate?: () => void
}) {
  return (
    <>
      {!hideBrand && (
        <div className="flex h-16 shrink-0 items-center border-b px-4">
          <Brand />
        </div>
      )}
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto space-y-1 border-t p-3">
        {showAdminLink && (
          <Link
            href="/admin/events"
            onClick={onAdminNavigate}
            className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-start gap-3')}
          >
            <ShieldCheck aria-hidden="true" />
            Painel Admin
          </Link>
        )}
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
        >
          <LogOut aria-hidden="true" />
          Sair
        </Button>
      </div>
    </>
  )
}

export default function UserShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLElement>(null)
  const isAdmin = getCurrentUser()?.role === 'admin'

  async function handleLogout() {
    await logoutSession()
    localStorage.removeItem('currentUser')
    localStorage.removeItem('authToken')
    router.push('/login')
  }

  useEffect(() => {
    if (!mobileOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const closeButton = drawerRef.current?.querySelector<HTMLButtonElement>('[data-close-menu]')
    closeButton?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        menuButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [mobileOpen])

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <SkipLink href="#user-main-content">Ir para o conteúdo principal</SkipLink>

      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-card shadow-sm lg:flex"
        aria-label="Menu lateral"
      >
        <SidebarContent onLogout={handleLogout} showAdminLink={isAdmin} />
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-card px-3 pt-safe sm:gap-3 sm:px-4 lg:hidden">
        <Button
          ref={menuButtonRef}
          variant="ghost"
          size="icon"
          className="size-11 shrink-0"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu de navegação"
          aria-expanded={mobileOpen}
          aria-controls="user-mobile-menu"
        >
          <Menu aria-hidden="true" />
        </Button>
        <Brand className="flex-1" />
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside
            ref={drawerRef}
            id="user-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r bg-card shadow-xl"
          >
            <div className="flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
              <Brand className="min-w-0 flex-1" />
              <Button
                variant="ghost"
                size="icon"
                className="size-11 shrink-0"
                data-close-menu
                onClick={() => {
                  setMobileOpen(false)
                  menuButtonRef.current?.focus()
                }}
                aria-label="Fechar menu de navegação"
              >
                <X aria-hidden="true" />
              </Button>
            </div>
            <SidebarContent
              hideBrand
              showAdminLink={isAdmin}
              onNavigate={() => setMobileOpen(false)}
              onAdminNavigate={() => setMobileOpen(false)}
              onLogout={() => {
                setMobileOpen(false)
                void handleLogout()
              }}
            />
          </aside>
        </div>
      )}

      <div className="min-w-0 lg:pl-60">
        <main id="user-main-content" tabIndex={-1} className="min-h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] min-w-0 outline-none lg:min-h-[calc(100dvh-env(safe-area-inset-top,0px))]">
          {children}
        </main>
      </div>
    </div>
  )
}
