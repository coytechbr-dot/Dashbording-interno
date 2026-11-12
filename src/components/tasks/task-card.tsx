'use client'

import React from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { Calendar, MoreVertical, Paperclip, CheckSquare, MessageSquare, Building2 } from 'lucide-react'
import type { TaskItem } from '@/types/coydash'

interface TaskCardProps {
  task: TaskItem
  index: number
  onEdit: (task: TaskItem, tab?: 'details' | 'comments') => void
}

export function TaskCard({ task, index, onEdit }: TaskCardProps) {
  const getInitials = (name?: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  const priorityColors = {
    low: 'bg-green-500/10 text-green-500 border-green-500/20',
    medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    urgent: 'bg-red-500/10 text-red-500 border-red-500/20',
  }

  const priorityLabels = {
    low: 'BAIXA',
    medium: 'MÉDIA',
    high: 'ALTA',
    urgent: 'URGENTE',
  }

  const subtasks = task.subtasks || []
  const completedSubtasks = subtasks.filter((st) => st.is_completed).length
  const totalSubtasks = subtasks.length

  const comments = task.comments || []
  const attachments = task.attachments || []

  // Extrair responsáveis (seja array assignees ou assignee_name)
  const assigneesList =
    task.assignees && task.assignees.length > 0
      ? task.assignees
      : task.assignee_name
        ? task.assignee_name.split(',').map((s) => s.trim()).filter(Boolean)
        : []

  const isOverdue = task.due_date ? new Date(task.due_date).getTime() < new Date().setHours(0,0,0,0) : false

  const formatDueDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-')
      if (year && month && day) {
        const d = new Date(Number(year), Number(month) - 1, Number(day))
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
      }
      return dateStr
    } catch {
      return dateStr
    }
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onEdit(task, 'details')}
          className={`group bg-[var(--surface)] p-4 rounded-[14px] border transition-all cursor-pointer select-none ${
            snapshot.isDragging
              ? 'border-[var(--color-brand-orange)] shadow-2xl rotate-[2deg] scale-105 z-50'
              : 'border-[var(--line2)] shadow-xs hover:border-[var(--color-brand-orange)]/60 hover:shadow-md'
          }`}
        >
          <div className="flex flex-col gap-2 mb-2.5">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded-[4px] border text-[10px] font-bold tracking-wide w-fit ${
                    priorityColors[task.priority] || priorityColors.medium
                  }`}
                >
                  {priorityLabels[task.priority] || 'MÉDIA'}
                </span>

                {task.client_name_snapshot && (
                  <span className="text-[10.5px] text-[var(--ds-muted)] truncate max-w-[150px] flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-[var(--color-brand-orange)] shrink-0" />
                    <span className="truncate">{task.client_name_snapshot}</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                className="text-[var(--ds-muted)] opacity-0 group-hover:opacity-100 transition-opacity ml-auto hover:text-[var(--fg)] p-1"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(task, 'details')
                }}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <h4 className="text-[13.5px] font-semibold leading-snug text-[var(--fg)] break-words mt-0.5">
              {task.title}
            </h4>
          </div>

          {task.description && (
            <p className="text-[12px] text-[var(--ds-muted)] line-clamp-2 mb-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2.5">
              {task.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--line2)] text-[var(--ds-muted)]"
                >
                  #{tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="text-[10px] text-[var(--ds-muted)]">
                  +{task.tags.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--line)]">
            <div className="flex flex-wrap items-center gap-1.5">
              {task.due_date && (
                <div
                  className={`flex items-center justify-center gap-1 text-[11px] font-medium px-2 h-[26px] rounded-[6px] transition-colors ${
                    isOverdue
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                      : 'bg-[var(--ds-hover)] text-[var(--ds-muted)]'
                  }`}
                  title={isOverdue ? 'Tarefa atrasada' : 'Prazo de entrega'}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDueDate(task.due_date)}</span>
                </div>
              )}

              {totalSubtasks > 0 && (
                <div
                  className={`flex items-center justify-center gap-1 text-[11px] font-medium px-2 h-[26px] rounded-[6px] transition-colors ${
                    completedSubtasks === totalSubtasks
                      ? 'bg-green-500/10 text-green-600 border border-green-500/20 font-bold'
                      : 'bg-[var(--ds-hover)] text-[var(--ds-muted)]'
                  }`}
                  title={`Checklist: ${completedSubtasks} de ${totalSubtasks} etapas concluídas`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>
                    {completedSubtasks}/{totalSubtasks}
                  </span>
                </div>
              )}

              {attachments.length > 0 && (
                <div
                  className="flex items-center justify-center gap-1 text-[11px] text-[var(--ds-muted)] bg-[var(--ds-hover)] px-2 h-[26px] rounded-[6px]"
                  title={`${attachments.length} anexo(s)`}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>{attachments.length}</span>
                </div>
              )}

              <div
                className={`flex items-center justify-center text-[var(--ds-muted)] hover:text-[var(--fg)] bg-[var(--ds-hover)] hover:bg-[var(--line2)] w-[26px] h-[26px] rounded-[6px] cursor-pointer transition-colors ${
                  comments.length > 0 ? 'text-[var(--color-brand-orange)] font-semibold' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(task, 'comments')
                }}
                title={comments.length > 0 ? `${comments.length} comentários` : 'Abrir comentários'}
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Avatares dos Responsáveis Sobrepostos */}
            <div className="flex -space-x-2 overflow-hidden shrink-0">
              {assigneesList.length > 0 ? (
                <>
                  {assigneesList.slice(0, 3).map((assignee, i) => (
                    <div
                      key={i}
                      className="h-7 w-7 rounded-full bg-[var(--line2)] ring-2 ring-[var(--surface)] flex items-center justify-center text-[10px] font-bold text-[var(--fg)] shrink-0 select-none"
                      title={assignee}
                    >
                      {getInitials(assignee)}
                    </div>
                  ))}
                  {assigneesList.length > 3 && (
                    <div
                      className="h-7 w-7 rounded-full bg-[var(--line)] ring-2 ring-[var(--surface)] flex items-center justify-center text-[10px] font-bold text-[var(--fg)] shrink-0 select-none"
                      title={`+${assigneesList.length - 3} responsáveis`}
                    >
                      +{assigneesList.length - 3}
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="w-7 h-7 rounded-full bg-[var(--ds-hover)] border border-dashed border-[var(--line2)] flex items-center justify-center text-[11px] text-[var(--ds-muted)] shrink-0 select-none"
                  title="Sem responsável definido"
                >
                  -
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}
