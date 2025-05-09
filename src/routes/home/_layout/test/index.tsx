import { Button } from '@/components/ui/button';
import { createFileRoute } from '@tanstack/react-router';
import { Eye } from 'lucide-react';

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

      {/* Main heading */}
      <h2 className="text-2xl font-normal mb-6">
        Todos os editais abertos para monitoria com bolsa e voluntários
      </h2>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="h-12 px-4 text-left font-medium text-slate-500">
                <div className="flex items-center gap-2">
                  <span>Componente curricular</span>
                </div>
              </th>
              <th className="h-12 px-4 text-left font-medium text-slate-500">
                <div className="flex items-center gap-2">
                  <span>Docente</span>
                </div>
              </th>
              <th className="h-12 px-4 text-left font-medium text-slate-500">
                <div className="flex items-center gap-2">
                  <span>Tipo</span>
                </div>
              </th>
              <th className="h-12 px-4 text-center font-medium text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <span>Data Limite</span>
                </div>
              </th>
              <th className="h-12 px-4 text-center font-medium text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <span>Nº de vagas</span>
                </div>
              </th>
              <th className="h-12 px-4 text-left font-medium text-slate-500">
                <div className="flex items-center gap-2">
                  <span>Edital</span>
                </div>
              </th>
              <th className="h-12 px-4 text-left font-medium text-slate-500">
                <div className="flex items-center gap-2">
                  <span>Ações</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {editais.map((edital) => (
              <tr
                key={edital.id}
                className="border-b transition-colors hover:bg-slate-50"
              >
                <td className="p-4 align-middle font-medium">
                  {edital.disciplina}
                </td>
                <td className="p-4 align-middle">{edital.professor}</td>
                <td className="p-4 align-middle">{edital.tipo}</td>
                <td className="p-4 align-middle text-center">
                  <div className="inline-flex items-center justify-center rounded-md bg-slate-100 px-2.5 py-0.5">
                    {edital.dataLimite}
                  </div>
                </td>
                <td className="p-4 align-middle text-center">{edital.vagas}</td>
                <td className="p-4 align-middle">
                  <a
                    href={edital.editalUrl}
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {edital.editalUrl}
                  </a>
                </td>
                <td className="p-4 align-middle">
                  <Button variant="secondary" size="sm">
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
