import { api } from '@/utils/api'

export function useFileAccess(fileId: string, action: 'view' | 'download' = 'view') {
  return api.file.getPresignedUrlMutation.useMutation()
}

export function useFileUpload() {
  return api.file.getPresignedUrlMutation.useMutation()
}

export function useFileDelete() {
  return api.file.deleteFileMutation.useMutation()
}