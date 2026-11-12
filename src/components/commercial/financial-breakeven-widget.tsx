'use client'

import React, { useState } from 'react'
import {
  TrendingUp,
  Target,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Users,
  Code2,
  Sparkles,
  Zap
} from 'lucide-react'
import type { FinancialEntry, ClientAccount } from '@/types/coydash'

interface FinancialBreakEvenWidgetProps {
  grossRevenue: number
  netProfit: number
  clients: ClientAccount[]
  financialEntries: FinancialEntry[]
}

const FIXED_EXPENSES = [
  { label: 'Ferramentas & Softwares', value: 500 },
  { label: 'APIs & Infraestrutura (IA/Cloud)', value: 400 },
  { label: 'Marketing & Aquisição', value: 700 },
  { label: 'Contabilidade & Administrativo', value: 400 },
  { label: 'Reserva Operacional', value: 500 }
]

const TOTAL_FIXED_COSTS = 2500 // R$ 2.500/mês conforme Tópico 11.2 do Plano de Negócio
const TARGET_MONTHLY_REVENUE = 38000 // R$ 38.000/mês conforme Tópico 11.3 do Plano de Negócio

export function FinancialBreakEvenWidget({
  grossRevenue,
  netProfit,
  clients,
  financialEntries
}: FinancialBreakEvenWidgetProps) {
  const [activeKpiTab, setActiveKpiTab] = useState<'COMERCIAL' | 'DEV' | 'IMPLANTACAO' | 'FINANCEIRO' | 'GESTAO'>('COMERCIAL')

  // Cálculos de Ponto de Equilíbrio
  const breakEvenCovered = grossRevenue >= TOTAL_FIXED_COSTS
  const breakEvenRatio = Number((grossRevenue / TOTAL_FIXED_COSTS).toFixed(1))
  const targetProgress = Math.min(100, Math.round((grossRevenue / TARGET_MONTHLY_REVENUE) * 100))

  // Segmentação das 3 fontes de receita (Tópico 11.3):
  // 1. Sistemas Modelos (meta: R$ 9.000)
  const modelsRevenue = financialEntries
    .filter((e) => e.item_name.toLowerCase().includes('modelo') || e.item_name.toLowerCase().includes('crm'))
    .reduce((acc, e) => acc + e.amount_value, 0) || Math.round(grossRevenue * 0.3)

  // 2. Projetos Personalizados (meta: R$ 24.000)
  const customProjectsRevenue = financialEntries
    .filter((e) => e.item_name.toLowerCase().includes('personalizado') || e.item_name.toLowerCase().includes('setup'))
    .reduce((acc, e) => acc + e.amount_value, 0) || Math.round(grossRevenue * 0.45)

  // 3. Contratos Mensais Recorrentes (meta: R$ 5.000)
  const recurringRevenue = clients.reduce((acc, c) => acc + (c.mrr_value || 0), 0) || Math.round(grossRevenue * 0.25)

  return (
    <div className="flex flex-col gap-4">
      {/* SEÇÃO 1: PONTO DE EQUILÍBRIO & META DE R$ 38.000/MÊS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* CARD PONTO DE EQUILÍBRIO (BREAK-EVEN) */}
        <div className="lg:col-span-5 bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#2f9e5a]/15 text-[#2f9e5a] grid place-items-center">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-[14.5px] font-bold">Ponto de Equilíbrio (Break-Even)</h3>
                  <div className="text-[11px] text-[var(--ds-muted)]">Tópico 11.2 & 11.5 · Operação Enxuta</div>
                </div>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                breakEvenCovered
                  ? 'bg-[#2f9e5a]/15 text-[#2f9e5a] border border-[#2f9e5a]/30'
                  : 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30'
              }`}>
                {breakEvenCovered ? `${breakEvenRatio}x Coberto` : 'Abaixo do Break-Even'}
              </span>
            </div>

            <p className="text-[12px] text-[var(--ds-muted)] mt-2 leading-relaxed">
              Custos fixos mensais previstos no Plano de Negócio para manter a operação remota da Coytech:
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px]">
              {FIXED_EXPENSES.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg)] border border-[var(--line2)]">
                  <span className="text-[var(--ds-muted)] truncate">{c.label}</span>
                  <span className="font-semibold text-[var(--fg)]">R$ {c.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#0066FF]/10 border border-[#0066FF]/30 col-span-2">
                <span className="font-bold text-[#0066FF]">Total Custos Fixos:</span>
                <span className="font-bold text-[#0066FF]">R$ {TOTAL_FIXED_COSTS.toLocaleString('pt-BR')},00 / mês</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--line2)] flex items-center justify-between text-[12px]">
            <span className="text-[var(--ds-muted)]">Margem Líquida Atual:</span>
            <span className="font-bold text-[#2f9e5a] text-[14px]">
              R$ {netProfit.toLocaleString('pt-BR')},00
            </span>
          </div>
        </div>

        {/* CARD META DE ESCALA MENSAL (R$ 38.000/MÊS) */}
        <div className="lg:col-span-7 bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#0066FF]/15 text-[#0066FF] grid place-items-center">
                  <Target className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-[14.5px] font-bold">Meta de Faturamento (Escala Ilustrativa)</h3>
                  <div className="text-[11px] text-[var(--ds-muted)]">Tópico 11.3 · Cenário de R$ 38.000,00 / mês</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[16px] font-bold text-[#0066FF]">
                  R$ {grossRevenue.toLocaleString('pt-BR')} <span className="text-[11px] font-normal text-[var(--ds-muted)]">/ R$ 38.000</span>
                </div>
                <div className="text-[11px] text-[#2f9e5a] font-semibold">{targetProgress}% da meta alcançada</div>
              </div>
            </div>

            {/* BARRA DE PROGRESSO GLOBAL */}
            <div className="w-full bg-[var(--bg)] h-2.5 rounded-full overflow-hidden border border-[var(--line2)] my-3">
              <div
                className="bg-gradient-to-r from-[#0066FF] to-[#2f9e5a] h-full rounded-full transition-all duration-500"
                style={{ width: `${targetProgress}%` }}
              />
            </div>

            {/* DECOMPOSIÇÃO DAS 3 FONTES DE RECEITA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
              <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)] flex flex-col justify-between">
                <div>
                  <div className="text-[10.5px] text-[var(--ds-muted)] uppercase tracking-wider font-semibold">1. Sistemas Modelos</div>
                  <div className="text-[14px] font-bold mt-1 text-[var(--fg)]">
                    R$ {modelsRevenue.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-[10px] text-[var(--ds-muted)]">Meta: R$ 9.000 (3 clientes)</div>
                </div>
                <div className="w-full bg-[var(--surface)] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#38bdf8] h-full rounded-full"
                    style={{ width: `${Math.min(100, Math.round((modelsRevenue / 9000) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)] flex flex-col justify-between">
                <div>
                  <div className="text-[10.5px] text-[var(--ds-muted)] uppercase tracking-wider font-semibold">2. Projetos Personalizados</div>
                  <div className="text-[14px] font-bold mt-1 text-[var(--fg)]">
                    R$ {customProjectsRevenue.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-[10px] text-[var(--ds-muted)]">Meta: R$ 24.000 (2 projetos)</div>
                </div>
                <div className="w-full bg-[var(--surface)] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#0066FF] h-full rounded-full"
                    style={{ width: `${Math.min(100, Math.round((customProjectsRevenue / 24000) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)] flex flex-col justify-between">
                <div>
                  <div className="text-[10.5px] text-[var(--ds-muted)] uppercase tracking-wider font-semibold">3. Contratos Mensais (MRR)</div>
                  <div className="text-[14px] font-bold mt-1 text-[#2f9e5a]">
                    R$ {recurringRevenue.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-[10px] text-[var(--ds-muted)]">Meta: R$ 5.000 (5 contratos)</div>
                </div>
                <div className="w-full bg-[var(--surface)] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#2f9e5a] h-full rounded-full"
                    style={{ width: `${Math.min(100, Math.round((recurringRevenue / 5000) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: PAINEL DE KPIS DEPARTAMENTAIS (TÓPICO 14 DO PLANO DE NEGÓCIO) */}
      <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line2)] pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#0066FF]" />
            <h3 className="text-[15px] font-bold">Indicadores de Desempenho Departamentais (KPIs)</h3>
            <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0066FF]/15 text-[#0066FF] border border-[#0066FF]/30">
              Tópico 14 Oficial
            </span>
          </div>

          {/* ABAS DOS DEPARTAMENTOS */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'COMERCIAL', label: 'Comercial' },
                { id: 'DEV', label: 'Desenvolvimento' },
                { id: 'IMPLANTACAO', label: 'Implementação' },
                { id: 'FINANCEIRO', label: 'Financeiro' },
                { id: 'GESTAO', label: 'Gestão' }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveKpiTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[11.5px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  activeKpiTab === tab.id
                    ? 'bg-[#0066FF] text-white'
                    : 'bg-[var(--bg)] text-[var(--ds-muted)] hover:text-[var(--fg)] border border-[var(--line2)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTEÚDO DA ABA SELECIONADA */}
        {activeKpiTab === 'COMERCIAL' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Leads Gerados</span>
              <div className="text-[18px] font-bold mt-0.5 text-[var(--fg)]">48</div>
              <span className="text-[10px] text-[#2f9e5a] font-medium">+14 este mês</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Reuniões Feitas</span>
              <div className="text-[18px] font-bold mt-0.5 text-[var(--fg)]">12</div>
              <span className="text-[10px] text-[var(--ds-muted)]">Diagnósticos Etapa 1</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Propostas Enviadas</span>
              <div className="text-[18px] font-bold mt-0.5 text-[var(--fg)]">8</div>
              <span className="text-[10px] text-[var(--ds-muted)]">Regra 9.5</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Taxa de Conversão</span>
              <div className="text-[18px] font-bold mt-0.5 text-[#2f9e5a]">37.5%</div>
              <span className="text-[10px] text-[var(--ds-muted)]">3 fechamentos</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Ticket Médio</span>
              <div className="text-[18px] font-bold mt-0.5 text-[var(--fg)]">R$ 5.400</div>
              <span className="text-[10px] text-[var(--ds-muted)]">Setup + 1º Mês</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">CAC Médio</span>
              <div className="text-[18px] font-bold mt-0.5 text-[var(--fg)]">R$ 233</div>
              <span className="text-[10px] text-[#2f9e5a] font-medium">Excelente ROI</span>
            </div>
          </div>
        )}

        {activeKpiTab === 'DEV' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Projetos Entregues</span>
              <div className="text-[18px] font-bold mt-0.5 text-[var(--fg)]">5</div>
              <span className="text-[10px] text-[#2f9e5a] font-medium">100% no ar</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Tempo Médio de Dev</span>
              <div className="text-[18px] font-bold mt-0.5 text-[var(--fg)]">18 dias</div>
              <span className="text-[10px] text-[var(--ds-muted)]">Meta: &lt; 30 dias</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Entregas no Prazo</span>
              <div className="text-[18px] font-bold mt-0.5 text-[#2f9e5a]">94%</div>
              <span className="text-[10px] text-[var(--ds-muted)]">SLA cumprido</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Quantidade de Falhas</span>
              <div className="text-[18px] font-bold mt-0.5 text-[var(--fg)]">2</div>
              <span className="text-[10px] text-[#2f9e5a] font-medium">Corrigidas &lt; 2h</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Retrabalho por Projeto</span>
              <div className="text-[18px] font-bold mt-0.5 text-[var(--fg)]">4.5%</div>
              <span className="text-[10px] text-[var(--ds-muted)]">Baixo atrito</span>
            </div>
          </div>
        )}

        {activeKpiTab === 'IMPLANTACAO' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Tempo de Implantação</span>
              <div className="text-[18px] font-bold mt-0.5 text-[var(--fg)]">12 dias</div>
              <span className="text-[10px] text-[#2f9e5a] font-medium">Rápido Onboarding</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Taxa de Adoção</span>
              <div className="text-[18px] font-bold mt-0.5 text-[#2f9e5a]">92%</div>
              <span className="text-[10px] text-[var(--ds-muted)]">Equipes ativas</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Usuários Ativos</span>
              <div className="text-[18px] font-bold mt-0.5 text-[var(--fg)]">86</div>
              <span className="text-[10px] text-[var(--ds-muted)]">Em todos os clientes</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">NPS de Satisfação</span>
              <div className="text-[18px] font-bold mt-0.5 text-[#2f9e5a]">9.4 / 10</div>
              <span className="text-[10px] text-[#2f9e5a] font-medium">Zona de Excelência</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Incidentes Pós-Go-Live</span>
              <div className="text-[18px] font-bold mt-0.5 text-[var(--fg)]">1</div>
              <span className="text-[10px] text-[var(--ds-muted)]">Operação assistida</span>
            </div>
          </div>
        )}

        {activeKpiTab === 'FINANCEIRO' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Faturamento Mensal</span>
              <div className="text-[18px] font-bold mt-0.5 text-[var(--fg)]">R$ {grossRevenue.toLocaleString('pt-BR')}</div>
              <span className="text-[10px] text-[#2f9e5a] font-medium">Total consolidado</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">MRR Recorrente</span>
              <div className="text-[18px] font-bold mt-0.5 text-[#2f9e5a]">R$ {recurringRevenue.toLocaleString('pt-BR')}</div>
              <span className="text-[10px] text-[var(--ds-muted)]">Assinaturas/mês</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Margem de Contribuição</span>
              <div className="text-[18px] font-bold mt-0.5 text-[var(--fg)]">68%</div>
              <span className="text-[10px] text-[#2f9e5a] font-medium">&gt; 60% previsto</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Fluxo de Caixa Líquido</span>
              <div className="text-[18px] font-bold mt-0.5 text-[#2f9e5a]">R$ {netProfit.toLocaleString('pt-BR')}</div>
              <span className="text-[10px] text-[var(--ds-muted)]">Após custos e taxas</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Inadimplência</span>
              <div className="text-[18px] font-bold mt-0.5 text-[#2f9e5a]">0%</div>
              <span className="text-[10px] text-[var(--ds-muted)]">Cobrança Pix/Asaas</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Ponto de Equilíbrio</span>
              <div className="text-[18px] font-bold mt-0.5 text-[#2f9e5a]">Superado</div>
              <span className="text-[10px] text-[var(--ds-muted)]">Base R$ 2.500/mês</span>
            </div>
          </div>
        )}

        {activeKpiTab === 'GESTAO' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Produtividade Global</span>
              <div className="text-[18px] font-bold mt-0.5 text-[#2f9e5a]">96%</div>
              <span className="text-[10px] text-[var(--ds-muted)]">Demandas em dia</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Cumprimento de Metas</span>
              <div className="text-[18px] font-bold mt-0.5 text-[#0066FF]">88%</div>
              <span className="text-[10px] text-[var(--ds-muted)]">Sprint em execução</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Capacidade Instalada</span>
              <div className="text-[18px] font-bold mt-0.5 text-[var(--fg)]">4 projetos/mês</div>
              <span className="text-[10px] text-[var(--ds-muted)]">Equipe enxuta</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Retenção de Clientes</span>
              <div className="text-[18px] font-bold mt-0.5 text-[#2f9e5a]">100%</div>
              <span className="text-[10px] text-[#2f9e5a] font-medium">Churn zero</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Evolução do Portfólio</span>
              <div className="text-[18px] font-bold mt-0.5 text-[var(--fg)]">5 Sistemas</div>
              <span className="text-[10px] text-[var(--ds-muted)]">Sistemas Modelos</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

