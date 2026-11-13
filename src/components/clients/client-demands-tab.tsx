'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckSquare,
  Plus,
  LayoutGrid,
  List as ListIcon,
  Calendar,
  User,
  ArrowUpRight,
  GitBranch,
  Flag,
  Clock,
  Sparkles,
  ExternalLink,
  Building2,
  Layers,
  CheckCircle2,
  AlertCircle,
  Check,
} from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'
import { OrderServiceDialog } from './order-service-dialog'
import { TaskDialog } from '@/components/tasks/task-dialog'
import type { ClientAccount, TaskItem, TaskPriorityLevel } from '@/types/coydash'

interface ClientDemandsTabProps {
  client: ClientAccount
}

const DEFAULT_COLUMNS = [
  { id: 'col-todo', name: 'A FAZER', color: '#64748b' },
  { id: 'col-doing', name: 'EM ANDAMENTO', color: '#0066FF' },
  { id: 'col-review', name: 'EM REVISÃO', color: '#e8c14a' },
  { id: 'col-done', name: 'CONCLUÍDO', color: '#2f9e5a' },
]

const PRIORITY_CONFIG: Record<
  TaskPriorityLevel,
  { label: string; color: string; bg: string; border: string }
> = {
  urgent: { label: 'Urgente', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.35)' },
  high: { label: 'Alta', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)' },
  medium: { label: 'Média', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.35)' },
  low: { label: 'Baixa', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.35)' },
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getStatusStyle(statusKey: string) {
  const upper = statusKey.toUpperCase()
  if (upper.includes('CONCLU')) {
    return { color: '#2F9E5A', bg: 'rgba(47, 158, 90, 0.12)', border: 'rgba(47, 158, 90, 0.35)' }
  }
  if (upper.includes('ANDA') || upper.includes('PROG')) {
    return { color: '#0066FF', bg: 'rgba(0, 102, 255, 0.12)', border: 'rgba(0, 102, 255, 0.35)' }
  }
  if (upper.includes('REVIS')) {
    return { color: '#E8C14A', bg: 'rgba(232, 193, 74, 0.12)', border: 'rgba(232, 193, 74, 0.35)' }
  }
  return { color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.35)' }
}

export function ClientDemandsTab({ client }: ClientDemandsTabProps) {
  const router = useRouter()
  const {
    tasks,
    taskLists,
    clients,
    orgMembers,
    authenticatedUser,
    createTask,
    updateTask,
    deleteTask,
  } = useCoyDash()

  const [orderServiceOpen, setOrderServiceOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'kanban'>('cards')
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)

  // Filtrar demandas vinculadas a este cliente específico
  const clientTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        !t.parent_task_id &&
        !t.is_archived &&
        (t.client_id === client.id ||
          (t.client_name_snapshot &&
            t.client_name_snapshot.trim().toLowerCase() === client.name.trim().toLowerCase()))
    )
  }, [tasks, client.id, client.name])

  // Contadores métricos
  const totalCount = clientTasks.length
  const doingCount = clientTasks.filter(
    (t) => t.status_key.toUpperCase() === 'EM ANDAMENTO' || t.status_key.toUpperCase() === 'EM REVISÃO'
  ).length
  const doneCount = clientTasks.filter(
    (t) => t.status_key.toUpperCase() === 'CONCLUÍDO' || t.status_key.toUpperCase() === 'CONCLUIDO'
  ).length

  // Abrir modal de edição da tarefa
  const handleOpenTask = (task: TaskItem) => {
    setEditingTask(task)
    setTaskDialogOpen(true)
  }

  // Redirecionar para o kanban geral filtrado
  const handleGoToGeneralKanban = (listId?: string | null) => {
    if (listId) {
      router.push(`/tarefas?listId=${listId}`)
    } else {
      router.push('/tarefas')
    }
  }

  // Mover status rápido
  const handleQuickStatusChange = async (taskId: string, newStatus: string) => {
    await updateTask(taskId, { status_key: newStatus })
  }

  // Alternar conclusão rápida da tarefa
  const handleToggleTaskStatus = async (task: TaskItem) => {
    const isDone =
      task.status_key.toUpperCase() === 'CONCLUÍDO' ||
      task.status_key.toUpperCase() === 'CONCLUIDO'
    const nextStatus = isDone ? 'A FAZER' : 'CONCLUÍDO'
    await updateTask(task.id, { status_key: nextStatus })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ========================================================================= */}
      {/* HEADER: TÍTULO, MÉTRICAS E BOTÃO DE ABRIR ORDEM DE SERVIÇO */}
      {/* ========================================================================= */}
      <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-bold text-[var(--fg)]">
                Demandas & Ordens de Serviço (O.S.)
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[var(--color-brand-blue)]/15 border border-[var(--color-brand-blue)]/30 text-[11px] font-bold text-[var(--color-brand-blue)]">
                {totalCount} {totalCount === 1 ? 'demanda' : 'demandas'}
              </span>
            </div>
            <p className="text-[12.5px] text-[var(--ds-muted)] mt-0.5">
              Todas as ordens de serviço deste cliente são sincronizadas automaticamente com o quadro Kanban da equipe.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleGoToGeneralKanban()}
              className="h-[38px] px-3.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[12px] font-semibold text-[var(--fg)] flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Abrir página oficial de Tarefas da agência"
            >
              <span>Ver no Kanban Geral</span>
              <ExternalLink className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
            </button>

            <button
              type="button"
              onClick={() => setOrderServiceOpen(true)}
              className="h-[38px] px-4 rounded-xl bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue-hover)] text-white text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span>Abrir Ordem de Serviço</span>
            </button>
          </div>
        </div>

        {/* Métricas Rápidas & Alternador de Visão */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--line)]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg)] border border-[var(--line2)] text-[12px]">
              <span className="text-[var(--ds-muted)]">Total de O.S.:</span>
              <strong className="text-[var(--fg)] font-bold tabular-nums">{totalCount}</strong>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/20 text-[12px] text-[var(--color-brand-blue)] font-medium">
              <span>Em Andamento:</span>
              <strong className="font-bold tabular-nums">{doingCount}</strong>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[12px] text-emerald-500 font-medium">
              <span>Concluídas:</span>
              <strong className="font-bold tabular-nums">{doneCount}</strong>
            </div>
          </div>

          {/* Alternador de Visualização Embutido no Pop-up */}
          <div className="flex items-center bg-[var(--bg)] border border-[var(--line2)] rounded-full p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                viewMode === 'cards'
                  ? 'bg-[var(--color-brand-blue)] text-white'
                  : 'text-[var(--ds-muted)] hover:text-[var(--fg)]'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>Lista de Tarefas</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-[var(--color-brand-blue)] text-white'
                  : 'text-[var(--ds-muted)] hover:text-[var(--fg)]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban Embutido</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONTEÚDO: LISTA NO ESTILO DE SUBTAREFAS OU QUADRO KANBAN EMBUTIDO          */}
      {/* ========================================================================= */}
      {clientTasks.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] grid place-items-center">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-[var(--fg)]">
              Nenhuma Ordem de Serviço aberta para este cliente
            </h3>
            <p className="text-[12.5px] text-[var(--ds-muted)] max-w-[420px] mx-auto mt-0.5">
              Abra a primeira demanda para cadastrar tarefas, definir equipe responsável e acompanhar o fluxo de entregas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOrderServiceOpen(true)}
            className="mt-2 h-[38px] px-5 rounded-xl bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue-hover)] text-white text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Abrir Primeira Ordem de Serviço</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* ======================================================================= */
        /* MODO 1: LISTA COMPACTA E ELEGANTE NO ESTILO DE SUBTAREFAS               */
        /* ======================================================================= */
        <div className="border border-[var(--line2)] rounded-2xl bg-[var(--surface)] overflow-hidden divide-y divide-[var(--line)] shadow-xs">
          {clientTasks.map((task) => {
            const isDone =
              task.status_key.toUpperCase() === 'CONCLUÍDO' ||
              task.status_key.toUpperCase() === 'CONCLUIDO'
            const statusStyle = getStatusStyle(task.status_key)
            const prio =
              PRIORITY_CONFIG[task.priority as TaskPriorityLevel] || PRIORITY_CONFIG.medium
            const assignees =
              task.assignees && task.assignees.length > 0
                ? task.assignees
                : task.assignee_name
                  ? [task.assignee_name]
                  : []

            return (
              <div
                key={task.id}
                onClick={() => handleOpenTask(task)}
                className="group flex items-center justify-between p-3 px-4 gap-3.5 hover:bg-[var(--ds-hover)] transition-colors cursor-pointer"
              >
                {/* Lado Esquerdo: Checkbox Circular + Título da Tarefa */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleTaskStatus(task)
                    }}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                      isDone
                        ? 'bg-[#2F9E5A] border-[#2F9E5A] text-white'
                        : 'border-[var(--line2)] group-hover:border-[#0066FF] text-transparent hover:text-[var(--ds-muted)]'
                    }`}
                    title={isDone ? 'Marcar como A Fazer' : 'Marcar como Concluída'}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </button>

                  <span
                    className={`text-[13px] font-medium truncate transition-colors ${
                      isDone
                        ? 'line-through text-[var(--ds-muted)]'
                        : 'text-[var(--fg)] group-hover:text-[#0066FF]'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                {/* Lado Direito: Status Pill + Prioridade Pill + Avatares + Data + Seta ↗ */}
                <div className="flex items-center gap-2.5 shrink-0">
                  {/* Status Pill */}
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap"
                    style={{
                      color: statusStyle.color,
                      borderColor: statusStyle.border,
                      backgroundColor: statusStyle.bg,
                    }}
                  >
                    {task.status_key}
                  </span>

                  {/* Prioridade Pill com Bandeira */}
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-semibold border whitespace-nowrap"
                    style={{
                      color: prio.color,
                      borderColor: prio.border,
                      backgroundColor: prio.bg,
                    }}
                  >
                    <Flag className="w-2.5 h-2.5 fill-current" />
                    <span>{prio.label}</span>
                  </span>

                  {/* Avatares dos Responsáveis Sobrepostos */}
                  {assignees.length > 0 && (
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {assignees.slice(0, 2).map((name, idx) => (
                        <div
                          key={idx}
                          className="w-5 h-5 rounded-full bg-[var(--line2)] border border-[var(--surface)] text-[9px] font-bold text-[var(--fg)] flex items-center justify-center shrink-0 shadow-xs"
                          title={name}
                        >
                          {getInitials(name)}
                        </div>
                      ))}
                      {assignees.length > 2 && (
                        <div
                          className="w-5 h-5 rounded-full bg-[var(--line)] border border-[var(--surface)] text-[8.5px] font-bold text-[var(--ds-muted)] flex items-center justify-center shrink-0"
                          title={`+${assignees.length - 2} responsáveis`}
                        >
                          +{assignees.length - 2}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Data de Vencimento */}
                  {task.due_date && (
                    <span className="hidden md:inline text-[11px] font-mono text-[var(--ds-muted)]">
                      {task.due_date}
                    </span>
                  )}

                  {/* Seta para Abrir no Modal */}
                  <ArrowUpRight className="w-3.5 h-3.5 text-[var(--ds-muted)] group-hover:text-[#0066FF] transition-colors" />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ======================================================================= */
        /* MODO 2: KANBAN EMBUTIDO DENTRO DO POP-UP DO CLIENTE                     */
        /* ======================================================================= */
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max items-start">
            {DEFAULT_COLUMNS.map((col) => {
              const colTasks = clientTasks.filter(
                (t) => t.status_key.trim().toUpperCase() === col.name.trim().toUpperCase()
              )

              return (
                <div
                  key={col.id}
                  className="w-[260px] bg-[var(--surface)] border border-[var(--line2)] rounded-xl p-3 flex flex-col gap-2.5 shrink-0"
                >
                  {/* Cabeçalho da Coluna */}
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: col.color }}
                      />
                      <span className="text-[11.5px] font-bold text-[var(--fg)] uppercase tracking-wider">
                        {col.name}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-full bg-[var(--bg)] text-[10px] font-bold text-[var(--ds-muted)] tabular-nums">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Lista de Cards da Coluna */}
                  <div className="flex flex-col gap-2 min-h-[140px]">
                    {colTasks.length === 0 ? (
                      <div className="py-8 text-center text-[11px] text-[var(--ds-muted)]">
                        Sem demandas
                      </div>
                    ) : (
                      colTasks.map((t) => {
                        const prio = PRIORITY_CONFIG[t.priority as TaskPriorityLevel] || PRIORITY_CONFIG.medium
                        return (
                          <div
                            key={t.id}
                            onClick={() => handleOpenTask(t)}
                            className="bg-[var(--bg)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] hover:border-[var(--color-brand-blue)]/50 rounded-lg p-2.5 flex flex-col gap-1.5 transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-1 text-[10px]">
                              <span
                                className="px-1.5 py-0.5 rounded border text-[9.5px] font-semibold flex items-center gap-1"
                                style={{
                                  backgroundColor: prio.bg,
                                  borderColor: prio.border,
                                  color: prio.color,
                                }}
                              >
                                <Flag className="w-2.5 h-2.5 fill-current" />
                                <span>{prio.label}</span>
                              </span>
                              {t.due_date && (
                                <span className="text-[var(--ds-muted)] font-mono text-[9.5px]">
                                  {t.due_date.slice(5)}
                                </span>
                              )}
                            </div>

                            <span className="text-[12.5px] font-semibold text-[var(--fg)] leading-snug line-clamp-2">
                              {t.title}
                            </span>

                            <div className="flex items-center justify-between text-[10.5px] text-[var(--ds-muted)] pt-1 border-t border-[var(--line2)]/50">
                              <span className="truncate max-w-[140px]">
                                {t.assignee_name || 'Equipe'}
                              </span>
                              {t.subtasks && t.subtasks.length > 0 && (
                                <span className="flex items-center gap-0.5 text-[var(--fg)] font-semibold">
                                  <GitBranch className="w-2.5 h-2.5 text-[var(--color-brand-blue)]" />
                                  <span>{t.subtasks.length}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL STEPPER: ABRIR ORDEM DE SERVIÇO                                     */}
      {/* ========================================================================= */}
      <OrderServiceDialog
        open={orderServiceOpen}
        onOpenChange={setOrderServiceOpen}
        client={client}
      />

      {/* ========================================================================= */}
      {/* MODAL TASKDIALOG: VISUALIZAÇÃO E EDIÇÃO COMPLETA DA DEMANDA               */}
      {/* ========================================================================= */}
      {editingTask && (
        <TaskDialog
          open={taskDialogOpen}
          onOpenChange={(val) => {
            setTaskDialogOpen(val)
            if (!val) setEditingTask(null)
          }}
          task={editingTask}
          availableLists={taskLists}
          availableClients={clients}
          availableStatuses={DEFAULT_COLUMNS}
          availableMembers={orgMembers.map((m) => m.full_name)}
          currentUserName={authenticatedUser?.name || 'Administrador'}
          onSave={async (patch) => {
            await updateTask(editingTask.id, patch)
            setTaskDialogOpen(false)
            setEditingTask(null)
          }}
          onDelete={async (taskId) => {
            await deleteTask(taskId)
            setTaskDialogOpen(false)
            setEditingTask(null)
          }}
        />
      )}
    </div>
  )
}
