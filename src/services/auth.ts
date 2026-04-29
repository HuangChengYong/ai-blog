import { ref } from 'vue'

const AUTH_KEY = 'ai-blog-admin-session'
const PASSWORD_KEY = 'ai-blog-admin-password'
const ADMIN_USERNAME = 'admin'
const DEFAULT_ADMIN_PASSWORD = 'huangcy125643'

export const isAuthenticated = ref(window.localStorage.getItem(AUTH_KEY) === 'active')

function currentPassword() {
  return window.localStorage.getItem(PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD
}

export function getAdminUsername() {
  return ADMIN_USERNAME
}

export function login(username: string, password: string) {
  const passed = username === ADMIN_USERNAME && password === currentPassword()

  if (passed) {
    window.localStorage.setItem(AUTH_KEY, 'active')
    isAuthenticated.value = true
  }

  return passed
}

export function changePassword(current: string, next: string) {
  if (current !== currentPassword()) {
    return false
  }

  window.localStorage.setItem(PASSWORD_KEY, next)
  return true
}

export function logout() {
  window.localStorage.removeItem(AUTH_KEY)
  isAuthenticated.value = false
}
