'use client';

import { useAuth } from '@/hooks/use-auth';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/home/_layout/profile/')({
  component: ProfileComponent,
});

const editais = [
  {
    componente: 'MATA55',
    docente: 'George R.R. Mc',
    tipo: 'Voluntário',
    data: '02/04/2025',
    vagas: 10,
    edital: 'https://abc.ir',
  },
  {
    componente: 'MATC84',
    docente: 'Markus Suzak',
    tipo: 'Bolsista',
    data: '02/04/2025',
    vagas: 5,
    edital: 'https://abc.ir',
  },
  {
    componente: 'MATA55',
    docente: 'Ankur Warikoo',
    tipo: 'Voluntário',
    data: '02/04/2025',
    vagas: 5,
    edital: 'https://abc.ir',
  },
  {
    componente: 'MATA53',
    docente: 'Jodi Picoult',
    tipo: 'Bolsista',
    data: '02/04/2025',
    vagas: 5,
    edital: 'https://abc.ir',
  },
  {
    componente: 'MATA37',
    docente: 'James Clear',
    tipo: 'Bolsista',
    data: '02/04/2025',
    vagas: 5,
    edital: 'https://abc.ir',
  },
  {
    componente: 'MATA50',
    docente: 'Frank Herbert',
    tipo: 'Voluntário',
    data: '02/04/2025',
    vagas: 12,
    edital: 'https://abc.ir',
  },
];

function ProfileComponent() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">
        Olá, {user?.username || 'Usuário'}
      </h1>
      <p>Todos os editais abertos para monitoria com bolsa e voluntários</p>
      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200 bg-white text-sm text-gray-700">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">
                Componente curricular
              </th>
              <th className="px-4 py-3 text-left font-semibold">Docente</th>
              <th className="px-4 py-3 text-left font-semibold">Tipo</th>
              <th className="px-4 py-3 text-left font-semibold">Data Limite</th>
              <th className="px-4 py-3 text-left font-semibold">Nº de vagas</th>
              <th className="px-4 py-3 text-left font-semibold">Edital</th>
              <th className="px-4 py-3 text-left font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {editais.map((v, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">{v.componente}</td>
                <td className="px-4 py-3">{v.docente}</td>
                <td className="px-4 py-3">{v.tipo}</td>
                <td className="px-4 py-3">{v.data}</td>
                <td className="px-4 py-3">{v.vagas}</td>
                <td className="px-4 py-3">
                  <a
                    href={v.edital}
                    className="text-blue-600 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {v.edital}
                  </a>
                </td>
                <td className="px-4 py-3">
                  <button className="rounded-full bg-blue-500 text-white px-4 py-1 text-sm hover:bg-blue-600 transition">
                    Inscrever
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
