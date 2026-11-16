'use client'

import React, { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { MessageSquare, Send, X, User } from 'lucide-react'
import type { TaskCommentItem } from '@/types/coydash'
import { getAvatarGradient, getInitials } from '@/components/ui/coy-assignee-picker'
import { AutoLinkText } from '@/components/ui/auto-link-text'

interface TaskQuickCommentsPopoverProps {
  taskId: string
  taskTitle: string
  comments?: TaskCommentItem[]
  onAddComment: (text: string) => Promise<void> | void
  currentUserName: string
  children?: React.ReactNode
  align?: 'start' | 'center' | 'end'
}

export function TaskQuickCommentsPopover({
  taskId,
  taskTitle,
  comments = [],
  onAddComment,
  currentUserName,
  children,
  align = 'end',
}: TaskQuickCommentsPopoverProps) {
  const [open, setOpen] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    const clean = newComment.trim()
    if (!clean || isSending) return

    setIsSending(true)
    try {
      await onAddComment(clean)
      setNewComment('')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        onClick={(e) => e.stopPropagation()}
        className="outline-none cursor-pointer"
      >
        {children ? (
          children
        ) : (
          <div
            className={`flex items-center gap-1 text-[11px] px-2 h-[26px] rounded-[6px] transition-colors ${
              comments.length > 0
                ? 'bg-[#0066FF]/15 text-[#0066FF] font-semibold'
                : 'bg-[var(--ds-hover)] text-[var(--ds-muted)] hover:text-[var(--fg)]'
            }`}
            title={comments.length > 0 ? `${comments.length} comentários` : 'Adicionar comentário rápido'}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{comments.length}</span>
          </div>
        )}
      </PopoverTrigger>

      <PopoverContent
        align={align}
        onClick={(e) => e.stopPropagation()}
        className="w-[380px] sm:w-[400px] p-3 rounded-2xl bg-[var(--surface)] border border-[var(--line2)] shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-100 flex flex-col gap-2.5"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
          <div className="flex items-center gap-1.5 min-w-0">
            <MessageSquare className="w-4 h-4 text-[#0066FF] shrink-0" />
            <span className="text-[12px] font-bold text-[var(--fg)] truncate">
              Comentários ({comments.length})
            </span>
          </div>
          <span className="text-[10px] text-[var(--ds-muted)] truncate max-w-[150px]">
            {taskTitle}
          </span>
        </div>

        {/* Lista de Comentários */}
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1 no-scrollbar min-w-0">
          {comments.length === 0 ? (
            <div className="py-6 text-center text-[11.5px] text-[var(--ds-muted)]">
              Nenhum comentário registrado ainda. Envie o primeiro abaixo.
            </div>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="flex flex-col gap-1 p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line2)] text-[11.5px] max-w-full overflow-hidden break-words [overflow-wrap:anywhere] [word-break:break-word]"
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className={`w-4 h-4 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                        c.author_name
                      )} text-white flex items-center justify-center text-[8.5px] font-bold shrink-0`}
                    >
                      {getInitials(c.author_name)}
                    </div>
                    <span className="font-semibold text-[var(--fg)] truncate">
                      {c.author_name}
                    </span>
                  </div>
                  <span className="text-[9.5px] text-[var(--ds-muted)] shrink-0">
                    {c.created_at
                      ? new Date(c.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Agora'}
                  </span>
                </div>
                <p className="text-[var(--fg)] break-words [overflow-wrap:anywhere] [word-break:break-word] leading-relaxed pl-5 max-w-full">
                  <AutoLinkText text={c.content} />
                </p>
              </div>
            ))
          )}
        </div>

        {/* Formulário de Envio Rápido */}
        <form onSubmit={handleSend} className="flex items-center gap-1.5 pt-1 border-t border-[var(--line)]">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escreva um comentário rápido..."
            className="flex-1 h-8 px-2.5 rounded-lg bg-[var(--bg)] border border-[var(--line2)] text-[11.5px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] outline-none focus:border-[#0066FF]"
            autoFocus
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSending}
            className="h-8 px-2.5 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-40 text-white font-bold flex items-center justify-center cursor-pointer transition-colors shrink-0"
            title="Enviar comentário"
          >
            <Send className="w-3 h-3" />
          </button>
        </form>
      </PopoverContent>
    </Popover>
  )
}
