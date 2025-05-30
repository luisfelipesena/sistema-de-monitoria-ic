'use client';

import { ProjectForm } from '@/components/features/projects/ProjectForm';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/home/_layout/professor/_layout/projects')({
  component: ProfessorProjectsComponent,
});

function ProfessorProjectsComponent() {
  return <ProjectForm />;
}