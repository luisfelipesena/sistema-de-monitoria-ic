import { api } from '@/utils/api'

export function useFileAccess(_fileId: string, _action: 'view' | 'download' = 'view') {
  return api.file.getPresignedUrlMutation.useMutation()
}

export function useFileUpload() {
  return api.file.getPresignedUrlMutation.useMutation()
}

export function useFileDelete() {
  return api.file.deleteFileMutation.useMutation()
}

export function useEditalPdf() {
  // TODO: Re-enable when generateEditalPdf is implemented
  // return api.edital.generateEditalPdf.useMutation()
  return null as any
}
