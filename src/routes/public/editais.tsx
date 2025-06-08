'use client';

import {
  createFileRoute,
  Link,
  useNavigate,
} from '@tanstack/react-router';
import { usePublicEditaisList } from '@/hooks/use-edital';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Download, Loader2, ServerCrash } from 'lucide-react';

export const Route = createFileRoute('/public/editais')({
  component: PublicEditaisPage,
});

function PublicEditaisPage() {
  const navigate = useNavigate();
  const { data: editais, isLoading, isError } = usePublicEditaisList();

  const getStatusPeriodo = (
    dataInicio: Date | string,
    dataFim: Date | string,
  ): { status: 'ATIVO' | 'FUTURO' | 'FINALIZADO'; label: string } => {
    const now = new Date();
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    if (now >= inicio && now <= fim) {
      return { status: 'ATIVO', label: 'Inscrições Abertas' };
    }
    if (now < inicio) {
      return { status: 'FUTURO', label: 'Em Breve' };
    }
    return { status: 'FINALIZADO', label: 'Inscrições Encerradas' };
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img
              src="/images/ic-logo-clean.png"
              alt="Monitoria IC"
              className="h-12 w-auto"
            />
            <h1 className="text-2xl font-bold text-gray-800">
              Editais de Monitoria
            </h1>
          </div>
          <Button onClick={() => navigate({ to: '/auth/cas-login' as any })}>
            Acessar Sistema
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-lg text-gray-600">Carregando editais...</p>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <ServerCrash className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg text-red-600">
              Ocorreu um erro ao buscar os editais.
            </p>
            <p className="text-gray-500">
              Por favor, tente novamente mais tarde.
            </p>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {editais?.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <p className="text-lg text-gray-500">
                  Nenhum edital publicado no momento.
                </p>
              </div>
            ) : (
              editais?.map((edital) => {
                if (!edital.periodoInscricao) return null;
                const { status, label } = getStatusPeriodo(
                  edital.periodoInscricao.dataInicio,
                  edital.periodoInscricao.dataFim,
                );
                return (
                  <Card key={edital.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {edital.titulo}
                        </CardTitle>
                        <Badge
                          variant={
                            status === 'ATIVO' ? 'default' : 'secondary'
                          }
                        >
                          {label}
                        </Badge>
                      </div>
                      <CardDescription>
                        Edital Nº {edital.numeroEdital}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        Publicado em:{' '}
                        {edital.dataPublicacao && format(new Date(edital.dataPublicacao), 'dd/MM/yyyy', {
                          locale: ptBR,
                        })}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        Inscrições de{' '}
                        {format(
                          new Date(edital.periodoInscricao.dataInicio),
                          'dd/MM/yyyy',
                        )}{' '}
                        a{' '}
                        {format(
                          new Date(edital.periodoInscricao.dataFim),
                          'dd/MM/yyyy',
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <a
                        href={`/api/public/documents/${edital.fileIdAssinado}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Baixar Edital
                        </Button>
                      </a>
                      {status === 'ATIVO' && (
                        <Button
                          onClick={() =>
                            navigate({ to: '/home/student/inscricao-monitoria' as any })
                          }
                        >
                          Inscrever-se
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
} 