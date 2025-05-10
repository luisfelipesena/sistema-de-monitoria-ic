import { db } from '@/server/database';
import { alunoTable } from '@/server/database/schema';
import { lucia } from '@/server/lib/auth';
import { getSessionId } from '@/utils/lucia';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';

export const APIRoute = createAPIFileRoute('/api/aluno')({
  async GET(params) {
    const {
      request: { headers },
    } = params;
    const sessionId = getSessionId(headers);
    if (!sessionId) return new Response(null, { status: 401 });
    const result = await lucia.validateSession(sessionId);
    if (!result.session || !result.user)
      return new Response(null, { status: 401 });
    if (result.user.role !== 'student')
      return new Response(null, { status: 403 });
    const aluno = await db.query.alunoTable.findFirst({
      where: eq(alunoTable.userId, result.user.id),
    });
    if (!aluno) return new Response(JSON.stringify({}), { status: 200 });
    return new Response(JSON.stringify(aluno), { status: 200 });
  },
  async POST(params) {
    const {
      request: { headers },
    } = params;
    const sessionId = getSessionId(headers);
    if (!sessionId) return new Response(null, { status: 401 });
    const result = await lucia.validateSession(sessionId);
    if (!result.session || !result.user)
      return new Response(null, { status: 401 });
    if (result.user.role !== 'student')
      return new Response(null, { status: 403 });
    const body = await params.request.json();
    let aluno = await db.query.alunoTable.findFirst({
      where: eq(alunoTable.userId, result.user.id),
    });
    if (!aluno) {
      aluno = await db
        .insert(alunoTable)
        .values({
          userId: result.user.id,
          nomeCompleto: body.nomeCompleto,
          matricula: body.matricula,
          cpf: body.cpf,
          emailInstitucional: body.emailInstitucional,
          genero: body.genero,
          especificacaoGenero: body.especificacaoGenero,
          cr: body.cr,
          telefone: body.telefone,
          cursoId: body.cursoId,
        })
        .returning()
        .then((r) => r[0]);
    } else {
      aluno = await db
        .update(alunoTable)
        .set({
          nomeCompleto: body.nomeCompleto,
          matricula: body.matricula,
          cpf: body.cpf,
          emailInstitucional: body.emailInstitucional,
          genero: body.genero,
          especificacaoGenero: body.especificacaoGenero,
          cr: body.cr,
          telefone: body.telefone,
          cursoId: body.cursoId,
        })
        .where(eq(alunoTable.userId, result.user.id))
        .returning()
        .then((r) => r[0]);
    }
    return new Response(JSON.stringify(aluno), { status: 200 });
  },
});
