import { request } from '../api'

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

export interface UpdateMenuRequest {
    title: string
    path: string
    permission: string
    order: number
    visible: number
    status: number
}

export const loadAdminMenus = () =>
    request<AdminMenu[]>('/admin/menus')

export const createAdminMenu = (data: UpdateMenuRequest) =>
    request<AdminMenu>('/admin/menus', { method: 'POST', body: JSON.stringify(data) })

export const updateAdminMenu = (id: string, data: UpdateMenuRequest) =>
    request<AdminMenu>(`/admin/menus/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteAdminMenu = (id: string) =>
    request<void>(`/admin/menus/${id}`, { method: 'DELETE' })