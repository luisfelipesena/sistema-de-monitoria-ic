import { db } from '@/server/database';
import { createTRPCRouter, publicProcedure } from '../init';

export const departamentoRouter = createTRPCRouter({
  get: publicProcedure.query(async () => {
    return await db.query.departamentoTable.findMany();
  }),
});
