import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import { professorInvitationTable, sessionTable, userTable } from '@/server/db/schema'
import { UserRole } from '@/types/enums'
import { env } from '@/utils/env'
import axios from 'axios'
import { randomUUID } from 'crypto'
import { and, eq } from 'drizzle-orm'
import { XMLParser } from 'fast-xml-parser'
import { sign, verify } from 'jsonwebtoken'
import { z } from 'zod'

// List of admin emails
const ADMIN_EMAILS = ['luis.sena@ufba.br', 'joao.leahy@ufba.br', 'antoniels@ufba.br', 'caioviana@ufba.br']

// Create session helper function
async function createSession(userId: number, role: UserRole, db: any) {
  const sessionId = randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30) // 30 days expiration

  await db.insert(sessionTable).values({
    id: sessionId,
    userId,
    expiresAt,
  })

  // Create JWT token for API authentication
  const token = sign(
    {
      userId,
      sessionId,
      role,
    },
    env.JWT_SECRET,
    { expiresIn: '30d' }
  )

  return { sessionId, token }
}

export const authRouter = createTRPCRouter({
  // Get current user information
  me: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/auth/me',
        tags: ['auth'],
        summary: 'Get current user information',
        description: 'Retrieve information about the currently authenticated user',
      },
    })
    .input(z.void())
    .output(
      z
        .object({
          id: z.number(),
          username: z.string(),
          email: z.string(),
          role: z.nativeEnum(UserRole),
          assinaturaDefault: z.string().nullable(),
        })
        .nullable()
    )
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        return null
      }

      const user = await ctx.db.query.userTable.findFirst({
        where: eq(userTable.id, ctx.user.id),
      })

      if (!user) {
        return null
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role as UserRole,
        assinaturaDefault: user.assinaturaDefault,
      }
    }),

  // CAS Login (starts the CAS auth flow)
  casLogin: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/auth/cas-login',
        tags: ['auth'],
        summary: 'Initiate CAS login flow',
        description: 'Start the CAS authentication flow for UFBA users',
      },
    })
    .input(z.void())
    .output(
      z.object({
        redirectUrl: z.string().url(),
      })
    )
    .query(async () => {
      console.log('tRPC auth.casLogin: Generating CAS login URL.')
      const serverUrl = new URL(env.SERVER_URL)
      const serviceUrl = `${serverUrl.origin}/api/auth/cas-callback`
      const casLoginUrl = `${env.CAS_SERVER_URL_PREFIX}/login?service=${encodeURIComponent(serviceUrl)}`

      console.log('tRPC auth.casLogin: Service URL for callback:', serviceUrl)
      return {
        redirectUrl: casLoginUrl,
      }
    }),

  // CAS Callback (handles the CAS response)
  casCallback: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/auth/cas-callback',
        tags: ['auth'],
        summary: 'Handle CAS callback',
        description: 'Process the CAS authentication callback with ticket validation',
      },
    })
    .input(
      z.object({
        ticket: z.string(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        redirectUrl: z.string(),
        token: z.string().optional(),
        error: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { ticket } = input
        const serverUrl = new URL(env.SERVER_URL)
        const serviceUrl = `${serverUrl.origin}/api/auth/cas-callback`
        const validationUrl = `${env.CAS_SERVER_URL_PREFIX}/serviceValidate?ticket=${ticket}&service=${encodeURIComponent(
          serviceUrl
        )}`
        const response = await axios.get(validationUrl)
        const xmlData = response.data
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '',
        })
        const result = parser.parse(xmlData)
        if (!result['cas:serviceResponse'] || !result['cas:serviceResponse']['cas:authenticationSuccess']) {
          const failureMessage =
            result['cas:serviceResponse']?.['cas:authenticationFailure']?.['#text'] || 'Authentication failed'
          return {
            success: false,
            redirectUrl: '/auth/login',
            error: `cas-error: ${failureMessage}`,
          }
        }
        const authSuccess = result['cas:serviceResponse']['cas:authenticationSuccess']
        const username = authSuccess['cas:user']
        const attributes = authSuccess['cas:attributes'] || {}
        const email = attributes['cas:mail'] || `${username}@ufba.br`
        let user = await ctx.db.query.userTable.findFirst({
          where: eq(userTable.username, username),
        })
        if (user) {
          if (ADMIN_EMAILS.includes(user.email) && user.role !== UserRole.ADMIN) {
            await ctx.db.update(userTable).set({ role: UserRole.ADMIN }).where(eq(userTable.id, user.id))
            user = await ctx.db.query.userTable.findFirst({ where: eq(userTable.id, user.id) })
          }
        } else {
          try {
            const [newUser] = await ctx.db
              .insert(userTable)
              .values({ username, email, role: UserRole.STUDENT })
              .returning()
            user = newUser
          } catch (error) {
            console.error('Error creating new user:', error)
            throw new Error('Failed to create user account')
          }
        }
        if (!user) {
          return {
            success: false,
            redirectUrl: '/auth/login',
            error: 'Failed to create or find user',
          }
        }
        const sessionResult = await createSession(user.id, user.role as UserRole, ctx.db)
        return {
          success: true,
          redirectUrl: '/dashboard',
          token: sessionResult.token,
        }
      } catch (error) {
        console.error('CAS callback error:', error)
        return {
          success: false,
          redirectUrl: '/auth/login',
          error: 'server-error',
        }
      }
    }),

  // Verify JWT token
  verifyToken: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/auth/verify-token',
        tags: ['auth'],
        summary: 'Verify JWT token',
        description: 'Verify a JWT token and return user information',
      },
    })
    .input(
      z.object({
        token: z.string(),
      })
    )
    .output(
      z.object({
        valid: z.boolean(),
        user: z
          .object({
            id: z.number(),
            username: z.string(),
            email: z.string(),
            role: z.nativeEnum(UserRole),
          })
          .optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify the JWT token
        const payload = verify(input.token, env.JWT_SECRET) as {
          userId: number
          sessionId: string
        }

        // Get the user from the database
        const user = await ctx.db.query.userTable.findFirst({
          where: eq(userTable.id, payload.userId),
        })

        if (!user) {
          return {
            valid: false,
            error: 'User not found',
          }
        }

        // Verify the session exists and is valid
        const session = await ctx.db.query.sessionTable.findFirst({
          where: and(eq(sessionTable.id, payload.sessionId), eq(sessionTable.userId, payload.userId)),
        })

        if (!session) {
          return {
            valid: false,
            error: 'Session not found',
          }
        }

        // Check if session is expired
        if (new Date() > session.expiresAt) {
          return {
            valid: false,
            error: 'Session expired',
          }
        }

        return {
          valid: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role as UserRole,
          },
        }
      } catch (_error) {
        // Any error with the token verification should return invalid
        return {
          valid: false,
          error: 'Invalid token',
        }
      }
    }),

  // Logout
  logout: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/auth/logout',
        tags: ['auth'],
        summary: 'Logout user',
        description: 'End the current user session',
      },
    })
    .input(z.void())
    .output(
      z.object({
        success: z.boolean(),
      })
    )
    .mutation(async ({ ctx }) => {
      if (!ctx.user) {
        return { success: true }
      }

      await ctx.db.delete(sessionTable).where(eq(sessionTable.userId, ctx.user.id))

      return { success: true }
    }),

  // Verify professor invitation token
  verifyInvitation: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/auth/verify-invitation',
        tags: ['auth'],
        summary: 'Verify invitation token',
        description: 'Check if a professor invitation token is valid for onboarding.',
      },
    })
    .input(
      z.object({
        token: z.string(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        email: z.string().email().optional(),
        error: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!input.token) {
        return { success: false, error: 'Token não fornecido.' }
      }

      const invitation = await ctx.db.query.professorInvitationTable.findFirst({
        where: eq(professorInvitationTable.token, input.token),
      })

      if (!invitation) {
        return { success: false, error: 'Convite não encontrado.' }
      }

      if (invitation.status !== 'PENDING') {
        return { success: false, error: `Este convite já foi ${invitation.status.toLowerCase()}.` }
      }

      if (invitation.expiresAt < new Date()) {
        // Optionally update status to EXPIRED in DB
        await ctx.db
          .update(professorInvitationTable)
          .set({ status: 'EXPIRED' })
          .where(eq(professorInvitationTable.id, invitation.id))
        return { success: false, error: 'Este convite expirou.' }
      }

      return {
        success: true,
        email: invitation.email,
      }
    }),

  // Validate professor invitation token
  validateInvitation: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/auth/validate-invitation',
        tags: ['auth'],
        summary: 'Validate invitation token',
        description: 'Check if a professor invitation token is valid',
      },
    })
    .input(
      z.object({
        token: z.string(),
      })
    )
    .output(
      z.object({
        valid: z.boolean(),
        email: z.string().email().optional(),
        expired: z.boolean().optional(),
      })
    )
    .query(async () => {
      // In a real implementation, this would:
      // 1. Look up the invitation in the database
      // 2. Check if it's expired
      // 3. Return information about the invitation

      // Mock implementation for now
      return {
        valid: true,
        email: 'invited@ufba.br',
        expired: false,
      }
    }),

  // Accept professor invitation
  acceptInvitation: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/auth/accept-invitation',
        tags: ['auth'],
        summary: 'Accept professor invitation',
        description: 'Accept an invitation and create a professor account',
      },
    })
    .input(
      z.object({
        token: z.string(),
        username: z.string(),
        departamentoId: z.number(),
        nomeCompleto: z.string(),
        genero: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']),
        regime: z.enum(['20H', '40H', 'DE']),
        cpf: z.string(),
        emailInstitucional: z.string().email(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        user: z
          .object({
            id: z.number(),
            username: z.string(),
            email: z.string(),
            role: z.literal(UserRole.PROFESSOR),
          })
          .optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // In a real implementation, this would:
      // 1. Validate the token
      // 2. Create a new user with role 'professor'
      // 3. Create a professor profile
      // 4. Mark the invitation as accepted
      // 5. Return the new user

      // Mock implementation for now
      return {
        success: true,
        user: {
          id: 2,
          username: input.username,
          email: input.emailInstitucional,
          role: UserRole.PROFESSOR,
        },
      }
    }),
})
