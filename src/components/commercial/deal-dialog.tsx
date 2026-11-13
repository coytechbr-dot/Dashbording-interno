'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Briefcase,
  DollarSign,
  Calendar,
  User,
  Phone,
  Mail,
  AlertCircle,
  Sparkles,
  Building,
  Check,
  TrendingUp,
} from 'lucide-react'
import { useCoyDash, DEFAULT_INITIAL_PIPELINE, DEFAULT_INITIAL_STAGES } from '@/lib/coydash-store'
import { CoyDatePicker } from '@/components/ui/coy-date-picker'
import { CoyAssigneePicker } from '@/components/ui/coy-assignee-picker'
import type { DealItem, PipelineItem, PipelineStageItem, DealPriority } from '@/types/coydash'

interface DealDialogProps {
  open: boolean
  onClose: () => void
  initialDeal?: DealItem | null
  defaultPipelineId?: string
  defaultStageId?: string
}

const PRIORITY_OPTIONS: { id: DealPriority; label: string; dot: string }[] = [
  { id: 'low', label: 'Baixa', dot: 'bg-[#2f9e5a]' },
  { id: 'medium', label: 'Média', dot: 'bg-[#38bdf8]' },
  { id: 'high', label: 'Alta', dot: 'bg-[#0066FF]' },
  { id: 'urgent', label: 'Urgente', dot: 'bg-[#ef4444]' },
]

export function DealDialog({
  open,
  onClose,
  initialDeal,
  defaultPipelineId,
  defaultStageId,
}: DealDialogProps) {
  const {
    pipelines,
    pipelineStages,
    clients,
    orgMembers,
    createDeal,
    updateDeal,
  } = useCoyDash()

  const [title, setTitle] = useState('')
  const [pipelineId, setPipelineId] = useState('')
  const [stageId, setStageId] = useState('')
  const [valueMrr, setValueMrr] = useState<number>(0)
  const [valueSetup, setValueSetup] = useState<number>(0)
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [clientId, setClientId] = useState('')
  const [priority, setPriority] = useState<DealPriority>('medium')
  const [expectedCloseDate, setExpectedCloseDate] = useState('')
  const [assignedMemberId, setAssignedMemberId] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Lista segura de pipelines e estágios (nunca vazios)
  const safePipelines = pipelines && pipelines.length > 0 ? pipelines : [DEFAULT_INITIAL_PIPELINE]
  const safeAllStages = pipelineStages && pipelineStages.length > 0 ? pipelineStages : DEFAULT_INITIAL_STAGES

  // Filtrar estágios do pipeline selecionado com fallback
  const availableStages = React.useMemo(() => {
    const activeId = pipelineId || defaultPipelineId || safePipelines[0]?.id
    const filtered = safeAllStages.filter((s) => s.pipeline_id === activeId)
    if (filtered.length > 0) {
      return filtered.sort((a, b) => a.stage_order - b.stage_order)
    }
    return safeAllStages.slice(0, 6).sort((a, b) => a.stage_order - b.stage_order)
  }, [safeAllStages, pipelineId, defaultPipelineId, safePipelines])

  useEffect(() => {
    if (open) {
      if (initialDeal) {
        setTitle(initialDeal.title || '')
        setPipelineId(initialDeal.pipeline_id || safePipelines[0]?.id || '')
        setStageId(initialDeal.stage_id || '')
        setValueMrr(initialDeal.value_mrr || 0)
        setValueSetup(initialDeal.value_setup || 0)
        setClientId(initialDeal.client_id || '')
        setPriority(initialDeal.priority || 'medium')
        setExpectedCloseDate(
          initialDeal.expected_close_date ? initialDeal.expected_close_date.split('T')[0] : ''
        )
        setAssignedMemberId(initialDeal.assigned_member_id || '')
        setNotes(initialDeal.notes || '')
        setContactPhone(initialDeal.lead_id || '')
      } else {
        const activePipeId = defaultPipelineId || safePipelines[0]?.id || ''
        setPipelineId(activePipeId)
        const activeStages = safeAllStages.filter((s) => s.pipeline_id === activePipeId)
        const initialStageId = defaultStageId || activeStages[0]?.id || safeAllStages[0]?.id || ''
        setStageId(initialStageId)
        setTitle('')
        setValueMrr(0)
        setValueSetup(0)
        setContactName('')
        setContactPhone('')
        setContactEmail('')
        setClientId('')
        setPriority('medium')
        setExpectedCloseDate('')
        setAssignedMemberId('')
        setNotes('')
      }
      setErrorMsg(null)
    }
  }, [open, initialDeal, defaultPipelineId, defaultStageId, safePipelines, safeAllStages])

  // Garante que se pipelineId ou stageId ficarem desincronizados, eles se auto-selecionem
  useEffect(() => {
    if (open) {
      if (!pipelineId && safePipelines.length > 0) {
        setPipelineId(safePipelines[0].id)
      }
      if (availableStages.length > 0 && (!stageId || !availableStages.some((s) => s.id === stageId))) {
        setStageId(availableStages[0].id)
      }
    }
  }, [open, pipelineId, stageId, safePipelines, availableStages])

  const handlePipelineChange = (newPipeId: string) => {
    setPipelineId(newPipeId)
    const newStages = safeAllStages
      .filter((s) => s.pipeline_id === newPipeId)
      .sort((a, b) => a.stage_order - b.stage_order)
    if (newStages.length > 0) {
      setStageId(newStages[0].id)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setErrorMsg('Informe o título da oportunidade')
      return
    }

    const finalPipelineId = pipelineId || safePipelines[0]?.id || ''
    const finalStageId = stageId || availableStages[0]?.id || ''

    if (!finalStageId) {
      setErrorMsg('Selecione o estágio do pipeline')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const assignedMember = orgMembers.find((m) => m.id === assignedMemberId)
      const selectedClient = clients.find((c) => c.id === clientId)

      const payload = {
        title: title.trim(),
        pipeline_id: finalPipelineId,
        stage_id: finalStageId,
        client_id: clientId || null,
        client_name: selectedClient?.name,
        value_mrr: Number(valueMrr) || 0,
        value_setup: Number(valueSetup) || 0,
        expected_close_date: expectedCloseDate || null,
        priority,
        assigned_member_id: assignedMemberId || null,
        assigned_member_name: assignedMember?.full_name || '',
        notes: notes.trim(),
        contact_name: contactName.trim(),
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim(),
      }

      if (initialDeal) {
        await updateDeal(initialDeal.id, payload)
      } else {
        await createDeal(payload)
      }

      onClose()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao salvar oportunidade')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] max-w-[620px] w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="p-[20px] border-b border-[var(--line2)] flex items-center justify-between shrink-0 bg-[var(--surface)]">
          <div className="flex items-center gap-[10px]">
            <div className="w-[38px] h-[38px] rounded-full bg-[#0066FF]/10 border border-[#0066FF]/30 flex items-center justify-center text-[#0066FF]">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[var(--fg)] tracking-[-0.3px]">
                {initialDeal ? 'Editar Oportunidade Comercial' : 'Nova Oportunidade de Vendas'}
              </h2>
              <p className="text-[12px] text-[var(--ds-muted)]">
                Gestão comercial integrada ao Atendimento WhatsApp e Clientes 360º
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-[32px] h-[32px] rounded-full border border-[var(--line2)] flex items-center justify-center text-[var(--ds-muted)] hover:text-[var(--fg)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="p-[20px] overflow-y-auto flex flex-col gap-[16px] text-[13px]">
          {errorMsg && (
            <div className="p-[10px] rounded-[10px] bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-[12px] flex items-center gap-[8px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Título da Oportunidade */}
          <div>
            <label className="block text-[12px] font-semibold text-[var(--fg)] mb-[6px]">
              Título da Oportunidade / Projeto *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Projeto CRM + Tráfego Pago MetalSul"
              className="w-full h-[40px] px-[12px] bg-[var(--bg)] border border-[var(--line2)] rounded-[10px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] focus:outline-none focus:border-[#0066FF]"
            />
          </div>

          {/* Pipeline e Estágio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
            <div>
              <label className="block text-[12px] font-semibold text-[var(--fg)] mb-[6px]">
                Funil de Vendas (Pipeline) *
              </label>
              <select
                value={pipelineId}
                onChange={(e) => handlePipelineChange(e.target.value)}
                className="w-full h-[40px] px-[10px] bg-[var(--bg)] border border-[var(--line2)] rounded-[10px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
              >
                {safePipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[var(--fg)] mb-[6px]">
                Estágio Inicial *
              </label>
              <select
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="w-full h-[40px] px-[10px] bg-[var(--bg)] border border-[var(--line2)] rounded-[10px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
              >
                {availableStages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.probability_percent}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Valores Financeiros: MRR e Setup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] p-[12px] rounded-[12px] bg-[var(--bg)] border border-[var(--line2)]">
            <div>
              <label className="block text-[11.5px] font-semibold text-[var(--fg)] mb-[4px] flex items-center gap-[5px]">
                <DollarSign className="w-3.5 h-3.5 text-[#2f9e5a]" />
                Receita Recorrente (MRR / Mês)
              </label>
              <div className="relative">
                <span className="absolute left-[10px] top-[10px] text-[12px] text-[var(--ds-muted)]">R$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={valueMrr}
                  onChange={(e) => setValueMrr(Number(e.target.value))}
                  placeholder="0,00"
                  className="w-full h-[38px] pl-[34px] pr-[10px] bg-[var(--surface)] border border-[var(--line2)] rounded-[8px] text-[var(--fg)] font-semibold text-[13px] focus:outline-none focus:border-[#0066FF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-[var(--fg)] mb-[4px] flex items-center gap-[5px]">
                <TrendingUp className="w-3.5 h-3.5 text-[#0066FF]" />
                Taxa de Implementação (Setup)
              </label>
              <div className="relative">
                <span className="absolute left-[10px] top-[10px] text-[12px] text-[var(--ds-muted)]">R$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={valueSetup}
                  onChange={(e) => setValueSetup(Number(e.target.value))}
                  placeholder="0,00"
                  className="w-full h-[38px] pl-[34px] pr-[10px] bg-[var(--surface)] border border-[var(--line2)] rounded-[8px] text-[var(--fg)] font-semibold text-[13px] focus:outline-none focus:border-[#0066FF]"
                />
              </div>
            </div>
          </div>

          {/* Bloco de Integração WhatsApp / Contato */}
          <div className="p-[12px] rounded-[12px] border border-[#2f9e5a]/30 bg-[#2f9e5a]/5 flex flex-col gap-[10px]">
            <div className="flex items-center gap-[8px]">
              <Phone className="w-4 h-4 text-[#2f9e5a]" />
              <span className="text-[12px] font-bold text-[#2f9e5a]">
                Vínculo com WhatsApp & Atendimento Comercial
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
              <div>
                <label className="block text-[11px] font-medium text-[var(--fg)] mb-[3px]">
                  Número de WhatsApp (com DDD)
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Ex: 5511999998888"
                  className="w-full h-[36px] px-[10px] bg-[var(--surface)] border border-[var(--line2)] rounded-[8px] text-[var(--fg)] text-[12.5px] focus:outline-none focus:border-[#2f9e5a]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--fg)] mb-[3px]">
                  Nome do Contato / Decisor
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Ex: Carlos Oliveira (Diretor)"
                  className="w-full h-[36px] px-[10px] bg-[var(--surface)] border border-[var(--line2)] rounded-[8px] text-[var(--fg)] text-[12.5px] focus:outline-none focus:border-[#2f9e5a]"
                />
              </div>
            </div>

            <p className="text-[11px] text-[var(--ds-muted)]">
              ℹ️ <span className="font-semibold text-[var(--fg)]">Integração Instantânea:</span> Ao salvar com o WhatsApp, o chat é criado automaticamente no Atendimento e o botão de acesso direto ao WhatsApp aparece no card.
            </p>
          </div>

          {/* Vínculo com Empresa Existente & Previsão */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
            <div>
              <label className="block text-[12px] font-semibold text-[var(--fg)] mb-[6px] flex items-center gap-[5px]">
                <Building className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
                Vincular a Cliente Existente (Opcional)
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full h-[40px] px-[10px] bg-[var(--bg)] border border-[var(--line2)] rounded-[10px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
              >
                <option value="">Nenhum (Novo Prospect B2B)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[var(--fg)] mb-[6px] flex items-center gap-[5px]">
                <Calendar className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
                Previsão de Fechamento
              </label>
              <CoyDatePicker
                value={expectedCloseDate}
                onChange={setExpectedCloseDate}
                placeholder="Selecione a data..."
                className="w-full h-[40px]"
              />
            </div>
          </div>

          {/* Prioridade e Responsável */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
            <div>
              <label className="block text-[12px] font-semibold text-[var(--fg)] mb-[6px]">
                Prioridade
              </label>
              <div className="grid grid-cols-4 gap-[6px]">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPriority(opt.id)}
                    className={`h-[36px] rounded-[8px] text-[11px] font-semibold flex items-center justify-center gap-[5px] border transition-colors cursor-pointer ${
                      priority === opt.id
                        ? 'bg-[var(--fg)] text-[var(--bg)] border-transparent'
                        : 'border-[var(--line2)] text-[var(--ds-muted)] hover:text-[var(--fg)] bg-[var(--bg)]'
                    }`}
                  >
                    <span className={`w-[6px] h-[6px] rounded-full ${opt.dot}`} />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[var(--fg)] mb-[6px] flex items-center gap-[5px]">
                <User className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
                Closer / Responsável
              </label>
              <CoyAssigneePicker
                value={orgMembers.find((m) => m.id === assignedMemberId)?.full_name || assignedMemberId}
                multiple={false}
                onChange={(selectedName: string) => {
                  const found = orgMembers.find((m) => m.full_name === selectedName)
                  setAssignedMemberId(found?.id || selectedName)
                }}
                placeholder="Atribuir closer..."
                className="w-full"
              />
            </div>
          </div>

          {/* Anotações */}
          <div>
            <label className="block text-[12px] font-semibold text-[var(--fg)] mb-[6px]">
              Anotações & Detalhes da Negociação
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Reunião de apresentação realizada, decisor solicitou proposta com migração de ERP inclusa."
              className="w-full p-[10px] bg-[var(--bg)] border border-[var(--line2)] rounded-[10px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] text-[12.5px] focus:outline-none focus:border-[#0066FF]"
            />
          </div>

          {/* Rodapé de Ações */}
          <div className="pt-[14px] border-t border-[var(--line2)] flex items-center justify-end gap-[10px]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-[16px] h-[40px] rounded-full text-[12.5px] font-semibold border border-[var(--line2)] text-[var(--ds-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-[20px] h-[40px] rounded-full text-[12.5px] font-bold bg-[#0066FF] hover:bg-[#0052CC] text-[#141414] flex items-center gap-[8px] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : initialDeal ? 'Salvar Alterações' : 'Criar Oportunidade'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

