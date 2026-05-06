import { request } from '../api'

export interface AdminStudioOptions {
    styles: string[]
    lengths: string[]
    tags: string[]
}

export const loadAdminStudioOptions = () =>
    request<AdminStudioOptions>('/admin/studio/options')