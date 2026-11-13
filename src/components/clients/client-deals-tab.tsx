'use client'

import React from 'react'
import Link from 'next/link'
import {
  Briefcase,
  Plus,
  DollarSign,
  TrendingUp,
  Calendar,
  User,
  ArrowUpRight,
  MessageSquare,
  Sparkles,
  Layers,
} from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'
import type { DealItem } from '@/types/coydash'

interface ClientDealsTabProps {
  clientId: string
  clientName: string
  onOpenNewDeal: () => void
}

function formatCurrency(val?: number): string {
  if (!val || isNaN(val)) return 'R$ 0'
  return val.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

export function ClientDealsTab({
  clientId,
  clientName,
  onOpenNewDeal,
}: ClientDealsTabProps) {
  const { deals, pipelineStages, pipelines } = useCoyDash()

  // Oportunidades vinculadas a este cliente
  const clientDeals = deals.filter((d) => d.client_id === clientId)

  // Métricas financeiras deste cliente
  let totalMrr = 0
  let totalSetup = 0
  let wonCount = 0

  clientDeals.forEach((d) => {
    totalMrr += Number(d.value_mrr) || 0
    totalSetup += Number(d.value_setup) || 0
    const stage = pipelineStages.find((s) => s.id === d.stage_id)
    if (stage?.is_won) wonCount++
  })

  return (
    <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[22px] flex flex-col gap-[18px]">
      {/* Topo da Aba */}
      <div className="flex flex-wrap items-center justify-between gap-[12px] border-b border-[var(--line)] pb-[14px]">
        <div>
          <div className="flex items-center gap-[8px]">
            <Briefcase className="w-4 h-4 text-[#0066FF]" />
            <h2 className="text-[16px] font-bold text-[var(--fg)]">
              Oportunidades Comerciais & Propostas · {clientName}
            </h2>
            <span className="px-[8px] py-[2px] rounded-full bg-[var(--bg)] border border-[var(--line2)] text-[11px] font-semibold text-[var(--ds-muted)]">
              {clientDeals.length} {clientDeals.length === 1 ? 'negócio' : 'negócios'}
            </span>
          </div>
          <p className="text-[12px] text-[var(--ds-muted)] mt-[2px]">
            Histórico de vendas, novas propostas de expansão, MRR e evolução no funil
          </p>
        </div>

        <div className="flex items-center gap-[8px]">
          <Link
            href="/comercial"
            className="h-[36px] px-[12px] rounded-full bg-[var(--bg)] border border-[var(--line2)] hover:border-[#0066FF] text-[12px] font-semibold text-[var(--fg)] flex items-center gap-[6px] transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>Ver Funil Geral</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
          </Link>

          <button
            type="button"
            onClick={onOpenNewDeal}
            className="h-[36px] px-[14px] rounded-full bg-[#141414] text-[#F4F4F2] text-[12px] font-semibold hover:bg-[#0066FF] flex items-center gap-[6px] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Oportunidade</span>
          </button>
        </div>
      </div>

      {/* Mini KPIs do Cliente */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-[10px]">
        <div className="p-[12px] rounded-[12px] bg-[var(--bg)] border border-[var(--line2)] flex flex-col gap-[4px]">
          <span className="text-[11px] font-semibold text-[var(--ds-muted)] flex items-center gap-[4px]">
            <DollarSign className="w-3 h-3 text-[#2f9e5a]" />
            MRR em Negociação
          </span>
          <span className="text-[16px] font-bold text-[var(--fg)]">
            {formatCurrency(totalMrr)}
          </span>
        </div>

        <div className="p-[12px] rounded-[12px] bg-[var(--bg)] border border-[var(--line2)] flex flex-col gap-[4px]">
          <span className="text-[11px] font-semibold text-[var(--ds-muted)] flex items-center gap-[4px]">
            <TrendingUp className="w-3 h-3 text-[#0066FF]" />
            Setup Total
          </span>
          <span className="text-[16px] font-bold text-[var(--fg)]">
            {formatCurrency(totalSetup)}
          </span>
        </div>

        <div className="p-[12px] rounded-[12px] bg-[var(--bg)] border border-[var(--line2)] flex flex-col gap-[4px]">
          <span className="text-[11px] font-semibold text-[var(--ds-muted)]">
            Total de Oportunidades
          </span>
          <span className="text-[16px] font-bold text-[var(--fg)]">
            {clientDeals.length}
          </span>
        </div>

        <div className="p-[12px] rounded-[12px] bg-[var(--bg)] border border-[var(--line2)] flex flex-col gap-[4px]">
          <span className="text-[11px] font-semibold text-[var(--ds-muted)]">
            Contratos Ganhos
          </span>
          <span className="text-[16px] font-bold text-[#2f9e5a]">
            {wonCount}
          </span>
        </div>
      </div>

      {/* Lista de Oportunidades ou Estado Vazio */}
      {clientDeals.length === 0 ? (
        <div className="py-[48px] px-[20px] rounded-[14px] bg-[var(--bg)] border border-dashed border-[var(--line2)] flex flex-col items-center justify-center text-center gap-[12px]">
          <div className="w-[44px] h-[44px] rounded-full bg-[var(--surface)] border border-[var(--line2)] grid place-items-center text-[var(--ds-muted)]">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="max-w-[380px]">
            <h3 className="text-[14px] font-bold text-[var(--fg)]">
              Nenhuma oportunidade aberta para este cliente
            </h3>
            <p className="text-[12px] text-[var(--ds-muted)] mt-[4px]">
              Crie uma oportunidade para registrar expansões de escopo, upsell de novos módulos de IA ou renovações contratuais.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenNewDeal}
            className="h-[34px] px-[14px] rounded-full bg-[var(--surface)] border border-[var(--line2)] hover:border-[#0066FF] text-[12px] font-semibold text-[var(--fg)] flex items-center gap-[6px] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>Criar Primeira Oportunidade</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[14px]">
          {clientDeals.map((deal) => {
            const stage = pipelineStages.find((s) => s.id === deal.stage_id)
            const pipe = pipelines.find((p) => p.id === deal.pipeline_id)

            return (
              <div
                key={deal.id}
                className="p-[16px] rounded-[14px] bg-[var(--bg)] border border-[var(--line2)] flex flex-col justify-between gap-[12px] transition-all hover:border-[var(--line)]"
              >
                <div className="flex flex-col gap-[10px]">
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-[8px]">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-bold text-[var(--fg)] truncate">
                        {deal.title}
                      </div>
                      <div className="text-[11px] text-[var(--ds-muted)] truncate">
                        {pipe?.name || 'Funil de Vendas'}
                      </div>
                    </div>

                    {stage && (
                      <span
                        className="px-[8px] py-[3px] rounded-full text-[10.5px] font-bold shrink-0"
                        style={{
                          backgroundColor: `${stage.color}15`,
                          color: stage.color,
                          border: `1px solid ${stage.color}40`,
                        }}
                      >
                        {stage.name} ({stage.probability_percent}%)
                      </span>
                    )}
                  </div>

                  {/* Valores Financeiros */}
                  <div className="p-[10px] rounded-[10px] bg-[var(--surface)] border border-[var(--line2)] grid grid-cols-2 gap-[8px]">
                    <div>
                      <span className="text-[10.5px] text-[var(--ds-muted)] block">MRR Mensal</span>
                      <span className="text-[13px] font-bold text-[#2f9e5a]">
                        {formatCurrency(deal.value_mrr)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10.5px] text-[var(--ds-muted)] block">Taxa de Setup</span>
                      <span className="text-[13px] font-bold text-[#0066FF]">
                        {formatCurrency(deal.value_setup)}
                      </span>
                    </div>
                  </div>

                  {/* Informações Complementares */}
                  <div className="flex flex-col gap-[4px] text-[11.5px] text-[var(--ds-muted)]">
                    {deal.assigned_member_name && (
                      <div className="flex items-center gap-[5px]">
                        <User className="w-3.5 h-3.5" />
                        <span>Responsável: {deal.assigned_member_name}</span>
                      </div>
                    )}
                    {deal.expected_close_date && (
                      <div className="flex items-center gap-[5px]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Previsão: {deal.expected_close_date.split('T')[0]}</span>
                      </div>
                    )}
                    {deal.notes && (
                      <p className="text-[11px] line-clamp-2 mt-[2px]">
                        {deal.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Rodapé de Ações */}
                <div className="flex items-center justify-between gap-[8px] pt-[8px] border-t border-[var(--line2)]">
                  {deal.lead_id ? (
                    <a
                      href={`/atendimento?leadId=${encodeURIComponent(deal.lead_id)}`}
                      className="h-[30px] px-[10px] rounded-[8px] bg-[#2f9e5a]/10 hover:bg-[#2f9e5a] text-[#2f9e5a] hover:text-white border border-[#2f9e5a]/30 text-[11px] font-semibold flex items-center gap-[4px] transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat WhatsApp</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-[var(--ds-muted)]">Sem chat vinculado</span>
                  )}

                  <Link
                    href="/comercial"
                    className="h-[30px] px-[10px] rounded-[8px] hover:bg-[var(--surface)] text-[11.5px] font-medium text-[var(--fg)] flex items-center gap-[4px] transition-colors"
                  >
                    <span>Abrir no Funil</span>
                    <ArrowUpRight className="w-3 h-3 text-[var(--ds-muted)]" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

