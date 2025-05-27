# Project Refactoring Plan: Portuguese to English Naming Standardization

## Overview

This document outlines the systematic refactoring of the entire project to standardize naming conventions from Portuguese to English, while maintaining Portuguese user-facing text.

## Current State Analysis

### Database Schema (Portuguese → English)

**Tables & Variables (Current → Target):**

- `departamentoTable` → `departmentTable`
- `projetoTable` → `projectTable`
- `professorTable` → `teacherTable`
- `alunoTable` → `studentTable`
- `disciplinaTable` → `subjectTable`
- `inscricaoTable` → `applicationTable`
- `periodoInscricaoTable` → `applicationPeriodTable`
- `vagaTable` → `positionTable`
- `atividadeProjetoTable` → `projectActivityTable`
- `projetoDisciplinaTable` → `projectSubjectTable`
- `projetoProfessorParticipanteTable` → `projectParticipantTeacherTable`

**Enums (Current → Target):**

- `semestreEnum` → `semesterEnum`
- `tipoProposicaoEnum` → `proposalTypeEnum`
- `tipoVagaEnum` → `positionTypeEnum`
- `projetoStatusEnum` → `projectStatusEnum`
- `generoEnum` → `genderEnum`
- `regimeEnum` → `workRegimeEnum`
- `tipoInscricaoEnum` → `applicationTypeEnum`
- `statusInscricaoEnum` → `applicationStatusEnum`

**Field Properties (Examples):**

- `nomeCompleto` → `fullName`
- `emailInstitucional` → `institutionalEmail`
- `cargaHorariaSemana` → `weeklyHours`
- `numeroSemanas` → `numberOfWeeks`
- `publicoAlvo` → `targetAudience`
- `professorResponsavelId` → `responsibleTeacherId`

### API Routes (Portuguese → English)

**Current Structure:**

```
src/routes/api/
├── projeto/ → project/
├── inscricao/ → application/
├── monitoria/ → monitoring/
├── periodo-inscricao/ → application-period/
├── professor/ → teacher/
├── aluno/ → student/
├── disciplina/ → subject/
├── curso/ (already English)
├── departamento/ → department/
└── analytics/ (already English)
```

### Frontend Components & Hooks

- Components using Portuguese naming in props/state
- Hooks with Portuguese naming (e.g., `use-monitoria.ts`)
- Type definitions with Portuguese names

## Refactoring Strategy

### Phase 1: Database Schema Backwards Compatibility

✅ **Status: COMPLETED**

- Created `schema-refactored.ts` with English naming
- Maintained Portuguese database column names for DB compatibility
- Added backwards compatibility aliases in main schema

### Phase 2: API Routes Refactoring

**Status: NEXT**

**Approach:**

1. **Incremental Route Renaming:**

   - Rename directories: `projeto/` → `project/`
   - Update all imports in API files
   - Update route definitions and types
   - Update client-side API calls

2. **Route Mapping:**
   ```typescript
   // Route mappings for systematic updates
   const routeMap = {
     projeto: 'project',
     inscricao: 'application',
     monitoria: 'monitoring',
     'periodo-inscricao': 'application-period',
     professor: 'teacher',
     aluno: 'student',
     disciplina: 'subject',
     departamento: 'department',
   };
   ```

### Phase 3: Type Definitions Update

**Files to Update:**

- `src/routes/api/*/types.ts` files
- Component prop interfaces
- Hook return types
- Validation schemas (Zod)

### Phase 4: Frontend Components & Hooks

**Components:**

- Update prop naming in all components
- Refactor state variable names
- Update component file names if needed

**Hooks:**

- Rename hook files (`use-monitoria.ts` → `use-monitoring.ts`)
- Update hook internal naming
- Update hook exports and imports

### Phase 5: Import References Update

**Files to scan and update:**

- All TypeScript/TSX files importing old names
- Route tree generation
- Component imports
- Hook imports

## Implementation Priority

### High Priority (Breaking Changes)

1. API route directory renaming
2. Schema import updates
3. Type definition updates

### Medium Priority (Internal Naming)

1. Component prop/state naming
2. Hook internal variables
3. Function parameter names

### Low Priority (Non-breaking)

1. Comment translations
2. Variable name cleanup
3. Documentation updates

## Backwards Compatibility Strategy

### Database Level

- Maintain Portuguese column names in database
- Use English property names in TypeScript interfaces
- Database migrations not required

### API Level

- Consider maintaining Portuguese route aliases temporarily
- Update client imports systematically
- Use English naming for new development

### Frontend Level

- Update component props to English
- Maintain Portuguese user-facing text
- Update internal state management

## Risk Mitigation

### Testing Strategy

- Run existing test suite after each phase
- Verify API endpoints still respond correctly
- Check frontend functionality remains intact

### Rollback Plan

- Git branching for each phase
- Incremental commits for easy rollback
- Keep backwards compatibility aliases until full migration

## Success Criteria

### Technical

- [ ] All API routes use English naming
- [ ] All TypeScript interfaces use English properties
- [ ] All components use English prop/state names
- [ ] All hooks use English naming
- [ ] Backwards compatibility maintained

### Functional

- [ ] All existing functionality works
- [ ] No user-facing Portuguese text affected
- [ ] Database queries continue to work
- [ ] All tests pass

## Next Steps

1. **Immediate:** Start API route directory renaming
2. **Short-term:** Update imports and type definitions
3. **Medium-term:** Refactor components and hooks
4. **Long-term:** Remove backwards compatibility aliases

## Notes

- Database column names remain Portuguese for compatibility
- User-facing text (labels, messages) stays in Portuguese
- Only code-level naming changes to English
- Systematic approach reduces risk of breaking changes
- Incremental commits allow for rollback if needed
