'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Trash2, MessageSquare } from 'lucide-react'
import { AudioRecorder } from './audio-recorder'
import { AudioPlayer } from './audio-player'
import type { TaskCommentItem } from '@/types/coydash'

interface TaskCommentsProps {
  comments: TaskCommentItem[]
  currentUserName: string
  onAddComment: (comment: TaskCommentItem) => void
  onDeleteComment?: (commentId: string) => void
}

export function TaskComments({
  comments,
  currentUserName,
  onAddComment,
  onDeleteComment,
}: TaskCommentsProps) {
  const [content, setContent] = useState('')
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  const handleAudioComplete = (blob: Blob) => {
    setRecordedAudioBlob(blob)
    const url = URL.createObjectURL(blob)
    setRecordedAudioUrl(url)
  }

  const handleClearAudio = () => {
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl)
    setRecordedAudioBlob(null)
    setRecordedAudioUrl(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !recordedAudioUrl) return

    const newComment: TaskCommentItem = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      author_name: currentUserName || 'Equipe',
      content: content.trim(),
      audio_url: recordedAudioUrl || undefined,
      created_at: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }

    onAddComment(newComment)
    setContent('')
    setRecordedAudioBlob(null)
    setRecordedAudioUrl(null)
  }

  const getInitials = (name?: string) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    <div className="flex flex-col h-full min-h-[350px] p-6 pt-2">
      {/* Lista de Mensagens / Comentários */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-[200px] max-h-[360px]">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--ds-muted)] text-center gap-2">
            <MessageSquare className="w-8 h-8 opacity-40 text-[#0066FF]" />
            <span className="text-[13px]">Nenhum comentário registrado nesta tarefa.</span>
            <span className="text-[11.5px] opacity-70">
              Deixe um alinhamento para a equipe ou grave um recado de áudio abaixo.
            </span>
          </div>
        ) : (
          comments.map((cm) => (
            <div
              key={cm.id}
              className="flex items-start gap-3 p-3 rounded-[12px] bg-[var(--surface)] border border-[var(--line2)] text-[13px]"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--line)] border border-[var(--line2)] flex items-center justify-center text-[10px] font-bold text-[var(--fg)] shrink-0 select-none">
                {getInitials(cm.author_name)}
              </div>

              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[13px] text-[var(--fg)] truncate">
                    {cm.author_name}
                  </span>
                  <span className="text-[11px] text-[var(--ds-muted)] shrink-0 font-mono">
                    {cm.created_at}
                  </span>
                </div>

                {cm.content && (
                  <p className="text-[13px] text-[var(--fg)] whitespace-pre-wrap leading-relaxed">
                    {cm.content}
                  </p>
                )}

                {cm.audio_url && (
                  <div className="mt-1">
                    <AudioPlayer src={cm.audio_url} />
                  </div>
                )}
              </div>

              {onDeleteComment && (
                <button
                  type="button"
                  onClick={() => onDeleteComment(cm.id)}
                  className="text-[var(--ds-muted)] hover:text-red-500 p-1 cursor-pointer shrink-0 transition-colors"
                  title="Excluir comentário"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Formulário de Envio com Suporte a Áudio */}
      <form onSubmit={handleSubmit} className="mt-4 pt-3 border-t border-[var(--line)] flex flex-col gap-2.5">
        {recordedAudioUrl && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-500/10 border border-orange-500/20">
            <span className="text-[11.5px] font-medium text-orange-500">Áudio gravado:</span>
            <AudioPlayer src={recordedAudioUrl}>
              <button
                type="button"
                onClick={handleClearAudio}
                className="text-red-500 hover:text-red-600 p-1 rounded-full cursor-pointer ml-1"
                title="Descartar gravação"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </AudioPlayer>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder="Escreva um comentário ou briefing da tarefa... (Enter para enviar)"
            className="flex-1 min-h-[44px] max-h-[90px] text-[13px] bg-[var(--surface)] border-[var(--line2)] resize-none py-2 px-3"
          />

          <div className="flex flex-col gap-1.5 shrink-0">
            <AudioRecorder
              onRecordingComplete={handleAudioComplete}
              onClear={handleClearAudio}
            />

            <Button
              type="submit"
              disabled={!content.trim() && !recordedAudioUrl}
              className="bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue-hover)] text-white rounded-full h-[34px] px-3 font-semibold text-[12px] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
