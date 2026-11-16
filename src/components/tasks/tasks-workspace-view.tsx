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
  GitBranch,
  ChevronDown,
  ChevronRight,
  Archive,
  ArchiveRestore,
  Settings2,
  Layers,
  FolderKanban,
  Milestone,
  Globe,
  Palette,
  Rocket,
  Users,
  Building2,
  Flag,
  Search,
  MoreVertical,
  Copy,
  Star,
  ArrowRightLeft,
  Columns,
  ExternalLink,
  Calendar,
  MessageSquare,
  Check,
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CoyDropdown, type CoyDropdownOption } from '@/components/ui/coy-dropdown'
import { CoyColorPicker } from '@/components/ui/coy-color-picker'
import { CoyIconPickerPopover, CoyIconRenderer } from '@/components/ui/coy-icon-picker'
import { useCoyDash } from '@/lib/coydash-store'
import { TaskCard } from './task-card'
import { TaskDialog } from './task-dialog'
import { CustomFieldsStudioDialog } from './custom-fields-studio-dialog'
import { TaskQuickStatusPopover } from './task-quick-status-popover'
import { TaskQuickCommentsPopover } from './task-quick-comments-popover'
import { TaskMoveCopyModal } from './task-move-copy-modal'
import { AutoLinkText } from '@/components/ui/auto-link-text'
import { CoyAssigneePicker, getAvatarGradient, getInitials } from '@/components/ui/coy-assignee-picker'
import type { TaskItem, TaskPriorityLevel } from '@/types/coydash'
import { isTaskAssignedToUser } from '@/lib/task-utils'
import {
  hasFeaturePermission,
  canUserDeleteTask,
  canUserArchiveTask,
} from '@/lib/access-control'

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
    orgMembers,
    currentUserPermissions,
    createTaskFolder,
    updateTaskList,
    createTaskStatus,
    deleteTaskStatusColumn,
    createTask,
    updateTask,
    archiveTask,
    deleteTask,
    addTaskComment,
    customFieldDefs = [],
    searchQuery,
    authenticatedUser,
  } = useCoyDash()

  const userPermCtx = useMemo(
    () => ({
      userId: authenticatedUser?.id,
      email: authenticatedUser?.email,
      name: authenticatedUser?.name,
      role: currentUserPermissions?.role || authenticatedUser?.role,
      access_type: currentUserPermissions?.access_type,
      custom_permissions: currentUserPermissions?.custom_permissions,
    }),
    [authenticatedUser, currentUserPermissions]
  )

  const canCreateTask = useMemo(
    () => hasFeaturePermission(userPermCtx, 'tasks.create'),
    [userPermCtx]
  )
  const canManageColumns = useMemo(
    () => hasFeaturePermission(userPermCtx, 'tasks.manage_columns'),
    [userPermCtx]
  )
  const canManageCustomFields = useMemo(
    () => hasFeaturePermission(userPermCtx, 'custom_fields.manage'),
    [userPermCtx]
  )
  const canManageStructure = useMemo(
    () => hasFeaturePermission(userPermCtx, 'tasks.manage_structure'),
    [userPermCtx]
  )

  const [expandedListRows, setExpandedListRows] = useState<Record<string, boolean>>({})
  const [showArchived, setShowArchived] = useState(false)
  const [customFieldsStudioOpen, setCustomFieldsStudioOpen] = useState(false)

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [selectedListFilter, setSelectedListFilter] = useState<string>(listId || 'ALL')
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('ALL')
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('ALL')

  // Filtro de pesquisa de tarefas interna na tela (Item 8)
  const [taskSearchQuery, setTaskSearchQuery] = useState('')

  // Configuração e persistência de colunas visíveis da tabela (Item 12 estilo ClickUp)
  const [columnsPopoverOpen, setColumnsPopoverOpen] = useState(false)
  const [colSearchQuery, setColSearchQuery] = useState('')
  const [visibleCols, setVisibleCols] = useState<{
    client: boolean
    status: boolean
    priority: boolean
    assignees: boolean
    dueDate: boolean
    subtasks: boolean
    comments: boolean
    customFieldIds: string[]
  }>({
    client: true,
    status: true,
    priority: true,
    assignees: true,
    dueDate: true,
    subtasks: true,
    comments: true,
    customFieldIds: [],
  })

  // Carregar colunas visíveis salvas
  useEffect(() => {
    try {
      const storageKey = `coydash_list_cols_${listId || 'global'}`
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        setVisibleCols((prev) => ({ ...prev, ...parsed }))
      }
    } catch {}
  }, [listId])

  const toggleColumnVisibility = (key: keyof Omit<typeof visibleCols, 'customFieldIds'>) => {
    setVisibleCols((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem(`coydash_list_cols_${listId || 'global'}`, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const toggleCustomFieldCol = (fieldId: string) => {
    setVisibleCols((prev) => {
      const exists = prev.customFieldIds.includes(fieldId)
      const nextIds = exists
        ? prev.customFieldIds.filter((id) => id !== fieldId)
        : [...prev.customFieldIds, fieldId]
      const next = { ...prev, customFieldIds: nextIds }
      try {
        localStorage.setItem(`coydash_list_cols_${listId || 'global'}`, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  // Modal de mover/copiar tarefa da tabela ou card
  const [moveCopyTask, setMoveCopyTask] = useState<TaskItem | null>(null)
  const [subtaskToDeleteId, setSubtaskToDeleteId] = useState<string | null>(null)

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

  const subtasksByParentId = useMemo(() => {
    const map = new Map<string, TaskItem[]>()
    for (const t of tasks) {
      if (t.parent_task_id) {
        const current = map.get(t.parent_task_id) || []
        current.push(t)
        map.set(t.parent_task_id, current)
      }
    }
    return map
  }, [tasks])

  const filteredTasks = useMemo(() => {
    const q = (taskSearchQuery || searchQuery).trim().toLowerCase()
    return tasks.filter((t) => {
      // Subtarefas ficam agrupadas dentro da tarefa pai no Kanban (+ X subtarefas) e na expansão da Lista
      if (t.parent_task_id) return false

      // Filtro de Arquivadas vs Ativas
      if (Boolean(t.is_archived) !== showArchived) return false

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

      const childSubs = subtasksByParentId.get(t.id) || []

      // Filtro "Modo Eu" (ClickUp Me Mode) - exibe se o usuário é responsável pelo pai ou por alguma subtarefa
      if (isMeMode) {
        const isAssignedParent = isTaskAssignedToUser(t, authenticatedUser)
        const isAssignedChild = childSubs.some((sub) =>
          isTaskAssignedToUser(sub, authenticatedUser)
        )
        if (!isAssignedParent && !isAssignedChild) return false
      }

      if (q) {
        const matchParent =
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.client_name_snapshot.toLowerCase().includes(q) ||
          t.assignee_name.toLowerCase().includes(q)
        const matchChild = childSubs.some(
          (sub) =>
            sub.title.toLowerCase().includes(q) ||
            sub.assignee_name.toLowerCase().includes(q)
        )
        if (!matchParent && !matchChild) return false
      }
      return true
    })
  }, [
    tasks,
    subtasksByParentId,
    listId,
    selectedListFilter,
    selectedPriorityFilter,
    selectedClientFilter,
    searchQuery,
    taskSearchQuery,
    isMeMode,
    authenticatedUser,
    showArchived,
  ])

  // Colunas de status ativas: quando em lista específica, usa as colunas da lista.
  // Quando em "Todas as listas / setores", reúne as colunas padrão + qualquer status ativo presente nas tarefas da tela!
  const columns = useMemo(() => {
    const targetId = listId || (selectedListFilter !== 'ALL' ? selectedListFilter : null)
    if (targetId) {
      const custom = taskStatuses
        .filter((s) => s.list_id === targetId)
        .sort((a, b) => a.order_index - b.order_index)
      if (custom.length > 0) return custom
      return DEFAULT_COLUMNS
    }

    // MODO MULTI-LISTAS ("Todas as listas / setores"):
    // 1. Inicia com as colunas padrão
    const colMap = new Map<string, { id: string; name: string; color: string; order_index: number }>()
    DEFAULT_COLUMNS.forEach((c) => {
      colMap.set(c.name.toUpperCase(), { ...c })
    })

    // 2. Coleta status ativos das tarefas exibidas
    filteredTasks.forEach((t) => {
      const statusRaw = (t.status_key || 'A FAZER').trim()
      const statusUpper = statusRaw.toUpperCase()
      if (!colMap.has(statusUpper)) {
        // Busca cor personalizada em taskStatuses se existir
        const knownStatus = taskStatuses.find((s) => s.name.toUpperCase() === statusUpper)
        colMap.set(statusUpper, {
          id: `dyn-${statusUpper.toLowerCase().replace(/\s+/g, '-')}`,
          name: statusRaw.toUpperCase(),
          color: knownStatus?.color || '#0066FF',
          order_index: 10 + colMap.size,
        })
      }
    })

    return Array.from(colMap.values()).sort((a, b) => a.order_index - b.order_index)
  }, [listId, selectedListFilter, taskStatuses, filteredTasks])

  const archivedCount = useMemo(
    () => tasks.filter((t) => !t.parent_task_id && Boolean(t.is_archived)).length,
    [tasks]
  )

  // Opções estilizadas para dropdowns com ícones de tarefas e setores
  const listDropdownOptions = useMemo(() => {
    const listOpts: CoyDropdownOption[] = [
      {
        value: 'ALL',
        label: 'Todas as listas / setores',
        icon: <Layers className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />,
        badge: tasks.filter((t) => !t.parent_task_id && !t.is_archived).length,
      },
    ]

    taskLists.forEach((l) => {
      const taskCount = tasks.filter((t) => t.list_id === l.id && !t.parent_task_id && !t.is_archived).length
      let icon = (
        <CoyIconRenderer
          icon={l.icon}
          fallback={FolderKanban}
          className="w-3.5 h-3.5 text-[var(--color-brand-blue)]"
        />
      )
      if (!l.icon || l.icon === 'List') {
        const nameLower = l.name.toLowerCase()
        if (nameLower.includes('fase')) {
          icon = <Milestone className="w-3.5 h-3.5 text-blue-400" />
        } else if (nameLower.includes('meta') || nameLower.includes('google') || nameLower.includes('tráfego') || nameLower.includes('ads')) {
          icon = <Globe className="w-3.5 h-3.5 text-cyan-400" />
        } else if (nameLower.includes('canva') || nameLower.includes('criativo') || nameLower.includes('brand') || nameLower.includes('design')) {
          icon = <Palette className="w-3.5 h-3.5 text-indigo-400" />
        } else if (nameLower.includes('kickoff') || nameLower.includes('implantação')) {
          icon = <Rocket className="w-3.5 h-3.5 text-emerald-400" />
        }
      }

      listOpts.push({
        value: l.id,
        label: l.name,
        icon,
        badge: taskCount,
      })
    })

    return listOpts
  }, [taskLists, tasks])

  const clientDropdownOptions = useMemo(() => {
    const opts: CoyDropdownOption[] = [
      {
        value: 'ALL',
        label: 'Todos os clientes',
        icon: <Users className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />,
      },
    ]

    clients.forEach((c) => {
      opts.push({
        value: c.id,
        label: c.name,
        icon: <Building2 className="w-3.5 h-3.5 text-[var(--ds-muted)]" />,
      })
    })

    return opts
  }, [clients])

  const priorityDropdownOptions: CoyDropdownOption[] = useMemo(
    () => [
      {
        value: 'ALL',
        label: 'Todas as prioridades',
        icon: <Flag className="w-3.5 h-3.5 text-[var(--ds-muted)]" />,
      },
      {
        value: 'urgent',
        label: 'Urgente',
        icon: <Flag className="w-3.5 h-3.5 text-red-500 fill-red-500/20" />,
        colorDot: '#EF4444',
      },
      {
        value: 'high',
        label: 'Alta',
        icon: <Flag className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />,
        colorDot: '#F59E0B',
      },
      {
        value: 'medium',
        label: 'Média',
        icon: <Flag className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20" />,
        colorDot: '#3B82F6',
      },
      {
        value: 'low',
        label: 'Baixa',
        icon: <Flag className="w-3.5 h-3.5 text-slate-400" />,
        colorDot: '#94A3B8',
      },
    ],
    []
  )

  // Membros disponíveis para atribuição
  const availableMembers = useMemo(() => {
    const defaultList = [
      ...orgMembers.map((m) => m.full_name),
      'Gabrielly Maia',
      'Felipe Cavalcante',
      'Débora Carvalho',
      'Wilton',
      authenticatedUser?.name,
    ]
      .filter(Boolean)
      .map((s) => String(s).trim())
    return Array.from(new Set(defaultList))
  }, [orgMembers, authenticatedUser])

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

  const handleSaveTask = async (taskData: Partial<TaskItem>): Promise<TaskItem | null> => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData)
      return editingTask
    } else {
      // Criando nova tarefa: garante que o criador seja automaticamente incluído caso não haja responsável
      const creatorName = authenticatedUser?.name || 'Administrador'
      const assigneesList = Array.isArray(taskData.assignees) ? [...taskData.assignees] : []
      if (assigneesList.length === 0) {
        assigneesList.push(creatorName)
      }
      const enrichedData = {
        ...taskData,
        assignees: assigneesList,
        assignee_name: assigneesList.join(', '),
      }
      return await createTask(enrichedData)
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
    const targetTask = tasks.find((t) => t.id === draggableId)

    // Se a tarefa pertencer a uma lista específica e esse status ainda não existir nas colunas da lista,
    // registra automaticamente em task_statuses para manter a integridade quando filtrar por aquela lista!
    if (targetTask?.list_id) {
      const existsInList = taskStatuses.some(
        (s) => s.list_id === targetTask.list_id && s.name.toUpperCase() === nextStatusKey.toUpperCase()
      )
      if (!existsInList) {
        const destCol = columns.find((c) => c.name.toUpperCase() === nextStatusKey.toUpperCase())
        await createTaskStatus(
          targetTask.list_id,
          nextStatusKey.toUpperCase(),
          destCol?.color || '#0066FF',
          columns.length
        )
      }
    }

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
            <span>Projetos & Tarefas</span>
            {activeFolderObj && (
              <>
                <span>/</span>
                <span className="text-[var(--ds-muted)]">
                  {activeFolderObj.name}
                </span>
              </>
            )}
            {activeListObj && (
              <>
                <span>/</span>
                <span className="text-[var(--color-brand-blue)] font-semibold">
                  {activeListObj.name}
                </span>
              </>
            )}
            {!activeFolderObj && !activeListObj && (
              <>
                <span>/</span>
                <span className="text-[var(--color-brand-blue)] font-semibold">
                  Minhas Tarefas
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-[10px]">
            {activeListObj && (
              <CoyIconPickerPopover
                currentIcon={activeListObj.icon}
                defaultIcon="List"
                disabled={!canManageStructure}
                title={`Ícone de ${activeListObj.name}`}
                onSelect={async (newIcon) => {
                  await updateTaskList(activeListObj.id, activeListObj.name, newIcon, activeListObj.folder_id)
                }}
                triggerClassName="w-8 h-8 rounded-[8px] bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[#0066FF] hover:border-[#0066FF] transition-all flex items-center justify-center cursor-pointer shadow-xs"
              />
            )}
            <h1 className="text-[26px] font-bold tracking-[-0.5px]">
              {activeListObj ? activeListObj.name : isMeMode ? 'Minhas Tarefas' : 'Todas as Tarefas'}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-[8px]">
          {/* Alternador Kanban | Lista com persistência */}
          <div className="flex items-center bg-[var(--surface)] border border-[var(--line2)] rounded-full p-[3px]">
            <button
              type="button"
              onClick={() => handleSetViewMode('kanban')}
              className={`px-[12px] py-[5px] rounded-full text-[12px] font-semibold flex items-center gap-[6px] cursor-pointer transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-[var(--color-brand-blue)] text-white'
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
                  ? 'bg-[var(--color-brand-blue)] text-white'
                  : 'text-[var(--ds-muted)] hover:text-[var(--fg)]'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
          </div>

          {activeListObj && canManageColumns && (
            <button
              type="button"
              onClick={() => setStatusModalOpen(true)}
              className="h-[38px] px-[14px] rounded-full bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] hover:border-[var(--color-brand-blue)]/50 text-[12px] font-medium flex items-center gap-[6px] cursor-pointer transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
              <span>Gerenciar Status</span>
            </button>
          )}

          {canManageCustomFields && (
            <button
              type="button"
              onClick={() => setCustomFieldsStudioOpen(true)}
              className="h-[38px] px-[14px] rounded-full bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] hover:border-[var(--color-brand-blue)]/50 text-[12px] font-semibold flex items-center gap-[6px] cursor-pointer transition-colors"
              title="Abrir Configurações de Campos Personalizados, Modelos e Grupos"
            >
              <Settings2 className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
              <span>Configurar Campos</span>
            </button>
          )}

          {canCreateTask && (
            <button
              type="button"
              onClick={() => handleOpenCreateModal(columns[0]?.name || 'A FAZER')}
              className="h-[38px] px-[18px] rounded-full bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue-hover)] text-white font-bold text-[13px] flex items-center gap-[6px] cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span>Nova Tarefa</span>
            </button>
          )}
        </div>
      </div>

      {/* BARRA DE FILTROS E BUSCA */}
      <div className="flex flex-wrap items-center gap-[8px]">
        {/* PESQUISA DE TAREFAS DENTRO DA LISTA (ITEM 8) */}
        <div className="relative flex items-center min-w-[210px] max-w-[280px]">
          <Search className="w-3.5 h-3.5 text-[var(--ds-muted)] absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={taskSearchQuery}
            onChange={(e) => setTaskSearchQuery(e.target.value)}
            placeholder="Pesquisar tarefas..."
            className="w-full h-[34px] pl-8 pr-7 rounded-full bg-[var(--surface)] border border-[var(--line2)] text-[12px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] outline-none focus:border-[#0066FF] transition-colors"
          />
          {taskSearchQuery && (
            <button
              type="button"
              onClick={() => setTaskSearchQuery('')}
              className="absolute right-2.5 text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
              title="Limpar pesquisa"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* DROPDOWNS CUSTOMIZADOS COM ESTILO PREMIUM E ÍCONES DE TAREFA */}
        {!listId && (
          <CoyDropdown
            value={selectedListFilter}
            onChange={setSelectedListFilter}
            options={listDropdownOptions}
            searchable={listDropdownOptions.length > 5}
            searchPlaceholder="Buscar projeto / lista..."
            className="min-w-[190px]"
            title="Filtrar por Lista ou Projeto"
          />
        )}

        <CoyDropdown
          value={selectedClientFilter}
          onChange={setSelectedClientFilter}
          options={clientDropdownOptions}
          searchable={clientDropdownOptions.length > 5}
          searchPlaceholder="Buscar cliente..."
          className="min-w-[170px]"
          title="Filtrar por Cliente"
        />

        <CoyDropdown
          value={selectedPriorityFilter}
          onChange={setSelectedPriorityFilter}
          options={priorityDropdownOptions}
          searchable={false}
          className="min-w-[160px]"
          title="Filtrar por Prioridade"
        />

        <button
          type="button"
          onClick={() => setShowArchived((prev) => !prev)}
          className={`h-[34px] px-[12px] rounded-full border text-[12px] font-medium flex items-center gap-[6px] cursor-pointer transition-colors ${
            showArchived
              ? 'bg-[var(--color-brand-blue)]/15 border-[var(--color-brand-blue)] text-[var(--color-brand-blue)]'
              : 'bg-[var(--surface)] hover:bg-[var(--ds-hover)] border-[var(--line2)] text-[var(--ds-muted)] hover:text-[var(--fg)]'
          }`}
          title="Alternar entre tarefas ativas e tarefas arquivadas"
        >
          <Archive className="w-3.5 h-3.5" />
          <span>{showArchived ? 'Exibindo Arquivadas' : 'Arquivadas'}</span>
          {archivedCount > 0 && (
            <span className="px-[5px] py-[1px] rounded-full bg-[var(--bg)] border border-[var(--line2)] text-[10px] font-bold tabular-nums">
              {archivedCount}
            </span>
          )}
        </button>

        {tasks.length === 0 && (
          <button
            type="button"
            onClick={handleSeedSampleWorkspace}
            className="h-[34px] px-[14px] rounded-full bg-[var(--color-brand-blue)]/15 border border-[var(--color-brand-blue)]/40 text-[var(--color-brand-blue)] text-[12px] font-semibold flex items-center gap-[6px] cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Criar Setores & Tarefas de Exemplo</span>
          </button>
        )}

        {/* BOTÃO MODO EU NO LADO DIREITO (ITEM 7) */}
        <button
          type="button"
          onClick={() => setIsMeMode((prev) => !prev)}
          className={`h-[34px] px-[13px] rounded-full border text-[12px] font-semibold flex items-center gap-[7px] cursor-pointer transition-all select-none ml-auto ${
            isMeMode
              ? 'bg-[var(--color-brand-blue)]/15 border-[var(--color-brand-blue)] text-[var(--color-brand-blue)] shadow-xs'
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
                ? 'bg-[var(--color-brand-blue)] text-white'
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
                ? 'bg-[var(--color-brand-blue)]/20 text-[var(--color-brand-blue)]'
                : 'bg-[var(--bg)] text-[var(--ds-muted)] border border-[var(--line2)]'
            }`}
          >
            {isMeMode ? 'Ativo' : 'Todos'}
          </span>
        </button>
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

                      {canCreateTask && (
                        <button
                          type="button"
                          onClick={() => handleOpenCreateModal(col.name)}
                          className="w-[24px] h-[24px] rounded-[6px] hover:bg-[var(--bg)] grid place-items-center text-[var(--ds-muted)] hover:text-[var(--color-brand-blue)] cursor-pointer transition-colors"
                          title={`Adicionar tarefa em ${col.name}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Droppable Container */}
                    <Droppable droppableId={col.name}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex flex-col gap-[10px] min-h-[260px] rounded-[12px] transition-colors ${
                            snapshot.isDraggingOver
                              ? 'bg-[var(--color-brand-blue)]/5 p-[4px]'
                              : ''
                          }`}
                        >
                          {colTasks.map((task, index) => {
                            const taskListObj = task.list_id ? taskLists.find((l) => l.id === task.list_id) : null
                            return (
                              <TaskCard
                                key={task.id}
                                task={task}
                                index={index}
                                subtasks={subtasksByParentId.get(task.id) || []}
                                listName={!listId && selectedListFilter === 'ALL' ? taskListObj?.name : undefined}
                                onEdit={(t, tab) => handleOpenEditModal(t, tab)}
                              />
                            )
                          })}
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
        /* VISÃO EM LISTA REFINADA ESTILO TABELA COMERCIAL / CLICKUP (ITEM 11 E ITEM 12) */
        <div className="flex flex-col gap-3">
          {/* BARRA SUPERIOR DA TABELA: TOTAL DE TAREFAS + BOTÃO ADICIONAR CAMPOS / COLUNAS */}
          <div className="flex items-center justify-between px-2 select-none">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--ds-muted)]">
                Tarefas na Lista
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--line2)] text-[11px] font-bold text-[#0066FF] tabular-nums">
                {filteredTasks.length}
              </span>
            </div>

            {/* BOTÃO + CAMPOS / COLUNAS ESTILO CLICKUP (ITEM 12) */}
            <Popover open={columnsPopoverOpen} onOpenChange={setColumnsPopoverOpen}>
              <PopoverTrigger
                className="h-[32px] px-3 rounded-full bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] hover:border-[#0066FF]/60 text-[11.5px] font-semibold text-[var(--fg)] flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs outline-none"
                title="Personalizar colunas visíveis e adicionar campos personalizados"
              >
                <Columns className="w-3.5 h-3.5 text-[#0066FF]" />
                <span>+ Campos / Colunas</span>
              </PopoverTrigger>

              <PopoverContent
                align="end"
                className="w-72 p-3 bg-[var(--surface)] border border-[var(--line2)] rounded-2xl shadow-2xl z-50 text-[12px] flex flex-col gap-2.5 animate-in fade-in-0 zoom-in-95 duration-100"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-[var(--line)]">
                  <span className="font-bold text-[var(--fg)]">Exibir Colunas</span>
                  <span className="text-[10px] text-[var(--ds-muted)]">Tabela de Tarefas</span>
                </div>

                {/* Busca no popover */}
                <div className="relative flex items-center">
                  <Search className="w-3 h-3 text-[var(--ds-muted)] absolute left-2 pointer-events-none" />
                  <input
                    type="text"
                    value={colSearchQuery}
                    onChange={(e) => setColSearchQuery(e.target.value)}
                    placeholder="Buscar colunas ou campos..."
                    className="w-full h-7 pl-7 pr-2 rounded-lg bg-[var(--bg)] border border-[var(--line2)] text-[11px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] outline-none focus:border-[#0066FF]"
                  />
                </div>

                {/* Lista de colunas padrão */}
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ds-muted)] mt-1">
                    Campos Padrões
                  </span>

                  {[
                    { key: 'client', label: 'Cliente' },
                    { key: 'status', label: 'Status' },
                    { key: 'priority', label: 'Prioridade' },
                    { key: 'assignees', label: 'Responsáveis' },
                    { key: 'dueDate', label: 'Prazo' },
                    { key: 'subtasks', label: 'Subtarefas' },
                    { key: 'comments', label: 'Comentários' },
                  ]
                    .filter((c) =>
                      colSearchQuery
                        ? c.label.toLowerCase().includes(colSearchQuery.toLowerCase())
                        : true
                    )
                    .map((col) => {
                      const isChecked = visibleCols[col.key as keyof typeof visibleCols]
                      return (
                        <label
                          key={col.key}
                          className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[var(--line2)]/50 cursor-pointer transition-colors"
                        >
                          <span className="text-[11.5px] text-[var(--fg)]">{col.label}</span>
                          <input
                            type="checkbox"
                            checked={Boolean(isChecked)}
                            onChange={() =>
                              toggleColumnVisibility(
                                col.key as keyof Omit<typeof visibleCols, 'customFieldIds'>
                              )
                            }
                            className="w-3.5 h-3.5 accent-[#0066FF] rounded cursor-pointer"
                          />
                        </label>
                      )
                    })}

                  {/* Campos personalizados cadastrados */}
                  {customFieldDefs.length > 0 && (
                    <>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ds-muted)] mt-2">
                        Campos Personalizados
                      </span>
                      {customFieldDefs
                        .filter((cf) =>
                          colSearchQuery
                            ? cf.name.toLowerCase().includes(colSearchQuery.toLowerCase())
                            : true
                        )
                        .map((cf) => {
                          const isChecked = visibleCols.customFieldIds.includes(cf.id)
                          return (
                            <label
                              key={cf.id}
                              className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[var(--line2)]/50 cursor-pointer transition-colors"
                            >
                              <span className="text-[11.5px] text-[var(--fg)] truncate max-w-[170px]">
                                {cf.name}
                              </span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleCustomFieldCol(cf.id)}
                                className="w-3.5 h-3.5 accent-[#0066FF] rounded cursor-pointer"
                              />
                            </label>
                          )
                        })}
                    </>
                  )}
                </div>

                {canManageCustomFields && (
                  <button
                    type="button"
                    onClick={() => {
                      setColumnsPopoverOpen(false)
                      setCustomFieldsStudioOpen(true)
                    }}
                    className="w-full mt-1 pt-2 border-t border-[var(--line)] text-center text-[11px] font-bold text-[#0066FF] hover:underline cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Configurar Novos Campos Personalizados</span>
                  </button>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* TABELA DE TAREFAS DESIGN SYSTEM COYTECH */}
          <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[var(--line)] text-[10.5px] font-bold uppercase tracking-wider text-[var(--ds-muted)] bg-[var(--surface)]">
                  <th className="py-[12px] px-[16px]">Tarefa</th>
                  {visibleCols.client && <th className="py-[12px] px-[12px]">Cliente</th>}
                  {visibleCols.status && <th className="py-[12px] px-[12px]">Status</th>}
                  {visibleCols.priority && <th className="py-[12px] px-[12px]">Prioridade</th>}
                  {visibleCols.assignees && <th className="py-[12px] px-[12px]">Responsáveis</th>}
                  {visibleCols.dueDate && <th className="py-[12px] px-[12px]">Prazo</th>}
                  {visibleCols.subtasks && <th className="py-[12px] px-[12px]">Subtarefas</th>}
                  {visibleCols.comments && <th className="py-[12px] px-[12px]">Comentários</th>}
                  {customFieldDefs
                    .filter((cf) => visibleCols.customFieldIds.includes(cf.id))
                    .map((cf) => (
                      <th key={cf.id} className="py-[12px] px-[12px]">
                        {cf.name}
                      </th>
                    ))}
                  <th className="py-[12px] px-[16px] text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-[var(--ds-muted)] text-[13px]">
                      Nenhuma tarefa encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => {
                    const childSubs = subtasksByParentId.get(t.id) || []
                    const totalSub = childSubs.length
                    const isExpanded = Boolean(expandedListRows[t.id])
                    const canArchiveRow = canUserArchiveTask(userPermCtx, t)
                    const canDeleteRow = canUserDeleteTask(userPermCtx, t)

                    const assigneesList =
                      t.assignees && t.assignees.length > 0
                        ? t.assignees
                        : t.assignee_name
                          ? t.assignee_name.split(',').map((s) => s.trim()).filter(Boolean)
                          : []

                    return (
                      <React.Fragment key={t.id}>
                        <tr
                          onClick={() => handleOpenEditModal(t, 'details')}
                          className="border-b border-[var(--line)] hover:bg-[var(--ds-hover)] cursor-pointer transition-colors group"
                        >
                          {/* COLUNA TAREFA */}
                          <td className="py-[12px] px-[16px] font-semibold text-[var(--fg)]">
                            <div className="flex items-center gap-2 min-w-0">
                              {totalSub > 0 ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setExpandedListRows((prev) => ({ ...prev, [t.id]: !isExpanded }))
                                  }}
                                  className="w-5 h-5 rounded hover:bg-[var(--line2)] text-[var(--ds-muted)] hover:text-[var(--fg)] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                                  title="Expandir ou recolher subtarefas"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              ) : (
                                <span className="w-5 h-5 flex items-center justify-center shrink-0 text-[var(--ds-muted)]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--line2)]" />
                                </span>
                              )}
                              <span className="truncate group-hover:text-[#0066FF] transition-colors">
                                {t.title}
                              </span>
                            </div>
                          </td>

                          {/* COLUNA CLIENTE */}
                          {visibleCols.client && (
                            <td className="py-[12px] px-[12px] text-[var(--ds-muted)] text-[12.5px]">
                              {t.client_name_snapshot ? (
                                <span className="flex items-center gap-1 truncate max-w-[140px]">
                                  <Building2 className="w-3 h-3 text-[#0066FF] shrink-0" />
                                  <span className="truncate">{t.client_name_snapshot}</span>
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                          )}

                          {/* COLUNA STATUS CLICÁVEL RÁPIDO (ITEM 10 E 11) */}
                          {visibleCols.status && (
                            <td className="py-[12px] px-[12px]">
                              <TaskQuickStatusPopover
                                currentStatus={t.status_key || 'A Fazer'}
                                availableStatuses={columns}
                                onSelectStatus={async (newStatus) => {
                                  await updateTask(t.id, { status_key: newStatus })
                                }}
                              />
                            </td>
                          )}

                          {/* COLUNA PRIORIDADE */}
                          {visibleCols.priority && (
                            <td className="py-[12px] px-[12px]">
                              <Popover>
                                <PopoverTrigger
                                  onClick={(e) => e.stopPropagation()}
                                  className="outline-none cursor-pointer"
                                  title="Alterar prioridade"
                                >
                                  <span
                                    className={`px-[8px] py-[2px] rounded-[6px] border text-[10.5px] font-bold transition-transform active:scale-95 ${
                                      t.priority === 'urgent'
                                        ? 'bg-red-500/15 text-red-500 border-red-500/30'
                                        : t.priority === 'high'
                                          ? 'bg-orange-500/15 text-orange-500 border-orange-500/30'
                                          : t.priority === 'medium'
                                            ? 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30'
                                            : 'bg-green-500/15 text-green-500 border-green-500/30'
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
                                </PopoverTrigger>
                                <PopoverContent
                                  align="start"
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-36 p-1 bg-[var(--surface)] border-[var(--line2)] rounded-xl shadow-xl z-50 text-[11px]"
                                >
                                  <div className="flex flex-col gap-0.5">
                                    {(['urgent', 'high', 'medium', 'low'] as TaskPriorityLevel[]).map(
                                      (p) => (
                                        <button
                                          key={p}
                                          type="button"
                                          onClick={async (e) => {
                                            e.stopPropagation()
                                            await updateTask(t.id, { priority: p })
                                          }}
                                          className={`px-2 py-1.5 rounded-lg text-left font-semibold transition-colors cursor-pointer ${
                                            t.priority === p
                                              ? 'bg-[#0066FF]/15 text-[#0066FF]'
                                              : 'hover:bg-[var(--line2)] text-[var(--fg)]'
                                          }`}
                                        >
                                          {p === 'urgent'
                                            ? 'Urgente'
                                            : p === 'high'
                                              ? 'Alta'
                                              : p === 'medium'
                                                ? 'Média'
                                                : 'Baixa'}
                                        </button>
                                      )
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </td>
                          )}

                          {/* COLUNA RESPONSÁVEIS COMO BOLHAS DE PERFIL (ITEM 5 E ITEM 12) */}
                          {visibleCols.assignees && (
                            <td className="py-[12px] px-[12px]">
                              <div onClick={(e) => e.stopPropagation()}>
                                <CoyAssigneePicker
                                  value={assigneesList}
                                  multiple={true}
                                  variant="avatars-only"
                                  onChange={async (vals: string[]) => {
                                    await updateTask(t.id, {
                                      assignees: vals,
                                      assignee_name: vals.join(', '),
                                    })
                                  }}
                                />
                              </div>
                            </td>
                          )}

                          {/* COLUNA PRAZO */}
                          {visibleCols.dueDate && (
                            <td className="py-[12px] px-[12px] text-[var(--ds-muted)] font-mono text-[11.5px]">
                              {t.due_date || '—'}
                            </td>
                          )}

                          {/* COLUNA SUBTAREFAS (+ X SUBTAREFAS BADGE COMO NA FOTO) */}
                          {visibleCols.subtasks && (
                            <td className="py-[12px] px-[12px]">
                              {totalSub > 0 ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setExpandedListRows((prev) => ({ ...prev, [t.id]: !isExpanded }))
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg)] border border-[var(--line2)] hover:border-[#0066FF]/60 text-[11px] text-[var(--fg)] font-semibold transition-colors cursor-pointer select-none"
                                  title="Clique para expandir/recolher subtarefas"
                                >
                                  <GitBranch className="w-3 h-3 text-[#0066FF]" />
                                  <span>+ {totalSub} subtarefas</span>
                                </button>
                              ) : (
                                <span className="text-[var(--ds-muted)] text-[11px]">—</span>
                              )}
                            </td>
                          )}

                          {/* COLUNA COMENTÁRIOS RÁPIDOS (ITEM 11 E 12) */}
                          {visibleCols.comments && (
                            <td className="py-[12px] px-[12px]">
                              <TaskQuickCommentsPopover
                                taskId={t.id}
                                taskTitle={t.title}
                                comments={t.comments || []}
                                currentUserName={authenticatedUser?.name || 'Administrador'}
                                onAddComment={async (text) => {
                                  const author = authenticatedUser?.name || 'Administrador'
                                  await addTaskComment(t.id, {
                                    id: `comm_${Date.now()}`,
                                    author_name: author,
                                    content: text,
                                    created_at: new Date().toISOString(),
                                  })
                                }}
                              />
                            </td>
                          )}

                          {/* COLUNAS DE CAMPOS PERSONALIZADOS */}
                          {customFieldDefs
                            .filter((cf) => visibleCols.customFieldIds.includes(cf.id))
                            .map((cf) => {
                              const fVal = t.custom_fields?.find((f) => f.field_id === cf.id)?.value
                              return (
                                <td key={cf.id} className="py-[12px] px-[12px] text-[12px] text-[var(--fg)] max-w-[200px] truncate break-words">
                                  {fVal !== undefined && fVal !== null && fVal !== '' ? (
                                    <AutoLinkText text={String(fVal)} />
                                  ) : (
                                    '—'
                                  )}
                                </td>
                              )
                            })}

                          {/* COLUNA AÇÕES (3 PONTOS COM MENU COMPLETO) */}
                          <td className="py-[12px] px-[16px] text-right">
                            <div className="inline-flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                              <Popover>
                                <PopoverTrigger
                                  className="p-1 rounded-md text-[var(--ds-muted)] hover:text-[var(--fg)] hover:bg-[var(--line2)] transition-colors cursor-pointer outline-none"
                                  title="Opções da tarefa"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </PopoverTrigger>
                                <PopoverContent
                                  align="end"
                                  className="w-56 p-1.5 bg-[var(--surface)] border-[var(--line2)] rounded-xl shadow-2xl text-[var(--fg)] z-50 text-[11.5px]"
                                >
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditModal(t, 'details')}
                                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--line2)] text-left cursor-pointer"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
                                      <span>Abrir detalhes</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard?.writeText(t.id)
                                      }}
                                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--line2)] text-left cursor-pointer"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
                                      <span>Copiar identificador</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setMoveCopyTask(t)}
                                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--line2)] text-left cursor-pointer"
                                    >
                                      <ArrowRightLeft className="w-3.5 h-3.5 text-[#0066FF]" />
                                      <span>Mover ou copiar tarefa</span>
                                    </button>

                                    {canArchiveRow && (
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          await archiveTask(t.id, !Boolean(t.is_archived))
                                        }}
                                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--line2)] text-left cursor-pointer"
                                      >
                                        {t.is_archived ? (
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
                                    )}

                                    {canDeleteRow && (
                                      <div className="mt-1 pt-1 border-t border-[var(--line)]">
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            if (confirm('Tem certeza que deseja remover esta tarefa permanentemente?')) {
                                              await handleDeleteTask(t.id)
                                            }
                                          }}
                                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-500 hover:bg-red-500/10 text-left cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>Remover permanentemente</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </td>
                        </tr>

                        {/* SUBTAREFAS EXPANDIDAS ALINHADAS COM AS COLUNAS (ITEM 6) */}
                        {isExpanded &&
                          childSubs.map((sub) => {
                            const canDeleteSub = canUserDeleteTask(userPermCtx, sub)
                            const subAssignees =
                              sub.assignees && sub.assignees.length > 0
                                ? sub.assignees
                                : sub.assignee_name
                                  ? sub.assignee_name.split(',').map((s) => s.trim()).filter(Boolean)
                                  : []

                            return (
                              <tr
                                key={sub.id}
                                onClick={() => handleOpenEditModal(sub, 'details')}
                                className="border-b border-[var(--line)] bg-[var(--bg)]/50 hover:bg-[var(--ds-hover)] cursor-pointer transition-colors"
                              >
                                {/* SUBTAREFA NOME */}
                                <td className="py-[10px] pl-[44px] pr-[16px] text-[12px] text-[var(--fg)]">
                                  <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] shrink-0" />
                                    <span>{sub.title}</span>
                                  </div>
                                </td>

                                {/* SUBTAREFA CLIENTE */}
                                {visibleCols.client && (
                                  <td className="py-[10px] px-[12px] text-[11.5px] text-[var(--ds-muted)]">
                                    {sub.client_name_snapshot || '—'}
                                  </td>
                                )}

                                {/* SUBTAREFA STATUS CLICÁVEL RÁPIDO (ITEM 6) */}
                                {visibleCols.status && (
                                  <td className="py-[10px] px-[12px]">
                                    <TaskQuickStatusPopover
                                      currentStatus={sub.status_key || 'A Fazer'}
                                      availableStatuses={columns}
                                      onSelectStatus={async (newStatus) => {
                                        await updateTask(sub.id, { status_key: newStatus })
                                      }}
                                    />
                                  </td>
                                )}

                                {/* SUBTAREFA PRIORIDADE */}
                                {visibleCols.priority && (
                                  <td className="py-[10px] px-[12px] text-[11px] text-[var(--ds-muted)]">
                                    {sub.priority}
                                  </td>
                                )}

                                {/* SUBTAREFA RESPONSÁVEIS */}
                                {visibleCols.assignees && (
                                  <td className="py-[10px] px-[12px]">
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <CoyAssigneePicker
                                        value={subAssignees}
                                        multiple={true}
                                        variant="avatars-only"
                                        onChange={async (vals: string[]) => {
                                          await updateTask(sub.id, {
                                            assignees: vals,
                                            assignee_name: vals.join(', '),
                                          })
                                        }}
                                      />
                                    </div>
                                  </td>
                                )}

                                {/* SUBTAREFA PRAZO */}
                                {visibleCols.dueDate && (
                                  <td className="py-[10px] px-[12px] text-[var(--ds-muted)] font-mono text-[11px]">
                                    {sub.due_date || '—'}
                                  </td>
                                )}

                                {/* SUBTAREFA TIPO */}
                                {visibleCols.subtasks && (
                                  <td className="py-[10px] px-[12px] text-[11px] text-[var(--ds-muted)]">
                                    Subtarefa
                                  </td>
                                )}

                                {/* SUBTAREFA COMENTÁRIOS */}
                                {visibleCols.comments && (
                                  <td className="py-[10px] px-[12px]">
                                    <TaskQuickCommentsPopover
                                      taskId={sub.id}
                                      taskTitle={sub.title}
                                      comments={sub.comments || []}
                                      currentUserName={authenticatedUser?.name || 'Administrador'}
                                      onAddComment={async (text) => {
                                        const author = authenticatedUser?.name || 'Administrador'
                                        await addTaskComment(sub.id, {
                                          id: `comm_${Date.now()}`,
                                          author_name: author,
                                          content: text,
                                          created_at: new Date().toISOString(),
                                        })
                                      }}
                                    />
                                  </td>
                                )}

                                {/* SUBTAREFA CAMPOS CUSTOMIZADOS */}
                                {customFieldDefs
                                  .filter((cf) => visibleCols.customFieldIds.includes(cf.id))
                                  .map((cf) => (
                                    <td key={cf.id} className="py-[10px] px-[12px] text-[11.5px] text-[var(--ds-muted)]">
                                      —
                                    </td>
                                  ))}

                                {/* SUBTAREFA EXCLUSÃO COM POPOVER DE AVISO (ITEM 6) */}
                                <td className="py-[10px] px-[16px] text-right">
                                  {canDeleteSub && (
                                    <div onClick={(e) => e.stopPropagation()} className="inline-block">
                                      <Popover
                                        open={subtaskToDeleteId === sub.id}
                                        onOpenChange={(op) => setSubtaskToDeleteId(op ? sub.id : null)}
                                      >
                                        <PopoverTrigger
                                          className="text-[var(--ds-muted)] opacity-50 hover:opacity-100 hover:text-red-500 cursor-pointer p-1"
                                          title="Excluir subtarefa com aviso"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </PopoverTrigger>
                                        <PopoverContent
                                          align="end"
                                          className="w-56 p-2.5 bg-[var(--surface)] border border-red-500/30 rounded-xl shadow-2xl z-50 text-[11.5px]"
                                        >
                                          <div className="flex flex-col gap-2 text-left">
                                            <span className="font-semibold text-red-500">Excluir subtarefa?</span>
                                            <span className="text-[10.5px] text-[var(--ds-muted)] leading-tight">
                                              Tem certeza de que deseja remover esta subtarefa?
                                            </span>
                                            <div className="flex items-center justify-end gap-1.5 pt-1">
                                              <button
                                                type="button"
                                                onClick={() => setSubtaskToDeleteId(null)}
                                                className="px-2 py-0.5 rounded text-[10.5px] bg-[var(--line2)] text-[var(--fg)] hover:opacity-80 cursor-pointer"
                                              >
                                                Cancelar
                                              </button>
                                              <button
                                                type="button"
                                                onClick={async () => {
                                                  await handleDeleteTask(sub.id)
                                                  setSubtaskToDeleteId(null)
                                                }}
                                                className="px-2.5 py-0.5 rounded text-[10.5px] font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                                              >
                                                Excluir
                                              </button>
                                            </div>
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                      </React.Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL MOVER / COPIAR TAREFA DA TABELA */}
      <TaskMoveCopyModal
        open={Boolean(moveCopyTask)}
        onOpenChange={(op) => !op && setMoveCopyTask(null)}
        task={moveCopyTask}
      />

      {/* MODAL TASKDIALOG (ROOMIE OFFICE AI) */}
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
        onSelectTask={(target) => setEditingTask(target)}
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
              <CoyColorPicker
                value={newStatusColor}
                onChange={setNewStatusColor}
              />
              <input
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                placeholder="Nova coluna (ex: AGUARDANDO CLIENTE)"
                className="flex-1 h-[38px] px-[12px] rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[12.5px] text-[var(--fg)] outline-none"
              />
              <button
                type="submit"
                className="h-[38px] px-[14px] rounded-[8px] bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue-hover)] text-white font-bold text-[12px] cursor-pointer"
              >
                Adicionar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ESTÚDIO AVANÇADO DE CAMPOS PERSONALIZADOS */}
      <CustomFieldsStudioDialog
        open={customFieldsStudioOpen}
        onOpenChange={setCustomFieldsStudioOpen}
        initialTab="grupos"
        currentListId={activeListObj?.id || listId}
      />
    </div>
  )
}
