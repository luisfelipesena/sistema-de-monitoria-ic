import { db } from '@/server/database';
import { createTRPCRouter, publicProcedure } from '../init';

export const cursoRouter = createTRPCRouter({
  get: publicProcedure.query(async () => {
    return await db.query.cursoTable.findMany();
  }),
});
