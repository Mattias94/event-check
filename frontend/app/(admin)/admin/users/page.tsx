'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import LoadingState from '../../../../components/LoadingState'
import Button from '../../../../components/ui/Button'
import EmptyState from '../../../../components/EmptyState'
import { getAllUniqueUserIds, getUserEnrollmentStats, searchUsers, EnrolledUserSummary } from '../../../../lib/events'
import { getCurrentUserId, requireAdmin } from '../../../../lib/auth-guard'

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

export default function AdminUsersPage() {
  const router = useRouter()
  const [allUsers, setAllUsers] = useState<EnrolledUserSummary[]>([])
  const [filteredUsers, setFilteredUsers] = useState<EnrolledUserSummary[]>([])
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      const users = await getAllUniqueUserIds()
      setAllUsers(users)
      setFilteredUsers(users)
      setSelectedUser(null)
      setSearchQuery('')
    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
    } finally {
      setLoading(false)
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between md:mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Pesquisar Usuários
          </h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Visualize inscrições e histórico de eventos
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/events')}
          className="w-full shrink-0 sm:w-auto"
        >
          <ArrowLeft aria-hidden="true" />
          Voltar para Meus Eventos
        </Button>
      </div>

      {/* Main Content */}
      <main>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Panel */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                🔍 Pesquisar
              </h2>

              <input
                type="text"
                placeholder="Digite o nome ou e-mail do usuário"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 mb-4"
              />

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-8">
                    Nenhum usuário encontrado
                  </p>
                ) : (
                  filteredUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={`w-full text-left px-3 py-2 rounded-md transition ${
                        selectedUser?.userId === user.id
                          ? 'bg-slate-900 dark:bg-slate-700 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <div className="text-sm font-medium truncate">{user.name}</div>
                      <div className={`text-xs truncate ${
                        selectedUser?.userId === user.id
                          ? 'text-slate-300'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {user.email}
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="mt-4 p-3 rounded-md bg-slate-100 dark:bg-slate-700 text-sm">
                <p className="text-slate-600 dark:text-slate-400">
                  Total de usuários: <span className="font-semibold text-slate-900 dark:text-white">{allUsers.length}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-2">
            {!selectedUser ? (
              <EmptyState
                message="Selecione um usuário para ver seus eventos"
                icon="👤"
              />
            ) : (
              <div className="card p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {selectedUser.userName}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    {selectedUser.userEmail}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Total de inscrições: <span className="font-semibold">{selectedUser.totalEnrollments}</span>
                  </p>
                </div>

                {selectedUser.totalEnrollments === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-slate-600 dark:text-slate-400">
                      Este usuário não está inscrito em nenhum evento
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedUser.enrollments.map((enrollment, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {enrollment.eventTitle}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              enrollment.eventStatus === 'active'
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                                : enrollment.eventStatus === 'cancelled'
                                ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                                : enrollment.eventStatus === 'finished'
                                ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {enrollment.eventStatus === 'active'
                              ? '🟢 Ativo'
                              : enrollment.eventStatus === 'cancelled'
                              ? '🔴 Cancelado'
                              : enrollment.eventStatus === 'finished'
                              ? '⚫ Finalizado'
                              : '❌ Deletado'}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                          <p>
                            📅{' '}
                            {new Date(enrollment.eventDate).toLocaleDateString('pt-BR')} às{' '}
                            {enrollment.eventTime}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            Inscrito em:{' '}
                            {new Date(enrollment.enrolledAt).toLocaleDateString('pt-BR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
