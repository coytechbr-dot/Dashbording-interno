'use client'

import React from 'react'
import { ExternalLink } from 'lucide-react'

interface AutoLinkTextProps {
  text?: string | null
  className?: string
  linkClassName?: string
  showExternalIcon?: boolean
}

/**
 * Função utilitária que divide uma string em texto comum e links âncora clicáveis.
 * Reconhece links iniciando com http://, https:// ou www.
 * Limpa pontuações finais gramaticais para não quebrar o endereço (ex: "acesse https://site.com, ok?").
 */
export function formatTextWithLinks(
  text?: string | null,
  linkClassName?: string,
  showExternalIcon = false
): React.ReactNode[] {
  if (!text) return []

  // Regex para capturar URLs iniciadas por http://, https:// ou www.
  const urlRegex = /((?:https?:\/\/|www\.)[^\s<>"'{}|\\^`]+)/gi
  const elements: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = urlRegex.exec(text)) !== null) {
    // Adiciona o texto antes do link
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index))
    }

    let rawUrl = match[0]
    let trailingPunct = ''

    // Isola pontuação gramatical acidental ao final do link (como ponto final, vírgula, parênteses)
    const punctMatch = rawUrl.match(/[.,;:!?)]+$/)
    if (punctMatch) {
      trailingPunct = punctMatch[0]
      rawUrl = rawUrl.slice(0, -trailingPunct.length)
    }

    const href = rawUrl.startsWith('www.') ? `https://${rawUrl}` : rawUrl

    elements.push(
      <a
        key={`autolink-${match.index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={
          linkClassName ||
          'text-[#0066FF] hover:text-[#0052CC] hover:underline underline-offset-2 break-all [word-break:break-all] [overflow-wrap:anywhere] font-semibold transition-colors inline-flex items-center gap-0.5 cursor-pointer'
        }
        title={`Abrir link em nova guia: ${rawUrl}`}
      >
        <span>{rawUrl}</span>
        {showExternalIcon && (
          <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-75 ml-0.5" />
        )}
      </a>
    )

    if (trailingPunct) {
      elements.push(trailingPunct)
    }

    lastIndex = match.index + match[0].length
  }

  // Adiciona o restante do texto
  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex))
  }

  return elements
}

/**
 * Componente que renderiza texto com links clicáveis em Azul Elétrico (#0066FF),
 * com target="_blank" e quebra de palavras segura contra transbordamento.
 */
export function AutoLinkText({
  text,
  className = '',
  linkClassName,
  showExternalIcon = false,
}: AutoLinkTextProps) {
  if (!text) return null

  return (
    <span className={`break-words [overflow-wrap:anywhere] [word-break:break-word] ${className}`}>
      {formatTextWithLinks(text, linkClassName, showExternalIcon)}
    </span>
  )
}

