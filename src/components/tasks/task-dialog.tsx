'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CalendarIcon,
  Paperclip,
  X,
  Check,
  Building2,
  Link2,
  Network,
  Plus,
  Play,
  Square,
  Flag,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Send,
  User,
  Search,
  Maximize2,
  Star,
  CheckSquare,
  MoreHorizontal,
  ArrowLeft,
  ArrowUpRight,
  Layers,
  Copy,
  AlertTriangle,
  Archive,
  ArchiveRestore,
} from 'lucide-react'
import { AudioRecorder } from './audio-recorder'
import { AudioPlayer } from './audio-player'
import { TaskCustomFields } from './task-custom-fields'
import { CoyAssigneePicker } from '@/components/ui/coy-assignee-picker'
import { useCoyDash } from '@/lib/coydash-store'
import {
  canUserDeleteTask,
  canUserArchiveTask,
  hasFeaturePermission,
} from '@/lib/access-control'
import type {
  TaskItem,
  TaskPriorityLevel,
  TaskCommentItem,
  TaskAttachmentItem,
  TaskExternalLink,
  TaskListItem,
  ClientAccount,
  TaskCustomFieldValue,
} from '@/types/coydash'

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: TaskItem | null
  defaultListId?: string
  defaultStatusKey?: string
  allTasks?: TaskItem[]
  availableLists: TaskListItem[]
  availableClients: ClientAccount[]
  availableStatuses: { id: string; name: string; color: string }[]
  availableMembers: string[]
  currentUserName: string
  initialTab?: 'details' | 'comments'
  onSave: (taskData: Partial<TaskItem>) => Promise<TaskItem | null | void>
  onDelete?: (taskId: string) => Promise<void>
  onSelectTask?: (targetTask: TaskItem) => void
}

const PRIORITY_CONFIG: Record<
  TaskPriorityLevel,
  { label: string; color: string; bg: string; border: string }
> = {
  urgent: {
    label: 'Urgente',
    color: '#ef4444',
    bg: '#ef444415',
    border: '#ef444440',
  },
  high: {
    label: 'Alta',
    color: '#f59e0b',
    bg: '#f59e0b15',
    border: '#f59e0b40',
  },
  medium: {
    label: 'Normal',
    color: '#3b82f6',
    bg: '#3b82f615',
    border: '#3b82f640',
  },
  low: {
    label: 'Baixa',
    color: '#94a3b8',
    bg: '#94a3b815',
    border: '#94a3b840',
  },
}

const isDoneStatusName = (name?: string | null) => {
  const s = (name || '').toLowerCase()
  return s.includes('concl') || s.includes('finaliz') || s.includes('done')
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultListId,
  defaultStatusKey = 'A Fazer',
  allTasks = [],
  availableLists,
  availableClients,
  availableStatuses,
  availableMembers,
  currentUserName,
  onSave,
  onDelete,
  onSelectTask,
}: TaskDialogProps) {
  const {
    taskFolders = [],
    taskStatuses = [],
    tasks: storeTasks = [],
    orgMembers = [],
    authenticatedUser,
    currentUserPermissions,
    customFieldDefs = [],
    createCustomFieldDef,
    deleteCustomFieldDef,
    createTask,
    updateTask,
    archiveTask,
    addTaskComment,
  } = useCoyDash()

  const tasksPool = allTasks.length > 0 ? allTasks : storeTasks

  // Suporte à navegação interna entre tarefa pai e subtarefa mesmo se onSelectTask não for fornecido
  const [internalTaskId, setInternalTaskId] = useState<string | null>(null)
  useEffect(() => {
    if (!open) {
      setInternalTaskId(null)
    } else if (task?.id) {
      setInternalTaskId(task.id)
    } else {
      setInternalTaskId(null)
    }
  }, [open, task?.id])

  const activeTask = useMemo(() => {
    if (internalTaskId) {
      const found = tasksPool.find((t) => t.id === internalTaskId)
      if (found) return found
    }
    return task || null
  }, [internalTaskId, tasksPool, task])

  const parentTask = useMemo(() => {
    if (!activeTask?.parent_task_id) return null
    return tasksPool.find((t) => t.id === activeTask.parent_task_id) || null
  }, [activeTask, tasksPool])

  // Subtarefas reais no banco vinculadas por parent_task_id
  const childSubtasks = useMemo(() => {
    if (!activeTask?.id) return []
    return tasksPool.filter((t) => t.parent_task_id === activeTask.id)
  }, [activeTask?.id, tasksPool])

  // Rascunhos de subtarefa apenas enquanto a tarefa pai ainda não existe no banco
  const [draftSubtasks, setDraftSubtasks] = useState<{ id: string; title: string }[]>([])

  const [isPending, setIsPending] = useState(false)
  const [isSavingInline, setIsSavingInline] = useState(false)
  const [savedNotice, setSavedNotice] = useState('')
  const [error, setError] = useState('')

  // Controle de popovers para fechamento limpo ao selecionar
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false)
  const [assigneesPopoverOpen, setAssigneesPopoverOpen] = useState(false)
  const [priorityPopoverOpen, setPriorityPopoverOpen] = useState(false)
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Campos principais de Detalhes
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriorityLevel>('medium')
  const [statusKey, setStatusKey] = useState('A Fazer')
  const [targetListId, setTargetListId] = useState('')
  const [targetClientId, setTargetClientId] = useState('')
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0)
  const [isTrackingTime, setIsTrackingTime] = useState<boolean>(false)
  const [customFields, setCustomFields] = useState<TaskCustomFieldValue[]>([])

  // Subtarefas reais inline, Comentários e Anexos
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false)
  const [comments, setComments] = useState<TaskCommentItem[]>([])
  const [attachments, setAttachments] = useState<TaskAttachmentItem[]>([])

  // Conexões e Vínculos da barra central
  const [links, setLinks] = useState<TaskExternalLink[]>([])
  const [linkedTaskIds, setLinkedTaskIds] = useState<string[]>([])
  const [originReference, setOriginReference] = useState<string>('')
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')

  // Input de Comentário lateral + busca
  const [newCommentText, setNewCommentText] = useState('')
  const [commentSearch, setCommentSearch] = useState('')
  const [showCommentSearch, setShowCommentSearch] = useState(false)
  const [assigneeSearch, setAssigneeSearch] = useState('')

  // Contexto unificado de permissões RBAC do usuário atual
  const userPermCtx = useMemo(
    () => ({
      userId: authenticatedUser?.id,
      email: authenticatedUser?.email,
      name: currentUserName,
      role: currentUserPermissions?.role || authenticatedUser?.role,
      access_type: currentUserPermissions?.access_type,
      custom_permissions: currentUserPermissions?.custom_permissions,
    }),
    [authenticatedUser, currentUserName, currentUserPermissions]
  )

  // Permissão real para excluir ou arquivar esta tarefa (quem criou, Convidado Gerente ou Membro/Admin)
  const canDeleteTask = useMemo(
    () => (activeTask ? canUserDeleteTask(userPermCtx, activeTask) : false),
    [userPermCtx, activeTask]
  )
  const canArchiveTask = useMemo(
    () => (activeTask ? canUserArchiveTask(userPermCtx, activeTask) : false),
    [userPermCtx, activeTask]
  )
  const canManageCustomFields = useMemo(
    () => hasFeaturePermission(userPermCtx, 'custom_fields.manage'),
    [userPermCtx]
  )

  // Membros reais combinados (orgMembers do banco + props + usuário atual + atribuídos atuais)
  const combinedMembers = useMemo(() => {
    const list = [
      ...availableMembers,
      ...orgMembers.map((m) => m.full_name).filter(Boolean),
      ...(currentUserName ? [currentUserName] : []),
      ...selectedAssignees,
    ]
    return Array.from(new Set(list.map((s) => s.trim()).filter(Boolean)))
  }, [availableMembers, orgMembers, currentUserName, selectedAssignees])

  // Status dinâmicos da lista real da tarefa aberta
  const effectiveStatuses = useMemo(() => {
    const listToUse = targetListId || activeTask?.list_id || defaultListId
    if (listToUse) {
      const fromList = taskStatuses
        .filter((s) => s.list_id === listToUse)
        .sort((a, b) => a.order_index - b.order_index)
      if (fromList.length > 0) return fromList
    }
    if (availableStatuses.length > 0) return availableStatuses
    return [
      { id: 'col-todo', name: 'A Fazer', color: '#64748b' },
      { id: 'col-doing', name: 'Em Progresso', color: '#0066FF' },
      { id: 'col-review', name: 'Em Revisão', color: '#E8C14A' },
      { id: 'col-done', name: 'Concluído', color: '#2F9E5A' },
    ]
  }, [targetListId, activeTask?.list_id, defaultListId, taskStatuses, availableStatuses])

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const loadedKeyRef = useRef<string | null>(null)
  const noticeTimerRef = useRef<NodeJS.Timeout | null>(null)

  const flashSaved = (msg = 'Salvo') => {
    setSavedNotice(msg)
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
    noticeTimerRef.current = setTimeout(() => setSavedNotice(''), 2000)
  }

  // Controle de Rastreamento de Tempo ao vivo
  useEffect(() => {
    if (isTrackingTime) {
      timerRef.current = setInterval(() => {
        setTimeSpentSeconds((prev) => prev + 1)
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isTrackingTime])

  // Inicializa estado somente ao abrir ou trocar para outra tarefa (evita sobrescrever edições durante re-sync!)
  useEffect(() => {
    if (!open) {
      loadedKeyRef.current = null
      setMoreMenuOpen(false)
      setConfirmingDelete(false)
      return
    }

    const nextKey = activeTask ? `edit:${activeTask.id}` : `new:${defaultListId || ''}:${defaultStatusKey}`
    if (loadedKeyRef.current === nextKey) return
    loadedKeyRef.current = nextKey

    setError('')
    setSavedNotice('')
    setNewLinkTitle('')
    setNewLinkUrl('')
    setNewCommentText('')
    setNewSubtaskTitle('')
    setAssigneeSearch('')
    setConfirmingDelete(false)
    setMoreMenuOpen(false)
    setDraftSubtasks([])

    if (activeTask) {
      setTitle(activeTask.title || '')
      setDescription(activeTask.description || '')
      setPriority(activeTask.priority || 'medium')
      setStatusKey(activeTask.status_key || defaultStatusKey)
      setTargetListId(activeTask.list_id || defaultListId || '')
      setTargetClientId(activeTask.client_id || '')

      if (Array.isArray(activeTask.assignees) && activeTask.assignees.length > 0) {
        setSelectedAssignees(activeTask.assignees.filter(Boolean))
      } else if (activeTask.assignee_name) {
        setSelectedAssignees(
          activeTask.assignee_name
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        )
      } else {
        setSelectedAssignees([])
      }

      if (activeTask.start_date) {
        const [y, m, d] = activeTask.start_date.split('-').map(Number)
        if (y && m && d) setStartDate(new Date(y, m - 1, d))
        else setStartDate(undefined)
      } else {
        setStartDate(undefined)
      }

      if (activeTask.due_date) {
        const [y, m, d] = activeTask.due_date.split('-').map(Number)
        if (y && m && d) setDueDate(new Date(y, m - 1, d))
        else setDueDate(undefined)
      } else {
        setDueDate(undefined)
      }

      setTimeSpentSeconds(activeTask.time_spent_seconds || 0)
      setIsTrackingTime(Boolean(activeTask.is_tracking_time))
      setCustomFields(activeTask.custom_fields || [])
      setComments(activeTask.comments || [])
      setAttachments(activeTask.attachments || [])
      setLinks(activeTask.links || [])
      setLinkedTaskIds(activeTask.linked_task_ids || [])
      setOriginReference(activeTask.origin_reference || '')
    } else {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setStatusKey(defaultStatusKey)
      setTargetListId(defaultListId || availableLists[0]?.id || '')
      setTargetClientId('')
      setSelectedAssignees(
        currentUserName
          ? [currentUserName]
          : availableMembers[0]
            ? [availableMembers[0]]
            : []
      )
      setStartDate(new Date())
      setDueDate(new Date(Date.now() + 2 * 86400000))
      setTimeSpentSeconds(0)
      setIsTrackingTime(false)
      setCustomFields([])
      setComments([])
      setAttachments([])
      setLinks([])
      setLinkedTaskIds([])
      setOriginReference('')
    }
  }, [open, activeTask, defaultListId, defaultStatusKey, availableLists, availableMembers, currentUserName])

  // Persistência imediata no banco ao editar propriedades rápidas de uma tarefa já existente
  const persistPatch = async (patch: Partial<TaskItem>, feedbackLabel = 'Salvo') => {
    if (!activeTask?.id) return
    setIsSavingInline(true)
    setError('')
    try {
      await updateTask(activeTask.id, patch)
      flashSaved(feedbackLabel)
    } catch (err) {
      console.error('Erro ao salvar atualização da tarefa:', err)
      setError('Falha ao salvar alteração no banco.')
    } finally {
      setIsSavingInline(false)
    }
  }

  const formatDateIso = (d?: Date) => {
    if (!d) return null
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const formatSeconds = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  // Trocar Status (atualiza local + persiste imediatamente no Supabase)
  const handleSelectStatus = async (nextStatusName: string) => {
    setStatusKey(nextStatusName)
    setStatusPopoverOpen(false)
    if (activeTask?.id) {
      await persistPatch({ status_key: nextStatusName }, 'Status atualizado')
    }
  }

  // Alternar Status Direto no Checkmark ✓
  const handleToggleCompleted = async () => {
    const completed = isDoneStatusName(statusKey)
    const nextStatus = completed
      ? effectiveStatuses[0]?.name || 'A Fazer'
      : effectiveStatuses.find((s) => isDoneStatusName(s.name))?.name || 'Concluído'

    setStatusKey(nextStatus)
    if (activeTask?.id) {
      await persistPatch({ status_key: nextStatus }, 'Status atualizado')
    }
  }

  // Adicionar ou Remover Responsável (permite inclusive remover TODOS sem recolocar à força!)
  const handleToggleAssignee = async (memberName: string) => {
    const exists = selectedAssignees.some(
      (m) => m.toLowerCase().trim() === memberName.toLowerCase().trim()
    )
    const next = exists
      ? selectedAssignees.filter((m) => m.toLowerCase().trim() !== memberName.toLowerCase().trim())
      : [...selectedAssignees, memberName]

    setSelectedAssignees(next)
    if (activeTask?.id) {
      await persistPatch(
        { assignees: next, assignee_name: next.join(', ') },
        exists ? 'Responsável removido' : 'Responsável adicionado'
      )
    }
  }

  const handleClearAssignees = async () => {
    setSelectedAssignees([])
    if (activeTask?.id) {
      await persistPatch({ assignees: [], assignee_name: '' }, 'Responsáveis removidos')
    }
  }

  const handleSelectPriority = async (nextPriority: TaskPriorityLevel) => {
    setPriority(nextPriority)
    setPriorityPopoverOpen(false)
    if (activeTask?.id) {
      await persistPatch({ priority: nextPriority }, 'Prioridade atualizada')
    }
  }

  const handleSelectClient = async (clientId: string) => {
    setTargetClientId(clientId)
    setClientPopoverOpen(false)
    const linked = availableClients.find((c) => c.id === clientId)
    if (activeTask?.id) {
      await persistPatch(
        {
          client_id: clientId || null,
          client_name_snapshot: linked?.name || '',
        },
        'Cliente atualizado'
      )
    }
  }

  const handleCustomFieldsChange = (nextFields: TaskCustomFieldValue[]) => {
    setCustomFields(nextFields)
    if (activeTask?.id) {
      void persistPatch({ custom_fields: nextFields }, 'Campo atualizado')
    }
  }

  const handleDescriptionBlur = () => {
    if (!activeTask?.id) return
    if (description.trim() !== (activeTask.description || '').trim()) {
      void persistPatch({ description: description.trim() }, 'Briefing salvo')
    }
  }

  const handleTitleBlur = () => {
    if (!activeTask?.id) return
    if (title.trim() && title.trim() !== (activeTask.title || '').trim()) {
      void persistPatch({ title: title.trim() }, 'Título salvo')
    }
  }

  // Navegar para uma subtarefa real ou voltar para a tarefa pai
  const handleNavigateToTask = (target: TaskItem) => {
    loadedKeyRef.current = null
    setInternalTaskId(target.id)
    if (onSelectTask) {
      onSelectTask(target)
    }
  }

  // Criar Subtarefa Real no Banco (`parent_task_id`)
  const handleAddRealSubtask = async (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return
    if (e && 'preventDefault' in e) e.preventDefault()

    const cleanTitle = newSubtaskTitle.trim()
    if (!cleanTitle) return

    if (!activeTask?.id) {
      setDraftSubtasks((prev) => [...prev, { id: `draft_${Date.now()}`, title: cleanTitle }])
      setNewSubtaskTitle('')
      return
    }

    setIsCreatingSubtask(true)
    setError('')
    try {
      const linkedClient = availableClients.find((c) => c.id === targetClientId)
      const initialSubStatus = effectiveStatuses[0]?.name || 'A Fazer'
      const todayStr = formatDateIso(new Date())

      await createTask({
        title: cleanTitle,
        description: '',
        parent_task_id: activeTask.id,
        list_id: targetListId || activeTask.list_id || null,
        client_id: targetClientId || activeTask.client_id || null,
        client_name_snapshot:
          linkedClient?.name || activeTask.client_name_snapshot || '',
        status_key: initialSubStatus,
        priority: 'medium',
        assignees:
          selectedAssignees.length > 0
            ? selectedAssignees
            : currentUserName
              ? [currentUserName]
              : [],
        assignee_name:
          selectedAssignees.length > 0
            ? selectedAssignees.join(', ')
            : currentUserName || '',
        start_date: todayStr,
        due_date: formatDateIso(dueDate) || null,
      })

      setNewSubtaskTitle('')
      flashSaved('Subtarefa criada')
    } catch (err) {
      console.error('Erro ao criar subtarefa real:', err)
      setError('Não foi possível criar a subtarefa.')
    } finally {
      setIsCreatingSubtask(false)
    }
  }

  // Alternar conclusão rápida de uma subtarefa real direto da lista dentro do popup
  const handleToggleChildSubtaskStatus = async (
    e: React.MouseEvent,
    sub: TaskItem
  ) => {
    e.stopPropagation()
    const subStatuses = taskStatuses
      .filter((s) => s.list_id === (sub.list_id || targetListId))
      .sort((a, b) => a.order_index - b.order_index)
    const pool = subStatuses.length > 0 ? subStatuses : effectiveStatuses

    const currentlyDone = isDoneStatusName(sub.status_key)
    const nextStatus = currentlyDone
      ? pool[0]?.name || 'A Fazer'
      : pool.find((s) => isDoneStatusName(s.name))?.name || 'Concluído'

    await updateTask(sub.id, { status_key: nextStatus })
    flashSaved('Subtarefa atualizada')
  }

  // Anexos de Arquivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const validFiles = newFiles.filter((f) => f.size <= 10 * 1024 * 1024)
      if (validFiles.length < newFiles.length) {
        alert('Alguns arquivos excedem o limite de 10MB.')
      }

      const newAttachments: TaskAttachmentItem[] = validFiles.map((file) => ({
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        file_name: file.name,
        file_url: URL.createObjectURL(file),
        file_type: file.type,
        file_size: file.size,
      }))

      const updated = [...attachments, ...newAttachments]
      setAttachments(updated)
      if (activeTask?.id) {
        void persistPatch({ attachments: updated }, 'Anexo adicionado')
      }
    }
  }

  const handleRemoveAttachment = (attId: string) => {
    const updated = attachments.filter((a) => a.id !== attId)
    setAttachments(updated)
    if (activeTask?.id) {
      void persistPatch({ attachments: updated }, 'Anexo removido')
    }
  }

  // Áudio gravado como comentário
  const handleAudioComplete = async (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const audioComment: TaskCommentItem = {
      id: `comment_audio_${Date.now()}`,
      author_name: currentUserName || 'Membro',
      content: 'Mensagem de voz gravada',
      audio_url: url,
      created_at: new Date().toISOString(),
    }
    setComments((prev) => [...prev, audioComment])
    if (activeTask?.id) {
      await addTaskComment(activeTask.id, audioComment)
      flashSaved('Áudio enviado')
    }
  }

  // Enviar Comentário de Texto
  const handleSendComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newCommentText.trim()) return

    const newComment: TaskCommentItem = {
      id: `comment_${Date.now()}`,
      author_name: currentUserName || 'Membro',
      content: newCommentText.trim(),
      created_at: new Date().toISOString(),
    }
    setComments((prev) => [...prev, newComment])
    setNewCommentText('')
    if (activeTask?.id) {
      await addTaskComment(activeTask.id, newComment)
      flashSaved('Comentário salvo')
    }
  }

  // Links da barra central
  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return
    const formattedUrl =
      newLinkUrl.startsWith('http://') || newLinkUrl.startsWith('https://')
        ? newLinkUrl.trim()
        : `https://${newLinkUrl.trim()}`

    const newLink: TaskExternalLink = {
      id: `link_${Date.now()}`,
      title: newLinkTitle.trim() || formattedUrl,
      url: formattedUrl,
    }

    const updated = [...links, newLink]
    setLinks(updated)
    setNewLinkTitle('')
    setNewLinkUrl('')
    if (activeTask?.id) {
      void persistPatch({ links: updated }, 'Link salvo')
    }
  }

  const handleRemoveLink = (linkId: string) => {
    const updated = links.filter((l) => l.id !== linkId)
    setLinks(updated)
    if (activeTask?.id) {
      void persistPatch({ links: updated }, 'Link removido')
    }
  }

  const handleToggleLinkedTask = (tId: string) => {
    const updated = linkedTaskIds.includes(tId)
      ? linkedTaskIds.filter((id) => id !== tId)
      : [...linkedTaskIds, tId]
    setLinkedTaskIds(updated)
    if (activeTask?.id) {
      void persistPatch({ linked_task_ids: updated }, 'Vínculo atualizado')
    }
  }

  // Submissão completa do Formulário
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!title.trim()) {
      setError('Por favor, informe o título da tarefa.')
      return
    }

    setIsPending(true)
    setError('')

    try {
      const linkedClient = availableClients.find((c) => c.id === targetClientId)
      const formattedStartDate = formatDateIso(startDate)
      const formattedDueDate = formatDateIso(dueDate)

      // Só força o usuário atual na CRIAÇÃO de uma tarefa sem nenhum responsável escolhido
      let finalAssignees = [...selectedAssignees]
      if (!activeTask && finalAssignees.length === 0 && currentUserName) {
        finalAssignees = [currentUserName]
      }

      const payload: Partial<TaskItem> = {
        title: title.trim(),
        description: description.trim(),
        priority,
        status_key: statusKey,
        list_id: targetListId || null,
        client_id: targetClientId || null,
        client_name_snapshot: linkedClient?.name || (activeTask?.client_name_snapshot ?? ''),
        assignee_name: finalAssignees.join(', '),
        assignees: finalAssignees,
        start_date: formattedStartDate,
        due_date: formattedDueDate,
        time_spent_seconds: timeSpentSeconds,
        is_tracking_time: isTrackingTime,
        custom_fields: customFields,
        comments,
        attachments,
        links,
        linked_task_ids: linkedTaskIds,
        origin_reference: originReference,
      }

      if (activeTask?.id) {
        await updateTask(activeTask.id, payload)
      } else {
        const createdParent = await onSave(payload)
        const parentId =
          createdParent && typeof createdParent === 'object' && 'id' in createdParent
            ? (createdParent as TaskItem).id
            : undefined

        // Se havia rascunhos de subtarefa antes de criar a tarefa pai, cria todas como tarefas reais no DB
        if (parentId && draftSubtasks.length > 0) {
          const initialSubStatus = effectiveStatuses[0]?.name || 'A Fazer'
          for (const draft of draftSubtasks) {
            await createTask({
              title: draft.title,
              description: '',
              parent_task_id: parentId,
              list_id: targetListId || null,
              client_id: targetClientId || null,
              client_name_snapshot: linkedClient?.name || '',
              status_key: initialSubStatus,
              priority: 'medium',
              assignees: finalAssignees,
              assignee_name: finalAssignees.join(', '),
              start_date: formattedStartDate,
              due_date: formattedDueDate,
            })
          }
        }
      }

      onOpenChange(false)
    } catch (err) {
      console.error(err)
      setError('Ocorreu um erro ao salvar a tarefa. Tente novamente.')
    } finally {
      setIsPending(false)
    }
  }

  const handleDelete = async () => {
    if (!activeTask || !onDelete || !canDeleteTask) return
    setIsPending(true)
    try {
      await onDelete(activeTask.id)
      setMoreMenuOpen(false)
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error ? err.message : 'Você não tem permissão para excluir esta tarefa.'
      )
    } finally {
      setIsPending(false)
    }
  }

  const getInitials = (name?: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  const currentList = availableLists.find((l) => l.id === targetListId)
  const currentFolder = taskFolders.find((f) => f.id === currentList?.folder_id)
  const candidateTasks = tasksPool.filter(
    (t) => t.id !== activeTask?.id && !t.parent_task_id
  )

  const activePriority = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium

  const currentStatusObj =
    effectiveStatuses.find((s) => s.name.toLowerCase() === statusKey.toLowerCase()) || {
      name: statusKey,
      color: '#10b981',
    }

  const selectedClientObj = availableClients.find((c) => c.id === targetClientId) || null

  const filteredMembers = useMemo(() => {
    const q = assigneeSearch.trim().toLowerCase()
    if (!q) return combinedMembers
    return combinedMembers.filter((m) => m.toLowerCase().includes(q))
  }, [combinedMembers, assigneeSearch])

  const filteredComments = useMemo(() => {
    const q = commentSearch.trim().toLowerCase()
    if (!q) return comments
    return comments.filter(
      (c) =>
        c.content.toLowerCase().includes(q) ||
        c.author_name.toLowerCase().includes(q)
    )
  }, [comments, commentSearch])

  const completedChildCount = childSubtasks.filter((s) => isDoneStatusName(s.status_key)).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        style={
          isFullscreen
            ? { width: '98vw', maxWidth: '1880px' }
            : { width: '88vw', maxWidth: '1600px' }
        }
        className={`bg-[var(--surface)] text-[var(--fg)] border-[var(--line2)] p-0 flex flex-col gap-0 rounded-[20px] shadow-2xl overflow-hidden ${
          isFullscreen
            ? '!w-[98vw] !max-w-[1880px] h-[96vh]'
            : '!w-[88vw] !max-w-[1600px] sm:!max-w-[1600px] h-[92vh] max-h-[960px]'
        }`}
      >
        <DialogTitle className="sr-only">
          {activeTask ? `Editar tarefa: ${activeTask.title}` : 'Nova tarefa'}
        </DialogTitle>

        {/* ========================================================================= */}
        {/* CABEÇALHO SUPERIOR (BREADCRUMB + LINK PARA TAREFA PAI + MENU DISCRETO) */}
        {/* ========================================================================= */}
        <div className="px-6 py-2.5 border-b border-[var(--line)] flex items-center justify-between shrink-0 bg-[var(--surface)] select-none gap-3">
          {/* Breadcrumb da Lista ou Navegação de Subtarefa */}
          <div className="flex items-center gap-2 text-[12px] text-[var(--ds-muted)] min-w-0 truncate">
            {parentTask && (
              <>
                <button
                  type="button"
                  onClick={() => handleNavigateToTask(parentTask)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg)] border border-[var(--line2)] hover:border-[var(--color-brand-blue)] text-[11.5px] font-semibold text-[var(--fg)] transition-colors cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3 h-3 text-[var(--color-brand-blue)]" />
                  <span className="max-w-[200px] truncate">{parentTask.title}</span>
                </button>
                <span>/</span>
              </>
            )}

            <span className="hidden sm:inline">Setores & Projetos</span>
            {currentFolder && (
              <>
                <span className="hidden sm:inline">/</span>
                <span className="hidden sm:inline truncate">{currentFolder.name}</span>
              </>
            )}
            <span className="hidden sm:inline">/</span>
            <span className="text-[var(--fg)] font-semibold flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-[var(--color-brand-blue)] shrink-0" />
              <span className="truncate">{currentList?.name || 'Ordens de Serviço'}</span>
            </span>
          </div>

          {/* Ações no topo direito */}
          <div className="flex items-center gap-1.5 text-[var(--ds-muted)] shrink-0">
            {savedNotice && (
              <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full mr-1">
                {savedNotice}
              </span>
            )}
            {isSavingInline && !savedNotice && (
              <span className="text-[11px] text-[var(--ds-muted)] mr-1">Salvando...</span>
            )}
            {error && (
              <span className="text-[11px] text-red-500 font-medium px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 mr-1">
                {error}
              </span>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 hover:text-[var(--fg)] hover:bg-[var(--line2)] rounded-md transition-colors cursor-pointer"
              title="Alternar tela cheia"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Menu discreto de mais opções (exclusão oculta aqui dentro e apenas para quem tem permissão) */}
            {activeTask && (
              <Popover
                open={moreMenuOpen}
                onOpenChange={(next) => {
                  setMoreMenuOpen(next)
                  if (!next) setConfirmingDelete(false)
                }}
              >
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      className="p-1.5 hover:text-[var(--fg)] hover:bg-[var(--line2)] rounded-md transition-colors cursor-pointer"
                      title="Mais opções"
                    />
                  }
                >
                  <MoreHorizontal className="w-4 h-4" />
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-60 p-1.5 bg-[var(--surface)] border-[var(--line2)] rounded-xl shadow-2xl text-[var(--fg)]"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(activeTask.id)
                        flashSaved('ID copiado')
                        setMoreMenuOpen(false)
                      }}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] hover:bg-[var(--line2)]/60 text-left transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
                      <span>Copiar identificador da tarefa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        flashSaved('Favorito salvo')
                        setMoreMenuOpen(false)
                      }}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] hover:bg-[var(--line2)]/60 text-left transition-colors cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
                      <span>Destacar nos favoritos</span>
                    </button>

                    {activeTask.created_by_name && (
                      <div className="px-2.5 py-1 text-[10.5px] text-[var(--ds-muted)]">
                        Criada por <span className="font-medium text-[var(--fg)]">{activeTask.created_by_name}</span>
                      </div>
                    )}

                    {/* Arquivar / Restaurar — criador, Convidado Gerente, Membro ou Admin */}
                    {canArchiveTask && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={async () => {
                          setIsPending(true)
                          try {
                            const nextState = !Boolean(activeTask.is_archived)
                            await archiveTask(activeTask.id, nextState)
                            flashSaved(nextState ? 'Tarefa arquivada' : 'Tarefa restaurada')
                            setMoreMenuOpen(false)
                            if (nextState) onOpenChange(false)
                          } catch (err: unknown) {
                            alert(err instanceof Error ? err.message : 'Sem permissão para arquivar.')
                          } finally {
                            setIsPending(false)
                          }
                        }}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] hover:bg-[var(--line2)]/60 text-left transition-colors cursor-pointer"
                      >
                        {activeTask.is_archived ? (
                          <>
                            <ArchiveRestore className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Restaurar do arquivo</span>
                          </>
                        ) : (
                          <>
                            <Archive className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
                            <span>Arquivar tarefa</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Opção discreta e difícil de perceber de remoção — somente para perfis com permissão */}
                    {onDelete && canDeleteTask && (
                      <div className="mt-1 pt-1.5 border-t border-[var(--line2)]">
                        {!confirmingDelete ? (
                          <button
                            type="button"
                            onClick={() => setConfirmingDelete(true)}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] text-[var(--ds-muted)] hover:text-red-400 hover:bg-red-500/5 text-left transition-colors cursor-pointer"
                          >
                            <span>Remover registro permanentemente</span>
                          </button>
                        ) : (
                          <div className="flex flex-col gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/25">
                            <div className="flex items-start gap-1.5 text-[11px] text-red-400 leading-snug">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>
                                Ação irreversível. Subtarefas vinculadas também serão removidas.
                              </span>
                            </div>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setConfirmingDelete(false)}
                                className="px-2 py-1 rounded text-[11px] font-medium bg-[var(--surface)] hover:bg-[var(--line2)] text-[var(--fg)] cursor-pointer"
                              >
                                Voltar
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={handleDelete}
                                className="px-2.5 py-1 rounded text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                              >
                                {isPending ? 'Removendo...' : 'Confirmar exclusão'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 hover:text-[var(--fg)] hover:bg-[var(--line2)] rounded-md transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CORPO EM 3 COLUNAS */}
        {/* ========================================================================= */}
        <div className="flex flex-row flex-1 min-h-0 overflow-hidden">
          {/* ========================================================================= */}
          {/* COLUNA 1: DETALHES DA TAREFA */}
          {/* ========================================================================= */}
          <div className="flex-1 min-w-0 overflow-y-auto px-8 py-6 flex flex-col gap-5">
            {/* Tag de Tipo (Tarefa / Subtarefa) + ID */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--line2)] text-[11px] font-semibold text-[var(--fg)]">
                {activeTask?.parent_task_id ? (
                  <Layers className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                ) : (
                  <CheckSquare className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                )}
                <span>{activeTask?.parent_task_id ? 'Subtarefa' : 'Tarefa'}</span>
              </div>
              <span className="text-[11px] text-[var(--ds-muted)] font-mono">
                #{activeTask ? activeTask.id.slice(0, 7) : 'nova'}
              </span>
            </div>

            {/* Título da Tarefa em Destaque */}
            <div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                placeholder="Nome da tarefa..."
                className="text-[22px] font-bold tracking-tight bg-transparent border-transparent hover:border-[var(--line2)] focus:border-[var(--color-brand-blue)] focus:bg-[var(--bg)] px-2 py-1.5 h-auto text-[var(--fg)] rounded-lg transition-all"
              />
            </div>

            {/* Barra de Prompt IA */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--line2)] text-[12px] text-[var(--ds-muted)] hover:border-[var(--color-brand-blue)]/40 transition-colors cursor-pointer group">
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-brand-blue)] group-hover:scale-110 transition-transform" />
              <span>Peça ao Brain / IA um resumo ou plano operacional desta tarefa</span>
            </div>

            {/* ========================================================================= */}
            {/* GRID DE PROPRIEDADES (SEM ESTIMATIVA E SEM ETIQUETAS) */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 py-2">
              {/* LINHA 1 - ESQUERDA: STATUS + CHECKMARK RÁPIDO */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--ds-muted)] w-[120px] shrink-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: currentStatusObj.color || '#10b981' }}
                  />
                  <span>Status</span>
                </div>
                <div className="flex items-center gap-1.5 flex-1 justify-end">
                  <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
                    <PopoverTrigger
                      render={
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer hover:brightness-110"
                          style={{
                            backgroundColor: currentStatusObj.color || '#10b981',
                          }}
                        />
                      }
                    >
                      <span>{statusKey}</span>
                      <ChevronDown className="w-3 h-3 opacity-80" />
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-1.5 bg-[var(--surface)] border-[var(--line2)] rounded-xl shadow-2xl">
                      <div className="flex flex-col gap-1">
                        {effectiveStatuses.map((st) => {
                          const active =
                            statusKey.toLowerCase() === st.name.toLowerCase()
                          return (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => handleSelectStatus(st.name)}
                              className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-[11.5px] font-bold uppercase text-left transition-colors cursor-pointer ${
                                active ? 'bg-[var(--line2)]/80' : 'hover:bg-[var(--line2)]/50'
                              }`}
                            >
                              <span className="flex items-center gap-2" style={{ color: st.color }}>
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: st.color }}
                                />
                                <span>{st.name}</span>
                              </span>
                              {active && <Check className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />}
                            </button>
                          )
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <button
                    type="button"
                    onClick={handleToggleCompleted}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isDoneStatusName(statusKey)
                        ? 'text-emerald-500 bg-emerald-500/10'
                        : 'text-[var(--ds-muted)] hover:bg-[var(--line2)] hover:text-emerald-500'
                    }`}
                    title="Alternar conclusão"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* LINHA 1 - DIREITA: RESPONSÁVEIS MÚLTIPLOS (ADICIONAR E REMOVER REAL) */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--ds-muted)] w-[120px] shrink-0">
                  <User className="w-3.5 h-3.5" />
                  <span>Responsáveis</span>
                </div>
                <div className="flex items-center gap-1.5 flex-1 justify-end flex-wrap">
                  {selectedAssignees.slice(0, 3).map((name) => (
                    <div
                      key={name}
                      className="group/chip relative flex items-center gap-1.5 pl-1 pr-1.5 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--line2)] text-[11px] font-medium text-[var(--fg)]"
                      title={name}
                    >
                      <div className="w-5 h-5 rounded-full bg-[var(--color-brand-blue)] text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                        {getInitials(name)}
                      </div>
                      <span className="max-w-[78px] truncate">{name.split(' ')[0]}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleAssignee(name)}
                        className="text-[var(--ds-muted)] hover:text-red-400 transition-colors cursor-pointer"
                        title={`Remover ${name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {selectedAssignees.length > 3 && (
                    <span className="px-2 py-0.5 rounded-full bg-[var(--line2)] text-[10px] font-bold text-[var(--fg)]">
                      +{selectedAssignees.length - 3}
                    </span>
                  )}

                  <CoyAssigneePicker
                    value={selectedAssignees}
                    multiple={true}
                    onChange={(vals: string[]) => {
                      setSelectedAssignees(vals)
                      if (activeTask?.id) {
                        void persistPatch(
                          { assignees: vals, assignee_name: vals[0] || 'Equipe' },
                          'Responsáveis atualizados'
                        )
                      }
                    }}
                    align="end"
                  >
                    <button
                      type="button"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-[var(--line2)] hover:border-[#0066FF] hover:bg-[#0066FF]/10 text-[11px] font-medium text-[var(--ds-muted)] hover:text-[#0066FF] transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#0066FF]" />
                      <span>{selectedAssignees.length === 0 ? 'Atribuir responsável' : 'Adicionar'}</span>
                    </button>
                  </CoyAssigneePicker>
                </div>
              </div>

              {/* LINHA 2 - ESQUERDA: DATAS */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--ds-muted)] w-[120px] shrink-0">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Datas</span>
                </div>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <Popover>
                    <PopoverTrigger
                      render={
                        <button
                          type="button"
                          className="text-[11.5px] font-medium px-2.5 py-1 rounded-lg bg-[var(--bg)] border border-[var(--line2)]/60 hover:border-[var(--color-brand-blue)] text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer transition-colors"
                        />
                      }
                    >
                      {startDate ? format(startDate, 'dd/MM') : 'Início'}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[var(--surface)] border-[var(--line2)] rounded-xl shadow-2xl">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(d) => {
                          setStartDate(d)
                          if (activeTask?.id) {
                            void persistPatch({ start_date: formatDateIso(d) }, 'Data inicial salva')
                          }
                        }}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>

                  <span className="text-[11px] text-[var(--ds-muted)]">-&gt;</span>

                  <Popover>
                    <PopoverTrigger
                      render={
                        <button
                          type="button"
                          className="flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-lg bg-[var(--bg)] border border-[var(--line2)]/60 hover:border-[var(--color-brand-blue)] text-[var(--fg)] cursor-pointer transition-colors"
                        />
                      }
                    >
                      <CalendarIcon className="w-3 h-3 text-[var(--color-brand-blue)]" />
                      <span>{dueDate ? format(dueDate, 'dd/MM') : 'Prazo'}</span>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[var(--surface)] border-[var(--line2)] rounded-xl shadow-2xl">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={(d) => {
                          setDueDate(d)
                          if (activeTask?.id) {
                            void persistPatch({ due_date: formatDateIso(d) }, 'Prazo salvo')
                          }
                        }}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* LINHA 2 - DIREITA: PRIORIDADE */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--ds-muted)] w-[120px] shrink-0">
                  <Flag className="w-3.5 h-3.5" />
                  <span>Prioridade</span>
                </div>
                <div className="flex items-center gap-1.5 flex-1 justify-end">
                  <Popover open={priorityPopoverOpen} onOpenChange={setPriorityPopoverOpen}>
                    <PopoverTrigger
                      render={
                        <button
                          type="button"
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11.5px] font-semibold border transition-all cursor-pointer"
                          style={{
                            color: activePriority.color,
                            backgroundColor: activePriority.bg,
                            borderColor: activePriority.border,
                          }}
                        />
                      }
                    >
                      <Flag className="w-3 h-3 fill-current" />
                      <span>{activePriority.label}</span>
                      <ChevronDown className="w-3 h-3 opacity-70" />
                    </PopoverTrigger>
                    <PopoverContent className="w-44 p-1.5 bg-[var(--surface)] border-[var(--line2)] rounded-xl shadow-2xl">
                      <div className="flex flex-col gap-1">
                        {(['urgent', 'high', 'medium', 'low'] as TaskPriorityLevel[]).map((p) => {
                          const conf = PRIORITY_CONFIG[p]
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => handleSelectPriority(p)}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold hover:bg-[var(--line2)]/70 cursor-pointer"
                              style={{ color: conf.color }}
                            >
                              <div className="flex items-center gap-2">
                                <Flag className="w-3 h-3 fill-current" />
                                <span>{conf.label}</span>
                              </div>
                              {priority === p && <Check className="w-3.5 h-3.5" />}
                            </button>
                          )
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* LINHA 3 - ESQUERDA: RASTREAR TEMPO */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--ds-muted)] w-[120px] shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Rastrear tempo</span>
                </div>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="font-mono text-[12px] font-bold text-[var(--fg)] tracking-wider">
                    {formatSeconds(timeSpentSeconds)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextTrack = !isTrackingTime
                      setIsTrackingTime(nextTrack)
                      if (activeTask?.id) {
                        void persistPatch({
                          is_tracking_time: nextTrack,
                          time_spent_seconds: timeSpentSeconds,
                        })
                      }
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      isTrackingTime
                        ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/30 animate-pulse'
                        : 'bg-[var(--line2)] hover:bg-[var(--line)] text-[var(--fg)]'
                    }`}
                  >
                    {isTrackingTime ? (
                      <>
                        <Square className="w-2.5 h-2.5 fill-current" />
                        <span>Parar</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Iniciar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* LINHA 3 - DIREITA: CLIENTE / CONTA (DROPDOWN CUSTOMIZADO) */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--ds-muted)] w-[120px] shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Cliente</span>
                </div>
                <div className="flex items-center gap-1.5 flex-1 justify-end">
                  <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                    <PopoverTrigger
                      render={
                        <button
                          type="button"
                          className="inline-flex items-center justify-between gap-2 max-w-[210px] h-8 px-3 rounded-lg bg-[var(--bg)] border border-[var(--line2)] hover:border-[var(--color-brand-blue)] text-[11.5px] font-medium text-[var(--fg)] cursor-pointer transition-colors"
                        />
                      }
                    >
                      <span className="truncate">
                        {selectedClientObj ? selectedClientObj.name : 'Sem cliente'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-[var(--ds-muted)] shrink-0" />
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      className="w-64 p-1.5 bg-[var(--surface)] border-[var(--line2)] rounded-xl shadow-2xl"
                    >
                      <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => handleSelectClient('')}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-[12px] text-left hover:bg-[var(--line2)]/60 cursor-pointer ${
                            !targetClientId ? 'bg-[var(--line2)]/70 font-semibold' : 'text-[var(--ds-muted)]'
                          }`}
                        >
                          <span>Sem cliente</span>
                          {!targetClientId && <Check className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />}
                        </button>
                        {availableClients.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectClient(c.id)}
                            className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-[12px] text-left hover:bg-[var(--line2)]/60 cursor-pointer ${
                              targetClientId === c.id ? 'bg-[var(--color-brand-blue)]/10 font-semibold' : ''
                            }`}
                          >
                            <span className="truncate">{c.name}</span>
                            {targetClientId === c.id && (
                              <Check className="w-3.5 h-3.5 text-[var(--color-brand-blue)] shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* DESCRIÇÃO & BRIEFING (AUTO-SAVE NO BLUR + BOTÃO RÁPIDO) */}
            {/* ========================================================================= */}
            <div className="flex flex-col gap-2 pt-3 border-t border-[var(--line2)]">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-semibold text-[var(--fg)]">
                  Descrição &amp; Briefing
                </span>
                {activeTask?.id && description.trim() !== (activeTask.description || '').trim() && (
                  <button
                    type="button"
                    onClick={() => void persistPatch({ description: description.trim() }, 'Briefing salvo')}
                    className="text-[11px] font-bold text-[var(--color-brand-blue)] hover:underline cursor-pointer"
                  >
                    Salvar briefing agora
                  </button>
                )}
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                placeholder="Adicione uma descrição detalhada, briefing ou instruções operacionais..."
                rows={4}
                className="bg-[var(--bg)] border-[var(--line2)] focus:border-[var(--color-brand-blue)] text-[13px] leading-relaxed resize-y rounded-xl p-3"
              />
            </div>

            {/* ========================================================================= */}
            {/* CAMPOS PERSONALIZADOS */}
            {/* ========================================================================= */}
            <TaskCustomFields
              listId={targetListId}
              taskId={activeTask?.id}
              taskCustomFields={customFields}
              onChange={handleCustomFieldsChange}
              customFieldDefs={customFieldDefs}
              onCreateFieldDef={createCustomFieldDef}
              onDeleteFieldDef={deleteCustomFieldDef}
              availableMembers={combinedMembers}
              canManageDefinitions={canManageCustomFields}
            />

            {/* ========================================================================= */}
            {/* SUBTAREFAS COMO TAREFAS REAIS (ESTILO LISTA DE TAREFAS, SEM CHECKLIST) */}
            {/* ========================================================================= */}
            <div className="flex flex-col gap-3 border-t border-[var(--line2)] pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-[var(--fg)]">Subtarefas</span>
                  <span className="text-[11px] font-semibold text-[var(--ds-muted)] px-2 py-0.5 rounded-full bg-[var(--line2)]">
                    {activeTask?.id
                      ? `${completedChildCount}/${childSubtasks.length}`
                      : `${draftSubtasks.length}`}
                  </span>
                </div>
                {activeTask?.id && childSubtasks.length > 0 && (
                  <span className="text-[11px] text-[var(--ds-muted)]">
                    Clique em uma subtarefa para abrir o card completo
                  </span>
                )}
              </div>

              {/* Lista de subtarefas reais no formato igual ao workspace em Lista */}
              {activeTask?.id ? (
                childSubtasks.length > 0 && (
                  <div className="rounded-xl border border-[var(--line2)] bg-[var(--bg)]/60 overflow-hidden divide-y divide-[var(--line)]">
                    {childSubtasks.map((sub) => {
                      const subDone = isDoneStatusName(sub.status_key)
                      const subStatusColor =
                        taskStatuses.find(
                          (s) =>
                            s.list_id === sub.list_id &&
                            s.name.toLowerCase() === sub.status_key.toLowerCase()
                        )?.color ||
                        effectiveStatuses.find(
                          (s) => s.name.toLowerCase() === sub.status_key.toLowerCase()
                        )?.color ||
                        (subDone ? '#2F9E5A' : '#64748b')
                      const subPriorityConf =
                        PRIORITY_CONFIG[sub.priority] || PRIORITY_CONFIG.medium
                      const subAssignees =
                        sub.assignees && sub.assignees.length > 0
                          ? sub.assignees
                          : sub.assignee_name
                            ? sub.assignee_name
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean)
                            : []

                      return (
                        <div
                          key={sub.id}
                          onClick={() => handleNavigateToTask(sub)}
                          className="group flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-[var(--surface)] transition-colors cursor-pointer"
                        >
                          {/* Esquerda: bolinha de status + título */}
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => handleToggleChildSubtaskStatus(e, sub)}
                              className="w-5 h-5 rounded-full flex items-center justify-center border shrink-0 transition-transform hover:scale-110 cursor-pointer"
                              style={{
                                borderColor: subStatusColor,
                                backgroundColor: subDone ? subStatusColor : 'transparent',
                              }}
                              title={`Status: ${sub.status_key} (clique para alternar conclusão)`}
                            >
                              {subDone ? (
                                <Check className="w-3 h-3 text-white stroke-[3]" />
                              ) : (
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: subStatusColor }}
                                />
                              )}
                            </button>

                            <span
                              className={`text-[12.5px] font-medium truncate ${
                                subDone
                                  ? 'line-through text-[var(--ds-muted)]'
                                  : 'text-[var(--fg)] group-hover:text-[var(--color-brand-blue)]'
                              }`}
                            >
                              {sub.title}
                            </span>
                          </div>

                          {/* Direita: Status Pill + Prioridade + Responsáveis + Prazo + Abrir */}
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span
                              className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border"
                              style={{
                                color: subStatusColor,
                                borderColor: `${subStatusColor}40`,
                                backgroundColor: `${subStatusColor}15`,
                              }}
                            >
                              {sub.status_key}
                            </span>

                            <span
                              className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border"
                              style={{
                                color: subPriorityConf.color,
                                borderColor: subPriorityConf.border,
                                backgroundColor: subPriorityConf.bg,
                              }}
                            >
                              <Flag className="w-2.5 h-2.5 fill-current" />
                              {subPriorityConf.label}
                            </span>

                            {subAssignees.length > 0 && (
                              <div className="flex -space-x-1.5">
                                {subAssignees.slice(0, 2).map((name, idx) => (
                                  <div
                                    key={idx}
                                    className="w-5 h-5 rounded-full bg-[var(--line2)] border border-[var(--surface)] text-[9px] font-bold text-[var(--fg)] flex items-center justify-center"
                                    title={name}
                                  >
                                    {getInitials(name)}
                                  </div>
                                ))}
                              </div>
                            )}

                            {sub.due_date && (
                              <span className="hidden lg:inline text-[11px] font-mono text-[var(--ds-muted)]">
                                {sub.due_date}
                              </span>
                            )}

                            <ArrowUpRight className="w-3.5 h-3.5 text-[var(--ds-muted)] group-hover:text-[var(--color-brand-blue)] transition-colors" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              ) : (
                draftSubtasks.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {draftSubtasks.map((draft) => (
                      <div
                        key={draft.id}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--line2)]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-[var(--color-brand-blue)] shrink-0" />
                          <span className="text-[12.5px] font-medium text-[var(--fg)] truncate">
                            {draft.title}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftSubtasks((prev) => prev.filter((d) => d.id !== draft.id))
                          }
                          className="text-[var(--ds-muted)] hover:text-red-400 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Input rápido para criar subtarefa real no banco */}
              <div className="flex gap-2">
                <Input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => void handleAddRealSubtask(e)}
                  placeholder="+ Adicionar nova subtarefa como tarefa real (Enter)..."
                  disabled={isCreatingSubtask}
                  className="h-9 text-[12px] bg-[var(--bg)] border-[var(--line2)] focus:border-[var(--color-brand-blue)] rounded-xl"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleAddRealSubtask()}
                  disabled={isCreatingSubtask || !newSubtaskTitle.trim()}
                  className="h-9 px-4 bg-[var(--line2)] hover:bg-[var(--color-brand-blue)] hover:text-[#141414] text-[var(--fg)] font-semibold text-[12px] rounded-xl cursor-pointer transition-colors"
                >
                  {isCreatingSubtask ? 'Criando...' : 'Adicionar'}
                </Button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* RODAPÉ ESQUERDO LIMPO (SEM BOTÃO VERMELHO DE EXCLUIR EXPOSTO) */}
            {/* ========================================================================= */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--line2)] mt-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-full bg-[var(--bg)] border-[var(--line2)] h-9 px-5 text-[12px] font-semibold"
              >
                Fechar
              </Button>
              <Button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isPending}
                className="bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue-hover)] text-white rounded-full font-bold h-9 px-6 text-[12px] inline-flex items-center gap-1.5"
              >
                <span>{isPending ? 'Salvando...' : activeTask ? 'Salvar Tarefa' : 'Criar Tarefa'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* COLUNA 2: BARRA CENTRAL DE VÍNCULOS */}
          {/* ========================================================================= */}
          <div className="w-[44px] shrink-0 border-x border-[var(--line2)] bg-[var(--surface)] flex flex-col items-center justify-start py-4 gap-3 z-10">
            {/* Ícone Links */}
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                      links.length > 0
                        ? 'bg-[var(--color-brand-blue)]/15 text-[var(--color-brand-blue)]'
                        : 'text-[var(--ds-muted)] hover:text-[var(--fg)] hover:bg-[var(--line2)]'
                    }`}
                    title="Links de Referência"
                  />
                }
              >
                <Link2 className="w-4 h-4" />
                {links.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[var(--color-brand-blue)] text-white text-[8px] font-bold flex items-center justify-center">
                    {links.length}
                  </span>
                )}
              </PopoverTrigger>
              <PopoverContent
                className="w-72 p-3 bg-[var(--surface)] border-[var(--line2)] shadow-xl rounded-xl"
                side="right"
              >
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-[var(--fg)] flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                    Links Externos
                  </span>
                  <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                    {links.map((lk) => (
                      <div
                        key={lk.id}
                        className="flex items-center justify-between text-[11px] p-1.5 bg-[var(--bg)] rounded"
                      >
                        <a
                          href={lk.url}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-[var(--fg)] hover:underline"
                        >
                          {lk.title}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(lk.id)}
                          className="text-red-500 ml-1 cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1 pt-1 border-t border-[var(--line2)]">
                    <Input
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      placeholder="Título"
                      className="h-7 text-[11px] bg-[var(--bg)]"
                    />
                    <div className="flex gap-1">
                      <Input
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        placeholder="https://..."
                        className="h-7 text-[11px] bg-[var(--bg)] flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddLink}
                        disabled={!newLinkUrl.trim()}
                        className="h-7 px-2.5 bg-[var(--color-brand-blue)] text-white font-bold text-[10px]"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Ícone Anexos */}
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                      attachments.length > 0
                        ? 'bg-[var(--color-brand-blue)]/15 text-[var(--color-brand-blue)]'
                        : 'text-[var(--ds-muted)] hover:text-[var(--fg)] hover:bg-[var(--line2)]'
                    }`}
                    title="Anexos"
                  />
                }
              >
                <Paperclip className="w-4 h-4" />
                {attachments.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[var(--color-brand-blue)] text-white text-[8px] font-bold flex items-center justify-center">
                    {attachments.length}
                  </span>
                )}
              </PopoverTrigger>
              <PopoverContent
                className="w-72 p-3 bg-[var(--surface)] border-[var(--line2)] shadow-xl rounded-xl"
                side="right"
              >
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-[var(--fg)] flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                    Anexos da Tarefa
                  </span>
                  <label className="cursor-pointer flex items-center justify-center gap-2 p-2 border border-dashed border-[var(--line2)] rounded-lg text-[11px] text-[var(--ds-muted)] hover:text-[var(--fg)]">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Carregar arquivo</span>
                    <input type="file" multiple className="hidden" onChange={handleFileChange} />
                  </label>
                  <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between text-[11px] p-1.5 bg-[var(--bg)] rounded"
                      >
                        <span className="truncate">{att.file_name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="text-red-500 cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Ícone Tarefas Relacionadas */}
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                      linkedTaskIds.length > 0
                        ? 'bg-[var(--color-brand-blue)]/15 text-[var(--color-brand-blue)]'
                        : 'text-[var(--ds-muted)] hover:text-[var(--fg)] hover:bg-[var(--line2)]'
                    }`}
                    title="Tarefas Vinculadas"
                  />
                }
              >
                <Network className="w-4 h-4" />
                {linkedTaskIds.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[var(--color-brand-blue)] text-white text-[8px] font-bold flex items-center justify-center">
                    {linkedTaskIds.length}
                  </span>
                )}
              </PopoverTrigger>
              <PopoverContent
                className="w-72 p-3 bg-[var(--surface)] border-[var(--line2)] shadow-xl rounded-xl"
                side="right"
              >
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-[var(--fg)] flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                    Tarefas Vinculadas
                  </span>
                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                    {candidateTasks.map((ct) => (
                      <button
                        key={ct.id}
                        type="button"
                        onClick={() => handleToggleLinkedTask(ct.id)}
                        className="flex items-center justify-between p-1.5 rounded text-[11px] hover:bg-[var(--line2)] text-left cursor-pointer"
                      >
                        <span className="truncate text-[var(--fg)]">{ct.title}</span>
                        {linkedTaskIds.includes(ct.id) && (
                          <Check className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* ========================================================================= */}
          {/* COLUNA 3: PAINEL DE COMENTÁRIOS & ATIVIDADES */}
          {/* ========================================================================= */}
          <div className="w-[300px] min-w-[270px] max-w-[320px] shrink-0 bg-[var(--surface)] flex flex-col justify-between overflow-hidden">
            <div className="p-3.5 border-b border-[var(--line2)] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-[var(--fg)]">Comentários</span>
                  <span className="text-[11px] font-medium text-[var(--ds-muted)] px-1.5 py-0.5 rounded-full bg-[var(--line2)]">
                    {comments.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCommentSearch(!showCommentSearch)}
                  className="text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer p-1"
                  title="Buscar comentários"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
              {showCommentSearch && (
                <Input
                  value={commentSearch}
                  onChange={(e) => setCommentSearch(e.target.value)}
                  placeholder="Filtrar comentários..."
                  className="h-7 text-[11.5px] bg-[var(--bg)] border-[var(--line2)]"
                />
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              <div className="text-center py-1">
                <span className="text-[10px] text-[var(--ds-muted)] bg-[var(--bg)] px-2 py-0.5 rounded-full border border-[var(--line2)]">
                  {activeTask ? `Criada em ${activeTask.created_at || 'recente'}` : 'Criando tarefa'}
                </span>
              </div>

              {selectedAssignees.length > 0 && (
                <div className="text-[11px] text-[var(--ds-muted)] text-center">
                  Atribuída a{' '}
                  <strong className="text-[var(--fg)]">{selectedAssignees.join(', ')}</strong>
                </div>
              )}

              {filteredComments.map((comm) => (
                <div
                  key={comm.id}
                  className="flex flex-col gap-1.5 p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)] shadow-sm"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-[var(--color-brand-blue)]/20 text-[var(--color-brand-blue)] font-bold text-[9px] flex items-center justify-center">
                        {getInitials(comm.author_name)}
                      </div>
                      <span className="font-semibold text-[var(--fg)]">{comm.author_name}</span>
                    </div>
                    <span className="text-[10px] text-[var(--ds-muted)]">
                      {comm.created_at ? format(new Date(comm.created_at), 'HH:mm') : ''}
                    </span>
                  </div>

                  <p className="text-[12px] text-[var(--fg)] whitespace-pre-wrap leading-relaxed">
                    {comm.content}
                  </p>

                  {comm.audio_url && (
                    <div className="mt-1">
                      <AudioPlayer src={comm.audio_url} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-[var(--line2)] bg-[var(--surface)] flex flex-col gap-2">
              <Textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void handleSendComment()
                  }
                }}
                placeholder="Escreva um comentário... (Enter para enviar)"
                rows={2}
                className="bg-[var(--bg)] border-[var(--line2)] text-[12px] resize-none focus:border-[var(--color-brand-blue)]"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <AudioRecorder onRecordingComplete={(b) => void handleAudioComplete(b)} onClear={() => {}} />
                  <label className="p-1.5 hover:bg-[var(--line2)] rounded text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer">
                    <Paperclip className="w-3.5 h-3.5" />
                    <input type="file" multiple className="hidden" onChange={handleFileChange} />
                  </label>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleSendComment()}
                  disabled={!newCommentText.trim()}
                  className="h-7 px-3 bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue-hover)] text-white font-bold text-[11px] rounded-lg flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Enviar</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
