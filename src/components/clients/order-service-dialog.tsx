'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CheckSquare,
  Building2,
  Calendar,
  Users,
  Flag,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Plus,
  Trash2,
  Check,
  Milestone,
  FileText,
  Clock,
  Layers,
  CheckCircle2,
} from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'
import { CoyDropdown, type CoyDropdownOption } from '@/components/ui/coy-dropdown'
import { CoyDatePicker } from '@/components/ui/coy-date-picker'
import { CoyAssigneePicker } from '@/components/ui/coy-assignee-picker'
import { ensureOrdensDeServicoList } from '@/lib/task-lists-helper'
import type { ClientAccount, TaskPriorityLevel } from '@/types/coydash'

interface OrderServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: ClientAccount
  onCreated?: () => void
}

export function OrderServiceDialog({
  open,
  onOpenChange,
  client,
  onCreated,
}: OrderServiceDialogProps) {
  const {
    taskFolders,
    taskLists,
    orgMembers,
    customFieldDefs,
    createTask,
    createTaskFolder,
    createTaskList,
    refreshFromDatabase,
  } = useCoyDash()

  // Etapa atual: 1 = Briefing & Setor, 2 = Responsáveis & Prazos, 3 = Resumo & Emissão
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dados do formulário
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedListId, setSelectedListId] = useState<string>('')
  const [priority, setPriority] = useState<TaskPriorityLevel>(
    (client.priority as TaskPriorityLevel) || 'medium'
  )
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [dueDate, setDueDate] = useState<string>('')
  const [subtasks, setSubtasks] = useState<string[]>([])
  const [newSubtaskInput, setNewSubtaskInput] = useState('')
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, unknown>>({})

  // Auto-selecionar ou localizar a lista "Ordens de Serviço"
  useEffect(() => {
    if (!open) return
    let isMounted = true

    async function initList() {
      // 1. Verificar se já existe a lista "Ordens de Serviço"
      const osList = taskLists.find(
        (l) => l.name.trim().toLowerCase() === 'ordens de serviço' || l.name.trim().toLowerCase() === 'ordens de servico'
      )
      if (osList) {
        if (isMounted) setSelectedListId(osList.id)
        return
      }

      // 2. Se não existir, garantir via helper
      const targetListId = await ensureOrdensDeServicoList({
        taskFolders,
        taskLists,
        createTaskFolder,
        createTaskList,
        refreshFromDatabase,
      })
      if (isMounted && targetListId) {
        setSelectedListId(targetListId)
      }
    }

    void initList()

    // Responsável padrão inicial baseado no gestor de tráfego do cliente
    if (client.traffic_manager_name) {
      setSelectedAssignees([client.traffic_manager_name])
    }

    return () => {
      isMounted = false
    }
  }, [open, taskLists, taskFolders, client.traffic_manager_name, createTaskFolder, createTaskList, refreshFromDatabase])

  // Reset do modal ao fechar
  useEffect(() => {
    if (!open) {
      setCurrentStep(1)
      setTitle('')
      setDescription('')
      setSubtasks([])
      setNewSubtaskInput('')
      setCustomFieldValues({})
    }
  }, [open])

  // Opções de listas no dropdown
  const listOptions: CoyDropdownOption[] = useMemo(() => {
    return taskLists.map((l) => ({
      value: l.id,
      label: l.name,
      icon: <CheckSquare className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />,
    }))
  }, [taskLists])

  // Opções de prioridades no dropdown
  const priorityOptions: CoyDropdownOption[] = useMemo(
    () => [
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

  // Toggle de membros
  const toggleAssignee = (name: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  // Atalhos de datas
  const setQuickDueDate = (daysToAdd: number) => {
    const d = new Date()
    d.setDate(d.getDate() + daysToAdd)
    setDueDate(d.toISOString().split('T')[0])
  }

  // Adicionar subtarefa
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtaskInput.trim()) return
    setSubtasks((prev) => [...prev, newSubtaskInput.trim()])
    setNewSubtaskInput('')
  }

  // Remover subtarefa
  const handleRemoveSubtask = (index: number) => {
    setSubtasks((prev) => prev.filter((_, idx) => idx !== index))
  }

  // Submeter emissão da Ordem de Serviço
  const handleEmitOrderService = async () => {
    if (!title.trim() || isSubmitting) return
    setIsSubmitting(true)

    try {
      // 1. Garantir list_id
      let finalTargetListId = selectedListId
      if (!finalTargetListId) {
        finalTargetListId =
          (await ensureOrdensDeServicoList({
            taskFolders,
            taskLists,
            createTaskFolder,
            createTaskList,
            refreshFromDatabase,
          })) || taskLists[0]?.id || ''
      }

      // 2. Criar a tarefa principal vinculada ao cliente
      const created = await createTask({
        title: title.trim(),
        description: description.trim(),
        client_id: client.id,
        client_name_snapshot: client.name,
        list_id: finalTargetListId,
        status_key: 'A FAZER',
        priority,
        due_date: dueDate || null,
        assignee_name: selectedAssignees[0] || 'Equipe',
        assignees: selectedAssignees,
        custom_fields: Object.entries(customFieldValues)
          .filter(([_, val]) => val !== undefined && val !== '')
          .map(([fieldId, val]) => ({
            field_id: fieldId,
            value: val,
          })),
        subtasks: subtasks.map((st, idx) => ({
          id: `sub_${Date.now()}_${idx}`,
          title: st,
          is_completed: false,
        })),
      })

      if (created) {
        onOpenChange(false)
        onCreated?.()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="!max-w-[760px] p-0 overflow-hidden flex flex-col gap-0 rounded-2xl bg-[var(--surface)] border border-[var(--line2)] shadow-2xl"
      >
        <DialogTitle className="sr-only">
          Abrir Ordem de Serviço para {client.name}
        </DialogTitle>

        {/* ========================================================================= */}
        {/* HEADER DO STEPPER (DESIGN SYSTEM COYDASH) */}
        {/* ========================================================================= */}
        <div className="p-6 pb-4 border-b border-[var(--line)] bg-[var(--surface)] flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[12px] text-[var(--ds-muted)]">
              <Building2 className="w-4 h-4 text-[var(--color-brand-blue)]" />
              <span className="font-semibold text-[var(--fg)]">{client.name}</span>
              <span>/</span>
              <span>Ordens de Serviço</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-brand-blue)]/15 border border-[var(--color-brand-blue)]/30 text-[var(--color-brand-blue)] text-[11px] font-bold tracking-wide uppercase">
              Nova Demanda
            </span>
          </div>

          <div>
            <h2 className="text-[20px] font-bold tracking-tight text-[var(--fg)]">
              Abrir Ordem de Serviço (O.S.)
            </h2>
            <p className="text-[12.5px] text-[var(--ds-muted)]">
              Estruture a demanda do cliente com etapas, prazos e responsáveis. A tarefa cairá automaticamente no Kanban.
            </p>
          </div>

          {/* Stepper Visual em 3 Etapas */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              { num: 1, title: '1. Briefing & Setor', desc: 'Escopo e prioridade' },
              { num: 2, title: '2. Prazos & Entregáveis', desc: 'Membros e subtarefas' },
              { num: 3, title: '3. Resumo & Emissão', desc: 'Validação final' },
            ].map((step) => {
              const isActive = currentStep === step.num
              const isPassed = currentStep > step.num
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => {
                    if (step.num < currentStep || (step.num === 2 && title.trim())) {
                      setCurrentStep(step.num as 1 | 2 | 3)
                    }
                  }}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--color-brand-blue)]/10 border-[var(--color-brand-blue)] text-[var(--fg)]'
                      : isPassed
                        ? 'bg-[var(--bg)] border-[var(--line2)] text-[var(--fg)]'
                        : 'bg-transparent border-transparent opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11.5px] font-bold">
                    {isPassed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                    ) : (
                      <span
                        className={`w-4 h-4 rounded-full text-[10px] grid place-items-center ${
                          isActive
                            ? 'bg-[var(--color-brand-blue)] text-white'
                            : 'bg-[var(--line2)] text-[var(--ds-muted)]'
                        }`}
                      >
                        {step.num}
                      </span>
                    )}
                    <span>{step.title}</span>
                  </div>
                  <span className="text-[10px] text-[var(--ds-muted)] pl-5 truncate">
                    {step.desc}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CORPO DO MODAL CONFORME A ETAPA */}
        {/* ========================================================================= */}
        <div className="p-6 max-h-[60vh] overflow-y-auto flex flex-col gap-5">
          {/* ---------------- ETAPA 1: BRIEFING & SETOR ---------------- */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider text-[var(--fg)] mb-1.5">
                  Título da Ordem de Serviço *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Lançamento de Novos Criativos Meta Ads - Fraudes Pix"
                  autoFocus
                  className="w-full h-[42px] px-3.5 rounded-xl bg-[var(--bg)] border border-[var(--line2)] text-[13.5px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] outline-none focus:border-[var(--color-brand-blue)] focus:ring-2 focus:ring-[var(--color-brand-blue)]/15 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider text-[var(--fg)] mb-1.5">
                    Lista / Setor de Destino *
                  </label>
                  <CoyDropdown
                    value={selectedListId}
                    onChange={setSelectedListId}
                    options={listOptions}
                    placeholder="Selecione a lista de destino"
                    className="w-full h-[40px] rounded-xl"
                  />
                  <span className="text-[10.5px] text-[var(--ds-muted)] mt-1 block">
                    Padrão: <strong>Ordens de Serviço</strong> (dentro de Clientes - Tarefas)
                  </span>
                </div>

                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider text-[var(--fg)] mb-1.5">
                    Prioridade da O.S. *
                  </label>
                  <CoyDropdown
                    value={priority}
                    onChange={(val) => setPriority(val as TaskPriorityLevel)}
                    options={priorityOptions}
                    className="w-full h-[40px] rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider text-[var(--fg)] mb-1.5">
                  Descrição & Briefing da Demanda
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Descreva detalhadamente os objetivos da demanda, links de referência, personas e direcionamentos para o time..."
                  className="w-full p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] outline-none focus:border-[var(--color-brand-blue)] focus:ring-2 focus:ring-[var(--color-brand-blue)]/15 resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* ---------------- ETAPA 2: PRAZOS & ENTREGÁVEIS ---------------- */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-5">
              {/* Data de Entrega */}
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider text-[var(--fg)] mb-1.5">
                  Prazo Limite / Vencimento
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <CoyDatePicker
                    value={dueDate}
                    onChange={setDueDate}
                    placeholder="Definir prazo..."
                    className="min-w-[200px]"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuickDueDate(1)}
                      className="px-2.5 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--line2)] hover:border-[#0066FF] text-[11px] font-medium text-[var(--ds-muted)] hover:text-[var(--fg)] transition-colors cursor-pointer"
                    >
                      Amanhã
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDueDate(3)}
                      className="px-2.5 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--line2)] hover:border-[#0066FF] text-[11px] font-medium text-[var(--ds-muted)] hover:text-[var(--fg)] transition-colors cursor-pointer"
                    >
                      Em 3 dias
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDueDate(7)}
                      className="px-2.5 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--line2)] hover:border-[#0066FF] text-[11px] font-medium text-[var(--ds-muted)] hover:text-[var(--fg)] transition-colors cursor-pointer"
                    >
                      Em 1 semana
                    </button>
                  </div>
                </div>
              </div>

              {/* Responsáveis da Equipe */}
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider text-[var(--fg)] mb-1.5">
                  Responsáveis pela Execução
                </label>
                <div className="p-3 border border-[var(--line2)] rounded-xl bg-[var(--surface)]">
                  <CoyAssigneePicker
                    value={selectedAssignees}
                    multiple={true}
                    onChange={setSelectedAssignees}
                  />
                  {selectedAssignees.length === 0 && (
                    <p className="text-[11px] text-[var(--ds-muted)] mt-2 italic">
                      Dica: Clique no botão acima para abrir a lista com fotos, nomes e cargos de toda a equipe.
                    </p>
                  )}
                </div>
              </div>

              {/* Subtarefas / Entregáveis da O.S. */}
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider text-[var(--fg)] mb-1.5">
                  Entregáveis / Checklist de Subtarefas
                </label>

                <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mb-2.5">
                  <input
                    type="text"
                    value={newSubtaskInput}
                    onChange={(e) => setNewSubtaskInput(e.target.value)}
                    placeholder="Adicionar etapa (ex: Criar 5 criativos no Canva)..."
                    className="flex-1 h-[38px] px-3.5 rounded-xl bg-[var(--bg)] border border-[var(--line2)] text-[12.5px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] outline-none focus:border-[var(--color-brand-blue)]"
                  />
                  <button
                    type="submit"
                    className="h-[38px] px-3.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[12px] font-semibold text-[var(--fg)] flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                    <span>Adicionar</span>
                  </button>
                </form>

                {subtasks.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {subtasks.map((st, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg)] border border-[var(--line2)] text-[12px]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-4 h-4 rounded-full bg-[var(--line2)] text-[10px] grid place-items-center text-[var(--ds-muted)] shrink-0">
                            {idx + 1}
                          </span>
                          <span className="truncate text-[var(--fg)] font-medium">{st}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(idx)}
                          className="p-1 text-[var(--ds-muted)] hover:text-red-500 cursor-pointer transition-colors"
                          title="Remover etapa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------------- ETAPA 3: RESUMO & EMISSÃO ---------------- */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--line2)] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ds-muted)]">
                    Resumo da Ordem de Serviço
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-brand-blue)]/15 text-[var(--color-brand-blue)] text-[11px] font-bold">
                    Pronta para Emissão
                  </span>
                </div>

                <div className="text-[16px] font-bold text-[var(--fg)]">
                  {title}
                </div>

                {description && (
                  <p className="text-[12.5px] text-[var(--ds-muted)] line-clamp-3 leading-relaxed">
                    {description}
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[var(--line)] text-[12px]">
                  <div>
                    <span className="text-[10px] text-[var(--ds-muted)] uppercase block">Cliente</span>
                    <span className="font-semibold text-[var(--fg)] truncate block">{client.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--ds-muted)] uppercase block">Prioridade</span>
                    <span className="font-semibold text-[var(--fg)] capitalize block">{priority}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--ds-muted)] uppercase block">Vencimento</span>
                    <span className="font-semibold text-[var(--fg)] block">{dueDate || 'Sem prazo fixado'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--ds-muted)] uppercase block">Subtarefas</span>
                    <span className="font-semibold text-[var(--fg)] block">{subtasks.length} entregáveis</span>
                  </div>
                </div>

                {selectedAssignees.length > 0 && (
                  <div className="pt-2 border-t border-[var(--line)] text-[12px]">
                    <span className="text-[10px] text-[var(--ds-muted)] uppercase block mb-1">Responsáveis:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedAssignees.map((a, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--line2)] text-[11px] font-medium text-[var(--fg)]"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Informação sobre sincronização */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/20 text-[12px] text-[var(--fg)]">
                <Sparkles className="w-4 h-4 text-[var(--color-brand-blue)] shrink-0" />
                <span>
                  Esta Ordem de Serviço será vinculada a <strong>{client.name}</strong> e inserida automaticamente no quadro Kanban de tarefas da agência.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* FOOTER DO MODAL (BOTÕES DE NAVEGAÇÃO E EMISSÃO) */}
        {/* ========================================================================= */}
        <div className="p-4 px-6 border-t border-[var(--line)] bg-[var(--surface)] flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)}
              className="h-[38px] px-4 rounded-xl bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[12.5px] font-semibold text-[var(--fg)] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-[38px] px-4 rounded-xl hover:bg-[var(--ds-hover)] text-[12.5px] font-medium text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer transition-colors"
            >
              Cancelar
            </button>
          )}

          <div className="flex items-center gap-2">
            {currentStep < 3 ? (
              <button
                type="button"
                disabled={!title.trim()}
                onClick={() => setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3)}
                className="h-[38px] px-5 rounded-xl bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue-hover)] text-white text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                <span>Avançar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting || !title.trim()}
                onClick={handleEmitOrderService}
                className="h-[38px] px-6 rounded-xl bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue-hover)] text-white text-[13px] font-bold flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Emitindo...' : 'Emitir Ordem de Serviço ↗'}</span>
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
