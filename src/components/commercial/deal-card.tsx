'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Draggable } from '@hello-pangea/dnd'
import {
  MessageSquare,
  Calendar,
  Building,
  User,
  MoreVertical,
  Pencil,
  Trash2,
  UserCheck,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react'
import type { DealItem, PipelineStageItem, DealPriority } from '@/types/coydash'

interface DealCardProps {
  deal: DealItem
  index: number
  stage?: PipelineStageItem
  onEdit: (deal: DealItem) => void
  onDelete: (dealId: string) => void
  onConvert: (deal: DealItem) => void
}

const PRIORITY_BADGES: Record<DealPriority, { label: string; dot: string }> = {
  low: { label: 'Baixa', dot: 'bg-[#2f9e5a]' },
  medium: { label: 'Média', dot: 'bg-[#38bdf8]' },
  high: { label: 'Alta', dot: 'bg-[#f0521f]' },
  urgent: { label: 'Urgente', dot: 'bg-[#ef4444]' },
}

function formatCurrency(val?: number): string {
  if (!val || isNaN(val)) return 'R$ 0'
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function formatPhoneDisplay(raw?: string | null): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 13 && digits.startsWith('55')) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9, 13)}`
  }
  if (digits.length === 12 && digits.startsWith('55')) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8, 12)}`
  }
  return raw
}

export function DealCard({
  deal,
  index,
  stage,
  onEdit,
  onDelete,
  onConvert,
}: DealCardProps) {
  const router = useRouter()
  const priorityInfo = PRIORITY_BADGES[deal.priority || 'medium']

  const handleOpenWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (deal.lead_id) {
      router.push(`/atendimento?leadId=${encodeURIComponent(deal.lead_id)}`)
    }
  }

  const isWon = stage?.is_won || deal.stage_id?.includes('GANHO')

  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onEdit(deal)}
          className={`p-[14px] rounded-[14px] bg-[var(--surface)] border transition-all cursor-pointer flex flex-col gap-[10px] select-none ${
            snapshot.isDragging
              ? 'border-[#f0521f] shadow-xl rotate-1 scale-[1.02] z-50 ring-2 ring-[#f0521f]/20'
              : 'border-[var(--line2)] hover:border-[var(--line)] shadow-sm'
          }`}
        >
          {/* Topo do Card: Prioridade + Ações Rápidas */}
          <div className="flex items-center justify-between gap-[8px]">
            <div className="flex items-center gap-[6px]">
              <span className={`w-[7px] h-[7px] rounded-full ${priorityInfo.dot}`} />
              <span className="text-[11px] font-semibold text-[var(--ds-muted)]">
                {priorityInfo.label}
              </span>
            </div>

            <div className="flex items-center gap-[4px]" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => onEdit(deal)}
                className="w-[26px] h-[26px] rounded-full hover:bg-[var(--bg)] flex items-center justify-center text-[var(--ds-muted)] hover:text-[var(--fg)] transition-colors cursor-pointer"
                title="Editar negócio"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(deal.id)}
                className="w-[26px] h-[26px] rounded-full hover:bg-[#ef4444]/10 flex items-center justify-center text-[var(--ds-muted)] hover:text-[#ef4444] transition-colors cursor-pointer"
                title="Excluir negócio"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Título da Oportunidade */}
          <div>
            <h4 className="font-bold text-[13.5px] text-[var(--fg)] leading-snug line-clamp-2">
              {deal.title}
            </h4>
            {deal.client_name && (
              <div className="flex items-center gap-[4px] mt-[3px] text-[11px] text-[var(--ds-muted)]">
                <Building className="w-3 h-3 shrink-0" />
                <span className="truncate">{deal.client_name}</span>
              </div>
            )}
          </div>

          {/* Valores Financeiros: MRR e Setup */}
          <div className="flex items-center justify-between gap-[8px] p-[8px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)]/60 text-[12px]">
            <div>
              <div className="text-[10px] text-[var(--ds-muted)] uppercase tracking-wider font-semibold">
                MRR Recorrente
              </div>
              <div className="font-bold text-[#2f9e5a] text-[13px]">
                {formatCurrency(deal.value_mrr)}
                <span className="text-[10px] font-normal text-[var(--ds-muted)]">/mês</span>
              </div>
            </div>

            {deal.value_setup > 0 && (
              <div className="text-right">
                <div className="text-[10px] text-[var(--ds-muted)] uppercase tracking-wider font-semibold">
                  Setup
                </div>
                <div className="font-bold text-[var(--fg)] text-[12px]">
                  {formatCurrency(deal.value_setup)}
                </div>
              </div>
            )}
          </div>

          {/* Botão de Integração WhatsApp (se tiver lead_id) */}
          {deal.lead_id && (
            <div
              onClick={handleOpenWhatsApp}
              className="flex items-center justify-between px-[9px] py-[6px] rounded-[8px] bg-[#2f9e5a]/10 hover:bg-[#2f9e5a]/20 border border-[#2f9e5a]/30 text-[#2f9e5a] text-[11.5px] font-semibold transition-colors cursor-pointer"
              title="Abrir histórico de mensagens e chat ao vivo no Atendimento"
            >
              <div className="flex items-center gap-[6px]">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{formatPhoneDisplay(deal.lead_id)}</span>
              </div>
              <div className="flex items-center gap-[2px] text-[10.5px]">
                <span>Chat</span>
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>
          )}

          {/* Rodapé: Responsável, Data Prevista e Ação de Converter */}
          <div className="pt-[4px] border-t border-[var(--line2)]/50 flex items-center justify-between text-[11px] text-[var(--ds-muted)]">
            <div className="flex items-center gap-[5px]">
              {deal.assigned_member_name ? (
                <>
                  <div className="w-[18px] h-[18px] rounded-full bg-[#f0521f]/15 text-[#f0521f] font-bold text-[9px] flex items-center justify-center">
                    {deal.assigned_member_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate max-w-[100px]">{deal.assigned_member_name}</span>
                </>
              ) : (
                <span className="text-[10.5px] italic">Sem responsável</span>
              )}
            </div>

            {deal.expected_close_date && (
              <div className="flex items-center gap-[4px]" title="Previsão de Fechamento">
                <Calendar className="w-3 h-3" />
                <span>{new Date(deal.expected_close_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
              </div>
            )}
          </div>

          {/* Botão de Sucesso 1-Clique: Converter em Cliente 360º quando Won ou em estágio final */}
          {isWon && !deal.client_id && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onConvert(deal)
              }}
              className="w-full h-[32px] rounded-[8px] bg-[#2f9e5a] hover:bg-[#27864c] text-white font-bold text-[11px] flex items-center justify-center gap-[6px] transition-colors cursor-pointer shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Converter em Cliente 360º</span>
            </button>
          )}
        </div>
      )}
    </Draggable>
  )
}

