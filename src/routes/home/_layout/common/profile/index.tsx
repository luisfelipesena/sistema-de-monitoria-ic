'use client';

import { PagesLayout } from '@/components/layout/PagesLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createFileRoute } from '@tanstack/react-router';
import { Eye, Upload } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/home/_layout/common/profile/')({
  component: PerfilAluno,
});

function PerfilAluno() {
  return (
    <>
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-10 space-y-12">
        {/* Cabeçalho */}
        <section>
          <h1 className="text-3xl font-bold">Seu perfil</h1>
          <p className="text-muted-foreground mt-2">
            Adicione todas as suas informações para preenchimento automático em
            inscrições
          </p>
        </section>

        {/* Dados Pessoais */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">👤 Dados Pessoais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Campo
              label="Nome Completo"
              id="nome"
              placeholder="Digite seu nome completo"
            />
            <Campo
              label="Matrícula"
              id="matricula"
              placeholder="Digite sua matrícula"
            />
            <Campo label="CPF" id="cpf" placeholder="Digite seu CPF" />
            <Campo label="E-mail" id="email" placeholder="Digite seu e-mail" />
          </div>
        </section>

        {/* Documentos */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">📄 Documentos</h2>

          <Card className="p-4 flex items-center justify-between">
            <span className="font-medium">Histórico Escolar</span>
            <AcoesDocumento />
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div>
              <span className="font-medium">Comprovante de Matrícula</span>
              <p className="text-sm text-muted-foreground mt-1">
                <Badge variant="secondary">Última atualização: 02/2025</Badge>
              </p>
            </div>
            <AcoesDocumento />
          </Card>
        </section>
      </main>
    </>
  );
}

// Subcomponentes
function Campo({
  label,
  id,
  placeholder,
}: {
  label: string;
  id: string;
  placeholder: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} placeholder={placeholder} />
    </div>
  );
}

function AcoesDocumento() {
  return (
    <div className="flex gap-2">
      <Button variant="outline">
        <Upload className="w-4 h-4 mr-2" />
        Atualizar arquivo
      </Button>
      <Button variant="secondary">
        <Eye className="w-4 h-4 mr-2" />
        Visualizar
      </Button>
    </div>
  );
}

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
    <PagesLayout
      title="Meu Perfil"
      subtitle="Gerencie suas informações pessoais."
    >
      <div className="p-6 bg-white rounded-lg shadow space-y-6">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Dados Pessoais
          </h2>
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
