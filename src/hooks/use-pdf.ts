import { apiClient } from '@/utils/api-client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useGeneratePDF() {
  return useMutation({
    mutationFn: async (projetoId: number) => {
      const response = await apiClient.get(`/projeto/${projetoId}/pdf`, {
        responseType: 'text',
      });
      return response.data;
    },
    onSuccess: (htmlContent: string, projetoId: number) => {
      // Criar uma nova janela com o conteúdo HTML
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Aguardar o carregamento e imprimir
        printWindow.onload = () => {
          printWindow.print();
        };

        toast.success(
          'PDF gerado com sucesso! Use Ctrl+P para salvar como PDF.',
        );
      } else {
        toast.error(
          'Não foi possível abrir a janela de impressão. Verifique se o popup foi bloqueado.',
        );
      }
    },
    onError: (error) => {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF do projeto');
    },
  });
}

export function downloadPDF(htmlContent: string, filename: string) {
  try {
    // Criar uma nova janela para impressão
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup bloqueado. Permita popups para gerar o PDF.');
      return;
    }

    // Adicionar estilos específicos para impressão
    const styledContent = `
      <html>
        <head>
          <title>${filename}</title>
          <style>
            @media print {
              @page {
                margin: 1.5cm;
                size: A4;
              }
              body {
                margin: 0;
                font-family: Arial, sans-serif;
              }
            }
            ${htmlContent.match(/<style>(.*?)<\/style>/s)?.[1] || ''}
          </style>
        </head>
        <body>
          ${htmlContent
            .replace(/<style>.*?<\/style>/s, '')
            .replace(/<html>.*?<body>/s, '')
            .replace(/<\/body>.*?<\/html>/s, '')}
        </body>
      </html>
    `;

    printWindow.document.write(styledContent);
    printWindow.document.close();

    // Focar na janela e imprimir
    printWindow.focus();
    printWindow.print();

    toast.success(
      'PDF aberto para impressão! Use "Salvar como PDF" na impressora.',
    );
  } catch (error) {
    console.error('Erro ao preparar PDF:', error);
    toast.error('Erro ao preparar o PDF para download');
  }
}
