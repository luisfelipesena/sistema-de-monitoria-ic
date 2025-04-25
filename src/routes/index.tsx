'use client';

// import { Header } from '@/components/layout/Header'; // TODO: Migrate or create Header
// import { Button } from '@/components/ui/button'; // Assuming shadcn setup - Temporarily commented out
import { useAuth } from '@/hooks/use-auth';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: LandingPageComponent,
});

function LandingPageComponent() {
  const { signIn, isAuthenticated, isLoading } = useAuth();

  // Optional: Redirect if already authenticated
  // This could also be handled in a root layout loader
  // if (isAuthenticated) {
  //   throw redirect({ to: '/home' });
  // }

  // Or simply disable the login button if loading/authenticated
  const showLogin = !isLoading && !isAuthenticated;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* <Header /> */}
      <header className="p-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <span className="font-bold text-xl text-blue-800">
            Sistema de Monitoria IC
          </span>
          {/* Basic header structure, replace with actual Header component later */}
          {showLogin && (
            // <Button onClick={signIn} className="bg-blue-700 hover:bg-blue-800">
            <button
              onClick={signIn}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800"
            >
              Entrar com Email UFBA
            </button>
          )}
          {isLoading && (
            <button
              disabled
              className="px-4 py-2 text-sm font-medium text-white bg-gray-400 rounded-md"
            >
              Carregando...
            </button>
          )}
          {isAuthenticated && (
            <button
              disabled
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md"
            >
              Logado
            </button>
          )}
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
              {showLogin && (
                <button
                  onClick={signIn}
                  className="px-6 py-3 text-lg font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800"
                >
                  Entrar com Email UFBA
                </button>
              )}
              {isLoading && (
                <button
                  disabled
                  className="px-6 py-3 text-lg font-medium text-white bg-gray-400 rounded-md"
                >
                  Carregando...
                </button>
              )}
              <a
                href="#saiba-mais"
                className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium text-blue-700 bg-white border border-blue-700 rounded-md hover:bg-blue-50"
              >
                Saiba Mais
              </a>
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

      <footer className="py-8 text-center bg-gray-100">
        <p className="text-gray-600">
          © {new Date().getFullYear()} Sistema de Monitoria IC - UFBA
        </p>
      </footer>
    </div>
  );
}
