'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingState from '../../../../components/LoadingState'
import EmptyState from '../../../../components/EmptyState'
import { getAllUniqueUserIds, getUserEnrollmentStats, searchUsers } from '../../../../lib/events'
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
  totalEnrollments: number
  enrollments: UserEnrollment[]
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [allUsers, setAllUsers] = useState<string[]>([])
  const [filteredUsers, setFilteredUsers] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userId = getCurrentUserId()
    if (!userId) {
      router.push('/login')
      return
    }

    if (!requireAdmin(router)) {
      return
    }

    loadUsers()
  }, [router])

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

  async function handleSelectUser(userId: string) {
    const stats = await getUserEnrollmentStats(userId)
    setSelectedUser({
      userId,
      totalEnrollments: stats.totalEnrollments,
      enrollments: stats.enrollments,
    })
  }

  if (loading) return <LoadingState />

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Pesquisar Usuários</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Visualize inscrições e histórico de eventos
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/admin/events')}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-medium transition"
              >
                ← Voltar para Eventos
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Panel */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                🔍 Pesquisar
              </h2>

              <input
                type="text"
                placeholder="Digite o ID ou email do usuário"
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
                  filteredUsers.map(userId => (
                    <button
                      key={userId}
                      onClick={() => handleSelectUser(userId)}
                      className={`w-full text-left px-3 py-2 rounded-md transition ${
                        selectedUser?.userId === userId
                          ? 'bg-slate-900 dark:bg-slate-700 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <div className="text-sm font-medium truncate">{userId}</div>
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
                    {selectedUser.userId}
                  </h2>
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
