import { cn } from '@/lib/utils'
import React from 'react'

type Vaga = {
  id: string
  nome: string
  codigo: string
  tipo: 'Voluntários' | 'Bolsistas'
  vagas: number
  selecionado: boolean
}

interface SelecaoDeVagaTableProps {
  vagas: Vaga[]
  onSelecionar: (id: string) => void
}

const tipoStyle: Record<Vaga['tipo'], string> = {
  Voluntários: 'bg-indigo-100 text-indigo-800',
  Bolsistas: 'bg-blue-100 text-blue-800',
}

const SelecaoDeVagaTable: React.FC<SelecaoDeVagaTableProps> = ({ vagas, onSelecionar }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Seleção da Vaga</h2>
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Componente Curricular</th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Código</th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Tipo</th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Vagas</th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vagas.map((vaga) => (
              <tr key={vaga.id}>
                <td className="px-6 py-4">{vaga.nome}</td>
                <td className="px-6 py-4">{vaga.codigo}</td>
                <td className="px-6 py-4">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', tipoStyle[vaga.tipo])}>
                    {vaga.tipo}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">{vaga.vagas}</td>
                <td className="px-6 py-4">
                  {vaga.selecionado ? (
                    <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full bg-[#D1D5DB] text-white text-sm cursor-default"> Selecionado</span>
                  ) : (
                    <button
                      onClick={() => onSelecionar(vaga.id)}
                      className= "flex items-center gap-1 px-4 py-1 rounded-full bg-[#1B4377] text-white text-sm hover:opacity-90 transition"
                    >
                      Selecionar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SelecaoDeVagaTable