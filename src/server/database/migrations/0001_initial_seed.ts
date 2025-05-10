import { db } from '..';
import { cursoTable } from '../schema';

export async function seed() {
  // Adicionar alguns cursos iniciais
  const cursos = [
    { nome: 'Ciência da Computação', codigo: 112 },
    { nome: 'Sistemas de Informação', codigo: 113 },
    { nome: 'Engenharia de Computação', codigo: 114 },
    { nome: 'Licenciatura em Computação', codigo: 115 },
  ];

  // Inserir cursos
  for (const curso of cursos) {
    await db.insert(cursoTable).values(curso).onConflictDoNothing();
  }

  console.log('Seed concluído com sucesso!');
}

// Executar o seed se este arquivo for chamado diretamente
// Versão ESM usando import.meta.url
if (import.meta.url === import.meta.resolve('./0001_initial_seed.ts')) {
  seed()
    .then(() => {
      console.log('Seed executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro ao executar seed:', error);
      process.exit(1);
    });
} 