import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createFileRoute } from '@tanstack/react-router';
import {
  Calendar,
  Eye,
  Link as LinkIcon,
  List,
  User,
  Users,
} from 'lucide-react';

export const Route = createFileRoute('/home/_layout/test/')({
  component: HomePage,
});

function HomePage() {
  // Mock data for editais
  const editais = [
    {
      id: 1,
      disciplina: 'MATA55',
      professor: 'George R.R Martin',
      tipo: 'Voluntário',
      dataLimite: '02/04/2025',
      vagas: 10,
      editalUrl: 'https://abc.in',
    },
    {
      id: 2,
      disciplina: 'MATC84',
      professor: 'Markus Suzak',
      tipo: 'Bolsista',
      dataLimite: '02/04/2025',
      vagas: 5,
      editalUrl: 'https://abc.in',
    },
    {
      id: 3,
      disciplina: 'MATA55',
      professor: 'Ankur Warikoo',
      tipo: 'Voluntário',
      dataLimite: '02/04/2025',
      vagas: 5,
      editalUrl: 'https://abc.in',
    },
    {
      id: 4,
      disciplina: 'MATA53',
      professor: 'Jodi Picoult',
      tipo: 'Bolsista',
      dataLimite: '02/04/2025',
      vagas: 5,
      editalUrl: 'https://abc.in',
    },
    {
      id: 5,
      disciplina: 'MATA37',
      professor: 'James Clear',
      tipo: 'Bolsista',
      dataLimite: '02/04/2025',
      vagas: 5,
      editalUrl: 'https://abc.in',
    },
    {
      id: 6,
      disciplina: 'MATA50',
      professor: 'Frank Herbert',
      tipo: 'Voluntário',
      dataLimite: '02/04/2025',
      vagas: 12,
      editalUrl: 'https://abc.in',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome message */}
      <h1 className="text-5xl font-bold mb-8">Olá, Bruno Mota</h1>

      {/* Tabela padronizada */}
      <h2 className="text-2xl font-normal mb-6">
        Todos os editais abertos para monitoria com bolsa e voluntários
      </h2>
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
                  Data Limite
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
                  Edital
                </div>
              </th>
              <th className="h-14 px-4 text-left font-bold text-lg text-gray-900 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-gray-400" />
                  Ações
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {editais.map((edital) => (
              <tr
                key={edital.id}
                className="border-b last:border-0 hover:bg-gray-50 transition-colors"
              >
                <td className="p-4 align-middle font-semibold text-base text-gray-900">
                  {edital.disciplina}
                </td>
                <td className="p-4 align-middle text-base">
                  {edital.professor}
                </td>
                <td className="p-4 align-middle">
                  {edital.tipo === 'Voluntário' ? (
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
                  {edital.dataLimite}
                </td>
                <td className="p-4 align-middle text-center text-base">
                  {edital.vagas}
                </td>
                <td className="p-4 align-middle">
                  <a
                    href={edital.editalUrl}
                    className="text-primary hover:underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {edital.editalUrl}
                  </a>
                </td>
                <td className="p-4 align-middle">
                  <Button
                    variant="primary"
                    size="sm"
                    className="rounded-full flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    Inscrever
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HomePage;
