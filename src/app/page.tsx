"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"

function ProcessStep({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <li className="mb-10 ml-6">
      <span className="absolute flex items-center justify-center w-6 h-6 bg-white rounded-full -left-3 ring-8 ring-white">
        {number}
      </span>
      <h3 className="font-semibold text-[hsl(210,40%,20%)]">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </li>
  )
}

function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 flex items-center">
            <Image src="/images/logo-ufba.png" alt="UFBA Logo" width={40} height={40} className="inline-block mr-2" />
            <span className="text-lg font-semibold">UFBA - Universidade Federal da Bahia</span>
          </div>
          <div className="text-sm">
            &copy; {new Date().getFullYear()} Sistema de Monitoria UFBA | Todos os direitos reservados
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPageComponent() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="sticky top-0 z-10 p-4 border-b bg-white/80 backdrop-blur-sm">
        <div className="container flex flex-col sm:flex-row items-center justify-between mx-auto gap-4 sm:gap-0">
          <div className="flex items-center gap-2">
            <Image src="/images/ic-logo-clean.png" alt="Monitoria IC" className="h-12 w-12" width={48} height={48} />
            <span className="text-xl font-bold text-[hsl(195,71%,40%)]">Sistema de Monitoria IC</span>
          </div>
          <div className="w-full sm:w-auto flex justify-center sm:justify-end mt-4 sm:mt-0">
            <Button asChild className="w-full sm:w-auto">
              <a href="/api/auth/cas-login">Acessar Dashboard com Login UFBA</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-16 mx-auto max-w-6xl flex-grow">
        <section className="mb-20">
          <div className="flex flex-col gap-10 items-center text-center mb-16">
            <h1 className="text-4xl font-bold h1 text-[hsl(210,40%,20%)]">Sistema de Monitoria IC</h1>
            <p className="text-lg p text-gray-600 max-w-3xl mx-auto">
              Simplifique o processo de inscrição, seleção e gerenciamento de monitores para projetos acadêmicos da
              UFBA.
            </p>
            <Button asChild size="lg">
              <a href="/api/auth/cas-login">Acessar Dashboard com Login UFBA</a>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="mb-3 text-xl font-semibold text-[hsl(210,40%,20%)]">Para Professores</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Criar e gerenciar projetos</li>
                <li>• Selecionar candidatos</li>
                <li>• Definir vagas voluntárias</li>
                <li>• Assinar documentos digitalmente</li>
              </ul>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="mb-3 text-xl font-semibold text-[hsl(210,40%,20%)]">Para Alunos</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Visualizar projetos disponíveis</li>
                <li>• Inscrever-se em projetos</li>
                <li>• Acompanhar status das candidaturas</li>
                <li>• Aceitar ou recusar ofertas</li>
              </ul>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="mb-3 text-xl font-semibold text-[hsl(210,40%,20%)]">Para Administradores</h3>
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
          <h2 className="text-3xl font-bold text-center text-[hsl(210,40%,20%)] mb-8">Fluxo do Processo</h2>
          <div className="bg-white p-8 rounded-lg shadow-md">
            <ol className="relative border-l border-gray-200">
              <ProcessStep
                number={1}
                title="Criação e Submissão de Projetos"
                description="Professores criam propostas de monitoria definindo objetivos, disciplinas vinculadas e professores participantes. Após finalização, submetem para análise administrativa."
              />
              <ProcessStep
                number={2}
                title="Análise Administrativa e Criação do Edital"
                description="Administradores analisam projetos submetidos, aprovam ou rejeitam propostas, definem quantidade de vagas com bolsa e criam o edital oficial do período de inscrição."
              />
              <ProcessStep
                number={3}
                title="Abertura de Inscrições para Alunos"
                description="Durante o período definido no edital, alunos visualizam projetos aprovados e se candidatam às vagas de monitoria (bolsistas ou voluntárias)."
              />
              <ProcessStep
                number={4}
                title="Processo Seletivo e Definição de Vagas"
                description="Professores analisam candidaturas, realizam processo seletivo, definem vagas voluntárias adicionais e registram resultados através da ata de seleção."
              />
              <ProcessStep
                number={5}
                title="Aceite e Início das Atividades"
                description="Alunos selecionados aceitam ou recusam ofertas (máximo 1 bolsa por semestre), assinam termos de compromisso e iniciam as atividades de monitoria."
              />
            </ol>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
