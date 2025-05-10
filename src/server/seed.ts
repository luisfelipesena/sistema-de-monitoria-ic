import { db } from '@/server/database';
import { cursoTable } from './database/schema';

export async function seed() {
  await db.insert(cursoTable).values({
    nome: 'Ciência da Computação',
  });
  await db.insert(cursoTable).values({
    nome: 'Sistemas de Informação',
  });
  await db.insert(cursoTable).values({
    nome: 'Engenharia da Computação',
  });
  await db.insert(cursoTable).values({
    nome: 'Licenciatura em Computação',
  });
}

await seed();
