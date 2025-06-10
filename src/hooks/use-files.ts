import { api } from '@/utils/api'

export function useFileAccess(fileId: string) {
  const { data, isLoading, error } = api.files.getFileMetadata.useQuery(
    { fileId },
    { enabled: !!fileId }
  )
  
  return {
    data,
    isLoading,
    error,
  }
}