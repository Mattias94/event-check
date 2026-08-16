'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  CalendarCheck2,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  LogOut,
  Menu,
  Users,
  X,
} from 'lucide-react'
import AdminProtection from '../../components/AdminProtection'
import { Badge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

const NAV_ITEMS = [
  { href: '/admin/events', label: 'Eventos', icon: CalendarDays },
  { href: '/admin/users', label: 'Usuários', icon: Users },
  { href: '/admin/events/create', label: 'Criar evento', icon: CalendarPlus },
]

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <CalendarCheck2 className="size-5" aria-hidden="true" />
      </span>
      <span className="truncate text-base font-bold tracking-tight text-foreground">
        Event-Check
      </span>
      <Badge variant="secondary">Admin</Badge>
    </div>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  // Destaca apenas o item mais específico (ex.: em /admin/events/create,
  // acende "Criar evento" e não "Eventos").
  const activeHref = NAV_ITEMS
    .filter(item => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Navegação do painel admin">
      {NAV_ITEMS.map(item => {
        const Icon = item.icon
        const active = item.href === activeHref
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            }`}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    localStorage.removeItem('currentUser')
    localStorage.removeItem('authToken')
    router.push('/login')
  }

  const logoutSection = (
    <div className="border-t p-3">
      <Button
        variant="ghost"
        onClick={handleLogout}
        className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
      >
        <LogOut aria-hidden="true" />
        Sair
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar (desktop) — fica recolhida na borda esquerda e desliza
          para dentro quando o mouse passa por cima (ou ao navegar por teclado) */}
      <div className="group fixed inset-y-0 left-0 z-30 hidden lg:block">
        <aside className="flex h-full w-60 -translate-x-[calc(100%-0.875rem)] flex-col border-r bg-card transition-transform duration-300 ease-out group-focus-within:translate-x-0 group-focus-within:shadow-xl group-hover:translate-x-0 group-hover:shadow-xl">
          <div className="flex h-16 items-center border-b px-4">
            <Brand />
          </div>
          <NavLinks />
          {logoutSection}
        </aside>
        {/* Alça visível enquanto a sidebar está recolhida */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 flex w-3.5 items-center justify-center transition-opacity duration-200 group-focus-within:opacity-0 group-hover:opacity-0"
          aria-hidden="true"
        >
          <ChevronRight className="size-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* Header (mobile) */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-card px-4 lg:hidden">
        <Brand />
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu aria-hidden="true" />
        </Button>
      </header>

      {/* Drawer (mobile) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] animate-fade-in flex-col border-r bg-card shadow-lg">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <Brand />
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
              >
                <X aria-hidden="true" />
              </Button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
            {logoutSection}
          </div>
        </div>
      )}

      {/* Conteúdo — ocupa a tela toda; a sidebar recolhida deixa só a alça na borda */}
      <div className="lg:pl-4">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProtection>
      <AdminShell>{children}</AdminShell>
    </AdminProtection>
  )
}
