import { z } from 'zod'

// ========================================
// ONBOARDING TYPES
// ========================================

export interface OnboardingStatus {
  pending: boolean
  profile: {
    exists: boolean
    type: 'student' | 'professor' | 'admin'
  }
  documents: {
    required: string[]
    uploaded: string[]
    missing: string[]
  }
  signature?: {
    configured: boolean
  }
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const onboardingStatusResponseSchema = z.object({
  pending: z.boolean(),
  profile: z.object({
    exists: z.boolean(),
    type: z.enum(['student', 'professor', 'admin']),
  }),
  documents: z.object({
    required: z.array(z.string()),
    uploaded: z.array(z.string()),
    missing: z.array(z.string()),
  }),
  signature: z
    .object({
      configured: z.boolean(),
    })
    .optional(),
})

export type OnboardingStatusResponse = z.infer<typeof onboardingStatusResponseSchema>
