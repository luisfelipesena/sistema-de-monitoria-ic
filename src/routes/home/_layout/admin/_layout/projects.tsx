'use client';

import { ProjectForm } from '@/components/features/projects/ProjectForm';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/home/_layout/admin/_layout/projects')({
  component: ProjectsComponent,
});

function ProjectsComponent() {
  return <ProjectForm />;
}
