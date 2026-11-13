'use client'

import React, { useMemo, useState, useEffect } from 'react'
import {
  Plus,
  Trash2,
  Check,
  Search,
  Layers,
  Globe,
  FileText,
  SlidersHorizontal,
  LayoutTemplate,
  FolderKanban,
  ListChecks,
  X,
  Pencil,
  Sparkles,
  CheckCircle2,
  Users,
  ArrowRight,
  Save,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCoyDash } from '@/lib/coydash-store'
import {
  COVER_GALLERY,
  FIELD_TYPES_META,
  INDIVIDUAL_FIELD_TEMPLATES,
  OPTION_PALETTE,
  SYSTEM_GROUP_TEMPLATES,
} from './custom-fields-meta'
import type {
  CustomFieldDefinition,
  CustomFieldGroup,
  CustomFieldGroupFieldTemplate,
  CustomFieldType,
  TaskItem,
  TaskListItem,
} from '@/types/coydash'

export type StudioTab = 'criar' | 'modelos' | 'grupos' | 'ativos'

interface CustomFieldsStudioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: StudioTab
  currentListId?: string | null
  currentTaskId?: string
  onFieldCreated?: (created: CustomFieldDefinition) => void
}

interface ScopeSelectorProps {
  scope: 'list' | 'task' | 'template'
  onScopeChange: (scope: 'list' | 'task' | 'template') => void
  selectedListId: string
  onListIdChange: (listId: string) => void
  selectedTaskIds: string[]
  onTaskIdsChange: (taskIds: string[]) => void
  taskLists: TaskListItem[]
  allTasks: TaskItem[]
  currentTaskId?: string
  currentListId?: string | null
}

function ScopeAndTaskSelector({
  scope,
  onScopeChange,
  selectedListId,
  onListIdChange,
  selectedTaskIds,
  onTaskIdsChange,
  taskLists,
  allTasks,
  currentTaskId,
  currentListId,
}: ScopeSelectorProps) {
  const [taskSearch, setTaskSearch] = useState('')
  const [filterOnlyCurrentList, setFilterOnlyCurrentList] = useState(Boolean(currentListId))

  const rootTasks = useMemo(
    () => allTasks.filter((t) => !t.parent_task_id),
    [allTasks]
  )

  const filteredTasks = useMemo(() => {
    const q = taskSearch.trim().toLowerCase()
    return rootTasks.filter((t) => {
      if (filterOnlyCurrentList && (selectedListId || currentListId)) {
        const targetL = selectedListId || currentListId
        if (t.list_id !== targetL) return false
      }
      if (!q) return true
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      )
    })
  }, [rootTasks, filterOnlyCurrentList, selectedListId, currentListId, taskSearch])

  const listNameById = useMemo(() => {
    const map = new Map<string, string>()
    taskLists.forEach((l) => map.set(l.id, l.name))
    return map
  }, [taskLists])

  const toggleTask = (id: string) => {
    if (selectedTaskIds.includes(id)) {
      onTaskIdsChange(selectedTaskIds.filter((item) => item !== id))
    } else {
      onTaskIdsChange([...selectedTaskIds, id])
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-3.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] font-semibold text-foreground">
            Visibilidade &amp; Alcance das Tarefas
          </p>
          <p className="text-[11px] text-muted-foreground">
            Defina se o campo aparece em toda a lista ou apenas nas tarefas escolhidas abaixo.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
          <Users className="h-3 w-3" />
          Sincronizado para responsáveis
        </span>
      </div>

      {/* 3 cards de escopo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onScopeChange('list')}
          className={`flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
            scope === 'list'
              ? 'border-[#0066FF] bg-[#0066FF]/10'
              : 'border-border/80 bg-background/50 hover:border-foreground/30'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
            <Layers className={`h-3.5 w-3.5 ${scope === 'list' ? 'text-[#0066FF]' : 'text-muted-foreground'}`} />
            Toda a lista
          </div>
          <span className="text-[10.5px] leading-snug text-muted-foreground">
            Exibido em todas as tarefas da lista escolhida.
          </span>
        </button>

        <button
          type="button"
          onClick={() => onScopeChange('task')}
          className={`flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
            scope === 'task'
              ? 'border-[#0066FF] bg-[#0066FF]/10'
              : 'border-border/80 bg-background/50 hover:border-foreground/30'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
            <FileText className={`h-3.5 w-3.5 ${scope === 'task' ? 'text-[#0066FF]' : 'text-muted-foreground'}`} />
            Tarefas específicas
          </div>
          <span className="text-[10.5px] leading-snug text-muted-foreground">
            Escolha 1 ou mais tarefas na lista real abaixo.
          </span>
        </button>

        <button
          type="button"
          onClick={() => onScopeChange('template')}
          className={`flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
            scope === 'template'
              ? 'border-[#0066FF] bg-[#0066FF]/10'
              : 'border-border/80 bg-background/50 hover:border-foreground/30'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
            <Globe className={`h-3.5 w-3.5 ${scope === 'template' ? 'text-[#0066FF]' : 'text-muted-foreground'}`} />
            Global (Todas listas)
          </div>
          <span className="text-[10.5px] leading-snug text-muted-foreground">
            Visível em todas as listas e tarefas da equipe.
          </span>
        </button>
      </div>

      {/* Seletor de lista quando scope === 'list' */}
      {scope === 'list' && taskLists.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-medium text-muted-foreground">
            Lista de destino
          </label>
          <div className="flex flex-wrap gap-1.5">
            {taskLists.map((list) => {
              const active = selectedListId === list.id
              return (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => onListIdChange(list.id)}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                    active
                      ? 'border-[#0066FF] bg-[#0066FF]/15 text-foreground'
                      : 'border-border/80 bg-background/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {active && <Check className="h-3 w-3 text-[#0066FF]" />}
                  {list.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Checklist real de tarefas quando scope === 'task' */}
      {scope === 'task' && (
        <div className="space-y-2 rounded-lg border border-border/80 bg-background/70 p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Buscar tarefa pelo nome..."
                className="h-8 pl-8 text-[12px]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(selectedListId || currentListId) && (
                <button
                  type="button"
                  onClick={() => setFilterOnlyCurrentList((p) => !p)}
                  className={`rounded-md border px-2 py-1 text-[10.5px] font-medium cursor-pointer transition-colors ${
                    filterOnlyCurrentList
                      ? 'border-[#0066FF]/50 bg-[#0066FF]/10 text-[#0066FF]'
                      : 'border-border/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {filterOnlyCurrentList ? 'Somente lista atual' : 'Todas as listas'}
                </button>
              )}
              {currentTaskId && (
                <button
                  type="button"
                  onClick={() => onTaskIdsChange([currentTaskId])}
                  className="rounded-md border border-border/80 px-2 py-1 text-[10.5px] font-medium text-muted-foreground hover:border-foreground/30 hover:text-foreground cursor-pointer"
                >
                  Só tarefa atual
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  onTaskIdsChange(Array.from(new Set([...selectedTaskIds, ...filteredTasks.map((t) => t.id)])))
                }
                className="rounded-md border border-border/80 px-2 py-1 text-[10.5px] font-medium text-muted-foreground hover:border-foreground/30 hover:text-foreground cursor-pointer"
              >
                Marcar visíveis
              </button>
              {selectedTaskIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => onTaskIdsChange([])}
                  className="rounded-md border border-border/80 px-2 py-1 text-[10.5px] font-medium text-muted-foreground hover:text-red-500 cursor-pointer"
                >
                  Limpar ({selectedTaskIds.length})
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[190px] space-y-1 overflow-y-auto pr-1">
            {filteredTasks.length === 0 ? (
              <div className="py-5 text-center text-[11.5px] text-muted-foreground">
                Nenhuma tarefa encontrada para este filtro.
              </div>
            ) : (
              filteredTasks.map((t) => {
                const checked = selectedTaskIds.includes(t.id)
                const isCurrent = t.id === currentTaskId
                const listTitle = listNameById.get(t.list_id || '') || 'Lista'
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTask(t.id)}
                    className={`flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-left transition-colors cursor-pointer ${
                      checked
                        ? 'border-[#0066FF]/60 bg-[#0066FF]/8'
                        : 'border-transparent bg-muted/30 hover:border-border/80 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          checked
                            ? 'border-[#0066FF] bg-[#0066FF] text-white'
                            : 'border-muted-foreground/40 bg-background'
                        }`}
                      >
                        {checked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[12px] font-medium text-foreground">
                            {t.title}
                          </span>
                          {isCurrent && (
                            <span className="shrink-0 rounded bg-[#0066FF]/15 px-1.5 py-0.5 text-[9.5px] font-semibold text-[#0066FF]">
                              Atual
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[10.5px] text-muted-foreground">
                          {listTitle}
                          {Array.isArray(t.assignees) && t.assignees.length > 0
                            ? ` • ${t.assignees.length} responsável(is)`
                            : ''}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function CustomFieldsStudioDialog({
  open,
  onOpenChange,
  initialTab = 'criar',
  currentListId,
  currentTaskId,
  onFieldCreated,
}: CustomFieldsStudioDialogProps) {
  const {
    tasks,
    taskLists,
    customFieldDefs,
    customFieldGroups,
    createCustomFieldDef,
    updateCustomFieldDef,
    deleteCustomFieldDef,
    createCustomFieldGroup,
    updateCustomFieldGroup,
    deleteCustomFieldGroup,
    applyCustomFieldGroup,
  } = useCoyDash()

  const [activeTab, setActiveTab] = useState<StudioTab>(initialTab)
  useEffect(() => {
    if (open) setActiveTab(initialTab)
  }, [open, initialTab])

  // Fallback list id
  const fallbackListId = currentListId || taskLists[0]?.id || ''

  // =========================================================================
  // ABA 1: CRIAR / CONFIGURAR CAMPO INDIVIDUAL
  // =========================================================================
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [defaultValue, setDefaultValue] = useState('')
  const [type, setType] = useState<CustomFieldType>('text')
  const [isRequired, setIsRequired] = useState(false)
  const [coverImage, setCoverImage] = useState(COVER_GALLERY[0].url)
  const [scope, setScope] = useState<'list' | 'task' | 'template'>(currentListId ? 'list' : 'template')
  const [selectedListId, setSelectedListId] = useState(fallbackListId)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(currentTaskId ? [currentTaskId] : [])
  const [selectOptions, setSelectOptions] = useState<{ label: string; color: string }[]>([
    { label: 'Pendente', color: '#E8C14A' },
    { label: 'Aprovado', color: '#2F9E5A' },
  ])
  const [newOptLabel, setNewOptLabel] = useState('')
  const [newOptColor, setNewOptColor] = useState('#0066FF')
  const [savingField, setSavingField] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  useEffect(() => {
    if (fallbackListId && !selectedListId) setSelectedListId(fallbackListId)
  }, [fallbackListId, selectedListId])

  useEffect(() => {
    if (currentTaskId && selectedTaskIds.length === 0) {
      setSelectedTaskIds([currentTaskId])
    }
  }, [currentTaskId, selectedTaskIds.length])

  const showNotice = (msg: string) => {
    setFeedbackMsg(msg)
    setTimeout(() => setFeedbackMsg(null), 3500)
  }

  const handleAddSelectOpt = () => {
    const clean = newOptLabel.trim()
    if (!clean) return
    setSelectOptions((prev) => [...prev, { label: clean, color: newOptColor }])
    setNewOptLabel('')
  }

  const handleSaveNewField = async () => {
    const clean = name.trim()
    if (!clean) return
    if (scope === 'task' && selectedTaskIds.length === 0) {
      showNotice('Selecione ao menos uma tarefa na lista para exibir este campo.')
      return
    }
    setSavingField(true)
    try {
      const created = await createCustomFieldDef({
        name: clean,
        description: description.trim(),
        default_value: defaultValue.trim(),
        type,
        scope,
        list_id: scope === 'list' ? (selectedListId || fallbackListId) : undefined,
        target_task_ids: scope === 'task' ? selectedTaskIds : [],
        cover_image: coverImage,
        is_required: isRequired,
        options: type === 'select' ? selectOptions : [],
      })
      if (created) {
        onFieldCreated?.(created)
        setName('')
        setDescription('')
        setDefaultValue('')
        setIsRequired(false)
        showNotice(`Campo "${created.name}" criado e sincronizado com a equipe.`)
      }
    } finally {
      setSavingField(false)
    }
  }

  // =========================================================================
  // ABA 2: MODELOS DE CAMPOS INDIVIDUAIS
  // =========================================================================
  const [modelTargetScope, setModelTargetScope] = useState<'list' | 'task' | 'template'>('list')
  const [modelListId, setModelListId] = useState(fallbackListId)
  const [modelTaskIds, setModelTaskIds] = useState<string[]>(currentTaskId ? [currentTaskId] : [])
  const [applyingModelId, setApplyingModelId] = useState<string | null>(null)

  const handleApplyFieldTemplate = async (tpl: (typeof INDIVIDUAL_FIELD_TEMPLATES)[number]) => {
    if (modelTargetScope === 'task' && modelTaskIds.length === 0) {
      showNotice('Marque ao menos uma tarefa antes de aplicar um modelo por tarefa.')
      return
    }
    setApplyingModelId(tpl.id)
    try {
      const created = await createCustomFieldDef({
        name: tpl.template.name,
        type: tpl.template.type,
        description: tpl.template.description,
        options: tpl.template.options || [],
        is_required: Boolean(tpl.template.is_required),
        cover_image: tpl.cover_image,
        scope: modelTargetScope,
        list_id: modelTargetScope === 'list' ? (modelListId || fallbackListId) : undefined,
        target_task_ids: modelTargetScope === 'task' ? modelTaskIds : [],
      })
      if (created) {
        onFieldCreated?.(created)
        showNotice(`Modelo "${created.name}" aplicado e sincronizado!`)
      }
    } finally {
      setApplyingModelId(null)
    }
  }

  const handleLoadModelInBuilder = (tpl: (typeof INDIVIDUAL_FIELD_TEMPLATES)[number]) => {
    setName(tpl.template.name)
    setDescription(tpl.template.description || '')
    setType(tpl.template.type)
    setIsRequired(Boolean(tpl.template.is_required))
    setCoverImage(tpl.cover_image)
    if (tpl.template.options && tpl.template.options.length > 0) {
      setSelectOptions(
        tpl.template.options.map((o) => ({ label: o.label, color: o.color || '#0066FF' }))
      )
    }
    setActiveTab('criar')
  }

  // =========================================================================
  // ABA 3: GRUPOS DE CAMPOS MODELOS (CRUD + APLICAR COM ESCOPO)
  // =========================================================================
  const allGroups = useMemo(
    () => [...customFieldGroups, ...SYSTEM_GROUP_TEMPLATES],
    [customFieldGroups]
  )
  const [groupApplyModal, setGroupApplyModal] = useState<CustomFieldGroup | null>(null)
  const [groupApplyScope, setGroupApplyScope] = useState<'list' | 'task' | 'template'>('list')
  const [groupApplyListId, setGroupApplyListId] = useState(fallbackListId)
  const [groupApplyTaskIds, setGroupApplyTaskIds] = useState<string[]>(
    currentTaskId ? [currentTaskId] : []
  )
  const [applyingGroup, setApplyingGroup] = useState(false)

  // Builder/Editor de grupo modelo
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [groupFormName, setGroupFormName] = useState('')
  const [groupFormDesc, setGroupFormDesc] = useState('')
  const [groupFormCover, setGroupFormCover] = useState(COVER_GALLERY[1].url)
  const [groupFormFields, setGroupFormFields] = useState<CustomFieldGroupFieldTemplate[]>([
    { name: 'Observações Gerais', type: 'textarea', description: 'Contexto rápido da etapa' },
  ])
  const [newGfName, setNewGfName] = useState('')
  const [newGfType, setNewGfType] = useState<CustomFieldType>('text')
  const [savingGroup, setSavingGroup] = useState(false)
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null)

  const openNewGroupBuilder = () => {
    setEditingGroupId(null)
    setGroupFormName('')
    setGroupFormDesc('')
    setGroupFormCover(COVER_GALLERY[1].url)
    setGroupFormFields([{ name: 'Link de Referência', type: 'url' }])
    setIsGroupFormOpen(true)
  }

  const openEditGroupBuilder = (grp: CustomFieldGroup) => {
    setEditingGroupId(grp.is_system_template ? null : grp.id)
    setGroupFormName(grp.is_system_template ? `${grp.name} (Cópia)` : grp.name)
    setGroupFormDesc(grp.description)
    setGroupFormCover(grp.cover_image || COVER_GALLERY[1].url)
    setGroupFormFields([...grp.fields])
    setIsGroupFormOpen(true)
  }

  const handleSaveGroup = async () => {
    if (!groupFormName.trim() || groupFormFields.length === 0) return
    setSavingGroup(true)
    try {
      if (editingGroupId) {
        await updateCustomFieldGroup(editingGroupId, {
          name: groupFormName.trim(),
          description: groupFormDesc.trim(),
          cover_image: groupFormCover,
          fields: groupFormFields,
        })
        showNotice('Grupo de campos atualizado no banco!')
      } else {
        await createCustomFieldGroup({
          name: groupFormName.trim(),
          description: groupFormDesc.trim(),
          cover_image: groupFormCover,
          fields: groupFormFields,
        })
        showNotice('Novo grupo de campos modelo salvo na organização!')
      }
      setIsGroupFormOpen(false)
    } finally {
      setSavingGroup(false)
    }
  }

  const handleApplyGroupConfirm = async () => {
    if (!groupApplyModal) return
    if (groupApplyScope === 'task' && groupApplyTaskIds.length === 0) {
      showNotice('Selecione ao menos uma tarefa para aplicar o grupo.')
      return
    }
    setApplyingGroup(true)
    try {
      const createdList = await applyCustomFieldGroup({
        groupId: groupApplyModal.is_system_template ? undefined : groupApplyModal.id,
        fields: groupApplyModal.fields,
        scope: groupApplyScope,
        listId: groupApplyScope === 'list' ? (groupApplyListId || fallbackListId) : undefined,
        targetTaskIds: groupApplyScope === 'task' ? groupApplyTaskIds : [],
      })
      if (createdList.length > 0) {
        onFieldCreated?.(createdList[0])
      }
      showNotice(
        `Grupo "${groupApplyModal.name}" aplicado (${createdList.length} campos sincronizados).`
      )
      setGroupApplyModal(null)
    } finally {
      setApplyingGroup(false)
    }
  }

  // =========================================================================
  // ABA 4: CAMPOS ATIVOS & EDIÇÃO DE VISIBILIDADE POR TAREFA
  // =========================================================================
  const [activeSearch, setActiveSearch] = useState('')
  const [editingDef, setEditingDef] = useState<CustomFieldDefinition | null>(null)
  const [editDefName, setEditDefName] = useState('')
  const [editDefDesc, setEditDefDesc] = useState('')
  const [editDefRequired, setEditDefRequired] = useState(false)
  const [editDefScope, setEditDefScope] = useState<'list' | 'task' | 'template'>('list')
  const [editDefListId, setEditDefListId] = useState(fallbackListId)
  const [editDefTaskIds, setEditDefTaskIds] = useState<string[]>([])
  const [savingEditDef, setSavingEditDef] = useState(false)
  const [confirmDeleteDefId, setConfirmDeleteDefId] = useState<string | null>(null)

  const filteredActiveDefs = useMemo(() => {
    const q = activeSearch.trim().toLowerCase()
    if (!q) return customFieldDefs
    return customFieldDefs.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.description || '').toLowerCase().includes(q)
    )
  }, [customFieldDefs, activeSearch])

  const openEditFieldDef = (def: CustomFieldDefinition) => {
    setEditingDef(def)
    setEditDefName(def.name)
    setEditDefDesc(def.description || '')
    setEditDefRequired(Boolean(def.is_required))
    setEditDefScope(
      def.scope === 'task' || def.scope === 'template' ? def.scope : 'list'
    )
    setEditDefListId(def.list_id || fallbackListId)
    setEditDefTaskIds(Array.isArray(def.target_task_ids) ? def.target_task_ids : [])
  }

  const handleSaveEditFieldDef = async () => {
    if (!editingDef || !editDefName.trim()) return
    if (editDefScope === 'task' && editDefTaskIds.length === 0) {
      showNotice('Marque ao menos uma tarefa quando o escopo for por tarefa.')
      return
    }
    setSavingEditDef(true)
    try {
      await updateCustomFieldDef(editingDef.id, {
        name: editDefName.trim(),
        description: editDefDesc.trim(),
        is_required: editDefRequired,
        scope: editDefScope,
        list_id: editDefScope === 'list' ? (editDefListId || fallbackListId) : undefined,
        target_task_ids: editDefScope === 'task' ? editDefTaskIds : [],
      })
      showNotice(`Configuração de "${editDefName.trim()}" salva para toda a equipe.`)
      setEditingDef(null)
    } finally {
      setSavingEditDef(false)
    }
  }

  const sidebarItems: {
    id: StudioTab
    label: string
    desc: string
    icon: React.ElementType
    badge?: number
  }[] = [
    {
      id: 'criar',
      label: 'Criar Campo',
      desc: 'Tipos, opções e tarefas',
      icon: Plus,
    },
    {
      id: 'modelos',
      label: 'Modelos Prontos',
      desc: 'Cards visuais individuais',
      icon: LayoutTemplate,
      badge: INDIVIDUAL_FIELD_TEMPLATES.length,
    },
    {
      id: 'grupos',
      label: 'Grupos Modelos',
      desc: 'Pacotes e grupos salvos',
      icon: FolderKanban,
      badge: allGroups.length,
    },
    {
      id: 'ativos',
      label: 'Campos Ativos',
      desc: 'Visibilidade e gestão',
      icon: ListChecks,
      badge: customFieldDefs.length,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!w-[94vw] !max-w-[1140px] h-[88vh] max-h-[840px] flex flex-col md:flex-row overflow-hidden p-0 gap-0 border border-border/80 bg-popover shadow-2xl"
      >
        <DialogTitle className="sr-only">Configurações Avançadas de Campos Personalizados</DialogTitle>

        {/* MENU LATERAL ESQUERDO */}
        <aside className="w-full md:w-[270px] shrink-0 border-b md:border-b-0 md:border-r border-border/80 bg-muted/20 flex flex-col">
          {/* Topo visual com imagem menor */}
          <div className="relative h-24 w-full overflow-hidden border-b border-border/80 shrink-0">
            <img
              src="/images/custom-field-banner.jpg"
              alt="Estúdio de Campos Personalizados"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />
            <div className="absolute bottom-2.5 left-3.5 right-3.5">
              <span className="inline-flex items-center gap-1 rounded bg-[#0066FF] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-white">
                <SlidersHorizontal className="h-2.5 w-2.5" />
                Estúdio de Campos
              </span>
              <p className="mt-1 text-[13px] font-bold leading-tight text-white">
                Configurações Avançadas
              </p>
            </div>
          </div>

          {/* Navegação lateral */}
          <nav className="flex md:flex-col gap-1 p-2.5 overflow-x-auto md:overflow-visible flex-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const active = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left transition-all shrink-0 md:shrink cursor-pointer ${
                    active
                      ? 'bg-[#0066FF] text-white shadow-sm'
                      : 'text-foreground/80 hover:bg-muted/70 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-muted-foreground'}`} />
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold leading-tight truncate">
                        {item.label}
                      </p>
                      <p
                        className={`hidden md:block text-[10.5px] truncate ${
                          active ? 'text-white/80' : 'text-muted-foreground'
                        }`}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  {typeof item.badge === 'number' && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Rodapé lateral: status de sincronização */}
          <div className="hidden md:block border-t border-border/80 p-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Sincronização em Tempo Real
            </div>
            <p className="mt-1 leading-relaxed text-[10.5px]">
              Campos, valores e visibilidade são espelhados imediatamente para todos os responsáveis da tarefa.
            </p>
          </div>
        </aside>

        {/* CONTEÚDO PRINCIPAL DIREITO */}
        <div className="flex flex-1 flex-col min-w-0 min-h-0 bg-popover">
          {/* Header superior */}
          <header className="flex items-center justify-between border-b border-border/80 px-5 py-3.5 shrink-0">
            <div>
              <h2 className="text-[15px] font-bold text-foreground">
                {activeTab === 'criar' && 'Criar & Configurar Campo Personalizado'}
                {activeTab === 'modelos' && 'Modelos Prontos de Campos'}
                {activeTab === 'grupos' && 'Grupos de Campos Modelos'}
                {activeTab === 'ativos' && 'Campos Ativos & Visibilidade por Tarefa'}
              </h2>
              <p className="text-[11.5px] text-muted-foreground">
                {activeTab === 'criar' &&
                  'Defina tipo, opções coloridas, capa visual e em quais tarefas o campo aparecerá.'}
                {activeTab === 'modelos' &&
                  'Biblioteca visual de campos individuais para aplicar em toda a lista ou em tarefas específicas.'}
                {activeTab === 'grupos' &&
                  'Aplique pacotes completos de uma só vez ou crie grupos personalizados para sua equipe.'}
                {activeTab === 'ativos' &&
                  'Gerencie campos já existentes, altere a lista de tarefas exibidas ou remova campos.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {feedbackMsg && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-500">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {feedbackMsg}
                </span>
              )}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border/80 text-muted-foreground hover:bg-muted/60 hover:text-foreground cursor-pointer"
                title="Fechar configurações"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Corpo scrollável */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* =========================================================== */}
            {/* ABA 1: CRIAR CAMPO */}
            {/* =========================================================== */}
            {activeTab === 'criar' && (
              <div className="space-y-5 max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[11.5px] font-semibold text-foreground">
                      Nome do campo
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Link de Criativos, Verba Aprovada, Ambiente..."
                      className="h-9 text-[12.5px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11.5px] font-semibold text-foreground">
                      Valor padrão inicial (opcional)
                    </label>
                    <Input
                      value={defaultValue}
                      onChange={(e) => setDefaultValue(e.target.value)}
                      placeholder="Ex: Pendente, https://..."
                      className="h-9 text-[12.5px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-start">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[11.5px] font-semibold text-foreground">
                      Descrição auxiliar (dica para os responsáveis)
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Explique rapidamente o que a equipe deve preencher neste campo..."
                      className="min-h-[60px] text-[12px]"
                    />
                  </div>
                  <div className="space-y-2 rounded-lg border border-border/80 bg-muted/20 p-3">
                    <label className="text-[11.5px] font-semibold text-foreground">
                      Obrigatoriedade
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsRequired((p) => !p)}
                      className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-[12px] font-medium cursor-pointer transition-colors ${
                        isRequired
                          ? 'border-[#0066FF] bg-[#0066FF]/10 text-foreground'
                          : 'border-border/80 bg-background/60 text-muted-foreground'
                      }`}
                    >
                      <span>Campo obrigatório</span>
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded border ${
                          isRequired
                            ? 'border-[#0066FF] bg-[#0066FF] text-white'
                            : 'border-muted-foreground/40'
                        }`}
                      >
                        {isRequired && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Tipo do campo */}
                <div className="space-y-2">
                  <label className="text-[11.5px] font-semibold text-foreground">
                    Tipo do campo
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {FIELD_TYPES_META.map((item) => {
                      const Icon = item.icon
                      const active = type === item.type
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => setType(item.type)}
                          className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
                            active
                              ? 'border-[#0066FF] bg-[#0066FF]/10'
                              : 'border-border/80 bg-muted/15 hover:border-foreground/30 hover:bg-muted/35'
                          }`}
                        >
                          <div
                            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                              active
                                ? 'bg-[#0066FF] text-white'
                                : 'bg-muted/80 text-muted-foreground'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-foreground leading-tight">
                              {item.label}
                            </p>
                            <p className="mt-0.5 text-[10.5px] text-muted-foreground leading-snug">
                              {item.hint}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Opções coloridas para select */}
                {type === 'select' && (
                  <div className="space-y-2.5 rounded-lg border border-border/80 bg-muted/20 p-3.5">
                    <label className="text-[11.5px] font-semibold text-foreground">
                      Opções de seleção e etiquetas
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {selectOptions.map((opt, idx) => (
                        <span
                          key={`${opt.label}-${idx}`}
                          className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium"
                          style={{
                            borderColor: `${opt.color}55`,
                            backgroundColor: `${opt.color}18`,
                            color: opt.color,
                          }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: opt.color }}
                          />
                          {opt.label}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectOptions((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="ml-0.5 opacity-70 hover:opacity-100 cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Input
                        value={newOptLabel}
                        onChange={(e) => setNewOptLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddSelectOpt()
                          }
                        }}
                        placeholder="Nova opção..."
                        className="h-8 flex-1 min-w-[160px] text-[12px]"
                      />
                      <div className="flex items-center gap-1">
                        {OPTION_PALETTE.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewOptColor(c)}
                            className={`h-5 w-5 rounded-full cursor-pointer transition-transform ${
                              newOptColor === c ? 'scale-110 ring-2 ring-white/80' : 'opacity-70'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAddSelectOpt}
                        className="h-8 text-[11.5px]"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Adicionar opção
                      </Button>
                    </div>
                  </div>
                )}

                {/* Capa visual do campo/modelo */}
                <div className="space-y-2">
                  <label className="text-[11.5px] font-semibold text-foreground">
                    Arte de capa no catálogo (opcional)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {COVER_GALLERY.map((c) => {
                      const active = coverImage === c.url
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCoverImage(c.url)}
                          className={`group relative overflow-hidden rounded-lg border text-left transition-all cursor-pointer ${
                            active
                              ? 'border-[#0066FF] ring-2 ring-[#0066FF]/40'
                              : 'border-border/80 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={c.url}
                            alt={c.label}
                            className="h-14 w-full object-cover"
                          />
                          <div className="bg-background/90 px-2 py-1 text-[10px] font-medium truncate text-foreground">
                            {c.label}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Alcance & Seleção Real de Tarefas */}
                <ScopeAndTaskSelector
                  scope={scope}
                  onScopeChange={setScope}
                  selectedListId={selectedListId}
                  onListIdChange={setSelectedListId}
                  selectedTaskIds={selectedTaskIds}
                  onTaskIdsChange={setSelectedTaskIds}
                  taskLists={taskLists}
                  allTasks={tasks}
                  currentTaskId={currentTaskId}
                  currentListId={currentListId}
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={handleSaveNewField}
                    disabled={!name.trim() || savingField}
                    className="h-9 bg-[#0066FF] text-white hover:bg-[#0066FF]/90 text-[12.5px] font-semibold px-5"
                  >
                    {savingField ? 'Salvando...' : 'Criar e Sincronizar Campo'}
                  </Button>
                </div>
              </div>
            )}

            {/* =========================================================== */}
            {/* ABA 2: MODELOS DE CAMPOS INDIVIDUAIS (CARDS COM IMAGENS) */}
            {/* =========================================================== */}
            {activeTab === 'modelos' && (
              <div className="space-y-5">
                <ScopeAndTaskSelector
                  scope={modelTargetScope}
                  onScopeChange={setModelTargetScope}
                  selectedListId={modelListId}
                  onListIdChange={setModelListId}
                  selectedTaskIds={modelTaskIds}
                  onTaskIdsChange={setModelTaskIds}
                  taskLists={taskLists}
                  allTasks={tasks}
                  currentTaskId={currentTaskId}
                  currentListId={currentListId}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {INDIVIDUAL_FIELD_TEMPLATES.map((tpl) => {
                    const typeMeta =
                      FIELD_TYPES_META.find((m) => m.type === tpl.template.type) ||
                      FIELD_TYPES_META[0]
                    const TypeIcon = typeMeta.icon
                    const isApplying = applyingModelId === tpl.id
                    return (
                      <div
                        key={tpl.id}
                        className="group flex flex-col overflow-hidden rounded-xl border border-border/80 bg-muted/15 hover:border-[#0066FF]/60 transition-all"
                      >
                        {/* Imagem do card no topo */}
                        <div className="relative h-28 w-full overflow-hidden">
                          <img
                            src={tpl.cover_image}
                            alt={tpl.template.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                          <span className="absolute top-2.5 left-2.5 rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-xs">
                            {tpl.category}
                          </span>
                          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 rounded bg-white/15 px-2 py-0.5 text-[10.5px] font-medium text-white backdrop-blur-xs">
                              <TypeIcon className="h-3 w-3" />
                              {typeMeta.label}
                            </span>
                            {tpl.template.is_required && (
                              <span className="rounded bg-[#0066FF] px-1.5 py-0.5 text-[9.5px] font-bold text-white">
                                Obrigatório
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Corpo do card */}
                        <div className="flex flex-1 flex-col justify-between p-3.5 space-y-3">
                          <div>
                            <h3 className="text-[13.5px] font-bold text-foreground">
                              {tpl.template.name}
                            </h3>
                            <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                              {tpl.template.description}
                            </p>
                            {tpl.template.options && tpl.template.options.length > 0 && (
                              <div className="mt-2.5 flex flex-wrap gap-1">
                                {tpl.template.options.map((opt) => (
                                  <span
                                    key={opt.label}
                                    className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                                    style={{
                                      backgroundColor: `${opt.color || '#0066FF'}20`,
                                      color: opt.color || '#0066FF',
                                    }}
                                  >
                                    {opt.label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              type="button"
                              size="sm"
                              disabled={isApplying}
                              onClick={() => handleApplyFieldTemplate(tpl)}
                              className="h-8 flex-1 bg-[#0066FF] text-white hover:bg-[#0066FF]/90 text-[11.5px] font-semibold"
                            >
                              {isApplying ? 'Aplicando...' : 'Aplicar Agora'}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleLoadModelInBuilder(tpl)}
                              className="h-8 text-[11.5px]"
                              title="Abrir no editor para customizar antes de criar"
                            >
                              Personalizar
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* =========================================================== */}
            {/* ABA 3: GRUPOS DE CAMPOS MODELOS (CARDS COM IMAGENS + CRUD) */}
            {/* =========================================================== */}
            {activeTab === 'grupos' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[12.5px] font-semibold text-foreground">
                      Pacotes prontos &amp; Grupos da Organização
                    </p>
                    <p className="text-[11.5px] text-muted-foreground">
                      Cada grupo adiciona vários campos padronizados em segundos na lista ou apenas nas tarefas selecionadas.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={openNewGroupBuilder}
                    className="h-8 bg-[#0066FF] text-white hover:bg-[#0066FF]/90 text-[12px] font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Criar Novo Grupo Modelo
                  </Button>
                </div>

                {/* Builder/Editor inline de Grupo */}
                {isGroupFormOpen && (
                  <div className="rounded-xl border border-[#0066FF]/50 bg-muted/25 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[13.5px] font-bold text-foreground">
                        {editingGroupId ? 'Editar Grupo Modelo' : 'Novo Grupo de Campos Modelo'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsGroupFormOpen(false)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-foreground">
                          Nome do grupo
                        </label>
                        <Input
                          value={groupFormName}
                          onChange={(e) => setGroupFormName(e.target.value)}
                          placeholder="Ex: Onboarding VIP Cliente"
                          className="h-8.5 text-[12px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-foreground">
                          Descrição breve
                        </label>
                        <Input
                          value={groupFormDesc}
                          onChange={(e) => setGroupFormDesc(e.target.value)}
                          placeholder="Para que tipo de entrega este pacote serve"
                          className="h-8.5 text-[12px]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-foreground">
                        Imagem do card do grupo
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {COVER_GALLERY.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setGroupFormCover(c.url)}
                            className={`overflow-hidden rounded-lg border text-left cursor-pointer ${
                              groupFormCover === c.url
                                ? 'border-[#0066FF] ring-2 ring-[#0066FF]/40'
                                : 'border-border/80 opacity-75 hover:opacity-100'
                            }`}
                          >
                            <img src={c.url} alt={c.label} className="h-12 w-full object-cover" />
                            <div className="bg-background/90 px-2 py-1 text-[10px] truncate">
                              {c.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-foreground">
                        Campos incluídos no grupo ({groupFormFields.length})
                      </label>
                      <div className="space-y-1.5">
                        {groupFormFields.map((gf, idx) => {
                          const meta = FIELD_TYPES_META.find((m) => m.type === gf.type)
                          return (
                            <div
                              key={`${gf.name}-${idx}`}
                              className="flex items-center justify-between rounded-md border border-border/80 bg-background/70 px-3 py-1.5 text-[12px]"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">{gf.name}</span>
                                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                  {meta?.label || gf.type}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setGroupFormFields((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="text-muted-foreground hover:text-red-500 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )
                        })}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Input
                          value={newGfName}
                          onChange={(e) => setNewGfName(e.target.value)}
                          placeholder="Nome do campo no grupo..."
                          className="h-8 flex-1 min-w-[160px] text-[12px]"
                        />
                        <div className="flex flex-wrap gap-1">
                          {FIELD_TYPES_META.slice(0, 6).map((m) => (
                            <button
                              key={m.type}
                              type="button"
                              onClick={() => setNewGfType(m.type)}
                              className={`rounded border px-2 py-1 text-[10.5px] cursor-pointer ${
                                newGfType === m.type
                                  ? 'border-[#0066FF] bg-[#0066FF]/15 text-foreground font-semibold'
                                  : 'border-border/80 text-muted-foreground'
                              }`}
                            >
                              {m.label.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (!newGfName.trim()) return
                            setGroupFormFields((prev) => [
                              ...prev,
                              { name: newGfName.trim(), type: newGfType },
                            ])
                            setNewGfName('')
                          }}
                          className="h-8 text-[11.5px]"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Incluir campo
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsGroupFormOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={!groupFormName.trim() || groupFormFields.length === 0 || savingGroup}
                        onClick={handleSaveGroup}
                        className="bg-[#0066FF] text-white hover:bg-[#0066FF]/90"
                      >
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                        {savingGroup ? 'Salvando...' : 'Salvar Grupo Modelo'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Modal/Painel inline de Aplicação de Grupo com Alcance (Lista vs Tarefas) */}
                {groupApplyModal && (
                  <div className="rounded-xl border border-[#0066FF] bg-background/95 p-4 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={groupApplyModal.cover_image}
                          alt={groupApplyModal.name}
                          className="h-10 w-14 rounded-md object-cover border border-border/80"
                        />
                        <div>
                          <h3 className="text-[13.5px] font-bold text-foreground">
                            Aplicar Grupo: {groupApplyModal.name}
                          </h3>
                          <p className="text-[11px] text-muted-foreground">
                            Serão adicionados {groupApplyModal.fields.length} campos sincronizados com a equipe.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGroupApplyModal(null)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <ScopeAndTaskSelector
                      scope={groupApplyScope}
                      onScopeChange={setGroupApplyScope}
                      selectedListId={groupApplyListId}
                      onListIdChange={setGroupApplyListId}
                      selectedTaskIds={groupApplyTaskIds}
                      onTaskIdsChange={setGroupApplyTaskIds}
                      taskLists={taskLists}
                      allTasks={tasks}
                      currentTaskId={currentTaskId}
                      currentListId={currentListId}
                    />

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setGroupApplyModal(null)}
                      >
                        Voltar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={applyingGroup}
                        onClick={handleApplyGroupConfirm}
                        className="bg-[#0066FF] text-white hover:bg-[#0066FF]/90 font-semibold"
                      >
                        {applyingGroup ? 'Aplicando grupo...' : 'Confirmar e Aplicar Grupo'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Grid de cards de Grupos Modelos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allGroups.map((grp) => (
                    <div
                      key={grp.id}
                      className="group flex flex-col overflow-hidden rounded-xl border border-border/80 bg-muted/15 hover:border-[#0066FF]/60 transition-all"
                    >
                      <div className="relative h-32 w-full overflow-hidden">
                        <img
                          src={grp.cover_image || '/images/tpl-traffic.jpg'}
                          alt={grp.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between">
                          <span className="rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-xs">
                            {grp.is_system_template ? 'Modelo Oficial CoyDash' : 'Grupo da Equipe'}
                          </span>
                          <span className="rounded-full bg-[#0066FF] px-2 py-0.5 text-[10px] font-bold text-white">
                            {grp.fields.length} campos
                          </span>
                        </div>
                        <div className="absolute bottom-2.5 left-3 right-3">
                          <h3 className="text-[14px] font-bold text-white leading-tight">
                            {grp.name}
                          </h3>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-3.5 space-y-3">
                        <div className="space-y-2">
                          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                            {grp.description}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {grp.fields.map((f, idx) => (
                              <span
                                key={`${f.name}-${idx}`}
                                className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background/70 px-2 py-0.5 text-[10.5px] font-medium text-foreground"
                              >
                                <Sparkles className="h-2.5 w-2.5 text-[#0066FF]" />
                                {f.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setGroupApplyModal(grp)}
                            className="h-8 flex-1 bg-[#0066FF] text-white hover:bg-[#0066FF]/90 text-[11.5px] font-semibold"
                          >
                            Aplicar Grupo
                            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openEditGroupBuilder(grp)}
                            className="h-8 text-[11.5px]"
                            title={grp.is_system_template ? 'Duplicar e editar modelo' : 'Editar grupo'}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {!grp.is_system_template && (
                            confirmDeleteGroupId === grp.id ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    await deleteCustomFieldGroup(grp.id)
                                    setConfirmDeleteGroupId(null)
                                    showNotice('Grupo removido.')
                                  }}
                                  className="h-8 text-[11px]"
                                >
                                  Confirmar
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setConfirmDeleteGroupId(null)}
                                  className="h-8 text-[11px]"
                                >
                                  Não
                                </Button>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmDeleteGroupId(grp.id)}
                                className="h-8 text-muted-foreground hover:text-red-500"
                                title="Excluir grupo"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =========================================================== */}
            {/* ABA 4: CAMPOS ATIVOS & EDIÇÃO DE VISIBILIDADE POR TAREFA */}
            {/* =========================================================== */}
            {activeTab === 'ativos' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="relative flex-1 min-w-[220px] max-w-md">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={activeSearch}
                      onChange={(e) => setActiveSearch(e.target.value)}
                      placeholder="Filtrar campos ativos pelo nome..."
                      className="h-8.5 pl-8 text-[12px]"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setActiveTab('criar')}
                    className="h-8 bg-[#0066FF] text-white hover:bg-[#0066FF]/90 text-[12px]"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Novo Campo
                  </Button>
                </div>

                {/* Painel de edição do campo selecionado */}
                {editingDef && (
                  <div className="rounded-xl border border-[#0066FF] bg-muted/25 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-[13.5px] font-bold text-foreground">
                          Configurar Alcance e Detalhes: {editingDef.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Altere exatamente em quais tarefas ou listas este campo fica visível para todos os responsáveis.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingDef(null)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold">Nome</label>
                        <Input
                          value={editDefName}
                          onChange={(e) => setEditDefName(e.target.value)}
                          className="h-8.5 text-[12px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold">Descrição auxiliar</label>
                        <Input
                          value={editDefDesc}
                          onChange={(e) => setEditDefDesc(e.target.value)}
                          placeholder="Instrução rápida..."
                          className="h-8.5 text-[12px]"
                        />
                      </div>
                    </div>

                    <ScopeAndTaskSelector
                      scope={editDefScope}
                      onScopeChange={setEditDefScope}
                      selectedListId={editDefListId}
                      onListIdChange={setEditDefListId}
                      selectedTaskIds={editDefTaskIds}
                      onTaskIdsChange={setEditDefTaskIds}
                      taskLists={taskLists}
                      allTasks={tasks}
                      currentTaskId={currentTaskId}
                      currentListId={currentListId}
                    />

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setEditDefRequired((p) => !p)}
                        className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[11.5px] font-medium cursor-pointer ${
                          editDefRequired
                            ? 'border-[#0066FF] bg-[#0066FF]/10 text-foreground'
                            : 'border-border/80 text-muted-foreground'
                        }`}
                      >
                        <span
                          className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                            editDefRequired ? 'border-[#0066FF] bg-[#0066FF] text-white' : 'border-muted-foreground/40'
                          }`}
                        >
                          {editDefRequired && <Check className="h-2.5 w-2.5" />}
                        </span>
                        Campo obrigatório
                      </button>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingDef(null)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={savingEditDef}
                          onClick={handleSaveEditFieldDef}
                          className="bg-[#0066FF] text-white hover:bg-[#0066FF]/90 font-semibold"
                        >
                          {savingEditDef ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {filteredActiveDefs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/80 py-10 text-center text-[12.5px] text-muted-foreground">
                    Nenhum campo personalizado cadastrado até o momento.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredActiveDefs.map((def) => {
                      const typeMeta =
                        FIELD_TYPES_META.find((m) => m.type === def.type) || FIELD_TYPES_META[0]
                      const Icon = typeMeta.icon
                      const listTitle = taskLists.find((l) => l.id === def.list_id)?.name
                      const taskCount = Array.isArray(def.target_task_ids)
                        ? def.target_task_ids.length
                        : 0

                      return (
                        <div
                          key={def.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/15 px-3.5 py-2.5 hover:border-foreground/25 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[13px] font-semibold text-foreground truncate">
                                  {def.name}
                                </span>
                                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  {typeMeta.label}
                                </span>
                                {def.is_required && (
                                  <span className="rounded bg-[#0066FF]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#0066FF]">
                                    Obrigatório
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
                                {def.scope === 'template' && 'Visível em todas as listas (Global)'}
                                {def.scope === 'list' &&
                                  `Visível na lista: ${listTitle || 'Lista vinculada'}`}
                                {def.scope === 'task' &&
                                  (taskCount > 0
                                    ? `Restrito a ${taskCount} tarefa(s) selecionada(s)`
                                    : 'Restrito por tarefa específica')}
                                {def.description ? ` — ${def.description}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openEditFieldDef(def)}
                              className="h-8 text-[11.5px]"
                            >
                              <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                              Configurar Alcance
                            </Button>

                            {confirmDeleteDefId === def.id ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    await deleteCustomFieldDef(def.id, def.name)
                                    setConfirmDeleteDefId(null)
                                    showNotice(`Campo "${def.name}" excluído.`)
                                  }}
                                  className="h-8 text-[11px]"
                                >
                                  Excluir
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setConfirmDeleteDefId(null)}
                                  className="h-8 text-[11px]"
                                >
                                  Não
                                </Button>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmDeleteDefId(def.id)}
                                className="h-8 text-muted-foreground hover:text-red-500"
                                title="Excluir campo permanentemente"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
