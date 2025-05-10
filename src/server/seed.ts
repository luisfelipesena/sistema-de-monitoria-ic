import { db } from '@/server/database';
import { cursoTable, departamentoTable } from './database/schema';

export async function curso() {
  await db.transaction(async (tx) => {
    await tx.insert(cursoTable).values({
      nome: 'Ciência da Computação',
    });
    await tx.insert(cursoTable).values({
      nome: 'Sistemas de Informação',
    });
    await tx.insert(cursoTable).values({
      nome: 'Engenharia da Computação',
    });
    await tx.insert(cursoTable).values({
      nome: 'Licenciatura em Computação',
    });
  });
}
export async function departamento() {
  await db.transaction(async (tx) => {
    await tx.insert(departamentoTable).values({
      nome: 'Departamento de Ciência da Computação',
    });
  });
}

(async () => {
  // await curso();
  await departamento();
})();
