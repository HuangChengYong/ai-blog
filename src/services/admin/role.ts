import { request } from '../api'

export interface AdminRole {
    id: string
    name: string
    users: number
    description: string
    permissions: string[]
    permissionCodes?: string[]
}

export interface UpdateRoleRequest {
    name: string
    description: string
    permissionCodes: string[]
}

export interface CreateRoleRequest {
    name: string
    description: string
    roleCode: string
    permissionCodes: string[]
}

export const loadAdminRoles = () =>
    request<AdminRole[]>('/admin/roles')

export const getAdminRole = (id: string) =>
    request<AdminRole>(`/admin/roles/${id}`)

export const loadAdminRole = getAdminRole

export const createAdminRole = (data: CreateRoleRequest) =>
    request<AdminRole>('/admin/roles', { method: 'POST', body: JSON.stringify(data) })

export const updateAdminRole = (id: string, data: UpdateRoleRequest) =>
    request<AdminRole>(`/admin/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteAdminRole = (id: string) =>
    request<void>(`/admin/roles/${id}`, { method: 'DELETE' })