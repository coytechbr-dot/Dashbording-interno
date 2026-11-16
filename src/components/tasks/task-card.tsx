'use client'

import React, { useState, useMemo } from 'react'
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
  Copy,
  Star,
  Archive,
  ArchiveRestore,
  Trash2,
  ExternalLink,
  ArrowRightLeft,
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useCoyDash } from '@/lib/coydash-store'
import { TaskQuickStatusPopover } from './task-quick-status-popover'
import { TaskQuickCommentsPopover } from './task-quick-comments-popover'
import { TaskMoveCopyModal } from './task-move-copy-modal'
import { AutoLinkText } from '@/components/ui/auto-link-text'
import { CoyAssigneePicker, getAvatarGradient } from '@/components/ui/coy-assignee-picker'
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
  const {
    taskStatuses,
    updateTask,
    archiveTask,
    deleteTask,
    addTaskComment,
    authenticatedUser,
  } = useCoyDash()

  const [expandSubtasks, setExpandSubtasks] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [moveCopyOpen, setMoveCopyOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

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

  const handleQuickAddComment = async (content: string) => {
    const authorName = authenticatedUser?.name || 'Administrador'
    await addTaskComment(task.id, {
      id: `comment_${Date.now()}`,
      author_name: authorName,
      content,
      created_at: new Date().toISOString(),
    })
  }

  const handleUpdateStatus = async (newStatus: string) => {
    await updateTask(task.id, { status_key: newStatus })
  }

  const handleUpdateAssignees = async (vals: string[]) => {
    await updateTask(task.id, {
      assignees: vals,
      assignee_name: vals.join(', '),
    })
  }

  // Status relevantes filtrados pela lista específica da tarefa (evita misturar com status de outras listas)
  const relevantStatuses = useMemo(() => {
    if (task.list_id) {
      const fromList = taskStatuses.filter((s) => s.list_id === task.list_id)
      if (fromList.length > 0) return fromList
    }
    return taskStatuses
  }, [task.list_id, taskStatuses])

  return (
    <>
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
                  {/* Status Rápido no Card (Item 10 e 11) */}
                  <TaskQuickStatusPopover
                    currentStatus={task.status_key || 'A Fazer'}
                    availableStatuses={relevantStatuses}
                    onSelectStatus={handleUpdateStatus}
                  />

                  {/* Prioridade */}
                  <span
                    className={`px-2 py-0.5 rounded-[4px] border text-[10px] font-bold tracking-wide w-fit ${
                      priorityColors[task.priority] || priorityColors.medium
                    }`}
                  >
                    {priorityLabels[task.priority] || 'MÉDIA'}
                  </span>

                  {task.client_name_snapshot && (
                    <span className="text-[10.5px] text-[var(--ds-muted)] truncate max-w-[130px] flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-[var(--color-brand-blue)] shrink-0" />
                      <span className="truncate">{task.client_name_snapshot}</span>
                    </span>
                  )}

                  {listName && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] bg-[var(--bg)] border border-[var(--line2)] text-[var(--ds-muted)] max-w-[110px] truncate"
                      title={`Lista: ${listName}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-blue)] shrink-0" />
                      <span className="truncate">{listName}</span>
                    </span>
                  )}
                </div>

                {/* MENU DE 3 PONTOS NO CARD (ITEM 9) */}
                <Popover open={moreMenuOpen} onOpenChange={(open) => {
                  setMoreMenuOpen(open)
                  if (!open) setConfirmingDelete(false)
                }}>
                  <PopoverTrigger
                    onClick={(e) => e.stopPropagation()}
                    className="text-[var(--ds-muted)] opacity-0 group-hover:opacity-100 transition-opacity ml-auto hover:text-[var(--fg)] p-1 rounded-md hover:bg-[var(--line2)] outline-none cursor-pointer"
                    title="Opções da tarefa"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </PopoverTrigger>

                  <PopoverContent
                    align="end"
                    onClick={(e) => e.stopPropagation()}
                    className="w-60 p-1.5 bg-[var(--surface)] border-[var(--line2)] rounded-xl shadow-2xl text-[var(--fg)] z-50 animate-in fade-in-0 zoom-in-95 duration-100"
                  >
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          onEdit(task, 'details')
                          setMoreMenuOpen(false)
                        }}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] hover:bg-[var(--line2)] text-left transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
                        <span>Abrir detalhes da tarefa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(task.id)
                          setMoreMenuOpen(false)
                        }}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] hover:bg-[var(--line2)] text-left transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
                        <span>Copiar identificador da tarefa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMoreMenuOpen(false)
                        }}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] hover:bg-[var(--line2)] text-left transition-colors cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
                        <span>Destacar nos favoritos</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMoreMenuOpen(false)
                          setMoveCopyOpen(true)
                        }}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] hover:bg-[var(--line2)] text-left transition-colors cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-[#0066FF]" />
                        <span>Mover ou copiar tarefa</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          const next = !Boolean(task.is_archived)
                          await archiveTask(task.id, next)
                          setMoreMenuOpen(false)
                        }}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] hover:bg-[var(--line2)] text-left transition-colors cursor-pointer"
                      >
                        {task.is_archived ? (
                          <>
                            <ArchiveRestore className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Restaurar tarefa</span>
                          </>
                        ) : (
                          <>
                            <Archive className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
                            <span>Arquivar tarefa</span>
                          </>
                        )}
                      </button>

                      <div className="mt-1 pt-1.5 border-t border-[var(--line)]">
                        {!confirmingDelete ? (
                          <button
                            type="button"
                            onClick={() => setConfirmingDelete(true)}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] text-[var(--ds-muted)] hover:text-red-400 hover:bg-red-500/10 text-left transition-colors cursor-pointer"
                          >
                            <span>Remover registro permanentemente</span>
                          </button>
                        ) : (
                          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 flex flex-col gap-2">
                            <span className="text-[11px] text-red-500 font-semibold leading-tight">
                              Remover definitivamente?
                            </span>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setConfirmingDelete(false)}
                                className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-[var(--surface)] hover:bg-[var(--line2)] text-[var(--fg)] cursor-pointer"
                              >
                                Voltar
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  await deleteTask(task.id)
                                  setMoreMenuOpen(false)
                                }}
                                className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                              >
                                Confirmar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <h4 className="text-[13.5px] font-semibold leading-snug text-[var(--fg)] break-words mt-0.5">
                {task.title}
              </h4>
            </div>

            {task.description && (
              <p className="text-[12px] text-[var(--ds-muted)] line-clamp-2 mb-2.5 leading-relaxed break-words [overflow-wrap:anywhere] [word-break:break-word]">
                <AutoLinkText text={task.description} />
              </p>
            )}

            {/* AVISO + X SUBTAREFAS NO KANBAN COM EXPANSÃO RÁPIDA E STATUS CLICÁVEL */}
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
                        <div
                          key={sub.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(sub, 'details')
                          }}
                          className="flex items-center justify-between gap-1.5 px-2 py-1 rounded-[6px] bg-[var(--bg)]/80 hover:bg-[var(--line2)]/70 text-left transition-colors cursor-pointer group/sub"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              onClick={(e) => {
                                e.stopPropagation()
                                const nextStatus = done ? 'A Fazer' : 'Concluído'
                                void updateTask(sub.id, { status_key: nextStatus })
                              }}
                              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border shrink-0 transition-transform active:scale-90 ${
                                done
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-[var(--line2)] hover:border-emerald-500'
                              }`}
                              title="Alternar conclusão da subtarefa"
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
                          </div>

                          <TaskQuickStatusPopover
                            currentStatus={sub.status_key || 'A Fazer'}
                            availableStatuses={relevantStatuses}
                            onSelectStatus={(st) => updateTask(sub.id, { status_key: st })}
                          />
                        </div>
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

                {/* COMENTÁRIOS RÁPIDOS SEM ENTRAR NA TAREFA (ITEM 11) */}
                <TaskQuickCommentsPopover
                  taskId={task.id}
                  taskTitle={task.title}
                  comments={comments}
                  onAddComment={handleQuickAddComment}
                  currentUserName={authenticatedUser?.name || 'Administrador'}
                />
              </div>

              {/* AVATARES DOS RESPONSÁVEIS COM PICKER RÁPIDO NO CARD (ITEM 5) */}
              <div onClick={(e) => e.stopPropagation()}>
                <CoyAssigneePicker
                  value={assigneesList}
                  multiple={true}
                  variant="avatars-only"
                  onChange={handleUpdateAssignees}
                />
              </div>
            </div>
          </div>
        )}
      </Draggable>

      {/* MODAL DE MOVER / COPIAR TAREFA */}
      <TaskMoveCopyModal
        open={moveCopyOpen}
        onOpenChange={setMoveCopyOpen}
        task={task}
      />
    </>
  )
}

