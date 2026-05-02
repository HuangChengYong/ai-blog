import { request } from './api'

export interface AdminMetric {
  label: string
  value: number
}

export interface AdminOverview {
  stats: AdminMetric[]
  publishHealth: number
  healthText: string
}

export interface AdminStudioOptions {
  styles: string[]
  lengths: string[]
  tags: string[]
}

export interface AdminUser {
  id: string
  name: string
  role: string
  status: string
  scope: string
  lastSeen: string
}

export interface AdminRole {
  id: string
  name: string
  users: number
  description: string
  permissions: string[]
}

export interface AdminPermissionItem {
  code: string
  name: string
  description: string
}

export interface AdminPermissionGroup {
  title: string
  items: AdminPermissionItem[]
}

export interface AdminMenu {
  id: string
  title: string
  path: string
  permission: string
  order: number
  visible: boolean
  status: 'enabled' | 'disabled'
  system: boolean
}

export function loadAdminOverview() {
  return request<AdminOverview>('/admin/dashboard/overview')
}

export function loadAdminStudioOptions() {
  return request<AdminStudioOptions>('/admin/studio/options')
}

export function loadAdminUsers() {
  return request<AdminUser[]>('/admin/users')
}

export function loadAdminRoles() {
  return request<AdminRole[]>('/admin/roles')
}

export function loadAdminPermissionGroups() {
  return request<AdminPermissionGroup[]>('/admin/permissions')
}

export function loadAdminMenus() {
  return request<AdminMenu[]>('/admin/menus')
}
