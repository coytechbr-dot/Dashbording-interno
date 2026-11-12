'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  Users,
  MessageSquare,
  CheckSquare,
  Target,
  Megaphone,
  Wallet,
} from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'
import {
  IllustrationFocusRoom,
  IllustrationAiAgents,
  IllustrationTeamLounge,
  IconRobot16,
} from '@/components/layout/roomie-illustrations'

export default function HomePage() {
  const {
    authenticatedUser,
    searchQuery,
    currentOrg,
    currentPersona,
    agents,
    setActiveAgentDrawer,
    clients,
    whatsappConversations,
    tasks,
    paidCampaigns,
    marketingBlasts,
    financialEntries,
  } = useCoyDash()

  const displayName = authenticatedUser?.name || currentPersona.name
  const firstName = displayName.split(' ')[0]
  const totalDeliveriesToday = agents.reduce((acc, a) => acc + a.deliveriesToday, 0)
  const deliveredAgentsCount = agents.filter((a) => a.status === 'Entregue').length

  const q = searchQuery.trim().toLowerCase()
  const filteredAgents = agents.filter((ag) =>
    !q
      ? true
      : ag.name.toLowerCase().includes(q) ||
        ag.roleLabel.toLowerCase().includes(q) ||
        ag.lastDeliverySummary.toLowerCase().includes(q)
  )

  const progressPct = Math.round((deliveredAgentsCount / Math.max(1, agents.length)) * 100)

  const totalMrr = clients.reduce((acc, c) => acc + (c.mrr_value || 0), 0)
  const humanHandoffs = whatsappConversations.filter((w) => w.handoff_to_human).length
  const openTasks = tasks.filter(
    (t) => !t.status_key.toUpperCase().includes('CONCLU') && t.status_key !== 'DONE'
  ).length

  return (
    <div className="flex flex-col min-h-full">
      {/* BLOCO DE DESTAQUE HERO (100% DESIGN SYSTEM ROOMIE OFFICE AI) */}
      <div className="pl-[26px] pt-[12px]">
        <div className="bg-[var(--hero)] rounded-l-[18px] min-h-[265px] flex flex-col lg:flex-row overflow-hidden">
          <div className="p-[28px] pb-[26px] flex flex-col w-full lg:w-[370px] shrink-0">
            <div className="text-[14px] text-[var(--hero-sub)]">
              Olá, {firstName}! · {currentOrg.name}
            </div>
            <div className="font-semibold text-[32px] leading-[1.06] tracking-[-1.1px] mt-[16px] text-balance">
              {clients.length > 0
                ? `Você tem ${clients.length} clientes na carteira e ${openTasks} tarefas em andamento`
                : 'Painel pronto: gerencie clientes, WhatsApp, tráfego, tarefas e financeiro'}
            </div>

            <div className="mt-auto pt-[18px] flex flex-wrap items-center gap-[10px]">
              <Link href="/clientes">
                <span className="inline-flex items-center gap-[14px] bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-full px-[18px] py-[10px] text-[13px] font-semibold transition-colors shadow-sm">
                  Abrir Clientes 360º
                  <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                </span>
              </Link>
              <Link href="/atendimento">
                <span className="inline-flex items-center gap-[8px] bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[var(--fg)] rounded-full px-[16px] py-[10px] text-[12.5px] font-medium transition-colors">
                  Atendimento WhatsApp
                </span>
              </Link>
            </div>
          </div>

          {/* 3 Cards Ilustrados à Direita (Clientes | Atendimento IA | Tarefas & Setores) */}
          <div className="flex gap-[14px] py-[16px] px-[20px] lg:ml-auto lg:pr-[28px] overflow-x-auto">
            {/* Card 01: Central de Clientes */}
            <Link
              href="/clientes"
              className="w-[176px] h-[234px] bg-[#f4f4f2] rounded-[14px] p-[16px] text-[#141414] flex flex-col relative overflow-hidden shrink-0 hover:translate-y-[-2px] transition-transform"
            >
              <div className="flex justify-between items-center text-[11px] font-semibold relative z-10">
                <span className="text-[#0066FF]">01</span>
                <span className="flex items-center gap-[5px] font-medium bg-[#e6e5e1] text-[#141414] rounded-full px-[8px] py-[3px] text-[10px]">
                  <span className="w-[6px] h-[6px] rounded-full bg-[#2f9e5a]"></span>
                  {clients.length} contas
                </span>
              </div>
              <div className="font-medium text-[19px] leading-[1.05] tracking-[-0.4px] mt-[18px] relative z-10">
                Central de
                <br />
                Clientes
              </div>
              <IllustrationFocusRoom />
            </Link>

            {/* Card 02: Atendimento WhatsApp & Agentes (Acento Azul Gradiente / Imagem) */}
            <Link
              href="/atendimento"
              className="w-[176px] h-[234px] bg-accent-blue-card rounded-[14px] p-[16px] text-white flex flex-col relative overflow-hidden shrink-0 hover:translate-y-[-2px] transition-all shadow-md group"
            >
              <div className="absolute inset-0 bg-black/15 pointer-events-none group-hover:bg-black/5 transition-colors" />
              <div className="flex justify-between items-center text-[11px] font-semibold relative z-10">
                <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">02</span>
                <span className="flex items-center gap-[5px] font-medium bg-black/40 backdrop-blur-md text-white rounded-full px-[8px] py-[3px] text-[10px] border border-white/20">
                  <span className="w-[6px] h-[6px] rounded-full bg-[#0066FF]"></span>
                  {humanHandoffs > 0 ? `${humanHandoffs} humano` : 'IA 24h'}
                </span>
              </div>
              <div className="font-medium text-[19px] leading-[1.05] tracking-[-0.4px] mt-[18px] relative z-10 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Atendimento
                <br />
                WhatsApp
              </div>
              <div className="relative z-10 mt-auto">
                <IllustrationAiAgents />
              </div>
            </Link>

            {/* Card 03: Tarefas & Setores */}
            <Link
              href="/tarefas"
              className="w-[176px] h-[234px] bg-[#f4f4f2] rounded-[14px] p-[16px] text-[#141414] flex flex-col relative overflow-hidden shrink-0 hover:translate-y-[-2px] transition-transform"
            >
              <div className="flex justify-between items-center text-[11px] font-semibold relative z-10">
                <span className="text-[#0066FF]">03</span>
                <span className="flex items-center gap-[5px] font-medium bg-[#e6e5e1] text-[#141414] rounded-full px-[8px] py-[3px] text-[10px]">
                  <span className="w-[6px] h-[6px] rounded-full bg-[#2f9e5a]"></span>
                  {openTasks} abertas
                </span>
              </div>
              <div className="font-medium text-[19px] leading-[1.05] tracking-[-0.4px] mt-[18px] relative z-10">
                Tarefas &amp;
                <br />
                Setores
              </div>
              <IllustrationTeamLounge />
            </Link>
          </div>
        </div>
      </div>

      {/* ATALHOS RÁPIDOS DE TODOS OS MÓDULOS (MUITO FÁCIL DE ENTENDER) */}
      <div className="px-[26px] pt-[20px]">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[10px]">
          {[
            {
              icon: Users,
              title: 'Clientes 360º',
              sub: `${clients.length} clientes · Onboarding & Ativos`,
              href: '/clientes',
            },
            {
              icon: MessageSquare,
              title: 'Atendimento',
              sub: `${whatsappConversations.length} conversas no WhatsApp`,
              href: '/atendimento',
            },
            {
              icon: CheckSquare,
              title: 'Tarefas & Kanban',
              sub: `${openTasks} demandas pendentes`,
              href: '/tarefas',
            },
            {
              icon: Target,
              title: 'Tráfego Pago',
              sub: `${paidCampaigns.length} campanhas Meta/Google`,
              href: '/trafego-pago',
            },
            {
              icon: Megaphone,
              title: 'Marketing',
              sub: `${marketingBlasts.length} disparos & recuperação`,
              href: '/marketing',
            },
            {
              icon: Wallet,
              title: 'Financeiro',
              sub: `${financialEntries.length} itens · DRE & Caixa`,
              href: '/financeiro',
            },
          ].map((mod) => {
            const Icon = mod.icon
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] hover:border-[#0066FF] rounded-[14px] p-[14px] flex flex-col gap-[6px] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="w-[30px] h-[30px] rounded-[8px] bg-[#0066FF]/15 text-[#0066FF] grid place-items-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
                </div>
                <div className="text-[13.5px] font-bold mt-[2px]">{mod.title}</div>
                <div className="text-[11px] text-[var(--ds-muted)] line-clamp-1">{mod.sub}</div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* GRADE INFERIOR (1fr / 330px exato do DESIGN.md Seção 9) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_330px] flex-1 mt-[20px] border-t border-[var(--line)] min-h-0 pl-[26px]">
        {/* COLUNA ESQUERDA: Os 5 Agentes de IA */}
        <section className="py-[22px] pr-[26px] lg:border-r border-[var(--line)] flex flex-col gap-[22px]">
          <div className="flex flex-col gap-[12px]">
            <div className="flex items-end gap-[16px]">
              <div className="flex-1">
                <div className="text-[11px] text-[var(--ds-muted)]">
                  Atendimento, Cobrança, Suporte, CS e Monitoramento 24h
                </div>
                <div className="text-[18px] font-semibold mt-[2px]">
                  Seus 5 Agentes de IA (clique para abrir)
                </div>
              </div>
              <div className="w-[120px] h-[5px] bg-[var(--line2)] rounded-full overflow-hidden mb-[8px]">
                <div
                  className="h-full bg-[#0066FF] transition-all"
                  style={{ width: `${Math.max(20, progressPct)}%` }}
                ></div>
              </div>
              <div className="text-[11px] mb-[5px]">{totalDeliveriesToday} entregas hoje</div>
            </div>

            <div className="flex flex-col divide-y divide-[var(--line)]">
              {filteredAgents.map((ag) => {
                const isDelivered = ag.status === 'Entregue'
                const dotColor =
                  ag.status === 'Entregue'
                    ? '#0066FF'
                    : ag.status === 'Em andamento'
                      ? '#e8c14a'
                      : '#2f9e5a'

                return (
                  <div
                    key={ag.id}
                    onClick={() => setActiveAgentDrawer(ag)}
                    className="grid grid-cols-[34px_minmax(0,1fr)] sm:grid-cols-[34px_minmax(0,1fr)_minmax(0,1.4fr)_124px] gap-[14px] items-center py-[11px] hover:bg-[var(--ds-hover)] px-[8px] -mx-[8px] rounded-[10px] cursor-pointer transition-colors"
                  >
                    <div
                      className={`relative w-[32px] h-[32px] rounded-full flex items-center justify-center text-[12px] font-semibold ${
                        isDelivered
                          ? 'border-[1.5px] border-[#0066FF]'
                          : 'border-[1.5px] border-[var(--line2)]'
                      }`}
                    >
                      {ag.code}
                    </div>

                    <div className="flex flex-col gap-[2px] min-w-0">
                      <div className="text-[14px] font-medium truncate">
                        {ag.name}{' '}
                        <span className="text-[var(--ds-muted)] font-normal">
                          · {ag.roleLabel}
                        </span>
                      </div>
                      <div className="sm:hidden text-[11.5px] text-[var(--ds-muted)] line-clamp-1">
                        {ag.lastDeliverySummary}
                      </div>
                    </div>

                    <div className="hidden sm:block text-[11.5px] leading-[1.4] text-[var(--ds-muted)] line-clamp-2">
                      {ag.lastDeliverySummary}
                    </div>

                    <div className="hidden sm:flex justify-self-end items-center gap-[5px] bg-[var(--bg)] border border-[var(--line2)] rounded-[6px] px-[8px] py-[4px] text-[10.5px] whitespace-nowrap">
                      <span
                        className="w-[5px] h-[5px] rounded-full"
                        style={{ backgroundColor: dotColor }}
                      ></span>
                      Online 24h
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* COLUNA DIREITA (330px): Resumo Rápido da Operação */}
        <section className="p-[22px] pr-[26px] lg:pl-[20px] flex flex-col gap-[12px]">
          <div className="flex items-baseline justify-between">
            <div className="text-[18px] font-semibold">Resumo da Operação</div>
            <Link
              href="/configuracoes"
              className="text-[11px] text-[#0066FF] hover:underline font-medium"
            >
              Configurar
            </Link>
          </div>

          <Link
            href="/clientes"
            className="bg-[var(--surface)] rounded-[12px] p-[14px] flex flex-col gap-[6px] border border-[var(--line)] hover:border-[#0066FF] transition-colors"
          >
            <div className="text-[14px] font-semibold">Carteira de Clientes 360º</div>
            <div className="text-[11.5px] text-[var(--ds-muted)]">
              {clients.length > 0
                ? `${clients.length} clientes cadastrados · MRR R$ ${totalMrr.toLocaleString('pt-BR')}`
                : 'Clique para adicionar clientes ou carregar exemplos na carteira'}
            </div>
            <div className="flex items-center justify-between mt-[6px]">
              <span className="text-[11px] text-[#0066FF] font-semibold">
                Ver Onboarding, Ativos e Churn →
              </span>
            </div>
          </Link>

          <Link
            href="/atendimento"
            className="bg-[var(--surface)] rounded-[12px] p-[14px] flex flex-col gap-[6px] border border-[var(--line)] hover:border-[#0066FF] transition-colors"
          >
            <div className="text-[14px] font-semibold">Inbox WhatsApp Oficial</div>
            <div className="text-[11.5px] text-[var(--ds-muted)]">
              {whatsappConversations.length > 0
                ? `${whatsappConversations.length} conversas ativas · ${humanHandoffs} aguardando humano`
                : 'Atendimento híbrido IA + Humano com transcrição de áudio e memória pgvector'}
            </div>
            <div className="flex items-center justify-between mt-[6px]">
              <div className="flex items-center gap-[5px] bg-[var(--bg)] border border-[var(--line)] rounded-[6px] px-[8px] py-[3px] text-[10.5px]">
                <span className="w-[5px] h-[5px] rounded-full bg-[#2f9e5a]"></span>
                IA ativa 24h
              </div>
              <IconRobot16 className="w-[14px] h-[14px] text-[#0066FF]" />
            </div>
          </Link>

          <Link
            href="/financeiro"
            className="bg-[var(--surface)] rounded-[12px] p-[14px] flex flex-col gap-[6px] border border-[var(--line)] hover:border-[#0066FF] transition-colors"
          >
            <div className="text-[14px] font-semibold">Financeiro, Pix &amp; DRE</div>
            <div className="text-[11.5px] text-[var(--ds-muted)]">
              Acompanhe receita bruta, taxas, custos, margem por serviço e feche o caixa com 1 clique.
            </div>
          </Link>
        </section>
      </div>
    </div>
  )
}
