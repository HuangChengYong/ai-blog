import { ref } from 'vue'
import { clearToken, getStoredUser, getToken, request, setStoredUser, setToken } from './api'

interface LoginResponse {
  tokenType: string
  accessToken: string
  userId: string
  username: string
  nickname: string
  permissions: string[]
}

interface CurrentUserResponse {
  id: string
  username: string
  nickname: string
  permissions: string[]
}

export const isAuthenticated = ref(Boolean(getToken()))

export function getAdminUsername() {
  return getStoredUser()?.nickname || getStoredUser()?.username || 'admin'
}

export async function login(username: string, password: string) {
  const session = await request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

  setToken(session.accessToken)
  setStoredUser({ username: session.username, nickname: session.nickname, permissions: session.permissions })
  isAuthenticated.value = true
  return true
}

export async function loadCurrentUser() {
  const current = await request<CurrentUserResponse>('/admin/current')
  setStoredUser({ username: current.username, nickname: current.nickname, permissions: current.permissions })
  isAuthenticated.value = true
  return current
}

export function hasPermission(permission: string) {
  const permissions = getStoredUser()?.permissions || []
  return permissions.includes(permission)
}

export async function changePassword(current: string, next: string) {
  await request<void>('/admin/current/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword: current, newPassword: next }),
  })
  return true
}

export function logout() {
  clearToken()
  isAuthenticated.value = false
}
