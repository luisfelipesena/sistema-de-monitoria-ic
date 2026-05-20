"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { useEffect, useState } from "react"

export default function ProcessoDistribuicaoBolsasPage() {
  const [content, setContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadMarkdown = async () => {
      try {
        const response = await fetch("/api/docs/processo-distribuicao-bolsas")
        if (response.ok) {
          const data = await response.json()
          setContent(data.content)
        } else {
          setContent(`# Processo Manual de Distribuição de Bolsas

Este documento descreve o processo completo de distribuição de bolsas de monitoria no Instituto de Computação (IC) da UFBA.

Para acessar a documentação completa, consulte o arquivo \`docs/processo-distribuicao-bolsas.md\` no repositório do projeto.`)
        }
      } catch (error) {
        console.error("Erro ao carregar documentação:", error)
        setContent("Erro ao carregar a documentação. Por favor, consulte o arquivo `docs/processo-distribuicao-bolsas.md` no repositório.")
      } finally {
        setIsLoading(false)
      }
    }

    loadMarkdown()
  }, [])

  // Função para converter markdown para HTML formatado
  const markdownToHtml = (md: string) => {
    let html = md
    
    // Code blocks primeiro (para não interferir com outras substituições)
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
      return `<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded my-4 overflow-x-auto border"><code class="text-sm">${code.trim()}</code></pre>`
    })
    
    // Inline code
    html = html.replace(/`([^`\n]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-100">$1</h3>')
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-gray-100">$1</h2>')
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">$1</h1>')
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    
    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr class="my-8 border-gray-300 dark:border-gray-700" />')
    
    // Lists (unordered)
    html = html.replace(/^\- (.*$)/gim, '<li class="ml-6 mb-2 list-disc">$1</li>')
    
    // Wrap consecutive list items in ul
    html = html.replace(/(<li class="ml-6 mb-2 list-disc">.*<\/li>\n?)+/g, (match) => {
      return `<ul class="mb-4 space-y-1">${match}</ul>`
    })
    
    // Numbered lists
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-6 mb-2 list-decimal">$1</li>')
    
    // Wrap consecutive numbered list items in ol
    html = html.replace(/(<li class="ml-6 mb-2 list-decimal">.*<\/li>\n?)+/g, (match) => {
      return `<ol class="mb-4 space-y-1">${match}</ol>`
    })
    
    // Paragraphs (após processar outros elementos)
    html = html.split('\n\n').map(para => {
      para = para.trim()
      if (!para || para.startsWith('<')) return para
      return `<p class="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">${para}</p>`
    }).join('\n\n')
    
    // Checkmarks
    html = html.replace(/✅/g, '<span class="text-green-600 dark:text-green-400">✅</span>')
    
    return html
  }

  return (
    <PagesLayout
      title="Processo de Distribuição de Bolsas"
      subtitle="Documentação completa do processo institucional"
    >
      <div className="max-w-4xl">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground">Carregando documentação...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border prose prose-sm max-w-none dark:prose-invert">
            <div 
              className="markdown-content"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
            />
          </div>
        )}
      </div>
    </PagesLayout>
  )
}

