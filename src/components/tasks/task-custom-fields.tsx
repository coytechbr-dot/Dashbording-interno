'use client'

import React, { useMemo, useState } from 'react'
import {
  Type,
  Plus,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Trash2,
  Check,
  Eye,
  EyeOff,
  Layers,
  Globe,
  FileText,
  SlidersHorizontal,
  X,
  Calendar as CalendarIcon,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CustomFieldsStudioDialog, type StudioTab } from './custom-fields-studio-dialog'
import { FIELD_TYPES_META, OPTION_PALETTE } from './custom-fields-meta'
import { CoyAssigneePicker } from '@/components/ui/coy-assignee-picker'
import type {
  CustomFieldDefinition,
  CustomFieldType,
  TaskCustomFieldValue,
} from '@/types/coydash'

interface TaskCustomFieldsProps {
  listId?: string | null
  taskId?: string
  taskCustomFields: TaskCustomFieldValue[]
  onChange: (fields: TaskCustomFieldValue[]) => void
  customFieldDefs: CustomFieldDefinition[]
  onCreateFieldDef: (def: Partial<CustomFieldDefinition>) => Promise<CustomFieldDefinition | null>
  onDeleteFieldDef?: (defId: string, fieldName?: string) => Promise<void>
  availableMembers?: string[]
  canManageDefinitions?: boolean
}

const SCOPE_OPTIONS: {
  value: 'list' | 'task' | 'template'
  label: string
  desc: string
  icon: React.ElementType
}[] = [
  {
    value: 'list',
    label: 'Em toda a lista deste projeto',
    desc: 'Fica disponível em todas as tarefas desta lista.',
    icon: Layers,
  },
  {
    value: 'task',
    label: 'Apenas nesta tarefa',
    desc: 'Campo exclusivo salvo somente neste card.',
    icon: FileText,
  },
  {
    value: 'template',
    label: 'Global em todas as listas',
    desc: 'Aplicado como padrão na organização.',
    icon: Globe,
  },
]

export function TaskCustomFields({
  listId,
  taskId,
  taskCustomFields = [],
  onChange,
  customFieldDefs = [],
  onCreateFieldDef,
  onDeleteFieldDef,
  availableMembers = [],
  canManageDefinitions = true,
}: TaskCustomFieldsProps) {
  const [isSectionOpen, setIsSectionOpen] = useState(true)
  const [hideEmptyFields, setHideEmptyFields] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isStudioOpen, setIsStudioOpen] = useState(false)
  const [studioInitialTab, setStudioInitialTab] = useState<StudioTab>('criar')
  const [openRowDropdownId, setOpenRowDropdownId] = useState<string | null>(null)
  const [openScopeDropdown, setOpenScopeDropdown] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form do novo campo
  const [fieldName, setFieldName] = useState('')
  const [fieldType, setFieldType] = useState<CustomFieldType>('text')
  const [fieldScope, setFieldScope] = useState<'task' | 'list' | 'template'>('list')
  const [selectOptions, setSelectOptions] = useState<{ label: string; color: string }[]>([
    { label: 'Pendente', color: '#E8C14A' },
    { label: 'Aprovado', color: '#2F9E5A' },
  ])
  const [newOptionLabel, setNewOptionLabel] = useState('')
  const [newOptionColor, setNewOptionColor] = useState('#0066FF')
  const [isCreatingField, setIsCreatingField] = useState(false)
  const [formError, setFormError] = useState('')

  // Consolida definições reais filtradas pelo contexto (lista atual / globais / target_task_ids / valores desta tarefa)
  const relevantDefs: CustomFieldDefinition[] = useMemo(() => {
    const list: CustomFieldDefinition[] = []

    for (const def of customFieldDefs) {
      const hasTaskTarget =
        Boolean(taskId) &&
        Array.isArray(def.target_task_ids) &&
        def.target_task_ids.includes(taskId as string)

      const hasLocalValue = taskCustomFields.some(
        (f) => f.field_id === def.id || f.field_name?.toLowerCase() === def.name.toLowerCase()
      )

      const matchesList =
        def.scope === 'template' ||
        (def.scope === 'list' && (!def.list_id || !listId || def.list_id === listId)) ||
        (def.scope === 'task' && (hasTaskTarget || hasLocalValue))

      if (matchesList && !list.some((d) => d.id === def.id)) {
        list.push(def)
      }
    }

    for (const item of taskCustomFields) {
      if (
        !list.some(
          (d) =>
            d.id === item.field_id ||
            (item.field_name && d.name.toLowerCase() === item.field_name.toLowerCase())
        )
      ) {
        list.push({
          id: item.field_id || `local_${item.field_name}`,
          name: item.field_name || 'Campo personalizado',
          type: item.field_type || 'text',
          options: item.options || [],
          scope: 'task',
        })
      }
    }

    return list
  }, [customFieldDefs, listId, taskId, taskCustomFields])

  const getFieldValue = (def: CustomFieldDefinition) => {
    const found = taskCustomFields.find(
      (f) => f.field_id === def.id || (f.field_name && f.field_name.toLowerCase() === def.name.toLowerCase())
    )
    if (found && found.value !== undefined && found.value !== '') return found.value
    return def.default_value || undefined
  }

  const handleUpdateValue = (def: CustomFieldDefinition, newValue: unknown) => {
    const existingIndex = taskCustomFields.findIndex(
      (f) => f.field_id === def.id || (f.field_name && f.field_name.toLowerCase() === def.name.toLowerCase())
    )

    const updated = [...taskCustomFields]
    if (existingIndex >= 0) {
      updated[existingIndex] = {
        ...updated[existingIndex],
        field_id: def.id,
        field_name: def.name,
        field_type: def.type,
        options: def.options,
        value: newValue,
      }
    } else {
      updated.push({
        field_id: def.id,
        field_name: def.name,
        field_type: def.type,
        options: def.options,
        value: newValue,
      })
    }
    onChange(updated)
  }

  const isFieldEmpty = (val: unknown, type: CustomFieldType) => {
    if (val === undefined || val === null || val === '') return true
    if (type === 'checkbox') return false
    if (Array.isArray(val) && val.length === 0) return true
    return false
  }

  const handleAddSelectOption = () => {
    const trimmed = newOptionLabel.trim()
    if (!trimmed) return
    if (selectOptions.some((o) => o.label.toLowerCase() === trimmed.toLowerCase())) return
    setSelectOptions((prev) => [...prev, { label: trimmed, color: newOptionColor }])
    setNewOptionLabel('')
    const nextColorIdx = (OPTION_PALETTE.indexOf(newOptionColor) + 1) % OPTION_PALETTE.length
    setNewOptionColor(OPTION_PALETTE[nextColorIdx])
  }

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fieldName.trim()) {
      setFormError('Informe um nome para o campo.')
      return
    }
    if (fieldType === 'select' && selectOptions.length === 0) {
      setFormError('Adicione pelo menos uma opção de seleção.')
      return
    }

    setFormError('')
    setIsCreatingField(true)
    try {
      const optionsPayload = fieldType === 'select' ? selectOptions : []
      const payload: Partial<CustomFieldDefinition> = {
        name: fieldName.trim(),
        type: fieldType,
        scope: fieldScope,
        list_id: fieldScope === 'list' && listId ? listId : undefined,
        target_task_ids: fieldScope === 'task' && taskId ? [taskId] : [],
        options: optionsPayload,
      }

      const createdDef = await onCreateFieldDef(payload)
      const resolvedId = createdDef?.id || `local_${Date.now()}`

      const defObj: CustomFieldDefinition = {
        id: resolvedId,
        name: createdDef?.name || fieldName.trim(),
        type: createdDef?.type || fieldType,
        scope: createdDef?.scope || fieldScope,
        list_id: createdDef?.list_id,
        options: createdDef?.options || optionsPayload,
      }

      handleUpdateValue(defObj, fieldType === 'checkbox' ? false : '')

      setFieldName('')
      setFieldType('text')
      setFieldScope('list')
      setIsAddModalOpen(false)
    } catch (err) {
      console.error('Erro ao criar campo personalizado:', err)
      setFormError('Não foi possível criar o campo. Tente novamente.')
    } finally {
      setIsCreatingField(false)
    }
  }

  const handleRemoveField = async (def: CustomFieldDefinition) => {
    setDeletingId(def.id)
    try {
      // Remove do valor local da tarefa imediatamente
      const filteredTaskValues = taskCustomFields.filter(
        (f) => f.field_id !== def.id && f.field_name?.toLowerCase() !== def.name.toLowerCase()
      )
      onChange(filteredTaskValues)

      if (onDeleteFieldDef) {
        await onDeleteFieldDef(def.id, def.name)
      }
    } finally {
      setDeletingId(null)
    }
  }

  const emptyFieldsCount = relevantDefs.filter((def) => isFieldEmpty(getFieldValue(def), def.type)).length
  const visibleDefs = hideEmptyFields
    ? relevantDefs.filter((def) => !isFieldEmpty(getFieldValue(def), def.type))
    : relevantDefs

  const activeScopeMeta = SCOPE_OPTIONS.find((s) => s.value === fieldScope) || SCOPE_OPTIONS[0]
  const ActiveScopeIcon = activeScopeMeta.icon

  return (
    <div className="flex flex-col gap-2.5 border-t border-[var(--line2)] pt-4 mt-1">
      {/* CABEÇALHO DA SEÇÃO COM BOTÃO ADICIONAR CAMPO NO LADO ESQUERDO */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-0.5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsSectionOpen(!isSectionOpen)}
            className="flex items-center gap-1.5 text-[13px] font-bold text-[var(--fg)] hover:text-[var(--color-brand-blue)] transition-colors cursor-pointer"
          >
            {isSectionOpen ? (
              <ChevronDown className="w-4 h-4 text-[var(--ds-muted)]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[var(--ds-muted)]" />
            )}
            <span>Campos</span>
            <span className="text-[11px] font-semibold text-[var(--ds-muted)] px-1.5 py-0.5 rounded-full bg-[var(--line2)]">
              {relevantDefs.length}
            </span>
          </button>

          {/* Botão Adicionar Campo e Configurações (apenas quem gerencia campos) */}
          {canManageDefinitions && (
            <>
              <button
                type="button"
                onClick={() => {
                  setFormError('')
                  setIsAddModalOpen(true)
                }}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-[var(--bg)] border border-[var(--line2)] hover:border-[var(--color-brand-blue)] text-[11.5px] font-semibold text-[var(--fg)] hover:text-[var(--color-brand-blue)] transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                <span>Adicionar campo</span>
              </button>

              {/* Atalho direto para o Estúdio Completo de Configurações */}
              <button
                type="button"
                onClick={() => {
                  setStudioInitialTab('grupos')
                  setIsStudioOpen(true)
                }}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/35 hover:border-[var(--color-brand-blue)] text-[11.5px] font-semibold text-[var(--fg)] hover:text-[var(--color-brand-blue)] transition-all cursor-pointer"
                title="Abrir configurações avançadas, modelos e grupos de campos"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                <span>Configurar campos</span>
              </button>
            </>
          )}
        </div>

        {relevantDefs.length > 0 && emptyFieldsCount > 0 && (
          <button
            type="button"
            onClick={() => setHideEmptyFields(!hideEmptyFields)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--ds-muted)] hover:text-[var(--fg)] transition-colors px-2.5 py-1 rounded-lg hover:bg-[var(--line2)] cursor-pointer"
          >
            {hideEmptyFields ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>
              {hideEmptyFields
                ? `Mostrar ${emptyFieldsCount} vazios`
                : `Ocultar ${emptyFieldsCount} vazios`}
            </span>
          </button>
        )}
      </div>

      {/* LISTA DE CAMPOS PERSONALIZADOS */}
      {isSectionOpen && (
        <div className="flex flex-col gap-1.5">
          {visibleDefs.length === 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-[var(--bg)]/60 border border-dashed border-[var(--line2)]">
              <span className="text-[12px] text-[var(--ds-muted)]">
                {relevantDefs.length === 0
                  ? 'Nenhum campo personalizado criado ainda.'
                  : 'Todos os campos vazios estão ocultos.'}
              </span>
              {relevantDefs.length === 0 && canManageDefinitions && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStudioInitialTab('grupos')
                      setIsStudioOpen(true)
                    }}
                    className="text-[11.5px] font-semibold text-[var(--fg)] hover:text-[var(--color-brand-blue)] transition-colors cursor-pointer"
                  >
                    Configurar campos / modelos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormError('')
                      setIsAddModalOpen(true)
                    }}
                    className="text-[11.5px] font-semibold text-[var(--color-brand-blue)] hover:underline cursor-pointer"
                  >
                    + Criar primeiro campo
                  </button>
                </div>
              )}
            </div>
          ) : (
            visibleDefs.map((def) => {
              const typeMeta = FIELD_TYPES_META.find((m) => m.type === def.type)
              const IconComponent = typeMeta?.icon || Type
              const val = getFieldValue(def)
              const rowKey = def.id || def.name

              return (
                <div
                  key={rowKey}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between py-1.5 px-2.5 rounded-xl bg-[var(--bg)]/40 hover:bg-[var(--bg)] border border-transparent hover:border-[var(--line2)] transition-all gap-2"
                >
                  {/* Rótulo */}
                  <div className="flex items-center gap-2 sm:w-[210px] shrink-0 text-[12px] font-medium text-[var(--ds-muted)] group-hover:text-[var(--fg)]">
                    <div className="w-6 h-6 rounded-md bg-[var(--surface)] border border-[var(--line2)] flex items-center justify-center shrink-0">
                      <IconComponent className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                    </div>
                    <span
                      className="truncate font-medium"
                      title={def.description ? `${def.name} — ${def.description}` : def.name}
                    >
                      {def.name}
                      {def.is_required && (
                        <span className="ml-1 text-[var(--color-brand-blue)] font-bold">*</span>
                      )}
                    </span>
                  </div>

                  {/* Valor */}
                  <div className="flex-1 min-w-0">
                    {def.type === 'text' && (
                      <Input
                        value={val ?? ''}
                        onChange={(e) => handleUpdateValue(def, e.target.value)}
                        placeholder="Digite aqui..."
                        className="h-8 text-[12px] bg-[var(--surface)]/50 border-[var(--line2)]/60 hover:border-[var(--line2)] focus:border-[var(--color-brand-blue)] focus:bg-[var(--bg)] px-2.5 text-[var(--fg)] rounded-lg"
                      />
                    )}

                    {def.type === 'textarea' && (
                      <Textarea
                        value={val ?? ''}
                        onChange={(e) => handleUpdateValue(def, e.target.value)}
                        placeholder="Clique para adicionar detalhes..."
                        rows={val && String(val).length > 60 ? 2 : 1}
                        className="min-h-[32px] text-[12px] bg-[var(--surface)]/50 border-[var(--line2)]/60 hover:border-[var(--line2)] focus:border-[var(--color-brand-blue)] focus:bg-[var(--bg)] px-2.5 py-1.5 text-[var(--fg)] resize-y leading-relaxed rounded-lg"
                      />
                    )}

                    {def.type === 'number' && (
                      <Input
                        type="number"
                        value={val !== undefined && val !== null ? val : ''}
                        onChange={(e) =>
                          handleUpdateValue(def, e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="0"
                        className="h-8 text-[12px] bg-[var(--surface)]/50 border-[var(--line2)]/60 hover:border-[var(--line2)] focus:border-[var(--color-brand-blue)] focus:bg-[var(--bg)] px-2.5 text-[var(--fg)] max-w-[180px] rounded-lg"
                      />
                    )}

                    {def.type === 'url' && (
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={val ?? ''}
                          onChange={(e) => handleUpdateValue(def, e.target.value)}
                          placeholder="https://..."
                          className="h-8 text-[12px] bg-[var(--surface)]/50 border-[var(--line2)]/60 hover:border-[var(--line2)] focus:border-[var(--color-brand-blue)] focus:bg-[var(--bg)] px-2.5 text-[var(--fg)] rounded-lg"
                        />
                        {val && (
                          <a
                            href={String(val).startsWith('http') ? String(val) : `https://${val}`}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 p-1.5 rounded-lg border border-[var(--line2)] text-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/15 transition-colors"
                            title="Abrir link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}

                    {def.type === 'select' && (
                      <Popover
                        open={openRowDropdownId === `select_${rowKey}`}
                        onOpenChange={(next) =>
                          setOpenRowDropdownId(next ? `select_${rowKey}` : null)
                        }
                      >
                        <PopoverTrigger
                          render={
                            <button
                              type="button"
                              className="inline-flex items-center justify-between gap-2 min-w-[140px] h-8 px-3 rounded-lg text-[12px] font-semibold transition-all border border-[var(--line2)] bg-[var(--surface)] hover:border-[var(--color-brand-blue)] cursor-pointer"
                              style={{
                                backgroundColor: def.options?.find((o) => o.label === val)?.color
                                  ? `${def.options.find((o) => o.label === val)?.color}22`
                                  : undefined,
                                borderColor: def.options?.find((o) => o.label === val)?.color
                                  ? `${def.options.find((o) => o.label === val)?.color}55`
                                  : undefined,
                                color:
                                  def.options?.find((o) => o.label === val)?.color ||
                                  'var(--fg)',
                              }}
                            />
                          }
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            {val ? (
                              <>
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{
                                    backgroundColor:
                                      def.options?.find((o) => o.label === val)?.color ||
                                      '#0066FF',
                                  }}
                                />
                                <span>{String(val)}</span>
                              </>
                            ) : (
                              <span className="text-[var(--ds-muted)] font-normal">
                                Selecionar opção...
                              </span>
                            )}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-1.5 bg-[var(--surface)] border-[var(--line2)] text-[var(--fg)] shadow-2xl rounded-xl">
                          <div className="flex flex-col gap-1">
                            {(def.options || []).map((opt) => (
                              <button
                                key={opt.label}
                                type="button"
                                onClick={() => {
                                  handleUpdateValue(def, opt.label)
                                  setOpenRowDropdownId(null)
                                }}
                                className="flex items-center justify-between px-2.5 py-2 rounded-lg text-[12px] font-medium hover:bg-[var(--line2)]/70 transition-colors cursor-pointer"
                              >
                                <span className="flex items-center gap-2">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: opt.color || '#0066FF' }}
                                  />
                                  <span className="font-semibold">{opt.label}</span>
                                </span>
                                {val === opt.label && (
                                  <Check className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                                )}
                              </button>
                            ))}
                            {val && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateValue(def, '')
                                  setOpenRowDropdownId(null)
                                }}
                                className="text-left px-2.5 py-1.5 mt-0.5 border-t border-[var(--line2)] text-[11px] rounded-b-lg hover:bg-[var(--line2)]/50 text-[var(--ds-muted)] cursor-pointer"
                              >
                                Limpar seleção
                              </button>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}

                    {def.type === 'checkbox' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateValue(def, !Boolean(val))}
                        className={`inline-flex items-center gap-2 h-8 px-3 rounded-lg border text-[12px] font-medium transition-all cursor-pointer ${
                          Boolean(val)
                            ? 'bg-[var(--color-brand-blue)]/15 border-[var(--color-brand-blue)]/40 text-[var(--fg)]'
                            : 'bg-[var(--surface)] border-[var(--line2)] text-[var(--ds-muted)] hover:border-[var(--line)]'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            Boolean(val)
                              ? 'bg-[var(--color-brand-blue)] border-[var(--color-brand-blue)] text-[#141414]'
                              : 'border-[var(--line2)] bg-[var(--bg)]'
                          }`}
                        >
                          {Boolean(val) && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span>{Boolean(val) ? 'Marcado / Sim' : 'Desmarcado'}</span>
                      </button>
                    )}

                    {def.type === 'date' && (
                      <Popover
                        open={openRowDropdownId === `date_${rowKey}`}
                        onOpenChange={(next) =>
                          setOpenRowDropdownId(next ? `date_${rowKey}` : null)
                        }
                      >
                        <PopoverTrigger
                          render={
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 h-8 px-3 rounded-lg text-[12px] bg-[var(--surface)] border border-[var(--line2)] text-[var(--fg)] hover:border-[var(--color-brand-blue)] transition-colors cursor-pointer"
                            />
                          }
                        >
                          <CalendarIcon className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                          <span>
                            {val ? format(new Date(String(val)), 'dd/MM/yyyy') : 'Selecionar data'}
                          </span>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-[var(--surface)] border-[var(--line2)] rounded-xl shadow-2xl">
                          <Calendar
                            mode="single"
                            selected={val ? new Date(String(val)) : undefined}
                            onSelect={(d) => {
                              handleUpdateValue(def, d ? d.toISOString().split('T')[0] : '')
                              setOpenRowDropdownId(null)
                            }}
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    )}

                    {def.type === 'user' && (
                      <CoyAssigneePicker
                        value={val ? String(val) : ''}
                        multiple={false}
                        onChange={(selectedName: string) => handleUpdateValue(def, selectedName)}
                        placeholder="Selecionar membro..."
                        className="min-w-[180px] h-8"
                      />
                    )}

                    {def.type === 'file' && (
                      <Input
                        value={val ?? ''}
                        onChange={(e) => handleUpdateValue(def, e.target.value)}
                        placeholder="Link do arquivo ou Google Drive..."
                        className="h-8 text-[12px] bg-[var(--surface)]/50 border-[var(--line2)]/60 hover:border-[var(--line2)] focus:border-[var(--color-brand-blue)] focus:bg-[var(--bg)] px-2.5 text-[var(--fg)] rounded-lg"
                      />
                    )}
                  </div>

                  {/* Ação real de excluir campo */}
                  {canManageDefinitions && (
                    <button
                      type="button"
                      disabled={deletingId === def.id}
                      onClick={() => handleRemoveField(def)}
                      className="opacity-70 sm:opacity-0 group-hover:opacity-100 p-1.5 text-[var(--ds-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer shrink-0"
                      title="Excluir campo permanentemente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* POPUP MODERNO DE CRIAÇÃO DE CAMPO COM BANNER VISUAL NO TOPO */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent
          showCloseButton={false}
          className="bg-[var(--surface)] text-[var(--fg)] border-[var(--line2)] !w-[94vw] !max-w-[560px] p-0 overflow-hidden rounded-[20px] shadow-2xl gap-0"
        >
          <DialogTitle className="sr-only">Criar Campo Personalizado</DialogTitle>

          {/* BANNER VISUAL COMPACTO NO TOPO (~104px) */}
          <div className="relative h-[104px] w-full overflow-hidden bg-[#0a1328] shrink-0">
            <img
              src="/images/custom-field-banner.jpg"
              alt="Campos Personalizados CoyDash"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a1020]/90 via-[#0a1020]/45 to-transparent" />

            <div className="absolute inset-0 px-6 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[var(--color-brand-blue)]/20 border border-[var(--color-brand-blue)]/40 flex items-center justify-center">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                  </div>
                  <span className="text-[17px] font-bold tracking-tight text-white">
                    Novo Campo Personalizado
                  </span>
                </div>
                <p className="text-[12px] text-white/75 max-w-[330px]">
                  Configure tipo, opções e escopo com salvamento real no banco de dados.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false)
                    setStudioInitialTab('grupos')
                    setIsStudioOpen(true)
                  }}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-black/55 hover:bg-[#0066FF] border border-white/20 hover:border-[#0066FF] text-white hover:text-[#141414] text-[11px] font-semibold transition-all cursor-pointer"
                  title="Ir para configurações avançadas de campos e modelos"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Configurações de campos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 border border-white/15 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* CORPO DO FORMULÁRIO */}
          <form onSubmit={handleCreateField} className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
            {formError && (
              <div className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-[12px] font-medium">
                {formError}
              </div>
            )}

            {/* Nome do campo */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[var(--fg)]">
                Nome do campo
              </label>
              <Input
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="Ex: Link do Figma, Orçamento Aprovado, Categoria..."
                autoFocus
                className="h-10 text-[13px] bg-[var(--bg)] border-[var(--line2)] focus:border-[var(--color-brand-blue)] rounded-xl px-3.5"
              />
            </div>

            {/* Grade Estilizada de Tipos de Campo (substitui <select> genérico) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[var(--fg)]">
                  Escolha o tipo do campo
                </span>
                <span className="text-[11px] text-[var(--ds-muted)]">
                  9 formatos disponíveis
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FIELD_TYPES_META.map((item) => {
                  const ItemIcon = item.icon
                  const selected = fieldType === item.type
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setFieldType(item.type)}
                      className={`flex flex-col gap-1 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selected
                          ? 'bg-[var(--color-brand-blue)]/10 border-[var(--color-brand-blue)] shadow-sm'
                          : 'bg-[var(--bg)] border-[var(--line2)] hover:border-[var(--line)] hover:bg-[var(--bg)]/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            selected
                              ? 'bg-[var(--color-brand-blue)] text-white'
                              : 'bg-[var(--surface)] border border-[var(--line2)] text-[var(--ds-muted)]'
                          }`}
                        >
                          <ItemIcon className="w-3.5 h-3.5" />
                        </div>
                        {selected && (
                          <Check className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                        )}
                      </div>
                      <span className="text-[12px] font-bold text-[var(--fg)] mt-1 leading-tight">
                        {item.label}
                      </span>
                      <span className="text-[10.5px] text-[var(--ds-muted)] leading-snug line-clamp-1">
                        {item.hint}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Construtor visual de opções quando tipo = select */}
            {fieldType === 'select' && (
              <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
                <span className="text-[12px] font-semibold text-[var(--fg)]">
                  Opções da lista suspensa
                </span>

                <div className="flex flex-wrap gap-1.5">
                  {selectOptions.map((opt) => (
                    <span
                      key={opt.label}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
                      style={{
                        backgroundColor: `${opt.color}20`,
                        borderColor: `${opt.color}45`,
                        color: opt.color,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: opt.color }}
                      />
                      <span>{opt.label}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectOptions((prev) =>
                            prev.filter((item) => item.label !== opt.label)
                          )
                        }
                        className="hover:opacity-70 ml-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <div className="flex items-center gap-1">
                    {OPTION_PALETTE.slice(0, 5).map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setNewOptionColor(col)}
                        className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                          newOptionColor === col ? 'scale-125 ring-2 ring-white/60' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                  <Input
                    value={newOptionLabel}
                    onChange={(e) => setNewOptionLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddSelectOption()
                      }
                    }}
                    placeholder="Nova opção..."
                    className="h-8 text-[12px] bg-[var(--surface)] border-[var(--line2)] rounded-lg flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddSelectOption}
                    className="h-8 px-3 bg-[var(--surface)] hover:bg-[var(--line2)] border border-[var(--line2)] text-[var(--fg)] text-[11px] font-semibold rounded-lg"
                  >
                    Incluir
                  </Button>
                </div>
              </div>
            )}

            {/* Dropdown customizado de Escopo (sem <select> genérico) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-[var(--fg)]">
                Onde aplicar este campo?
              </span>
              <Popover open={openScopeDropdown} onOpenChange={setOpenScopeDropdown}>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      className="w-full h-11 px-3.5 rounded-xl bg-[var(--bg)] border border-[var(--line2)] hover:border-[var(--color-brand-blue)] flex items-center justify-between text-left transition-colors cursor-pointer"
                    />
                  }
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[var(--surface)] border border-[var(--line2)] flex items-center justify-center shrink-0">
                      <ActiveScopeIcon className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12.5px] font-semibold text-[var(--fg)] truncate">
                        {activeScopeMeta.label}
                      </span>
                      <span className="text-[10.5px] text-[var(--ds-muted)] truncate">
                        {activeScopeMeta.desc}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[var(--ds-muted)] shrink-0" />
                </PopoverTrigger>
                <PopoverContent className="w-[460px] max-w-[86vw] p-1.5 bg-[var(--surface)] border-[var(--line2)] rounded-xl shadow-2xl">
                  <div className="flex flex-col gap-1">
                    {SCOPE_OPTIONS.map((opt) => {
                      const OptIcon = opt.icon
                      const isActive = fieldScope === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setFieldScope(opt.value)
                            setOpenScopeDropdown(false)
                          }}
                          className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-[var(--color-brand-blue)]/12 border border-[var(--color-brand-blue)]/30'
                              : 'hover:bg-[var(--line2)]/60 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[var(--bg)] border border-[var(--line2)] flex items-center justify-center shrink-0">
                              <OptIcon className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[12.5px] font-semibold text-[var(--fg)]">
                                {opt.label}
                              </span>
                              <span className="text-[11px] text-[var(--ds-muted)]">
                                {opt.desc}
                              </span>
                            </div>
                          </div>
                          {isActive && (
                            <Check className="w-4 h-4 text-[var(--color-brand-blue)] shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Atalho para o Pop-up Maior com Menu Lateral, Modelos e Lista de Tarefas */}
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false)
                setStudioInitialTab('criar')
                setIsStudioOpen(true)
              }}
              className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line2)] hover:border-[var(--color-brand-blue)] transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-brand-blue)]/15 border border-[var(--color-brand-blue)]/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-[var(--fg)] group-hover:text-[var(--color-brand-blue)] transition-colors">
                    Configurações avançadas de campos
                  </p>
                  <p className="text-[10.5px] text-[var(--ds-muted)] truncate">
                    Modelos prontos, grupos de campos e seleção exata de tarefas.
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[var(--ds-muted)] group-hover:text-[var(--color-brand-blue)] shrink-0" />
            </button>

            {/* Ações do Modal */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--line2)]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="h-9 px-4 rounded-full bg-[var(--bg)] border-[var(--line2)] text-[12px] font-semibold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreatingField || !fieldName.trim()}
                className="h-9 px-5 rounded-full bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue-hover)] text-white text-[12px] font-bold"
              >
                {isCreatingField ? 'Criando campo...' : 'Criar Campo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* POPUP MAIOR COM MENU LATERAL: MODELOS, GRUPOS & ALCANCE POR TAREFA */}
      <CustomFieldsStudioDialog
        open={isStudioOpen}
        onOpenChange={setIsStudioOpen}
        initialTab={studioInitialTab}
        currentListId={listId}
        currentTaskId={taskId}
      />
    </div>
  )
}
