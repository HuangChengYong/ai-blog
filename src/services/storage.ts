import { request } from './api'

export interface StorageObject {
  id: string
  providerCode: string
  bucketName: string
  objectKey: string
  originalName: string
  contentType: string
  sizeBytes: number
  publicUrl: string
}

export function uploadStorageObject(file: File) {
  const form = new FormData()
  form.append('file', file)
  return request<StorageObject>('/admin/storage/objects', {
    method: 'POST',
    body: form,
  })
}
