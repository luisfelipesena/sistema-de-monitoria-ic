import { db } from '@/server/database';
import { exists } from 'drizzle-orm';
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
  const departaments = [
    {
      id: 1,
      unidadeUniversitaria: 'Instututo de Computação',
      nome: 'Departamento de Ciência da Computação',
      sigla: 'DCC',
    },
    {
      id: 2,
      unidadeUniversitaria: 'Instututo de Computação',
      nome: 'Departamento de Computação Interdisciplinar',
      sigla: 'DCI',
    },
  ];

  const existingDepartaments = await db
    .select()
    .from(departamentoTable)
    .where(exists(departamentoTable.id));

  if (existingDepartaments.length === 0) {
    await db.insert(departamentoTable).values(departaments);
    console.log('Departamentos seedados com sucesso!');
  } else {
    console.log('Departamentos já existem, não foram seedados.');
  }
}

export async function seed() {
  await curso();
  await departamento();
}
