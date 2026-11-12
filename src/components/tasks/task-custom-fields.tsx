'use client'

import React, { useState } from 'react'
import {
  Type,
  AlignLeft,
  Hash,
  Link as LinkIcon,
  ListFilter,
  CheckSquare,
  Calendar as CalendarIcon,
  User,
  FileText,
  Plus,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Trash2,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
  onCreateFieldDef: (def: Partial<CustomFieldDefinition>) => Promise<void>
  onDeleteFieldDef?: (defId: string) => Promise<void>
  availableMembers?: string[]
}

const FIELD_ICONS: Record<CustomFieldType, React.ElementType> = {
  text: Type,
  textarea: AlignLeft,
  number: Hash,
  url: LinkIcon,
  select: ListFilter,
  checkbox: CheckSquare,
  date: CalendarIcon,
  user: User,
  file: FileText,
}

const FIELD_LABELS: Record<CustomFieldType, string> = {
  text: 'Texto Curto',
  textarea: 'Texto Longo',
  number: 'Número / Moeda',
  url: 'Link / URL',
  select: 'Seleção / Dropdown',
  checkbox: 'Caixa de Seleção',
  date: 'Data',
  user: 'Pessoa / Responsável',
  file: 'Arquivo / Drive',
}

const DEFAULT_TEMPLATES: { name: string; type: CustomFieldType; options?: { label: string; color?: string }[] }[] = [
  { name: 'Pasta de Criativos', type: 'url' },
  { name: 'Relatório final da OS', type: 'textarea' },
  {
    name: 'SUCESSO DA TAREFA',
    type: 'select',
    options: [
      { label: 'SUCESSO!!', color: '#10b981' },
      { label: 'EM ANÁLISE', color: '#3b82f6' },
      { label: 'PENDENTE', color: '#f59e0b' },
      { label: 'FALHOU', color: '#ef4444' },
    ],
  },
  { name: 'Bônus do Cliente (R$)', type: 'number' },
  { name: 'Cliente', type: 'text' },
  { name: 'Criativos por OS', type: 'number' },
  { name: 'Data de Conclusão', type: 'date' },
  { name: 'Descrição do Problema', type: 'textarea' },
  { name: 'Design responsável', type: 'user' },
  { name: 'Freelancer', type: 'user' },
  { name: 'Gestor de Tráfego', type: 'user' },
  { name: 'Informações Adicionais', type: 'textarea' },
  { name: 'Relatório enviado', type: 'checkbox' },
  {
    name: 'REVISOES DIÁRIAS',
    type: 'select',
    options: [
      { label: 'REVISAR', color: '#f59e0b' },
      { label: 'APROVADO', color: '#10b981' },
      { label: 'AJUSTAR', color: '#ef4444' },
    ],
  },
  {
    name: 'Tipo da Solicitação',
    type: 'select',
    options: [
      { label: 'Mídia - Vídeos', color: '#ec4899' },
      { label: 'Design Estático', color: '#8b5cf6' },
      { label: 'Landing Page', color: '#06b6d4' },
      { label: 'Copy / Roteiro', color: '#eab308' },
    ],
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
}: TaskCustomFieldsProps) {
  const [isSectionOpen, setIsSectionOpen] = useState(true)
  const [hideEmptyFields, setHideEmptyFields] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [activeAddTab, setActiveAddTab] = useState<'custom' | 'templates'>('custom')

  // Form para novo campo personalizado
  const [fieldName, setFieldName] = useState('')
  const [fieldType, setFieldType] = useState<CustomFieldType>('text')
  const [fieldScope, setFieldScope] = useState<'task' | 'list' | 'template'>('list')
  const [selectOptionsText, setSelectOptionsText] = useState('')
  const [isCreatingField, setIsCreatingField] = useState(false)

  // Unifica definições relevantes: as do banco (para esta lista, ou templates globais) + os campos já existentes no taskCustomFields
  const relevantDefs: CustomFieldDefinition[] = [...customFieldDefs]

  // Adiciona definições virtuais para campos locais na tarefa que ainda não estão em customFieldDefs
  taskCustomFields.forEach((item) => {
    if (!relevantDefs.some((d) => d.id === item.field_id || d.name === item.field_name)) {
      relevantDefs.push({
        id: item.field_id,
        name: item.field_name || 'Campo sem nome',
        type: item.field_type || 'text',
        scope: 'task',
      })
    }
  })

  // Obtém o valor de um campo
  const getFieldValue = (def: CustomFieldDefinition) => {
    const found = taskCustomFields.find(
      (f) => f.field_id === def.id || (f.field_name && f.field_name.toLowerCase() === def.name.toLowerCase())
    )
    return found ? found.value : undefined
  }

  // Atualiza o valor de um campo
  const handleUpdateValue = (def: CustomFieldDefinition, newValue: any) => {
    const existingIndex = taskCustomFields.findIndex(
      (f) => f.field_id === def.id || (f.field_name && f.field_name.toLowerCase() === def.name.toLowerCase())
    )

    let updated = [...taskCustomFields]
    if (existingIndex >= 0) {
      updated[existingIndex] = {
        ...updated[existingIndex],
        field_id: def.id,
        field_name: def.name,
        field_type: def.type,
        value: newValue,
      }
    } else {
      updated.push({
        field_id: def.id,
        field_name: def.name,
        field_type: def.type,
        value: newValue,
      })
    }
    onChange(updated)
  }

  // Verifica se o campo está vazio
  const isFieldEmpty = (val: any, type: CustomFieldType) => {
    if (val === undefined || val === null || val === '') return true
    if (type === 'checkbox') return false // Checkbox sempre tem estado
    if (Array.isArray(val) && val.length === 0) return true
    return false
  }

  // Criação de novo campo
  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fieldName.trim()) return

    setIsCreatingField(true)
    try {
      let parsedOptions: { label: string; color?: string }[] = []
      if (fieldType === 'select' && selectOptionsText.trim()) {
        const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4']
        parsedOptions = selectOptionsText
          .split(',')
          .map((s, idx) => ({
            label: s.trim(),
            color: colors[idx % colors.length],
          }))
          .filter((opt) => Boolean(opt.label))
      }

      const newDef: Partial<CustomFieldDefinition> = {
        name: fieldName.trim(),
        type: fieldType,
        scope: fieldScope,
        list_id: fieldScope === 'list' && listId ? listId : undefined,
        options: parsedOptions,
      }

      await onCreateFieldDef(newDef)

      // Se for escopo de tarefa apenas, injeta direto nos valores
      const virtualId = `cf_${Date.now()}`
      handleUpdateValue(
        {
          id: virtualId,
          name: fieldName.trim(),
          type: fieldType,
          scope: fieldScope,
          options: parsedOptions,
        },
        fieldType === 'checkbox' ? false : ''
      )

      setFieldName('')
      setSelectOptionsText('')
      setIsAddOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setIsCreatingField(false)
    }
  }

  // Aplicar modelo pré-pronto
  const handleApplyTemplate = async (tmpl: typeof DEFAULT_TEMPLATES[0]) => {
    const existing = relevantDefs.find((d) => d.name.toLowerCase() === tmpl.name.toLowerCase())
    if (existing) {
      // Já existe, apenas garante que está visível
      handleUpdateValue(existing, tmpl.type === 'checkbox' ? false : '')
    } else {
      await onCreateFieldDef({
        name: tmpl.name,
        type: tmpl.type,
        options: tmpl.options || [],
        scope: 'list',
        list_id: listId || undefined,
      })
      handleUpdateValue(
        {
          id: `cf_${Date.now()}`,
          name: tmpl.name,
          type: tmpl.type,
          options: tmpl.options,
          scope: 'list',
        },
        tmpl.type === 'checkbox' ? false : ''
      )
    }
  }

  // Contagem de campos vazios
  const emptyFieldsCount = relevantDefs.filter((def) => isFieldEmpty(getFieldValue(def), def.type)).length

  const visibleDefs = hideEmptyFields
    ? relevantDefs.filter((def) => !isFieldEmpty(getFieldValue(def), def.type))
    : relevantDefs

  return (
    <div className="flex flex-col gap-2 border-t border-[var(--line2)] pt-4 mt-2">
      {/* CABEÇALHO DA SEÇÃO DE CAMPOS */}
      <div className="flex items-center justify-between py-1">
        <button
          type="button"
          onClick={() => setIsSectionOpen(!isSectionOpen)}
          className="flex items-center gap-1.5 text-[13px] font-bold text-[var(--fg)] hover:text-[var(--color-brand-orange)] transition-colors"
        >
          {isSectionOpen ? (
            <ChevronDown className="w-4 h-4 text-[var(--ds-muted)]" />
          ) : (
            <ChevronUp className="w-4 h-4 text-[var(--ds-muted)]" />
          )}
          <span>Campos</span>
          <span className="text-[11px] font-medium text-[var(--ds-muted)] px-1.5 py-0.2 rounded-full bg-[var(--line2)]">
            {relevantDefs.length}
          </span>
        </button>

        {relevantDefs.length > 0 && (
          <button
            type="button"
            onClick={() => setHideEmptyFields(!hideEmptyFields)}
            className="flex items-center gap-1 text-[11px] font-medium text-[var(--ds-muted)] hover:text-[var(--fg)] transition-colors px-2 py-0.5 rounded hover:bg-[var(--line2)]"
          >
            {hideEmptyFields ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>
              {hideEmptyFields
                ? `Mostrar ${emptyFieldsCount} campos vazios`
                : `Ocultar ${emptyFieldsCount} campos vazios`}
            </span>
          </button>
        )}
      </div>

      {/* CONTEÚDO EXPANDIDO DOS CAMPOS */}
      {isSectionOpen && (
        <div className="flex flex-col gap-1">
          {visibleDefs.map((def) => {
            const IconComponent = FIELD_ICONS[def.type] || Type
            const val = getFieldValue(def)
            const empty = isFieldEmpty(val, def.type)

            return (
              <div
                key={def.id || def.name}
                className="group flex flex-col sm:flex-row sm:items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[var(--line2)]/40 transition-colors gap-2"
              >
                {/* Rótulo e Ícone do Campo */}
                <div className="flex items-center gap-2 sm:w-[220px] shrink-0 text-[12px] font-medium text-[var(--ds-muted)] group-hover:text-[var(--fg)]">
                  <IconComponent className="w-3.5 h-3.5 text-[var(--ds-muted)] shrink-0" />
                  <span className="truncate" title={def.name}>
                    {def.name}
                  </span>
                  {def.is_required && (
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-red-500 bg-red-500/10 px-1 py-0.2 rounded">
                      Obrigatório
                    </span>
                  )}
                </div>

                {/* Valor Interativo do Campo */}
                <div className="flex-1 min-w-0">
                  {def.type === 'text' && (
                    <Input
                      value={val || ''}
                      onChange={(e) => handleUpdateValue(def, e.target.value)}
                      placeholder="-"
                      className="h-[30px] text-[12px] bg-transparent border-transparent hover:border-[var(--line2)] focus:border-[var(--color-brand-orange)] focus:bg-[var(--bg)] px-2 py-1 text-[var(--fg)]"
                    />
                  )}

                  {def.type === 'textarea' && (
                    <Textarea
                      value={val || ''}
                      onChange={(e) => handleUpdateValue(def, e.target.value)}
                      placeholder="Clique para adicionar detalhes..."
                      rows={val && String(val).length > 60 ? 3 : 1}
                      className="min-h-[32px] text-[12px] bg-transparent border-transparent hover:border-[var(--line2)] focus:border-[var(--color-brand-orange)] focus:bg-[var(--bg)] px-2 py-1 text-[var(--fg)] resize-y leading-relaxed"
                    />
                  )}

                  {def.type === 'number' && (
                    <Input
                      type="number"
                      value={val !== undefined ? val : ''}
                      onChange={(e) => handleUpdateValue(def, e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="-"
                      className="h-[30px] text-[12px] bg-transparent border-transparent hover:border-[var(--line2)] focus:border-[var(--color-brand-orange)] focus:bg-[var(--bg)] px-2 py-1 text-[var(--fg)] max-w-[200px]"
                    />
                  )}

                  {def.type === 'url' && (
                    <div className="flex items-center gap-2">
                      <Input
                        value={val || ''}
                        onChange={(e) => handleUpdateValue(def, e.target.value)}
                        placeholder="https://..."
                        className="h-[30px] text-[12px] bg-transparent border-transparent hover:border-[var(--line2)] focus:border-[var(--color-brand-orange)] focus:bg-[var(--bg)] px-2 py-1 text-[var(--fg)]"
                      />
                      {val && (
                        <a
                          href={String(val).startsWith('http') ? String(val) : `https://${val}`}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 p-1.5 rounded text-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/15 transition-colors"
                          title="Abrir link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  )}

                  {def.type === 'select' && (
                    <Popover>
                      <PopoverTrigger
                        render={
                          <button
                            type="button"
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border border-[var(--line2)] hover:border-[var(--color-brand-orange)]"
                            style={{
                              backgroundColor:
                                def.options?.find((o) => o.label === val)?.color ? `${def.options.find((o) => o.label === val)?.color}20` : 'transparent',
                              color:
                                def.options?.find((o) => o.label === val)?.color || 'var(--fg)',
                            }}
                          />
                        }
                      >
                        <span>{val || '-'}</span>
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </PopoverTrigger>
                      <PopoverContent className="w-52 p-2 bg-[var(--surface)] border-[var(--line2)] text-[var(--fg)]">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateValue(def, '')}
                            className="text-left px-2 py-1 text-[11px] rounded hover:bg-[var(--line2)] text-[var(--ds-muted)]"
                          >
                            Limpar seleção
                          </button>
                          {(def.options || []).map((opt) => (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() => handleUpdateValue(def, opt.label)}
                              className="flex items-center justify-between px-2 py-1.5 rounded text-[11px] font-medium hover:bg-[var(--line2)]"
                            >
                              <span
                                className="px-2 py-0.5 rounded text-[11px] font-semibold"
                                style={{
                                  backgroundColor: opt.color ? `${opt.color}25` : 'var(--line2)',
                                  color: opt.color || 'var(--fg)',
                                }}
                              >
                                {opt.label}
                              </span>
                              {val === opt.label && <Check className="w-3.5 h-3.5 text-[var(--color-brand-orange)]" />}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}

                  {def.type === 'checkbox' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(val)}
                        onChange={(e) => handleUpdateValue(def, e.target.checked)}
                        className="w-4 h-4 rounded border-[var(--line2)] accent-[var(--color-brand-orange)]"
                      />
                      <span className="text-[12px] text-[var(--ds-muted)]">
                        {Boolean(val) ? 'Concluído / Marcado' : 'Não marcado'}
                      </span>
                    </label>
                  )}

                  {def.type === 'date' && (
                    <Popover>
                      <PopoverTrigger
                        render={
                          <button
                            type="button"
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] text-[var(--fg)] hover:bg-[var(--line2)] border border-transparent hover:border-[var(--line2)]"
                          />
                        }
                      >
                        <CalendarIcon className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
                        <span>{val ? format(new Date(val), 'dd/MM/yyyy') : '-'}</span>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-[var(--surface)] border-[var(--line2)]">
                        <Calendar
                          mode="single"
                          selected={val ? new Date(val) : undefined}
                          onSelect={(d) => handleUpdateValue(def, d ? d.toISOString().split('T')[0] : '')}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  )}

                  {def.type === 'user' && (
                    <Popover>
                      <PopoverTrigger
                        render={
                          <button
                            type="button"
                            className="flex items-center gap-2 px-2.5 py-1 rounded text-[12px] text-[var(--fg)] hover:bg-[var(--line2)] border border-transparent hover:border-[var(--line2)]"
                          />
                        }
                      >
                        {val ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-[var(--color-brand-orange)]/20 text-[var(--color-brand-orange)] flex items-center justify-center text-[10px] font-bold">
                              {String(val).slice(0, 2).toUpperCase()}
                            </div>
                            <span>{val}</span>
                          </div>
                        ) : (
                          <span className="text-[var(--ds-muted)]">-</span>
                        )}
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2 bg-[var(--surface)] border-[var(--line2)]">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateValue(def, '')}
                            className="text-left px-2 py-1 text-[11px] rounded hover:bg-[var(--line2)] text-[var(--ds-muted)]"
                          >
                            Nenhum
                          </button>
                          {availableMembers.map((member) => (
                            <button
                              key={member}
                              type="button"
                              onClick={() => handleUpdateValue(def, member)}
                              className="flex items-center gap-2 px-2 py-1.5 rounded text-[12px] hover:bg-[var(--line2)] text-left"
                            >
                              <div className="w-5 h-5 rounded-full bg-[var(--line2)] text-[var(--fg)] flex items-center justify-center text-[10px] font-bold">
                                {member.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="truncate">{member}</span>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}

                  {def.type === 'file' && (
                    <Input
                      value={val || ''}
                      onChange={(e) => handleUpdateValue(def, e.target.value)}
                      placeholder="Link do arquivo ou Google Drive..."
                      className="h-[30px] text-[12px] bg-transparent border-transparent hover:border-[var(--line2)] focus:border-[var(--color-brand-orange)] focus:bg-[var(--bg)] px-2 py-1 text-[var(--fg)]"
                    />
                  )}
                </div>

                {/* Ações da linha */}
                {onDeleteFieldDef && (
                  <button
                    type="button"
                    onClick={() => onDeleteFieldDef(def.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[var(--ds-muted)] hover:text-red-500 rounded transition-opacity"
                    title="Remover campo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          })}

          {/* BOTÃO ADICIONAR CAMPO */}
          <div className="pt-2">
            <Popover open={isAddOpen} onOpenChange={setIsAddOpen}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[12px] font-semibold text-[var(--ds-muted)] hover:text-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/10 gap-1.5 px-3 rounded-lg border border-dashed border-[var(--line2)]"
                  />
                }
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar campo</span>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3 bg-[var(--surface)] border-[var(--line2)] text-[var(--fg)] shadow-2xl rounded-xl">
                {/* TABS DO POPOVER: NOVO CAMPO OU MODELOS */}
                <div className="flex border-b border-[var(--line2)] pb-2 mb-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveAddTab('custom')}
                    className={`text-[12px] font-semibold pb-1 border-b-2 transition-colors ${
                      activeAddTab === 'custom'
                        ? 'border-[var(--color-brand-orange)] text-[var(--color-brand-orange)]'
                        : 'border-transparent text-[var(--ds-muted)] hover:text-[var(--fg)]'
                    }`}
                  >
                    Novo campo
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveAddTab('templates')}
                    className={`text-[12px] font-semibold pb-1 border-b-2 flex items-center gap-1 transition-colors ${
                      activeAddTab === 'templates'
                        ? 'border-[var(--color-brand-orange)] text-[var(--color-brand-orange)]'
                        : 'border-transparent text-[var(--ds-muted)] hover:text-[var(--fg)]'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>Modelos prontos</span>
                  </button>
                </div>

                {activeAddTab === 'custom' ? (
                  <form onSubmit={handleCreateField} className="flex flex-col gap-3">
                    <label className="flex flex-col gap-1 text-[11px] font-semibold text-[var(--fg)]">
                      Nome do campo
                      <Input
                        value={fieldName}
                        onChange={(e) => setFieldName(e.target.value)}
                        placeholder="Ex: Pasta de Criativos, Bônus..."
                        required
                        className="h-8 text-[12px] bg-[var(--bg)] border-[var(--line2)]"
                      />
                    </label>

                    <label className="flex flex-col gap-1 text-[11px] font-semibold text-[var(--fg)]">
                      Tipo do campo
                      <select
                        value={fieldType}
                        onChange={(e) => setFieldType(e.target.value as CustomFieldType)}
                        className="h-8 text-[12px] bg-[var(--bg)] border border-[var(--line2)] rounded-md px-2 text-[var(--fg)]"
                      >
                        {Object.entries(FIELD_LABELS).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>

                    {fieldType === 'select' && (
                      <label className="flex flex-col gap-1 text-[11px] font-semibold text-[var(--fg)]">
                        Opções (separadas por vírgula)
                        <Input
                          value={selectOptionsText}
                          onChange={(e) => setSelectOptionsText(e.target.value)}
                          placeholder="Ex: Sucesso, Pendente, Revisar"
                          className="h-8 text-[12px] bg-[var(--bg)] border-[var(--line2)]"
                        />
                      </label>
                    )}

                    <label className="flex flex-col gap-1 text-[11px] font-semibold text-[var(--fg)]">
                      Onde aplicar este campo?
                      <select
                        value={fieldScope}
                        onChange={(e) => setFieldScope(e.target.value as any)}
                        className="h-8 text-[12px] bg-[var(--bg)] border border-[var(--line2)] rounded-md px-2 text-[var(--fg)]"
                      >
                        <option value="task">Apenas nesta tarefa</option>
                        <option value="list">Em toda a lista deste projeto</option>
                        <option value="template">Salvar como modelo reutilizável</option>
                      </select>
                    </label>

                    <Button
                      type="submit"
                      disabled={isCreatingField || !fieldName.trim()}
                      className="h-8 text-[12px] font-bold bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90 text-white mt-1"
                    >
                      {isCreatingField ? 'Criando...' : 'Adicionar campo'}
                    </Button>
                  </form>
                ) : (
                  <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                    <p className="text-[11px] text-[var(--ds-muted)] mb-1">
                      Clique para adicionar o modelo à tarefa:
                    </p>
                    {DEFAULT_TEMPLATES.map((tmpl) => {
                      const IconComp = FIELD_ICONS[tmpl.type] || Type
                      return (
                        <button
                          key={tmpl.name}
                          type="button"
                          onClick={() => handleApplyTemplate(tmpl)}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--line2)] text-left transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <IconComp className="w-3.5 h-3.5 text-[var(--color-brand-orange)]" />
                            <span className="text-[12px] font-medium text-[var(--fg)]">{tmpl.name}</span>
                          </div>
                          <span className="text-[10px] text-[var(--ds-muted)] uppercase">
                            {FIELD_LABELS[tmpl.type]}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  )
}
