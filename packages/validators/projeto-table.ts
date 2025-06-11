import { createSelectSchema } from 'drizzle-zod';
import { projetoTable } from '../../src/server/database/schema';

export const projetoSelectSchema = createSelectSchema(projetoTable);