'use client';

import { Button } from '@/components/ui/button';
import { Link } from 'react-router';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
        <div className="text-xl font-bold text-blue-700">
          Sistema de Monitoria IC
        </div>
        <div className="flex gap-4">
          <Button asChild variant="ghost">
            <Link to="/auth/sign-in">Entrar</Link>
          </Button>
          <Button asChild>
            <Link to="/auth/sign-up">Cadastrar</Link>
          </Button>
        </div>
      </nav>

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
              <Button asChild size="lg" className="px-8">
                <Link to="/auth/sign-in">Começar Agora</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#saiba-mais">Saiba Mais</a>
              </Button>
            </div>
          </div>
          <div className="order-first md:order-last">
            <div className="relative">
              <div className="w-full h-64 overflow-hidden rounded-lg shadow-xl md:h-96 bg-blue-100">
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
