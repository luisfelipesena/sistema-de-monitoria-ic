module.exports = {

"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/superjson [external] (superjson, esm_import)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
const mod = await __turbopack_context__.y("superjson");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/zod [external] (zod, esm_import)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
const mod = await __turbopack_context__.y("zod");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/apps/web-next/src/server/trpc.ts [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "protectedProcedure": (()=>protectedProcedure),
    "publicProcedure": (()=>publicProcedure),
    "router": (()=>router)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$index$2e$mjs__$5b$api$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/@trpc/server/dist/index.mjs [api] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$unstable$2d$core$2d$do$2d$not$2d$import$2f$initTRPC$2e$mjs__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@trpc/server/dist/unstable-core-do-not-import/initTRPC.mjs [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$unstable$2d$core$2d$do$2d$not$2d$import$2f$error$2f$TRPCError$2e$mjs__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@trpc/server/dist/unstable-core-do-not-import/error/TRPCError.mjs [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$superjson__$5b$external$5d$__$28$superjson$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/superjson [external] (superjson, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$zod__$5b$external$5d$__$28$zod$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/zod [external] (zod, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$superjson__$5b$external$5d$__$28$superjson$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$zod__$5b$external$5d$__$28$zod$2c$__esm_import$29$__
]);
([__TURBOPACK__imported__module__$5b$externals$5d2f$superjson__$5b$external$5d$__$28$superjson$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$zod__$5b$external$5d$__$28$zod$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
;
const t = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$unstable$2d$core$2d$do$2d$not$2d$import$2f$initTRPC$2e$mjs__$5b$api$5d$__$28$ecmascript$29$__["initTRPC"].context().create({
    transformer: __TURBOPACK__imported__module__$5b$externals$5d2f$superjson__$5b$external$5d$__$28$superjson$2c$__esm_import$29$__["default"],
    errorFormatter ({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError: error.cause instanceof __TURBOPACK__imported__module__$5b$externals$5d2f$zod__$5b$external$5d$__$28$zod$2c$__esm_import$29$__["ZodError"] ? error.cause.flatten() : null
            }
        };
    }
});
const router = t.router;
const publicProcedure = t.procedure;
const protectedProcedure = t.procedure.use(t.middleware(({ ctx, next })=>{
    if (!ctx.user) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$unstable$2d$core$2d$do$2d$not$2d$import$2f$error$2f$TRPCError$2e$mjs__$5b$api$5d$__$28$ecmascript$29$__["TRPCError"]({
            code: 'UNAUTHORIZED'
        });
    }
    return next({
        ctx
    });
}));
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/drizzle-zod [external] (drizzle-zod, esm_import)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
const mod = await __turbopack_context__.y("drizzle-zod");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/drizzle-orm [external] (drizzle-orm, esm_import)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
const mod = await __turbopack_context__.y("drizzle-orm");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/drizzle-orm/pg-core [external] (drizzle-orm/pg-core, esm_import)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
const mod = await __turbopack_context__.y("drizzle-orm/pg-core");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/src/server/database/schema.ts [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "alunoRelations": (()=>alunoRelations),
    "alunoTable": (()=>alunoTable),
    "assinaturaDocumentoRelations": (()=>assinaturaDocumentoRelations),
    "assinaturaDocumentoTable": (()=>assinaturaDocumentoTable),
    "ataSelecaoRelations": (()=>ataSelecaoRelations),
    "ataSelecaoTable": (()=>ataSelecaoTable),
    "atividadeProjetoRelations": (()=>atividadeProjetoRelations),
    "atividadeProjetoTable": (()=>atividadeProjetoTable),
    "cursoTable": (()=>cursoTable),
    "departamentoRelations": (()=>departamentoRelations),
    "departamentoTable": (()=>departamentoTable),
    "disciplinaProfessorResponsavelRelations": (()=>disciplinaProfessorResponsavelRelations),
    "disciplinaProfessorResponsavelTable": (()=>disciplinaProfessorResponsavelTable),
    "disciplinaRelations": (()=>disciplinaRelations),
    "disciplinaTable": (()=>disciplinaTable),
    "editalRelations": (()=>editalRelations),
    "editalTable": (()=>editalTable),
    "enderecoTable": (()=>enderecoTable),
    "generoEnum": (()=>generoEnum),
    "importacaoPlanejamentoRelations": (()=>importacaoPlanejamentoRelations),
    "importacaoPlanejamentoTable": (()=>importacaoPlanejamentoTable),
    "inscricaoDocumentoRelations": (()=>inscricaoDocumentoRelations),
    "inscricaoDocumentoTable": (()=>inscricaoDocumentoTable),
    "inscricaoRelations": (()=>inscricaoRelations),
    "inscricaoTable": (()=>inscricaoTable),
    "insertAlunoTableSchema": (()=>insertAlunoTableSchema),
    "insertCursoTableSchema": (()=>insertCursoTableSchema),
    "insertDepartamentoTableSchema": (()=>insertDepartamentoTableSchema),
    "insertDisciplinaTableSchema": (()=>insertDisciplinaTableSchema),
    "insertProfessorTableSchema": (()=>insertProfessorTableSchema),
    "insertProjetoDocumentoTableSchema": (()=>insertProjetoDocumentoTableSchema),
    "insertProjetoTableSchema": (()=>insertProjetoTableSchema),
    "notaAlunoRelations": (()=>notaAlunoRelations),
    "notaAlunoTable": (()=>notaAlunoTable),
    "notificacaoHistoricoRelations": (()=>notificacaoHistoricoRelations),
    "notificacaoHistoricoTable": (()=>notificacaoHistoricoTable),
    "periodoInscricaoRelations": (()=>periodoInscricaoRelations),
    "periodoInscricaoTable": (()=>periodoInscricaoTable),
    "professorInvitationRelations": (()=>professorInvitationRelations),
    "professorInvitationStatusEnum": (()=>professorInvitationStatusEnum),
    "professorInvitationTable": (()=>professorInvitationTable),
    "professorRelations": (()=>professorRelations),
    "professorTable": (()=>professorTable),
    "projetoDisciplinaRelations": (()=>projetoDisciplinaRelations),
    "projetoDisciplinaTable": (()=>projetoDisciplinaTable),
    "projetoDocumentoRelations": (()=>projetoDocumentoRelations),
    "projetoDocumentoTable": (()=>projetoDocumentoTable),
    "projetoProfessorParticipanteRelations": (()=>projetoProfessorParticipanteRelations),
    "projetoProfessorParticipanteTable": (()=>projetoProfessorParticipanteTable),
    "projetoRelations": (()=>projetoRelations),
    "projetoStatusEnum": (()=>projetoStatusEnum),
    "projetoTable": (()=>projetoTable),
    "projetoTemplateRelations": (()=>projetoTemplateRelations),
    "projetoTemplateTable": (()=>projetoTemplateTable),
    "regimeEnum": (()=>regimeEnum),
    "selectAlunoTableSchema": (()=>selectAlunoTableSchema),
    "selectAtividadeProjetoTableSchema": (()=>selectAtividadeProjetoTableSchema),
    "selectCursoTableSchema": (()=>selectCursoTableSchema),
    "selectDepartamentoTableSchema": (()=>selectDepartamentoTableSchema),
    "selectDisciplinaTableSchema": (()=>selectDisciplinaTableSchema),
    "selectProfessorTableSchema": (()=>selectProfessorTableSchema),
    "selectProjetoDocumentoTableSchema": (()=>selectProjetoDocumentoTableSchema),
    "selectProjetoTableSchema": (()=>selectProjetoTableSchema),
    "semestreEnum": (()=>semestreEnum),
    "sessionRelations": (()=>sessionRelations),
    "sessionTable": (()=>sessionTable),
    "statusEnvioEnum": (()=>statusEnvioEnum),
    "statusInscricaoEnum": (()=>statusInscricaoEnum),
    "tipoAssinaturaEnum": (()=>tipoAssinaturaEnum),
    "tipoDocumentoProjetoEnum": (()=>tipoDocumentoProjetoEnum),
    "tipoInscricaoEnum": (()=>tipoInscricaoEnum),
    "tipoProposicaoEnum": (()=>tipoProposicaoEnum),
    "tipoVagaEnum": (()=>tipoVagaEnum),
    "userRelations": (()=>userRelations),
    "userRoleEnum": (()=>userRoleEnum),
    "userTable": (()=>userTable),
    "vagaRelations": (()=>vagaRelations),
    "vagaTable": (()=>vagaTable)
});
var __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/drizzle-orm [external] (drizzle-orm, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/drizzle-orm/pg-core [external] (drizzle-orm/pg-core, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/drizzle-zod [external] (drizzle-zod, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__
]);
([__TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
;
const userRoleEnum = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgEnum"])('user_role', [
    'admin',
    'professor',
    'student'
]);
const userTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('user', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    username: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('username').notNull().unique(),
    email: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('email').notNull().unique(),
    role: userRoleEnum('role').notNull().default('student'),
    // Assinatura padrão para admins
    assinaturaDefault: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('assinatura_default'),
    dataAssinaturaDefault: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('data_assinatura_default', {
        withTimezone: true,
        mode: 'date'
    })
});
const sessionTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('session', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('id').primaryKey(),
    userId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('user_id').notNull().references(()=>userTable.id),
    expiresAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('expires_at', {
        withTimezone: true,
        mode: 'date'
    }).notNull()
});
const userRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(userTable, ({ many, one })=>({
        sessions: many(sessionTable),
        professorProfile: one(professorTable, {
            // Link to professor profile if role is professor
            fields: [
                userTable.id
            ],
            references: [
                professorTable.userId
            ]
        }),
        studentProfile: one(alunoTable, {
            // Link to student profile if role is student
            fields: [
                userTable.id
            ],
            references: [
                alunoTable.userId
            ]
        })
    }));
const sessionRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(sessionTable, ({ one })=>({
        user: one(userTable, {
            fields: [
                sessionTable.userId
            ],
            references: [
                userTable.id
            ]
        })
    }));
const semestreEnum = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgEnum"])('semestre_enum', [
    'SEMESTRE_1',
    'SEMESTRE_2'
]);
const tipoProposicaoEnum = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgEnum"])('tipo_proposicao_enum', [
    'INDIVIDUAL',
    'COLETIVA'
]);
const tipoVagaEnum = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgEnum"])('tipo_vaga_enum', [
    'BOLSISTA',
    'VOLUNTARIO'
]);
const projetoStatusEnum = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgEnum"])('projeto_status_enum', [
    'DRAFT',
    'SUBMITTED',
    'APPROVED',
    'REJECTED',
    'PENDING_ADMIN_SIGNATURE',
    'PENDING_PROFESSOR_SIGNATURE'
]);
const generoEnum = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgEnum"])('genero_enum', [
    'MASCULINO',
    'FEMININO',
    'OUTRO'
]);
const regimeEnum = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgEnum"])('regime_enum', [
    '20H',
    '40H',
    'DE'
]);
const tipoInscricaoEnum = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgEnum"])('tipo_inscricao_enum', [
    'BOLSISTA',
    'VOLUNTARIO',
    'ANY'
]);
const tipoDocumentoProjetoEnum = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgEnum"])('tipo_documento_projeto_enum', [
    'PROPOSTA_ORIGINAL',
    'PROPOSTA_ASSINADA_PROFESSOR',
    'PROPOSTA_ASSINADA_ADMIN',
    'ATA_SELECAO'
]);
const tipoAssinaturaEnum = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgEnum"])('tipo_assinatura_enum', [
    'PROJETO_PROFESSOR_RESPONSAVEL',
    'TERMO_COMPROMISSO_ALUNO',
    'EDITAL_ADMIN',
    'ATA_SELECAO_PROFESSOR',
    'PROJETO_COORDENADOR_DEPARTAMENTO'
]);
const statusInscricaoEnum = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgEnum"])('status_inscricao_enum', [
    'SUBMITTED',
    'SELECTED_BOLSISTA',
    'SELECTED_VOLUNTARIO',
    'ACCEPTED_BOLSISTA',
    'ACCEPTED_VOLUNTARIO',
    'REJECTED_BY_PROFESSOR',
    'REJECTED_BY_STUDENT'
]);
const departamentoTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('departamento', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    unidadeUniversitaria: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('unidade_universitaria').notNull(),
    nome: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('nome').notNull(),
    sigla: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('sigla'),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('updated_at', {
        withTimezone: true,
        mode: 'date'
    }).$onUpdate(()=>new Date())
});
const selectDepartamentoTableSchema = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__["createSelectSchema"])(departamentoTable);
const insertDepartamentoTableSchema = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__["createInsertSchema"])(departamentoTable).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
const projetoTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('projeto', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    // dataAprovacao: date('data_aprovacao', { mode: 'date' }), // Approval date might be inferred from status change
    departamentoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('departamento_id').references(()=>departamentoTable.id).notNull(),
    ano: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('ano').notNull(),
    semestre: semestreEnum('semestre').notNull(),
    tipoProposicao: tipoProposicaoEnum('tipo_proposicao').notNull(),
    bolsasSolicitadas: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('bolsas_solicitadas').notNull().default(0),
    voluntariosSolicitados: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('voluntarios_solicitados').notNull().default(0),
    bolsasDisponibilizadas: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('bolsas_disponibilizadas').default(0),
    // voluntariosAtendidos: integer('voluntarios_atendidos'), // Calculated from accepted 'vaga'
    cargaHorariaSemana: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('carga_horaria_semana').notNull(),
    numeroSemanas: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('numero_semanas').notNull(),
    publicoAlvo: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('publico_alvo').notNull(),
    estimativaPessoasBenificiadas: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('estimativa_pessoas_benificiadas'),
    professorResponsavelId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('professor_responsavel_id').references(()=>professorTable.id).notNull(),
    titulo: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('titulo').notNull(),
    descricao: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('descricao').notNull(),
    status: projetoStatusEnum('status').notNull().default('DRAFT'),
    assinaturaProfessor: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('assinatura_professor'),
    // analiseSubmissao: text('analise_submissao'), // Renamed/Repurposed
    feedbackAdmin: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('feedback_admin'),
    // documentoUniqueId: text('documento_unique_id'), // Link to separate document table
    // assinaturaUniqueId: text('assinatura_unique_id'), // Link to separate signature process/table
    // validado: boolean('validado').notNull().default(false), // Status handles validation
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('updated_at', {
        withTimezone: true,
        mode: 'date'
    }).$onUpdate(()=>new Date()),
    deletedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('deleted_at', {
        withTimezone: true,
        mode: 'date'
    })
});
const selectProjetoTableSchema = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__["createSelectSchema"])(projetoTable);
const insertProjetoTableSchema = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__["createInsertSchema"])(projetoTable).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true
});
const projetoDisciplinaTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('projeto_disciplina', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    projetoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('projeto_id').references(()=>projetoTable.id, {
        onDelete: 'cascade'
    }).notNull(),
    disciplinaId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('disciplina_id').references(()=>disciplinaTable.id).notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull()
});
const projetoProfessorParticipanteTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('projeto_professor_participante', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    projetoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('projeto_id').references(()=>projetoTable.id, {
        onDelete: 'cascade'
    }).notNull(),
    professorId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('professor_id').references(()=>professorTable.id).notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull()
});
const atividadeProjetoTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('atividade_projeto', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    projetoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('projeto_id').references(()=>projetoTable.id, {
        onDelete: 'cascade'
    }).notNull(),
    descricao: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('descricao').notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull()
});
const selectAtividadeProjetoTableSchema = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__["createSelectSchema"])(atividadeProjetoTable);
const professorTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('professor', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    userId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('user_id').references(()=>userTable.id, {
        onDelete: 'cascade'
    }).notNull().unique(),
    departamentoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('departamento_id').references(()=>departamentoTable.id).notNull(),
    nomeCompleto: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('nome_completo').notNull(),
    nomeSocial: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('nome_social'),
    matriculaSiape: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('matricula_siape'),
    genero: generoEnum('genero').notNull(),
    regime: regimeEnum('regime').notNull(),
    especificacaoGenero: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('especificacao_genero'),
    cpf: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('cpf').notNull(),
    telefone: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('telefone'),
    telefoneInstitucional: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('telefone_institucional'),
    emailInstitucional: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('email_institucional').notNull(),
    // Document file IDs for professor documents
    curriculumVitaeFileId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('curriculum_vitae_file_id'),
    comprovanteVinculoFileId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('comprovante_vinculo_file_id'),
    // Assinatura padrão do professor
    assinaturaDefault: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('assinatura_default'),
    dataAssinaturaDefault: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('data_assinatura_default', {
        withTimezone: true,
        mode: 'date'
    }),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('updated_at', {
        withTimezone: true,
        mode: 'date'
    }).$onUpdate(()=>new Date())
});
const selectProfessorTableSchema = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__["createSelectSchema"])(professorTable);
const insertProfessorTableSchema = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__["createInsertSchema"])(professorTable).omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true
});
const disciplinaTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('disciplina', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    nome: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('nome').notNull(),
    codigo: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('codigo').notNull(),
    departamentoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('departamento_id').references(()=>departamentoTable.id).notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('updated_at', {
        withTimezone: true,
        mode: 'date'
    }).$onUpdate(()=>new Date()),
    deletedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('deleted_at', {
        withTimezone: true,
        mode: 'date'
    })
}, (table)=>{
    return {
        codigoUnicoPorDepartamento: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["uniqueIndex"])('codigo_unico_por_departamento_idx').on(table.codigo, table.departamentoId)
    };
});
const selectDisciplinaTableSchema = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__["createSelectSchema"])(disciplinaTable);
const insertDisciplinaTableSchema = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__["createInsertSchema"])(disciplinaTable).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true
});
const alunoTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('aluno', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    userId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('user_id').references(()=>userTable.id, {
        onDelete: 'cascade'
    }).notNull().unique(),
    nomeCompleto: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('nome_completo').notNull(),
    nomeSocial: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('nome_social'),
    genero: generoEnum('genero').notNull(),
    especificacaoGenero: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('especificacao_genero'),
    emailInstitucional: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('email_institucional').notNull(),
    matricula: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('matricula').notNull().unique(),
    rg: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('rg'),
    cpf: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('cpf').notNull().unique(),
    cr: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["real"])('CR').notNull(),
    telefone: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('telefone'),
    enderecoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('endereco_id').references(()=>enderecoTable.id),
    cursoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('curso_id').references(()=>cursoTable.id).notNull(),
    // Document file IDs for student documents
    historicoEscolarFileId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('historico_escolar_file_id'),
    comprovanteMatriculaFileId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('comprovante_matricula_file_id'),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('updated_at', {
        withTimezone: true,
        mode: 'date'
    }).$onUpdate(()=>new Date())
});
const selectAlunoTableSchema = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__["createSelectSchema"])(alunoTable);
const insertAlunoTableSchema = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__["createInsertSchema"])(alunoTable).omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true
});
const enderecoTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('endereco', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    numero: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('numero'),
    rua: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('rua').notNull(),
    bairro: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('bairro').notNull(),
    cidade: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('cidade').notNull(),
    estado: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('estado').notNull(),
    cep: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('cep').notNull(),
    complemento: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('complemento'),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('updated_at', {
        withTimezone: true,
        mode: 'date'
    }).$onUpdate(()=>new Date())
});
const cursoTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('curso', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    nome: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('nome').notNull(),
    codigo: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('codigo').notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('updated_at', {
        withTimezone: true,
        mode: 'date'
    }).$onUpdate(()=>new Date())
});
const selectCursoTableSchema = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__["createSelectSchema"])(cursoTable);
const insertCursoTableSchema = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__["createInsertSchema"])(cursoTable).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
const notaAlunoTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('nota_aluno', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    alunoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('aluno_id').references(()=>alunoTable.id, {
        onDelete: 'cascade'
    }).notNull(),
    disciplinaId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('disciplina_id').references(()=>disciplinaTable.id).notNull(),
    nota: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["real"])('nota').notNull(),
    ano: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('ano').notNull(),
    semestre: semestreEnum('semestre').notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('updated_at', {
        withTimezone: true,
        mode: 'date'
    }).$onUpdate(()=>new Date())
});
const periodoInscricaoTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('periodo_inscricao', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    semestre: semestreEnum('semestre').notNull(),
    ano: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('ano').notNull(),
    // editalUniqueId: text('edital_unique_id'), // Link to document table
    dataInicio: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["date"])('data_inicio', {
        mode: 'date'
    }).notNull(),
    dataFim: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["date"])('data_fim', {
        mode: 'date'
    }).notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('updated_at', {
        withTimezone: true,
        mode: 'date'
    }).$onUpdate(()=>new Date())
});
const inscricaoTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('inscricao', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    // processoSeletivoId: integer('processo_seletivo_id').references(() => processoSeletivoTable.id).notNull(), // Replaced by periodoInscricaoId + projetoId?
    periodoInscricaoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('periodo_inscricao_id').references(()=>periodoInscricaoTable.id).notNull(),
    projetoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('projeto_id').references(()=>projetoTable.id).notNull(),
    alunoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('aluno_id').references(()=>alunoTable.id, {
        onDelete: 'cascade'
    }).notNull(),
    tipoVagaPretendida: tipoInscricaoEnum('tipo_vaga_pretendida'),
    status: statusInscricaoEnum('status').notNull().default('SUBMITTED'),
    notaDisciplina: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["decimal"])('nota_disciplina', {
        precision: 4,
        scale: 2
    }),
    notaSelecao: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["decimal"])('nota_selecao', {
        precision: 4,
        scale: 2
    }),
    coeficienteRendimento: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["decimal"])('cr', {
        precision: 4,
        scale: 2
    }),
    notaFinal: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["decimal"])('nota_final', {
        precision: 4,
        scale: 2
    }),
    feedbackProfessor: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('feedback_professor'),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('updated_at', {
        withTimezone: true,
        mode: 'date'
    }).$onUpdate(()=>new Date())
});
const inscricaoDocumentoTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('inscricao_documento', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    inscricaoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('inscricao_id').references(()=>inscricaoTable.id, {
        onDelete: 'cascade'
    }).notNull(),
    fileId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('file_id').notNull(),
    tipoDocumento: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('tipo_documento').notNull(),
    // validado: boolean('validado'), // Potentially handled by admin/professor review
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('updated_at', {
        withTimezone: true,
        mode: 'date'
    }).$onUpdate(()=>new Date())
});
const projetoDocumentoTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('projeto_documento', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    projetoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('projeto_id').references(()=>projetoTable.id, {
        onDelete: 'cascade'
    }).notNull(),
    fileId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('file_id').notNull(),
    tipoDocumento: tipoDocumentoProjetoEnum('tipo_documento').notNull(),
    assinadoPorUserId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('assinado_por_user_id').references(()=>userTable.id),
    observacoes: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('observacoes'),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('updated_at', {
        withTimezone: true,
        mode: 'date'
    }).$onUpdate(()=>new Date())
});
const selectProjetoDocumentoTableSchema = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__["createSelectSchema"])(projetoDocumentoTable);
const insertProjetoDocumentoTableSchema = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__["createInsertSchema"])(projetoDocumentoTable).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
const vagaTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('vaga', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    alunoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('aluno_id').references(()=>alunoTable.id).notNull(),
    projetoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('projeto_id').references(()=>projetoTable.id).notNull(),
    inscricaoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('inscricao_id').references(()=>inscricaoTable.id).notNull().unique(),
    tipo: tipoVagaEnum('tipo').notNull(),
    dataInicio: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["date"])('data_inicio', {
        mode: 'date'
    }),
    dataFim: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["date"])('data_fim', {
        mode: 'date'
    }),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('updated_at', {
        withTimezone: true,
        mode: 'date'
    }).$onUpdate(()=>new Date())
});
const departamentoRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(departamentoTable, ({ many })=>({
        projetos: many(projetoTable),
        professores: many(professorTable),
        disciplinas: many(disciplinaTable)
    }));
const projetoRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(projetoTable, ({ one, many })=>({
        departamento: one(departamentoTable, {
            fields: [
                projetoTable.departamentoId
            ],
            references: [
                departamentoTable.id
            ]
        }),
        professorResponsavel: one(professorTable, {
            fields: [
                projetoTable.professorResponsavelId
            ],
            references: [
                professorTable.id
            ]
        }),
        disciplinas: many(projetoDisciplinaTable),
        professoresParticipantes: many(projetoProfessorParticipanteTable),
        atividades: many(atividadeProjetoTable),
        inscricoes: many(inscricaoTable),
        vagas: many(vagaTable),
        documentos: many(projetoDocumentoTable)
    }));
const projetoDisciplinaRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(projetoDisciplinaTable, ({ one })=>({
        projeto: one(projetoTable, {
            fields: [
                projetoDisciplinaTable.projetoId
            ],
            references: [
                projetoTable.id
            ]
        }),
        disciplina: one(disciplinaTable, {
            fields: [
                projetoDisciplinaTable.disciplinaId
            ],
            references: [
                disciplinaTable.id
            ]
        })
    }));
const projetoProfessorParticipanteRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(projetoProfessorParticipanteTable, ({ one })=>({
        projeto: one(projetoTable, {
            fields: [
                projetoProfessorParticipanteTable.projetoId
            ],
            references: [
                projetoTable.id
            ]
        }),
        professor: one(professorTable, {
            fields: [
                projetoProfessorParticipanteTable.professorId
            ],
            references: [
                professorTable.id
            ]
        })
    }));
const atividadeProjetoRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(atividadeProjetoTable, ({ one })=>({
        projeto: one(projetoTable, {
            fields: [
                atividadeProjetoTable.projetoId
            ],
            references: [
                projetoTable.id
            ]
        })
    }));
const professorRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(professorTable, ({ one, many })=>({
        departamento: one(departamentoTable, {
            fields: [
                professorTable.departamentoId
            ],
            references: [
                departamentoTable.id
            ]
        }),
        user: one(userTable, {
            fields: [
                professorTable.userId
            ],
            references: [
                userTable.id
            ]
        }),
        projetosResponsavel: many(projetoTable, {
            relationName: 'projetosResponsavel'
        }),
        projetosParticipante: many(projetoProfessorParticipanteTable),
        disciplinasResponsavel: many(disciplinaProfessorResponsavelTable)
    }));
const disciplinaRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(disciplinaTable, ({ many, one })=>({
        projetoDisciplinas: many(projetoDisciplinaTable),
        departamento: one(departamentoTable, {
            fields: [
                disciplinaTable.departamentoId
            ],
            references: [
                departamentoTable.id
            ]
        }),
        notasAlunos: many(notaAlunoTable),
        professoresResponsaveis: many(disciplinaProfessorResponsavelTable)
    }));
const alunoRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(alunoTable, ({ one, many })=>({
        endereco: one(enderecoTable, {
            fields: [
                alunoTable.enderecoId
            ],
            references: [
                enderecoTable.id
            ]
        }),
        curso: one(cursoTable, {
            fields: [
                alunoTable.cursoId
            ],
            references: [
                cursoTable.id
            ]
        }),
        user: one(userTable, {
            fields: [
                alunoTable.userId
            ],
            references: [
                userTable.id
            ]
        }),
        inscricoes: many(inscricaoTable),
        notas: many(notaAlunoTable),
        vagas: many(vagaTable)
    }));
const notaAlunoRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(notaAlunoTable, ({ one })=>({
        aluno: one(alunoTable, {
            fields: [
                notaAlunoTable.alunoId
            ],
            references: [
                alunoTable.id
            ]
        }),
        disciplina: one(disciplinaTable, {
            fields: [
                notaAlunoTable.disciplinaId
            ],
            references: [
                disciplinaTable.id
            ]
        })
    }));
const periodoInscricaoRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(periodoInscricaoTable, ({ many, one })=>({
        inscricoes: many(inscricaoTable),
        edital: one(editalTable, {
            fields: [
                periodoInscricaoTable.id
            ],
            references: [
                editalTable.periodoInscricaoId
            ]
        })
    }));
const inscricaoRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(inscricaoTable, ({ one, many })=>({
        periodoInscricao: one(periodoInscricaoTable, {
            fields: [
                inscricaoTable.periodoInscricaoId
            ],
            references: [
                periodoInscricaoTable.id
            ]
        }),
        projeto: one(projetoTable, {
            fields: [
                inscricaoTable.projetoId
            ],
            references: [
                projetoTable.id
            ]
        }),
        aluno: one(alunoTable, {
            fields: [
                inscricaoTable.alunoId
            ],
            references: [
                alunoTable.id
            ]
        }),
        documentos: many(inscricaoDocumentoTable),
        vaga: one(vagaTable, {
            // Link to the resulting Vaga if accepted
            fields: [
                inscricaoTable.id
            ],
            references: [
                vagaTable.inscricaoId
            ]
        })
    }));
const inscricaoDocumentoRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(inscricaoDocumentoTable, ({ one })=>({
        inscricao: one(inscricaoTable, {
            fields: [
                inscricaoDocumentoTable.inscricaoId
            ],
            references: [
                inscricaoTable.id
            ]
        })
    }));
const projetoDocumentoRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(projetoDocumentoTable, ({ one })=>({
        projeto: one(projetoTable, {
            fields: [
                projetoDocumentoTable.projetoId
            ],
            references: [
                projetoTable.id
            ]
        }),
        assinadoPor: one(userTable, {
            fields: [
                projetoDocumentoTable.assinadoPorUserId
            ],
            references: [
                userTable.id
            ]
        })
    }));
const vagaRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(vagaTable, ({ one })=>({
        aluno: one(alunoTable, {
            fields: [
                vagaTable.alunoId
            ],
            references: [
                alunoTable.id
            ]
        }),
        projeto: one(projetoTable, {
            fields: [
                vagaTable.projetoId
            ],
            references: [
                projetoTable.id
            ]
        }),
        inscricao: one(inscricaoTable, {
            fields: [
                vagaTable.inscricaoId
            ],
            references: [
                inscricaoTable.id
            ]
        })
    }));
const disciplinaProfessorResponsavelTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('disciplina_professor_responsavel', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    disciplinaId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('disciplina_id').references(()=>disciplinaTable.id).notNull(),
    professorId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('professor_id').references(()=>professorTable.id).notNull(),
    ano: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('ano').notNull(),
    semestre: semestreEnum('semestre').notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('updated_at', {
        withTimezone: true,
        mode: 'date'
    }).$onUpdate(()=>new Date())
});
const disciplinaProfessorResponsavelRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(disciplinaProfessorResponsavelTable, ({ one })=>({
        disciplina: one(disciplinaTable, {
            fields: [
                disciplinaProfessorResponsavelTable.disciplinaId
            ],
            references: [
                disciplinaTable.id
            ]
        }),
        professor: one(professorTable, {
            fields: [
                disciplinaProfessorResponsavelTable.professorId
            ],
            references: [
                professorTable.id
            ]
        })
    }));
const importacaoPlanejamentoTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('importacao_planejamento', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    fileId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('file_id').notNull(),
    nomeArquivo: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('nome_arquivo').notNull(),
    ano: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('ano').notNull(),
    semestre: semestreEnum('semestre').notNull(),
    totalProjetos: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('total_projetos').notNull().default(0),
    projetosCriados: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('projetos_criados').notNull().default(0),
    projetosComErro: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('projetos_com_erro').notNull().default(0),
    status: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('status').notNull().default('PROCESSANDO'),
    erros: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('erros'),
    importadoPorUserId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('importado_por_user_id').references(()=>userTable.id).notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('updated_at', {
        withTimezone: true,
        mode: 'date'
    }).$onUpdate(()=>new Date())
});
const importacaoPlanejamentoRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(importacaoPlanejamentoTable, ({ one })=>({
        importadoPor: one(userTable, {
            fields: [
                importacaoPlanejamentoTable.importadoPorUserId
            ],
            references: [
                userTable.id
            ]
        })
    }));
const statusEnvioEnum = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgEnum"])('status_envio_enum', [
    'ENVIADO',
    'FALHOU'
]);
const notificacaoHistoricoTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('notificacao_historico', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    destinatarioEmail: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('destinatario_email').notNull(),
    assunto: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('assunto', {
        length: 255
    }).notNull(),
    tipoNotificacao: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('tipo_notificacao', {
        length: 100
    }).notNull(),
    statusEnvio: statusEnvioEnum('status_envio').notNull(),
    dataEnvio: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('data_envio', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull(),
    mensagemErro: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('mensagem_erro'),
    projetoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('projeto_id').references(()=>projetoTable.id),
    alunoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('aluno_id').references(()=>alunoTable.id),
    remetenteUserId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('remetente_user_id').references(()=>userTable.id)
});
const notificacaoHistoricoRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(notificacaoHistoricoTable, ({ one })=>({
        projeto: one(projetoTable, {
            fields: [
                notificacaoHistoricoTable.projetoId
            ],
            references: [
                projetoTable.id
            ]
        }),
        aluno: one(alunoTable, {
            fields: [
                notificacaoHistoricoTable.alunoId
            ],
            references: [
                alunoTable.id
            ]
        }),
        remetente: one(userTable, {
            fields: [
                notificacaoHistoricoTable.remetenteUserId
            ],
            references: [
                userTable.id
            ]
        })
    }));
const editalTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('edital', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    periodoInscricaoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('periodo_inscricao_id').references(()=>periodoInscricaoTable.id).notNull().unique(),
    numeroEdital: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('numero_edital', {
        length: 50
    }).notNull().unique(),
    titulo: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('titulo', {
        length: 255
    }).notNull().default('Edital Interno de Seleção de Monitores'),
    descricaoHtml: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('descricao_html'),
    fileIdAssinado: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('file_id_assinado'),
    dataPublicacao: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["date"])('data_publicacao', {
        mode: 'date'
    }),
    publicado: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["boolean"])('publicado').default(false).notNull(),
    criadoPorUserId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('criado_por_user_id').references(()=>userTable.id).notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('updated_at', {
        withTimezone: true,
        mode: 'date'
    }).$onUpdate(()=>new Date())
});
const editalRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(editalTable, ({ one })=>({
        periodoInscricao: one(periodoInscricaoTable, {
            fields: [
                editalTable.periodoInscricaoId
            ],
            references: [
                periodoInscricaoTable.id
            ]
        }),
        criadoPor: one(userTable, {
            fields: [
                editalTable.criadoPorUserId
            ],
            references: [
                userTable.id
            ]
        })
    }));
const professorInvitationStatusEnum = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgEnum"])('professor_invitation_status_enum', [
    'PENDING',
    'ACCEPTED',
    'EXPIRED'
]);
const professorInvitationTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('professor_invitation', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    email: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('email', {
        length: 255
    }).notNull().unique(),
    token: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('token', {
        length: 255
    }).notNull().unique(),
    status: professorInvitationStatusEnum('status').notNull().default('PENDING'),
    expiresAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('expires_at', {
        withTimezone: true,
        mode: 'date'
    }).notNull(),
    invitedByUserId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('invited_by_user_id') // Admin que enviou o convite
    .references(()=>userTable.id).notNull(),
    acceptedByUserId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('accepted_by_user_id').references(()=>userTable.id),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('updated_at', {
        withTimezone: true,
        mode: 'date'
    }).$onUpdate(()=>new Date())
});
const professorInvitationRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(professorInvitationTable, ({ one })=>({
        invitedByUser: one(userTable, {
            fields: [
                professorInvitationTable.invitedByUserId
            ],
            references: [
                userTable.id
            ],
            relationName: 'invitedByUser'
        }),
        acceptedByUser: one(userTable, {
            fields: [
                professorInvitationTable.acceptedByUserId
            ],
            references: [
                userTable.id
            ],
            relationName: 'acceptedByUser'
        })
    }));
const assinaturaDocumentoTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('assinatura_documento', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    assinaturaData: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('assinatura_data').notNull(),
    tipoAssinatura: tipoAssinaturaEnum('tipo_assinatura').notNull(),
    userId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('user_id').references(()=>userTable.id).notNull(),
    projetoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('projeto_id').references(()=>projetoTable.id),
    vagaId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('vaga_id').references(()=>vagaTable.id),
    editalId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('edital_id').references(()=>editalTable.id),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull()
});
const assinaturaDocumentoRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(assinaturaDocumentoTable, ({ one })=>({
        user: one(userTable, {
            fields: [
                assinaturaDocumentoTable.userId
            ],
            references: [
                userTable.id
            ]
        }),
        projeto: one(projetoTable, {
            fields: [
                assinaturaDocumentoTable.projetoId
            ],
            references: [
                projetoTable.id
            ]
        }),
        vaga: one(vagaTable, {
            fields: [
                assinaturaDocumentoTable.vagaId
            ],
            references: [
                vagaTable.id
            ]
        }),
        edital: one(editalTable, {
            fields: [
                assinaturaDocumentoTable.editalId
            ],
            references: [
                editalTable.id
            ]
        })
    }));
const projetoTemplateTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('projeto_template', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    disciplinaId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('disciplina_id').references(()=>disciplinaTable.id).notNull().unique(),
    tituloDefault: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])('titulo_default', {
        length: 255
    }),
    descricaoDefault: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('descricao_default'),
    cargaHorariaSemanaDefault: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('carga_horaria_semana_default'),
    numeroSemanasDefault: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('numero_semanas_default'),
    publicoAlvoDefault: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('publico_alvo_default'),
    atividadesDefault: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('atividades_default'),
    criadoPorUserId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('criado_por_user_id').references(()=>userTable.id).notNull(),
    ultimaAtualizacaoUserId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('ultima_atualizacao_user_id').references(()=>userTable.id),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('created_at', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('updated_at', {
        withTimezone: true,
        mode: 'date'
    }).$onUpdate(()=>new Date())
});
const projetoTemplateRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(projetoTemplateTable, ({ one })=>({
        disciplina: one(disciplinaTable, {
            fields: [
                projetoTemplateTable.disciplinaId
            ],
            references: [
                disciplinaTable.id
            ]
        }),
        criadoPor: one(userTable, {
            fields: [
                projetoTemplateTable.criadoPorUserId
            ],
            references: [
                userTable.id
            ],
            relationName: 'templateCriadoPor'
        }),
        ultimaAtualizacaoPor: one(userTable, {
            fields: [
                projetoTemplateTable.ultimaAtualizacaoUserId
            ],
            references: [
                userTable.id
            ],
            relationName: 'templateAtualizadoPor'
        })
    }));
const ataSelecaoTable = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])('ata_selecao', {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])('id').primaryKey(),
    projetoId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('projeto_id').references(()=>projetoTable.id, {
        onDelete: 'cascade'
    }).notNull().unique(),
    fileId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('file_id'),
    conteudoHtml: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])('conteudo_html'),
    dataGeracao: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('data_geracao', {
        withTimezone: true,
        mode: 'date'
    }).defaultNow().notNull(),
    geradoPorUserId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])('gerado_por_user_id').references(()=>userTable.id).notNull(),
    assinado: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["boolean"])('assinado').default(false).notNull(),
    dataAssinatura: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])('data_assinatura', {
        withTimezone: true,
        mode: 'date'
    })
});
const ataSelecaoRelations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["relations"])(ataSelecaoTable, ({ one })=>({
        projeto: one(projetoTable, {
            fields: [
                ataSelecaoTable.projetoId
            ],
            references: [
                projetoTable.id
            ]
        }),
        geradoPor: one(userTable, {
            fields: [
                ataSelecaoTable.geradoPorUserId
            ],
            references: [
                userTable.id
            ]
        })
    })); // Export all schemas and relations
 // export * from './schema'; // This line seems to cause issues if present, ensure it's handled correctly or removed if not standard for the project setup
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/packages/validators/user.ts [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "userSelectSchema": (()=>userSelectSchema)
});
var __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/drizzle-zod [external] (drizzle-zod, esm_import)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/database/schema.ts [api] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__
]);
([__TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
const userSelectSchema = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__["createSelectSchema"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["userTable"]);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/web-next/src/server/routers/auth.ts [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "authRouter": (()=>authRouter)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$trpc$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web-next/src/server/trpc.ts [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$validators$2f$user$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/validators/user.ts [api] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$trpc$2e$ts__$5b$api$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$validators$2f$user$2e$ts__$5b$api$5d$__$28$ecmascript$29$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$trpc$2e$ts__$5b$api$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$validators$2f$user$2e$ts__$5b$api$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
const authRouter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$trpc$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["router"])({
    me: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$trpc$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["protectedProcedure"].query(({ ctx })=>{
        if (!ctx.user) return null;
        return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$validators$2f$user$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["userSelectSchema"].parse(ctx.user);
    })
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/utils/env.ts [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "env": (()=>env)
});
const clientEnv = {
    VITE_ENABLE_STAGEWISE: process.env.NEXT_PUBLIC_ENABLE_STAGEWISE
};
const env = {
    DATABASE_URL: process.env.DATABASE_URL,
    CAS_SERVER_URL_PREFIX: process.env.CAS_SERVER_URL_PREFIX || 'https://autenticacao.ufba.br/ca',
    SERVER_URL: process.env.SERVER_URL || 'http://localhost:3000/api',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
    NODE_ENV: ("TURBOPACK compile-time value", "development"),
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || 'localhost',
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || 'minioadmin',
    MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME || 'monitoria-arquivos',
    EMAIL_USER: process.env.EMAIL_USER || '',
    EMAIL_PASS: process.env.EMAIL_PASS || '',
    ...clientEnv
};
}}),
"[externals]/drizzle-orm/node-postgres [external] (drizzle-orm/node-postgres, esm_import)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
const mod = await __turbopack_context__.y("drizzle-orm/node-postgres");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/pg [external] (pg, esm_import)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
const mod = await __turbopack_context__.y("pg");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/src/server/database/index.ts [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "db": (()=>db)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$env$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/env.ts [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$node$2d$postgres__$5b$external$5d$__$28$drizzle$2d$orm$2f$node$2d$postgres$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/drizzle-orm/node-postgres [external] (drizzle-orm/node-postgres, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/pg [external] (pg, esm_import)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/database/schema.ts [api] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$node$2d$postgres__$5b$external$5d$__$28$drizzle$2d$orm$2f$node$2d$postgres$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__
]);
([__TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$node$2d$postgres__$5b$external$5d$__$28$drizzle$2d$orm$2f$node$2d$postgres$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
;
;
const pool = new __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__["Pool"]({
    connectionString: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$env$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["env"].DATABASE_URL
});
const combinedSchema = {
    ...__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__
};
const db = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$node$2d$postgres__$5b$external$5d$__$28$drizzle$2d$orm$2f$node$2d$postgres$2c$__esm_import$29$__["drizzle"])(pool, {
    schema: combinedSchema
});
;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/web-next/src/server/routers/signature.ts [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "signatureRouter": (()=>signatureRouter)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$trpc$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web-next/src/server/trpc.ts [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$zod__$5b$external$5d$__$28$zod$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/zod [external] (zod, esm_import)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$index$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/database/index.ts [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/database/schema.ts [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/drizzle-orm [external] (drizzle-orm, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$trpc$2e$ts__$5b$api$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$zod__$5b$external$5d$__$28$zod$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$index$2e$ts__$5b$api$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$trpc$2e$ts__$5b$api$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$zod__$5b$external$5d$__$28$zod$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$index$2e$ts__$5b$api$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
;
;
;
const signatureRouter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$trpc$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["router"])({
    getProfile: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$trpc$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["protectedProcedure"].query(async ({ ctx })=>{
        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$index$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["db"].select({
            assinaturaDefault: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["userTable"].assinaturaDefault,
            dataAssinaturaDefault: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["userTable"].dataAssinaturaDefault
        }).from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["userTable"]).where((0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["userTable"].id, ctx.user.id)).then((r)=>r[0] || null);
    }),
    saveProfile: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$trpc$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$externals$5d2f$zod__$5b$external$5d$__$28$zod$2c$__esm_import$29$__["z"].object({
        signatureImage: __TURBOPACK__imported__module__$5b$externals$5d2f$zod__$5b$external$5d$__$28$zod$2c$__esm_import$29$__["z"].string().min(10)
    })).mutation(async ({ ctx, input })=>{
        const now = new Date();
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$index$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["db"].update(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["userTable"]).set({
            assinaturaDefault: input.signatureImage,
            dataAssinaturaDefault: now
        }).where((0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["userTable"].id, ctx.user.id));
        return {
            success: true
        };
    }),
    signProject: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$trpc$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$externals$5d2f$zod__$5b$external$5d$__$28$zod$2c$__esm_import$29$__["z"].object({
        projetoId: __TURBOPACK__imported__module__$5b$externals$5d2f$zod__$5b$external$5d$__$28$zod$2c$__esm_import$29$__["z"].number().int().positive(),
        signatureImage: __TURBOPACK__imported__module__$5b$externals$5d2f$zod__$5b$external$5d$__$28$zod$2c$__esm_import$29$__["z"].string().min(10),
        tipoAssinatura: __TURBOPACK__imported__module__$5b$externals$5d2f$zod__$5b$external$5d$__$28$zod$2c$__esm_import$29$__["z"].enum([
            'PROJETO_PROFESSOR_RESPONSAVEL',
            'PROJETO_COORDENADOR_DEPARTAMENTO'
        ])
    })).mutation(async ({ ctx, input })=>{
        // insere assinatura
        const [row] = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$index$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["db"].insert(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["assinaturaDocumentoTable"]).values({
            assinaturaData: input.signatureImage,
            tipoAssinatura: input.tipoAssinatura,
            userId: ctx.user.id,
            projetoId: input.projetoId
        }).returning({
            id: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["assinaturaDocumentoTable"].id
        });
        // atualiza status projeto
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$index$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["db"].update(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["projetoTable"]).set({
            status: 'PENDING_ADMIN_SIGNATURE'
        }).where((0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["projetoTable"].id, input.projetoId));
        return {
            success: true,
            signatureId: row.id
        };
    })
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/web-next/src/server/routers/_app.ts [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "appRouter": (()=>appRouter)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$trpc$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web-next/src/server/trpc.ts [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$routers$2f$auth$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web-next/src/server/routers/auth.ts [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$routers$2f$signature$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web-next/src/server/routers/signature.ts [api] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$trpc$2e$ts__$5b$api$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$routers$2f$auth$2e$ts__$5b$api$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$routers$2f$signature$2e$ts__$5b$api$5d$__$28$ecmascript$29$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$trpc$2e$ts__$5b$api$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$routers$2f$auth$2e$ts__$5b$api$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$routers$2f$signature$2e$ts__$5b$api$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
;
const appRouter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$trpc$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["router"])({
    health: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$trpc$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["publicProcedure"].query(()=>'ok'),
    auth: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$routers$2f$auth$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["authRouter"],
    signature: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$routers$2f$signature$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["signatureRouter"]
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/cookie [external] (cookie, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("cookie", () => require("cookie"));

module.exports = mod;
}}),
"[project]/src/utils/types.ts [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "LUCIA_SESSION_COOKIE_NAME": (()=>LUCIA_SESSION_COOKIE_NAME)
});
const LUCIA_SESSION_COOKIE_NAME = 'session';
}}),
"[externals]/@lucia-auth/adapter-drizzle [external] (@lucia-auth/adapter-drizzle, esm_import)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
const mod = await __turbopack_context__.y("@lucia-auth/adapter-drizzle");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/lucia [external] (lucia, esm_import)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
const mod = await __turbopack_context__.y("lucia");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/src/server/lib/auth.ts [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "lucia": (()=>lucia)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$env$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/env.ts [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$types$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/types.ts [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$lucia$2d$auth$2f$adapter$2d$drizzle__$5b$external$5d$__$2840$lucia$2d$auth$2f$adapter$2d$drizzle$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/@lucia-auth/adapter-drizzle [external] (@lucia-auth/adapter-drizzle, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$lucia__$5b$external$5d$__$28$lucia$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/lucia [external] (lucia, esm_import)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$index$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/database/index.ts [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/database/schema.ts [api] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f40$lucia$2d$auth$2f$adapter$2d$drizzle__$5b$external$5d$__$2840$lucia$2d$auth$2f$adapter$2d$drizzle$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$lucia__$5b$external$5d$__$28$lucia$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$index$2e$ts__$5b$api$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__
]);
([__TURBOPACK__imported__module__$5b$externals$5d2f40$lucia$2d$auth$2f$adapter$2d$drizzle__$5b$external$5d$__$2840$lucia$2d$auth$2f$adapter$2d$drizzle$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$lucia__$5b$external$5d$__$28$lucia$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$index$2e$ts__$5b$api$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
;
;
;
;
const isProduction = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$env$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["env"].NODE_ENV === 'production';
const adapter = new __TURBOPACK__imported__module__$5b$externals$5d2f40$lucia$2d$auth$2f$adapter$2d$drizzle__$5b$external$5d$__$2840$lucia$2d$auth$2f$adapter$2d$drizzle$2c$__esm_import$29$__["DrizzlePostgreSQLAdapter"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$index$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["db"], __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["sessionTable"], __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["userTable"]);
const lucia = new __TURBOPACK__imported__module__$5b$externals$5d2f$lucia__$5b$external$5d$__$28$lucia$2c$__esm_import$29$__["Lucia"](adapter, {
    sessionExpiresIn: new __TURBOPACK__imported__module__$5b$externals$5d2f$lucia__$5b$external$5d$__$28$lucia$2c$__esm_import$29$__["TimeSpan"](30, 'd'),
    sessionCookie: {
        name: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$types$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["LUCIA_SESSION_COOKIE_NAME"],
        expires: false,
        attributes: {
            secure: isProduction,
            sameSite: 'lax',
            path: '/'
        }
    },
    getUserAttributes: (attributes)=>{
        return {
            username: attributes.username,
            email: attributes.email,
            role: attributes.role
        };
    }
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/utils/lucia.ts [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "getSessionId": (()=>getSessionId)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$lib$2f$auth$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/lib/auth.ts [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$cookie__$5b$external$5d$__$28$cookie$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/cookie [external] (cookie, cjs)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$lib$2f$auth$2e$ts__$5b$api$5d$__$28$ecmascript$29$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$lib$2f$auth$2e$ts__$5b$api$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
const getSessionId = (headers)=>{
    const cookies = __TURBOPACK__imported__module__$5b$externals$5d2f$cookie__$5b$external$5d$__$28$cookie$2c$__cjs$29$__["default"].parse(headers.get('Cookie') || '');
    const sessionId = cookies[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$lib$2f$auth$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["lucia"].sessionCookieName];
    return sessionId;
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/web-next/src/server/context.ts [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "createContext": (()=>createContext)
});
var __TURBOPACK__imported__module__$5b$externals$5d2f$cookie__$5b$external$5d$__$28$cookie$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/cookie [external] (cookie, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$lib$2f$auth$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/lib/auth.ts [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$lucia$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/lucia.ts [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$index$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/database/index.ts [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/database/schema.ts [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/drizzle-orm [external] (drizzle-orm, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$lib$2f$auth$2e$ts__$5b$api$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$lucia$2e$ts__$5b$api$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$index$2e$ts__$5b$api$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$lib$2f$auth$2e$ts__$5b$api$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$lucia$2e$ts__$5b$api$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$index$2e$ts__$5b$api$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
;
;
;
;
async function createContext({ req, res }) {
    // TODO: integrate lucia session cookie verification; stub for now
    const cookies = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$cookie__$5b$external$5d$__$28$cookie$2c$__cjs$29$__["parse"])(req.headers.cookie || '');
    const sessionId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$lucia$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getSessionId"])(new Headers(req.headers));
    let currentUser = null;
    if (sessionId) {
        const { session, user } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$lib$2f$auth$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["lucia"].validateSession(sessionId);
        if (session && user) {
            // fetch role from DB
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$index$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["db"].select({
                role: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["userTable"].role
            }).from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["userTable"]).where((0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$database$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["userTable"].id, user.id)).limit(1);
            const role = res[0]?.role;
            currentUser = {
                id: user.id,
                username: user.username,
                email: user.email,
                role
            };
        }
    }
    return {
        user: currentUser
    };
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/web-next/pages/api/trpc/[trpc].ts [api] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$adapters$2f$next$2e$mjs__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@trpc/server/dist/adapters/next.mjs [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$routers$2f$_app$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web-next/src/server/routers/_app.ts [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$context$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web-next/src/server/context.ts [api] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$routers$2f$_app$2e$ts__$5b$api$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$context$2e$ts__$5b$api$5d$__$28$ecmascript$29$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$routers$2f$_app$2e$ts__$5b$api$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$context$2e$ts__$5b$api$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$adapters$2f$next$2e$mjs__$5b$api$5d$__$28$ecmascript$29$__["createNextApiHandler"])({
    router: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$routers$2f$_app$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["appRouter"],
    createContext: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2d$next$2f$src$2f$server$2f$context$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["createContext"]
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__29040c9b._.js.map