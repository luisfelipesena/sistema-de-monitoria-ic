import { env } from '@/utils/env';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { departamentoTable, disciplinaTable } from './schema';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const db = drizzle(pool, { schema: { departamentoTable, disciplinaTable } });

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Inserir departamentos
    console.log('📂 Inserindo departamentos...');
    const departamentos = await db
      .insert(departamentoTable)
      .values([
        {
          nome: 'Departamento de Ciência da Computação',
          sigla: 'DCC',
          unidadeUniversitaria: 'Instituto de Matemática e Estatística',
        },
        {
          nome: 'Departamento de Ciência da Informação',
          sigla: 'DCI',
          unidadeUniversitaria: 'Instituto de Ciência da Informação',
        },
        {
          nome: 'Departamento de Matemática',
          sigla: 'MAT',
          unidadeUniversitaria: 'Instituto de Matemática e Estatística',
        },
        {
          nome: 'Departamento de Física',
          sigla: 'FIS',
          unidadeUniversitaria: 'Instituto de Física',
        },
      ])
      .returning();

    console.log(`✅ ${departamentos.length} departamentos inseridos`);

    // Buscar IDs dos departamentos para as disciplinas
    const dcc = departamentos.find((d) => d.sigla === 'DCC')!;
    const dci = departamentos.find((d) => d.sigla === 'DCI')!;
    const mat = departamentos.find((d) => d.sigla === 'MAT')!;
    const fis = departamentos.find((d) => d.sigla === 'FIS')!;

    // Inserir disciplinas
    console.log('📚 Inserindo disciplinas...');
    const disciplinas = await db
      .insert(disciplinaTable)
      .values([
        // Disciplinas de Computação (DCC)
        {
          nome: 'Algoritmos e Estruturas de Dados I',
          codigo: 'MATA40',
          departamentoId: dcc.id,
        },
        {
          nome: 'Algoritmos e Estruturas de Dados II',
          codigo: 'MATA48',
          departamentoId: dcc.id,
        },
        {
          nome: 'Programação Orientada a Objetos',
          codigo: 'MATA62',
          departamentoId: dcc.id,
        },
        {
          nome: 'Banco de Dados',
          codigo: 'MATA60',
          departamentoId: dcc.id,
        },
        {
          nome: 'Engenharia de Software I',
          codigo: 'MATA64',
          departamentoId: dcc.id,
        },
        {
          nome: 'Redes de Computadores I',
          codigo: 'MATA59',
          departamentoId: dcc.id,
        },
        {
          nome: 'Sistemas Operacionais',
          codigo: 'MATA58',
          departamentoId: dcc.id,
        },
        {
          nome: 'Inteligência Artificial',
          codigo: 'MATA65',
          departamentoId: dcc.id,
        },

        // Disciplinas de Ciência da Informação (DCI)
        {
          nome: 'Fundamentos da Ciência da Informação',
          codigo: 'ICI001',
          departamentoId: dci.id,
        },
        {
          nome: 'Organização e Representação da Informação',
          codigo: 'ICI002',
          departamentoId: dci.id,
        },
        {
          nome: 'Gestão da Informação',
          codigo: 'ICI003',
          departamentoId: dci.id,
        },
        {
          nome: 'Biblioteconomia Digital',
          codigo: 'ICI004',
          departamentoId: dci.id,
        },

        // Disciplinas de Matemática (MAT)
        {
          nome: 'Cálculo A',
          codigo: 'MATA01',
          departamentoId: mat.id,
        },
        {
          nome: 'Cálculo B',
          codigo: 'MATA02',
          departamentoId: mat.id,
        },
        {
          nome: 'Álgebra Linear A',
          codigo: 'MATA07',
          departamentoId: mat.id,
        },
        {
          nome: 'Matemática Discreta I',
          codigo: 'MATA37',
          departamentoId: mat.id,
        },

        // Disciplinas de Física (FIS)
        {
          nome: 'Física Geral I',
          codigo: 'FISF01',
          departamentoId: fis.id,
        },
        {
          nome: 'Física Geral II',
          codigo: 'FISF02',
          departamentoId: fis.id,
        },
        {
          nome: 'Laboratório de Física I',
          codigo: 'FISF03',
          departamentoId: fis.id,
        },
      ])
      .returning();

    console.log(`✅ ${disciplinas.length} disciplinas inseridas`);
    console.log('🎉 Seed concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
  } finally {
    await pool.end();
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export { seedDatabase };
