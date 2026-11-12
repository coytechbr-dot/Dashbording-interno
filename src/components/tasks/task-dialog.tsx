'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
  Trash2,
  Building2,
  Link2,
  ExternalLink,
  FileText,
  Network,
  CornerUpLeft,
  MessageSquare,
  Plus,
  Play,
  Square,
  Flag,
  Tag,
  Clock,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  Send,
  User,
  Search,
  Maximize2,
  Star,
  CheckSquare,
} from 'lucide-react'
import { AudioRecorder } from './audio-recorder'
import { AudioPlayer } from './audio-player'
import { TaskChecklist } from './task-checklist'
import { TaskCustomFields } from './task-custom-fields'
import { useCoyDash } from '@/lib/coydash-store'
import type {
  TaskItem,
  TaskPriorityLevel,
  TaskSubtaskItem,
  TaskCommentItem,
  TaskAttachmentItem,
  TaskExternalLink,
  TaskListItem,
  ClientAccount,
  TaskCustomFieldValue,
  CustomFieldDefinition,
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
  onSave: (taskData: Partial<TaskItem>) => Promise<void>
  onDelete?: (taskId: string) => Promise<void>
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

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultListId,
  defaultStatusKey = 'A FAZER',
  allTasks = [],
  availableLists,
  availableClients,
  availableStatuses,
  availableMembers,
  currentUserName,
  onSave,
  onDelete,
}: TaskDialogProps) {
  // Store global para pastas e definições de campos personalizados
  const {
    taskFolders = [],
    customFieldDefs = [],
    createCustomFieldDef,
    deleteCustomFieldDef,
  } = useCoyDash()

  // Membros combinados garantindo a presença do usuário logado
  const combinedMembers = useMemo(() => {
    const list = [...availableMembers]
    if (currentUserName && !list.includes(currentUserName)) {
      list.push(currentUserName)
    }
    return Array.from(new Set(list))
  }, [availableMembers, currentUserName])

  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState('')

  // Campos principais de Detalhes
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriorityLevel>('medium')
  const [statusKey, setStatusKey] = useState('A FAZER')
  const [targetListId, setTargetListId] = useState('')
  const [targetClientId, setTargetClientId] = useState('')
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [timeEstimate, setTimeEstimate] = useState<string>('')
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0)
  const [isTrackingTime, setIsTrackingTime] = useState<boolean>(false)
  const [tags, setTags] = useState<string[]>([])
  const [customFields, setCustomFields] = useState<TaskCustomFieldValue[]>([])

  // Subtarefas, Comentários e Anexos
  const [subtasks, setSubtasks] = useState<TaskSubtaskItem[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [comments, setComments] = useState<TaskCommentItem[]>([])
  const [attachments, setAttachments] = useState<TaskAttachmentItem[]>([])

  // Conexões e Vínculos da barra central
  const [links, setLinks] = useState<TaskExternalLink[]>([])
  const [linkedTaskIds, setLinkedTaskIds] = useState<string[]>([])
  const [originReference, setOriginReference] = useState<string>('')
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')

  // Input de Comentário lateral
  const [newCommentText, setNewCommentText] = useState('')
  const [commentSearch, setCommentSearch] = useState('')

  // Timer interval ref
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Controle de Rastreamento de Tempo ao vivo
  useEffect(() => {
    if (isTrackingTime) {
      timerRef.current = setInterval(() => {
        setTimeSpentSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isTrackingTime])

  // Inicialização e preenchimento ao abrir
  useEffect(() => {
    if (open) {
      setError('')
      setNewLinkTitle('')
      setNewLinkUrl('')
      setNewCommentText('')
      setNewSubtaskTitle('')

      if (task) {
        setTitle(task.title || '')
        setDescription(task.description || '')
        setPriority(task.priority || 'medium')
        setStatusKey(task.status_key || defaultStatusKey)
        setTargetListId(task.list_id || defaultListId || '')
        setTargetClientId(task.client_id || '')

        if (task.assignees && task.assignees.length > 0) {
          setSelectedAssignees(task.assignees)
        } else if (task.assignee_name) {
          setSelectedAssignees(
            task.assignee_name
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          )
        } else {
          setSelectedAssignees([])
        }

        if (task.start_date) {
          const [y, m, d] = task.start_date.split('-').map(Number)
          setStartDate(new Date(y, m - 1, d))
        } else {
          setStartDate(undefined)
        }

        if (task.due_date) {
          const [y, m, d] = task.due_date.split('-').map(Number)
          setDueDate(new Date(y, m - 1, d))
        } else {
          setDueDate(undefined)
        }

        setTimeEstimate(task.time_estimate || '')
        setTimeSpentSeconds(task.time_spent_seconds || 0)
        setIsTrackingTime(Boolean(task.is_tracking_time))
        setTags(task.tags || [])
        setCustomFields(task.custom_fields || [])
        setSubtasks(task.subtasks || [])
        setComments(task.comments || [])
        setAttachments(task.attachments || [])
        setLinks(task.links || [])
        setLinkedTaskIds(task.linked_task_ids || [])
        setOriginReference(task.origin_reference || '')
      } else {
        // Nova tarefa - Criador automaticamente marcado como responsável
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
        setTimeEstimate('')
        setTimeSpentSeconds(0)
        setIsTrackingTime(false)
        setTags([])
        setCustomFields([])
        setSubtasks([])
        setComments([])
        setAttachments([])
        setLinks([])
        setLinkedTaskIds([])
        setOriginReference('')
      }
    }
  }, [open, task, defaultListId, defaultStatusKey, availableLists, availableMembers, currentUserName])

  // Formatação de Segundos para Relógio (HH:MM:SS)
  const formatSeconds = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  // Alternar Responsável
  const handleToggleAssignee = (memberName: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(memberName)
        ? prev.filter((m) => m !== memberName)
        : [...prev, memberName]
    )
  }

  // Alternar Status Direto no Checkmark
  const handleToggleCompleted = () => {
    const isCompleted =
      statusKey.toLowerCase().includes('concl') ||
      statusKey.toLowerCase().includes('finaliz') ||
      statusKey.toLowerCase().includes('done')

    if (isCompleted) {
      setStatusKey(availableStatuses[0]?.name || 'A FAZER')
    } else {
      const finalStatus =
        availableStatuses.find(
          (s) =>
            s.name.toLowerCase().includes('concl') ||
            s.name.toLowerCase().includes('finaliz') ||
            s.name.toLowerCase().includes('done')
        )?.name || 'FINALIZADO'
      setStatusKey(finalStatus)
    }
  }

  // Subtarefas
  const handleAddSubtask = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return
    if (!newSubtaskTitle.trim()) return

    const newSub: TaskSubtaskItem = {
      id: `sub_${Date.now()}`,
      title: newSubtaskTitle.trim(),
      is_completed: false,
    }
    setSubtasks((prev) => [...prev, newSub])
    setNewSubtaskTitle('')
  }

  const handleToggleSubtask = (subId: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, is_completed: !s.is_completed } : s))
    )
  }

  const handleDeleteSubtask = (subId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subId))
  }

  // Tags
  const handleAddTag = (tagText: string) => {
    const trimmed = tagText.trim().replace(/^#/, '')
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove))
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

      setAttachments((prev) => [...prev, ...newAttachments])
    }
  }

  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId))
  }

  // Áudio gravado como comentário ou anexo
  const handleAudioComplete = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const audioComment: TaskCommentItem = {
      id: `comment_audio_${Date.now()}`,
      author_name: currentUserName || 'Eu',
      content: '🎙️ Mensagem de voz gravada',
      audio_url: url,
      created_at: new Date().toISOString(),
    }
    setComments((prev) => [...prev, audioComment])
  }

  // Enviar Comentário de Texto
  const handleSendComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newCommentText.trim()) return

    const newComment: TaskCommentItem = {
      id: `comment_${Date.now()}`,
      author_name: currentUserName || 'Eu',
      content: newCommentText.trim(),
      created_at: new Date().toISOString(),
    }
    setComments((prev) => [...prev, newComment])
    setNewCommentText('')
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

    setLinks((prev) => [...prev, newLink])
    setNewLinkTitle('')
    setNewLinkUrl('')
  }

  const handleRemoveLink = (linkId: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== linkId))
  }

  const handleToggleLinkedTask = (tId: string) => {
    setLinkedTaskIds((prev) =>
      prev.includes(tId) ? prev.filter((id) => id !== tId) : [...prev, tId]
    )
  }

  // Submissão do Formulário
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

      const formattedStartDate = startDate
        ? `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
        : null

      const formattedDueDate = dueDate
        ? `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`
        : null

      let finalAssignees = [...selectedAssignees]
      if (!task && currentUserName) {
        if (!finalAssignees.some((a) => a.toLowerCase().trim() === currentUserName.toLowerCase().trim())) {
          finalAssignees = [currentUserName, ...finalAssignees]
        }
      }
      if (finalAssignees.length === 0 && currentUserName) {
        finalAssignees = [currentUserName]
      }

      await onSave({
        title: title.trim(),
        description: description.trim(),
        priority,
        status_key: statusKey,
        list_id: targetListId || null,
        client_id: targetClientId || null,
        client_name_snapshot: linkedClient?.name || (task?.client_name_snapshot ?? ''),
        assignee_name: finalAssignees.join(', '),
        assignees: finalAssignees,
        start_date: formattedStartDate,
        due_date: formattedDueDate,
        time_estimate: timeEstimate || null,
        time_spent_seconds: timeSpentSeconds,
        is_tracking_time: isTrackingTime,
        tags,
        custom_fields: customFields,
        subtasks,
        comments,
        attachments,
        links,
        linked_task_ids: linkedTaskIds,
        origin_reference: originReference,
      })

      onOpenChange(false)
    } catch (err) {
      console.error(err)
      setError('Ocorreu um erro ao salvar a tarefa. Tente novamente.')
    } finally {
      setIsPending(false)
    }
  }

  const handleDelete = async () => {
    if (!task || !onDelete) return
    if (!confirm('Tem certeza que deseja excluir esta tarefa permanentemente?')) return

    setIsPending(true)
    try {
      await onDelete(task.id)
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      setError('Erro ao excluir tarefa.')
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

  // Busca do caminho da Lista no Breadcrumb
  const currentList = availableLists.find((l) => l.id === targetListId)
  const currentFolder = taskFolders.find((f) => f.id === currentList?.folder_id)
  const candidateTasks = allTasks.filter((t) => t.id !== task?.id)

  const activePriority = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium

  const currentStatusObj =
    availableStatuses.find((s) => s.name === statusKey) || {
      name: statusKey,
      color: '#10b981',
    }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        style={{ width: '88vw', maxWidth: '1600px' }}
        className="bg-[var(--surface)] text-[var(--fg)] border-[var(--line2)] !w-[88vw] !max-w-[1600px] sm:!max-w-[1600px] h-[92vh] max-h-[960px] p-0 flex flex-col gap-0 rounded-[20px] shadow-2xl overflow-hidden"
      >
        {/* ========================================================================= */}
        {/* CABEÇALHO SUPERIOR (BREADCRUMB ESTILO CLICKUP) */}
        {/* ========================================================================= */}
        <div className="px-6 py-2.5 border-b border-[var(--line)] flex items-center justify-between shrink-0 bg-[var(--surface)] select-none">
          {/* Breadcrumb da Lista */}
          <div className="flex items-center gap-2 text-[12px] text-[var(--ds-muted)] truncate">
            <span className="hover:text-[var(--fg)] cursor-pointer">Compartilhado comigo</span>
            <span>/</span>
            {currentFolder && (
              <>
                <span className="hover:text-[var(--fg)] cursor-pointer">{currentFolder.name}</span>
                <span>/</span>
              </>
            )}
            <span className="text-[var(--fg)] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--color-brand-orange)]" />
              {currentList?.name || 'Ordens de Serviço'}
            </span>
          </div>

          {/* Ações no topo direito */}
          <div className="flex items-center gap-2 text-[var(--ds-muted)]">
            {error && (
              <span className="text-[11px] text-red-500 font-medium px-2 py-0.5 rounded bg-red-500/10 mr-2">
                {error}
              </span>
            )}
            <button
              type="button"
              className="p-1.5 hover:text-[var(--fg)] hover:bg-[var(--line2)] rounded-md transition-colors"
              title="Favoritar"
            >
              <Star className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 hover:text-[var(--fg)] hover:bg-[var(--line2)] rounded-md transition-colors"
              title="Tela cheia"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 hover:text-[var(--fg)] hover:bg-[var(--line2)] rounded-md transition-colors"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CORPO EM 3 COLUNAS: DETALHES CLICKUP + BARRA FINA DIVISÓRIA + COMENTÁRIOS */}
        {/* ========================================================================= */}
        <div className="flex flex-row flex-1 min-h-0 overflow-hidden">

          {/* ========================================================================= */}
          {/* COLUNA 1: PAINEL DE DETALHES ESTILO CLICKUP (~75% da largura, ampla e não espremida) */}
          {/* ========================================================================= */}
          <div className="flex-1 min-w-0 overflow-y-auto px-8 py-6 flex flex-col gap-5">
            {/* Tag de Tipo + ID */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--line2)] text-[11px] font-semibold text-[var(--fg)] hover:bg-[var(--line)] cursor-pointer">
                <CheckSquare className="w-3.5 h-3.5 text-[var(--color-brand-orange)]" />
                <span>Tarefa</span>
                <ChevronDown className="w-3 h-3 text-[var(--ds-muted)]" />
              </div>
              <span className="text-[11px] text-[var(--ds-muted)] font-mono">
                #{task ? task.id.slice(0, 7) : 'nova'}
              </span>
            </div>

            {/* Título da Tarefa em Destaque */}
            <div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nome da tarefa..."
                className="text-[22px] font-bold tracking-tight bg-transparent border-transparent hover:border-[var(--line2)] focus:border-[var(--color-brand-orange)] focus:bg-[var(--bg)] px-2 py-1.5 h-auto text-[var(--fg)] rounded-lg transition-all"
              />
            </div>

            {/* Barra de Prompt IA do ClickUp */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--line2)] text-[12px] text-[var(--ds-muted)] hover:border-[var(--color-brand-orange)]/40 transition-colors cursor-pointer group">
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-brand-orange)] group-hover:scale-110 transition-transform" />
              <span>Peça ao Brain / IA um resumo, apresentação ou checklist da tarefa</span>
            </div>

            {/* ========================================================================= */}
            {/* GRID DE PROPRIEDADES CLICKUP (2 COLUNAS) */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 py-2">

              {/* LINHA 1 - ESQUERDA: STATUS + BOTÃO CHECKMARK */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--ds-muted)] w-[120px] shrink-0">
                  <div className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[8px]">
                    ●
                  </div>
                  <span>Status</span>
                </div>
                <div className="flex items-center gap-1.5 flex-1 justify-end">
                  <Popover>
                    <PopoverTrigger
                      render={
                        <button
                          type="button"
                          className="px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider text-white transition-all shadow-sm flex items-center gap-1.5"
                          style={{
                            backgroundColor: currentStatusObj.color || '#10b981',
                          }}
                        />
                      }
                    >
                      <span>{statusKey}</span>
                      <ChevronDown className="w-3 h-3 opacity-70" />
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-1.5 bg-[var(--surface)] border-[var(--line2)]">
                      <div className="flex flex-col gap-1">
                        {availableStatuses.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setStatusKey(st.name)}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-bold uppercase hover:bg-[var(--line2)] text-left"
                            style={{ color: st.color }}
                          >
                            <span>{st.name}</span>
                            {statusKey === st.name && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Botão rápido de concluir ✓ */}
                  <button
                    type="button"
                    onClick={handleToggleCompleted}
                    className="p-1 rounded hover:bg-[var(--line2)] text-[var(--ds-muted)] hover:text-green-500 transition-colors"
                    title="Alternar conclusão"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* LINHA 1 - DIREITA: RESPONSÁVEIS MÚLTIPLOS */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--ds-muted)] w-[120px] shrink-0">
                  <User className="w-3.5 h-3.5" />
                  <span>Responsáveis</span>
                </div>
                <div className="flex items-center gap-1.5 flex-1 justify-end">
                  <Popover>
                    <PopoverTrigger
                      render={
                        <button
                          type="button"
                          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[var(--line2)] transition-colors"
                        />
                      }
                    >
                      {selectedAssignees.length === 0 ? (
                        <span className="text-[12px] text-[var(--ds-muted)]">Vazio</span>
                      ) : (
                        <div className="flex items-center -space-x-1.5">
                          {selectedAssignees.slice(0, 3).map((name) => (
                            <div
                              key={name}
                              className="w-6 h-6 rounded-full bg-[var(--color-brand-orange)] text-[#141414] font-bold text-[9px] flex items-center justify-center border-2 border-[var(--surface)]"
                              title={name}
                            >
                              {getInitials(name)}
                            </div>
                          ))}
                          {selectedAssignees.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-[var(--line2)] text-[var(--fg)] font-bold text-[9px] flex items-center justify-center border-2 border-[var(--surface)]">
                              +{selectedAssignees.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                      <Plus className="w-3.5 h-3.5 text-[var(--ds-muted)] hover:text-[var(--fg)]" />
                    </PopoverTrigger>
                    <PopoverContent className="w-60 p-2 bg-[var(--surface)] border-[var(--line2)]">
                      <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
                        <span className="text-[11px] font-semibold text-[var(--ds-muted)] px-2 py-1">
                          Selecionar responsáveis:
                        </span>
                        {combinedMembers.map((member: string) => {
                          const isAssigned = selectedAssignees.includes(member)
                          return (
                            <button
                              key={member}
                              type="button"
                              onClick={() => handleToggleAssignee(member)}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[var(--line2)] text-left transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[var(--line2)] text-[var(--fg)] flex items-center justify-center text-[10px] font-bold">
                                  {getInitials(member)}
                                </div>
                                <span className="text-[12px] text-[var(--fg)] truncate">
                                  {member}
                                </span>
                              </div>
                              {isAssigned && (
                                <Check className="w-3.5 h-3.5 text-[var(--color-brand-orange)]" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* LINHA 2 - ESQUERDA: DATAS (INÍCIO -> VENCIMENTO) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--ds-muted)] w-[120px] shrink-0">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Datas</span>
                </div>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  {/* Data Início */}
                  <Popover>
                    <PopoverTrigger
                      render={
                        <button
                          type="button"
                          className="text-[11px] font-medium px-2 py-0.5 rounded hover:bg-[var(--line2)] text-[var(--ds-muted)] hover:text-[var(--fg)]"
                        />
                      }
                    >
                      {startDate ? format(startDate, 'dd/MM') : 'Início'}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[var(--surface)] border-[var(--line2)]">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>

                  <span className="text-[10px] text-[var(--ds-muted)]">➔</span>

                  {/* Data Prazo */}
                  <Popover>
                    <PopoverTrigger
                      render={
                        <button
                          type="button"
                          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded hover:bg-[var(--line2)] text-[var(--fg)]"
                        />
                      }
                    >
                      <CalendarIcon className="w-3 h-3 text-[var(--color-brand-orange)]" />
                      <span>{dueDate ? format(dueDate, 'dd/MM') : 'Prazo'}</span>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[var(--surface)] border-[var(--line2)]">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* LINHA 2 - DIREITA: PRIORIDADE COM BANDEIRA */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--ds-muted)] w-[120px] shrink-0">
                  <Flag className="w-3.5 h-3.5" />
                  <span>Prioridade</span>
                </div>
                <div className="flex items-center gap-1.5 flex-1 justify-end">
                  <Popover>
                    <PopoverTrigger
                      render={
                        <button
                          type="button"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold border transition-all"
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
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-1.5 bg-[var(--surface)] border-[var(--line2)]">
                      <div className="flex flex-col gap-1">
                        {(['urgent', 'high', 'medium', 'low'] as TaskPriorityLevel[]).map((p) => {
                          const conf = PRIORITY_CONFIG[p]
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setPriority(p)}
                              className="flex items-center justify-between px-2 py-1 rounded text-[11px] font-semibold hover:bg-[var(--line2)]"
                              style={{ color: conf.color }}
                            >
                              <div className="flex items-center gap-1.5">
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

              {/* LINHA 3 - ESQUERDA: ESTIMATIVA DE TEMPO */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--ds-muted)] w-[120px] shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Estimativa</span>
                </div>
                <div className="flex items-center gap-1 flex-1 justify-end">
                  <Input
                    value={timeEstimate}
                    onChange={(e) => setTimeEstimate(e.target.value)}
                    placeholder="Vazio (ex: 2h)"
                    className="h-7 text-[11px] bg-transparent border-transparent hover:border-[var(--line2)] focus:border-[var(--color-brand-orange)] focus:bg-[var(--bg)] px-2 py-0 text-right w-24 text-[var(--fg)]"
                  />
                </div>
              </div>

              {/* LINHA 3 - DIREITA: RASTREAR TEMPO COM TIMER AO VIVO */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--ds-muted)] w-[120px] shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Rastrear tempo</span>
                </div>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-[11px] font-mono text-[var(--fg)]">
                    {formatSeconds(timeSpentSeconds)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsTrackingTime(!isTrackingTime)}
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold transition-all ${isTrackingTime
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-[var(--line2)] text-[var(--fg)] hover:bg-[var(--line)]'
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

              {/* LINHA 4 - ESQUERDA: ETIQUETAS (TAGS) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--ds-muted)] w-[120px] shrink-0">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Etiquetas</span>
                </div>
                <div className="flex items-center gap-1.5 flex-1 justify-end flex-wrap">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[var(--line2)] text-[var(--fg)] px-2 py-0.5 rounded-full"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <Popover>
                    <PopoverTrigger
                      render={
                        <button
                          type="button"
                          className="text-[11px] text-[var(--ds-muted)] hover:text-[var(--fg)] px-1.5 py-0.5 rounded hover:bg-[var(--line2)]"
                        />
                      }
                    >
                      + tag
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2 bg-[var(--surface)] border-[var(--line2)]">
                      <Input
                        placeholder="Nova tag + Enter"
                        className="h-7 text-[11px] bg-[var(--bg)]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddTag((e.target as HTMLInputElement).value)
                              ; (e.target as HTMLInputElement).value = ''
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* LINHA 4 - DIREITA: CLIENTE / CONTA */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--ds-muted)] w-[120px] shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Cliente</span>
                </div>
                <div className="flex items-center gap-1.5 flex-1 justify-end">
                  <select
                    value={targetClientId}
                    onChange={(e) => setTargetClientId(e.target.value)}
                    className="h-7 px-2 text-[11px] bg-transparent border border-transparent hover:border-[var(--line2)] rounded text-[var(--fg)] outline-none cursor-pointer max-w-[180px] truncate"
                  >
                    <option value="">Sem cliente</option>
                    {availableClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* DESCRIÇÃO DA TAREFA */}
            {/* ========================================================================= */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--line2)]">
              <span className="text-[12px] font-semibold text-[var(--ds-muted)]">
                Descrição & Briefing
              </span>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicione uma descrição detalhada ou escreva com ✨ IA..."
                rows={3}
                className="bg-[var(--bg)] border-[var(--line2)] focus:border-[var(--color-brand-orange)] text-[13px] leading-relaxed resize-y rounded-xl"
              />
            </div>

            {/* ========================================================================= */}
            {/* SEÇÃO DE CAMPOS PERSONALIZADOS (CLICKUP CUSTOM FIELDS) */}
            {/* ========================================================================= */}
            <TaskCustomFields
              listId={targetListId}
              taskId={task?.id}
              taskCustomFields={customFields}
              onChange={setCustomFields}
              customFieldDefs={customFieldDefs}
              onCreateFieldDef={createCustomFieldDef}
              onDeleteFieldDef={deleteCustomFieldDef}
              availableMembers={combinedMembers}
            />

            {/* ========================================================================= */}
            {/* SUBTAREFAS & CHECKLIST */}
            {/* ========================================================================= */}
            <div className="flex flex-col gap-3 border-t border-[var(--line2)] pt-4">
              <span className="text-[13px] font-bold text-[var(--fg)] flex items-center justify-between">
                <span>Subtarefas ({subtasks.filter((s) => s.is_completed).length}/{subtasks.length})</span>
              </span>

              {/* Lista de Subtarefas */}
              {subtasks.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[var(--bg)] border border-[var(--line2)] hover:border-[var(--line)] group transition-all"
                    >
                      <label className="flex items-center gap-2.5 flex-1 cursor-pointer min-w-0">
                        <input
                          type="checkbox"
                          checked={st.is_completed}
                          onChange={() => handleToggleSubtask(st.id)}
                          className="w-4 h-4 rounded border-[var(--line2)] accent-[var(--color-brand-orange)]"
                        />
                        <span
                          className={`text-[12.5px] truncate ${st.is_completed
                            ? 'line-through text-[var(--ds-muted)]'
                            : 'text-[var(--fg)]'
                            }`}
                        >
                          {st.title}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(st.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[var(--ds-muted)] hover:text-red-500 rounded transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input para adicionar subtarefa rápida */}
              <div className="flex items-center gap-2">
                <Input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={handleAddSubtask}
                  placeholder="+ Adicionar nova subtarefa (Pressione Enter)"
                  className="h-8 text-[12px] bg-[var(--bg)] border-[var(--line2)] focus:border-[var(--color-brand-orange)]"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskTitle.trim()}
                  className="h-8 px-3 bg-[var(--color-brand-orange)] text-[#141414] font-bold text-[11px] rounded-lg shrink-0"
                >
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Checklist adicional com barra de progresso visual */}
            <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <TaskChecklist subtasks={subtasks} onChange={setSubtasks} />
            </div>

            {/* Botões do Rodapé Esquerdo */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--line2)] mt-auto">
              {task && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg h-9 px-3.5 font-semibold text-[12px]"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Excluir
                </Button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="rounded-lg bg-[var(--bg)] border-[var(--line2)] h-9 px-4 text-[12px]"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isPending}
                  className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange-hover)] text-[#141414] rounded-lg font-bold h-9 px-5 text-[12px]"
                >
                  {isPending ? 'Salvando...' : task ? 'Salvar Tarefa' : 'Criar Tarefa'}
                </Button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* COLUNA 2: BARRA FINA DIVISÓRIA COM ÍCONES NO TOPO (44px) */}
          {/* ========================================================================= */}
          <div className="w-[44px] shrink-0 border-x border-[var(--line2)] bg-[var(--surface)] flex flex-col items-center justify-start py-4 gap-3 z-10">
            {/* Ícone Links */}
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${links.length > 0
                      ? 'bg-[var(--color-brand-orange)]/15 text-[var(--color-brand-orange)]'
                      : 'text-[var(--ds-muted)] hover:text-[var(--fg)] hover:bg-[var(--line2)]'
                      }`}
                    title="Links de Referência"
                  />
                }
              >
                <Link2 className="w-4 h-4" />
                {links.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[var(--color-brand-orange)] text-[#141414] text-[8px] font-bold flex items-center justify-center">
                    {links.length}
                  </span>
                )}
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3 bg-[var(--surface)] border-[var(--line2)] shadow-xl" side="right">
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-[var(--fg)] flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-[var(--color-brand-orange)]" />
                    Links Externos
                  </span>
                  <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                    {links.map((lk) => (
                      <div key={lk.id} className="flex items-center justify-between text-[11px] p-1.5 bg-[var(--bg)] rounded">
                        <a href={lk.url} target="_blank" rel="noreferrer" className="truncate text-[var(--fg)] hover:underline">
                          {lk.title}
                        </a>
                        <button type="button" onClick={() => handleRemoveLink(lk.id)} className="text-red-500 ml-1">
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
                        className="h-7 px-2.5 bg-[var(--color-brand-orange)] text-[#141414] font-bold text-[10px]"
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
                    className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${attachments.length > 0
                      ? 'bg-[var(--color-brand-orange)]/15 text-[var(--color-brand-orange)]'
                      : 'text-[var(--ds-muted)] hover:text-[var(--fg)] hover:bg-[var(--line2)]'
                      }`}
                    title="Anexos"
                  />
                }
              >
                <Paperclip className="w-4 h-4" />
                {attachments.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[var(--color-brand-orange)] text-[#141414] text-[8px] font-bold flex items-center justify-center">
                    {attachments.length}
                  </span>
                )}
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3 bg-[var(--surface)] border-[var(--line2)] shadow-xl" side="right">
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-[var(--fg)] flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-[var(--color-brand-orange)]" />
                    Anexos da Tarefa
                  </span>
                  <label className="cursor-pointer flex items-center justify-center gap-2 p-2 border border-dashed border-[var(--line2)] rounded-lg text-[11px] text-[var(--ds-muted)] hover:text-[var(--fg)]">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Carregar arquivo</span>
                    <input type="file" multiple className="hidden" onChange={handleFileChange} />
                  </label>
                  <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                    {attachments.map((att) => (
                      <div key={att.id} className="flex items-center justify-between text-[11px] p-1.5 bg-[var(--bg)] rounded">
                        <span className="truncate">{att.file_name}</span>
                        <button type="button" onClick={() => handleRemoveAttachment(att.id)} className="text-red-500">
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
                    className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${linkedTaskIds.length > 0
                      ? 'bg-[var(--color-brand-orange)]/15 text-[var(--color-brand-orange)]'
                      : 'text-[var(--ds-muted)] hover:text-[var(--fg)] hover:bg-[var(--line2)]'
                      }`}
                    title="Tarefas Vinculadas"
                  />
                }
              >
                <Network className="w-4 h-4" />
                {linkedTaskIds.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[var(--color-brand-orange)] text-[#141414] text-[8px] font-bold flex items-center justify-center">
                    {linkedTaskIds.length}
                  </span>
                )}
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3 bg-[var(--surface)] border-[var(--line2)] shadow-xl" side="right">
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-[var(--fg)] flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-[var(--color-brand-orange)]" />
                    Tarefas Vinculadas
                  </span>
                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                    {candidateTasks.map((ct) => (
                      <button
                        key={ct.id}
                        type="button"
                        onClick={() => handleToggleLinkedTask(ct.id)}
                        className="flex items-center justify-between p-1.5 rounded text-[11px] hover:bg-[var(--line2)] text-left"
                      >
                        <span className="truncate text-[var(--fg)]">{ct.title}</span>
                        {linkedTaskIds.includes(ct.id) && <Check className="w-3.5 h-3.5 text-[var(--color-brand-orange)]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* ========================================================================= */}
          {/* COLUNA 3: PAINEL DE COMENTÁRIOS & ATIVIDADES ESTILO CLICKUP (~22% a 25%) */}
          {/* ========================================================================= */}
          <div className="w-[300px] min-w-[270px] max-w-[320px] shrink-0 bg-[var(--surface)] flex flex-col justify-between overflow-hidden">

            {/* Topo do painel de comentários */}
            <div className="p-3.5 border-b border-[var(--line2)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-[var(--fg)]">Comentários</span>
                <span className="text-[11px] font-medium text-[var(--ds-muted)] px-1.5 py-0.2 rounded-full bg-[var(--line2)]">
                  {comments.length}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[var(--ds-muted)]">
                <Search className="w-3.5 h-3.5 hover:text-[var(--fg)] cursor-pointer" />
              </div>
            </div>

            {/* Timeline mista de Auditoria e Comentários */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {/* Eventos de auditoria simulados como no ClickUp */}
              <div className="text-center py-1">
                <span className="text-[10px] text-[var(--ds-muted)] bg-[var(--bg)] px-2 py-0.5 rounded-full border border-[var(--line2)]">
                  {task ? `Criada em ${task.created_at || 'recente'}` : 'Criando tarefa agora'}
                </span>
              </div>

              {selectedAssignees.length > 0 && (
                <div className="text-[11px] text-[var(--ds-muted)] italic text-center">
                  Atribuída a <strong className="text-[var(--fg)]">{selectedAssignees.join(', ')}</strong>
                </div>
              )}

              {/* Comentários reais */}
              {comments.map((comm) => (
                <div
                  key={comm.id}
                  className="flex flex-col gap-1.5 p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)] shadow-sm"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-[var(--color-brand-orange)]/20 text-[var(--color-brand-orange)] font-bold text-[9px] flex items-center justify-center">
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

            {/* Barra Inferior de Envio de Comentário */}
            <div className="p-3 border-t border-[var(--line2)] bg-[var(--surface)] flex flex-col gap-2">
              <Textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendComment()
                  }
                }}
                placeholder="Escreva um comentário... (Enter para enviar)"
                rows={2}
                className="bg-[var(--bg)] border-[var(--line2)] text-[12px] resize-none focus:border-[var(--color-brand-orange)]"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <AudioRecorder
                    onRecordingComplete={handleAudioComplete}
                    onClear={() => { }}
                  />
                  <label className="p-1.5 hover:bg-[var(--line2)] rounded text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer">
                    <Paperclip className="w-3.5 h-3.5" />
                    <input type="file" multiple className="hidden" onChange={handleFileChange} />
                  </label>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSendComment()}
                  disabled={!newCommentText.trim()}
                  className="h-7 px-3 bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange-hover)] text-[#141414] font-bold text-[11px] rounded-lg flex items-center gap-1"
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
