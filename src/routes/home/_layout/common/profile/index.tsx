'use client';

import { useState } from 'react';
import { PagesLayout } from '@/components/layout/PagesLayout';
import { createFileRoute } from '@tanstack/react-router';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { professorRelations } from '@/server/database/schema';
import { alunoInputSchema } from '@/routes/api/aluno/-types';

export const Route = createFileRoute('/home/_layout/common/profile/')({
  component: ProfileComponent,
});

// informações ficitícias vamos atualizar com as do usuário, os campos vao variar para professor,coordenador e aluno
function ProfileComponent() {
  const [isEditavel, setIsEditavel] = useState(false);
  const [dados, setDados] = useState({
    nomeCompleto: 'João da Silva',
    matricula: '20230001',
    cpf: '123.456.789-00',
    email: 'joao.silva@email.com',
  });

  const [backup, setBackup] = useState(dados);

  const handleChange = (campo: keyof typeof dados, valor: string) => {
    setDados((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleEditar = () => {
    setBackup(dados);
    setIsEditavel(true);
  };

  const handleCancelar = () => {
    setDados(backup);
    setIsEditavel(false);
  };
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const filteredValue = value.replace(/\D/g, ''); 
    handleChange('cpf', filteredValue); 
  };
  const handleSalvar = () => {
    console.log('Dados salvos:', dados);
    setIsEditavel(false);
  };

  return (
    <PagesLayout title="Meu Perfil"
          subtitle="Gerencie suas informações pessoais.">
      <div className="p-6 bg-white rounded-lg shadow space-y-6">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Dados Pessoais</h2>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="nomeCompleto">Nome Completo</Label>
              <Input
                id="nomeCompleto"
                value={dados.nomeCompleto}
                onChange={(e) => handleChange('nomeCompleto', e.target.value)}
                disabled={!isEditavel}
              />
            </div>

            <div>
              <Label htmlFor="matricula">Matrícula</Label>
              <Input
                id="matricula"
                value={dados.matricula}
                onChange={(e) => handleChange('matricula', e.target.value)}
                disabled={!isEditavel}
              />
            </div>

            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={dados.cpf}
                onChange={handleNumberChange} 
                disabled={!isEditavel}
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={dados.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={true}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          {isEditavel ? (
            <>
              <button
                onClick={handleCancelar}
                className="px-4 py-1 rounded-full bg-red-600 text-white text-sm hover:opacity-90 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                className="px-4 py-1 rounded-full bg-green-600 text-white text-sm hover:opacity-90 transition"
              >
                Salvar
              </button>
            </>
          ) : (
            <button
              onClick={handleEditar}
              className="px-4 py-1 rounded-full bg-[#1B4377] text-white text-sm hover:opacity-90 transition"
            >
              Editar
            </button>
          )}
        </div>
      </div>
    </PagesLayout>
  );
}
