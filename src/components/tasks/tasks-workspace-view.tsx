'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd'
import {
  Plus,
  LayoutGrid,
  List as ListIcon,
  SlidersHorizontal,
  Trash2,
  X,
  Sparkles,
  CheckSquare,
} from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'
import { TaskCard } from './task-card'
import { TaskDialog } from './task-dialog'
import type { TaskItem } from '@/types/coydash'
import { isTaskAssignedToUser } from '@/lib/task-utils'

const DEFAULT_COLUMNS = [
  { id: 'col-todo', name: 'A FAZER', color: '#64748b', order_index: 0 },
  { id: 'col-doing', name: 'EM ANDAMENTO', color: '#0066FF', order_index: 1 },
  { id: 'col-review', name: 'EM REVISÃO', color: '#e8c14a', order_index: 2 },
  { id: 'col-done', name: 'CONCLUÍDO', color: '#2f9e5a', order_index: 3 },
]

export function TasksWorkspaceView({ listId }: { listId?: string }) {
  const {
    taskFolders,
    taskLists,
    taskStatuses,
    tasks,
    clients,
    createTaskFolder,
    createTaskStatus,
    deleteTaskStatusColumn,
    createTask,
    updateTask,
    deleteTask,
    searchQuery,
    authenticatedUser,
  } = useCoyDash()

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [selectedListFilter, setSelectedListFilter] = useState<string>(listId || 'ALL')
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('ALL')
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('ALL')

  // Filtro "Modo Eu" (ClickUp Me Mode) - MARCADO POR PADRÃO (true)
  const [isMeMode, setIsMeMode] = useState<boolean>(true)

  // Carregar preferência salva em localStorage
  useEffect(() => {
    const storageKey = listId ? `coydash_view_${listId}` : 'coydash_tasks_view'
    const saved = localStorage.getItem(storageKey)
    if (saved === 'kanban' || saved === 'list') {
      setViewMode(saved)
    }
  }, [listId])

  const handleSetViewMode = (mode: 'kanban' | 'list') => {
    setViewMode(mode)
    const storageKey = listId ? `coydash_view_${listId}` : 'coydash_tasks_view'
    localStorage.setItem(storageKey, mode)
  }

  // Controle do TaskDialog (Modal do Roomie Office)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null)
  const [dialogInitialTab, setDialogInitialTab] = useState<'details' | 'comments'>('details')
  const [dialogDefaultStatus, setDialogDefaultStatus] = useState('A FAZER')

  // Modal Gerenciar Status (Colunas do Kanban)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [newStatusName, setNewStatusName] = useState('')
  const [newStatusColor, setNewStatusColor] = useState('#0066FF')

  // Sincronização viva da tarefa aberta com o store em tempo real
  const currentEditingTask = useMemo(() => {
    if (!editingTask) return null
    return tasks.find((t) => t.id === editingTask.id) || editingTask
  }, [editingTask, tasks])

  const activeListObj = useMemo(() => {
    const idToUse = listId || (selectedListFilter !== 'ALL' ? selectedListFilter : null)
    if (!idToUse) return null
    return taskLists.find((l) => l.id === idToUse) || null
  }, [listId, selectedListFilter, taskLists])

  const activeFolderObj = useMemo(() => {
    if (!activeListObj) return null
    return taskFolders.find((f) => f.id === activeListObj.folder_id) || null
  }, [activeListObj, taskFolders])

  // Colunas de status ativas para esta lista (ou padrão)
  const columns = useMemo(() => {
    const targetId = listId || (selectedListFilter !== 'ALL' ? selectedListFilter : null)
    if (targetId) {
      const custom = taskStatuses
        .filter((s) => s.list_id === targetId)
        .sort((a, b) => a.order_index - b.order_index)
      if (custom.length > 0) return custom
    }
    return DEFAULT_COLUMNS
  }, [listId, selectedListFilter, taskStatuses])

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return tasks.filter((t) => {
      const effectiveList = listId || selectedListFilter
      if (effectiveList && effectiveList !== 'ALL' && t.list_id !== effectiveList) {
        return false
      }
      if (selectedPriorityFilter !== 'ALL' && t.priority !== selectedPriorityFilter) {
        return false
      }
      if (selectedClientFilter !== 'ALL' && t.client_id !== selectedClientFilter) {
        return false
      }

      // Filtro "Modo Eu" (ClickUp Me Mode) - marcado por padrão:
      // Quando ativo, só exibe as tarefas em que o usuário logado está marcado como responsável!
      if (isMeMode) {
        const isAssigned = isTaskAssignedToUser(t, authenticatedUser)
        if (!isAssigned) return false
      }

      if (q) {
        const match =
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.client_name_snapshot.toLowerCase().includes(q) ||
          t.assignee_name.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [
    tasks,
    listId,
    selectedListFilter,
    selectedPriorityFilter,
    selectedClientFilter,
    searchQuery,
    isMeMode,
    authenticatedUser,
  ])

  // Membros disponíveis para atribuição
  const availableMembers = useMemo(() => {
    const defaultList = [
      'Gabrielly Maia',
      'Felipe Cavalcante',
      'Débora Carvalho',
      'Wilton',
      authenticatedUser?.name,
    ].filter(Boolean) as string[]
    return Array.from(new Set(defaultList))
  }, [authenticatedUser])

  const handleOpenCreateModal = (statusName?: string) => {
    setEditingTask(null)
    setDialogInitialTab('details')
    setDialogDefaultStatus(statusName || columns[0]?.name || 'A FAZER')
    setIsTaskDialogOpen(true)
  }

  const handleOpenEditModal = (task: TaskItem, tab: 'details' | 'comments' = 'details') => {
    setEditingTask(task)
    setDialogInitialTab(tab)
    setIsTaskDialogOpen(true)
  }

  const handleSaveTask = async (taskData: Partial<TaskItem>) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData)
    } else {
      // Criando nova tarefa: garante que o criador seja automaticamente incluído como responsável
      const creatorName = authenticatedUser?.name || 'Administrador'
      const assigneesList = Array.isArray(taskData.assignees) ? [...taskData.assignees] : []
      if (!assigneesList.some((a) => a.toLowerCase().trim() === creatorName.toLowerCase().trim())) {
        assigneesList.push(creatorName)
      }
      const enrichedData = {
        ...taskData,
        assignees: assigneesList,
        assignee_name: assigneesList.join(', '),
      }
      await createTask(enrichedData)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId)
  }

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const nextStatusKey = destination.droppableId
    await updateTask(draggableId, { status_key: nextStatusKey })
  }

  const handleSeedSampleWorkspace = async () => {
    await createTaskFolder('Tráfego Pago & Performance', 'Target')
    await createTaskFolder('Design & Criativos', 'Megaphone')
    await createTaskFolder('Onboarding & CS', 'Headphones')

    await createTask({
      title: 'Subir campanha de Meta Ads · Tese Revisão da Vida Toda',
      description: 'Configurar 3 conjuntos de anúncios e testar 4 criativos em vídeo.',
      status_key: 'EM ANDAMENTO',
      priority: 'high',
      assignee_name: 'Gabrielly Maia',
      assignees: ['Gabrielly Maia'],
      client_name_snapshot: 'Wilson Cobra Advocacia',
      due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      subtasks: [
        { id: 's1', title: 'Validar pixel e API de Conversões', is_completed: true },
        { id: 's2', title: 'Subir vídeos 9:16 e 4:5', is_completed: true },
        { id: 's3', title: 'Ativar orçamento inicial R$ 100/dia', is_completed: false },
      ],
    })

    await createTask({
      title: 'Criar 5 criativos estáticos 1080x1350 no Canva',
      description: 'Foco em Direito Bancário e Fraudes Pix.',
      status_key: 'A FAZER',
      priority: 'medium',
      assignee_name: 'Felipe Cavalcante',
      assignees: ['Felipe Cavalcante'],
      client_name_snapshot: 'Eulálio Oliveira Advocacia',
      due_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      subtasks: [
        { id: 's4', title: 'Aplicar paleta do cliente', is_completed: true },
        { id: 's5', title: 'Exportar e enviar para aprovação no grupo', is_completed: false },
      ],
    })
  }

  return (
    <div className="px-[26px] pt-[18px] pb-[40px] flex flex-col gap-[16px] h-full">
      {/* HEADER DO WORKSPACE DE TAREFAS (100% DESIGN SYSTEM ROOMIE OFFICE AI) */}
      <div className="flex flex-wrap items-center justify-between gap-[14px]">
        <div>
          <div className="flex items-center gap-[8px] text-[11.5px] text-[var(--ds-muted)]">
            <span>Setores & Projetos</span>
            {activeFolderObj && (
              <>
                <span>/</span>
                <span className="text-[var(--color-brand-orange)] font-semibold">
                  {activeFolderObj.name}
                </span>
              </>
            )}
          </div>
          <h1 className="text-[26px] font-bold tracking-[-0.5px]">
            {activeListObj ? activeListObj.name : isMeMode ? 'Minhas Tarefas' : 'Todas as Tarefas'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-[8px]">
          {/* Alternador Kanban | Lista com persistência */}
          <div className="flex items-center bg-[var(--surface)] border border-[var(--line2)] rounded-full p-[3px]">
            <button
              type="button"
              onClick={() => handleSetViewMode('kanban')}
              className={`px-[12px] py-[5px] rounded-full text-[12px] font-semibold flex items-center gap-[6px] cursor-pointer transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-[var(--color-brand-orange)] text-[#141414]'
                  : 'text-[var(--ds-muted)] hover:text-[var(--fg)]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode('list')}
              className={`px-[12px] py-[5px] rounded-full text-[12px] font-semibold flex items-center gap-[6px] cursor-pointer transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--color-brand-orange)] text-[#141414]'
                  : 'text-[var(--ds-muted)] hover:text-[var(--fg)]'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
          </div>

          {activeListObj && (
            <button
              type="button"
              onClick={() => setStatusModalOpen(true)}
              className="h-[38px] px-[14px] rounded-full bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[12px] font-medium flex items-center gap-[6px] cursor-pointer transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--color-brand-orange)]" />
              <span>Gerenciar Status</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleOpenCreateModal(columns[0]?.name || 'A FAZER')}
            className="h-[38px] px-[18px] rounded-full bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange-hover)] text-[#141414] font-bold text-[13px] flex items-center gap-[6px] cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS E BUSCA */}
      <div className="flex flex-wrap items-center gap-[8px]">
        {/* BOTÃO MODO EU (CLICKUP ME MODE) - MARCADO POR PADRÃO */}
        <button
          type="button"
          onClick={() => setIsMeMode((prev) => !prev)}
          className={`h-[34px] px-[13px] rounded-full border text-[12px] font-semibold flex items-center gap-[7px] cursor-pointer transition-all select-none ${
            isMeMode
              ? 'bg-[var(--color-brand-orange)]/15 border-[var(--color-brand-orange)] text-[var(--color-brand-orange)] shadow-xs'
              : 'bg-[var(--surface)] hover:bg-[var(--ds-hover)] border-[var(--line2)] text-[var(--ds-muted)] hover:text-[var(--fg)]'
          }`}
          title={
            isMeMode
              ? 'Modo Eu ativo: exibindo apenas tarefas atribuídas a você. Clique para desmarcar e ver todas as tarefas com acesso.'
              : 'Modo Eu desmarcado: exibindo todas as tarefas do projeto/lista com acesso. Clique para filtrar apenas as suas tarefas.'
          }
        >
          <div
            className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9.5px] font-bold ${
              isMeMode
                ? 'bg-[var(--color-brand-orange)] text-[#141414]'
                : 'bg-[var(--bg)] border border-[var(--line2)] text-[var(--ds-muted)]'
            }`}
          >
            {authenticatedUser?.name
              ? authenticatedUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : 'EU'}
          </div>
          <span>Modo Eu</span>
          <span
            className={`px-[6px] py-[1px] rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
              isMeMode
                ? 'bg-[var(--color-brand-orange)]/25 text-[var(--color-brand-orange)]'
                : 'bg-[var(--bg)] text-[var(--ds-muted)] border border-[var(--line2)]'
            }`}
          >
            {isMeMode ? 'Ativo' : 'Todos'}
          </span>
        </button>
        {!listId && (
          <select
            value={selectedListFilter}
            onChange={(e) => setSelectedListFilter(e.target.value)}
            className="h-[34px] px-[12px] rounded-full bg-[var(--surface)] border border-[var(--line2)] text-[12px] text-[var(--fg)] outline-none cursor-pointer"
          >
            <option value="ALL">Todas as listas / setores</option>
            {taskLists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={selectedClientFilter}
          onChange={(e) => setSelectedClientFilter(e.target.value)}
          className="h-[34px] px-[12px] rounded-full bg-[var(--surface)] border border-[var(--line2)] text-[12px] text-[var(--fg)] outline-none cursor-pointer"
        >
          <option value="ALL">Todos os clientes</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedPriorityFilter}
          onChange={(e) => setSelectedPriorityFilter(e.target.value)}
          className="h-[34px] px-[12px] rounded-full bg-[var(--surface)] border border-[var(--line2)] text-[12px] text-[var(--fg)] outline-none cursor-pointer"
        >
          <option value="ALL">Todas as prioridades</option>
          <option value="urgent">Urgente</option>
          <option value="high">Alta</option>
          <option value="medium">Média</option>
          <option value="low">Baixa</option>
        </select>

        {tasks.length === 0 && (
          <button
            type="button"
            onClick={handleSeedSampleWorkspace}
            className="h-[34px] px-[14px] rounded-full bg-[var(--color-brand-orange)]/15 border border-[var(--color-brand-orange)]/40 text-[var(--color-brand-orange)] text-[12px] font-semibold flex items-center gap-[6px] cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Criar Setores & Tarefas de Exemplo</span>
          </button>
        )}
      </div>

      {/* QUADRO KANBAN COM DRAG AND DROP E DESIGN SYSTEM ROOMIE OFFICE */}
      {viewMode === 'kanban' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex-1 overflow-x-auto pb-[16px]">
            <div className="flex gap-[16px] min-w-max h-full items-start">
              {columns.map((col) => {
                const colTasks = filteredTasks.filter(
                  (t) => t.status_key.toUpperCase() === col.name.toUpperCase()
                )

                return (
                  <div
                    key={col.id}
                    className="w-[310px] shrink-0 bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[12px] flex flex-col gap-[10px]"
                  >
                    {/* Cabeçalho da Coluna */}
                    <div className="flex items-center justify-between px-[6px] py-[4px]">
                      <div className="flex items-center gap-[8px]">
                        <span
                          className="w-[8px] h-[8px] rounded-full"
                          style={{ backgroundColor: col.color }}
                        />
                        <span className="text-[12px] font-bold tracking-[0.04em] uppercase text-[var(--fg)]">
                          {col.name}
                        </span>
                        <span className="px-[7px] py-[1px] rounded-full bg-[var(--bg)] border border-[var(--line2)] text-[10.5px] font-semibold text-[var(--ds-muted)]">
                          {colTasks.length}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenCreateModal(col.name)}
                        className="w-[24px] h-[24px] rounded-[6px] hover:bg-[var(--bg)] grid place-items-center text-[var(--ds-muted)] hover:text-[var(--color-brand-orange)] cursor-pointer transition-colors"
                        title={`Adicionar tarefa em ${col.name}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Droppable Container */}
                    <Droppable droppableId={col.name}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex flex-col gap-[10px] min-h-[260px] rounded-[12px] transition-colors ${
                            snapshot.isDraggingOver
                              ? 'bg-[var(--color-brand-orange)]/5 p-[4px]'
                              : ''
                          }`}
                        >
                          {colTasks.map((task, index) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              index={index}
                              onEdit={(t, tab) => handleOpenEditModal(t, tab)}
                            />
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })}
            </div>
          </div>
        </DragDropContext>
      ) : (
        /* VISÃO EM LISTA REFINADA */
        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] overflow-hidden">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--line)] text-[11px] uppercase text-[var(--ds-muted)]">
                <th className="py-[12px] px-[16px]">Tarefa</th>
                <th className="py-[12px] px-[12px]">Cliente</th>
                <th className="py-[12px] px-[12px]">Status</th>
                <th className="py-[12px] px-[12px]">Prioridade</th>
                <th className="py-[12px] px-[12px]">Responsáveis</th>
                <th className="py-[12px] px-[12px]">Prazo</th>
                <th className="py-[12px] px-[12px]">Checklist</th>
                <th className="py-[12px] px-[16px] text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[var(--ds-muted)]">
                    Nenhuma tarefa encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => {
                  const doneSub = (t.subtasks || []).filter((s) => s.is_completed).length
                  const totalSub = (t.subtasks || []).length
                  return (
                    <tr
                      key={t.id}
                      onClick={() => handleOpenEditModal(t, 'details')}
                      className="border-b border-[var(--line)] hover:bg-[var(--ds-hover)] cursor-pointer transition-colors"
                    >
                      <td className="py-[12px] px-[16px] font-semibold text-[var(--fg)]">
                        {t.title}
                      </td>
                      <td className="py-[12px] px-[12px] text-[var(--ds-muted)]">
                        {t.client_name_snapshot || '—'}
                      </td>
                      <td className="py-[12px] px-[12px]">
                        <span className="px-[8px] py-[2px] rounded-full bg-[var(--bg)] border border-[var(--line2)] text-[11px] font-semibold">
                          {t.status_key}
                        </span>
                      </td>
                      <td className="py-[12px] px-[12px]">
                        <span
                          className={`px-[8px] py-[2px] rounded-[6px] border text-[10.5px] font-bold ${
                            t.priority === 'urgent'
                              ? 'bg-red-500/15 text-red-600 border-red-500/30'
                              : t.priority === 'high'
                                ? 'bg-orange-500/15 text-orange-600 border-orange-500/30'
                                : t.priority === 'medium'
                                  ? 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30'
                                  : 'bg-green-500/15 text-green-600 border-green-500/30'
                          }`}
                        >
                          {t.priority === 'urgent'
                            ? 'Urgente'
                            : t.priority === 'high'
                              ? 'Alta'
                              : t.priority === 'medium'
                                ? 'Média'
                                : 'Baixa'}
                        </span>
                      </td>
                      <td className="py-[12px] px-[12px] text-[var(--fg)]">
                        {t.assignees && t.assignees.length > 0
                          ? t.assignees.join(', ')
                          : t.assignee_name || '—'}
                      </td>
                      <td className="py-[12px] px-[12px] text-[var(--ds-muted)] font-mono text-[12px]">
                        {t.due_date || '—'}
                      </td>
                      <td className="py-[12px] px-[12px]">
                        {totalSub > 0 ? (
                          <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--ds-muted)] font-medium">
                            <CheckSquare className="w-3.5 h-3.5 text-[var(--color-brand-orange)]" />
                            {doneSub}/{totalSub}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-[12px] px-[16px] text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTask(t.id)
                          }}
                          className="text-[var(--ds-muted)] hover:text-red-500 cursor-pointer p-1"
                          title="Excluir tarefa"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL TASKDIALOG (ROOMIE OFFICE AI) EM 3 COLUNAS: DETALHES, BARRA CENTRAL E COMENTÁRIOS */}
      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        task={currentEditingTask}
        defaultListId={listId || (selectedListFilter !== 'ALL' ? selectedListFilter : undefined)}
        defaultStatusKey={dialogDefaultStatus}
        allTasks={tasks}
        availableLists={taskLists}
        availableClients={clients}
        availableStatuses={columns}
        availableMembers={availableMembers}
        currentUserName={authenticatedUser?.name || 'Administrador'}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      {/* MODAL GERENCIAR STATUS (COLUNAS DO KANBAN) */}
      {statusModalOpen && activeListObj && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-[18px]">
          <div className="w-full max-w-[440px] bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] p-[22px] flex flex-col gap-[14px]">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-[var(--fg)]">
                Colunas de Status · {activeListObj.name}
              </h2>
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="w-[30px] h-[30px] rounded-full bg-[var(--bg)] grid place-items-center text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-[8px] max-h-[260px] overflow-y-auto">
              {columns.map((col) => (
                <div
                  key={col.id}
                  className="flex items-center justify-between px-[12px] py-[8px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)]"
                >
                  <div className="flex items-center gap-[8px]">
                    <span
                      className="w-[10px] h-[10px] rounded-full"
                      style={{ backgroundColor: col.color }}
                    />
                    <span className="text-[13px] font-semibold text-[var(--fg)]">{col.name}</span>
                  </div>
                  {!col.id.startsWith('col-') && (
                    <button
                      type="button"
                      onClick={() => deleteTaskStatusColumn(col.id)}
                      className="text-[var(--ds-muted)] hover:text-red-500 cursor-pointer p-1"
                      title="Excluir coluna"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!newStatusName.trim()) return
                await createTaskStatus(
                  activeListObj.id,
                  newStatusName.trim().toUpperCase(),
                  newStatusColor,
                  columns.length
                )
                setNewStatusName('')
              }}
              className="flex items-center gap-[8px] pt-[8px] border-t border-[var(--line)]"
            >
              <input
                type="color"
                value={newStatusColor}
                onChange={(e) => setNewStatusColor(e.target.value)}
                className="w-[38px] h-[38px] rounded-[8px] bg-transparent border-0 cursor-pointer"
              />
              <input
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                placeholder="Nova coluna (ex: AGUARDANDO CLIENTE)"
                className="flex-1 h-[38px] px-[12px] rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[12.5px] text-[var(--fg)] outline-none"
              />
              <button
                type="submit"
                className="h-[38px] px-[14px] rounded-[8px] bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange-hover)] text-[#141414] font-bold text-[12px] cursor-pointer"
              >
                Adicionar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
