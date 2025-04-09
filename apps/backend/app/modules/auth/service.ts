import { db } from '@/database';
import { userTable } from '@/database/schema';
import type { Database } from '@/database/type-utils';
import { lucia } from '@/lib/auth';
import logger from '@/lib/logger';
import { hashPassword, verifyPassword } from '@/lib/password';
import type { SignInFormValues, SignUpFormValues } from '@/modules/auth/types';
import { eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { generateId } from 'lucia';

export class AuthService {
  private static instance: AuthService | null = null;
  private database: Database;

  private constructor() {
    this.database = db;
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signUp(params: SignUpFormValues) {
    const { email, password, role } = params;
    const existingUser = await this.database.query.userTable.findFirst({
      where: eq(userTable.email, email),
    });

    if (existingUser) {
      throw new HTTPException(409, { message: 'Email already in use' });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const userId = generateId(15);

    try {
      await this.database.insert(userTable).values({
        id: userId,
        email,
        hashed_password: hashedPassword,
        role,
      });

      // Create session
      const session = await lucia.createSession(userId, {});
      return session;
    } catch (e) {
      logger.error({ err: e }, 'Signup DB Error');
      throw new HTTPException(500, { message: 'Could not create user' });
    }
  }

  async signIn(params: SignInFormValues) {
    const { email, password } = params;
    const user = await this.database.query.userTable.findFirst({
      where: eq(userTable.email, email),
    });

    if (!user || !user.hashed_password) {
      throw new HTTPException(401, { message: 'Invalid email or password' });
    }

    const isValidPassword = await verifyPassword(
      user.hashed_password,
      password,
    );
    if (!isValidPassword) {
      throw new HTTPException(401, { message: 'Invalid email or password' });
    }

    const session = await lucia.createSession(user.id, {});
    return session;
  }

  async signOut(sessionId: string) {
    if (sessionId) {
      await lucia.invalidateSession(sessionId);
    }
  }

  async getUserByEmail(email: string) {
    const user = await this.database.query.userTable.findFirst({
      where: eq(userTable.email, email),
    });
    return user;
  }
}
