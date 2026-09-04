'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import LoadingState from '../../../../components/LoadingState'
import EmptyState from '../../../../components/EmptyState'
import Input from '../../../../components/ui/Input'
import { Card } from '../../../../components/ui/Card'
import { Badge } from '../../../../components/ui/Badge'
import { cn } from '../../../../lib/utils'
import { getAllUniqueUserIds, getUserEnrollmentStats, searchUsers, EnrolledUserSummary } from '../../../../lib/events'

interface UserEnrollment {
  eventId: string
  eventTitle: string
  enrolledAt: string
  eventStatus: string
  eventDate: string
  eventTime: string
}

interface UserDetail {
  userId: string
  userName: string
  userEmail: string
  totalEnrollments: number
  enrollments: UserEnrollment[]
}

function enrollmentStatusLabel(status: string): string {
  if (status === 'active') return 'Ativo'
  if (status === 'cancelled') return 'Cancelado'
  if (status === 'finished') return 'Finalizado'
  return 'Deletado'
}

export default function AdminUsersPage() {
  const searchInputId = useId()
  const userListId = useId()
  const [allUsers, setAllUsers] = useState<EnrolledUserSummary[]>([])
  const [filteredUsers, setFilteredUsers] = useState<EnrolledUserSummary[]>([])
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    const isInitialLoad = !hasLoadedRef.current
    if (isInitialLoad) setLoading(true)
    try {
      const users = await getAllUniqueUserIds()
      setAllUsers(users)
      setFilteredUsers(users)
      setSelectedUser(null)
      setSearchQuery('')
      hasLoadedRef.current = true
    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
    } finally {
      if (isInitialLoad) setLoading(false)
    }
  }

  async function handleSearch(query: string) {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredUsers(allUsers)
      setSelectedUser(null)
    } else {
      const results = await searchUsers(query)
      setFilteredUsers(results)
      setSelectedUser(null)
    }
  }

  async function handleSelectUser(user: EnrolledUserSummary) {
    const stats = await getUserEnrollmentStats(user.id)
    setSelectedUser({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      totalEnrollments: stats.totalEnrollments,
      enrollments: stats.enrollments,
    })
  }

  if (loading) return <LoadingState />

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      {/* Cabeçalho da página */}
      <div className="mb-6 md:mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Pesquisar Usuários
          </h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Visualize inscrições e histórico de eventos
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Search Panel */}
          <section aria-labelledby="users-search-heading" className="lg:col-span-1">
            <Card className="sticky top-16 p-4 md:p-6 lg:top-4">
              <h2 id="users-search-heading" className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Search className="size-5" aria-hidden="true" />
                Pesquisar
              </h2>

              <Input
                id={searchInputId}
                name="userSearch"
                type="search"
                label="Nome ou e-mail"
                placeholder="Digite o nome ou e-mail do usuário"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoComplete="off"
                icon={<Search />}
              />

              <ul
                id={userListId}
                aria-label="Resultados da pesquisa de usuários"
                className="mt-4 max-h-96 space-y-2 overflow-y-auto"
              >
                {filteredUsers.length === 0 ? (
                  <li className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum usuário encontrado
                  </li>
                ) : (
                  filteredUsers.map(user => {
                    const selected = selectedUser?.userId === user.id
                    return (
                    <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      aria-pressed={selected}
                      aria-label={`${user.name}, ${user.email}`}
                      className={cn(
                        'w-full rounded-md px-3 py-2.5 text-left transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                        selected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                      )}
                    >
                      <div className="truncate text-sm font-medium">{user.name}</div>
                      <div className={cn(
                        'truncate text-xs',
                        selected ? 'text-primary-foreground/85' : 'text-muted-foreground',
                      )}>
                        {user.email}
                      </div>
                    </button>
                    </li>
                    )
                  })
                )}
              </ul>

              <p className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                Total de usuários:{' '}
                <span className="font-semibold text-foreground">{allUsers.length}</span>
              </p>
            </Card>
          </section>

          {/* Details Panel */}
          <section aria-labelledby="users-detail-heading" className="lg:col-span-2">
            <h2 id="users-detail-heading" className="sr-only">
              Detalhes do usuário selecionado
            </h2>
            {!selectedUser ? (
              <EmptyState
                message="Selecione um usuário para ver seus eventos"
                icon="👤"
              />
            ) : (
              <Card className="p-4 md:p-6">
                <header className="mb-6 min-w-0">
                  <h3 className="truncate text-2xl font-bold text-foreground">
                    {selectedUser.userName}
                  </h3>
                  <p className="mt-1 truncate text-muted-foreground">
                    {selectedUser.userEmail}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Total de inscrições:{' '}
                    <span className="font-semibold text-foreground">{selectedUser.totalEnrollments}</span>
                  </p>
                </header>

                {selectedUser.totalEnrollments === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    Este usuário não está inscrito em nenhum evento
                  </p>
                ) : (
                  <ul className="space-y-3" aria-label="Eventos inscritos">
                    {selectedUser.enrollments.map((enrollment) => (
                      <li
                        key={`${enrollment.eventId}-${enrollment.enrolledAt}`}
                        className="rounded-lg border border-border p-4 transition-shadow hover:shadow-md"
                      >
                        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                          <h4 className="min-w-0 flex-1 font-semibold text-foreground line-clamp-2">
                            {enrollment.eventTitle}
                          </h4>
                          <Badge
                            className="shrink-0"
                            variant={
                              enrollment.eventStatus === 'active'
                                ? 'success'
                                : enrollment.eventStatus === 'cancelled'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {enrollmentStatusLabel(enrollment.eventStatus)}
                          </Badge>
                        </div>

                        <dl className="space-y-1 text-sm text-muted-foreground">
                          <div>
                            <dt className="sr-only">Data do evento</dt>
                            <dd>
                              {new Date(enrollment.eventDate).toLocaleDateString('pt-BR')} às{' '}
                              {enrollment.eventTime}
                            </dd>
                          </div>
                          <div>
                            <dt className="sr-only">Data da inscrição</dt>
                            <dd className="text-xs">
                              Inscrito em:{' '}
                              {new Date(enrollment.enrolledAt).toLocaleDateString('pt-BR', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </dd>
                          </div>
                        </dl>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
          </section>
        </div>
    </div>
  )
}
