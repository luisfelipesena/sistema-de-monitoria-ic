import { db } from '@/server/db'
import { ensurePngDataUrl } from '@/server/lib/image-utils'
import { createSignatureRepository } from './signature-repository'

export const createSignatureService = (database: typeof db) => {
  const signatureRepository = createSignatureRepository(database)

  return {
    async getDefaultSignature(userId: number) {
      const user = await signatureRepository.getDefaultSignature(userId)

      if (!user?.assinaturaDefault) {
        return null
      }

      return {
        signatureData: user.assinaturaDefault,
        dataAssinatura: user.dataAssinaturaDefault || new Date(),
      }
    },

    async saveDefaultSignature(userId: number, signatureData: string) {
      const normalizedData = await ensurePngDataUrl(signatureData)
      await signatureRepository.saveDefaultSignature(userId, normalizedData)
      return { success: true }
    },

    async deleteDefaultSignature(userId: number) {
      await signatureRepository.deleteDefaultSignature(userId)
      return { success: true }
    },
  }
}

export const signatureService = createSignatureService(db)
