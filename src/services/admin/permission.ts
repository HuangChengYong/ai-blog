import { request } from '../api'

export interface AdminPermissionItem {
    code: string
    name: string
    description: string
}

export interface AdminPermissionGroup {
    title: string
    items: AdminPermissionItem[]
}

export const loadAdminPermissionGroups = () =>
    request<AdminPermissionGroup[]>('/admin/permissions')