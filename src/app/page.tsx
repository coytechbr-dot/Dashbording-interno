'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  Users,
  MessageSquare,
  CheckSquare,
  Briefcase,
  UserCheck,
  Wallet,
  Clock,
  AlertCircle,
  CheckCircle2,
  Phone,
  Shield,
  Key,
  Flame,
  ChevronRight,
  TrendingUp,
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
    taskStatuses,
    deals,
    pipelines,
    pipelineStages,
    orgMembers,
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

  // Métricas Consolidadas
  const totalMrr = clients.reduce((acc, c) => acc + (Number(c.mrr_value) || 0), 0)
  const humanHandoffs = whatsappConversations.filter((w) => w.handoff_to_human).length
  const openTasksList = tasks.filter(
    (t) => !t.status_key.toUpperCase().includes('CONCLU') && t.status_key !== 'DONE'
  )
  const openTasks = openTasksList.length
  const urgentTasksCount = openTasksList.filter(
    (t) => t.priority === 'urgent' || t.priority === 'high'
  ).length

  // Métricas de Comercial
  const activeDeals = deals.filter((d) => {
    const stage = pipelineStages.find((s) => s.id === d.stage_id)
    return !stage?.is_lost
  })
  const totalOpenDealsMrr = activeDeals.reduce((acc, d) => acc + (Number(d.value_mrr) || 0), 0)

  // Helper para formatar data de tarefas
  const formatDueDate = (dateStr?: string | null) => {
    if (!dateStr) return null
    try {
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        d.setHours(0, 0, 0, 0)
        const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays < 0) return { text: `Atrasada (${Math.abs(diffDays)}d)`, isLate: true }
        if (diffDays === 0) return { text: 'Vence Hoje', isToday: true }
        if (diffDays === 1) return { text: 'Amanhã', isSoon: true }
        return { text: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), isFuture: true }
      }
      return { text: dateStr }
    } catch {
      return { text: dateStr }
    }
  }

  // Ordenação de tarefas prioritárias
  const priorityOrder: Record<string, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  }

  const prioritizedTasks = [...openTasksList].sort((a, b) => {
    const pA = priorityOrder[a.priority] || 0
    const pB = priorityOrder[b.priority] || 0
    if (pB !== pA) return pB - pA
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
    return a.due_date ? -1 : 1
  }).slice(0, 6)

  // Conversas mais recentes do WhatsApp
  const recentConversations = [...whatsappConversations]
    .sort((a, b) => {
      // Prioridade máxima para as que precisam de atendente humano
      if (a.handoff_to_human && !b.handoff_to_human) return -1
      if (!a.handoff_to_human && b.handoff_to_human) return 1
      const timeA = new Date(a.last_message_at || 0).getTime()
      const timeB = new Date(b.last_message_at || 0).getTime()
      return timeB - timeA
    })
    .slice(0, 5)

  return (
    <div className="flex flex-col min-h-full text-[var(--fg)] pb-12">
      {/* ===================================================================== */}
      {/* 1. BLOCO HERO COM DESTAQUE (DESIGN SYSTEM ROOMIE OFFICE AI)           */}
      {/* ===================================================================== */}
      <div className="pl-[26px] pt-[12px]">
        <div className="bg-[var(--hero)] rounded-l-[18px] min-h-[265px] flex flex-col lg:flex-row overflow-hidden">
          <div className="p-[28px] pb-[26px] flex flex-col w-full lg:w-[410px] shrink-0">
            <div className="text-[14px] text-[var(--hero-sub)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0066FF]" />
              <span>Olá, {firstName}! · {currentOrg.name}</span>
            </div>

            <div className="font-semibold text-[30px] leading-[1.08] tracking-[-1px] mt-[14px] text-balance">
              {clients.length > 0 || activeDeals.length > 0
                ? `${clients.length} clientes na carteira, ${activeDeals.length} negócios no Comercial e ${openTasks} tarefas abertas`
                : 'Painel pronto: gerencie CRM Comercial, WhatsApp, tarefas e equipe'}
            </div>

            <div className="mt-auto pt-[20px] flex flex-wrap items-center gap-[10px]">
              <Link href="/comercial">
                <span className="inline-flex items-center gap-[10px] bg-[#0066FF] hover:bg-[#d84414] text-white rounded-full px-[18px] py-[9.5px] text-[13px] font-semibold transition-colors shadow-sm cursor-pointer">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Comercial & Vendas</span>
                  <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                </span>
              </Link>

              <Link href="/atendimento">
                <span className="inline-flex items-center gap-[8px] bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[var(--fg)] rounded-full px-[16px] py-[9.5px] text-[12.5px] font-medium transition-colors cursor-pointer">
                  <MessageSquare className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>WhatsApp</span>
                  {humanHandoffs > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse" />
                  )}
                </span>
              </Link>

              <Link href="/tarefas">
                <span className="inline-flex items-center gap-[8px] bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[var(--fg)] rounded-full px-[16px] py-[9.5px] text-[12.5px] font-medium transition-colors cursor-pointer">
                  <CheckSquare className="w-3.5 h-3.5 text-[#5cd3a8]" />
                  <span>Tarefas</span>
                </span>
              </Link>
            </div>
          </div>

          {/* CARDS ILUSTRADOS HERO (4 CARDS: CLIENTES, COMERCIAL, ATENDIMENTO E TAREFAS) */}
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
              <div className="text-[11px] text-[#666] mt-1 relative z-10 font-mono">
                R$ {totalMrr.toLocaleString('pt-BR')} MRR
              </div>
              <IllustrationFocusRoom />
            </Link>

            {/* Card 02: Comercial & Funil de Vendas (NOVO!) */}
            <Link
              href="/comercial"
              className="w-[176px] h-[234px] bg-[#141414] border border-[#2a2a2a] rounded-[14px] p-[16px] text-white flex flex-col relative overflow-hidden shrink-0 hover:translate-y-[-2px] transition-all shadow-md group"
            >
              <div className="flex justify-between items-center text-[11px] font-semibold relative z-10">
                <span className="text-[#0066FF]">02</span>
                <span className="flex items-center gap-[5px] font-medium bg-[#0066FF]/20 text-[#0066FF] border border-[#0066FF]/40 rounded-full px-[8px] py-[3px] text-[10px]">
                  <span className="w-[6px] h-[6px] rounded-full bg-[#0066FF]"></span>
                  {activeDeals.length} deals
                </span>
              </div>
              <div className="font-medium text-[19px] leading-[1.05] tracking-[-0.4px] mt-[18px] relative z-10 text-white">
                Comercial &amp;
                <br />
                Vendas
              </div>
              <div className="text-[11px] text-white/70 mt-1 relative z-10 font-mono">
                R$ {totalOpenDealsMrr.toLocaleString('pt-BR')} pipe
              </div>
              <div className="relative z-10 mt-auto flex items-center justify-between text-[11px] text-[#0066FF]">
                <span className="font-semibold">Abrir Kanban</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            {/* Card 03: Atendimento WhatsApp */}
            <Link
              href="/atendimento"
              className="w-[176px] h-[234px] bg-accent-blue-card rounded-[14px] p-[16px] text-white flex flex-col relative overflow-hidden shrink-0 hover:translate-y-[-2px] transition-all shadow-md group"
            >
              <div className="absolute inset-0 bg-black/15 pointer-events-none group-hover:bg-black/5 transition-colors" />
              <div className="flex justify-between items-center text-[11px] font-semibold relative z-10">
                <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">03</span>
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
              <div className="text-[11px] text-white/80 mt-1 relative z-10">
                {whatsappConversations.length} conversas
              </div>
              <div className="relative z-10 mt-auto">
                <IllustrationAiAgents />
              </div>
            </Link>

            {/* Card 04: Tarefas & Setores */}
            <Link
              href="/tarefas"
              className="w-[176px] h-[234px] bg-[#f4f4f2] rounded-[14px] p-[16px] text-[#141414] flex flex-col relative overflow-hidden shrink-0 hover:translate-y-[-2px] transition-transform"
            >
              <div className="flex justify-between items-center text-[11px] font-semibold relative z-10">
                <span className="text-[#0066FF]">04</span>
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
              <div className="text-[11px] text-[#666] mt-1 relative z-10">
                {urgentTasksCount > 0 ? `${urgentTasksCount} urgentes` : 'Tudo em dia'}
              </div>
              <IllustrationTeamLounge />
            </Link>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. ATALHOS RÁPIDOS PARA TODAS AS TELAS DA OPERAÇÃO                    */}
      {/* ===================================================================== */}
      <div className="px-[26px] pt-[20px]">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[10px]">
          {[
            {
              icon: Briefcase,
              title: 'Comercial & Vendas',
              sub: `${activeDeals.length} deals · R$ ${totalOpenDealsMrr.toLocaleString('pt-BR')} MRR`,
              href: '/comercial',
              accent: '#0066FF',
            },
            {
              icon: Users,
              title: 'Clientes 360º',
              sub: `${clients.length} clientes · R$ ${totalMrr.toLocaleString('pt-BR')}`,
              href: '/clientes',
              accent: '#0066FF',
            },
            {
              icon: MessageSquare,
              title: 'Atendimento',
              sub: `${whatsappConversations.length} chats · ${humanHandoffs} humano`,
              href: '/atendimento',
              accent: '#2f9e5a',
            },
            {
              icon: CheckSquare,
              title: 'Tarefas & Kanban',
              sub: `${openTasks} pendentes · ${urgentTasksCount} urgentes`,
              href: '/tarefas',
              accent: '#e8c14a',
            },
            {
              icon: UserCheck,
              title: 'Membros & RH',
              sub: `${orgMembers.length} pessoas · Tokens MCP`,
              href: '/colaboradores',
              accent: '#8b5cf6',
            },
            {
              icon: Wallet,
              title: 'Financeiro & DRE',
              sub: `${financialEntries.length} lançamentos · Caixa & Metas`,
              href: '/financeiro',
              accent: '#ec4899',
            },
          ].map((mod) => {
            const Icon = mod.icon
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] hover:border-[#0066FF] rounded-[14px] p-[14px] flex flex-col gap-[6px] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center transition-colors"
                    style={{ backgroundColor: `${mod.accent}20`, color: mod.accent }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[var(--ds-muted)] group-hover:text-[var(--fg)] group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[13.5px] font-bold mt-[2px] truncate">{mod.title}</div>
                <div className="text-[11px] text-[var(--ds-muted)] line-clamp-1">{mod.sub}</div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. GRADE PRINCIPAL: DADOS REAIS DE ATENDIMENTO, TAREFAS E RADAR       */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] flex-1 mt-[20px] border-t border-[var(--line)] min-h-0 pl-[26px]">
        {/* COLUNA ESQUERDA: DADOS VIVOS DE ATENDIMENTO & TAREFAS */}
        <div className="py-[22px] pr-[26px] lg:border-r border-[var(--line)] flex flex-col gap-[28px]">
          
          {/* SEÇÃO 1: ATENDIMENTO AO VIVO & WHATSAPP */}
          <div className="flex flex-col gap-[14px]">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2f9e5a] animate-pulse" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-muted)]">
                    Atendimento em Tempo Real
                  </span>
                </div>
                <h2 className="text-[19px] font-bold tracking-tight mt-0.5">
                  Conversas &amp; Leads no WhatsApp
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11.5px] text-[var(--ds-muted)] hidden sm:inline">
                  {humanHandoffs > 0 ? `${humanHandoffs} aguardando atendimento humano` : 'IA autônoma 24h'}
                </span>
                <Link
                  href="/atendimento"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[var(--surface)] hover:bg-[var(--line2)] border border-[var(--line2)] text-[12px] font-semibold transition-colors cursor-pointer"
                >
                  <span>Abrir Atendimento</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
                </Link>
              </div>
            </div>

            {recentConversations.length === 0 ? (
              <div className="p-8 rounded-[14px] bg-[var(--surface)] border border-dashed border-[var(--line2)] text-center flex flex-col items-center justify-center gap-2">
                <MessageSquare className="w-8 h-8 text-[var(--ds-muted)] opacity-50" />
                <div className="text-[13.5px] font-semibold">Nenhuma conversa registrada ainda</div>
                <p className="text-[12px] text-[var(--ds-muted)] max-w-sm">
                  Conecte o webhook do WhatsApp ou envie uma mensagem de teste para que os atendimentos apareçam aqui.
                </p>
                <Link
                  href="/atendimento"
                  className="mt-2 text-[12px] font-semibold text-[#0066FF] hover:underline"
                >
                  Acessar painel de atendimento →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 divide-y divide-[var(--line2)] bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] overflow-hidden">
                {recentConversations.map((conv) => {
                  const lastMsg = conv.messages && conv.messages.length > 0
                    ? conv.messages[conv.messages.length - 1]
                    : null
                  const isHandoff = conv.handoff_to_human

                  return (
                    <Link
                      key={conv.id}
                      href={`/atendimento?chat=${conv.id}`}
                      className="p-[14px] hover:bg-[var(--ds-hover)] transition-colors flex items-center justify-between gap-4 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-[var(--line2)] flex items-center justify-center font-bold text-[13px] text-[var(--fg)] border border-[var(--line)]">
                            {conv.contact_name ? conv.contact_name.slice(0, 2).toUpperCase() : 'WA'}
                          </div>
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--surface)] ${
                              isHandoff ? 'bg-[#0066FF]' : 'bg-[#2f9e5a]'
                            }`}
                          />
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[13.5px] text-[var(--fg)] truncate">
                              {conv.contact_name || 'Contato WhatsApp'}
                            </span>
                            <span className="text-[11px] font-mono text-[var(--ds-muted)]">
                              {conv.contact_phone}
                            </span>
                          </div>
                          <div className="text-[12px] text-[var(--ds-muted)] truncate max-w-md mt-0.5">
                            {lastMsg ? lastMsg.text : 'Conversa iniciada via WhatsApp.'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {isHandoff ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-bold bg-[#0066FF]/15 text-[#0066FF] border border-[#0066FF]/30 animate-pulse">
                            <AlertCircle className="w-3 h-3" />
                            <span>Humano Necessário</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] text-[11px] font-medium bg-[#2f9e5a]/10 text-[#2f9e5a]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>IA Atendendo</span>
                          </span>
                        )}

                        <span className="text-[11px] text-[var(--ds-muted)] font-mono hidden sm:inline">
                          {conv.last_message_at
                            ? new Date(conv.last_message_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>

                        <ChevronRight className="w-4 h-4 text-[var(--ds-muted)] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* SEÇÃO 2: TAREFAS PRIORITÁRIAS & KANBAN */}
          <div className="flex flex-col gap-[14px]">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0066FF]" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-muted)]">
                    Demandas &amp; Execução
                  </span>
                </div>
                <h2 className="text-[19px] font-bold tracking-tight mt-0.5">
                  Tarefas Prioritárias da Operação
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11.5px] text-[var(--ds-muted)] hidden sm:inline">
                  {openTasks} tarefas pendentes ({urgentTasksCount} urgentes)
                </span>
                <Link
                  href="/tarefas"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[var(--surface)] hover:bg-[var(--line2)] border border-[var(--line2)] text-[12px] font-semibold transition-colors cursor-pointer"
                >
                  <span>Abrir Kanban</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
                </Link>
              </div>
            </div>

            {prioritizedTasks.length === 0 ? (
              <div className="p-8 rounded-[14px] bg-[var(--surface)] border border-dashed border-[var(--line2)] text-center flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-[#2f9e5a] opacity-60" />
                <div className="text-[13.5px] font-semibold">Nenhuma tarefa pendente</div>
                <p className="text-[12px] text-[var(--ds-muted)]">
                  Parabéns! Todas as demandas da equipe estão concluídas ou em dia.
                </p>
                <Link
                  href="/tarefas"
                  className="mt-2 text-[12px] font-semibold text-[#0066FF] hover:underline"
                >
                  Criar nova tarefa no Kanban →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 divide-y divide-[var(--line2)] bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] overflow-hidden">
                {prioritizedTasks.map((task) => {
                  const due = formatDueDate(task.due_date)
                  const isUrgent = task.priority === 'urgent'
                  const isHigh = task.priority === 'high'

                  return (
                    <Link
                      key={task.id}
                      href="/tarefas"
                      className="p-[14px] hover:bg-[var(--ds-hover)] transition-colors flex items-center justify-between gap-4 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Indicador de Prioridade */}
                        <div
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isUrgent
                              ? 'bg-red-500'
                              : isHigh
                                ? 'bg-amber-500'
                                : 'bg-[var(--color-brand-blue)]'
                          }`}
                          title={`Prioridade: ${task.priority}`}
                        />

                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-[13.5px] text-[var(--fg)] truncate">
                            {task.title}
                          </span>
                          <div className="flex items-center gap-2 text-[11.5px] text-[var(--ds-muted)] mt-0.5">
                            {task.client_name_snapshot && (
                              <span className="truncate text-[var(--fg)] font-medium">
                                {task.client_name_snapshot} ·
                              </span>
                            )}
                            <span>{task.assignee_name || 'Sem responsável'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Status no Kanban */}
                        <span className="px-2 py-0.5 rounded-[6px] text-[10.5px] font-semibold bg-[var(--line2)] text-[var(--fg)]">
                          {task.status_key || 'TODO'}
                        </span>

                        {/* Prazo */}
                        {due && (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-[6px] ${
                              due.isLate
                                ? 'bg-red-500/10 text-red-500 font-bold'
                                : due.isToday
                                  ? 'bg-amber-500/10 text-amber-500 font-bold'
                                  : 'text-[var(--ds-muted)]'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{due.text}</span>
                          </span>
                        )}

                        <ChevronRight className="w-4 h-4 text-[var(--ds-muted)] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* COLUNA DIREITA: RADAR COMERCIAL, AGENTES DE IA & GOVERNANÇA MCP       */}
        {/* ===================================================================== */}
        <section className="p-[22px] pr-[26px] lg:pl-[20px] flex flex-col gap-[20px]">
          
          {/* BLOCO 1: RADAR COMERCIAL & PIPELINE (NOVO!) */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#0066FF]" />
                <h3 className="text-[14.5px] font-bold text-[var(--fg)]">Radar Comercial (CRM)</h3>
              </div>
              <Link
                href="/comercial"
                className="text-[11px] font-semibold text-[#0066FF] hover:underline"
              >
                Ver Funil →
              </Link>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[14px] p-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2 pb-3 border-b border-[var(--line2)]">
                <div>
                  <div className="text-[10.5px] uppercase text-[var(--ds-muted)] font-medium">Pipeline Aberto</div>
                  <div className="text-[16px] font-bold text-[var(--fg)] mt-0.5">
                    R$ {totalOpenDealsMrr.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-[10px] text-[var(--ds-muted)]">recorrência / mês</div>
                </div>

                <div>
                  <div className="text-[10.5px] uppercase text-[var(--ds-muted)] font-medium">Oportunidades</div>
                  <div className="text-[16px] font-bold text-[#0066FF] mt-0.5">
                    {activeDeals.length} ativas
                  </div>
                  <div className="text-[10px] text-[var(--ds-muted)]">no funil de vendas</div>
                </div>
              </div>

              {activeDeals.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <div className="text-[11px] font-semibold text-[var(--ds-muted)] uppercase tracking-wider">
                    Últimas Oportunidades:
                  </div>
                  {activeDeals.slice(0, 3).map((d) => (
                    <Link
                      key={d.id}
                      href="/comercial"
                      className="p-2 rounded-[8px] hover:bg-[var(--ds-hover)] transition-colors flex items-center justify-between text-[12px] group"
                    >
                      <span className="font-semibold text-[var(--fg)] truncate max-w-[150px]">
                        {d.title}
                      </span>
                      <span className="font-mono text-[#0066FF] font-bold">
                        R$ {Number(d.value_mrr || 0).toLocaleString('pt-BR')}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-[11.5px] text-[var(--ds-muted)]">
                  Nenhum negócio aberto no momento.
                </div>
              )}
            </div>
          </div>

          {/* BLOCO 2: SEUS 5 AGENTES DE IA */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconRobot16 className="w-4 h-4 text-[#0066FF]" />
                <h3 className="text-[14.5px] font-bold text-[var(--fg)]">Seus 5 Agentes de IA</h3>
              </div>
              <span className="text-[11px] text-[var(--ds-muted)]">
                {totalDeliveriesToday} entregas hoje
              </span>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[14px] p-3 flex flex-col gap-2">
              {filteredAgents.slice(0, 5).map((ag) => {
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
                    className="p-2 rounded-[8px] hover:bg-[var(--ds-hover)] flex items-center justify-between gap-2 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-[var(--line2)] flex items-center justify-center font-bold text-[10px] text-[var(--fg)] shrink-0">
                        {ag.code}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[12.5px] font-semibold text-[var(--fg)] truncate">
                          {ag.name}
                        </span>
                        <span className="text-[10px] text-[var(--ds-muted)] truncate">
                          {ag.roleLabel}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
                      <span className="text-[10.5px] text-[var(--ds-muted)]">Online</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* BLOCO 3: GOVERNANÇA DE IA & SERVIDOR MCP (NOVO!) */}
          <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[14px] p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#0066FF]" />
                <span className="text-[12px] font-bold text-[var(--fg)]">Servidor MCP Ativo</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#5cd3a8]/10 text-[#5cd3a8]">
                <CheckCircle2 className="w-3 h-3" />
                Online
              </span>
            </div>

            <p className="text-[11.5px] text-[var(--ds-muted)] leading-relaxed">
              Agentes externos (Claude Desktop, Cursor e n8n) operam Atendimento, Comercial e Tarefas com segurança e RBAC.
            </p>

            <Link
              href="/colaboradores"
              className="mt-1 text-[11.5px] font-semibold text-[#0066FF] hover:underline flex items-center gap-1"
            >
              <span>Gerenciar Tokens &amp; Permissões</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
