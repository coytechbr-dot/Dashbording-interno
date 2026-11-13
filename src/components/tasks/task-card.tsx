'use client'

import React, { useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import {
  Calendar,
  MoreVertical,
  Paperclip,
  MessageSquare,
  Building2,
  GitBranch,
  ChevronDown,
  ChevronRight,
  Check,
} from 'lucide-react'
import type { TaskItem } from '@/types/coydash'

interface TaskCardProps {
  task: TaskItem
  index: number
  subtasks?: TaskItem[]
  listName?: string
  onEdit: (task: TaskItem, tab?: 'details' | 'comments') => void
}

const isDoneStatus = (status?: string | null) => {
  const s = (status || '').toLowerCase()
  return s.includes('concl') || s.includes('finaliz') || s.includes('done')
}

export function TaskCard({ task, index, subtasks = [], listName, onEdit }: TaskCardProps) {
  const [expandSubtasks, setExpandSubtasks] = useState(false)

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

  const totalSubtasks = subtasks.length
  const completedSubtasks = subtasks.filter((st) => isDoneStatus(st.status_key)).length

  const comments = task.comments || []
  const attachments = task.attachments || []

  const assigneesList =
    task.assignees && task.assignees.length > 0
      ? task.assignees
      : task.assignee_name
        ? task.assignee_name.split(',').map((s) => s.trim()).filter(Boolean)
        : []

  const isOverdue = task.due_date
    ? new Date(task.due_date).getTime() < new Date().setHours(0, 0, 0, 0)
    : false

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
              ? 'border-[var(--color-brand-blue)] shadow-2xl rotate-[2deg] scale-105 z-50'
              : 'border-[var(--line2)] shadow-xs hover:border-[var(--color-brand-blue)]/60 hover:shadow-md'
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
                    <Building2 className="w-3 h-3 text-[var(--color-brand-blue)] shrink-0" />
                    <span className="truncate">{task.client_name_snapshot}</span>
                  </span>
                )}

                {listName && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] bg-[var(--bg)] border border-[var(--line2)] text-[var(--ds-muted)] max-w-[130px] truncate"
                    title={`Lista: ${listName}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-blue)] shrink-0" />
                    <span className="truncate">{listName}</span>
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
            <p className="text-[12px] text-[var(--ds-muted)] line-clamp-2 mb-2.5 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* AVISO + X SUBTAREFAS NO KANBAN COM EXPANSÃO RÁPIDA */}
          {totalSubtasks > 0 && (
            <div className="mb-2.5 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandSubtasks(!expandSubtasks)
                }}
                className={`inline-flex items-center justify-between w-full px-2.5 py-1.5 rounded-[8px] border text-[11px] font-semibold transition-colors cursor-pointer ${
                  completedSubtasks === totalSubtasks
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500'
                    : 'bg-[var(--bg)] border-[var(--line2)] hover:border-[var(--color-brand-blue)]/50 text-[var(--fg)]'
                }`}
                title="Clique para expandir ou recolher as subtarefas"
              >
                <span className="flex items-center gap-1.5">
                  <GitBranch className="w-3 h-3 text-[var(--color-brand-blue)] shrink-0" />
                  <span>
                    + {totalSubtasks} {totalSubtasks === 1 ? 'subtarefa' : 'subtarefas'}
                  </span>
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[var(--ds-muted)]">
                  {completedSubtasks > 0 && (
                    <span>
                      {completedSubtasks}/{totalSubtasks}
                    </span>
                  )}
                  {expandSubtasks ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </span>
              </button>

              {expandSubtasks && (
                <div className="flex flex-col gap-1 pl-2 border-l-2 border-[var(--color-brand-blue)]/40">
                  {subtasks.map((sub) => {
                    const done = isDoneStatus(sub.status_key)
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(sub, 'details')
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] bg-[var(--bg)]/80 hover:bg-[var(--line2)]/70 text-left transition-colors cursor-pointer"
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border shrink-0 ${
                            done
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-[var(--line2)]'
                          }`}
                        >
                          {done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </span>
                        <span
                          className={`text-[11px] truncate ${
                            done ? 'line-through text-[var(--ds-muted)]' : 'text-[var(--fg)]'
                          }`}
                        >
                          {sub.title}
                        </span>
                      </button>
                    )
                  })}
                </div>
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
                  comments.length > 0 ? 'text-[var(--color-brand-blue)] font-semibold' : ''
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

            {/* Avatares dos Responsáveis */}
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
