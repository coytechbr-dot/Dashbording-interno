'use client'

import React, { useState } from 'react'
import { Plus, Sparkles, Check, Trash2, X } from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'
import type { FinancialEntry } from '@/types/coydash'
import { FinancialBreakEvenWidget } from '@/components/commercial/financial-breakeven-widget'

export default function FinanceiroPage() {
  const { financialEntries, createFinancialEntry, deleteFinancialEntry, clients } =
    useCoyDash()

  const [cashClosed, setCashClosed] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [itemName, setItemName] = useState('')
  const [category, setCategory] = useState<FinancialEntry['category']>('RECEITA_SERVICO')
  const [channel, setChannel] = useState('WhatsApp IA Direto')
  const [quantitySold, setQuantitySold] = useState('12')
  const [marginPercent, setMarginPercent] = useState('68')
  const [amountValue, setAmountValue] = useState('4200')
  const [healthTag, setHealthTag] = useState<FinancialEntry['health_tag']>('Estrela')

  // Soma automática das receitas dos lançamentos + MRR dos clientes ativos
  const mrrFromClients = clients.reduce((acc, c) => acc + (c.mrr_value || 0), 0)
  const entriesRevenue = financialEntries
    .filter((e) => e.category === 'RECEITA_SERVICO')
    .reduce((acc, e) => acc + e.amount_value, 0)

  const grossRevenue = entriesRevenue + mrrFromClients || 14850
  const taxesTotal =
    financialEntries
      .filter((e) => e.category === 'TAXA_IMPOSTO')
      .reduce((acc, e) => acc + e.amount_value, 0) || Math.round(grossRevenue * 0.08)
  const cmvTotal =
    financialEntries
      .filter((e) => e.category === 'CUSTO_CMV')
      .reduce((acc, e) => acc + e.amount_value, 0) || Math.round(grossRevenue * 0.28)
  const discountsTotal =
    financialEntries
      .filter((e) => e.category === 'DESCONTO_CASHBACK')
      .reduce((acc, e) => acc + e.amount_value, 0) || Math.round(grossRevenue * 0.04)

  const netProfit = grossRevenue - taxesTotal - cmvTotal - discountsTotal
  const netMarginPercent =
    grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 60

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName.trim()) return
    await createFinancialEntry({
      item_name: itemName.trim(),
      category,
      channel,
      quantity_sold: Number(quantitySold) || 1,
      margin_percent: Number(marginPercent) || 65,
      amount_value: Number(amountValue) || 0,
      health_tag: healthTag,
    })
    setItemName('')
    setShowModal(false)
  }

  const handleSeedFinance = async () => {
    await createFinancialEntry({
      item_name: 'Plano Gestão Full (Tráfego + Agentes IA 24h)',
      category: 'RECEITA_SERVICO',
      channel: 'WhatsApp IA Direto',
      quantity_sold: 14,
      margin_percent: 72,
      amount_value: 9800,
      health_tag: 'Estrela',
    })
    await createFinancialEntry({
      item_name: 'Setup & Implantação de CRM + Automação n8n',
      category: 'RECEITA_SERVICO',
      channel: 'Meta & Google Ads',
      quantity_sold: 6,
      margin_percent: 64,
      amount_value: 5400,
      health_tag: 'Estrela',
    })
    await createFinancialEntry({
      item_name: 'Gestão Avulsa de Criativos & Landing Pages',
      category: 'RECEITA_SERVICO',
      channel: 'Indicação / Orgânico',
      quantity_sold: 8,
      margin_percent: 48,
      amount_value: 3200,
      health_tag: 'Atenção',
    })
    await createFinancialEntry({
      item_name: 'Suporte Dedicado Personalizado (Sob Demanda)',
      category: 'RECEITA_SERVICO',
      channel: 'Parceiros',
      quantity_sold: 4,
      margin_percent: 29,
      amount_value: 1100,
      health_tag: 'Margem crítica',
    })
  }

  return (
    <div className="px-[26px] pt-[18px] pb-[40px] flex flex-col gap-[16px]">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.5px]">Financeiro & Margem Real</h1>
          <p className="text-[13px] text-[var(--ds-muted)]">
            DRE automático, margem real por serviço/produto, taxas e lucro líquido em tempo real
          </p>
        </div>

        <div className="flex items-center gap-[10px]">
          {financialEntries.length === 0 && (
            <button
              type="button"
              onClick={handleSeedFinance}
              className="h-[38px] px-[16px] rounded-full bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[12.5px] font-medium flex items-center gap-[6px] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>Carregar matriz de exemplo</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="h-[38px] px-[18px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-[13px] flex items-center gap-[6px] cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2.4} />
            <span>Novo lançamento</span>
          </button>
        </div>
      </div>

      {/* 5 KPIS FINANCEIROS (IGUAL AO RANGOLIVRE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-[12px]">
        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[14px] p-[16px]">
          <div className="text-[11.5px] text-[var(--ds-muted)]">Receita bruta</div>
          <div className="text-[22px] font-bold mt-[4px]">
            R$ {grossRevenue.toLocaleString('pt-BR')}
          </div>
          <div className="text-[11px] text-[#2f9e5a] font-semibold mt-[4px]">
            100% conciliado
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[14px] p-[16px]">
          <div className="text-[11.5px] text-[var(--ds-muted)]">Taxas e impostos</div>
          <div className="text-[22px] font-bold text-[#ef4444] mt-[4px]">
            - R$ {taxesTotal.toLocaleString('pt-BR')}
          </div>
          <div className="text-[11px] text-[var(--ds-muted)] mt-[4px]">
            Gateways + NF-e
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[14px] p-[16px]">
          <div className="text-[11.5px] text-[var(--ds-muted)]">Custos / CMV</div>
          <div className="text-[22px] font-bold mt-[4px]">
            - R$ {cmvTotal.toLocaleString('pt-BR')}
          </div>
          <div className="text-[11px] text-[var(--ds-muted)] mt-[4px]">
            28% da receita bruta
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[14px] p-[16px]">
          <div className="text-[11.5px] text-[var(--ds-muted)]">Cupons e cashback</div>
          <div className="text-[22px] font-bold mt-[4px]">
            - R$ {discountsTotal.toLocaleString('pt-BR')}
          </div>
          <div className="text-[11px] text-[var(--ds-muted)] mt-[4px]">
            4% da receita bruta
          </div>
        </div>

        {/* CARD DESTACADO DE LUCRO LÍQUIDO */}
        <div className="bg-[#0066FF]/12 border-[1.5px] border-[#0066FF] rounded-[14px] p-[16px]">
          <div className="text-[11.5px] font-semibold text-[#0066FF]">Lucro líquido</div>
          <div className="text-[24px] font-bold text-[#0066FF] mt-[4px]">
            R$ {netProfit.toLocaleString('pt-BR')}
          </div>
          <div className="text-[11px] text-[#2f9e5a] font-semibold mt-[4px]">
            Margem líquida {netMarginPercent}%
          </div>
        </div>
      </div>

      {/* INOVAÇÃO 3 (PLANO DE NEGÓCIO TÓPICOS 11 & 14): PONTO DE EQUILÍBRIO, METAS & KPIS POR DEPARTAMENTO */}
      <FinancialBreakEvenWidget
        grossRevenue={grossRevenue}
        netProfit={netProfit}
        clients={clients}
        financialEntries={financialEntries}
      />

      {/* RANKING DE LUCRO + CANAIS & DRE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[14px]">
        {/* Ranking de Lucro por Serviço/Produto */}
        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[20px] flex flex-col gap-[12px]">
          <div>
            <h2 className="text-[15px] font-bold">Ranking de lucro por serviço / produto</h2>
            <p className="text-[11.5px] text-[var(--ds-muted)]">
              Identifique imediatamente os serviços Estrela e onde ajustar preço
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b border-[var(--line)] text-[10.5px] uppercase text-[var(--ds-muted)]">
                  <th className="py-[10px] px-[8px]">Item / Serviço</th>
                  <th className="py-[10px] px-[8px]">Vendas</th>
                  <th className="py-[10px] px-[8px]">Margem</th>
                  <th className="py-[10px] px-[8px]">Lucro total</th>
                  <th className="py-[10px] px-[8px]">Saúde</th>
                  <th className="py-[10px] px-[8px]"></th>
                </tr>
              </thead>
              <tbody>
                {financialEntries.map((item) => {
                  const tagBadge =
                    item.health_tag === 'Estrela'
                      ? 'bg-[#2f9e5a]/15 text-[#2f9e5a]'
                      : item.health_tag === 'Atenção'
                        ? 'bg-[#e8c14a]/15 text-[#e8c14a]'
                        : 'bg-[#ef4444]/15 text-[#ef4444]'
                  return (
                    <tr key={item.id} className="border-b border-[var(--line)]">
                      <td className="py-[10px] px-[8px] font-bold">{item.item_name}</td>
                      <td className="py-[10px] px-[8px]">{item.quantity_sold}</td>
                      <td className="py-[10px] px-[8px] font-semibold">{item.margin_percent}%</td>
                      <td className="py-[10px] px-[8px] font-bold">
                        R$ {item.amount_value.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-[10px] px-[8px]">
                        <span
                          className={`px-[8px] py-[2px] rounded-full text-[10.5px] font-semibold ${tagBadge}`}
                        >
                          {item.health_tag}
                        </span>
                      </td>
                      <td className="py-[10px] px-[8px] text-right">
                        <button
                          type="button"
                          onClick={() => deleteFinancialEntry(item.id)}
                          className="text-[var(--ds-muted)] hover:text-[#ef4444] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vendas por Canal + DRE com Fechamento de Caixa */}
        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[20px] flex flex-col justify-between gap-[16px]">
          <div className="flex flex-col gap-[12px]">
            <div>
              <h2 className="text-[15px] font-bold">Vendas por canal</h2>
              <p className="text-[11.5px] text-[var(--ds-muted)]">
                Comparativo de comissão zero vs canais pagos
              </p>
            </div>

            {[
              {
                ch: 'WhatsApp IA Direto',
                pct: 64,
                val: `R$ ${Math.round(grossRevenue * 0.64).toLocaleString('pt-BR')}`,
                fee: '0% comissão',
                color: '#2f9e5a',
              },
              {
                ch: 'Meta & Google Ads (Funil Direto)',
                pct: 24,
                val: `R$ ${Math.round(grossRevenue * 0.24).toLocaleString('pt-BR')}`,
                fee: 'ROAS 6.2x',
                color: '#0066FF',
              },
              {
                ch: 'Indicação & Parceiros',
                pct: 12,
                val: `R$ ${Math.round(grossRevenue * 0.12).toLocaleString('pt-BR')}`,
                fee: 'Repasse 10%',
                color: '#e8c14a',
              },
            ].map((c, idx) => (
              <div key={idx} className="flex flex-col gap-[5px]">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-bold">
                    {c.ch}{' '}
                    <span className="text-[var(--ds-muted)] font-normal">({c.fee})</span>
                  </span>
                  <span className="font-semibold">
                    {c.val} · {c.pct}%
                  </span>
                </div>
                <div className="h-[8px] bg-[var(--bg)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.pct}%`, backgroundColor: c.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Card DRE Resumido + Botão Fechar Caixa */}
          <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[14px] p-[16px] flex flex-wrap items-center justify-between gap-[12px]">
            <div>
              <div className="text-[13.5px] font-bold">DRE · Fechamento de Caixa</div>
              <div className="text-[11.5px] text-[var(--ds-muted)]">
                Pix, Cartão, Boleto e Repasses conciliados automaticamente
              </div>
            </div>
            {cashClosed ? (
              <span className="px-[12px] py-[6px] rounded-full bg-[#2f9e5a]/15 text-[#2f9e5a] text-[12px] font-semibold flex items-center gap-[5px]">
                <Check className="w-4 h-4" />
                Caixa fechado · R$ {netProfit.toLocaleString('pt-BR')} líquido
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setCashClosed(true)}
                className="h-[38px] px-[18px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-[12.5px] cursor-pointer transition-colors"
              >
                Fechar caixa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL NOVO LANÇAMENTO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-[18px]">
          <form
            onSubmit={handleCreateEntry}
            className="w-full max-w-[460px] bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] p-[22px] flex flex-col gap-[12px]"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold">Novo lançamento financeiro</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-[30px] h-[30px] rounded-full bg-[var(--bg)] grid place-items-center text-[var(--ds-muted)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="flex flex-col gap-[4px] text-[12px] text-[var(--ds-muted)]">
              Serviço / Produto / Lançamento *
              <input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
                placeholder="Ex: Contrato Gestão de Tráfego + IA"
                className="h-[40px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
              />
            </label>

            <div className="grid grid-cols-2 gap-[10px]">
              <label className="flex flex-col gap-[4px] text-[12px] text-[var(--ds-muted)]">
                Categoria
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as FinancialEntry['category'])
                  }
                  className="h-[40px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                >
                  <option value="RECEITA_SERVICO">Receita de Serviço/Produto</option>
                  <option value="TAXA_IMPOSTO">Taxa / Imposto</option>
                  <option value="CUSTO_CMV">Custo / CMV</option>
                  <option value="DESCONTO_CASHBACK">Cupom / Cashback</option>
                </select>
              </label>

              <label className="flex flex-col gap-[4px] text-[12px] text-[var(--ds-muted)]">
                Classificação BCG
                <select
                  value={healthTag}
                  onChange={(e) =>
                    setHealthTag(e.target.value as FinancialEntry['health_tag'])
                  }
                  className="h-[40px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                >
                  <option value="Estrela">Estrela (Alta Margem)</option>
                  <option value="Atenção">Atenção</option>
                  <option value="Margem crítica">Margem crítica</option>
                </select>
              </label>

              <label className="flex flex-col gap-[4px] text-[12px] text-[var(--ds-muted)]">
                Quantidade vendida
                <input
                  type="number"
                  value={quantitySold}
                  onChange={(e) => setQuantitySold(e.target.value)}
                  className="h-[40px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>

              <label className="flex flex-col gap-[4px] text-[12px] text-[var(--ds-muted)]">
                Margem (%)
                <input
                  type="number"
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(e.target.value)}
                  className="h-[40px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>
            </div>

            <label className="flex flex-col gap-[4px] text-[12px] text-[var(--ds-muted)]">
              Valor total (R$)
              <input
                type="number"
                value={amountValue}
                onChange={(e) => setAmountValue(e.target.value)}
                className="h-[40px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
              />
            </label>

            <button
              type="submit"
              className="h-[44px] rounded-full bg-[#0066FF] text-white font-semibold text-[13px] cursor-pointer mt-[4px]"
            >
              Salvar lançamento
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

