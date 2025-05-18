
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, Upload } from "lucide-react";





export const Route = createFileRoute("/aluno/profile")({
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
            Adicione todas as suas informações para preenchimento automático em inscrições
          </p>
        </section>

        {/* Dados Pessoais */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">👤 Dados Pessoais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Campo label="Nome Completo" id="nome" placeholder="Digite seu nome completo" />
            <Campo label="Matrícula" id="matricula" placeholder="Digite sua matrícula" />
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
function Campo({ label, id, placeholder }: { label: string; id: string; placeholder: string }) {
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
