import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useAluno } from '@/hooks/use-aluno';
import { useAuth } from '@/hooks/use-auth';
import React from 'react';

interface DadosPessoaisFormProps {
  // Pode adicionar props
}

const DadosPessoaisForm: React.FC<DadosPessoaisFormProps> = () => {
  const { user } = useAuth();
  const { data: aluno, isLoading } = useAluno();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Dados Pessoais</h2>
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">1. Dados Pessoais</h2>
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="nomeCompleto">Nome Completo</Label>
          <Input
            type="text"
            name="nomeCompleto"
            id="nomeCompleto"
            value={aluno?.nomeCompleto || ''}
            disabled
            className="bg-gray-50"
          />
        </div>

        <div>
          <Label htmlFor="matricula">Matrícula</Label>
          <Input
            type="text"
            name="matricula"
            id="matricula"
            value={aluno?.matricula || ''}
            disabled
            className="bg-gray-50"
          />
        </div>

        <div>
          <Label htmlFor="cpf">CPF</Label>
          <Input
            type="text"
            name="cpf"
            id="cpf"
            value={aluno?.cpf || ''}
            disabled
            className="bg-gray-50"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            type="email"
            name="email"
            id="email"
            value={user?.email || ''}
            disabled
            className="bg-gray-50"
          />
        </div>
      </div>
    </div>
  );
};

export default DadosPessoaisForm;
