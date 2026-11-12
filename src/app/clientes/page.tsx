'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  AlertTriangle,
  ArrowLeft,
  ArrowLeftRight,
  X,
  Check,
  Send,
  Calendar,
  ExternalLink,
  Trash2,
  UserCheck,
  FileText,
  MessageSquare,
  Sparkles,
  CheckSquare,
  TrendingUp,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'
import { ProposalGeneratorDialog } from '@/components/commercial/proposal-generator-dialog'
import { MethodologyStepper } from '@/components/commercial/methodology-stepper'
import { ClientContactsTab } from '@/components/clients/client-contacts-tab'
import { ClientDealsTab } from '@/components/clients/client-deals-tab'
import { DealDialog } from '@/components/commercial/deal-dialog'
import type {
  ClientAccount,
  ClientPriority,
  ClientStatus,
  ClientAdPlatform,
  ConnectionHealth,
} from '@/types/coydash'

const CLIENT_TABS = [
  { id: 'Metodologia 7 Etapas', label: 'Metodologia (7 Etapas)' },
  { id: 'Contatos', label: 'Contatos (Pessoas)' },
  { id: 'Oportunidades', label: 'Oportunidades (Deals)' },
  { id: 'Tráfego', label: 'Tráfego' },
  { id: 'Demandas', label: 'Demandas' },
  { id: 'Agenda', label: 'Agenda' },
  { id: 'Comunicação', label: 'Comunicação' },
  { id: 'Resultado', label: 'Resultado' },
  { id: 'Customer Success', label: 'Customer Success' },
  { id: 'Perfil Comercial', label: 'Perfil Comercial' },
  { id: 'Briefing', label: 'Briefing' },
  { id: 'Backups', label: 'Backups' },
  { id: 'Histórico', label: 'Histórico' },
  { id: 'Informações', label: 'Informações' },
  { id: 'Configuração', label: 'Configuração' },
] as const

type ClientTabId = (typeof CLIENT_TABS)[number]['id']

const PRIORITY_LABELS: Record<ClientPriority, { label: string; dot: string; badge: string }> = {
  low: {
    label: 'Baixa',
    dot: 'bg-[#2f9e5a]',
    badge: 'border-[var(--line2)] text-[var(--fg)] bg-[var(--bg)]',
  },
  medium: {
    label: 'Média',
    dot: 'bg-[#38bdf8]',
    badge: 'border-[#38bdf8]/40 text-[#38bdf8] bg-[#38bdf8]/10',
  },
  high: {
    label: 'Alta',
    dot: 'bg-[#0066FF]',
    badge: 'border-[#0066FF]/40 text-[#0066FF] bg-[#0066FF]/10',
  },
  urgent: {
    label: 'Urgente',
    dot: 'bg-[#ef4444]',
    badge: 'border-[#ef4444]/40 text-[#ef4444] bg-[#ef4444]/10',
  },
}

const STATUS_LABELS: Record<
  ClientStatus,
  { label: string; dot: string; badge: string; borderCard: string }
> = {
  ONBOARDING: {
    label: 'Onboarding',
    dot: 'bg-[#8f7dff]',
    badge: 'bg-[#8f7dff]/15 text-[#8f7dff] border-[#8f7dff]/30',
    borderCard: 'border-[#8f7dff]/40 hover:border-[#8f7dff]',
  },
  ACTIVE: {
    label: 'Ativo',
    dot: 'bg-[#38bdf8]',
    badge: 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/30',
    borderCard: 'border-[#38bdf8]/35 hover:border-[#38bdf8]',
  },
  CHURN_RISK: {
    label: 'Aviso de churn',
    dot: 'bg-[#0066FF]',
    badge: 'bg-[#0066FF]/15 text-[#0066FF] border-[#0066FF]/30',
    borderCard: 'border-[#0066FF]/45 hover:border-[#0066FF]',
  },
}

export default function ClientesPage() {
  const {
    clients,
    clientHistoryEvents,
    clientTeamNotes,
    createClient,
    updateClient,
    deleteClient,
    addClientNote,
    deleteClientNote,
    tasks,
    createTask,
    taskLists,
    whatsappConversations,
    searchQuery,
    refreshFromDatabase,
    deals,
    activityTimeline,
  } = useCoyDash()

  // Filtros do topo (Imagem 2)
  const [localSearch, setLocalSearch] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'dashboard'>('cards')
  const [memberViewMode, setMemberViewMode] = useState(false)
  const [selectedSquad, setSelectedSquad] = useState<string>('ALL')
  const [selectedManager, setSelectedManager] = useState<string>('ALL')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL')
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL')
  const [selectedService, setSelectedService] = useState<string>('ALL')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL')

  // Cliente aberto na Ficha 360º (Imagem 3)
  const [activeClientId, setActiveClientId] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<ClientTabId>('Histórico')

  // Modal de Nova Oportunidade vinculado ao cliente (CoyCRM Twenty)
  const [isNewDealOpen, setIsNewDealOpen] = useState(false)

  // Estados da aba Histórico + Anotações do Time (Imagem 3)
  const [noteInput, setNoteInput] = useState('')
  const [noteType, setNoteType] = useState('GERAL')
  const [historyFilterUser, setHistoryFilterUser] = useState('ALL')
  const [notesFilterType, setNotesFilterType] = useState('ALL')

  // Modal Novo Cliente
  const [showNewClientModal, setShowNewClientModal] = useState(false)

  // Modal Gerador de Propostas Comerciais (Regra 9.5 do Plano de Negócio)
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [proposalClient, setProposalClient] = useState<ClientAccount | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeClientId) {
          setActiveClientId(null)
        } else if (showNewClientModal) {
          setShowNewClientModal(false)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeClientId, showNewClientModal])
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    cnpj: '',
    sector: 'Advocacia / Jurídico',
    team_squad: 'Sparta',
    priority: 'medium' as ClientPriority,
    status: 'ONBOARDING' as ClientStatus,
    ad_platform: 'BOTH' as ClientAdPlatform,
    service_type: 'Tráfego + IA + CRM',
    mrr_value: '2500',
    setup_fee: '1500',
    ad_spend: '0',
    ad_results: '0',
    ad_balance: '1500',
    traffic_manager_name: 'Gabrielly Maia',
    designer_name: 'Felipe Cavalcante',
    cs_manager_name: 'Débora Carvalho',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    whatsapp_group_link: '',
  })

  // Nova demanda rápida dentro da Ficha do Cliente
  const [newClientTaskTitle, setNewClientTaskTitle] = useState('')
  const [newAgendaTitle, setNewAgendaTitle] = useState('')
  const [newAgendaDate, setNewAgendaDate] = useState('')

  // Mensagens sincronizadas da tabela n8n_chat_histories para a aba Comunicação
  const [clientN8nMessages, setClientN8nMessages] = useState<
    Array<{
      id: number
      session_id: string
      message: { type: string; content: string; sender_name?: string }
      hora_data_mensagem: string
    }>
  >([])
  const [loadingN8nMessages, setLoadingN8nMessages] = useState(false)

  const activeClient = useMemo(
    () => clients.find((c) => c.id === activeClientId) || null,
    [clients, activeClientId]
  )

  // Abre automaticamente a ficha 360º quando navegado via /clientes?phone=...
  useEffect(() => {
    if (typeof window === 'undefined' || clients.length === 0) return
    const params = new URLSearchParams(window.location.search)
    const phoneParam = params.get('phone')?.replace(/\D/g, '')
    if (phoneParam && !activeClientId) {
      const matched = clients.find(
        (c) => (c.contact_phone || '').replace(/\D/g, '') === phoneParam
      )
      if (matched) {
        setActiveClientId(matched.id)
        setActiveTab('Comunicação')
      }
    }
  }, [clients, activeClientId])

  // Carrega o histórico real de n8n_chat_histories quando um cliente com WhatsApp está ativo
  useEffect(() => {
    const cleanPhone = (activeClient?.contact_phone || '').replace(/\D/g, '')
    if (!cleanPhone) {
      setClientN8nMessages([])
      return
    }
    let cancelled = false
    setLoadingN8nMessages(true)
    fetch(`/api/whatsapp/messages?sessionId=${encodeURIComponent(cleanPhone)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          setClientN8nMessages(Array.isArray(json.messages) ? json.messages : [])
        }
      })
      .catch(() => {
        if (!cancelled) setClientN8nMessages([])
      })
      .finally(() => {
        if (!cancelled) setLoadingN8nMessages(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeClient?.id, activeClient?.contact_phone])

  const effectiveSearch = (localSearch || searchQuery).trim().toLowerCase()

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (effectiveSearch) {
        const match =
          c.name.toLowerCase().includes(effectiveSearch) ||
          c.team_squad.toLowerCase().includes(effectiveSearch) ||
          c.sector.toLowerCase().includes(effectiveSearch) ||
          c.traffic_manager_name.toLowerCase().includes(effectiveSearch)
        if (!match) return false
      }
      if (selectedSquad !== 'ALL' && c.team_squad !== selectedSquad) return false
      if (
        selectedManager !== 'ALL' &&
        c.traffic_manager_name !== selectedManager &&
        c.cs_manager_name !== selectedManager
      ) {
        return false
      }
      if (selectedPlatform !== 'ALL' && c.ad_platform !== selectedPlatform) return false
      if (selectedPriority !== 'ALL' && c.priority !== selectedPriority) return false
      if (selectedService !== 'ALL' && c.service_type !== selectedService) return false
      if (selectedStatusFilter !== 'ALL' && c.status !== selectedStatusFilter) return false
      return true
    })
  }, [
    clients,
    effectiveSearch,
    selectedSquad,
    selectedManager,
    selectedPlatform,
    selectedPriority,
    selectedService,
    selectedStatusFilter,
  ])

  const onboardingClients = filteredClients.filter((c) => c.status === 'ONBOARDING')
  const activeClients = filteredClients.filter((c) => c.status === 'ACTIVE')
  const churnClients = filteredClients.filter((c) => c.status === 'CHURN_RISK')

  const managersList = useMemo(() => {
    const set = new Set<string>()
    clients.forEach((c) => {
      if (c.traffic_manager_name) set.add(c.traffic_manager_name)
      if (c.cs_manager_name) set.add(c.cs_manager_name)
    })
    return Array.from(set)
  }, [clients])

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClientForm.name.trim()) return
    const spend = Number(newClientForm.ad_spend) || 0
    const results = Number(newClientForm.ad_results) || 0
    const cpr = results > 0 ? Number((spend / results).toFixed(2)) : 0

    await createClient({
      name: newClientForm.name.trim(),
      cnpj: newClientForm.cnpj.trim(),
      sector: newClientForm.sector.trim(),
      team_squad: newClientForm.team_squad,
      priority: newClientForm.priority,
      status: newClientForm.status,
      ad_platform: newClientForm.ad_platform,
      service_type: newClientForm.service_type,
      mrr_value: Number(newClientForm.mrr_value) || 0,
      setup_fee: Number(newClientForm.setup_fee) || 0,
      ad_spend: spend,
      ad_results: results,
      ad_cpr: cpr,
      ad_balance: Number(newClientForm.ad_balance) || 0,
      traffic_manager_name: newClientForm.traffic_manager_name,
      designer_name: newClientForm.designer_name,
      cs_manager_name: newClientForm.cs_manager_name,
      contact_name: newClientForm.contact_name,
      contact_phone: newClientForm.contact_phone,
      contact_email: newClientForm.contact_email,
      whatsapp_group_link: newClientForm.whatsapp_group_link,
      last_optimization_date: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    })

    setNewClientForm({
      ...newClientForm,
      name: '',
      cnpj: '',
      contact_name: '',
      contact_phone: '',
      contact_email: '',
    })
    setShowNewClientModal(false)
  }

  const handleSeedSampleClients = async () => {
    const samples: Partial<ClientAccount>[] = [
      {
        name: 'Wilson Cobra Sociedade Individual De Advocacia',
        cnpj: '41.298.110/0001-18',
        sector: 'Advocacia Previdenciária',
        team_squad: 'Sparta',
        priority: 'low',
        status: 'ONBOARDING',
        ad_platform: 'BOTH',
        service_type: 'Tráfego + IA + CRM',
        is_mc: true,
        nps_score: 9,
        last_optimization_date: 'Hoje',
        ad_spend: 0,
        ad_results: 0,
        ad_cpr: 0,
        ad_balance: 1500,
        mrr_value: 2500,
        traffic_manager_name: 'Gabrielly Maia',
        designer_name: 'Felipe Cavalcante',
        cs_manager_name: 'Débora Carvalho',
        connections: {
          meta: 'disconnected',
          google: 'disconnected',
          whatsapp: 'warning',
          ai: 'connected',
          crm: 'connected',
          finance: 'connected',
        },
      },
      {
        name: 'Marcelo Oliveira Teles Advocacia',
        cnpj: '38.114.902/0001-05',
        sector: 'Direito Trabalhista',
        team_squad: 'Sparta',
        priority: 'high',
        status: 'ONBOARDING',
        ad_platform: 'META',
        service_type: 'Tráfego + IA + CRM',
        is_mc: true,
        nps_score: 9,
        last_optimization_date: 'Hoje',
        ad_spend: 0,
        ad_results: 0,
        ad_cpr: 0,
        ad_balance: 2000,
        mrr_value: 2800,
        traffic_manager_name: 'Gabrielly Maia',
        designer_name: 'Mariane Kling',
        cs_manager_name: 'Débora Carvalho',
        connections: {
          meta: 'disconnected',
          google: 'disconnected',
          whatsapp: 'connected',
          ai: 'connected',
          crm: 'connected',
          finance: 'connected',
        },
      },
      {
        name: 'Eulálio Oliveira Soc. Ind. de Advocacia',
        cnpj: '19.442.871/0001-44',
        sector: 'Direito Bancário & Fraudes',
        team_squad: 'Sparta',
        priority: 'low',
        status: 'ACTIVE',
        ad_platform: 'BOTH',
        service_type: 'Tráfego + IA + CRM',
        is_mc: true,
        nps_score: 9,
        last_optimization_date: '13 ago 2026',
        ad_spend: 1083.03,
        ad_results: 306,
        ad_cpr: 3.54,
        ad_balance: 2354.37,
        mrr_value: 3500,
        traffic_manager_name: 'Gabrielly Maia',
        designer_name: 'Felipe Cavalcante',
        cs_manager_name: 'Débora Carvalho',
        connections: {
          meta: 'connected',
          google: 'warning',
          whatsapp: 'connected',
          ai: 'connected',
          crm: 'connected',
          finance: 'connected',
        },
      },
      {
        name: 'MMF Advogadas | Pedro Ottoni & Mega Ads',
        cnpj: '27.801.334/0001-90',
        sector: 'Direito de Família & Sucessões',
        team_squad: 'Fúria',
        priority: 'low',
        status: 'ACTIVE',
        ad_platform: 'GOOGLE',
        service_type: 'Tráfego Pago',
        is_mc: true,
        nps_score: 10,
        last_optimization_date: '9 nov 2026',
        ad_spend: 890.5,
        ad_results: 142,
        ad_cpr: 6.27,
        ad_balance: 1850.0,
        mrr_value: 3000,
        traffic_manager_name: 'Gabrielly Maia',
        designer_name: 'Felipe Cavalcante',
        cs_manager_name: 'Débora Carvalho',
        connections: {
          meta: 'disconnected',
          google: 'connected',
          whatsapp: 'connected',
          ai: 'connected',
          crm: 'connected',
          finance: 'connected',
        },
      },
      {
        name: 'Daniel Augusto Ribeiro Sociedade Individual',
        cnpj: '31.552.109/0001-12',
        sector: 'Direito Previdenciário',
        team_squad: 'Fúria',
        priority: 'medium',
        status: 'ACTIVE',
        ad_platform: 'BOTH',
        service_type: 'Tráfego + IA + CRM',
        is_mc: true,
        nps_score: 9,
        last_optimization_date: '9 nov 2026',
        ad_spend: 491.72,
        ad_results: 103,
        ad_cpr: 4.77,
        ad_balance: 1420.0,
        mrr_value: 2500,
        traffic_manager_name: 'Gabrielly Maia',
        designer_name: 'Mariane Kling',
        cs_manager_name: 'Débora Carvalho',
        connections: {
          meta: 'connected',
          google: 'connected',
          whatsapp: 'connected',
          ai: 'connected',
          crm: 'connected',
          finance: 'connected',
        },
      },
      {
        name: 'Romanzini & Pinto Sociedade de Advogados',
        cnpj: '15.998.002/0001-77',
        sector: 'Direito Empresarial',
        team_squad: 'Sparta',
        priority: 'medium',
        status: 'CHURN_RISK',
        ad_platform: 'BOTH',
        service_type: 'Tráfego + IA + CRM',
        is_mc: true,
        nps_score: 7,
        last_optimization_date: '5 out 2026',
        ad_spend: 376.55,
        ad_results: 54,
        ad_cpr: 6.97,
        ad_balance: 0,
        mrr_value: 2500,
        traffic_manager_name: 'Gabrielly Maia',
        designer_name: 'Felipe Cavalcante',
        cs_manager_name: 'Débora Carvalho',
        connections: {
          meta: 'warning',
          google: 'warning',
          whatsapp: 'connected',
          ai: 'warning',
          crm: 'connected',
          finance: 'warning',
        },
      },
    ]

    for (const item of samples) {
      await createClient(item)
    }
  }

  const handleSendClientNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeClient || !noteInput.trim()) return
    const text = noteInput.trim()
    setNoteInput('')
    await addClientNote(activeClient.id, text, noteType)
  }

  const handleCycleConnectionHealth = async (
    client: ClientAccount,
    key: keyof ClientAccount['connections'],
    e: React.MouseEvent
  ) => {
    e.stopPropagation()
    const order: ConnectionHealth[] = ['connected', 'warning', 'disconnected']
    const current = client.connections[key] || 'connected'
    const next = order[(order.indexOf(current) + 1) % order.length]
    const updatedConnections = { ...client.connections, [key]: next }
    await updateClient(
      client.id,
      { connections: updatedConnections },
      `Integração ${key.toUpperCase()} atualizada para ${next}`,
      'Alteração rápida de status da conexão',
      'INTEGRATION_CHANGED'
    )
  }

  // ============================================================================
  // RENDERIZAÇÃO DA FICHA 360º DO CLIENTE (POPUP GRANDE QUASE TELA INTEIRA)
  // ============================================================================
  const renderClientDetailModal = () => {
    if (!activeClient) return null
    const clientHistory = clientHistoryEvents
      .filter((h) => h.client_id === activeClient.id)
      .filter((h) => (historyFilterUser === 'ALL' ? true : h.actor_name === historyFilterUser))

    // Timeline unificada (CoyCRM Twenty): eventos da tabela activity_timeline vinculados ao cliente ou seus deals
    const crmTimelineEvents = activityTimeline
      .filter(
        (a) =>
          (a.entity_type === 'client' && a.entity_id === activeClient.id) ||
          (a.deal_id && deals.some((d) => d.id === a.deal_id && d.client_id === activeClient.id))
      )
      .map((a) => ({
        id: a.id,
        client_id: activeClient.id,
        event_type: a.event_type.toUpperCase(),
        title: a.title,
        description: a.description || '',
        actor_name: a.metadata?.actor_name ? String(a.metadata.actor_name) : 'Coytech Comercial',
        created_at: a.created_at,
      }))

    const combinedHistory = [...clientHistory, ...crmTimelineEvents].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    const clientNotes = clientTeamNotes
      .filter((n) => n.client_id === activeClient.id)
      .filter((n) => (notesFilterType === 'ALL' ? true : n.note_type === notesFilterType))

    const clientTasks = tasks.filter((t) => t.client_id === activeClient.id)
    const clientWhatsapp = whatsappConversations.filter((w) => w.client_id === activeClient.id)

    const initials = activeClient.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

    const prInfo = PRIORITY_LABELS[activeClient.priority] || PRIORITY_LABELS.medium
    const stInfo = STATUS_LABELS[activeClient.status] || STATUS_LABELS.ONBOARDING

    return (
      <div
        className="fixed inset-0 z-50 bg-[#141414]/85 backdrop-blur-sm p-[12px] sm:p-[20px] md:p-[24px] flex items-center justify-center animate-in fade-in duration-150 overflow-hidden"
        onClick={() => setActiveClientId(null)}
      >
        <div
          className="w-full max-w-[1440px] h-[94vh] max-h-[94vh] bg-[var(--surface)] border border-[var(--line2)] rounded-[20px] shadow-2xl flex flex-col overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* TOPO DA FICHA DO CLIENTE (FIXO COM VOLTAR E SAIR) */}
          <div className="bg-[var(--surface)] border-b border-[var(--line2)] p-[16px] sm:p-[18px] flex flex-col gap-[14px] shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-[12px]">
            <div className="flex items-center gap-[12px] min-w-0">
              <button
                type="button"
                onClick={() => setActiveClientId(null)}
                className="h-[36px] px-[14px] rounded-full bg-[var(--bg)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[12.5px] font-semibold flex items-center gap-[6px] text-[var(--fg)] cursor-pointer transition-colors shrink-0"
                title="Voltar para a lista de clientes"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <div className="w-[40px] h-[40px] rounded-[12px] bg-[#0066FF] text-white font-bold text-[15px] grid place-items-center shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <h2 className="text-[18px] font-bold tracking-[-0.3px] truncate leading-tight">
                  {activeClient.name}
                </h2>
                <div className="text-[12px] text-[var(--ds-muted)] flex items-center gap-[8px] mt-[2px]">
                  <span>Operacional · {activeClient.team_squad}</span>
                  {activeClient.cnpj && <span>· CNPJ {activeClient.cnpj}</span>}
                </div>
              </div>
            </div>

            {/* BARRA DE AÇÕES DIREITA (Alertar | Prioridade | Status | Transferir time | Fechar) */}
            <div className="flex flex-wrap items-center gap-[8px]">
              <button
                type="button"
                onClick={() =>
                  updateClient(
                    activeClient.id,
                    { last_optimization_date: `Alerta em ${new Date().toLocaleDateString('pt-BR')}` },
                    `Alerta operacional disparado para o squad ${activeClient.team_squad}`,
                    'Gestor e CS notificados com prioridade.',
                    'ALERT_TRIGGERED'
                  )
                }
                className="h-[34px] px-[12px] rounded-full bg-[var(--bg)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[12px] font-medium flex items-center gap-[6px] cursor-pointer transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#e8c14a]" />
                <span>Alertar</span>
              </button>

              {/* Seletor de Prioridade */}
              <select
                value={activeClient.priority}
                onChange={(e) => {
                  const nextP = e.target.value as ClientPriority
                  updateClient(
                    activeClient.id,
                    { priority: nextP },
                    `Prioridade alterada para ${PRIORITY_LABELS[nextP].label}`,
                    '',
                    'PRIORITY_CHANGED'
                  )
                }}
                className={`h-[34px] px-[12px] rounded-full border text-[12px] font-medium outline-none cursor-pointer ${prInfo.badge}`}
              >
                <option value="low">• Baixa</option>
                <option value="medium">• Média</option>
                <option value="high">• Alta</option>
                <option value="urgent">• Urgente</option>
              </select>

              {/* Seletor de Status */}
              <select
                value={activeClient.status}
                onChange={(e) => {
                  const nextS = e.target.value as ClientStatus
                  updateClient(
                    activeClient.id,
                    { status: nextS },
                    `Status alterado: ${STATUS_LABELS[activeClient.status].label} → ${STATUS_LABELS[nextS].label}`,
                    '',
                    'STATUS_CHANGED'
                  )
                }}
                className={`h-[34px] px-[12px] rounded-full border text-[12px] font-semibold outline-none cursor-pointer ${stInfo.badge}`}
              >
                <option value="ONBOARDING">• Onboarding</option>
                <option value="ACTIVE">• Ativo</option>
                <option value="CHURN_RISK">• Aviso de Churn</option>
              </select>

              {/* Botão Transferir Time */}
              <button
                type="button"
                onClick={() => {
                  const squads = ['Sparta', 'Fúria', 'Alpha', 'Titans']
                  const nextSquad =
                    squads[(squads.indexOf(activeClient.team_squad) + 1) % squads.length]
                  updateClient(
                    activeClient.id,
                    { team_squad: nextSquad },
                    `Conta transferida de time: ${activeClient.team_squad} → ${nextSquad}`,
                    '',
                    'SQUAD_TRANSFER'
                  )
                }}
                className="h-[34px] px-[12px] rounded-full bg-[var(--bg)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[12px] font-medium flex items-center gap-[6px] cursor-pointer transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
                <span>Transferir time</span>
              </button>

              {/* Botão Gerar Proposta deste Cliente (Regra 9.5) */}
              <button
                type="button"
                onClick={() => {
                  setProposalClient(activeClient)
                  setShowProposalModal(true)
                }}
                className="h-[34px] px-[12px] rounded-full bg-[#0066FF]/15 hover:bg-[#0066FF] text-[#0066FF] hover:text-[#141414] border border-[#0066FF]/35 text-[12px] font-semibold flex items-center gap-[6px] cursor-pointer transition-colors"
                title="Gerar Proposta Comercial Oficial (Regra 9.5) para este cliente"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Gerar proposta</span>
              </button>

              {/* Botão Sair */}
              <button
                type="button"
                onClick={() => setActiveClientId(null)}
                className="h-[34px] px-[14px] rounded-full bg-[#ef4444]/15 hover:bg-[#ef4444] text-[#ef4444] hover:text-[#141414] border border-[#ef4444]/30 hover:border-[#ef4444] text-[12px] font-bold flex items-center gap-[6px] cursor-pointer transition-colors"
                title="Sair da ficha (Esc ou clicar fora)"
              >
                <X className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>

          {/* 12 ABAS HORIZONTAIS DA FICHA 360º (IMAGEM 3) */}
          <div className="flex items-center gap-[4px] overflow-x-auto border-t border-[var(--line)] pt-[10px] no-scrollbar">
            {CLIENT_TABS.map((tab) => {
              const isTabActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-[12px] py-[7px] rounded-[9px] text-[12.5px] whitespace-nowrap transition-colors cursor-pointer ${
                    isTabActive
                      ? 'bg-[#0066FF] text-white font-semibold'
                      : 'text-[var(--ds-muted)] hover:bg-[var(--ds-hover)] hover:text-[var(--fg)]'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

          {/* CORPO ROLÁVEL COM O CONTEÚDO DAS ABAS */}
          <div className="flex-1 overflow-y-auto p-[16px] sm:p-[20px] flex flex-col gap-[16px]">

        {/* INOVAÇÃO 2: RÉGUA DA METODOLOGIA DE 7 ETAPAS */}
        {activeTab === 'Metodologia 7 Etapas' && (
          <MethodologyStepper
            client={activeClient}
            onUpdateClient={async (updated) => {
              await updateClient(
                activeClient.id,
                updated,
                'Metodologia de 7 Etapas atualizada',
                'Avanço de etapa operacional na ficha 360º',
                'MILESTONE_REACHED'
              )
            }}
          />
        )}

        {/* COYCRM TWENTY: ABA CONTATOS 1:N (PESSOAS CHAVE) */}
        {activeTab === 'Contatos' && (
          <ClientContactsTab
            clientId={activeClient.id}
            clientName={activeClient.name}
          />
        )}

        {/* COYCRM TWENTY: ABA OPORTUNIDADES & DEALS */}
        {activeTab === 'Oportunidades' && (
          <ClientDealsTab
            clientId={activeClient.id}
            clientName={activeClient.name}
            onOpenNewDeal={() => setIsNewDealOpen(true)}
          />
        )}

        {/* CONTEÚDO DA ABA SELECIONADA */}
        {activeTab === 'Histórico' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[16px]">
            {/* COLUNA ESQUERDA: HISTÓRICO (FIEL À IMAGEM 3) */}
            <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[20px] flex flex-col gap-[14px] min-h-[540px]">
              <div className="flex items-start justify-between gap-[10px] border-b border-[var(--line)] pb-[12px]">
                <div>
                  <h2 className="text-[15px] font-bold">Histórico</h2>
                  <p className="text-[11.5px] text-[var(--ds-muted)]">
                    Tudo que aconteceu no cliente — cobranças, integrações, mudanças de status e ações do time.
                  </p>
                </div>
                <select
                  value={historyFilterUser}
                  onChange={(e) => setHistoryFilterUser(e.target.value)}
                  className="h-[32px] px-[10px] rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[11.5px] text-[var(--fg)] outline-none"
                >
                  <option value="ALL">Todos os usuários</option>
                  <option value="Administrador">Administrador</option>
                  <option value="Erick Cecato Reis">Erick Cecato Reis</option>
                  <option value="Álvaro Bastos">Álvaro Bastos</option>
                </select>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-[14px] pr-[4px]">
                {combinedHistory.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start gap-[12px] pb-[12px] border-b border-[var(--line)] last:border-b-0"
                  >
                    <div className="w-[26px] h-[26px] rounded-full bg-[var(--bg)] border border-[var(--line2)] grid place-items-center shrink-0 mt-[2px]">
                      {ev.event_type === 'RESPONSIBLE_ASSIGNED' ? (
                        <UserCheck className="w-3.5 h-3.5 text-[#0066FF]" />
                      ) : ev.event_type === 'CONTRACT_ATTACHED' ? (
                        <FileText className="w-3.5 h-3.5 text-[#38bdf8]" />
                      ) : ev.event_type === 'WHATSAPP_LINKED' ? (
                        <MessageSquare className="w-3.5 h-3.5 text-[#2f9e5a]" />
                      ) : ev.event_type === 'STAGE_CHANGE' || ev.event_type === 'DEAL' ? (
                        <TrendingUp className="w-3.5 h-3.5 text-[#F0521F]" />
                      ) : (
                        <span className="w-[6px] h-[6px] rounded-full bg-[#F0521F]"></span>
                      )}
                    </div>
                    <div className="flex flex-col gap-[2px] min-w-0">
                      <div className="text-[13px] font-semibold text-[var(--fg)]">{ev.title}</div>
                      {ev.description && (
                        <div className="text-[11.5px] text-[var(--ds-muted)]">{ev.description}</div>
                      )}
                      <div className="text-[11px] text-[var(--ds-muted)]">
                        {ev.created_at} · por {ev.actor_name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUNA DIREITA: ANOTAÇÕES DO TIME (FIEL À IMAGEM 3) */}
            <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[20px] flex flex-col gap-[14px] min-h-[540px]">
              <div className="flex flex-col gap-[10px] border-b border-[var(--line)] pb-[12px]">
                <div className="flex items-start justify-between gap-[10px]">
                  <div>
                    <h2 className="text-[15px] font-bold">Anotações do time</h2>
                    <p className="text-[11.5px] text-[var(--ds-muted)]">
                      Registre o que está sendo feito — @ menciona (a pessoa é notificada) e dá pra anexar documento, foto, vídeo ou gravar a tela.
                    </p>
                  </div>
                  <span className="h-[30px] px-[10px] rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[11px] text-[var(--ds-muted)] flex items-center shrink-0">
                    Todos os autores
                  </span>
                </div>

                <div className="flex items-center gap-[8px]">
                  <select
                    value={notesFilterType}
                    onChange={(e) => setNotesFilterType(e.target.value)}
                    className="h-[30px] px-[10px] rounded-full bg-[var(--bg)] border border-[var(--line2)] text-[11.5px] text-[var(--fg)] outline-none"
                  >
                    <option value="ALL">Todos os tipos</option>
                    <option value="GERAL">Geral</option>
                    <option value="OTIMIZACAO">Otimização de Campanha</option>
                    <option value="ALINHAMENTO">Alinhamento com Cliente</option>
                    <option value="ALERTA">Alerta de Conta</option>
                  </select>

                  <span className="h-[30px] px-[12px] rounded-full bg-[var(--bg)] border border-[var(--line2)] text-[11.5px] text-[var(--ds-muted)] flex items-center gap-[6px]">
                    <Calendar className="w-3 h-3" />
                    O período todo
                  </span>
                </div>
              </div>

              {/* Lista de Anotações */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-[10px] pr-[4px]">
                {clientNotes.length === 0 ? (
                  <div className="flex-1 grid place-items-center text-center py-[60px]">
                    <div className="text-[13px] text-[var(--ds-muted)]">
                      Nenhuma anotação ainda — registre a primeira.
                    </div>
                  </div>
                ) : (
                  clientNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-[var(--bg)] border border-[var(--line2)] rounded-[12px] p-[14px] flex flex-col gap-[6px]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-[8px]">
                          <span className="text-[12px] font-semibold text-[#0066FF]">
                            {note.author_name}
                          </span>
                          <span className="text-[10px] px-[6px] py-[1px] rounded-[5px] bg-[var(--surface)] border border-[var(--line2)] text-[var(--ds-muted)]">
                            {note.note_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-[8px]">
                          <span className="text-[11px] text-[var(--ds-muted)]">
                            {note.created_at}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteClientNote(note.id)}
                            className="text-[var(--ds-muted)] hover:text-[#0066FF] cursor-pointer"
                            title="Excluir anotação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[13px] text-[var(--fg)] leading-[1.45] whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Input Inferior de Anotação + Enviar (FIEL À IMAGEM 3) */}
              <form
                onSubmit={handleSendClientNote}
                className="pt-[10px] border-t border-[var(--line)] flex items-center gap-[8px]"
              >
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value)}
                  className="h-[42px] px-[10px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[11.5px] text-[var(--fg)] outline-none"
                >
                  <option value="GERAL">Geral</option>
                  <option value="OTIMIZACAO">Otimização</option>
                  <option value="ALINHAMENTO">Reunião</option>
                  <option value="ALERTA">Alerta</option>
                </select>
                <input
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Anotação... (use @ para mencionar alguém do time)"
                  className="flex-1 h-[42px] px-[14px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] focus:border-[#0066FF] text-[13px] text-[var(--fg)] outline-none"
                />
                <button
                  type="submit"
                  className="h-[42px] px-[18px] rounded-[10px] bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-[13px] flex items-center gap-[6px] cursor-pointer transition-colors"
                >
                  <span>Enviar</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ABA: TRÁFEGO */}
        {activeTab === 'Tráfego' && (
          <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[22px] flex flex-col gap-[18px]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold">Métricas de Tráfego Pago da Conta</h2>
                <p className="text-[12px] text-[var(--ds-muted)]">
                  Atualize o gasto, leads gerados, CPR e saldo disponível de {activeClient.name}.
                </p>
              </div>
              <span className="px-[10px] py-[4px] rounded-full bg-[#0066FF]/15 text-[#0066FF] text-[12px] font-semibold">
                Última otimização: {activeClient.last_optimization_date}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-[14px]">
              <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[14px] p-[16px]">
                <div className="text-[11.5px] text-[var(--ds-muted)]">Gasto acumulado</div>
                <div className="text-[24px] font-bold mt-[4px]">
                  R$ {activeClient.ad_spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[14px] p-[16px]">
                <div className="text-[11.5px] text-[var(--ds-muted)]">Resultados (Leads)</div>
                <div className="text-[24px] font-bold mt-[4px]">{activeClient.ad_results}</div>
              </div>
              <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[14px] p-[16px]">
                <div className="text-[11.5px] text-[var(--ds-muted)]">Custo por Resultado (CPR)</div>
                <div className="text-[24px] font-bold text-[#0066FF] mt-[4px]">
                  R$ {activeClient.ad_cpr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[14px] p-[16px]">
                <div className="text-[11.5px] text-[var(--ds-muted)]">Saldo em conta</div>
                <div className="text-[24px] font-bold text-[#2f9e5a] mt-[4px]">
                  R$ {activeClient.ad_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                const spend = Number(fd.get('ad_spend')) || 0
                const results = Number(fd.get('ad_results')) || 0
                const balance = Number(fd.get('ad_balance')) || 0
                const platform = fd.get('ad_platform') as ClientAdPlatform
                const cpr = results > 0 ? Number((spend / results).toFixed(2)) : 0
                const todayStr = new Date().toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
                updateClient(
                  activeClient.id,
                  {
                    ad_spend: spend,
                    ad_results: results,
                    ad_cpr: cpr,
                    ad_balance: balance,
                    ad_platform: platform,
                    last_optimization_date: todayStr,
                  },
                  `Otimização de Tráfego registrada (Gasto R$ ${spend.toFixed(2)} · ${results} leads · CPR R$ ${cpr.toFixed(2)})`,
                  `Realizado por ${activeClient.traffic_manager_name}`,
                  'TRAFFIC_OPTIMIZED'
                )
              }}
              className="grid grid-cols-1 sm:grid-cols-5 gap-[12px] pt-[12px] border-t border-[var(--line)] items-end"
            >
              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Gasto (R$)
                <input
                  name="ad_spend"
                  type="number"
                  step="0.01"
                  defaultValue={activeClient.ad_spend}
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>
              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Resultados (Leads)
                <input
                  name="ad_results"
                  type="number"
                  defaultValue={activeClient.ad_results}
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>
              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Saldo disponível (R$)
                <input
                  name="ad_balance"
                  type="number"
                  step="0.01"
                  defaultValue={activeClient.ad_balance}
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>
              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Plataforma ativa
                <select
                  name="ad_platform"
                  defaultValue={activeClient.ad_platform}
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                >
                  <option value="META">Meta Ads</option>
                  <option value="GOOGLE">Google Ads</option>
                  <option value="BOTH">Ambos (Meta + Google)</option>
                </select>
              </label>
              <button
                type="submit"
                className="h-[42px] rounded-[10px] bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-[13px] cursor-pointer transition-colors"
              >
                Registrar otimização
              </button>
            </form>
          </div>
        )}

        {/* ABA: DEMANDAS (VINCULADA AO KANBAN DE TAREFAS) */}
        {activeTab === 'Demandas' && (
          <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[22px] flex flex-col gap-[16px]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold">Demandas & Tarefas deste Cliente</h2>
                <p className="text-[12px] text-[var(--ds-muted)]">
                  Todas as tarefas criadas aqui aparecem automaticamente no quadro Kanban da equipe.
                </p>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!newClientTaskTitle.trim()) return
                await createTask({
                  title: newClientTaskTitle.trim(),
                  client_id: activeClient.id,
                  client_name_snapshot: activeClient.name,
                  list_id: taskLists[0]?.id || null,
                  status_key: 'A FAZER',
                  priority: activeClient.priority,
                  assignee_name: activeClient.traffic_manager_name || 'Equipe',
                })
                setNewClientTaskTitle('')
              }}
              className="flex items-center gap-[10px]"
            >
              <input
                value={newClientTaskTitle}
                onChange={(e) => setNewClientTaskTitle(e.target.value)}
                placeholder="Nova demanda para este cliente (ex: Subir criativos novos de Meta Ads)..."
                className="flex-1 h-[44px] px-[14px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] focus:border-[#0066FF] text-[13px] text-[var(--fg)] outline-none"
              />
              <button
                type="submit"
                className="h-[44px] px-[18px] rounded-[10px] bg-[#0066FF] text-white font-semibold text-[13px] cursor-pointer"
              >
                + Criar demanda
              </button>
            </form>

            {clientTasks.length === 0 ? (
              <div className="py-[40px] text-center text-[13px] text-[var(--ds-muted)]">
                Nenhuma demanda vinculada a este cliente ainda.
              </div>
            ) : (
              <div className="flex flex-col gap-[8px]">
                {clientTasks.map((t) => (
                  <div
                    key={t.id}
                    className="bg-[var(--bg)] border border-[var(--line2)] rounded-[12px] p-[14px] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-[10px]">
                      <CheckSquare className="w-4 h-4 text-[#0066FF]" />
                      <div>
                        <div className="text-[13.5px] font-semibold">{t.title}</div>
                        <div className="text-[11.5px] text-[var(--ds-muted)]">
                          Responsável: {t.assignee_name || 'Time'} · Criada em {t.created_at}
                        </div>
                      </div>
                    </div>
                    <span className="px-[10px] py-[4px] rounded-full bg-[var(--surface)] border border-[var(--line2)] text-[11px] font-semibold">
                      {t.status_key}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: AGENDA */}
        {activeTab === 'Agenda' && (
          <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[22px] flex flex-col gap-[16px]">
            <h2 className="text-[16px] font-bold">Agenda de Reuniões, Onboarding & QBR</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!newAgendaTitle.trim()) return
                const nextAgenda = [
                  ...(activeClient.agenda_items || []),
                  {
                    id: `ag-${Date.now()}`,
                    title: newAgendaTitle.trim(),
                    date: newAgendaDate || new Date().toLocaleDateString('pt-BR'),
                    type: 'Reunião Executiva',
                    status: 'Confirmada',
                  },
                ]
                setNewAgendaTitle('')
                setNewAgendaDate('')
                await updateClient(
                  activeClient.id,
                  { agenda_items: nextAgenda },
                  `Reunião agendada: ${newAgendaTitle.trim()}`,
                  '',
                  'MEETING_SCHEDULED'
                )
              }}
              className="flex flex-wrap items-center gap-[10px]"
            >
              <input
                value={newAgendaTitle}
                onChange={(e) => setNewAgendaTitle(e.target.value)}
                placeholder="Título do compromisso (ex: Call de Alinhamento Mensal / QBR)..."
                className="flex-1 min-w-[240px] h-[42px] px-[14px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)] outline-none"
              />
              <input
                type="date"
                value={newAgendaDate}
                onChange={(e) => setNewAgendaDate(e.target.value)}
                className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)] outline-none"
              />
              <button
                type="submit"
                className="h-[42px] px-[16px] rounded-[10px] bg-[#0066FF] text-white font-semibold text-[13px] cursor-pointer"
              >
                + Agendar
              </button>
            </form>

            {(activeClient.agenda_items || []).length === 0 ? (
              <div className="py-[32px] text-center text-[13px] text-[var(--ds-muted)]">
                Nenhuma reunião agendada ainda.
              </div>
            ) : (
              <div className="flex flex-col gap-[8px]">
                {activeClient.agenda_items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[var(--bg)] border border-[var(--line2)] rounded-[12px] p-[14px] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-[13.5px] font-semibold">{item.title}</div>
                      <div className="text-[11.5px] text-[var(--ds-muted)]">
                        Data: {item.date} · {item.type}
                      </div>
                    </div>
                    <span className="px-[10px] py-[4px] rounded-full bg-[#2f9e5a]/15 text-[#2f9e5a] text-[11px] font-semibold">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABAS COMPLEMENTARES: COMUNICAÇÃO, RESULTADO, CS, PERFIL COMERCIAL, BRIEFING, BACKUPS, INFORMAÇÕES, CONFIGURAÇÃO */}
        {(activeTab === 'Comunicação' ||
          activeTab === 'Resultado' ||
          activeTab === 'Customer Success' ||
          activeTab === 'Perfil Comercial' ||
          activeTab === 'Briefing' ||
          activeTab === 'Backups' ||
          activeTab === 'Informações' ||
          activeTab === 'Configuração') && (
          <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[22px] flex flex-col gap-[18px]">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-[12px]">
              <div>
                <h2 className="text-[16px] font-bold">
                  {activeTab} · {activeClient.name}
                </h2>
                <p className="text-[12px] text-[var(--ds-muted)]">
                  Edite os dados abaixo e salve diretamente no banco Supabase com registro automático no histórico.
                </p>
              </div>
              <div className="flex items-center gap-[8px]">
                {activeClient.contact_phone && (
                  <Link
                    href={`/atendimento?phone=${encodeURIComponent(
                      activeClient.contact_phone.replace(/\D/g, '')
                    )}`}
                    className="h-[36px] px-[14px] rounded-full bg-[#0066FF]/15 hover:bg-[#0066FF] text-[#0066FF] hover:text-[#141414] border border-[#0066FF]/35 text-[12px] font-semibold flex items-center gap-[6px] transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Abrir conversa no Atendimento WhatsApp</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
                {activeTab === 'Configuração' && (
                  <button
                    type="button"
                    onClick={() => {
                      const idToRemove = activeClient.id
                      setActiveClientId(null)
                      deleteClient(idToRemove)
                    }}
                    className="h-[36px] px-[14px] rounded-full bg-[#ef4444]/15 hover:bg-[#ef4444]/25 text-[#ef4444] text-[12px] font-semibold flex items-center gap-[6px] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir cliente</span>
                  </button>
                )}
              </div>
            </div>

            {activeTab === 'Comunicação' && (
              <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[14px] p-[16px] flex flex-col gap-[12px]">
                <div className="flex flex-wrap items-center justify-between gap-[10px]">
                  <div className="flex items-center gap-[8px]">
                    <span className="w-[7px] h-[7px] rounded-full bg-[#2f9e5a]"></span>
                    <span className="text-[13px] font-bold">
                      Histórico WhatsApp Sincronizado (Z-API + n8n + Supabase)
                    </span>
                    <span className="text-[11px] px-[8px] py-[2px] rounded-full bg-[var(--surface)] border border-[var(--line2)] text-[var(--ds-muted)]">
                      {activeClient.contact_phone || 'Sem telefone vinculado'} ·{' '}
                      {clientN8nMessages.length + clientWhatsapp.length} interações
                    </span>
                  </div>
                  {activeClient.contact_phone && (
                    <Link
                      href={`/atendimento?phone=${encodeURIComponent(
                        activeClient.contact_phone.replace(/\D/g, '')
                      )}`}
                      className="text-[11.5px] font-semibold text-[#0066FF] hover:underline flex items-center gap-[4px]"
                    >
                      <span>Responder ao vivo no Inbox</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {loadingN8nMessages ? (
                  <div className="text-[12px] text-[var(--ds-muted)] py-[14px]">
                    Carregando histórico de mensagens da tabela n8n_chat_histories...
                  </div>
                ) : clientN8nMessages.length === 0 ? (
                  <div className="text-[12px] text-[var(--ds-muted)] py-[10px]">
                    Nenhuma mensagem registrada na tabela n8n_chat_histories para este número ainda. Vincule o telefone WhatsApp abaixo ou abra o Atendimento para iniciar.
                  </div>
                ) : (
                  <div className="max-h-[260px] overflow-y-auto flex flex-col gap-[8px] pr-[4px]">
                    {clientN8nMessages.map((msg) => {
                      const isClient = msg.message?.type === 'human'
                      const timeStr = new Date(msg.hora_data_mensagem).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isClient ? 'items-start' : 'items-end'}`}
                        >
                          <div
                            className={`max-w-[82%] rounded-[12px] px-[12px] py-[8px] text-[12.5px] border ${
                              isClient
                                ? 'bg-[var(--surface)] border-[var(--line2)] text-[var(--fg)]'
                                : 'bg-[#0066FF]/12 border-[#0066FF]/30 text-[var(--fg)]'
                            }`}
                          >
                            <div className="text-[10.5px] font-semibold text-[#0066FF] mb-[2px]">
                              {isClient
                                ? activeClient.name
                                : msg.message?.sender_name || 'Brenda · IA'}
                            </div>
                            <div>{msg.message?.content}</div>
                            <div className="text-[10px] text-[var(--ds-muted)] text-right mt-[3px]">
                              {timeStr}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                const updates: Partial<ClientAccount> = {
                  name: String(fd.get('name') || activeClient.name),
                  cnpj: String(fd.get('cnpj') || activeClient.cnpj),
                  sector: String(fd.get('sector') || activeClient.sector),
                  service_type: String(fd.get('service_type') || activeClient.service_type),
                  traffic_manager_name: String(
                    fd.get('traffic_manager_name') || activeClient.traffic_manager_name
                  ),
                  designer_name: String(fd.get('designer_name') || activeClient.designer_name),
                  cs_manager_name: String(
                    fd.get('cs_manager_name') || activeClient.cs_manager_name
                  ),
                  contact_name: String(fd.get('contact_name') || activeClient.contact_name),
                  contact_phone: String(fd.get('contact_phone') || activeClient.contact_phone),
                  contact_email: String(fd.get('contact_email') || activeClient.contact_email),
                  whatsapp_group_link: String(
                    fd.get('whatsapp_group_link') || activeClient.whatsapp_group_link
                  ),
                  drive_folder_link: String(
                    fd.get('drive_folder_link') || activeClient.drive_folder_link
                  ),
                  mrr_value: Number(fd.get('mrr_value') ?? activeClient.mrr_value),
                  setup_fee: Number(fd.get('setup_fee') ?? activeClient.setup_fee),
                  nps_score: Number(fd.get('nps_score') ?? activeClient.nps_score),
                  briefing_data: {
                    ...activeClient.briefing_data,
                    publico_alvo: String(
                      fd.get('publico_alvo') || activeClient.briefing_data?.publico_alvo || ''
                    ),
                    oferta_principal: String(
                      fd.get('oferta_principal') ||
                        activeClient.briefing_data?.oferta_principal ||
                        ''
                    ),
                  },
                }
                updateClient(
                  activeClient.id,
                  updates,
                  `Dados da aba "${activeTab}" atualizados`,
                  `Atualizado no painel 360º`,
                  'INFO_UPDATED'
                )
              }}
              className="grid grid-cols-1 md:grid-cols-3 gap-[14px]"
            >
              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Nome / Razão Social
                <input
                  name="name"
                  defaultValue={activeClient.name}
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>
              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                CNPJ
                <input
                  name="cnpj"
                  defaultValue={activeClient.cnpj}
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>
              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Nicho / Setor
                <input
                  name="sector"
                  defaultValue={activeClient.sector}
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>

              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Gestor de Tráfego Responsável
                <input
                  name="traffic_manager_name"
                  defaultValue={activeClient.traffic_manager_name}
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>
              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Designer de Mídia Responsável
                <input
                  name="designer_name"
                  defaultValue={activeClient.designer_name}
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>
              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Customer Success (CS)
                <input
                  name="cs_manager_name"
                  defaultValue={activeClient.cs_manager_name}
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>

              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Fee Mensal / MRR (R$)
                <input
                  name="mrr_value"
                  type="number"
                  defaultValue={activeClient.mrr_value}
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>
              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Taxa de Setup (R$)
                <input
                  name="setup_fee"
                  type="number"
                  defaultValue={activeClient.setup_fee}
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>
              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Nota NPS (0 a 10)
                <input
                  name="nps_score"
                  type="number"
                  min="0"
                  max="10"
                  defaultValue={activeClient.nps_score}
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>

              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                WhatsApp do Contato (Z-API / n8n)
                <input
                  name="contact_phone"
                  defaultValue={activeClient.contact_phone}
                  placeholder="Ex: 5511988771234"
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>
              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Link do Grupo de WhatsApp
                <input
                  name="whatsapp_group_link"
                  defaultValue={activeClient.whatsapp_group_link}
                  placeholder="https://chat.whatsapp.com/..."
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>
              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Link da Pasta Google Drive / Backups
                <input
                  name="drive_folder_link"
                  defaultValue={activeClient.drive_folder_link}
                  placeholder="https://drive.google.com/..."
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>
              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Serviço Contratado
                <input
                  name="service_type"
                  defaultValue={activeClient.service_type}
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>

              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)] md:col-span-2">
                Briefing · Público-Alvo & Regiões
                <input
                  name="publico_alvo"
                  defaultValue={activeClient.briefing_data?.publico_alvo || ''}
                  placeholder="Ex: Aposentados INSS, Trabalhista Bancário em SP e MG..."
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>
              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Briefing · Oferta / Tese Principal
                <input
                  name="oferta_principal"
                  defaultValue={activeClient.briefing_data?.oferta_principal || ''}
                  placeholder="Ex: Revisão da Vida Toda / Horas Extras"
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>

              <div className="md:col-span-3 flex justify-end pt-[8px]">
                <button
                  type="submit"
                  className="h-[44px] px-[24px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-[13px] cursor-pointer transition-colors"
                >
                  Salvar informações do cliente
                </button>
              </div>
            </form>
          </div>
        )}
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDERIZAÇÃO DO PAINEL DE MONITORAMENTO DE CONTAS (IMAGEM 2)
  // ============================================================================
  const renderClientCard = (client: ClientAccount) => {
    const pr = PRIORITY_LABELS[client.priority] || PRIORITY_LABELS.medium
    const st = STATUS_LABELS[client.status] || STATUS_LABELS.ONBOARDING
    const npsCategory =
      client.nps_score >= 9 ? 'Promotor' : client.nps_score >= 7 ? 'Neutro' : 'Detrator'
    const npsBadgeColor =
      client.nps_score >= 9
        ? 'bg-[#2f9e5a]/15 text-[#2f9e5a]'
        : client.nps_score >= 7
          ? 'bg-[#e8c14a]/15 text-[#e8c14a]'
          : 'bg-[#ef4444]/15 text-[#ef4444]'

    const connItems: {
      key: keyof ClientAccount['connections']
      short: string
      title: string
    }[] = [
      { key: 'meta', short: 'f', title: 'Meta Ads' },
      { key: 'google', short: 'G', title: 'Google Ads' },
      { key: 'whatsapp', short: 'W', title: 'WhatsApp' },
      { key: 'ai', short: 'IA', title: 'Agente IA' },
      { key: 'crm', short: 'C', title: 'CRM' },
      { key: 'finance', short: 'R$', title: 'Financeiro' },
    ]

    return (
      <div
        key={client.id}
        onClick={() => {
          setActiveClientId(client.id)
          setActiveTab('Histórico')
        }}
        className={`bg-[var(--surface)] border-[1.5px] ${st.borderCard} rounded-[14px] p-[14px] flex flex-col justify-between gap-[10px] cursor-pointer transition-all hover:-translate-y-[1px]`}
      >
        <div className="flex flex-col gap-[8px]">
          {/* Nome do Cliente */}
          <div className="text-[13px] font-bold text-[var(--fg)] leading-[1.25] line-clamp-1">
            {client.name}
          </div>

          {/* Linha de Badges: Prioridade | Status | MC | NPS */}
          <div className="flex flex-wrap items-center justify-between gap-[4px]">
            <div className="flex flex-wrap items-center gap-[4px]">
              <span
                className={`inline-flex items-center gap-[4px] px-[7px] py-[2px] rounded-[6px] border text-[10.5px] font-medium ${pr.badge}`}
              >
                <span className={`w-[5px] h-[5px] rounded-full ${pr.dot}`}></span>
                {pr.label}
              </span>

              <span
                className={`px-[7px] py-[2px] rounded-[6px] border text-[10.5px] font-semibold ${st.badge}`}
              >
                {st.label}
              </span>

              {client.is_mc && (
                <span className="px-[6px] py-[2px] rounded-[6px] bg-[var(--bg)] border border-[var(--line2)] text-[10px] font-semibold text-[var(--ds-muted)]">
                  MC
                </span>
              )}
            </div>

            <div className="flex items-center gap-[4px] text-[10.5px]">
              <span className="font-semibold text-[var(--ds-muted)]">NPS {client.nps_score}</span>
              <span className={`px-[6px] py-[1px] rounded-[5px] font-semibold ${npsBadgeColor}`}>
                {npsCategory}
              </span>
            </div>
          </div>

          {/* Squad */}
          <div className="text-[11px] text-[var(--ds-muted)] font-medium">{client.team_squad}</div>

          {/* Badge de Data da última otimização + Plataformas */}
          <div className="flex items-center gap-[6px]">
            <span className="inline-flex items-center gap-[5px] px-[8px] py-[2px] rounded-[6px] bg-[#0066FF]/15 text-[#0066FF] text-[10.5px] font-semibold">
              <span>
                {client.ad_platform === 'BOTH'
                  ? 'f + G'
                  : client.ad_platform === 'META'
                    ? 'f Meta'
                    : 'G Google'}
              </span>
              <span>· {client.last_optimization_date}</span>
            </span>
          </div>

          {/* Métricas de Tráfego no Card (Gasto, Result., CPR, Saldo) */}
          <div className="text-[11px] leading-[1.45] text-[var(--ds-muted)] pt-[2px]">
            <div>
              Gasto:{' '}
              <strong className="text-[var(--fg)]">
                R$ {client.ad_spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div>
              Result.:{' '}
              <strong className="text-[var(--fg)]">
                {client.ad_results > 0 ? client.ad_results : '—'}
              </strong>
              {client.ad_results > 0 && (
                <span>
                  {' '}
                  · CPR{' '}
                  <strong className="text-[var(--fg)]">
                    R$ {client.ad_cpr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </span>
              )}
            </div>
            <div>
              Saldo:{' '}
              <span className="text-[var(--fg)]">
                R$ {client.ad_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* BARRA INFERIOR DE 6 ÍCONES DE CONEXÃO (FIEL À IMAGEM 2) */}
        <div className="grid grid-cols-6 gap-[5px] pt-[8px] border-t border-[var(--line)]">
          {connItems.map((ci) => {
            const state = client.connections?.[ci.key] || 'connected'
            const dotColor =
              state === 'connected'
                ? 'bg-[#2f9e5a]'
                : state === 'warning'
                  ? 'bg-[#e8c14a]'
                  : 'bg-[#ef4444]'
            const borderBox =
              state === 'disconnected'
                ? 'border-dashed border-[var(--line2)] text-[var(--ds-muted)] opacity-60'
                : state === 'warning'
                  ? 'border-[#0066FF] text-[var(--fg)]'
                  : 'border-[var(--line2)] text-[var(--fg)]'

            return (
              <button
                key={ci.key}
                type="button"
                onClick={(e) => handleCycleConnectionHealth(client, ci.key, e)}
                title={`${ci.title}: ${state} (clique para alternar)`}
                className={`relative h-[28px] rounded-[7px] bg-[var(--bg)] border ${borderBox} grid place-items-center text-[10.5px] font-bold hover:border-[#0066FF] transition-colors cursor-pointer`}
              >
                <span>{ci.short}</span>
                <span
                  className={`absolute -top-[3px] -right-[3px] w-[7px] h-[7px] rounded-full ${dotColor}`}
                ></span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="px-[26px] pt-[18px] pb-[40px] flex flex-col gap-[16px]">
      {/* HEADER DE CLIENTES (FIEL À IMAGEM 2) */}
      <div className="flex flex-wrap items-center justify-between gap-[14px]">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.6px] leading-tight">Clientes</h1>
          <p className="text-[13px] text-[var(--ds-muted)]">
            Painel de monitoramento das contas. Clique num cliente para abrir.
          </p>
        </div>

        <div className="flex items-center gap-[10px]">
          <button
            type="button"
            onClick={() => setMemberViewMode(!memberViewMode)}
            className={`h-[38px] px-[14px] rounded-full border text-[12.5px] font-medium flex items-center gap-[7px] cursor-pointer transition-colors ${
              memberViewMode
                ? 'bg-[#0066FF]/15 border-[#0066FF] text-[#0066FF]'
                : 'bg-[var(--surface)] border-[var(--line2)] text-[var(--fg)] hover:bg-[var(--ds-hover)]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{memberViewMode ? 'Visão membro ativa' : 'Ver como membro'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setProposalClient(null)
              setShowProposalModal(true)
            }}
            className="h-[38px] px-[16px] rounded-full bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[#0066FF]/40 text-[#0066FF] font-semibold text-[13px] flex items-center gap-[6px] cursor-pointer transition-colors shadow-sm"
            title="Gerar proposta comercial oficial discriminando criação, adaptação, implementação, treinamento, infra e suporte"
          >
            <FileText className="w-4 h-4" />
            <span>Gerar Proposta (Regra 9.5)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowNewClientModal(true)}
            className="h-[38px] px-[18px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-[13px] flex items-center gap-[6px] cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2.4} />
            <span>Novo cliente</span>
          </button>
        </div>
      </div>

      {/* BARRA DE BUSCA + TOGGLE CARDS/DASHBOARD + ATUALIZAR */}
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <div className="flex items-center gap-[8px] bg-[var(--surface)] border border-[var(--line2)] rounded-full px-[14px] h-[38px] w-full sm:w-[320px]">
          <Search className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
          <input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="bg-transparent border-0 outline-none text-[12.5px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] w-full"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => setLocalSearch('')}
              className="text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-[8px]">
          <div className="flex items-center bg-[var(--surface)] border border-[var(--line2)] rounded-full p-[3px]">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-[14px] py-[5px] rounded-full text-[12px] font-semibold cursor-pointer transition-colors ${
                viewMode === 'cards'
                  ? 'bg-[#0066FF] text-white'
                  : 'text-[var(--ds-muted)] hover:text-[var(--fg)]'
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('dashboard')}
              className={`px-[14px] py-[5px] rounded-full text-[12px] font-semibold cursor-pointer transition-colors ${
                viewMode === 'dashboard'
                  ? 'bg-[#0066FF] text-white'
                  : 'text-[var(--ds-muted)] hover:text-[var(--fg)]'
              }`}
            >
              Dashboard
            </button>
          </div>

          <button
            type="button"
            onClick={() => refreshFromDatabase()}
            className="h-[36px] px-[14px] rounded-full bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[12px] font-medium flex items-center gap-[6px] cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS RÁPIDOS (FIEL À IMAGEM 2) */}
      <div className="flex flex-wrap items-center gap-[8px]">
        <select
          value={selectedSquad}
          onChange={(e) => setSelectedSquad(e.target.value)}
          className="h-[32px] px-[12px] rounded-full bg-[var(--surface)] border border-[var(--line2)] text-[11.5px] text-[var(--fg)] outline-none cursor-pointer"
        >
          <option value="ALL">Times (Todos)</option>
          <option value="Sparta">Sparta</option>
          <option value="Fúria">Fúria</option>
          <option value="Alpha">Alpha</option>
          <option value="Titans">Titans</option>
        </select>

        <select
          value={selectedManager}
          onChange={(e) => setSelectedManager(e.target.value)}
          className="h-[32px] px-[12px] rounded-full bg-[var(--surface)] border border-[var(--line2)] text-[11.5px] text-[var(--fg)] outline-none cursor-pointer"
        >
          <option value="ALL">Responsável (Todos)</option>
          {managersList.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* Pílula Meta | Google | Ambos */}
        <div className="flex items-center bg-[var(--surface)] border border-[var(--line2)] rounded-full p-[2px]">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'META', label: 'f Meta' },
            { id: 'GOOGLE', label: 'G Google' },
            { id: 'BOTH', label: 'f + G Ambos' },
          ].map((plt) => (
            <button
              key={plt.id}
              type="button"
              onClick={() => setSelectedPlatform(plt.id)}
              className={`px-[10px] py-[4px] rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                selectedPlatform === plt.id
                  ? 'bg-[#0066FF] text-white'
                  : 'text-[var(--ds-muted)] hover:text-[var(--fg)]'
              }`}
            >
              {plt.label}
            </button>
          ))}
        </div>

        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="h-[32px] px-[12px] rounded-full bg-[var(--surface)] border border-[var(--line2)] text-[11.5px] text-[var(--fg)] outline-none cursor-pointer"
        >
          <option value="ALL">Prioridade</option>
          <option value="low">Baixa</option>
          <option value="medium">Média</option>
          <option value="high">Alta</option>
          <option value="urgent">Urgente</option>
        </select>

        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          className="h-[32px] px-[12px] rounded-full bg-[var(--surface)] border border-[var(--line2)] text-[11.5px] text-[var(--fg)] outline-none cursor-pointer"
        >
          <option value="ALL">Serviço</option>
          <option value="Tráfego + IA + CRM">Tráfego + IA + CRM</option>
          <option value="Tráfego Pago">Tráfego Pago</option>
          <option value="Automação IA">Automação IA</option>
        </select>

        <select
          value={selectedStatusFilter}
          onChange={(e) => setSelectedStatusFilter(e.target.value)}
          className="h-[32px] px-[12px] rounded-full bg-[var(--surface)] border border-[var(--line2)] text-[11.5px] text-[var(--fg)] outline-none cursor-pointer"
        >
          <option value="ALL">Status</option>
          <option value="ONBOARDING">Onboarding</option>
          <option value="ACTIVE">Ativo</option>
          <option value="CHURN_RISK">Aviso de churn</option>
        </select>
      </div>

      {/* ESTADO VAZIO OU QUADRO DE 3 COLUNAS (ONBOARDING | ATIVO | AVISO DE CHURN) */}
      {clients.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] p-[36px] flex flex-col items-center justify-center text-center gap-[14px]">
          <div className="w-[48px] h-[48px] rounded-full bg-[#0066FF]/15 text-[#0066FF] grid place-items-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="max-w-[460px]">
            <h2 className="text-[18px] font-bold">Sua carteira de clientes está pronta</h2>
            <p className="text-[13px] text-[var(--ds-muted)] mt-[4px]">
              Adicione seu primeiro cliente ou carregue uma carteira de demonstração igual à referência para testar as 3 colunas (Onboarding, Ativo e Aviso de Churn) e a Ficha 360º.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-[10px] mt-[4px]">
            <button
              type="button"
              onClick={() => setShowNewClientModal(true)}
              className="h-[42px] px-[20px] rounded-full bg-[#0066FF] text-white font-semibold text-[13px] cursor-pointer"
            >
              + Cadastrar primeiro cliente
            </button>
            <button
              type="button"
              onClick={handleSeedSampleClients}
              className="h-[42px] px-[20px] rounded-full bg-[var(--bg)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[13px] font-medium cursor-pointer"
            >
              Carregar 6 clientes de exemplo
            </button>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-[18px] items-start">
          {/* COLUNA 1: ONBOARDING */}
          <div className="flex flex-col gap-[10px]">
            <div className="flex items-center gap-[8px] px-[4px]">
              <span className="w-[8px] h-[8px] rounded-full bg-[#8f7dff]"></span>
              <span className="text-[11.5px] font-bold tracking-[0.06em] uppercase text-[#8f7dff]">
                ONBOARDING
              </span>
              <span className="text-[11.5px] font-semibold text-[var(--ds-muted)]">
                {onboardingClients.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
              {onboardingClients.map(renderClientCard)}
            </div>
          </div>

          {/* COLUNA 2: ATIVO */}
          <div className="flex flex-col gap-[10px]">
            <div className="flex items-center gap-[8px] px-[4px]">
              <span className="w-[8px] h-[8px] rounded-full bg-[#38bdf8]"></span>
              <span className="text-[11.5px] font-bold tracking-[0.06em] uppercase text-[#38bdf8]">
                ATIVO
              </span>
              <span className="text-[11.5px] font-semibold text-[var(--ds-muted)]">
                {activeClients.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
              {activeClients.map(renderClientCard)}
            </div>
          </div>

          {/* COLUNA 3: AVISO DE CHURN */}
          <div className="flex flex-col gap-[10px]">
            <div className="flex items-center gap-[8px] px-[4px]">
              <span className="w-[8px] h-[8px] rounded-full bg-[#0066FF]"></span>
              <span className="text-[11.5px] font-bold tracking-[0.06em] uppercase text-[#0066FF]">
                AVISO DE CHURN
              </span>
              <span className="text-[11.5px] font-semibold text-[var(--ds-muted)]">
                {churnClients.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
              {churnClients.map(renderClientCard)}
            </div>
          </div>
        </div>
      ) : (
        /* VISÃO DASHBOARD TABULAR */
        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] overflow-hidden">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--line)] text-[11px] uppercase text-[var(--ds-muted)]">
                <th className="py-[12px] px-[16px]">Cliente</th>
                <th className="py-[12px] px-[12px]">Squad</th>
                <th className="py-[12px] px-[12px]">Status</th>
                <th className="py-[12px] px-[12px]">Gasto Ads</th>
                <th className="py-[12px] px-[12px]">Leads</th>
                <th className="py-[12px] px-[12px]">CPR</th>
                <th className="py-[12px] px-[12px]">MRR</th>
                <th className="py-[12px] px-[16px] text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setActiveClientId(c.id)}
                  className="border-b border-[var(--line)] hover:bg-[var(--ds-hover)] cursor-pointer"
                >
                  <td className="py-[12px] px-[16px] font-semibold">{c.name}</td>
                  <td className="py-[12px] px-[12px] text-[var(--ds-muted)]">{c.team_squad}</td>
                  <td className="py-[12px] px-[12px]">
                    <span
                      className={`px-[8px] py-[2px] rounded-full text-[11px] font-semibold ${
                        STATUS_LABELS[c.status].badge
                      }`}
                    >
                      {STATUS_LABELS[c.status].label}
                    </span>
                  </td>
                  <td className="py-[12px] px-[12px]">
                    R$ {c.ad_spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-[12px] px-[12px]">{c.ad_results}</td>
                  <td className="py-[12px] px-[12px]">
                    R$ {c.ad_cpr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-[12px] px-[12px] font-semibold text-[#2f9e5a]">
                    R$ {c.mrr_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-[12px] px-[16px] text-right text-[#0066FF] font-semibold">
                    Abrir 360º →
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL + NOVO CLIENTE */}
      {showNewClientModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-[18px]">
          <form
            onSubmit={handleCreateClient}
            className="w-full max-w-[620px] max-h-[90vh] overflow-y-auto bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] p-[24px] flex flex-col gap-[14px]"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[20px] font-bold tracking-[-0.4px]">Novo cliente na carteira</h2>
                <p className="text-[12px] text-[var(--ds-muted)]">
                  Cria a ficha 360º completa, vincula os responsáveis e registra o histórico inicial.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewClientModal(false)}
                className="w-[32px] h-[32px] rounded-full bg-[var(--bg)] grid place-items-center text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
              <label className="flex flex-col gap-[5px] text-[12px] text-[var(--ds-muted)] sm:col-span-2">
                Nome / Escritório / Empresa *
                <input
                  value={newClientForm.name}
                  onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                  placeholder="Ex: Wilson Cobra Sociedade Individual de Advocacia"
                  required
                  className="h-[42px] px-[14px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] focus:border-[#0066FF] text-[13px] text-[var(--fg)] outline-none"
                />
              </label>

              <label className="flex flex-col gap-[5px] text-[12px] text-[var(--ds-muted)]">
                CNPJ
                <input
                  value={newClientForm.cnpj}
                  onChange={(e) => setNewClientForm({ ...newClientForm, cnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                  className="h-[42px] px-[14px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)] outline-none"
                />
              </label>

              <label className="flex flex-col gap-[5px] text-[12px] text-[var(--ds-muted)]">
                Nicho / Especialidade
                <input
                  value={newClientForm.sector}
                  onChange={(e) => setNewClientForm({ ...newClientForm, sector: e.target.value })}
                  className="h-[42px] px-[14px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)] outline-none"
                />
              </label>

              <label className="flex flex-col gap-[5px] text-[12px] text-[var(--ds-muted)]">
                Time / Squad
                <select
                  value={newClientForm.team_squad}
                  onChange={(e) =>
                    setNewClientForm({ ...newClientForm, team_squad: e.target.value })
                  }
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                >
                  <option value="Sparta">Sparta</option>
                  <option value="Fúria">Fúria</option>
                  <option value="Alpha">Alpha</option>
                  <option value="Titans">Titans</option>
                </select>
              </label>

              <label className="flex flex-col gap-[5px] text-[12px] text-[var(--ds-muted)]">
                Coluna / Status Inicial
                <select
                  value={newClientForm.status}
                  onChange={(e) =>
                    setNewClientForm({
                      ...newClientForm,
                      status: e.target.value as ClientStatus,
                    })
                  }
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                >
                  <option value="ONBOARDING">Onboarding</option>
                  <option value="ACTIVE">Ativo</option>
                  <option value="CHURN_RISK">Aviso de Churn</option>
                </select>
              </label>

              <label className="flex flex-col gap-[5px] text-[12px] text-[var(--ds-muted)]">
                Prioridade
                <select
                  value={newClientForm.priority}
                  onChange={(e) =>
                    setNewClientForm({
                      ...newClientForm,
                      priority: e.target.value as ClientPriority,
                    })
                  }
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </label>

              <label className="flex flex-col gap-[5px] text-[12px] text-[var(--ds-muted)]">
                Plataforma de Anúncios
                <select
                  value={newClientForm.ad_platform}
                  onChange={(e) =>
                    setNewClientForm({
                      ...newClientForm,
                      ad_platform: e.target.value as ClientAdPlatform,
                    })
                  }
                  className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                >
                  <option value="BOTH">Ambos (Meta + Google)</option>
                  <option value="META">Meta Ads</option>
                  <option value="GOOGLE">Google Ads</option>
                </select>
              </label>

              <label className="flex flex-col gap-[5px] text-[12px] text-[var(--ds-muted)]">
                Gestor de Tráfego
                <input
                  value={newClientForm.traffic_manager_name}
                  onChange={(e) =>
                    setNewClientForm({
                      ...newClientForm,
                      traffic_manager_name: e.target.value,
                    })
                  }
                  className="h-[42px] px-[14px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>

              <label className="flex flex-col gap-[5px] text-[12px] text-[var(--ds-muted)]">
                Customer Success (CS)
                <input
                  value={newClientForm.cs_manager_name}
                  onChange={(e) =>
                    setNewClientForm({ ...newClientForm, cs_manager_name: e.target.value })
                  }
                  className="h-[42px] px-[14px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>

              <label className="flex flex-col gap-[5px] text-[12px] text-[var(--ds-muted)]">
                Fee Mensal / MRR (R$)
                <input
                  type="number"
                  value={newClientForm.mrr_value}
                  onChange={(e) =>
                    setNewClientForm({ ...newClientForm, mrr_value: e.target.value })
                  }
                  className="h-[42px] px-[14px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>

              <label className="flex flex-col gap-[5px] text-[12px] text-[var(--ds-muted)]">
                Saldo Inicial de Anúncios (R$)
                <input
                  type="number"
                  value={newClientForm.ad_balance}
                  onChange={(e) =>
                    setNewClientForm({ ...newClientForm, ad_balance: e.target.value })
                  }
                  className="h-[42px] px-[14px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-[10px] pt-[8px]">
              <button
                type="button"
                onClick={() => setShowNewClientModal(false)}
                className="h-[42px] px-[18px] rounded-full bg-[var(--bg)] border border-[var(--line2)] text-[13px] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-[42px] px-[22px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-[13px] cursor-pointer"
              >
                Criar cliente
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP / MODAL FICHA 360º DO CLIENTE */}
      {renderClientDetailModal()}

      {/* INOVAÇÃO 1: GERADOR AUTOMÁTICO DE PROPOSTAS COMERCIAIS (REGRA 9.5) */}
      <ProposalGeneratorDialog
        open={showProposalModal}
        onClose={() => setShowProposalModal(false)}
        clients={clients}
        initialClient={proposalClient}
      />

      {/* COYCRM TWENTY: MODAL DE NOVA OPORTUNIDADE VINCULADA AO CLIENTE */}
      <DealDialog
        open={isNewDealOpen}
        onClose={() => setIsNewDealOpen(false)}
        initialDeal={
          activeClient
            ? ({
                client_id: activeClient.id,
                title: `Oportunidade · ${activeClient.name}`,
                lead_id: (activeClient as any).whatsapp || activeClient.contact_phone || null,
              } as unknown as any)
            : null
        }
      />
    </div>
  )
}

