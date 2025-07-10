import { db } from '../../src/server/db'
import { apiKeyTable, userTable } from '../../src/server/db/schema'
import { eq } from 'drizzle-orm'
import { hashApiKey, testUsers } from './auth'

export class DatabaseSetup {
  // Create test users if they don't exist
  static async ensureTestUsersExist() {
    for (const [_key, userData] of Object.entries(testUsers)) {
      const existingUser = await db.query.userTable.findFirst({
        where: eq(userTable.username, userData.username),
      })

      if (!existingUser) {
        await db.insert(userTable).values({
          username: userData.username,
          email: userData.email,
          role: userData.role,
        })
      }
    }
  }

  // Create API key for a user
  static async createApiKeyForUser(username: string, keyName: string = 'E2E Test Key'): Promise<string> {
    const user = await db.query.userTable.findFirst({
      where: eq(userTable.username, username),
    })

    if (!user) {
      throw new Error(`User with username ${username} not found`)
    }

    // Generate a simple API key for testing
    const rawKey = `test_key_${username}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const hashedKey = hashApiKey(rawKey)

    await db.insert(apiKeyTable).values({
      keyValue: hashedKey,
      name: keyName,
      description: 'API key for E2E testing',
      userId: user.id,
      isActive: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    })

    return rawKey
  }

  // Clean up test API keys
  static async cleanupTestApiKeys() {
    await db.delete(apiKeyTable).where(eq(apiKeyTable.name, 'E2E Test Key'))
  }

  // Get user by username
  static async getUserByUsername(username: string) {
    return await db.query.userTable.findFirst({
      where: eq(userTable.username, username),
    })
  }
}
