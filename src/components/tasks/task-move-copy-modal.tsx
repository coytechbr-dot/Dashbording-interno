'use client'

import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FolderKanban,
  Copy,
  ArrowRightLeft,
  Layers,
  Check,
  Search,
  List as ListIcon,
  CheckSquare,
} from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'
import { CoyIconRenderer } from '@/components/ui/coy-icon-picker'
import type { TaskItem } from '@/types/coydash'

export type MoveCopyActionType =
  | 'move_task'
  | 'copy_task'
  | 'convert_to_subtask'
  | 'promote_subtask_to_task'
  | 'move_subtask_to_parent'

interface TaskMoveCopyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: TaskItem | null
  initialAction?: MoveCopyActionType
  onSuccess?: () => void
}

export function TaskMoveCopyModal({
  open,
  onOpenChange,
  task,
  initialAction = 'move_task',
  onSuccess,
}: TaskMoveCopyModalProps) {
  const { taskFolders, taskLists, tasks, updateTask, createTask } = useCoyDash()

  const isSubtask = Boolean(task?.parent_task_id)

  const [actionType, setActionType] = useState<MoveCopyActionType>(
    isSubtask ? 'promote_subtask_to_task' : initialAction
  )
  const [selectedListId, setSelectedListId] = useState<string>(task?.list_id || '')
  const [selectedParentTaskId, setSelectedParentTaskId] = useState<string>('')
  const [listSearch, setListSearch] = useState('')
  const [taskSearch, setTaskSearch] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  // Sincronizar ao abrir
  React.useEffect(() => {
    if (open && task) {
      if (task.parent_task_id) {
        setActionType('promote_subtask_to_task')
      } else {
        setActionType(initialAction)
      }
      setSelectedListId(task.list_id || taskLists[0]?.id || '')
      setSelectedParentTaskId('')
      setListSearch('')
      setTaskSearch('')
      setError('')
    }
  }, [open, task, initialAction, taskLists])

  // Filtragem das listas de destino
  const filteredTaskLists = useMemo(() => {
    const q = listSearch.toLowerCase().trim()
    if (!q) return taskLists
    return taskLists.filter((l) => {
      const folder = taskFolders.find((f) => f.id === l.folder_id)
      return (
        l.name.toLowerCase().includes(q) ||
        (folder && folder.name.toLowerCase().includes(q))
      )
    })
  }, [taskLists, taskFolders, listSearch])

  // Lista de possíveis tarefas pai (apenas tarefas principais, excluindo a própria tarefa e subtarefas)
  const availableParentTasks = useMemo(() => {
    if (!task) return []
    const q = taskSearch.toLowerCase().trim()
    return tasks
      .filter((t) => !t.parent_task_id && t.id !== task.id)
      .filter((t) => {
        if (!q) return true
        return (
          t.title.toLowerCase().includes(q) ||
          t.client_name_snapshot?.toLowerCase().includes(q)
        )
      })
  }, [tasks, task, taskSearch])

  const handleExecute = async () => {
    if (!task) return
    setIsProcessing(true)
    setError('')

    try {
      if (actionType === 'move_task') {
        if (!selectedListId) {
          setError('Selecione a lista de destino.')
          setIsProcessing(false)
          return
        }
        await updateTask(task.id, { list_id: selectedListId })
      } else if (actionType === 'copy_task') {
        if (!selectedListId) {
          setError('Selecione a lista de destino.')
          setIsProcessing(false)
          return
        }
        // Clona a tarefa
        const clonedInput: Partial<TaskItem> = {
          title: `${task.title} (Cópia)`,
          description: task.description,
          priority: task.priority,
          status_key: task.status_key || 'A Fazer',
          list_id: selectedListId,
          client_id: task.client_id,
          client_name_snapshot: task.client_name_snapshot,
          assignees: task.assignees,
          assignee_name: task.assignee_name,
          due_date: task.due_date,
          tags: task.tags,
          custom_fields: task.custom_fields,
        }
        const created = await createTask(clonedInput)
        // Se a tarefa original possuía subtarefas filhas no banco, cloná-las vinculadas ao novo id
        if (created?.id) {
          const originalSubs = tasks.filter((sub) => sub.parent_task_id === task.id)
          for (const sub of originalSubs) {
            await createTask({
              title: sub.title,
              description: sub.description,
              parent_task_id: created.id,
              list_id: selectedListId,
              status_key: sub.status_key,
              priority: sub.priority,
              assignees: sub.assignees,
              assignee_name: sub.assignee_name,
            })
          }
        }
      } else if (actionType === 'convert_to_subtask') {
        if (!selectedParentTaskId) {
          setError('Selecione uma tarefa principal para ser o pai desta subtarefa.')
          setIsProcessing(false)
          return
        }
        const parent = tasks.find((t) => t.id === selectedParentTaskId)
        await updateTask(task.id, {
          parent_task_id: selectedParentTaskId,
          list_id: parent?.list_id || task.list_id,
        })
      } else if (actionType === 'promote_subtask_to_task') {
        if (!selectedListId) {
          setError('Selecione a lista de destino da nova tarefa principal.')
          setIsProcessing(false)
          return
        }
        await updateTask(task.id, {
          parent_task_id: null,
          list_id: selectedListId,
        })
      } else if (actionType === 'move_subtask_to_parent') {
        if (!selectedParentTaskId) {
          setError('Selecione a nova tarefa pai de destino.')
          setIsProcessing(false)
          return
        }
        const newParent = tasks.find((t) => t.id === selectedParentTaskId)
        await updateTask(task.id, {
          parent_task_id: selectedParentTaskId,
          list_id: newParent?.list_id || task.list_id,
        })
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (err: unknown) {
      console.error('Erro ao mover/copiar:', err)
      setError(err instanceof Error ? err.message : 'Falha na operação')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="z-[90] bg-black/80 backdrop-blur-md"
        className="sm:max-w-xl md:max-w-2xl lg:max-w-[680px] w-full p-6 sm:p-7 bg-[var(--surface)] text-[var(--fg)] border-[var(--line2)] rounded-2xl shadow-2xl z-[95] gap-4"
      >
        <DialogTitle className="text-[18px] font-bold flex items-center gap-2.5 text-[var(--fg)]">
          <div className="w-8 h-8 rounded-xl bg-[#0066FF]/12 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="w-4 h-4 text-[#0066FF]" />
          </div>
          <span>Mover ou Copiar Tarefa</span>
        </DialogTitle>

        {/* Card de Identificação da Tarefa com Respiro */}
        <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--line2)] flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-[#0066FF] mt-1.5 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ds-muted)]">
              {isSubtask ? 'Subtarefa Selecionada' : 'Tarefa Selecionada'}
            </span>
            <span className="text-[13px] font-semibold text-[var(--fg)] break-words leading-snug">
              {task.title}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-500 text-[12px] font-medium">
            {error}
          </div>
        )}

        {/* Escolha da Ação */}
        <div className="flex flex-col gap-2 mt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ds-muted)]">
            Ação Desejada
          </span>

          <div className="grid grid-cols-1 gap-2">
            {!isSubtask ? (
              <>
                <button
                  type="button"
                  onClick={() => setActionType('move_task')}
                  className={`flex items-center gap-3.5 p-3 rounded-xl border text-left text-[12.5px] font-medium transition-all cursor-pointer ${
                    actionType === 'move_task'
                      ? 'bg-[#0066FF]/12 border-[#0066FF] text-[#0066FF] shadow-xs'
                      : 'border-[var(--line2)] hover:bg-[var(--ds-hover)] text-[var(--fg)]'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      actionType === 'move_task'
                        ? 'bg-[#0066FF] text-white'
                        : 'bg-[var(--bg)] border border-[var(--line2)] text-[var(--fg)]'
                    }`}
                  >
                    <ArrowRightLeft className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-[13px]">Mover tarefa para outra lista</span>
                    <span className="text-[11.5px] text-[var(--ds-muted)]">
                      Transfere a tarefa de lista ou projeto mantendo todo o histórico e comentários
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActionType('copy_task')}
                  className={`flex items-center gap-3.5 p-3 rounded-xl border text-left text-[12.5px] font-medium transition-all cursor-pointer ${
                    actionType === 'copy_task'
                      ? 'bg-[#0066FF]/12 border-[#0066FF] text-[#0066FF] shadow-xs'
                      : 'border-[var(--line2)] hover:bg-[var(--ds-hover)] text-[var(--fg)]'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      actionType === 'copy_task'
                        ? 'bg-[#0066FF] text-white'
                        : 'bg-[var(--bg)] border border-[var(--line2)] text-[var(--fg)]'
                    }`}
                  >
                    <Copy className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-[13px]">Duplicar / copiar tarefa em outra lista</span>
                    <span className="text-[11.5px] text-[var(--ds-muted)]">
                      Cria uma cópia idêntica completa, duplicando inclusive todas as subtarefas
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActionType('convert_to_subtask')}
                  className={`flex items-center gap-3.5 p-3 rounded-xl border text-left text-[12.5px] font-medium transition-all cursor-pointer ${
                    actionType === 'convert_to_subtask'
                      ? 'bg-[#0066FF]/12 border-[#0066FF] text-[#0066FF] shadow-xs'
                      : 'border-[var(--line2)] hover:bg-[var(--ds-hover)] text-[var(--fg)]'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      actionType === 'convert_to_subtask'
                        ? 'bg-[#0066FF] text-white'
                        : 'bg-[var(--bg)] border border-[var(--line2)] text-[var(--fg)]'
                    }`}
                  >
                    <Layers className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-[13px]">Transformar em subtarefa de outra tarefa</span>
                    <span className="text-[11.5px] text-[var(--ds-muted)]">
                      Converte esta tarefa principal em uma etapa filha vinculada a outra tarefa-mãe
                    </span>
                  </div>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActionType('promote_subtask_to_task')}
                  className={`flex items-center gap-3.5 p-3 rounded-xl border text-left text-[12.5px] font-medium transition-all cursor-pointer ${
                    actionType === 'promote_subtask_to_task'
                      ? 'bg-[#0066FF]/12 border-[#0066FF] text-[#0066FF] shadow-xs'
                      : 'border-[var(--line2)] hover:bg-[var(--ds-hover)] text-[var(--fg)]'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      actionType === 'promote_subtask_to_task'
                        ? 'bg-[#0066FF] text-white'
                        : 'bg-[var(--bg)] border border-[var(--line2)] text-[var(--fg)]'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-[13px]">Promover subtarefa para tarefa principal</span>
                    <span className="text-[11.5px] text-[var(--ds-muted)]">
                      Eleva esta subtarefa para o nível principal de uma lista com visibilidade global
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActionType('move_subtask_to_parent')}
                  className={`flex items-center gap-3.5 p-3 rounded-xl border text-left text-[12.5px] font-medium transition-all cursor-pointer ${
                    actionType === 'move_subtask_to_parent'
                      ? 'bg-[#0066FF]/12 border-[#0066FF] text-[#0066FF] shadow-xs'
                      : 'border-[var(--line2)] hover:bg-[var(--ds-hover)] text-[var(--fg)]'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      actionType === 'move_subtask_to_parent'
                        ? 'bg-[#0066FF] text-white'
                        : 'bg-[var(--bg)] border border-[var(--line2)] text-[var(--fg)]'
                    }`}
                  >
                    <Layers className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-[13px]">Mover subtarefa para outra tarefa pai</span>
                    <span className="text-[11.5px] text-[var(--ds-muted)]">
                      Reassocia esta subtarefa a outra demanda-mãe diferente
                    </span>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Seleção do Destino dependendo da Ação */}
        {actionType === 'move_task' ||
        actionType === 'copy_task' ||
        actionType === 'promote_subtask_to_task' ? (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ds-muted)]">
                Lista de Destino
              </span>
              <span className="text-[11px] text-[var(--ds-muted)]">
                {filteredTaskLists.length} {filteredTaskLists.length === 1 ? 'lista disponível' : 'listas disponíveis'}
              </span>
            </div>

            {/* Input de Busca Rápida de Listas */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[var(--ds-muted)] absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Filtrar por nome da lista ou projeto..."
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)] text-[12.5px] text-[var(--fg)] outline-none focus:border-[#0066FF] transition-colors"
              />
            </div>

            <div className="max-h-56 overflow-y-auto flex flex-col gap-1.5 border border-[var(--line2)] rounded-xl p-1.5 bg-[var(--bg)]">
              {filteredTaskLists.length === 0 ? (
                <div className="py-6 text-center text-[12px] text-[var(--ds-muted)]">
                  Nenhuma lista encontrada para "{listSearch}".
                </div>
              ) : (
                filteredTaskLists.map((l) => {
                  const folder = taskFolders.find((f) => f.id === l.folder_id)
                  const isSelected = selectedListId === l.id
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setSelectedListId(l.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0066FF] text-white font-semibold shadow-xs'
                          : 'hover:bg-[var(--surface)] text-[var(--fg)] border border-transparent hover:border-[var(--line2)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-[var(--surface)] border border-[var(--line2)] text-[var(--fg)]'
                          }`}
                        >
                          <CoyIconRenderer icon={l.icon} fallback={ListIcon} className="w-3.5 h-3.5 opacity-90" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="truncate font-semibold text-[13px] leading-tight">
                            {l.name}
                          </span>
                          {folder && (
                            <span
                              className={`text-[11px] truncate flex items-center gap-1 mt-0.5 ${
                                isSelected ? 'text-white/80' : 'text-[var(--ds-muted)]'
                              }`}
                            >
                              <FolderKanban className="w-3 h-3 shrink-0 opacity-70" />
                              <span>{folder.name}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 ml-2">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ds-muted)]">
              Selecionar Tarefa Pai
            </span>

            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[var(--ds-muted)] absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Buscar tarefa principal por título ou cliente..."
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)] text-[12.5px] text-[var(--fg)] outline-none focus:border-[#0066FF] transition-colors"
              />
            </div>

            <div className="max-h-56 overflow-y-auto flex flex-col gap-1.5 border border-[var(--line2)] rounded-xl p-1.5 bg-[var(--bg)]">
              {availableParentTasks.length === 0 ? (
                <div className="py-6 text-center text-[12px] text-[var(--ds-muted)]">
                  Nenhuma tarefa encontrada.
                </div>
              ) : (
                availableParentTasks.map((pt) => {
                  const isSelected = selectedParentTaskId === pt.id
                  return (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => setSelectedParentTaskId(pt.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0066FF] text-white font-semibold shadow-xs'
                          : 'hover:bg-[var(--surface)] text-[var(--fg)] border border-transparent hover:border-[var(--line2)]'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 flex-1 pr-2">
                        <span className="truncate font-semibold text-[13px] leading-tight">
                          {pt.title}
                        </span>
                        {pt.client_name_snapshot && (
                          <span
                            className={`text-[11px] truncate mt-0.5 ${
                              isSelected ? 'text-white/80' : 'text-[var(--ds-muted)]'
                            }`}
                          >
                            Cliente: {pt.client_name_snapshot}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 ml-2">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Rodapé de Ações com Respiro */}
        <div className="flex items-center justify-end gap-2.5 mt-3 pt-4 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl border border-[var(--line2)] hover:bg-[var(--ds-hover)] text-[12.5px] font-semibold text-[var(--ds-muted)] hover:text-[var(--fg)] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleExecute}
            className="px-5 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-50 text-white text-[12.5px] font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            {isProcessing ? 'Processando...' : 'Confirmar e Executar'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
