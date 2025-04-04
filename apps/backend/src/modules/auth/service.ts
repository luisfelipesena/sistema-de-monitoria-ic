import { db } from "@/database"
import { userTable, type userRoleEnum } from "@/database/schema"
import type { Database } from "@/database/type-utils"
import { lucia } from "@/lib/auth"
import { hashPassword, verifyPassword } from "@/lib/password"
import { eq } from "drizzle-orm"
import { HTTPException } from "hono/http-exception"
import { generateId } from "lucia"


export class AuthService {
  private static instance: AuthService | null = null;
  private database: Database;

  private constructor() {
    this.database = db
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signUp(email: string, password: string, role: typeof userRoleEnum.enumValues[number]) {
    // Check if user exists
    const existingUser = await this.database.query.userTable.findFirst({
      where: eq(userTable.email, email),
    })

    if (existingUser) {
      throw new HTTPException(409, { message: "Email already in use" })
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    const userId = generateId(15)

    try {
      await this.database.insert(userTable).values({
        id: userId,
        email,
        hashed_password: hashedPassword,
        role,
      })

      // Create session
      const session = await lucia.createSession(userId, {})
      return session
    } catch (e) {
      console.error("Signup DB Error:", e)
      throw new HTTPException(500, { message: "Could not create user" })
    }
  }

  async signIn(email: string, password: string) {
    const user = await this.database.query.userTable.findFirst({
      where: eq(userTable.email, email),
    })

    if (!user || !user.hashed_password) {
      throw new HTTPException(401, { message: "Invalid email or password" })
    }

    const isValidPassword = await verifyPassword(user.hashed_password, password)
    if (!isValidPassword) {
      throw new HTTPException(401, { message: "Invalid email or password" })
    }

    const session = await lucia.createSession(user.id, {})
    return session
  }

  async signOut(sessionId: string) {
    if (sessionId) {
      await lucia.invalidateSession(sessionId)
    }
  }

  async getUser(email: string) {
    const user = await this.database.query.userTable.findFirst({
      where: eq(userTable.email, email),
    })
    return user
  }
}