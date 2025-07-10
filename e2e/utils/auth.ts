import { type Page } from '@playwright/test'
import { createHash } from 'crypto'

export interface TestUser {
  id: number
  username: string
  email: string
  role: 'admin' | 'professor' | 'student'
  apiKey?: string
}

export class AuthHelper {
  constructor(private page: Page) {}

  async authenticateWithApiKey(apiKey: string) {
    await this.page.setExtraHTTPHeaders({
      'x-api-key': apiKey,
    })
  }

  async loginViaCAS(username: string, password: string) {
    await this.page.goto('/api/cas-login')

    // Wait for redirect to CAS login page
    await this.page.waitForURL(/autenticacao\.ufba\.br/)

    // Fill CAS login form
    await this.page.fill('input[name="username"]', username)
    await this.page.fill('input[name="password"]', password)
    await this.page.click('input[type="submit"]')

    // Wait for redirect back to application
    await this.page.waitForURL(/localhost:3001/)
  }

  async logout() {
    await this.page.goto('/api/cas-logout')
    await this.page.waitForURL('/api/cas-login')
  }

  // Helper to create API key via tRPC for testing
  async createTestApiKey(userId: number, name: string = 'E2E Test Key'): Promise<string> {
    // This would be called from a test that has admin auth
    const response = await this.page.evaluate(
      async ({ userId, name }) => {
        // Call tRPC endpoint to create API key
        const result = await fetch('/api/trpc/apiKey.create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            json: {
              name,
              description: 'Generated for E2E testing',
              userId,
            },
          }),
        })
        return result.json()
      },
      { userId, name }
    )

    return response.result.data.json.key
  }
}

// Test data for different user types
export const testUsers = {
  admin: {
    id: 1,
    username: 'luis.sena',
    email: 'luis.sena@ufba.br',
    role: 'admin' as const,
  },
  professor: {
    id: 2,
    username: 'prof.test',
    email: 'prof.test@ufba.br',
    role: 'professor' as const,
  },
  student: {
    id: 3,
    username: 'student.test',
    email: 'student.test@ufba.br',
    role: 'student' as const,
  },
}

// Hash API key for database storage (matches server logic)
export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex')
}
