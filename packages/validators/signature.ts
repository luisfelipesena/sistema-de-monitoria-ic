import { createSelectSchema } from 'drizzle-zod';
import { assinaturaDocumentoTable } from '../../src/server/database/schema';

export const assinaturaDocumentoSchema = createSelectSchema(assinaturaDocumentoTable);