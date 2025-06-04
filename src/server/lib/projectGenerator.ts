import { parse } from 'csv-parse/sync';
import XLSX from 'xlsx';
import { db } from '../database';
import {
  projetoTable,
  projetoDisciplinaTable,
  disciplinaTable,
  professorTable,
  departamentoTable,
  disciplinaProfessorResponsavelTable,
  atividadeProjetoTable,
  projetoProfessorParticipanteTable,
  importacaoPlanejamentoTable,
  semestreEnum,
  userTable,
} from '../database/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { emailService } from './emailService';
import { logger } from '@/utils/logger';

interface PlanejamentoRow {
  disciplinaCodigo: string;
  disciplinaNome: string;
  professorSiape: string;
  professorNome: string;
  professorEmail: string;
  departamento: string;
  cargaHoraria: number;
  numeroSemanas: number;
  bolsasSolicitadas: number;
  voluntariosSolicitados: number;
  publicoAlvo: string;
  estimativaPessoas: number;
  objetivos: string;
}

interface ImportResult {
  totalRows: number;
  projectsCreated: number;
  errors: Array<{ row: number; error: string; data?: any }>;
}

const log = logger.child({ context: 'ProjectGenerator' });

export class ProjectGeneratorService {
  async processImportFile(
    fileBuffer: Buffer,
    fileName: string,
    fileType: 'csv' | 'xlsx',
    ano: number,
    semestre: typeof semestreEnum.enumValues[number],
    userId: number,
    fileId: string
  ): Promise<ImportResult> {
    const importRecord = await this.createImportRecord(
      fileId,
      fileName,
      ano,
      semestre,
      userId
    );

    try {
      const data = this.parseFile(fileBuffer, fileType);
      const result = await this.processRows(data, ano, semestre);
      
      await this.updateImportRecord(importRecord.id, {
        totalProjetos: result.totalRows,
        projetosCriados: result.projectsCreated,
        projetosComErro: result.errors.length,
        status: result.errors.length > 0 ? 'CONCLUIDO_COM_ERROS' : 'CONCLUIDO',
        erros: JSON.stringify(result.errors)
      });

      return result;
    } catch (error) {
      log.error('Error processing import file:', error);
      await this.updateImportRecord(importRecord.id, {
        status: 'ERRO',
        erros: JSON.stringify([{ error: 'Erro no processamento', details: String(error) }])
      });
      throw error;
    }
  }

  private parseFile(fileBuffer: Buffer, fileType: 'csv' | 'xlsx'): PlanejamentoRow[] {
    if (fileType === 'csv') {
      return parse(fileBuffer.toString(), {
        columns: true,
        skip_empty_lines: true,
        delimiter: ';'
      }).map(this.mapRowToPlanejamento);
    } else {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      return jsonData.map(this.mapRowToPlanejamento);
    }
  }

  private mapRowToPlanejamento(row: any): PlanejamentoRow {
    return {
      disciplinaCodigo: String(row['Código Disciplina'] || row.codigo || '').trim(),
      disciplinaNome: String(row['Nome Disciplina'] || row.disciplina || '').trim(),
      professorSiape: String(row['SIAPE Professor'] || row.siape || '').trim(),
      professorNome: String(row['Nome Professor'] || row.professor || '').trim(),
      professorEmail: String(row['Email Professor'] || row.email || '').trim(),
      departamento: String(row['Departamento'] || row.depto || '').trim(),
      cargaHoraria: Number(row['Carga Horária'] || row.carga || 0),
      numeroSemanas: Number(row['Número Semanas'] || row.semanas || 16),
      bolsasSolicitadas: Number(row['Bolsas Solicitadas'] || row.bolsas || 0),
      voluntariosSolicitados: Number(row['Voluntários'] || row.voluntarios || 0),
      publicoAlvo: String(row['Público Alvo'] || row.publico || '').trim(),
      estimativaPessoas: Number(row['Estimativa Pessoas'] || row.estimativa || 0),
      objetivos: String(row['Objetivos'] || row.descricao || '').trim()
    };
  }

  private async processRows(
    rows: PlanejamentoRow[],
    ano: number,
    semestre: typeof semestreEnum.enumValues[number]
  ): Promise<ImportResult> {
    const result: ImportResult = {
      totalRows: rows.length,
      projectsCreated: 0,
      errors: []
    };

    for (let i = 0; i < rows.length; i++) {
      try {
        await this.processRow(rows[i], ano, semestre);
        result.projectsCreated++;
      } catch (error) {
        log.error(`Error processing row ${i + 1}:`, error);
        result.errors.push({
          row: i + 1,
          error: String(error),
          data: rows[i]
        });
      }
    }

    return result;
  }

  private async processRow(
    row: PlanejamentoRow,
    ano: number,
    semestre: typeof semestreEnum.enumValues[number]
  ): Promise<void> {
    const professor = await this.findOrCreateProfessor(row);
    const disciplina = await this.findOrCreateDisciplina(row);
    const departamento = await this.findDepartamento(row.departamento);

    if (!departamento) {
      throw new Error(`Departamento não encontrado: ${row.departamento}`);
    }

    const projeto = await this.createProject(
      row,
      professor,
      disciplina,
      departamento,
      ano,
      semestre
    );

    await emailService.sendProjetoGeradoParaAssinaturaNotification(
      {
        professorEmail: professor.emailInstitucional,
        professorNome: professor.nomeCompleto,
        projetoTitulo: projeto.titulo,
        projetoId: projeto.id,
        remetenteUserId: professor.id
      }
    );
  }

  private async findOrCreateProfessor(row: PlanejamentoRow) {
    let professor = await db.query.professorTable.findFirst({
      where: eq(professorTable.matriculaSiape, row.professorSiape)
    });

    if (!professor) {
      const departamento = await this.findDepartamento(row.departamento);
      if (!departamento) {
        throw new Error(`Departamento não encontrado para professor: ${row.departamento}`);
      }

      let user = await db.query.userTable.findFirst({
        where: eq(userTable.email, row.professorEmail)
      });

      if (!user) {
        const [newUser] = await db.insert(userTable).values({
          username: row.professorEmail.split('@')[0],
          email: row.professorEmail,
          role: 'professor'
        }).returning();
        user = newUser;
      }

      const [newProfessor] = await db.insert(professorTable).values({
        userId: user.id,
        nomeCompleto: row.professorNome,
        emailInstitucional: row.professorEmail,
        matriculaSiape: row.professorSiape,
        departamentoId: departamento.id,
        genero: 'OUTRO',
        regime: 'DE',
        cpf: '00000000000'
      }).returning();

      professor = newProfessor;
    }

    return professor;
  }

  private async findOrCreateDisciplina(row: PlanejamentoRow) {
    let disciplina = await db.query.disciplinaTable.findFirst({
      where: eq(disciplinaTable.codigo, row.disciplinaCodigo)
    });

    if (!disciplina) {
      const departamento = await this.findDepartamento(row.departamento);
      if (!departamento) {
        throw new Error(`Departamento não encontrado para disciplina: ${row.departamento}`);
      }

      const [newDisciplina] = await db.insert(disciplinaTable).values({
        nome: row.disciplinaNome,
        codigo: row.disciplinaCodigo,
        departamentoId: departamento.id
      }).returning();

      disciplina = newDisciplina;
    }

    return disciplina;
  }

  private async findDepartamento(nome: string) {
    return db.query.departamentoTable.findFirst({
      where: eq(departamentoTable.nome, nome)
    });
  }

  private async createProject(
    row: PlanejamentoRow,
    professor: any,
    disciplina: any,
    departamento: any,
    ano: number,
    semestre: typeof semestreEnum.enumValues[number]
  ) {
    const titulo = `Monitoria em ${disciplina.nome} - ${semestre.replace('SEMESTRE_', '')}º Semestre ${ano}`;
    
    const [projeto] = await db.insert(projetoTable).values({
      titulo,
      descricao: row.objetivos || `Projeto de monitoria para a disciplina ${disciplina.nome}`,
      departamentoId: departamento.id,
      professorResponsavelId: professor.id,
      ano,
      semestre,
      tipoProposicao: 'INDIVIDUAL',
      bolsasSolicitadas: row.bolsasSolicitadas,
      voluntariosSolicitados: row.voluntariosSolicitados,
      cargaHorariaSemana: row.cargaHoraria,
      numeroSemanas: row.numeroSemanas,
      publicoAlvo: row.publicoAlvo || 'Estudantes de graduação',
      estimativaPessoasBenificiadas: row.estimativaPessoas,
      status: 'PENDING_PROFESSOR_SIGNATURE'
    }).returning();

    await db.insert(projetoDisciplinaTable).values({
      projetoId: projeto.id,
      disciplinaId: disciplina.id
    });

    return projeto;
  }

  private async createImportRecord(
    fileId: string,
    fileName: string,
    ano: number,
    semestre: typeof semestreEnum.enumValues[number],
    userId: number
  ) {
    const [record] = await db.insert(importacaoPlanejamentoTable).values({
      fileId,
      nomeArquivo: fileName,
      ano,
      semestre,
      importadoPorUserId: userId,
      status: 'PROCESSANDO'
    }).returning();

    return record;
  }

  private async updateImportRecord(
    id: number,
    updates: Partial<typeof importacaoPlanejamentoTable.$inferInsert>
  ) {
    await db.update(importacaoPlanejamentoTable)
      .set(updates)
      .where(eq(importacaoPlanejamentoTable.id, id));
  }

  async getImportHistory() {
    return db.query.importacaoPlanejamentoTable.findMany({
      orderBy: desc(importacaoPlanejamentoTable.createdAt),
      with: {
        importadoPor: {
          columns: {
            username: true,
            email: true
          }
        }
      }
    });
  }
}

export const projectGeneratorService = new ProjectGeneratorService();