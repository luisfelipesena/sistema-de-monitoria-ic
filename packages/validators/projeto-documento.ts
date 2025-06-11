import { createSelectSchema } from 'drizzle-zod';
import { projetoDocumentoTable } from '../../src/server/database/schema';

export const projetoDocumentoSchema = createSelectSchema(projetoDocumentoTable);