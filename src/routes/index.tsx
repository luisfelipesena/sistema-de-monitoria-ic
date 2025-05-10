'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: LandingPageComponent,
});

function LandingPageComponent() {
  const { signIn, isLoading } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="sticky top-0 z-10 p-4 border-b bg-white/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between mx-auto">
          <div className="flex items-center gap-2">
            <img
              src="/images/logo.ico"
              alt="Monitoria IC"
              className="h-12 w-12"
            />
            <span className="text-xl font-bold text-blue-800">
              Sistema de Monitoria IC
            </span>
          </div>
          <Button isLoading={isLoading} onClick={signIn}>
            Entrar com Email UFBA
          </Button>
        </div>
      </header>

      <main className="container px-4 py-12 mx-auto max-w-7xl">
        <div className="grid items-center grid-cols-1 gap-12 md:grid-cols-2">
          <div>
            <h1 className="mb-6 text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
              Gerencie seu Programa de Monitoria
            </h1>
            <p className="mb-8 text-lg text-gray-600">
              Simplifique o processo de inscrição, seleção e gerenciamento de
              monitores para projetos acadêmicos da UFBA.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                isLoading={isLoading}
                onClick={signIn}
                variant="secondary"
              >
                Entrar com Email UFBA
              </Button>

              <Button variant="secondary" asChild>
                <a href="#saiba-mais">Saiba Mais</a>
              </Button>
            </div>
          </div>
          <div className="order-first md:order-last">
            <div className="relative">
              <div className="w-full h-64 overflow-hidden bg-blue-100 rounded-lg shadow-xl md:h-96">
                <div className="flex items-center justify-center h-full">
                  <span className="text-xl text-blue-800">
                    Ilustração do Sistema
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section id="saiba-mais" className="py-16">
          <h2 className="mb-12 text-3xl font-bold text-center text-gray-900">
            Como Funciona
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Reusing Card-like structure with basic divs until shadcn is set up */}
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="mb-3 text-xl font-semibold">Para Professores</h3>
              <p className="text-gray-600">
                Crie e gerencie projetos de monitoria, selecione candidatos e
                acompanhe suas atividades.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="mb-3 text-xl font-semibold">Para Alunos</h3>
              <p className="text-gray-600">
                Encontre projetos disponíveis, inscreva-se facilmente e
                acompanhe o status de suas candidaturas.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="mb-3 text-xl font-semibold">
                Para Administradores
              </h3>
              <p className="text-gray-600">
                Supervisione todos os projetos, gerencie usuários e obtenha
                relatórios detalhados.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 mt-auto text-center bg-gray-100">
        <p className="text-gray-600">
          © {new Date().getFullYear()} Sistema de Monitoria IC - UFBA
        </p>
      </footer>
    </div>
  );
}
