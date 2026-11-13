'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import {
  Send,
  Plus,
  Search,
  Mic,
  Trash2,
  X,
  Smartphone,
  Maximize2,
  ArrowUpRight,
  RefreshCw,
  Calendar,
  Video,
  UserCheck,
  CheckCircle,
  LayoutGrid,
  List as ListIcon,
  FileText,
  MessageSquare,
  User,
  SlidersHorizontal,
  Clock,
  Sparkles,
  ExternalLink,
  Bot,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Phone,
  MoreVertical,
  Smile,
  Paperclip,
  Wifi,
  Battery,
  ArrowLeft,
} from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'
import { createClient as createBrowserSupabase } from '@/lib/supabase/client'
import { createCommercialProposalTaskFromLead } from '@/lib/proposal-task-helper'
import { CoyDatePicker } from '@/components/ui/coy-date-picker'

interface LeadMemoryItem {
  id: string
  memory_text: string
  created_at: string
}

interface LeadConversationItem {
  id: number
  lead_id: string
  lead_nome: string
  organization_id: string | null
  client_id: string | null
  inbox_type: 'CLIENT' | 'COMMERCIAL'
  commercial_stage: string
  meeting_scheduled_at: string | null
  meeting_link: string | null
  qualification_score: number
  crm_stage: string
  human_takeover: boolean
  orders_count: number
  total_spent: number
  cashback_balance: number
  created_at: string
  last_message_at: string
  last_message_preview: string
  messages_count: number
  memories: LeadMemoryItem[]
}

interface ChatMessageRow {
  id: number
  session_id: string
  type: 'human' | 'ai' | 'operator'
  sender_label: string
  is_audio: boolean
  content: string
  hora_data_mensagem: string
}

const COMMERCIAL_STAGE_LABELS: Record<
  string,
  { label: string; dot: string; badge: string; color: string }
> = {
  NOVO: {
    label: 'Novo Lead',
    dot: 'bg-[#38bdf8]',
    badge: 'bg-[#0284c7]/10 dark:bg-[#38bdf8]/15 text-[#0369a1] dark:text-[#38bdf8] border-[#0284c7]/30 dark:border-[#38bdf8]/30',
    color: '#0284c7',
  },
  QUALIFICANDO: {
    label: 'Qualificando',
    dot: 'bg-[#e8c14a]',
    badge: 'bg-[#d97706]/10 dark:bg-[#e8c14a]/15 text-[#b45309] dark:text-[#e8c14a] border-[#d97706]/30 dark:border-[#e8c14a]/30',
    color: '#d97706',
  },
  REUNIAO_AGENDADA: {
    label: 'Reunião Agendada',
    dot: 'bg-[#2f9e5a]',
    badge: 'bg-[#2f9e5a]/15 text-[#15803d] dark:text-[#2f9e5a] border-[#2f9e5a]/30',
    color: '#2f9e5a',
  },
  PROPOSTA: {
    label: 'Proposta Enviada',
    dot: 'bg-[#8f7dff]',
    badge: 'bg-[#8f7dff]/15 text-[#6d28d9] dark:text-[#8f7dff] border-[#8f7dff]/30',
    color: '#8f7dff',
  },
  GANHO: {
    label: 'Cliente Fechado',
    dot: 'bg-[#2f9e5a]',
    badge: 'bg-[#2f9e5a]/20 text-[#15803d] dark:text-[#2f9e5a] border-[#2f9e5a]/40',
    color: '#2f9e5a',
  },
  PERDIDO: {
    label: 'Desqualificado',
    dot: 'bg-[#ef4444]',
    badge: 'bg-[#ef4444]/15 text-[#dc2626] dark:text-[#ef4444] border-[#ef4444]/30',
    color: '#ef4444',
  },
}

const KANBAN_COLUMNS = [
  { id: 'NOVO', name: 'Novo Lead', color: '#38bdf8' },
  { id: 'QUALIFICANDO', name: 'Qualificando', color: '#e8c14a' },
  { id: 'REUNIAO_AGENDADA', name: 'Reunião Agendada', color: '#2f9e5a' },
  { id: 'PROPOSTA', name: 'Proposta Enviada', color: '#8f7dff' },
  { id: 'GANHO', name: 'Cliente Fechado', color: '#2f9e5a' },
  { id: 'PERDIDO', name: 'Desqualificado', color: '#ef4444' },
]

function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 13 && digits.startsWith('55')) {
    const ddd = digits.slice(2, 4)
    const p1 = digits.slice(4, 9)
    const p2 = digits.slice(9, 13)
    return `+55 ${ddd} ${p1}-${p2}`
  }
  if (digits.length === 12 && digits.startsWith('55')) {
    const ddd = digits.slice(2, 4)
    const p1 = digits.slice(4, 8)
    const p2 = digits.slice(8, 12)
    return `+55 ${ddd} ${p1}-${p2}`
  }
  return raw.startsWith('+') ? raw : `+${raw}`
}

function formatTimeHHMM(iso: string): string {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return 'Agora'
    return d.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'Agora'
  }
}

function formatDateGroupLabel(iso: string): string {
  try {
    const msgDate = new Date(iso)
    if (isNaN(msgDate.getTime())) return 'Hoje'

    const now = new Date()
    const fmt = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

    const msgDayStr = fmt.format(msgDate)
    const todayStr = fmt.format(now)

    const yesterday = new Date(now.getTime() - 86400000)
    const yesterdayStr = fmt.format(yesterday)

    if (msgDayStr === todayStr) return 'Hoje'
    if (msgDayStr === yesterdayStr) return 'Ontem'
    return msgDayStr
  } catch {
    return 'Hoje'
  }
}

function formatFullDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function DoubleCheckSvg({ className = 'w-[14px] h-[10px]' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 11"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 5.5L4.5 9L11.5 1.5" />
      <path d="M5.5 5.5L9 9L15 2" />
    </svg>
  )
}

function AtendimentoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    currentOrg,
    refreshFromDatabase,
    taskFolders,
    taskLists,
    createTaskFolder,
    createTaskList,
    createTask,
    authenticatedUser,
    clients,
  } = useCoyDash()

  // 1. MODO DE VISUALIZAÇÃO (CHAT | KANBAN | LIST)
  const [viewMode, setViewMode] = useState<'CHAT' | 'KANBAN' | 'LIST'>('CHAT')

  // Lista de conversas e conversa ativa no Chat
  const [conversations, setConversations] = useState<LeadConversationItem[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessageRow[]>([])
  const [isLoadingConvs, setIsLoadingConvs] = useState(true)
  const [isSending, setIsSending] = useState(false)

  // Filtros da barra superior e do inbox
  const [inboxSearch, setInboxSearch] = useState('')
  const [inboxFilter, setInboxFilter] = useState<'ALL' | 'AI' | 'HUMAN'>('ALL')
  const [stageFilter, setStageFilter] = useState<string>('ALL')

  // Viewport Mobile 412px vs Expandido no Chat
  const [isMobileViewport, setIsMobileViewport] = useState(true)
  const [operatorInput, setOperatorInput] = useState('')

  // Painel Comercial no Chat
  const [meetingDateInput, setMeetingDateInput] = useState('')
  const [meetingLinkInput, setMeetingLinkInput] = useState('')
  const [isSavingMeeting, setIsSavingMeeting] = useState(false)
  const [isConvertingLead, setIsConvertingLead] = useState(false)
  const [isRequestingProposal, setIsRequestingProposal] = useState(false)
  const [convertSuccessMsg, setConvertSuccessMsg] = useState<string | null>(null)
  const [newMemoryInput, setNewMemoryInput] = useState('')

  // Modal de Detalhes do Lead (Kanban e Lista)
  const [modalLead, setModalLead] = useState<LeadConversationItem | null>(null)
  const [modalMessages, setModalMessages] = useState<ChatMessageRow[]>([])
  const [isLoadingModalMsgs, setIsLoadingModalMsgs] = useState(false)
  const [modalStage, setModalStage] = useState('NOVO')
  const [modalScore, setModalScore] = useState(50)
  const [modalMeetingDate, setModalMeetingDate] = useState('')
  const [modalMeetingLink, setModalMeetingLink] = useState('')
  const [modalNewMemory, setModalNewMemory] = useState('')
  const [isSavingModalMeeting, setIsSavingModalMeeting] = useState(false)
  const [isConvertingModalLead, setIsConvertingModalLead] = useState(false)
  const [modalConvertSuccess, setModalConvertSuccess] = useState<string | null>(null)

  // Modal Nova Conversa / Lead
  const [showNewModal, setShowNewModal] = useState(false)
  const [newLeadNome, setNewLeadNome] = useState('')
  const [newLeadPhone, setNewLeadPhone] = useState('5511988771234')
  const [newLeadStage, setNewLeadStage] = useState('NOVO')
  const [newInitialMsg, setNewInitialMsg] = useState(
    'Olá! Vi o anúncio de vocês e gostaria de mais informações.'
  )

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const modalMessagesEndRef = useRef<HTMLDivElement | null>(null)
  const kanbanContainerRef = useRef<HTMLDivElement | null>(null)

  const handleScrollKanban = (direction: 'left' | 'right') => {
    if (!kanbanContainerRef.current) return
    const offset = direction === 'left' ? -340 : 340
    kanbanContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' })
  }

  // Busca todas as conversas comerciais
  const fetchConversations = useCallback(async () => {
    try {
      const orgParam =
        currentOrg.id && currentOrg.id !== 'org-default'
          ? `?orgId=${encodeURIComponent(currentOrg.id)}`
          : ''
      const res = await fetch(`/api/whatsapp/conversations${orgParam}`, {
        cache: 'no-store',
      })
      if (!res.ok) return
      const data = await res.json()
      // Filtramos apenas conversas comerciais (SDR & Oportunidades)
      const all: LeadConversationItem[] = data.conversations || []
      const list = all.filter((c) => (c.inbox_type || 'COMMERCIAL') === 'COMMERCIAL')
      setConversations(list)

      const urlPhone = searchParams.get('phone') || searchParams.get('leadId')
      if (urlPhone && list.some((c) => c.lead_id === urlPhone)) {
        setSelectedSessionId(urlPhone)
      } else if (list.length > 0) {
        setSelectedSessionId((prev) =>
          prev && list.some((c) => c.lead_id === prev) ? prev : list[0].lead_id
        )
      }
    } catch (err) {
      console.error('Erro ao buscar conversas comerciais:', err)
    } finally {
      setIsLoadingConvs(false)
    }
  }, [currentOrg.id, searchParams])

  // Busca mensagens de uma sessão específica
  const fetchMessagesForSession = useCallback(async (sessionId: string) => {
    if (!sessionId) {
      setMessages([])
      return
    }
    try {
      const res = await fetch(
        `/api/whatsapp/messages?sessionId=${encodeURIComponent(sessionId)}`,
        { cache: 'no-store' }
      )
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err)
    }
  }, [])

  // Busca mensagens para o modal
  const fetchModalMessages = useCallback(async (sessionId: string) => {
    if (!sessionId) {
      setModalMessages([])
      return
    }
    setIsLoadingModalMsgs(true)
    try {
      const res = await fetch(
        `/api/whatsapp/messages?sessionId=${encodeURIComponent(sessionId)}`,
        { cache: 'no-store' }
      )
      if (!res.ok) return
      const data = await res.json()
      setModalMessages(data.messages || [])
    } catch (err) {
      console.error('Erro ao carregar mensagens no modal:', err)
    } finally {
      setIsLoadingModalMsgs(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (selectedSessionId) {
      fetchMessagesForSession(selectedSessionId)
    }
  }, [selectedSessionId, fetchMessagesForSession])

  // Auto-scroll no chat principal
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selectedSessionId])

  // Auto-scroll no modal
  useEffect(() => {
    modalMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [modalMessages, modalLead])

  // Realtime Supabase
  useEffect(() => {
    const supabase = createBrowserSupabase()
    if (!supabase) return

    const channel = supabase
      .channel('coydash-atendimento-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'n8n_chat_histories' },
        (payload) => {
          fetchConversations()
          const changedSession =
            (payload.new as { session_id?: string })?.session_id ||
            (payload.old as { session_id?: string })?.session_id
          if (changedSession && changedSession === selectedSessionId) {
            fetchMessagesForSession(selectedSessionId)
          }
          if (changedSession && modalLead && changedSession === modalLead.lead_id) {
            fetchModalMessages(modalLead.lead_id)
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchConversations()
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'client_ai_memories' },
        () => {
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedSessionId, modalLead, fetchConversations, fetchMessagesForSession, fetchModalMessages])

  // Conversas filtradas
  const filteredConversations = useMemo(() => {
    const q = inboxSearch.trim().toLowerCase()
    return conversations.filter((c) => {
      if (inboxFilter === 'AI' && c.human_takeover) return false
      if (inboxFilter === 'HUMAN' && !c.human_takeover) return false
      if (stageFilter !== 'ALL' && c.commercial_stage !== stageFilter) return false
      if (q) {
        const match =
          c.lead_nome.toLowerCase().includes(q) ||
          c.lead_id.toLowerCase().includes(q) ||
          c.last_message_preview.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [conversations, inboxSearch, inboxFilter, stageFilter])

  // Conversa ativa no modo Chat
  const activeConv = useMemo(() => {
    const match = filteredConversations.find((c) => c.lead_id === selectedSessionId)
    return match || filteredConversations[0] || null
  }, [filteredConversations, selectedSessionId])

  // Atualizar inputs da lateral direita no modo Chat
  useEffect(() => {
    if (activeConv) {
      setMeetingDateInput(
        activeConv.meeting_scheduled_at
          ? new Date(activeConv.meeting_scheduled_at).toISOString().slice(0, 16)
          : ''
      )
      setMeetingLinkInput(activeConv.meeting_link || '')
      setConvertSuccessMsg(null)
    }
  }, [activeConv?.lead_id, activeConv?.meeting_scheduled_at, activeConv?.meeting_link])

  // Quando abre o modal de um lead
  const openLeadModal = (lead: LeadConversationItem) => {
    setModalLead(lead)
    setModalStage(lead.commercial_stage || 'NOVO')
    setModalScore(lead.qualification_score ?? 50)
    setModalMeetingDate(
      lead.meeting_scheduled_at
        ? new Date(lead.meeting_scheduled_at).toISOString().slice(0, 16)
        : ''
    )
    setModalMeetingLink(lead.meeting_link || '')
    setModalConvertSuccess(null)
    setModalNewMemory('')
    fetchModalMessages(lead.lead_id)
  }

  // Ação: Ir para o Modo Atendimento (Chat)
  const handleGoToChat = (lead: LeadConversationItem) => {
    setSelectedSessionId(lead.lead_id)
    setViewMode('CHAT')
    setModalLead(null)
  }

  // Agrupamento de mensagens por data no Chat
  const groupedMessages = useMemo(() => {
    const groups: { dateLabel: string; items: ChatMessageRow[] }[] = []
    messages.forEach((m) => {
      const label = formatDateGroupLabel(m.hora_data_mensagem)
      const lastGroup = groups[groups.length - 1]
      if (!lastGroup || lastGroup.dateLabel !== label) {
        groups.push({ dateLabel: label, items: [m] })
      } else {
        lastGroup.items.push(m)
      }
    })
    return groups
  }, [messages])

  // Drag and Drop do Kanban
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const nextStage = destination.droppableId
    // Atualização otimista
    setConversations((prev) =>
      prev.map((c) =>
        c.lead_id === draggableId ? { ...c, commercial_stage: nextStage } : c
      )
    )

    await fetch('/api/whatsapp/takeover', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE_COMMERCIAL_DETAILS',
        sessionId: draggableId,
        commercial_stage: nextStage,
      }),
    })
  }

  // Métricas do Pipeline Comercial
  const metrics = useMemo(() => {
    const total = conversations.length
    const meetings = conversations.filter(
      (c) => c.commercial_stage === 'REUNIAO_AGENDADA'
    ).length
    const qualified = conversations.filter(
      (c) => c.commercial_stage === 'QUALIFICANDO' || c.qualification_score >= 70
    ).length
    const closed = conversations.filter((c) => c.commercial_stage === 'GANHO').length
    return { total, meetings, qualified, closed }
  }, [conversations])

  // Ações de Envio e Operação
  const handleSendOperatorMsg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeConv || !operatorInput.trim() || isSending) return
    const text = operatorInput.trim()
    setOperatorInput('')
    setIsSending(true)
    try {
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeConv.lead_id,
          content: text,
          senderType: 'operator',
          orgId: currentOrg.id !== 'org-default' ? currentOrg.id : null,
        }),
      })
      await Promise.all([
        fetchMessagesForSession(activeConv.lead_id),
        fetchConversations(),
      ])
    } finally {
      setIsSending(false)
    }
  }

  const handleSimulateClientAudio = async () => {
    if (!activeConv) return
    await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: activeConv.lead_id,
        senderType: 'human_simulation',
        isAudioSimulation: true,
        orgId: currentOrg.id !== 'org-default' ? currentOrg.id : null,
      }),
    })
    await Promise.all([
      fetchMessagesForSession(activeConv.lead_id),
      fetchConversations(),
    ])
  }

  const handleToggleTakeover = async () => {
    if (!activeConv) return
    const nextState = !activeConv.human_takeover
    await fetch('/api/whatsapp/takeover', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'TOGGLE_TAKEOVER',
        sessionId: activeConv.lead_id,
        human_takeover: nextState,
        orgId: currentOrg.id !== 'org-default' ? currentOrg.id : null,
      }),
    })
    await Promise.all([
      fetchMessagesForSession(activeConv.lead_id),
      fetchConversations(),
    ])
  }

  const handleUpdateCommercialDetails = async (
    updates: Partial<{
      commercial_stage: string
      meeting_scheduled_at: string | null
      meeting_link: string | null
      qualification_score: number
    }>
  ) => {
    if (!activeConv) return
    setIsSavingMeeting(true)
    try {
      await fetch('/api/whatsapp/takeover', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_COMMERCIAL_DETAILS',
          sessionId: activeConv.lead_id,
          ...updates,
        }),
      })
      await fetchConversations()
    } finally {
      setIsSavingMeeting(false)
    }
  }

  const handleConvertLeadToClient = async () => {
    if (!activeConv) return
    setIsConvertingLead(true)
    setConvertSuccessMsg(null)
    try {
      const res = await fetch('/api/whatsapp/takeover', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONVERT_LEAD_TO_CLIENT',
          sessionId: activeConv.lead_id,
          lead_nome: activeConv.lead_nome,
          orgId: currentOrg.id !== 'org-default' ? currentOrg.id : null,
        }),
      })
      if (res.ok) {
        setConvertSuccessMsg(
          'Lead convertido com sucesso! A conta agora está ativa em Clientes (Onboarding).'
        )
        await Promise.all([fetchConversations(), refreshFromDatabase()])
      }
    } finally {
      setIsConvertingLead(false)
    }
  }

  // Ações dentro do Modal
  const handleSaveModalMeeting = async () => {
    if (!modalLead) return
    setIsSavingModalMeeting(true)
    try {
      await fetch('/api/whatsapp/takeover', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_COMMERCIAL_DETAILS',
          sessionId: modalLead.lead_id,
          commercial_stage: modalStage,
          meeting_scheduled_at: modalMeetingDate
            ? new Date(modalMeetingDate).toISOString()
            : null,
          meeting_link: modalMeetingLink.trim() || null,
          qualification_score: modalScore,
        }),
      })
      await fetchConversations()
      setModalLead((prev) =>
        prev
          ? {
              ...prev,
              commercial_stage: modalStage,
              qualification_score: modalScore,
              meeting_scheduled_at: modalMeetingDate
                ? new Date(modalMeetingDate).toISOString()
                : null,
              meeting_link: modalMeetingLink.trim() || null,
            }
          : null
      )
    } finally {
      setIsSavingModalMeeting(false)
    }
  }

  const handleConvertModalLead = async () => {
    if (!modalLead) return
    setIsConvertingModalLead(true)
    setModalConvertSuccess(null)
    try {
      const res = await fetch('/api/whatsapp/takeover', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONVERT_LEAD_TO_CLIENT',
          sessionId: modalLead.lead_id,
          lead_nome: modalLead.lead_nome,
          orgId: currentOrg.id !== 'org-default' ? currentOrg.id : null,
        }),
      })
      if (res.ok) {
        setModalConvertSuccess(
          'Lead convertido com sucesso! Nova conta criada em Clientes (Onboarding).'
        )
        await Promise.all([fetchConversations(), refreshFromDatabase()])
      }
    } finally {
      setIsConvertingModalLead(false)
    }
  }

  const handleRequestProposalFromLead = async (lead: LeadConversationItem) => {
    setIsRequestingProposal(true)
    try {
      const msgsToInclude =
        lead.lead_id === selectedSessionId
          ? messages
          : modalLead?.lead_id === lead.lead_id
            ? modalMessages
            : []

      // Tenta associar ao cliente da base por ID ou por nome/telefone
      const matchingClient = clients.find(
        (c) =>
          (lead.client_id && c.id === lead.client_id) ||
          c.name.toLowerCase() === lead.lead_nome.toLowerCase() ||
          (c.contact_phone && lead.lead_id && c.contact_phone.includes(lead.lead_id.replace(/\D/g, '')))
      )

      const finalClientName = matchingClient?.name || lead.lead_nome || 'Lead'
      const finalClientId = lead.client_id || matchingClient?.id || undefined

      const task = await createCommercialProposalTaskFromLead(
        {
          leadName: lead.lead_nome,
          leadPhone: lead.lead_id,
          companyName: matchingClient?.name || undefined,
          clientId: finalClientId,
          clientNameSnapshot: finalClientName,
          requestingUserName: authenticatedUser?.name || 'Felipe Cavalcante',
          notes: `Estágio Comercial: ${COMMERCIAL_STAGE_LABELS[lead.commercial_stage]?.label || lead.commercial_stage || 'Novo Lead'} · Score: ${lead.qualification_score ?? 50}/100`,
          memories: lead.memories,
          recentMessages: msgsToInclude.map((m) => ({
            sender: m.sender_label || (m.type === 'human' ? 'Lead' : 'Robô'),
            content: m.content,
          })),
          origin: 'Atendimento WhatsApp',
        },
        {
          taskFolders,
          taskLists,
          createTaskFolder,
          createTaskList,
          createTask,
          refreshFromDatabase,
        }
      )

      if (task) {
        const successMsg = `📄 Proposta comercial solicitada com sucesso! Tarefa criada em "Leads - Tarefas" -> "Proposta Comercial".`
        setModalConvertSuccess(successMsg)
        setConvertSuccessMsg(successMsg)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha ao solicitar proposta comercial')
    } finally {
      setIsRequestingProposal(false)
    }
  }

  const handleAddModalMemory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalLead || !modalNewMemory.trim()) return
    const txt = modalNewMemory.trim()
    setModalNewMemory('')
    const res = await fetch('/api/whatsapp/takeover', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ADD_MEMORY',
        sessionId: modalLead.lead_id,
        memory_text: txt,
        orgId: currentOrg.id !== 'org-default' ? currentOrg.id : null,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.memory) {
        setModalLead((prev) =>
          prev
            ? {
                ...prev,
                memories: [...(prev.memories || []), data.memory],
              }
            : null
        )
      }
      await fetchConversations()
    }
  }

  const handleDeleteModalMemory = async (memoryId: string) => {
    if (!modalLead) return
    await fetch('/api/whatsapp/takeover', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'DELETE_MEMORY',
        sessionId: modalLead.lead_id,
        memoryId,
      }),
    })
    setModalLead((prev) =>
      prev
        ? {
            ...prev,
            memories: (prev.memories || []).filter((m) => m.id !== memoryId),
          }
        : null
    )
    await fetchConversations()
  }

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeConv || !newMemoryInput.trim()) return
    const txt = newMemoryInput.trim()
    setNewMemoryInput('')
    await fetch('/api/whatsapp/takeover', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ADD_MEMORY',
        sessionId: activeConv.lead_id,
        memory_text: txt,
        orgId: currentOrg.id !== 'org-default' ? currentOrg.id : null,
      }),
    })
    await fetchConversations()
  }

  const handleDeleteMemory = async (memoryId: string) => {
    if (!activeConv) return
    await fetch('/api/whatsapp/takeover', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'DELETE_MEMORY',
        sessionId: activeConv.lead_id,
        memoryId,
      }),
    })
    await fetchConversations()
  }

  const handleSeedDemo = async () => {
    setIsLoadingConvs(true)
    await fetch('/api/whatsapp/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SEED_DEMO',
        orgId: currentOrg.id !== 'org-default' ? currentOrg.id : null,
      }),
    })
    await fetchConversations()
  }

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLeadNome.trim()) return
    const cleanPhone = newLeadPhone.replace(/\D/g, '') || '5511988771234'
    await fetch('/api/whatsapp/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: cleanPhone,
        lead_nome: newLeadNome.trim(),
        inbox_type: 'COMMERCIAL',
        commercial_stage: newLeadStage,
        initial_message: newInitialMsg.trim(),
        orgId: currentOrg.id !== 'org-default' ? currentOrg.id : null,
      }),
    })
    setNewLeadNome('')
    setShowNewModal(false)
    await fetchConversations()
    setSelectedSessionId(cleanPhone)
  }

  const handleDeleteConversation = async (sessionId: string) => {
    await fetch(
      `/api/whatsapp/conversations?sessionId=${encodeURIComponent(sessionId)}`,
      { method: 'DELETE' }
    )
    if (modalLead?.lead_id === sessionId) {
      setModalLead(null)
    }
    await fetchConversations()
  }

  return (
    <div className="px-[26px] pt-[18px] pb-[28px] flex flex-col gap-[20px] min-h-full">
      {/* CABEÇALHO COM CONTROLE DE VISUALIZAÇÃO: CHAT | KANBAN | LISTA */}
      <div className="flex flex-wrap items-center justify-between gap-[12px] shrink-0">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.5px] leading-tight">
            Atendimento Comercial & CRM
          </h1>
          <p className="text-[13px] text-[var(--ds-muted)]">
            Qualificação automática de leads de anúncios, agendamento de reuniões e pipeline de vendas
          </p>
        </div>

        <div className="flex items-center gap-[10px]">
          {/* SELETOR DE MODO DE VISUALIZAÇÃO (CHAT | KANBAN | LISTA) */}
          <div className="flex items-center bg-[var(--surface)] border border-[var(--line2)] p-[3px] rounded-full">
            <button
              type="button"
              onClick={() => setViewMode('CHAT')}
              className={`h-[34px] px-[14px] rounded-full text-[12px] font-semibold flex items-center gap-[6px] transition-colors cursor-pointer ${
                viewMode === 'CHAT'
                  ? 'bg-[#0066FF] text-white'
                  : 'text-[var(--ds-muted)] hover:text-[var(--fg)]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Chat ao vivo</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('KANBAN')}
              className={`h-[34px] px-[14px] rounded-full text-[12px] font-semibold flex items-center gap-[6px] transition-colors cursor-pointer ${
                viewMode === 'KANBAN'
                  ? 'bg-[#0066FF] text-white'
                  : 'text-[var(--ds-muted)] hover:text-[var(--fg)]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Quadro Kanban</span>
              <span
                className={`px-[6px] py-[1px] rounded-full text-[10.5px] ${
                  viewMode === 'KANBAN'
                    ? 'bg-[#141414]/15 text-[#141414] font-bold'
                    : 'bg-[var(--bg)] text-[var(--ds-muted)]'
                }`}
              >
                {conversations.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`h-[34px] px-[14px] rounded-full text-[12px] font-semibold flex items-center gap-[6px] transition-colors cursor-pointer ${
                viewMode === 'LIST'
                  ? 'bg-[#0066FF] text-white'
                  : 'text-[var(--ds-muted)] hover:text-[var(--fg)]'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>Lista</span>
              <span
                className={`px-[6px] py-[1px] rounded-full text-[10.5px] ${
                  viewMode === 'LIST'
                    ? 'bg-[#141414]/15 text-[#141414] font-bold'
                    : 'bg-[var(--bg)] text-[var(--ds-muted)]'
                }`}
              >
                {conversations.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchConversations()}
            className="h-[38px] px-[14px] rounded-full bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[12px] font-medium flex items-center gap-[6px] cursor-pointer transition-colors"
            title="Sincronizar conversas e pipeline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar</span>
          </button>

          {conversations.length === 0 && (
            <button
              type="button"
              onClick={handleSeedDemo}
              className="h-[38px] px-[16px] rounded-full bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[12.5px] font-medium flex items-center gap-[6px] cursor-pointer"
            >
              <span>Carregar demonstração</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="h-[38px] px-[18px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-[13px] flex items-center gap-[6px] cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2.4} />
            <span>Novo Lead</span>
          </button>
        </div>
      </div>

      {/* ESTADO VAZIO CASO NÃO HAJA LEADS */}
      {!isLoadingConvs && filteredConversations.length === 0 && conversations.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] p-[40px] flex flex-col items-center justify-center text-center gap-[14px]">
          <div className="max-w-[460px]">
            <h2 className="text-[18px] font-bold">
              Nenhum lead comercial cadastrado no momento
            </h2>
            <p className="text-[13px] text-[var(--ds-muted)] mt-[6px]">
              Assim que novos contatos responderem aos anúncios ou entrarem via WhatsApp,
              o Agente Comercial n8n qualificará e organizará as reuniões automaticamente no seu pipeline.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSeedDemo}
            className="h-[40px] px-[20px] rounded-full bg-[#0066FF] text-white font-semibold text-[13px] cursor-pointer"
          >
            Carregar base demonstrativa comercial
          </button>
        </div>
      ) : null}

      {/* ============================================================== */}
      {/* MODO 1: CHAT AO VIVO (LAYOUT DE 3 COLUNAS) */}
      {/* ============================================================== */}
      {viewMode === 'CHAT' && (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_340px] gap-[14px] min-h-[620px] h-[calc(100vh-210px)] max-h-[820px] shrink-0">
          {/* COLUNA 1: INBOX COMERCIAL (LISTA DE LEADS) */}
          <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[14px] flex flex-col gap-[12px] h-full overflow-hidden">
            {/* Campo de Busca */}
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--ds-muted)] absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar lead comercial..."
                value={inboxSearch}
                onChange={(e) => setInboxSearch(e.target.value)}
                className="w-full h-[36px] pl-[34px] pr-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[12.5px] focus:outline-none focus:border-[#0066FF]"
              />
            </div>

            {/* Filtros rápidos */}
            <div className="flex items-center gap-[6px] shrink-0">
              {(
                [
                  { id: 'ALL', label: 'Todas' },
                  { id: 'AI', label: 'Com IA' },
                  { id: 'HUMAN', label: 'Humano' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setInboxFilter(f.id)}
                  className={`flex-1 h-[28px] rounded-[8px] text-[11px] font-medium transition-colors cursor-pointer ${
                    inboxFilter === f.id
                      ? 'bg-[#0066FF] text-white font-bold'
                      : 'bg-[var(--bg)] text-[var(--ds-muted)] hover:text-[var(--fg)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Lista com scroll */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-[8px] pr-[4px]">
              {isLoadingConvs ? (
                <div className="p-[20px] text-center text-[12px] text-[var(--ds-muted)]">
                  Carregando leads comerciais...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-[20px] text-center text-[12px] text-[var(--ds-muted)]">
                  Nenhum lead encontrado com esse filtro.
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isSelected = activeConv?.lead_id === c.lead_id
                  const stageInfo =
                    COMMERCIAL_STAGE_LABELS[c.commercial_stage] ||
                    COMMERCIAL_STAGE_LABELS.NOVO

                  return (
                    <div
                      key={c.lead_id}
                      onClick={() => setSelectedSessionId(c.lead_id)}
                      className={`p-[10px] rounded-[12px] border cursor-pointer transition-all flex items-start gap-[10px] ${
                        isSelected
                          ? 'bg-[var(--bg)] border-[#0066FF] shadow-sm'
                          : 'bg-[var(--bg)]/50 border-[var(--line2)] hover:border-[#0066FF]/40'
                      }`}
                    >
                      <div className="w-[36px] h-[36px] rounded-full bg-[var(--surface)] border border-[var(--line2)] grid place-items-center text-[13px] font-bold shrink-0 text-[#0066FF]">
                        {c.lead_nome.slice(0, 1).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-[4px]">
                          <span className="font-semibold text-[13px] truncate">
                            {c.lead_nome}
                          </span>
                          <span className="text-[10.5px] text-[var(--ds-muted)] shrink-0">
                            {formatTimeHHMM(c.last_message_at)}
                          </span>
                        </div>

                        <p className="text-[11.5px] text-[var(--ds-muted)] truncate mt-[2px] flex items-center gap-[4px]">
                          <span
                            className={`w-[6px] h-[6px] rounded-full shrink-0 ${
                              c.human_takeover ? 'bg-[#0066FF]' : 'bg-[#2f9e5a]'
                            }`}
                          />
                          <span className="truncate">{c.last_message_preview}</span>
                        </p>

                        <div className="flex items-center gap-[4px] mt-[6px] flex-wrap">
                          <span
                            className={`px-[7px] py-[1.5px] rounded-[5px] text-[9.5px] font-semibold border ${stageInfo.badge}`}
                          >
                            {stageInfo.label}
                          </span>
                          {c.commercial_stage === 'REUNIAO_AGENDADA' && (
                            <span className="px-[6px] py-[1.5px] rounded-[5px] text-[9.5px] bg-[#2f9e5a]/15 text-[#2f9e5a] border border-[#2f9e5a]/30 font-medium flex items-center gap-[3px]">
                              <Calendar className="w-2.5 h-2.5" />
                              Reunião
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* COLUNA 2: CONTAINER DO CHAT WHATSAPP DIRETO */}
          <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] flex flex-col h-full overflow-hidden shadow-lg">
            {activeConv ? (
              <>
                {/* CABEÇALHO DO WHATSAPP COM OS BOTÕES DE ASSUMIR E EXCLUIR */}
                <div className="bg-[var(--surface)] px-[16px] py-[12px] border-b border-[var(--line2)] flex items-center justify-between gap-[12px] text-[var(--fg)] shrink-0">
                  {/* LADO ESQUERDO: CONTATO */}
                  <div className="flex items-center gap-[12px] min-w-0">
                    <div className="w-[42px] h-[42px] rounded-full bg-[#0066FF] text-white font-bold text-[15px] grid place-items-center shrink-0 shadow-sm">
                      {activeConv.lead_nome.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-[14.5px] leading-tight truncate text-[var(--fg)]">
                        {activeConv.lead_nome}
                      </h2>
                      <div className="text-[11.5px] text-[var(--ds-muted)] flex items-center gap-[6px] leading-tight mt-[2px]">
                        <span>{formatPhoneDisplay(activeConv.lead_id)}</span>
                        <span>·</span>
                        <span className="text-[#25D366] flex items-center gap-[4px] font-medium">
                          <span className="w-[5px] h-[5px] rounded-full bg-[#25D366]" />
                          online no WhatsApp
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* LADO DIREITO: AÇÕES DO CHAT */}
                  <div className="flex items-center gap-[8px] shrink-0">
                    <button
                      type="button"
                      onClick={handleToggleTakeover}
                      className={`h-[32px] px-[13px] rounded-full text-[11.5px] font-semibold flex items-center gap-[6px] cursor-pointer transition-colors shadow-sm ${
                        activeConv.human_takeover
                          ? 'bg-[#2f9e5a] text-white hover:bg-[#288a4e]'
                          : 'bg-[#0066FF] text-white hover:bg-[#0052CC]'
                      }`}
                      title={
                        activeConv.human_takeover
                          ? 'Devolver conversa para o Agente IA'
                          : 'Assumir conversa manualmente como atendente humano'
                      }
                    >
                      {activeConv.human_takeover ? (
                        <>
                          <Bot className="w-3.5 h-3.5" />
                          <span>Devolver p/ IA</span>
                        </>
                      ) : (
                        <>
                          <User className="w-3.5 h-3.5" />
                          <span>Assumir conversa</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteConversation(activeConv.lead_id)}
                      className="w-[32px] h-[32px] rounded-full bg-[var(--bg)] hover:bg-[#ef4444]/15 border border-[var(--line2)] hover:border-[#ef4444]/30 grid place-items-center text-[var(--ds-muted)] hover:text-[#ef4444] cursor-pointer transition-colors"
                      title="Excluir histórico de conversa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* ÁREA DE MENSAGENS COM PAPEL DE PAREDE ADAPTÁVEL AO TEMA */}
                <div
                  className="flex-1 overflow-y-auto p-[18px] flex flex-col gap-[10px] bg-[#efeae2]/55 dark:bg-[#0b141a]"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(100, 116, 139, 0.08) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                >
                  {groupedMessages.length === 0 ? (
                    <div className="my-auto text-center text-[12px] text-[var(--ds-muted)]">
                      <span className="px-[14px] py-[6px] rounded-[10px] bg-[var(--surface)] border border-[var(--line2)] shadow-sm">
                        As mensagens deste contato são protegidas e sincronizadas em tempo real.
                      </span>
                    </div>
                  ) : (
                    groupedMessages.map((group) => (
                      <div key={group.dateLabel} className="flex flex-col gap-[8px]">
                        {/* Pílula de Data estilo WhatsApp */}
                        <div className="flex items-center justify-center my-[6px]">
                          <span className="px-[12px] py-[3px] rounded-[8px] bg-[var(--surface)] border border-[var(--line2)] text-[10.5px] font-semibold text-[var(--ds-muted)] uppercase shadow-sm">
                            {group.dateLabel}
                          </span>
                        </div>

                        {group.items.map((m) => {
                          const isHuman = m.type === 'human'
                          const isOperator = m.type === 'operator'

                          return (
                            <div
                              key={m.id}
                              className={`flex flex-col ${
                                isHuman ? 'items-start' : 'items-end'
                              }`}
                            >
                              <div
                                className={`max-w-[78%] px-[14px] py-[9px] text-[13px] leading-[1.45] shadow-sm ${
                                  isHuman
                                    ? 'bg-[var(--surface)] text-[var(--fg)] rounded-[14px] rounded-tl-[2px] border border-[var(--line2)] dark:bg-[#202c33] dark:text-[#e9edef] dark:border-[#2a3942]/40'
                                    : isOperator
                                      ? 'bg-[#0066FF] text-white font-medium rounded-[14px] rounded-tr-[2px]'
                                      : 'bg-[#d9fdd3] text-[#111b21] rounded-[14px] rounded-tr-[2px] border border-[#b9e6b2] dark:bg-[#005c4b] dark:text-[#e9edef] dark:border-[#007a64]/40'
                                }`}
                              >
                                {m.is_audio && (
                                  <div
                                    className={`flex items-center gap-[5px] mb-[4px] pb-[3px] border-b text-[11px] font-semibold ${
                                      isOperator
                                        ? 'border-white/20 text-white'
                                        : isHuman
                                          ? 'border-[var(--line2)] text-[#0066FF]'
                                          : 'border-[#111b21]/15 text-[#15803d] dark:border-white/10 dark:text-[#38bdf8]'
                                    }`}
                                  >
                                    <Mic className="w-3.5 h-3.5" />
                                    <span>Áudio de WhatsApp (Transcrito por IA)</span>
                                  </div>
                                )}

                                <p className="whitespace-pre-wrap">{m.content}</p>

                                <div
                                  className={`flex items-center justify-end gap-[4px] mt-[4px] text-[10px] ${
                                    isOperator
                                      ? 'text-white/80 font-medium'
                                      : isHuman
                                        ? 'text-[var(--ds-muted)]'
                                        : 'text-[#54656f] dark:text-[#8696a0]'
                                  }`}
                                >
                                  <span>
                                    {isOperator
                                      ? 'Atendente'
                                      : isHuman
                                        ? m.sender_label || 'Cliente'
                                        : 'IA 24h'}
                                  </span>
                                  <span>·</span>
                                  <span>{formatTimeHHMM(m.hora_data_mensagem)}</span>
                                  {!isHuman && (
                                    <DoubleCheckSvg className="w-3.5 h-2.5 text-[#53bdeb]" />
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* BARRA DE DIGITAÇÃO DO WHATSAPP */}
                <form
                  onSubmit={handleSendOperatorMsg}
                  className="bg-[var(--surface)] p-[10px] px-[14px] border-t border-[var(--line2)] flex items-center gap-[10px] shrink-0"
                >
                  <button
                    type="button"
                    className="text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer shrink-0 transition-colors"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    className="text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer shrink-0 transition-colors"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    placeholder="Mensagem..."
                    value={operatorInput}
                    onChange={(e) => setOperatorInput(e.target.value)}
                    className="flex-1 h-[40px] px-[16px] rounded-full bg-[var(--bg)] border border-[var(--line2)] text-[var(--fg)] placeholder-[var(--ds-muted)] text-[13px] focus:outline-none focus:border-[#0066FF] transition-colors"
                  />

                  <button
                    type="submit"
                    disabled={!operatorInput.trim() || isSending}
                    className="w-[40px] h-[40px] rounded-full bg-[#00a884] hover:bg-[#02906f] disabled:opacity-40 text-white grid place-items-center cursor-pointer transition-colors shrink-0 shadow-md"
                    title="Enviar mensagem pelo WhatsApp"
                  >
                    <Send className="w-4 h-4 ml-[1px]" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 grid place-items-center p-[20px] text-[13px] text-[var(--ds-muted)]">
                Selecione um lead na lista ao lado para abrir o atendimento.
              </div>
            )}
          </div>

          {/* COLUNA 3: PAINEL LATERAL (STATUS DO CLIENTE + NOTAS & DORES + OPORTUNIDADE COMERCIAL) */}
          <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[16px] flex flex-col gap-[16px] h-full overflow-y-auto">
            {activeConv ? (
              <>
                {/* 1. STATUS DO CLIENTE (MOVIDO DO TOPO DO CHAT) */}
                <div className="flex flex-col gap-[10px] pb-[16px] border-b border-[var(--line2)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[var(--fg)] flex items-center gap-[6px] uppercase tracking-wider">
                      <span className="w-[7px] h-[7px] rounded-full bg-[#0066FF]" />
                      Status do Cliente
                    </span>

                    <button
                      type="button"
                      onClick={() => setModalLead(activeConv)}
                      className="h-[24px] px-[8px] rounded-[6px] bg-[var(--bg)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[var(--ds-muted)] hover:text-[var(--fg)] text-[11px] font-medium flex items-center gap-[4px] cursor-pointer transition-colors"
                      title="Abrir ficha completa com scorecard, notas e conversão"
                    >
                      <span>Ficha do Lead</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Seletor rápido de Estágio Comercial com cores correspondentes adaptadas */}
                  <div className="relative">
                    <select
                      value={activeConv.commercial_stage}
                      onChange={(e) =>
                        handleUpdateCommercialDetails({ commercial_stage: e.target.value })
                      }
                      className={`w-full h-[34px] pl-[10px] pr-[28px] rounded-[8px] text-[12px] font-bold border cursor-pointer appearance-none bg-[var(--bg)] transition-colors ${
                        (COMMERCIAL_STAGE_LABELS[activeConv.commercial_stage] ||
                          COMMERCIAL_STAGE_LABELS.NOVO).badge
                      }`}
                      title="Alterar estágio comercial do cliente no funil"
                    >
                      {Object.entries(COMMERCIAL_STAGE_LABELS).map(([k, v]) => (
                        <option
                          key={k}
                          value={k}
                          className="bg-[var(--surface)] text-[var(--fg)] font-medium"
                        >
                          {v.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-current absolute right-[10px] top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
                  </div>

                  {/* Pílulas de Score, Status do Atendimento e Reunião */}
                  <div className="flex items-center gap-[6px] flex-wrap">
                    {/* Score SDR */}
                    <span className="inline-flex items-center gap-[4px] px-[8px] py-[3px] rounded-[6px] bg-[var(--bg)] border border-[var(--line2)] text-[11px] font-semibold text-[#b45309] dark:text-[#e8c14a]">
                      <Sparkles className="w-3 h-3 text-[#d97706] dark:text-[#e8c14a]" />
                      Score: {activeConv.qualification_score ?? 50}/100
                    </span>

                    {/* Status Atendimento: IA vs Humano */}
                    <span
                      className={`inline-flex items-center gap-[5px] px-[8px] py-[3px] rounded-[6px] text-[11px] font-medium border ${
                        activeConv.human_takeover
                          ? 'bg-[#0066FF]/15 border-[#0066FF]/30 text-[#0066FF]'
                          : 'bg-[#2f9e5a]/15 border-[#2f9e5a]/30 text-[#15803d] dark:text-[#2f9e5a]'
                      }`}
                    >
                      <span
                        className={`w-[6px] h-[6px] rounded-full ${
                          activeConv.human_takeover
                            ? 'bg-[#0066FF]'
                            : 'bg-[#25D366] animate-pulse'
                        }`}
                      />
                      <span>
                        {activeConv.human_takeover
                          ? 'Humano no Controle'
                          : 'IA 24h Ativa'}
                      </span>
                    </span>

                    {activeConv.commercial_stage === 'REUNIAO_AGENDADA' && (
                      <span className="inline-flex items-center gap-[4px] px-[8px] py-[3px] rounded-[6px] bg-[#2f9e5a]/15 border border-[#2f9e5a]/30 text-[#15803d] dark:text-[#2f9e5a] text-[11px] font-semibold">
                        <Calendar className="w-3 h-3" />
                        Reunião Agendada
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. NOTAS & DORES DO LEAD (SDR) - ABAIXO DO STATUS E ACIMA DE OPORTUNIDADE COMERCIAL */}
                <div className="flex flex-col gap-[8px] pb-[16px] border-b border-[var(--line2)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-bold text-[var(--fg)] flex items-center gap-[6px]">
                      <FileText className="w-3.5 h-3.5 text-[#0066FF]" />
                      Notas & Dores do Lead (SDR)
                    </span>
                    <span className="text-[10px] text-[var(--ds-muted)] font-medium">
                      {(activeConv.memories || []).length} registros
                    </span>
                  </div>

                  <div className="flex flex-col gap-[6px] max-h-[160px] overflow-y-auto pr-[2px]">
                    {(activeConv.memories || []).length === 0 ? (
                      <span className="text-[11px] text-[var(--ds-muted)] italic py-[6px]">
                        Nenhuma dor ou anotação gravada ainda.
                      </span>
                    ) : (
                      activeConv.memories.map((m) => (
                        <div
                          key={m.id}
                          className="p-[8px] rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[11px] flex items-start justify-between gap-[6px] group hover:border-[#0066FF]/40 transition-colors"
                        >
                          <span className="leading-snug">{m.memory_text}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteMemory(m.id)}
                            className="opacity-0 group-hover:opacity-100 text-[var(--ds-muted)] hover:text-[#ef4444] cursor-pointer shrink-0 transition-opacity"
                            title="Remover anotação"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddMemory} className="flex items-center gap-[6px] mt-[4px]">
                    <input
                      type="text"
                      placeholder="Nova dor ou nota sobre o lead..."
                      value={newMemoryInput}
                      onChange={(e) => setNewMemoryInput(e.target.value)}
                      className="flex-1 h-[32px] px-[10px] rounded-[6px] bg-[var(--bg)] border border-[var(--line2)] text-[11.5px] focus:outline-none focus:border-[#0066FF]"
                    />
                    <button
                      type="submit"
                      disabled={!newMemoryInput.trim()}
                      className="w-[32px] h-[32px] rounded-[6px] bg-[#0066FF] text-white grid place-items-center disabled:opacity-30 cursor-pointer shrink-0 hover:bg-[#0052CC] transition-colors"
                      title="Adicionar nota"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

                {/* 3. OPORTUNIDADE COMERCIAL */}
                <div className="flex flex-col gap-[14px]">
                  {/* Cabeçalho do Card Comercial */}
                  <div className="flex items-center justify-between pb-[10px] border-b border-[var(--line2)]">
                    <div>
                      <h3 className="font-bold text-[14px] leading-tight text-[var(--fg)]">
                        Oportunidade Comercial
                      </h3>
                      <span className="text-[11px] text-[var(--ds-muted)]">
                        SDR & Qualificação
                      </span>
                    </div>

                    <div className="flex items-center gap-[6px]">
                      <span className="px-[8px] py-[3px] rounded-full bg-[#0066FF]/15 border border-[#0066FF]/30 text-[#0066FF] text-[11px] font-bold">
                        Score {activeConv.qualification_score}/100
                      </span>
                    </div>
                  </div>

                  {/* Estágio da Oportunidade */}
                  <div className="flex flex-col gap-[6px]">
                    <label className="text-[11.5px] font-semibold text-[var(--ds-muted)]">
                      Estágio da Oportunidade
                    </label>
                    <select
                      value={activeConv.commercial_stage}
                      onChange={(e) =>
                        handleUpdateCommercialDetails({
                          commercial_stage: e.target.value,
                        })
                      }
                      className="w-full h-[36px] px-[10px] rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[12.5px] font-medium text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                    >
                      {Object.entries(COMMERCIAL_STAGE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Agendamento de Reunião Comercial */}
                  <div className="p-[12px] rounded-[12px] bg-[var(--bg)] border border-[var(--line2)] flex flex-col gap-[10px]">
                    <div className="flex items-center gap-[6px] text-[12px] font-semibold text-[#0066FF]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Reunião Comercial Agendada</span>
                    </div>

                    <div className="flex flex-col gap-[4px]">
                      <label className="text-[10.5px] text-[var(--ds-muted)]">
                        Data e Horário
                      </label>
                      <CoyDatePicker
                        value={meetingDateInput}
                        onChange={setMeetingDateInput}
                        includeTime={true}
                        placeholder="Agendar data e hora..."
                        className="w-full h-[34px] rounded-[6px]"
                      />
                    </div>

                    <div className="flex flex-col gap-[4px]">
                      <label className="text-[10.5px] text-[var(--ds-muted)]">
                        Link da Sala (Google Meet / Zoom)
                      </label>
                      <div className="flex items-center gap-[4px]">
                        <input
                          type="url"
                          placeholder="https://meet.google.com/..."
                          value={meetingLinkInput}
                          onChange={(e) => setMeetingLinkInput(e.target.value)}
                          className="flex-1 h-[34px] px-[10px] rounded-[6px] bg-[var(--surface)] border border-[var(--line2)] text-[12px] focus:outline-none focus:border-[#0066FF]"
                        />
                        {meetingLinkInput && (
                          <a
                            href={meetingLinkInput}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-[34px] h-[34px] rounded-[6px] bg-[var(--surface)] border border-[var(--line2)] grid place-items-center text-[var(--ds-muted)] hover:text-[#0066FF] shrink-0"
                            title="Abrir sala de reunião"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateCommercialDetails({
                          meeting_scheduled_at: meetingDateInput
                            ? new Date(meetingDateInput).toISOString()
                            : null,
                          meeting_link: meetingLinkInput.trim() || null,
                        })
                      }
                      disabled={isSavingMeeting}
                      className="w-full h-[32px] rounded-[6px] bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[11.5px] font-semibold flex items-center justify-center gap-[4px] cursor-pointer transition-colors"
                    >
                      <span>{isSavingMeeting ? 'Salvando...' : 'Salvar Reunião'}</span>
                    </button>
                  </div>

                  {/* Botão de Solicitar Proposta Comercial */}
                  <button
                    type="button"
                    onClick={() => handleRequestProposalFromLead(activeConv)}
                    disabled={isRequestingProposal}
                    className="w-full h-[38px] px-[14px] rounded-[10px] bg-[var(--surface)] hover:bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/30 font-semibold text-[12px] flex items-center justify-center gap-[8px] cursor-pointer transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>
                      {isRequestingProposal
                        ? 'Solicitando Proposta...'
                        : 'Solicitar Proposta Comercial'}
                    </span>
                  </button>

                  {/* Botão de Converter Lead em Cliente */}
                  <button
                    type="button"
                    onClick={handleConvertLeadToClient}
                    disabled={isConvertingLead}
                    className="w-full h-[40px] px-[14px] rounded-[10px] bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-[12.5px] flex items-center justify-center gap-[8px] cursor-pointer transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>
                      {isConvertingLead
                        ? 'Convertendo...'
                        : 'Converter Lead em Cliente (Onboarding)'}
                    </span>
                  </button>

                  {convertSuccessMsg && (
                    <div className="p-[10px] rounded-[8px] bg-[#2f9e5a]/15 border border-[#2f9e5a]/30 text-[#2f9e5a] text-[11px] leading-tight flex items-start gap-[6px]">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
                      <span>{convertSuccessMsg}</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-[20px] text-center text-[12px] text-[var(--ds-muted)]">
                Selecione um lead para ver o scorecard e detalhes da oportunidade.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODO 2: QUADRO KANBAN (CARROSSEL LIVRE DE LEADS) */}
      {/* ============================================================== */}
      {viewMode === 'KANBAN' && (
        <div className="flex flex-col gap-[14px] flex-1">
          {/* Barra de Filtro e Controles do Carrossel */}
          <div className="flex flex-wrap items-center justify-between gap-[10px] bg-[var(--surface)] border border-[var(--line2)] rounded-[14px] px-[16px] py-[10px]">
            <div className="flex items-center gap-[12px]">
              <div className="relative w-full sm:w-[280px]">
                <Search className="w-3.5 h-3.5 text-[var(--ds-muted)] absolute left-[10px] top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar cards do funil..."
                  value={inboxSearch}
                  onChange={(e) => setInboxSearch(e.target.value)}
                  className="w-full h-[34px] pl-[30px] pr-[10px] rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[12px] focus:outline-none focus:border-[#0066FF]"
                />
              </div>

              <div className="hidden sm:flex items-center gap-[6px] text-[11.5px] text-[var(--ds-muted)]">
                <span>Arraste os cards para alterar o estágio ou clique para abrir a conversa.</span>
              </div>
            </div>

            {/* Controles de Navegação do Carrossel */}
            <div className="flex items-center gap-[8px]">
              <span className="text-[11px] font-semibold text-[var(--ds-muted)] mr-[4px]">
                Navegar colunas:
              </span>
              <button
                type="button"
                onClick={() => handleScrollKanban('left')}
                className="h-[32px] px-[10px] rounded-full bg-[var(--bg)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] hover:border-[#0066FF] text-[12px] font-medium flex items-center gap-[4px] cursor-pointer transition-colors"
                title="Rolar carrossel para a esquerda"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <button
                type="button"
                onClick={() => handleScrollKanban('right')}
                className="h-[32px] px-[10px] rounded-full bg-[var(--bg)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] hover:border-[#0066FF] text-[12px] font-medium flex items-center gap-[4px] cursor-pointer transition-colors"
                title="Rolar carrossel para a direita"
              >
                <span className="hidden sm:inline">Próximo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quadro Kanban em Carrossel com Colunas Largas e Livres */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <div
              ref={kanbanContainerRef}
              className="flex gap-[16px] items-start pb-[24px] overflow-x-auto scroll-smooth snap-x"
              style={{ scrollbarWidth: 'thin' }}
            >
              {KANBAN_COLUMNS.map((col) => {
                const colLeads = filteredConversations.filter(
                  (c) => c.commercial_stage === col.id
                )

                return (
                  <div
                    key={col.id}
                    className="w-[320px] min-w-[320px] shrink-0 snap-start bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] p-[14px] flex flex-col gap-[12px] shadow-sm"
                  >
                    {/* Cabeçalho da Coluna */}
                    <div className="flex items-center justify-between pb-[8px] border-b border-[var(--line)]">
                      <div className="flex items-center gap-[8px]">
                        <span
                          className="w-[9px] h-[9px] rounded-full shrink-0"
                          style={{ backgroundColor: col.color }}
                        />
                        <span className="font-bold text-[13px] tracking-tight text-[var(--fg)]">
                          {col.name}
                        </span>
                        <span className="px-[7px] py-[1px] rounded-full bg-[var(--bg)] border border-[var(--line2)] text-[10.5px] font-bold text-[var(--ds-muted)]">
                          {colLeads.length}
                        </span>
                      </div>
                    </div>

                    {/* Droppable Area */}
                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex flex-col gap-[10px] min-h-[360px] rounded-[12px] transition-colors ${
                            snapshot.isDraggingOver ? 'bg-[#0066FF]/5 p-[4px]' : ''
                          }`}
                        >
                          {colLeads.map((lead, index) => (
                            <Draggable
                              key={lead.lead_id}
                              draggableId={lead.lead_id}
                              index={index}
                            >
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  onClick={() => openLeadModal(lead)}
                                  className={`bg-[var(--bg)] border rounded-[14px] p-[14px] flex flex-col gap-[10px] cursor-pointer transition-all ${
                                    dragSnapshot.isDragging
                                      ? 'border-[#0066FF] shadow-2xl scale-[1.02]'
                                      : 'border-[var(--line2)] hover:border-[#0066FF]/70'
                                  }`}
                                >
                                  {/* Topo do Card */}
                                  <div className="flex items-center justify-between gap-[4px]">
                                    <span className="px-[7px] py-[2px] rounded-[5px] bg-[#0066FF]/15 border border-[#0066FF]/30 text-[#0066FF] text-[10px] font-bold">
                                      Score {lead.qualification_score}/100
                                    </span>

                                    <span className="text-[10.5px] text-[var(--ds-muted)] flex items-center gap-[4px]">
                                      <span
                                        className={`w-[6px] h-[6px] rounded-full ${
                                          lead.human_takeover
                                            ? 'bg-[#0066FF]'
                                            : 'bg-[#2f9e5a]'
                                        }`}
                                      />
                                      {lead.human_takeover ? 'Humano' : 'IA 24h'}
                                    </span>
                                  </div>

                                  {/* Nome e Telefone */}
                                  <div>
                                    <div className="font-semibold text-[13.5px] leading-tight text-[var(--fg)]">
                                      {lead.lead_nome}
                                    </div>
                                    <span className="text-[11px] text-[var(--ds-muted)]">
                                      {formatPhoneDisplay(lead.lead_id)}
                                    </span>
                                  </div>

                                  {/* Data da Reunião (se houver) */}
                                  {lead.meeting_scheduled_at && (
                                    <div className="flex items-center gap-[5px] text-[11px] text-[#2f9e5a] bg-[#2f9e5a]/10 border border-[#2f9e5a]/25 px-[8px] py-[3px] rounded-[6px] font-medium">
                                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate">
                                        {formatFullDate(lead.meeting_scheduled_at)}
                                      </span>
                                    </div>
                                  )}

                                  {/* Preview da Última Mensagem */}
                                  {lead.last_message_preview && (
                                    <p className="text-[11.5px] text-[var(--ds-muted)] line-clamp-2 italic leading-relaxed">
                                      &quot;{lead.last_message_preview}&quot;
                                    </p>
                                  )}

                                  {/* Rodapé do Card com notas e atalho */}
                                  <div className="flex items-center justify-between pt-[8px] border-t border-[var(--line)] text-[11px] text-[var(--ds-muted)]">
                                    <span className="flex items-center gap-[4px]">
                                      <MessageSquare className="w-3.5 h-3.5 text-[#0066FF]" />
                                      <span>{(lead.memories || []).length} notas</span>
                                    </span>

                                    <div className="flex items-center gap-[8px]">
                                      <button
                                        type="button"
                                        title="Solicitar Proposta Comercial"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleRequestProposalFromLead(lead)
                                        }}
                                        className="p-[3px] rounded hover:bg-[var(--line)] text-[var(--ds-muted)] hover:text-[#0066FF] cursor-pointer transition-colors"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleGoToChat(lead)
                                        }}
                                        className="text-[#0066FF] hover:underline flex items-center gap-[3px] font-medium cursor-pointer"
                                      >
                                        <span>Abrir chat</span>
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })}
            </div>
          </DragDropContext>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODO 3: VISUALIZAÇÃO EM LISTA (TABELA CRM) */}
      {/* ============================================================== */}
      {viewMode === 'LIST' && (
        <div className="flex flex-col gap-[14px] flex-1">
          {/* Barra de Filtros */}
          <div className="flex flex-wrap items-center justify-between gap-[10px] bg-[var(--surface)] border border-[var(--line2)] rounded-[12px] px-[14px] py-[8px]">
            <div className="flex items-center gap-[10px] flex-1 max-w-[500px]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[var(--ds-muted)] absolute left-[10px] top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nome, telefone ou mensagem..."
                  value={inboxSearch}
                  onChange={(e) => setInboxSearch(e.target.value)}
                  className="w-full h-[32px] pl-[30px] pr-[10px] rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[12px] focus:outline-none focus:border-[#0066FF]"
                />
              </div>

              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="h-[32px] px-[10px] rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[11.5px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
              >
                <option value="ALL">Todos os Estágios</option>
                {Object.entries(COMMERCIAL_STAGE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-[11.5px] text-[var(--ds-muted)]">
              {filteredConversations.length} leads listados
            </div>
          </div>

          {/* Tabela de Leads */}
          <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[var(--line)] text-[11px] uppercase text-[var(--ds-muted)] bg-[var(--bg)]/40">
                  <th className="py-[12px] px-[16px]">Lead Comercial</th>
                  <th className="py-[12px] px-[12px]">Estágio</th>
                  <th className="py-[12px] px-[12px]">Score SDR</th>
                  <th className="py-[12px] px-[12px]">Reunião Agendada</th>
                  <th className="py-[12px] px-[12px]">Atendimento</th>
                  <th className="py-[12px] px-[12px]">Última Interação</th>
                  <th className="py-[12px] px-[16px] text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredConversations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-[30px] text-center text-[var(--ds-muted)]">
                      Nenhum lead encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredConversations.map((lead) => {
                    const stage =
                      COMMERCIAL_STAGE_LABELS[lead.commercial_stage] ||
                      COMMERCIAL_STAGE_LABELS.NOVO

                    return (
                      <tr
                        key={lead.lead_id}
                        onClick={() => openLeadModal(lead)}
                        className="border-b border-[var(--line)] hover:bg-[var(--ds-hover)] cursor-pointer transition-colors"
                      >
                        {/* Nome e Telefone */}
                        <td className="py-[12px] px-[16px]">
                          <div className="flex items-center gap-[10px]">
                            <div className="w-[32px] h-[32px] rounded-full bg-[var(--bg)] border border-[var(--line2)] grid place-items-center text-[12px] font-bold text-[#0066FF] shrink-0">
                              {lead.lead_nome.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-[13px] text-[var(--fg)]">
                                {lead.lead_nome}
                              </div>
                              <div className="text-[11px] text-[var(--ds-muted)]">
                                {formatPhoneDisplay(lead.lead_id)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Estágio */}
                        <td className="py-[12px] px-[12px]">
                          <span
                            className={`px-[8px] py-[2.5px] rounded-[6px] border text-[11px] font-semibold ${stage.badge}`}
                          >
                            {stage.label}
                          </span>
                        </td>

                        {/* Score */}
                        <td className="py-[12px] px-[12px]">
                          <div className="flex items-center gap-[6px]">
                            <span className="font-bold text-[12px] text-[#0066FF]">
                              {lead.qualification_score}/100
                            </span>
                          </div>
                        </td>

                        {/* Reunião */}
                        <td className="py-[12px] px-[12px] text-[12px]">
                          {lead.meeting_scheduled_at ? (
                            <span className="text-[#2f9e5a] font-medium flex items-center gap-[4px]">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatFullDate(lead.meeting_scheduled_at)}
                            </span>
                          ) : (
                            <span className="text-[var(--ds-muted)]">—</span>
                          )}
                        </td>

                        {/* Atendimento */}
                        <td className="py-[12px] px-[12px]">
                          <span
                            className={`px-[8px] py-[2px] rounded-full text-[10.5px] font-medium flex items-center gap-[4px] w-fit ${
                              lead.human_takeover
                                ? 'bg-[#0066FF]/15 text-[#0066FF]'
                                : 'bg-[#2f9e5a]/15 text-[#2f9e5a]'
                            }`}
                          >
                            <span
                              className={`w-[5px] h-[5px] rounded-full ${
                                lead.human_takeover ? 'bg-[#0066FF]' : 'bg-[#2f9e5a]'
                              }`}
                            />
                            {lead.human_takeover ? 'Humano' : 'IA 24h'}
                          </span>
                        </td>

                        {/* Última Interação */}
                        <td className="py-[12px] px-[12px]">
                          <div className="text-[11.5px] text-[var(--ds-muted)] max-w-[220px] truncate">
                            {lead.last_message_preview || 'Conversa iniciada'}
                          </div>
                          <div className="text-[10px] text-[var(--ds-muted)]/70">
                            {formatTimeHHMM(lead.last_message_at)}
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="py-[12px] px-[16px] text-right">
                          <div
                            className="flex items-center justify-end gap-[8px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleRequestProposalFromLead(lead)}
                              disabled={isRequestingProposal}
                              className="h-[28px] px-[10px] rounded-[6px] bg-[var(--surface)] hover:bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/30 text-[11px] font-semibold flex items-center gap-[4px] cursor-pointer transition-colors"
                              title="Solicitar Proposta Comercial (cria tarefa em Leads - Tarefas)"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Proposta</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleGoToChat(lead)}
                              className="h-[28px] px-[10px] rounded-[6px] bg-[var(--bg)] hover:bg-[#0066FF] text-[var(--fg)] hover:text-white border border-[var(--line2)] text-[11px] font-semibold flex items-center gap-[4px] cursor-pointer transition-colors"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Atendimento</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteConversation(lead.lead_id)}
                              className="w-[28px] h-[28px] rounded-[6px] hover:bg-[#ef4444]/15 text-[var(--ds-muted)] hover:text-[#ef4444] grid place-items-center cursor-pointer transition-colors"
                              title="Excluir lead"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BANNER PREMIUM: SDR COMERCIAL & PIPELINE (ADAPTÁVEL AO TEMA CLARO E ESCURO) */}
      <div className="relative overflow-hidden rounded-[20px] bg-[var(--surface)] border border-[var(--line2)] p-[20px] sm:p-[24px] shadow-sm dark:bg-gradient-to-r dark:from-[#171717] dark:via-[#1c1d20] dark:to-[#171717] dark:border-[#2a2b2f] dark:shadow-xl w-full shrink-0">
        {/* Glow sutil de fundo */}
        <div className="absolute -top-[60px] -left-[60px] w-[200px] h-[200px] rounded-full bg-[#0066FF]/5 dark:bg-[#0066FF]/10 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-[60px] right-[10%] w-[240px] h-[240px] rounded-full bg-[#2f9e5a]/5 dark:bg-[#2f9e5a]/10 blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-[20px]">
          {/* Lado Esquerdo: Identificação & Conexão n8n */}
          <div className="flex flex-col gap-[8px] max-w-[560px]">
            <div className="flex items-center gap-[8px] flex-wrap">
              <span className="inline-flex items-center gap-[6px] px-[10px] py-[3px] rounded-full bg-[#2f9e5a]/15 border border-[#2f9e5a]/30 text-[#15803d] dark:text-[#2f9e5a] text-[11px] font-bold tracking-wide uppercase">
                <span className="w-[6px] h-[6px] rounded-full bg-[#2f9e5a] animate-pulse" />
                SDR Comercial & Qualificação 24h
              </span>
              <span className="text-[12px] text-[var(--ds-muted)] flex items-center gap-[5px]">
                <span>·</span>
                <span>Conectado ao fluxo do Agente Comercial no n8n</span>
              </span>
            </div>

            <h2 className="text-[18px] sm:text-[20px] font-bold text-[var(--fg)] tracking-[-0.4px] leading-tight">
              Central de Qualificação de Anúncios & Reuniões
            </h2>
            <p className="text-[12.5px] text-[var(--ds-muted)] leading-relaxed">
              O Agente SDR processa leads do WhatsApp em tempo real, valida perfil e agenda calls no Google Meet com sincronização automática no CRM.
            </p>
          </div>

          {/* Lado Direito: Os 3 Indicadores em Cards com Estilo Adaptável */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-[10px] sm:gap-[12px] shrink-0">
            {/* Card 1: Reuniões Agendadas */}
            <div className="bg-[var(--bg)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] hover:border-[#2f9e5a]/50 rounded-[14px] p-[14px] px-[16px] flex flex-col gap-[4px] transition-colors min-w-[150px] dark:bg-[#121316]/80 dark:border-[#26282e]">
              <div className="flex items-center justify-between text-[#15803d] dark:text-[#2f9e5a]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-muted)]">
                  Reuniões
                </span>
                <Calendar className="w-4 h-4 opacity-80" />
              </div>
              <div className="text-[24px] font-extrabold text-[#15803d] dark:text-[#2f9e5a] leading-none mt-[2px]">
                {metrics.meetings}
              </div>
              <span className="text-[10.5px] text-[var(--ds-muted)]">
                Agendadas no Meet
              </span>
            </div>

            {/* Card 2: Leads Qualificados */}
            <div className="bg-[var(--bg)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] hover:border-[#e8c14a]/50 rounded-[14px] p-[14px] px-[16px] flex flex-col gap-[4px] transition-colors min-w-[150px] dark:bg-[#121316]/80 dark:border-[#26282e]">
              <div className="flex items-center justify-between text-[#d97706] dark:text-[#e8c14a]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-muted)]">
                  Qualificados
                </span>
                <Sparkles className="w-4 h-4 opacity-80" />
              </div>
              <div className="text-[24px] font-extrabold text-[#d97706] dark:text-[#e8c14a] leading-none mt-[2px]">
                {metrics.qualified}
              </div>
              <span className="text-[10.5px] text-[var(--ds-muted)]">
                Score SDR ≥ 70
              </span>
            </div>

            {/* Card 3: Total no Funil */}
            <div className="bg-[var(--bg)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] hover:border-[#0284c7]/50 rounded-[14px] p-[14px] px-[16px] flex flex-col gap-[4px] transition-colors min-w-[150px] dark:bg-[#121316]/80 dark:border-[#26282e]">
              <div className="flex items-center justify-between text-[#0284c7] dark:text-[#38bdf8]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-muted)]">
                  No Funil
                </span>
                <LayoutGrid className="w-4 h-4 opacity-80" />
              </div>
              <div className="text-[24px] font-extrabold text-[#0284c7] dark:text-[#38bdf8] leading-none mt-[2px]">
                {metrics.total}
              </div>
              <span className="text-[10.5px] text-[var(--ds-muted)]">
                Leads em atendimento
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL / POPUP DE DETALHES DO LEAD (MODO KANBAN E LISTA) */}
      {/* ============================================================== */}
      {modalLead && (
        <div className="fixed inset-0 z-50 bg-[#141414]/85 backdrop-blur-sm grid place-items-center p-[16px] overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[20px] w-full max-w-[900px] shadow-2xl flex flex-col overflow-hidden my-auto max-h-[92vh]">
            {/* Cabeçalho do Modal */}
            <div className="px-[20px] py-[16px] border-b border-[var(--line2)] flex flex-wrap items-center justify-between gap-[12px] bg-[var(--bg)]/50">
              <div className="flex items-center gap-[12px]">
                <div className="w-[44px] h-[44px] rounded-full bg-[var(--surface)] border border-[var(--line2)] grid place-items-center text-[16px] font-bold text-[#0066FF] shrink-0">
                  {modalLead.lead_nome.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-[8px]">
                    <h2 className="text-[17px] font-bold leading-tight">
                      {modalLead.lead_nome}
                    </h2>
                    <span
                      className={`px-[8px] py-[2px] rounded-[6px] text-[10.5px] font-semibold border ${
                        (COMMERCIAL_STAGE_LABELS[modalStage] ||
                          COMMERCIAL_STAGE_LABELS.NOVO).badge
                      }`}
                    >
                      {
                        (COMMERCIAL_STAGE_LABELS[modalStage] ||
                          COMMERCIAL_STAGE_LABELS.NOVO).label
                      }
                    </span>
                  </div>
                  <div className="text-[12px] text-[var(--ds-muted)] flex items-center gap-[6px] mt-[2px]">
                    <span>{formatPhoneDisplay(modalLead.lead_id)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-[4px]">
                      <span
                        className={`w-[6px] h-[6px] rounded-full ${
                          modalLead.human_takeover ? 'bg-[#0066FF]' : 'bg-[#2f9e5a]'
                        }`}
                      />
                      {modalLead.human_takeover
                        ? 'Atendimento Humano'
                        : 'IA Automática Ativa'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botões do Topo: Ir para Modo Atendimento (Chat) + Fechar */}
              <div className="flex items-center gap-[8px]">
                <button
                  type="button"
                  onClick={() => handleGoToChat(modalLead)}
                  className="h-[36px] px-[16px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-[12.5px] flex items-center gap-[6px] cursor-pointer transition-colors shadow-sm"
                  title="Abrir a tela de atendimento com chat ao vivo para este lead"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Ir para o Modo Atendimento (Abrir Chat)</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setModalLead(null)}
                  className="w-[36px] h-[36px] rounded-full bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] grid place-items-center text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conteúdo em 2 Colunas: Informações/Notas vs Conversa WhatsApp */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--line2)] overflow-y-auto flex-1">
              {/* LADO ESQUERDO: NOTAS & DORES + OPORTUNIDADE COMERCIAL */}
              <div className="p-[20px] flex flex-col gap-[16px]">
                {/* 1. Notas & Dores do Lead (SDR) - ACIMA DE OPORTUNIDADE COMERCIAL */}
                <div className="flex flex-col gap-[8px] pb-[16px] border-b border-[var(--line2)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-bold text-[var(--fg)] flex items-center gap-[6px]">
                      <FileText className="w-3.5 h-3.5 text-[#0066FF]" />
                      Notas & Dores do Lead (SDR)
                    </span>
                    <span className="text-[10px] text-[var(--ds-muted)] font-medium">
                      {(modalLead.memories || []).length} registros
                    </span>
                  </div>

                  <div className="flex flex-col gap-[6px] max-h-[140px] overflow-y-auto pr-[2px]">
                    {(modalLead.memories || []).length === 0 ? (
                      <span className="text-[11px] text-[var(--ds-muted)] italic py-[4px]">
                        Nenhuma anotação gravada ainda.
                      </span>
                    ) : (
                      modalLead.memories.map((m) => (
                        <div
                          key={m.id}
                          className="p-[8px] rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[11.5px] flex items-start justify-between gap-[6px] group hover:border-[#0066FF]/40 transition-colors"
                        >
                          <span className="leading-snug">{m.memory_text}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteModalMemory(m.id)}
                            className="text-[var(--ds-muted)] hover:text-[#ef4444] cursor-pointer shrink-0"
                            title="Remover nota"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <form
                    onSubmit={handleAddModalMemory}
                    className="flex items-center gap-[6px] mt-[4px]"
                  >
                    <input
                      type="text"
                      placeholder="Adicionar nota ou dor identificada..."
                      value={modalNewMemory}
                      onChange={(e) => setModalNewMemory(e.target.value)}
                      className="flex-1 h-[32px] px-[10px] rounded-[6px] bg-[var(--bg)] border border-[var(--line2)] text-[11.5px] focus:outline-none focus:border-[#0066FF]"
                    />
                    <button
                      type="submit"
                      disabled={!modalNewMemory.trim()}
                      className="w-[32px] h-[32px] rounded-[6px] bg-[#0066FF] text-white grid place-items-center disabled:opacity-30 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

                {/* 2. Oportunidade Comercial: Estágio e Score */}
                <div className="grid grid-cols-2 gap-[10px]">
                  <div className="flex flex-col gap-[4px]">
                    <label className="text-[11px] font-semibold text-[var(--ds-muted)]">
                      Estágio Comercial
                    </label>
                    <select
                      value={modalStage}
                      onChange={(e) => setModalStage(e.target.value)}
                      className="w-full h-[36px] px-[10px] rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[12px] font-medium text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                    >
                      {Object.entries(COMMERCIAL_STAGE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-[4px]">
                    <label className="text-[11px] font-semibold text-[var(--ds-muted)]">
                      Score de Qualificação
                    </label>
                    <div className="flex items-center gap-[8px]">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={modalScore}
                        onChange={(e) => setModalScore(Number(e.target.value))}
                        className="w-full h-[36px] px-[10px] rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[12px] font-bold text-[#0066FF] focus:outline-none focus:border-[#0066FF]"
                      />
                    </div>
                  </div>
                </div>

                {/* Bloco de Reunião Comercial */}
                <div className="p-[14px] rounded-[14px] bg-[var(--bg)] border border-[var(--line2)] flex flex-col gap-[10px]">
                  <div className="flex items-center gap-[6px] text-[12px] font-bold text-[#0066FF]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Reunião Comercial Agendada</span>
                  </div>

                  <div className="flex flex-col gap-[4px]">
                    <label className="text-[10.5px] text-[var(--ds-muted)]">
                      Data e Horário
                    </label>
                    <CoyDatePicker
                      value={modalMeetingDate}
                      onChange={setModalMeetingDate}
                      includeTime={true}
                      placeholder="Agendar data e hora..."
                      className="w-full h-[34px] rounded-[6px]"
                    />
                  </div>

                  <div className="flex flex-col gap-[4px]">
                    <label className="text-[10.5px] text-[var(--ds-muted)]">
                      Link da Sala (Google Meet / Zoom)
                    </label>
                    <div className="flex items-center gap-[4px]">
                      <input
                        type="url"
                        placeholder="https://meet.google.com/..."
                        value={modalMeetingLink}
                        onChange={(e) => setModalMeetingLink(e.target.value)}
                        className="flex-1 h-[34px] px-[10px] rounded-[6px] bg-[var(--surface)] border border-[var(--line2)] text-[12px] focus:outline-none focus:border-[#0066FF]"
                      />
                      {modalMeetingLink && (
                        <a
                          href={modalMeetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-[34px] h-[34px] rounded-[6px] bg-[var(--surface)] border border-[var(--line2)] grid place-items-center text-[var(--ds-muted)] hover:text-[#0066FF] shrink-0"
                          title="Abrir sala"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveModalMeeting}
                    disabled={isSavingModalMeeting}
                    className="w-full h-[34px] rounded-[6px] bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[12px] font-semibold flex items-center justify-center gap-[6px] cursor-pointer transition-colors"
                  >
                    <span>
                      {isSavingModalMeeting ? 'Salvando...' : 'Salvar Alterações'}
                    </span>
                  </button>
                </div>

                {/* Botão de Solicitar Proposta Comercial */}
                <button
                  type="button"
                  onClick={() => modalLead && handleRequestProposalFromLead(modalLead)}
                  className="w-full h-[38px] px-[14px] rounded-[10px] bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] hover:border-[#0066FF]/60 text-[var(--fg)] font-bold text-[12px] flex items-center justify-center gap-[6px] cursor-pointer transition-colors shadow-xs"
                >
                  <FileText className="w-4 h-4 text-[#0066FF]" />
                  <span>Solicitar Proposta Comercial</span>
                </button>

                {/* Botão de Converter em Cliente */}
                <button
                  type="button"
                  onClick={handleConvertModalLead}
                  disabled={isConvertingModalLead}
                  className="w-full h-[40px] px-[14px] rounded-[10px] bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-[12.5px] flex items-center justify-center gap-[8px] cursor-pointer transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>
                    {isConvertingModalLead
                      ? 'Convertendo...'
                      : 'Converter Lead em Cliente (Onboarding)'}
                  </span>
                </button>

                {modalConvertSuccess && (
                  <div className="p-[10px] rounded-[8px] bg-[#2f9e5a]/15 border border-[#2f9e5a]/30 text-[#2f9e5a] text-[11px] flex items-start gap-[6px]">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
                    <span>{modalConvertSuccess}</span>
                  </div>
                )}
              </div>

              {/* LADO DIREITO: CONVERSA DO WHATSAPP (HISTÓRICO) */}
              <div className="p-[20px] flex flex-col gap-[12px] bg-[var(--bg)]/40">
                <div className="flex items-center justify-between pb-[8px] border-b border-[var(--line2)]">
                  <div className="flex items-center gap-[6px] text-[12px] font-semibold text-[var(--fg)]">
                    <MessageSquare className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>Conversa do WhatsApp</span>
                  </div>
                  <span className="text-[10.5px] text-[var(--ds-muted)]">
                    {modalMessages.length} mensagens
                  </span>
                </div>

                {/* Balões de Chat */}
                <div className="flex-1 overflow-y-auto max-h-[380px] p-[10px] rounded-[14px] bg-[var(--surface)] border border-[var(--line2)] flex flex-col gap-[10px]">
                  {isLoadingModalMsgs ? (
                    <div className="py-[30px] text-center text-[11.5px] text-[var(--ds-muted)]">
                      Carregando histórico do chat...
                    </div>
                  ) : modalMessages.length === 0 ? (
                    <div className="py-[30px] text-center text-[11.5px] text-[var(--ds-muted)]">
                      Nenhuma mensagem trocada ainda com este lead.
                    </div>
                  ) : (
                    modalMessages.map((m) => {
                      const isHuman = m.type === 'human'
                      const isOperator = m.type === 'operator'

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${
                            isHuman ? 'items-start' : 'items-end'
                          }`}
                        >
                          <div
                            className={`max-w-[88%] rounded-[12px] px-[12px] py-[8px] text-[12px] leading-relaxed shadow-sm ${
                              isHuman
                                ? 'bg-[var(--bg)] border border-[var(--line2)] text-[var(--fg)]'
                                : isOperator
                                  ? 'bg-[#0066FF] text-white font-medium'
                                  : 'bg-[#d9fdd3] text-[#111b21] border border-[#b9e6b2] dark:bg-[#005c4b] dark:text-[#e9edef] dark:border-[#007a64]/40'
                            }`}
                          >
                            {m.is_audio && (
                              <div className="flex items-center gap-[5px] mb-[4px] pb-[2px] border-b border-current/15 text-[10px] font-semibold">
                                <Mic className="w-2.5 h-2.5 text-[#0066FF]" />
                                <span>Áudio com transcrição IA</span>
                              </div>
                            )}

                            <p className="whitespace-pre-wrap">{m.content}</p>

                            <div
                              className={`flex items-center justify-end gap-[4px] mt-[4px] text-[9.5px] ${
                                isOperator
                                  ? 'text-white/80'
                                  : 'text-[var(--ds-muted)]'
                              }`}
                            >
                              <span>
                                {isOperator
                                  ? 'Atendente'
                                  : isHuman
                                    ? m.sender_label || 'Cliente'
                                    : 'IA'}
                              </span>
                              <span>·</span>
                              <span>{formatTimeHHMM(m.hora_data_mensagem)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={modalMessagesEndRef} />
                </div>

                {/* Botão de Atalho para o Chat ao vivo */}
                <button
                  type="button"
                  onClick={() => handleGoToChat(modalLead)}
                  className="w-full h-[38px] rounded-[10px] bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] hover:border-[#0066FF] text-[12px] font-semibold text-[var(--fg)] flex items-center justify-center gap-[6px] cursor-pointer transition-colors mt-auto"
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>Abrir Tela com Chat Completo para Responder</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL NOVA CONVERSA / LEAD */}
      {/* ============================================================== */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-[#141414]/80 backdrop-blur-sm grid place-items-center p-[16px]">
          <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] p-[24px] w-full max-w-[460px] shadow-2xl flex flex-col gap-[18px]">
            <div className="flex items-center justify-between pb-[10px] border-b border-[var(--line2)]">
              <div>
                <h3 className="text-[17px] font-bold">Novo Lead Comercial</h3>
                <p className="text-[12px] text-[var(--ds-muted)] mt-[2px]">
                  Cadastrar lead e iniciar conversa no WhatsApp
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="w-[30px] h-[30px] rounded-full hover:bg-[var(--bg)] grid place-items-center text-[var(--ds-muted)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateConversation} className="flex flex-col gap-[14px]">
              <div className="flex flex-col gap-[6px]">
                <label className="text-[12px] font-semibold">Nome do Lead</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dr. Marcelo Santos"
                  value={newLeadNome}
                  onChange={(e) => setNewLeadNome(e.target.value)}
                  className="h-[38px] px-[12px] rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] focus:outline-none focus:border-[#0066FF]"
                />
              </div>

              <div className="flex flex-col gap-[6px]">
                <label className="text-[12px] font-semibold">
                  WhatsApp (com DDD)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 5511988771234"
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                  className="h-[38px] px-[12px] rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] focus:outline-none focus:border-[#0066FF]"
                />
              </div>

              <div className="flex flex-col gap-[6px]">
                <label className="text-[12px] font-semibold">
                  Estágio Inicial no Funil
                </label>
                <select
                  value={newLeadStage}
                  onChange={(e) => setNewLeadStage(e.target.value)}
                  className="h-[38px] px-[10px] rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[12.5px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                >
                  {Object.entries(COMMERCIAL_STAGE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-[6px]">
                <label className="text-[12px] font-semibold">
                  Mensagem Inicial do Lead
                </label>
                <textarea
                  rows={3}
                  value={newInitialMsg}
                  onChange={(e) => setNewInitialMsg(e.target.value)}
                  className="p-[10px] rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[12.5px] focus:outline-none focus:border-[#0066FF] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-[10px] pt-[10px] border-t border-[var(--line2)]">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="h-[36px] px-[16px] rounded-full border border-[var(--line2)] text-[12px] font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-[36px] px-[20px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-[12px] cursor-pointer"
                >
                  Criar e Abrir Conversa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AtendimentoPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-[var(--ds-muted)]">Carregando atendimento...</div>}>
      <AtendimentoContent />
    </React.Suspense>
  )
}
