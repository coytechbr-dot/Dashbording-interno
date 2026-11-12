'use client'

import React, { useState } from 'react'
import { Plus, Sparkles, Megaphone, Trash2, X } from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'

const INACTIVITY_BUCKETS = [
  {
    bucket: '7 dias sem interação',
    count: 68,
    rule: 'Mensagem amigável + lembrete de proposta aberta',
    recovered: '31%',
  },
  {
    bucket: '15 dias inativo',
    count: 44,
    rule: 'Condição especial liberada por 24h no WhatsApp',
    recovered: '24%',
  },
  {
    bucket: '30 dias inativo',
    count: 29,
    rule: 'Bônus estratégico + diagnóstico gratuito',
    recovered: '19%',
  },
  {
    bucket: '60 dias (risco de churn)',
    count: 51,
    rule: 'Oferta de reativação direta com especialista',
    recovered: '14%',
  },
]

export default function MarketingPage() {
  const {
    marketingBlasts,
    createMarketingBlast,
    deleteMarketingBlast,
    orgSettings,
    updateOrgSettings,
  } = useCoyDash()

  const [showBlastModal, setShowBlastModal] = useState(false)
  const [blastName, setBlastName] = useState('')
  const [segmentLabel, setSegmentLabel] = useState('Clientes VIP (> 5 contratos)')
  const [scheduledFor, setScheduledFor] = useState('Hoje · 18:00')
  const [deliveredCount, setDeliveredCount] = useState('420')

  const totalConversions = marketingBlasts.reduce((a, b) => a + b.conversions_count, 0)

  const handleCreateBlast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!blastName.trim()) return
    const deliv = Number(deliveredCount) || 350
    const read = Math.round(deliv * 0.84)
    const conv = Math.round(deliv * 0.14)

    await createMarketingBlast({
      campaign_name: blastName.trim(),
      segment_label: segmentLabel,
      scheduled_for: scheduledFor,
      delivered_count: deliv,
      read_count: read,
      conversions_count: conv,
    })
    setBlastName('')
    setShowBlastModal(false)
  }

  const handleSeedBlasts = async () => {
    await createMarketingBlast({
      campaign_name: 'Reativação Base Inativa 30d · Condição Exclusiva',
      segment_label: 'Inativos há 30 dias',
      scheduled_for: 'Enviado · Ontem 18:30',
      delivered_count: 480,
      read_count: 412,
      conversions_count: 64,
    })
    await createMarketingBlast({
      campaign_name: 'Convite QBR & Apresentação de Novos Agentes IA',
      segment_label: 'Clientes Ativos (Promotores NPS 9-10)',
      scheduled_for: 'Enviado · Segunda 09:00',
      delivered_count: 310,
      read_count: 284,
      conversions_count: 49,
    })
    await createMarketingBlast({
      campaign_name: 'Campanha Relâmpago Fechamento de Mês',
      segment_label: 'Leads Qualificados no CRM',
      scheduled_for: 'Programado · Sexta 17:00',
      delivered_count: 620,
      read_count: 530,
      conversions_count: 78,
    })
  }

  return (
    <div className="px-[26px] pt-[18px] pb-[40px] flex flex-col gap-[16px]">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.5px]">Marketing & Recuperação</h1>
          <p className="text-[13px] text-[var(--ds-muted)]">
            Campanhas de WhatsApp em massa, recuperação automática de inativos e fidelização
          </p>
        </div>

        <div className="flex items-center gap-[10px]">
          {marketingBlasts.length === 0 && (
            <button
              type="button"
              onClick={handleSeedBlasts}
              className="h-[38px] px-[16px] rounded-full bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[12.5px] font-medium flex items-center gap-[6px] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>Carregar disparos de exemplo</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowBlastModal(true)}
            className="h-[38px] px-[18px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-[13px] flex items-center gap-[6px] cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2.4} />
            <span>Novo disparo</span>
          </button>
        </div>
      </div>

      {/* 4 KPIS DE MARKETING */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[12px]">
        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[14px] p-[18px]">
          <div className="text-[12px] text-[var(--ds-muted)]">Clientes recuperados (7d)</div>
          <div className="text-[26px] font-bold mt-[4px]">{39 + totalConversions}</div>
          <div className="text-[11.5px] text-[#2f9e5a] font-semibold mt-[4px]">
            +22% vs semana anterior
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[14px] p-[18px]">
          <div className="text-[12px] text-[var(--ds-muted)]">Receita de recuperação</div>
          <div className="text-[26px] font-bold mt-[4px]">R$ 4.820</div>
          <div className="text-[11.5px] text-[#2f9e5a] font-semibold mt-[4px]">
            Sem custo de comissão de marketplace
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[14px] p-[18px]">
          <div className="text-[12px] text-[var(--ds-muted)]">Taxa de abertura WhatsApp</div>
          <div className="text-[26px] font-bold mt-[4px]">86%</div>
          <div className="text-[11.5px] text-[var(--ds-muted)] mt-[4px]">
            Média de leitura em 4 minutos
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[14px] p-[18px]">
          <div className="text-[12px] text-[var(--ds-muted)]">Cashback ativo em carteira</div>
          <div className="text-[26px] font-bold text-[#0066FF] mt-[4px]">R$ 1.240</div>
          <div className="text-[11.5px] text-[var(--ds-muted)] mt-[4px]">
            78% voltam a fechar em 10 dias
          </div>
        </div>
      </div>

      {/* RECUPERAÇÃO DE INATIVOS + TABELA DE DISPAROS EM MASSA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[14px]">
        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[20px] flex flex-col gap-[12px]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold">Recuperação automática de inativos</h2>
              <p className="text-[11.5px] text-[var(--ds-muted)]">
                Réguas de WhatsApp acionadas automaticamente pelo Agente IA
              </p>
            </div>
            <span className="px-[10px] py-[4px] rounded-full bg-[#2f9e5a]/15 text-[#2f9e5a] text-[11px] font-semibold">
              Rodando 24h
            </span>
          </div>

          <div className="flex flex-col gap-[8px]">
            {INACTIVITY_BUCKETS.map((b, idx) => (
              <div
                key={idx}
                className="bg-[var(--bg)] border border-[var(--line2)] rounded-[12px] p-[14px] flex items-center justify-between gap-[10px]"
              >
                <div>
                  <div className="text-[13px] font-bold">
                    {b.bucket}{' '}
                    <span className="text-[var(--ds-muted)] font-normal">
                      ({b.count} clientes)
                    </span>
                  </div>
                  <div className="text-[11.5px] text-[var(--ds-muted)] mt-[2px]">{b.rule}</div>
                </div>
                <span className="px-[10px] py-[4px] rounded-full bg-[#2f9e5a]/15 text-[#2f9e5a] text-[11px] font-semibold shrink-0">
                  {b.recovered} voltam
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[20px] flex flex-col gap-[12px]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold">Disparos em massa (WhatsApp Oficial)</h2>
              <p className="text-[11.5px] text-[var(--ds-muted)]">
                Campanhas segmentadas com proteção anti-banimento Meta Cloud API
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowBlastModal(true)}
              className="h-[32px] px-[12px] rounded-full bg-[var(--bg)] hover:bg-[#0066FF] hover:text-white border border-[var(--line2)] text-[11.5px] font-semibold cursor-pointer transition-colors"
            >
              + Criar campanha
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b border-[var(--line)] text-[10.5px] uppercase text-[var(--ds-muted)]">
                  <th className="py-[10px] px-[8px]">Campanha</th>
                  <th className="py-[10px] px-[8px]">Segmento</th>
                  <th className="py-[10px] px-[8px]">Entregues</th>
                  <th className="py-[10px] px-[8px]">Lidos</th>
                  <th className="py-[10px] px-[8px]">Conversões</th>
                  <th className="py-[10px] px-[8px]"></th>
                </tr>
              </thead>
              <tbody>
                {marketingBlasts.map((b) => (
                  <tr key={b.id} className="border-b border-[var(--line)]">
                    <td className="py-[10px] px-[8px]">
                      <div className="font-bold">{b.campaign_name}</div>
                      <div className="text-[10.5px] text-[var(--ds-muted)]">{b.scheduled_for}</div>
                    </td>
                    <td className="py-[10px] px-[8px] text-[var(--ds-muted)]">{b.segment_label}</td>
                    <td className="py-[10px] px-[8px]">{b.delivered_count}</td>
                    <td className="py-[10px] px-[8px]">{b.read_count}</td>
                    <td className="py-[10px] px-[8px]">
                      <span className="px-[8px] py-[2px] rounded-full bg-[#2f9e5a]/15 text-[#2f9e5a] text-[11px] font-semibold">
                        {b.conversions_count} vendas
                      </span>
                    </td>
                    <td className="py-[10px] px-[8px] text-right">
                      <button
                        type="button"
                        onClick={() => deleteMarketingBlast(b.id)}
                        className="text-[var(--ds-muted)] hover:text-[#ef4444] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2 CARDS DE AUTOMAÇÃO NO RODAPÉ (CASHBACK + CUPOM DA FOME / PICO) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[14px]">
        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[20px] flex items-center justify-between gap-[14px]">
          <div>
            <h3 className="text-[15px] font-bold">
              Cashback automático ({orgSettings.cashback_percent}% em cada contrato/pedido)
            </h3>
            <p className="text-[12px] text-[var(--ds-muted)] mt-[2px]">
              Creditado automaticamente na carteira do cliente e avisado via WhatsApp
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              updateOrgSettings({ cashback_enabled: !orgSettings.cashback_enabled })
            }
            className={`h-[36px] px-[16px] rounded-full text-[12px] font-semibold cursor-pointer transition-colors shrink-0 ${
              orgSettings.cashback_enabled
                ? 'bg-[#0066FF] text-white'
                : 'bg-[var(--bg)] border border-[var(--line2)] text-[var(--ds-muted)]'
            }`}
          >
            {orgSettings.cashback_enabled ? 'Ativo (5%)' : 'Pausado'}
          </button>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[20px] flex items-center justify-between gap-[14px]">
          <div>
            <h3 className="text-[15px] font-bold">Gatilho Automático de Horário de Pico (18h30)</h3>
            <p className="text-[12px] text-[var(--ds-muted)] mt-[2px]">
              Dispara condição relâmpago para clientes com maior probabilidade de compra hoje
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              updateOrgSettings({
                hunger_coupon_enabled: !orgSettings.hunger_coupon_enabled,
              })
            }
            className={`h-[36px] px-[16px] rounded-full text-[12px] font-semibold cursor-pointer transition-colors shrink-0 ${
              orgSettings.hunger_coupon_enabled
                ? 'bg-[#0066FF] text-white'
                : 'bg-[var(--bg)] border border-[var(--line2)] text-[var(--ds-muted)]'
            }`}
          >
            {orgSettings.hunger_coupon_enabled ? 'Programado 18h30' : 'Desativado'}
          </button>
        </div>
      </div>

      {/* MODAL NOVO DISPARO */}
      {showBlastModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-[18px]">
          <form
            onSubmit={handleCreateBlast}
            className="w-full max-w-[440px] bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] p-[22px] flex flex-col gap-[12px]"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold">Novo disparo WhatsApp Oficial</h2>
              <button
                type="button"
                onClick={() => setShowBlastModal(false)}
                className="w-[30px] h-[30px] rounded-full bg-[var(--bg)] grid place-items-center text-[var(--ds-muted)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="flex flex-col gap-[4px] text-[12px] text-[var(--ds-muted)]">
              Nome da campanha *
              <input
                value={blastName}
                onChange={(e) => setBlastName(e.target.value)}
                required
                placeholder="Ex: Oferta Especial de Renovação Semestral"
                className="h-[40px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
              />
            </label>

            <label className="flex flex-col gap-[4px] text-[12px] text-[var(--ds-muted)]">
              Segmento de público
              <select
                value={segmentLabel}
                onChange={(e) => setSegmentLabel(e.target.value)}
                className="h-[40px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
              >
                <option value="Clientes VIP (> 5 contratos)">Clientes VIP (&gt; 5 contratos)</option>
                <option value="Inativos há 15 dias">Inativos há 15 dias</option>
                <option value="Inativos há 30 dias">Inativos há 30 dias</option>
                <option value="Toda a base ativa">Toda a base ativa</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-[10px]">
              <label className="flex flex-col gap-[4px] text-[12px] text-[var(--ds-muted)]">
                Horário do envio
                <input
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="h-[40px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>
              <label className="flex flex-col gap-[4px] text-[12px] text-[var(--ds-muted)]">
                Contatos estimados
                <input
                  type="number"
                  value={deliveredCount}
                  onChange={(e) => setDeliveredCount(e.target.value)}
                  className="h-[40px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>
            </div>

            <button
              type="submit"
              className="h-[44px] rounded-full bg-[#0066FF] text-white font-semibold text-[13px] cursor-pointer mt-[4px]"
            >
              Disparar campanha
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

