const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const TOKEN_KEY = 'ai-blog-access-token'
const USER_KEY = 'ai-blog-admin-user'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  traceId?: string
  timestamp?: number
}

export interface PageResult<T> {
  page: number
  size: number
  total: number
  records: T[]
}

export class ApiError extends Error {
  code: number
  traceId?: string

  constructor(message: string, code: number, traceId?: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.traceId = traceId
  }
}

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}

export function getStoredUser() {
  const raw = window.localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) as { username: string; nickname?: string; permissions?: string[] } : null
}

export function setStoredUser(user: { username: string; nickname?: string; permissions?: string[] }) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export async function request<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  const token = getToken()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (init.method && init.method.toUpperCase() !== 'GET') {
    headers.set('X-Idempotency-Key', crypto.randomUUID())
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })
  const text = await response.text()
  let payload: Partial<ApiResponse<T>> = {}

  if (text) {
    try {
      payload = JSON.parse(text) as ApiResponse<T>
    } catch {
      payload = { message: text }
    }
  }

  if (!response.ok || payload.code !== 0) {
    if (response.status === 401 || response.status === 403) {
      clearToken()
    }
    throw new ApiError(payload.message || statusMessage(response.status), payload.code || response.status, payload.traceId)
  }

  return payload.data as T
}

function statusMessage(status: number) {
  if (status === 401) return '登录已失效，请重新登录'
  if (status === 403) return '没有操作权限'
  if (status === 404) return '接口不存在'
  if (status >= 500) return '服务端异常'
  return '请求失败'
}
