import { request } from '../api'

export interface AdminUser {
    id: string
    name: string
    role: string
    status: string
    scope: string
    lastSeen: string
}

export interface UpdateUserRequest {
    username: string
    password?: string
    roleId: string
    dataScope: string
}

export const loadAdminUsers = () =>
    request<AdminUser[]>('/admin/users')

export const createAdminUser = (data: UpdateUserRequest) =>
    request<void>('/admin/users', { method: 'POST', body: JSON.stringify(data) })

export const updateAdminUser = (id: string, data: UpdateUserRequest) =>
    request<void>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteAdminUser = (id: string) =>
    request<void>(`/admin/users/${id}`, { method: 'DELETE' })

export const toggleUserStatus = (id: string, status: number) =>
    request<void>(`/admin/users/${id}/status?status=${status}`, { method: 'PUT' })