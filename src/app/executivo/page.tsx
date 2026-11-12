'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'
import {
  IllustrationFocusRoom,
  IllustrationAiAgents,
  IconRobot16,
} from '@/components/layout/roomie-illustrations'

export default function ExecutivoMobilePage() {
  const {
    authenticatedUser,
    currentOrg,
    currentPersona,
    agents,
    setActiveAgentDrawer,
    approvalQueues,
    decideApprovalOneClick,
    biaProcesses,
    incidents,
    weeklyReports,
    generateMonday8amReportNow,
    triggerSilentBusinessDropSimulation,
  } = useCoyDash()

  const pendingApprovals = approvalQueues.filter((q) => q.status === 'PENDING')
  const latestReport = weeklyReports[0]

  const totalRevenueProtected = incidents.reduce(
    (acc, inc) => acc + (inc.estimated_financial_loss_avoided || 0),
    0
  )
  const displayProtectedValue =
    totalRevenueProtected > 0
      ? totalRevenueProtected
      : latestReport?.revenue_protected_value || 0

  const firstName = authenticatedUser?.name
    ? authenticatedUser.name.split(' ')[0]
    : currentPersona.name.split(' ')[0]

  return (
    <div className="px-[26px] pb-[40px] flex flex-col lg:flex-row items-start gap-[32px]">
      {/* Coluna Explicativa à Esquerda (Visível no Desktop) */}
      <div className="flex-1 flex flex-col gap-[16px] pt-[6px]">
        <div className="text-[12px] text-[#0066FF] font-semibold">
          RF-PUL-004 · Dupla visão sincronizada (Painel Executivo Mobile PWA)
        </div>
        <h1 className="text-[28px] font-semibold tracking-[-0.8px]">
          Visão no celular da Diretoria Executiva (CEO &amp; COO)
        </h1>
        <p className="text-[13.5px] text-[var(--ds-muted)] leading-[1.5] max-w-[540px]">
          Conectado à mesma fonte de verdade do Painel Técnico NOC, este Web App Mobile (390×844) fica instalado na tela inicial do celular dos sócios mostrando faturamento por hora, conversão ao vivo, status da SEFAZ/Checkout e aprovação em 1 clique.
        </p>

        <div className="flex flex-wrap gap-[10px] pt-[6px]">
          <button
            onClick={triggerSilentBusinessDropSimulation}
            className="h-[42px] px-[18px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white text-[13px] font-semibold flex items-center gap-[12px] cursor-pointer transition-colors shadow-sm"
          >
            <span>Testar alerta de queda de 30% nas vendas no celular</span>
            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>

          <button
            onClick={generateMonday8amReportNow}
            className="h-[42px] px-[18px] rounded-full bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[13px] font-medium cursor-pointer transition-colors"
          >
            Gerar relatório semanal de Segunda 08h
          </button>
        </div>

        {/* Resumo do último relatório de Segunda às 08h */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[18px] flex flex-col gap-[8px] max-w-[540px] mt-[8px]">
          <div className="text-[14px] font-medium">
            Prova de valor toda segunda-feira às 08:00
          </div>
          {latestReport ? (
            <div className="text-[12px] text-[var(--ds-muted)]">
              Último disparo ({latestReport.week_start} a {latestReport.week_end}):{' '}
              <strong className="text-[var(--fg)]">
                {latestReport.total_automated_runs.toLocaleString('pt-BR')} execuções
              </strong>
              , <strong className="text-[var(--fg)]">{latestReport.total_hours_saved}h poupadas</strong> e{' '}
              <strong className="text-[#f0521f]">
                R$ {latestReport.revenue_protected_value.toLocaleString('pt-BR')} protegidos
              </strong>
              .
            </div>
          ) : (
            <div className="text-[12px] text-[var(--ds-muted)]">
              Nenhum relatório semanal consolidado ainda para{' '}
              <strong className="text-[var(--fg)]">{currentOrg.name}</strong>. Clique em &ldquo;Gerar relatório semanal de Segunda 08h&rdquo; acima para consolidar os dados reais da operação.
            </div>
          )}
        </div>
      </div>

      {/* MOLDURA MOBILE 390x844 (Exata do 1b · Mobile 390×844 de Escritorio Dashboard.dc.html) */}
      <div className="mx-auto p-[10px] bg-[#2a2622] rounded-[58px] shadow-[0_0_0_2px_#b89a72,0_30px_60px_rgba(0,0,0,0.35)] shrink-0">
        <div className="w-[360px] sm:w-[390px] h-[820px] bg-[var(--bg)] text-[var(--fg)] rounded-[48px] overflow-hidden relative flex flex-col">
          {/* Barra de Status iOS */}
          <div className="h-[48px] flex items-center justify-between px-[32px] text-[14px] font-semibold shrink-0 relative z-10">
            <span>08:00</span>
            <div className="absolute left-1/2 top-[10px] -translate-x-1/2 w-[116px] h-[30px] bg-black rounded-[20px]"></div>
            <span className="w-[22px] h-[11px] rounded-[3px] bg-current"></span>
          </div>

          {/* Header Compacto Mobile */}
          <div className="flex items-center justify-between px-[16px] py-[10px] shrink-0">
            <span className="font-bold text-[20px] text-[#f0521f] tracking-[-0.5px]">
              coydash
            </span>
            <div className="flex items-center bg-[var(--surface)] rounded-full p-[4px] text-[11px]">
              <div className="flex items-center gap-[6px] py-[3px] pr-[10px] pl-[4px] border-r border-[var(--line2)]">
                <span className="w-[18px] h-[18px] rounded-full bg-[#f0521f] grid place-items-center text-[#141414]">
                  <IconRobot16 className="w-[11px] h-[11px]" />
                </span>
                <span>{agents.length} agentes</span>
              </div>
              <div className="flex items-center gap-[6px] py-[3px] px-[8px]">
                <span
                  className="w-[7px] h-[7px] rounded-full bg-[#2f9e5a]"
                  style={{ boxShadow: '0 0 0 3px rgba(47,158,90,.25)' }}
                ></span>
                <span>{currentOrg.health_score}%</span>
              </div>
            </div>
          </div>

          {/* Conteúdo Rolável Mobile */}
          <div className="flex-1 overflow-y-auto px-[16px] pb-[104px] flex flex-col gap-[20px]">
            {/* Bloco Hero Mobile */}
            <div className="bg-[var(--hero)] rounded-[22px] p-[22px] pb-[18px] flex flex-col">
              <div className="text-[14px] text-[var(--hero-sub)]">
                Olá, {firstName}! · {currentOrg.name}
              </div>
              <div className="font-semibold text-[30px] leading-[1.04] tracking-[-1.1px] mt-[10px] text-balance">
                R$ {currentOrg.hourly_revenue_live.toLocaleString('pt-BR')}/h ao vivo ({currentOrg.conversion_rate_live}% conv.)
              </div>

              <Link
                href="/pulse"
                className="mt-[18px] self-start flex items-center gap-[18px] bg-[#0066FF] text-white rounded-full px-[18px] py-[10px] text-[13px] font-semibold shadow-sm"
              >
                <span>
                  Receita protegida: R$ {displayProtectedValue.toLocaleString('pt-BR')}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </Link>

              {/* Cards Ilustrados Mobile */}
              <div className="flex gap-[10px] mt-[20px] -mr-[18px] overflow-hidden">
                <div className="w-[172px] h-[210px] bg-[#f4f4f2] rounded-[14px] p-[14px] text-[#141414] flex flex-col relative overflow-hidden shrink-0">
                  <div className="flex justify-between items-center text-[10.5px] font-semibold relative z-10">
                    <span className="text-[#0066FF]">01</span>
                    <span className="flex items-center gap-[4px] bg-[#e6e5e1] rounded-full px-[7px] py-[2px] text-[10px]">
                      <span className="w-[5px] h-[5px] rounded-full bg-[#2f9e5a]"></span>
                      {pendingApprovals.length} fila
                    </span>
                  </div>
                  <div className="font-medium text-[18px] leading-[1.05] tracking-[-0.4px] mt-[14px] relative z-10">
                    Aprovar
                    <br />
                    1-clique
                  </div>
                  <IllustrationFocusRoom />
                </div>

                <div className="w-[172px] h-[210px] bg-accent-blue-card rounded-[14px] p-[14px] text-white flex flex-col relative overflow-hidden shrink-0 mt-[32px] shadow-md">
                  <div className="absolute inset-0 bg-black/15 pointer-events-none" />
                  <div className="flex justify-between items-center text-[10.5px] font-semibold relative z-10">
                    <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">02</span>
                    <span className="flex items-center gap-[4px] bg-black/40 backdrop-blur-md text-white rounded-full px-[7px] py-[2px] text-[10px] border border-white/20">
                      <span className="w-[5px] h-[5px] rounded-full bg-[#0066FF]"></span>
                      {agents.length} ativos
                    </span>
                  </div>
                  <div className="font-semibold text-[18px] leading-[1.05] tracking-[-0.4px] mt-[14px] relative z-10 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                    Agentes
                    <br />
                    de IA
                  </div>
                  <div className="relative z-10 mt-auto">
                    <IllustrationAiAgents />
                  </div>
                </div>
              </div>
            </div>

            {/* Semáforo das Dependências Críticas (BIA) */}
            <div className="flex flex-col gap-[8px]">
              <div className="flex items-baseline justify-between">
                <span className="text-[18px]">Saúde da operação (BIA)</span>
                <span className="text-[11px] text-[var(--ds-muted)]">Ao vivo</span>
              </div>

              {biaProcesses.length === 0 ? (
                <div className="bg-[var(--surface)] rounded-[14px] p-[14px] text-[12px] text-[var(--ds-muted)] flex items-center justify-between">
                  <span>Nenhum processo BIA cadastrado ainda.</span>
                  <Link href="/pulse" className="text-[#0066FF] font-semibold shrink-0">
                    Configurar &rarr;
                  </Link>
                </div>
              ) : (
                biaProcesses.slice(0, 3).map((proc) => {
                  const dot =
                    proc.current_status === 'HEALTHY'
                      ? '#2f9e5a'
                      : proc.current_status === 'DEGRADED'
                        ? '#e8c14a'
                        : '#0066FF'
                  return (
                    <div
                      key={proc.id}
                      className="bg-[var(--surface)] rounded-[14px] p-[14px] flex items-center justify-between gap-[10px]"
                    >
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-medium truncate">
                          {proc.process_name}
                        </div>
                        <div className="text-[11px] text-[var(--ds-muted)]">
                          Risco parado: R$ {proc.cost_per_minute_stopped.toLocaleString('pt-BR')}/min
                        </div>
                      </div>
                      <span className="flex items-center gap-[5px] bg-[var(--bg)] border border-[var(--line2)] rounded-[6px] px-[8px] py-[4px] text-[10.5px] shrink-0">
                        <span
                          className="w-[5px] h-[5px] rounded-full"
                          style={{ backgroundColor: dot }}
                        ></span>
                        {proc.current_status === 'HEALTHY' ? 'Normal' : 'Contingência'}
                      </span>
                    </div>
                  )
                })
              )}
            </div>

            {/* Aprovação Expressa em 1 Clique no Celular */}
            <div className="flex flex-col gap-[8px]">
              <div className="flex items-baseline justify-between">
                <span className="text-[18px]">Alçada rápida (&lt; 3s)</span>
                <span className="text-[11px] text-[var(--ds-muted)]">
                  {pendingApprovals.length} pendentes
                </span>
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="bg-[var(--surface)] rounded-[14px] p-[14px] text-[12px] text-[var(--ds-muted)] flex items-center justify-between">
                  <span>Fila limpa — nenhuma aprovação pendente.</span>
                  <Link href="/studio" className="text-[#0066FF] font-semibold shrink-0">
                    Abrir Studio &rarr;
                  </Link>
                </div>
              ) : (
                pendingApprovals.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className="bg-[var(--surface)] rounded-[14px] p-[14px] flex flex-col gap-[10px]"
                  >
                    <div className="text-[13.5px] font-medium">{item.title}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-semibold">
                        R$ {item.amount_value.toLocaleString('pt-BR')}
                      </span>
                      <button
                        onClick={() => decideApprovalOneClick(item.id, 'APPROVED_1CLICK')}
                        className="h-[44px] px-[16px] rounded-full bg-[#0066FF] text-white text-[12.5px] font-semibold cursor-pointer shadow-sm"
                      >
                        Aprovar em 1 clique
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Seus agentes (Formato Mobile do DESIGN.md: descrição abaixo do nome, sem tag) */}
            <div className="flex flex-col gap-[6px]">
              <div className="flex items-baseline justify-between">
                <span className="text-[18px]">Seus agentes</span>
                <span className="text-[12px] text-[var(--ds-muted)]">{agents.length} ativos</span>
              </div>
              {agents.slice(0, 3).map((ag) => (
                <div
                  key={ag.id}
                  onClick={() => setActiveAgentDrawer(ag)}
                  className="grid grid-cols-[34px_1fr] gap-[12px] items-center py-[8px] cursor-pointer"
                >
                  <div className="relative w-[32px] h-[32px] rounded-full border-[1.5px] border-[#0066FF] grid place-items-center text-[12px] font-semibold">
                    {ag.code}
                    <span className="absolute -right-[3px] -bottom-[3px] w-[13px] h-[13px] rounded-full bg-[#0066FF] grid place-items-center">
                      <svg
                        width="7"
                        height="7"
                        viewBox="0 0 8 8"
                        fill="none"
                        stroke="white"
                        strokeWidth="1.6"
                      >
                        <path d="m1 4 2 2 4-4"></path>
                      </svg>
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium">
                      {ag.name}{' '}
                      <span className="text-[var(--ds-muted)] font-normal">· {ag.roleLabel}</span>
                    </div>
                    <div className="text-[11.5px] text-[var(--ds-muted)] line-clamp-1">
                      {ag.lastDeliverySummary}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Barra Inferior Flutuante Mobile dentro da moldura (64px, raio 22px, quadrado azul 46px raio 15px) */}
          <nav className="absolute left-[16px] right-[16px] bottom-[20px] h-[64px] bg-[var(--surface)] rounded-[22px] flex items-center justify-around shadow-[0_10px_30px_rgba(0,0,0,0.25)] border border-[var(--line2)]">
            <Link
              href="/executivo"
              className="w-[46px] h-[46px] rounded-[15px] bg-[#0066FF] grid place-items-center text-white"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1.5 1.5 7v7.5h4.5v-4.5h4v4.5h4.5V7z"></path>
              </svg>
            </Link>
            <Link
              href="/studio"
              className="w-[46px] h-[46px] grid place-items-center text-[var(--ds-muted)]"
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              >
                <rect x="2" y="3" width="12" height="11" rx="2"></rect>
                <path d="M2 7h12M5 1.5v3M11 1.5v3"></path>
              </svg>
            </Link>
            <Link
              href="/flow"
              className="w-[46px] h-[46px] grid place-items-center text-[var(--ds-muted)]"
            >
              <IconRobot16 className="w-[19px] h-[19px]" />
            </Link>
            <Link
              href="/pulse"
              className="w-[46px] h-[46px] grid place-items-center text-[var(--ds-muted)]"
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              >
                <circle cx="8" cy="6" r="4"></circle>
                <path d="M5.5 9.5 4.5 15 8 13l3.5 2-1-5.5"></path>
              </svg>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  )
}
