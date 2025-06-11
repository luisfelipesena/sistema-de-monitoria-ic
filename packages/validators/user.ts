import { createSelectSchema } from 'drizzle-zod';
import { userTable } from '../../src/server/database/schema';

export const userSelectSchema = createSelectSchema(userTable);