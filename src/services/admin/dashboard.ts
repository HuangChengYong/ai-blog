import { request } from '../api'

export interface AdminMetric {
    label: string
    value: number
}

export interface AdminOverview {
    stats: AdminMetric[]
    publishHealth: number
    healthText: string
}

export const loadAdminOverview = () =>
    request<AdminOverview>('/admin/dashboard/overview')