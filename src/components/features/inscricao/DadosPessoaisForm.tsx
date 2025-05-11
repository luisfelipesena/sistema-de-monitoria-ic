import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React from 'react'

interface DadosPessoaisFormProps {
  // Pode adicionar props
}

const DadosPessoaisForm: React.FC<DadosPessoaisFormProps> = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Dados Pessoais</h2>
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="nomeCompleto">Nome Completo</Label>
          <Input
            type="text"
            name="nomeCompleto"
            id="nomeCompleto"
            autoComplete="name"
            placeholder="Digite seu nome completo"
          />
        </div>

        <div>
          <Label htmlFor="matricula">Matrícula</Label>
          <Input
            type="text"
            name="matricula"
            id="matricula"
            placeholder="Digite sua matrícula"
          />
        </div>

        <div>
          <Label htmlFor="cpf">CPF</Label>
          <Input
            type="text"
            name="cpf"
            id="cpf"
            placeholder="Digite seu CPF"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            type="email"
            name="email"
            id="email"
            autoComplete="email"
            placeholder="Digite seu e-mail"
          />
        </div>
      </div>
    </div>
  )
}

export default DadosPessoaisForm
