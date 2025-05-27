'use client';

import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: LandingPageComponent,
});

function LandingPageComponent() {
  const { signIn } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[hsl(195,71%,95%)] to-white">
      <header className="sticky top-0 z-10 p-4 border-b bg-white/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between mx-auto">
          <div className="flex items-center gap-2">
            <img
              src="/images/ic-logo-clean.png"
              alt="Monitoria IC"
              className="h-12 w-12"
            />
            <span className="text-xl font-bold text-[hsl(195,71%,40%)]">
              Sistema de Monitoria IC
            </span>
          </div>
          <Button onClick={signIn}>Entrar com Email UFBA</Button>
        </div>
      </header>

      <main className="container px-4 py-16 mx-auto max-w-6xl flex-grow">
        <section className="mb-20">
          <div className="flex flex-col gap-10 items-center text-center mb-16">
            <h1 className="text-4xl font-bold h1 text-[hsl(210,40%,20%)]">
              Sistema de Monitoria IC
            </h1>
            <p className="text-lg p text-gray-600 max-w-3xl mx-auto">
              Simplifique o processo de inscrição, seleção e gerenciamento de
              monitores para projetos acadêmicos da UFBA.
            </p>
            <Button size="lg" onClick={signIn}>
              Entrar com Email UFBA
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="mb-3 text-xl font-semibold text-[hsl(210,40%,20%)]">
                Para Professores
              </h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Criar e gerenciar projetos</li>
                <li>• Selecionar candidatos</li>
                <li>• Definir vagas voluntárias</li>
                <li>• Assinar documentos digitalmente</li>
              </ul>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="mb-3 text-xl font-semibold text-[hsl(210,40%,20%)]">
                Para Alunos
              </h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Visualizar projetos disponíveis</li>
                <li>• Inscrever-se em projetos</li>
                <li>• Acompanhar status das candidaturas</li>
                <li>• Aceitar ou recusar ofertas</li>
              </ul>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="mb-3 text-xl font-semibold text-[hsl(210,40%,20%)]">
                Para Administradores
              </h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Aprovar ou rejeitar projetos</li>
                <li>• Gerenciar editais e períodos</li>
                <li>• Definir vagas com bolsa</li>
                <li>• Administrar usuários e relatórios</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-[hsl(210,40%,20%)] mb-8">
            Fluxo do Processo
          </h2>
          <div className="bg-white p-8 rounded-lg shadow-md">
            <ol className="relative border-l border-gray-200">
              <li className="mb-10 ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-white rounded-full -left-3 ring-8 ring-white">
                  1
                </span>
                <h3 className="font-semibold text-[hsl(210,40%,20%)]">
                  Proposta do Projeto
                </h3>
                <p className="text-gray-600">
                  Professores criam e submetem propostas de projetos de
                  monitoria para aprovação.
                </p>
              </li>
              <li className="mb-10 ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-white rounded-full -left-3 ring-8 ring-white">
                  2
                </span>
                <h3 className="font-semibold text-[hsl(210,40%,20%)]">
                  Aprovação Administrativa
                </h3>
                <p className="text-gray-600">
                  Administradores revisam, aprovam projetos e definem vagas com
                  bolsa.
                </p>
              </li>
              <li className="mb-10 ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-white rounded-full -left-3 ring-8 ring-white">
                  3
                </span>
                <h3 className="font-semibold text-[hsl(210,40%,20%)]">
                  Período de Inscrição
                </h3>
                <p className="text-gray-600">
                  Alunos se candidatam a projetos durante o período de inscrição
                  definido.
                </p>
              </li>
              <li className="mb-10 ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-white rounded-full -left-3 ring-8 ring-white">
                  4
                </span>
                <h3 className="font-semibold text-[hsl(210,40%,20%)]">
                  Seleção de Candidatos
                </h3>
                <p className="text-gray-600">
                  Professores selecionam candidatos para suas vagas de
                  monitoria.
                </p>
              </li>
              <li className="ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-white rounded-full -left-3 ring-8 ring-white">
                  5
                </span>
                <h3 className="font-semibold text-[hsl(210,40%,20%)]">
                  Confirmação e Início
                </h3>
                <p className="text-gray-600">
                  Alunos aceitam ofertas e iniciam atividades de monitoria.
                </p>
              </li>
            </ol>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
