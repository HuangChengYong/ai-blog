import { ref } from 'vue'
import { clearToken, getStoredUser, getToken, request, setStoredUser, setToken } from './api'

export interface AdminSessionUser {
  id?: string
  username: string
  nickname?: string
  avatarUrl?: string
  roleName?: string
  dataScope?: string
  permissions?: string[]
}

interface LoginResponse {
  tokenType: string
  accessToken: string
  userId: string
  username: string
  nickname: string
  avatarUrl?: string
  roleName?: string
  dataScope?: string
  permissions: string[]
}

interface CurrentUserResponse {
  id: string
  username: string
  nickname: string
  avatarUrl?: string
  roleName?: string
  dataScope?: string
  permissions: string[]
}

export const isAuthenticated = ref(Boolean(getToken()))
export const currentAdminUser = ref<AdminSessionUser | null>(getStoredUser())

export function getAdminUsername() {
  return currentAdminUser.value?.nickname || currentAdminUser.value?.username || 'admin'
}

export function getAdminRoleName() {
  return currentAdminUser.value?.roleName || '未分配角色'
}

export function getAdminAvatarUrl() {
  return currentAdminUser.value?.avatarUrl || ''
}

export function hasAnyPermission() {
  return Boolean(currentAdminUser.value?.permissions?.length)
}

export async function login(username: string, password: string) {
  const session = await request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

  setToken(session.accessToken)
  persistUser({
    id: session.userId,
    username: session.username,
    nickname: session.nickname,
    avatarUrl: session.avatarUrl,
    roleName: session.roleName,
    dataScope: session.dataScope,
    permissions: session.permissions,
  })
  isAuthenticated.value = true
  return true
}

export async function loadCurrentUser() {
  const current = await request<CurrentUserResponse>('/admin/current')
  persistUser({
    id: current.id,
    username: current.username,
    nickname: current.nickname,
    avatarUrl: current.avatarUrl,
    roleName: current.roleName,
    dataScope: current.dataScope,
    permissions: current.permissions,
  })
  isAuthenticated.value = true
  return current
}

export function hasPermission(permission: string) {
  const permissions = currentAdminUser.value?.permissions || []
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
  currentAdminUser.value = null
  isAuthenticated.value = false
}

function persistUser(user: AdminSessionUser) {
  setStoredUser(user)
  currentAdminUser.value = user
}
