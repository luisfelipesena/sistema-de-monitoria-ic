import { useAuth } from '@//hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createFileRoute } from '@tanstack/react-router';

import { Calendar, Link as LinkIcon, List, User, Users } from 'lucide-react';

export const Route = createFileRoute('/home/_layout/dashboard/student/')({
  component: DashboardStudent,
});

function DashboardStudent() {
  // Mock data for dashboard
  const dashboard = [
    {
      id: 1,
      disciplina: 'MATA55',
      professor: 'George R.R Martin',
      tipo: 'Voluntário',
      status: 'Aprovado',
      vagas: 10,
      dashboardUrl: 'https://abc.in',
    },
    {
      id: 2,
      disciplina: 'MATC84',
      professor: 'Markus Suzak',
      tipo: 'Bolsista',
      status: 'Finalizado',
      vagas: 5,
      dashboardUrl: 'https://abc.in',
    },
    {
      id: 3,
      disciplina: 'MATA55',
      professor: 'Ankur Warikoo',
      tipo: 'Voluntário',
      status: 'Em analise',
      vagas: 5,
      dashboardUrl: 'https://abc.in',
    },
    {
      id: 4,
      disciplina: 'MATA53',
      professor: 'Jodi Picoult',
      tipo: 'Bolsista',
      status: 'Inscrito',
      vagas: 5,
      dashboardUrl: 'https://abc.in',
    },
    {
      id: 5,
      disciplina: 'MATA37',
      professor: 'James Clear',
      tipo: 'Bolsista',
      status: 'Inscrito',
      vagas: 5,
      dashboardUrl: 'https://abc.in',
    },
    {
      id: 6,
      disciplina: 'MATA50',
      professor: 'Frank Herbert',
      tipo: 'Voluntário',
      status: 'Inscrito',
      vagas: 12,
      dashboardUrl: 'https://abc.in',
    },
  ];

  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome message */}
      <h1 className="text-5xl font-bold mb-8">
        Olá, {user?.username || 'Usuário'}!
      </h1>

      {/* Tabela padronizada */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-normal">Seu Dashboard</h2>

        <div className="flex gap-4">
          <Button
            variant="primary"
            className="bg-[#1B2A50] text-white hover:bg-[#24376c] transition-colors"
          >
            + Ver lista de editais abertos
          </Button>
          <Button variant="disabled" className="text-gray-600">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6h18M6 16h12"
              />
            </svg>
            Filtros
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="border-b">
              <th className="h-14 px-4 text-left font-bold text-lg text-gray-900 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <List className="h-5 w-5 text-gray-400" />
                  Componente curricular
                </div>
              </th>
              <th className="h-14 px-4 text-left font-bold text-lg text-gray-900 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-400" />
                  Docente
                </div>
              </th>
              <th className="h-14 px-4 text-left font-bold text-lg text-gray-900 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <List className="h-5 w-5 text-gray-400" />
                  Tipo
                </div>
              </th>
              <th className="h-14 px-4 text-center font-bold text-lg text-gray-900 whitespace-nowrap">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  Status
                </div>
              </th>
              <th className="h-14 px-4 text-center font-bold text-lg text-gray-900 whitespace-nowrap">
                <div className="flex items-center justify-center gap-2">
                  <Users className="h-5 w-5 text-gray-400" />
                  Nº de vagas
                </div>
              </th>
              <th className="h-14 px-4 text-left font-bold text-lg text-gray-900 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-gray-400" />
                  Pagina da Vaga
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {dashboard.map((dashboard) => (
              <tr
                key={dashboard.id}
                className="border-b last:border-0 hover:bg-gray-50 transition-colors"
              >
                <td className="p-4 align-middle font-semibold text-base text-gray-900">
                  {dashboard.disciplina}
                </td>
                <td className="p-4 align-middle text-base">
                  {dashboard.professor}
                </td>
                <td className="p-4 align-middle">
                  {dashboard.tipo === 'Voluntário' ? (
                    <Badge variant="volunteer" rounded="full">
                      Voluntário
                    </Badge>
                  ) : (
                    <Badge variant="info" rounded="full">
                      Bolsista
                    </Badge>
                  )}
                </td>
                <td className="p-4 align-middle text-center">
                  {dashboard.status === 'Aprovado' ? (
                    <Badge variant="success">Aprovado</Badge>
                  ) : dashboard.status === 'Finalizado' ? (
                    <Badge variant="destructive">Finalizado</Badge>
                  ) : dashboard.status === 'Em analise' ? (
                    <Badge variant="warning">Em analise</Badge>
                  ) : (
                    <Badge variant="muted">Inscrito</Badge>
                  )}
                </td>
                <td className="p-4 align-middle text-center text-base">
                  {dashboard.vagas}
                </td>
                <td className="p-4 align-middle">
                  <a
                    href={dashboard.dashboardUrl}
                    className="text-primary hover:underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {dashboard.dashboardUrl}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DashboardStudent;
