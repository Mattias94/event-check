/**
 * Cliente HTTP para a API do backend (NestJS).
 * Centraliza a URL base, tratamento de erros e parsing de resposta.
 */

const PRODUCTION_API_URL = 'https://event-check-backend.vercel.app/api'
const LOCAL_API_URL = 'http://localhost:3001/api'

function resolveApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return LOCAL_API_URL
    }
    return PRODUCTION_API_URL
  }

  return PRODUCTION_API_URL
}

/** Token de sessão (JWT) emitido pelo backend no login/registro. */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('authToken')
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken()
  const apiUrl = resolveApiUrl()

  let response: Response
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...options,
      // Auth via Bearer no header; omit evita bloqueio cross-site no Safari mobile
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    })
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.')
  }

  if (!response.ok) {
    let message = `Erro na requisição (${response.status})`
    try {
      const body = await response.json()
      if (body?.message) {
        message = Array.isArray(body.message) ? body.message.join(', ') : body.message
      }
    } catch {
      // resposta sem corpo JSON, mantém mensagem padrão
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

function buildQuery(params: Record<string, string | undefined>): string {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value)
  })
  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  buildQuery,
}
