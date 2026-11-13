'use client'

import React, { useState, useMemo } from 'react'
import {
  UserCheck,
  UserPlus,
  Users,
  Search,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  FileText,
  Lock,
  Shield,
  Clock,
  Sparkles,
  MessageSquare,
  Send,
  Briefcase,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  Cake,
  Folder,
  List,
  Check,
  Building,
  Info,
  RotateCcw,
  Copy,
  Key,
  Bot,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react'
import { McpTokensTab } from '@/components/colaboradores/mcp-tokens-tab'
import { CoyDatePicker } from '@/components/ui/coy-date-picker'
import { useCoyDash } from '@/lib/coydash-store'
import {
  ACCESS_LEVELS_META,
  FEATURE_PERMISSION_CATALOG,
  generateStrongPassword,
  getAccessLevelMeta,
  isGuestScopedLevel,
  normalizeAccessType,
} from '@/lib/access-control'
import {
  AccessType,
  ContractType,
  WorkRegime,
  MemberStatus,
  TeamMemberItem,
} from '@/types/coydash'

// ============================================================================
// CONFIGURAÇÃO DE SETORES, CARGOS E PRESETS AUTOMÁTICOS DE TELAS
// ============================================================================
interface SectorConfigItem {
  roles: string[]
  defaultScreens: string[]
  rolePresets: Record<string, string[]>
}

const SECTOR_CONFIG: Record<string, SectorConfigItem> = {
  'Design & Criação': {
    roles: ['Designer Gráfico', 'UI/UX Designer', 'Motion Designer', 'Diretor de Arte'],
    defaultScreens: ['inicio', 'tarefas', 'agentes'],
    rolePresets: {
      'Designer Gráfico': ['inicio', 'tarefas'],
      'UI/UX Designer': ['inicio', 'tarefas', 'agentes'],
      'Motion Designer': ['inicio', 'tarefas'],
      'Diretor de Arte': ['inicio', 'tarefas', 'agentes', 'marketing'],
    },
  },
  'Tecnologia & Sistemas': {
    roles: ['Dev de Sistemas', 'Dev Fullstack', 'Dev Frontend', 'Dev Backend', 'Tech Lead', 'DevOps'],
    defaultScreens: ['inicio', 'tarefas', 'agentes', 'configuracoes'],
    rolePresets: {
      'Dev de Sistemas': ['inicio', 'tarefas', 'agentes', 'configuracoes'],
      'Dev Fullstack': ['inicio', 'tarefas', 'agentes', 'configuracoes'],
      'Dev Frontend': ['inicio', 'tarefas', 'agentes'],
      'Dev Backend': ['inicio', 'tarefas', 'agentes', 'configuracoes'],
      'Tech Lead': ['inicio', 'tarefas', 'agentes', 'configuracoes', 'pulse'],
      'DevOps': ['inicio', 'tarefas', 'configuracoes', 'pulse'],
    },
  },
  'Gestão & PMO': {
    roles: ['Gerente de Projetos', 'Scrum Master', 'COO / Operações', 'Coordenador'],
    defaultScreens: ['inicio', 'tarefas', 'clientes', 'studio', 'pulse'],
    rolePresets: {
      'Gerente de Projetos': ['inicio', 'tarefas', 'clientes', 'studio'],
      'Scrum Master': ['inicio', 'tarefas'],
      'COO / Operações': ['inicio', 'tarefas', 'clientes', 'studio', 'pulse', 'governanca', 'executivo'],
      'Coordenador': ['inicio', 'tarefas', 'clientes', 'studio'],
    },
  },
  'Customer Success & CS': {
    roles: ['Customer Success (CS)', 'Especialista de Atendimento', 'Analista de Suporte', 'Onboarding Specialist'],
    defaultScreens: ['inicio', 'clientes', 'atendimento', 'tarefas'],
    rolePresets: {
      'Customer Success (CS)': ['inicio', 'clientes', 'atendimento', 'tarefas'],
      'Especialista de Atendimento': ['inicio', 'clientes', 'atendimento'],
      'Analista de Suporte': ['inicio', 'atendimento', 'tarefas'],
      'Onboarding Specialist': ['inicio', 'clientes', 'tarefas', 'governanca'],
    },
  },
  'Recursos Humanos & DP': {
    roles: ['RH & People', 'Gerente de RH', 'Analista de DP', 'Recrutador'],
    defaultScreens: ['inicio', 'colaboradores', 'tarefas'],
    rolePresets: {
      'RH & People': ['inicio', 'colaboradores', 'tarefas'],
      'Gerente de RH': ['inicio', 'colaboradores', 'tarefas', 'financeiro'],
      'Analista de DP': ['inicio', 'colaboradores'],
      'Recrutador': ['inicio', 'colaboradores', 'tarefas'],
    },
  },
  'Comercial & Vendas': {
    roles: ['Closer / Vendas', 'SDR / Pré-vendas', 'Executivo de Contas', 'Gerente Comercial'],
    defaultScreens: ['inicio', 'comercial', 'clientes', 'atendimento', 'tarefas'],
    rolePresets: {
      'Closer / Vendas': ['inicio', 'comercial', 'clientes', 'atendimento', 'tarefas'],
      'SDR / Pré-vendas': ['inicio', 'comercial', 'clientes', 'atendimento'],
      'Executivo de Contas': ['inicio', 'comercial', 'clientes', 'atendimento', 'tarefas'],
      'Gerente Comercial': ['inicio', 'comercial', 'clientes', 'atendimento', 'tarefas', 'marketing'],
    },
  },
  'Financeiro': {
    roles: ['Analista Financeiro', 'Controller', 'Faturamento / Cobrança', 'CFO'],
    defaultScreens: ['inicio', 'financeiro', 'clientes'],
    rolePresets: {
      'Analista Financeiro': ['inicio', 'financeiro'],
      'Controller': ['inicio', 'financeiro', 'clientes'],
      'Faturamento / Cobrança': ['inicio', 'financeiro', 'clientes', 'atendimento'],
      'CFO': ['inicio', 'financeiro', 'clientes', 'executivo'],
    },
  },
  'Marketing': {
    roles: ['Gestor de Tráfego', 'Copywriter', 'Social Media', 'Growth Hacker'],
    defaultScreens: ['inicio', 'marketing', 'tarefas', 'clientes'],
    rolePresets: {
      'Gestor de Tráfego': ['inicio', 'marketing', 'tarefas', 'clientes'],
      'Copywriter': ['inicio', 'marketing', 'tarefas'],
      'Social Media': ['inicio', 'marketing', 'tarefas'],
      'Growth Hacker': ['inicio', 'marketing', 'tarefas', 'clientes', 'agentes'],
    },
  },
}

const SECTORS_LIST = Object.keys(SECTOR_CONFIG)

// Lista de Telas do Sistema para Controle Granular
const SYSTEM_SCREENS = [
  { key: 'inicio', label: 'Início / Visão Geral', icon: Building },
  { key: 'comercial', label: 'Comercial & Funil de Vendas', icon: Briefcase },
  { key: 'clientes', label: 'Clientes 360º', icon: Users },
  { key: 'atendimento', label: 'Atendimento & WhatsApp', icon: MessageSquare },
  { key: 'tarefas', label: 'Tarefas, Setores & Projetos', icon: List },
  { key: 'agentes', label: 'Agentes de Inteligência Artificial', icon: Sparkles },
  { key: 'marketing', label: 'Marketing & Disparos', icon: Send },
  { key: 'colaboradores', label: 'Membros e Colaboradores (RH)', icon: UserCheck },
  { key: 'financeiro', label: 'Financeiro & DRE', icon: DollarSign },
  { key: 'configuracoes', label: 'Configurações do Workspace', icon: Lock },
  { key: 'studio', label: 'Filas 1-Clique (Studio)', icon: Check },
  { key: 'pulse', label: 'Saúde & Alertas (Pulse)', icon: Shield },
  { key: 'governanca', label: 'Jornada & Governança', icon: FileText },
  { key: 'executivo', label: 'Visão Mobile Executiva', icon: ExternalLink },
]

function getScreensForSectorAndRole(sector: string, jobTitle: string): string[] {
  const config = SECTOR_CONFIG[sector]
  if (!config) return ['inicio', 'tarefas']
  if (config.rolePresets && config.rolePresets[jobTitle]) {
    return config.rolePresets[jobTitle]
  }
  return config.defaultScreens || ['inicio', 'tarefas']
}

function calculateAge(birthDateStr?: string | null): number | null {
  if (!birthDateStr) return null
  const bdate = new Date(birthDateStr)
  if (isNaN(bdate.getTime())) return null
  const diff = Date.now() - bdate.getTime()
  const ageDate = new Date(diff)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

function isBirthdayThisMonth(birthDateStr?: string | null): boolean {
  if (!birthDateStr) return false
  const bdate = new Date(birthDateStr)
  if (isNaN(bdate.getTime())) return false
  const currentMonth = new Date().getMonth()
  return bdate.getMonth() === currentMonth
}

export default function ColaboradoresRHPage() {
  const {
    currentOrg,
    orgMembers,
    hrNotes,
    taskFolders,
    taskLists,
    inviteTeamMember,
    updateTeamMember,
    adminUpdateMemberCredentials,
    deleteTeamMember,
    createHrNote,
    deleteHrNote,
  } = useCoyDash()

  // Aba Principal da Página: Equipe ou Tokens de IA
  const [activeMainTab, setActiveMainTab] = useState<'MEMBERS' | 'MCP_TOKENS'>('MEMBERS')

  // Filtros e busca
  const [search, setSearch] = useState('')
  const [selectedSectorFilter, setSelectedSectorFilter] = useState('ALL')
  const [selectedAccessFilter, setSelectedAccessFilter] = useState('ALL')

  // Controle de Modais
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteStep, setInviteStep] = useState<1 | 2 | 3 | 4>(1)
  const [isSendingInvite, setIsSendingInvite] = useState(false)
  const [showInvitePassword, setShowInvitePassword] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteResult, setInviteResult] = useState<{
    email: string
    password?: string
    passwordSet?: boolean
    inviteLink: string
    alreadyRegistered?: boolean
    emailSent?: boolean
  } | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedMemberId, setCopiedMemberId] = useState<string | null>(null)
  const [activeDetailMember, setActiveDetailMember] = useState<TeamMemberItem | null>(null)
  const [activeModalTab, setActiveModalTab] = useState<'pessoal' | 'contrato' | 'acessos' | 'historico'>('pessoal')

  // Estado de alteração de credenciais pelo Admin (E-mail e Senha)
  const [credEmail, setCredEmail] = useState('')
  const [credPassword, setCredPassword] = useState('')
  const [showCredPassword, setShowCredPassword] = useState(false)
  const [isSavingCreds, setIsSavingCreds] = useState(false)
  const [credFeedback, setCredFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Estado do formulário de criação de acesso (E-mail, Nome e Senha Inicial)
  const [inviteForm, setInviteForm] = useState({
    full_name: '',
    email: '',
    password: '',
    access_type: 'GUEST' as AccessType,
    sector: 'Tecnologia & Sistemas',
    job_title: 'Dev de Sistemas',
    allowed_screens: getScreensForSectorAndRole('Tecnologia & Sistemas', 'Dev de Sistemas'),
    allowed_folder_ids: [] as string[],
    allowed_list_ids: [] as string[],
    custom_permissions: {} as Record<string, boolean>,
  })

  // Estado de nova anotação do RH
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteCategory, setNewNoteCategory] = useState('1-on-1')

  // Estado de edição da Ficha 360
  const [editFormData, setEditFormData] = useState<Partial<TeamMemberItem>>({})
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Handlers para mudança de Setor e Cargo no Convite (Regra 3: alteram telas permitidas automaticamente)
  const handleSectorChange = (newSector: string) => {
    const config = SECTOR_CONFIG[newSector]
    const defaultJob = config?.roles[0] || 'Colaborador'
    const newScreens = getScreensForSectorAndRole(newSector, defaultJob)

    setInviteForm((prev) => ({
      ...prev,
      sector: newSector,
      job_title: defaultJob,
      allowed_screens: newScreens,
    }))
  }

  const handleJobTitleChange = (newJob: string) => {
    const newScreens = getScreensForSectorAndRole(inviteForm.sector, newJob)
    setInviteForm((prev) => ({
      ...prev,
      job_title: newJob,
      allowed_screens: newScreens,
    }))
  }

  // Abrir modal de convite resetando para Etapa 1
  const handleOpenInviteModal = () => {
    setInviteStep(1)
    setInviteResult(null)
    setInviteError('')
    setCopiedLink(false)
    setShowInvitePassword(true)
    setInviteForm({
      full_name: '',
      email: '',
      password: generateStrongPassword(10),
      access_type: 'GUEST',
      sector: 'Tecnologia & Sistemas',
      job_title: 'Dev de Sistemas',
      allowed_screens: getScreensForSectorAndRole('Tecnologia & Sistemas', 'Dev de Sistemas'),
      allowed_folder_ids: [],
      allowed_list_ids: [],
      custom_permissions: {},
    })
    setShowInviteModal(true)
  }

  // Abrir Ficha do Colaborador
  const handleOpenMemberDetail = (member: TeamMemberItem) => {
    setActiveDetailMember(member)
    setEditFormData({ ...member })
    setCredEmail(member.email || '')
    setCredPassword('')
    setCredFeedback(null)
    setActiveModalTab('pessoal')
  }

  // Atualizar E-mail e/ou Senha do Colaborador (Admin)
  const handleAdminUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeDetailMember || isSavingCreds) return
    setCredFeedback(null)

    const cleanNewEmail = credEmail.trim().toLowerCase()
    const cleanNewPwd = credPassword.trim()

    if (cleanNewPwd && cleanNewPwd.length < 6) {
      setCredFeedback({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' })
      return
    }

    setIsSavingCreds(true)
    try {
      const res = await adminUpdateMemberCredentials(
        activeDetailMember.id,
        cleanNewEmail !== activeDetailMember.email.toLowerCase() ? cleanNewEmail : undefined,
        cleanNewPwd || undefined
      )
      if (!res.ok) {
        setCredFeedback({ type: 'error', text: res.error || 'Erro ao atualizar credenciais.' })
      } else {
        setActiveDetailMember((prev) =>
          prev
            ? {
                ...prev,
                email: res.email || cleanNewEmail || prev.email,
                member_status: 'ACTIVE',
              }
            : null
        )
        setCredPassword('')
        setCredFeedback({
          type: 'success',
          text: res.passwordUpdated
            ? 'E-mail e nova senha atualizados com sucesso!'
            : 'E-mail de acesso atualizado com sucesso!',
        })
      }
    } finally {
      setIsSavingCreds(false)
    }
  }

  // Enviar novo convite / criar acesso direto com e-mail e senha
  const handleSendInvite = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inviteForm.email.trim() || isSendingInvite) return

    if (inviteForm.password.trim() && inviteForm.password.trim().length < 6) {
      setInviteError('A senha precisa ter pelo menos 6 caracteres.')
      setInviteStep(1)
      return
    }

    setInviteError('')
    setIsSendingInvite(true)
    try {
      const res = await inviteTeamMember({
        email: inviteForm.email.trim(),
        password: inviteForm.password.trim() || undefined,
        full_name: inviteForm.full_name.trim(),
        whatsapp_phone: '',
        whatsapp: '',
        role: 'CLIENT_OPERATIONS',
        access_type: inviteForm.access_type,
        sector: inviteForm.sector,
        job_title: inviteForm.job_title,
        allowed_screens: !isGuestScopedLevel(inviteForm.access_type) ? [] : inviteForm.allowed_screens,
        allowed_folder_ids: !isGuestScopedLevel(inviteForm.access_type) ? [] : inviteForm.allowed_folder_ids,
        allowed_list_ids: !isGuestScopedLevel(inviteForm.access_type) ? [] : inviteForm.allowed_list_ids,
        custom_permissions: inviteForm.custom_permissions,
        member_status: inviteForm.password.trim() ? 'ACTIVE' : 'INVITED',
      })

      if (!res.ok) {
        setInviteError(res.error || 'Não foi possível criar o acesso.')
        setInviteStep(1)
        return
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const directUrl = `${origin}/login?email=${encodeURIComponent(inviteForm.email.trim())}`

      setInviteResult({
        email: inviteForm.email.trim(),
        password: inviteForm.password.trim() || undefined,
        passwordSet: res?.passwordSet,
        inviteLink: res?.inviteLink || res?.directLoginUrl || directUrl,
        alreadyRegistered: res?.alreadyRegistered,
        emailSent: res?.emailSent,
      })
      setInviteStep(4)
    } finally {
      setIsSendingInvite(false)
    }
  }

  // Salvar alterações na Ficha
  const handleSaveMemberUpdates = async () => {
    if (!activeDetailMember) return
    setIsSavingEdit(true)
    try {
      await updateTeamMember(activeDetailMember.id, editFormData)
      setActiveDetailMember((prev) => (prev ? { ...prev, ...editFormData } : null))
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Adicionar Anotação de RH
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeDetailMember || !newNoteContent.trim()) return
    await createHrNote(activeDetailMember.id, newNoteContent.trim(), newNoteCategory)
    setNewNoteContent('')
  }

  // Colaboradores filtrados
  const filteredMembers = useMemo(() => {
    return orgMembers.filter((m) => {
      const matchSearch =
        m.full_name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        m.job_title.toLowerCase().includes(search.toLowerCase()) ||
        m.sector.toLowerCase().includes(search.toLowerCase())

      const matchSector = selectedSectorFilter === 'ALL' || m.sector === selectedSectorFilter
      const normAccess = normalizeAccessType(m.access_type)
      const matchAccess =
        selectedAccessFilter === 'ALL'
          ? true
          : selectedAccessFilter === 'ALL_GUESTS'
          ? isGuestScopedLevel(normAccess)
          : normAccess === selectedAccessFilter

      return matchSearch && matchSector && matchAccess
    })
  }, [orgMembers, search, selectedSectorFilter, selectedAccessFilter])

  // Agrupamento por Setor
  const groupedBySector = useMemo(() => {
    const groups: Record<string, TeamMemberItem[]> = {}
    SECTORS_LIST.forEach((s) => {
      groups[s] = []
    })

    filteredMembers.forEach((m) => {
      const s = m.sector || 'Geral'
      if (!groups[s]) groups[s] = []
      groups[s].push(m)
    })

    return Object.entries(groups).filter(([_, list]) => list.length > 0)
  }, [filteredMembers])

  // Métricas de RH
  const totalColaboradores = orgMembers.length
  const totalMembros = orgMembers.filter((m) => !isGuestScopedLevel(m.access_type)).length
  const totalConvidados = orgMembers.filter((m) => isGuestScopedLevel(m.access_type)).length
  const aniversariantesDoMes = orgMembers.filter((m) => isBirthdayThisMonth(m.birth_date)).length

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto flex flex-col gap-8 text-[var(--fg)]">
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0066FF]" />
            <span className="text-[12px] font-semibold tracking-wider uppercase text-[var(--ds-muted)]">
              Recursos Humanos & Gestão de Acessos
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Membros & Colaboradores
          </h1>
          <p className="text-[13.5px] text-[var(--ds-muted)] mt-1">
            Gerencie o time de {currentOrg.name}, permissões cirúrgicas de acesso e a ficha completa de cada colaborador.
          </p>
        </div>

        <button
          onClick={handleOpenInviteModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-[#0066FF] text-white font-semibold text-[13px] hover:opacity-90 transition-opacity shadow-lg shadow-[#0066FF]/20 cursor-pointer self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Convidar Colaborador</span>
        </button>
      </div>

      {/* SELETOR DE ABAS PRINCIPAIS */}
      <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
        <button
          onClick={() => setActiveMainTab('MEMBERS')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[10px] text-[13px] font-semibold transition-all cursor-pointer ${
            activeMainTab === 'MEMBERS'
              ? 'bg-[#0066FF] text-white shadow-sm'
              : 'text-[var(--ds-muted)] hover:text-[var(--fg)] hover:bg-[var(--line2)]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Equipe & Colaboradores</span>
          <span
            className={`text-[11px] px-1.5 py-0.5 rounded-full ${
              activeMainTab === 'MEMBERS' ? 'bg-white/20 text-white' : 'bg-[var(--line2)] text-[var(--ds-muted)]'
            }`}
          >
            {totalColaboradores}
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('MCP_TOKENS')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[10px] text-[13px] font-semibold transition-all cursor-pointer ${
            activeMainTab === 'MCP_TOKENS'
              ? 'bg-[#0066FF] text-white shadow-sm'
              : 'text-[var(--ds-muted)] hover:text-[var(--fg)] hover:bg-[var(--line2)]'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Tokens de IA & MCP</span>
          <span
            className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-[6px] ${
              activeMainTab === 'MCP_TOKENS' ? 'bg-white/20 text-white' : 'bg-[#0066FF]/10 text-[#0066FF]'
            }`}
          >
            Governança
          </span>
        </button>
      </div>

      {activeMainTab === 'MCP_TOKENS' ? (
        <McpTokensTab organizationId={currentOrg.id} />
      ) : (
        <>
          {/* CARDS DE RESUMO (KPIs DE RH) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-[14px] bg-[var(--surface)] border border-[var(--line2)] flex flex-col gap-1">
          <div className="flex items-center justify-between text-[var(--ds-muted)] text-[12px]">
            <span>Total na Operação</span>
            <Users className="w-4 h-4 text-[#0066FF]" />
          </div>
          <div className="text-2xl font-bold">{totalColaboradores}</div>
          <div className="text-[11px] text-[var(--ds-muted)]">Colaboradores ativos</div>
        </div>

        <div className="p-4 rounded-[14px] bg-[var(--surface)] border border-[var(--line2)] flex flex-col gap-1">
          <div className="flex items-center justify-between text-[var(--ds-muted)] text-[12px]">
            <span>Membros Full</span>
            <Shield className="w-4 h-4 text-[#5cd3a8]" />
          </div>
          <div className="text-2xl font-bold text-[#5cd3a8]">{totalMembros}</div>
          <div className="text-[11px] text-[var(--ds-muted)]">Acesso total ao workspace</div>
        </div>

        <div className="p-4 rounded-[14px] bg-[var(--surface)] border border-[var(--line2)] flex flex-col gap-1">
          <div className="flex items-center justify-between text-[var(--ds-muted)] text-[12px]">
            <span>Convidados Restritos</span>
            <Lock className="w-4 h-4 text-[#e8c14a]" />
          </div>
          <div className="text-2xl font-bold text-[#e8c14a]">{totalConvidados}</div>
          <div className="text-[11px] text-[var(--ds-muted)]">Telas e projetos limitados</div>
        </div>

        <div className="p-4 rounded-[14px] bg-[var(--surface)] border border-[var(--line2)] flex flex-col gap-1">
          <div className="flex items-center justify-between text-[var(--ds-muted)] text-[12px]">
            <span>Aniversariantes do Mês</span>
            <Cake className="w-4 h-4 text-[#ec4899]" />
          </div>
          <div className="text-2xl font-bold text-[#ec4899]">{aniversariantesDoMes}</div>
          <div className="text-[11px] text-[var(--ds-muted)]">Comemorações neste mês</div>
        </div>
      </div>

      {/* BARRA DE FILTROS E BUSCA */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-[14px] bg-[var(--surface)] border border-[var(--line2)]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ds-muted)]" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, cargo ou setor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[10px] pl-9 pr-4 py-2 text-[13px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] focus:outline-none focus:border-[#0066FF]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedSectorFilter}
            onChange={(e) => setSelectedSectorFilter(e.target.value)}
            className="bg-[var(--bg)] border border-[var(--line)] rounded-[10px] px-3 py-2 text-[12.5px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
          >
            <option value="ALL">Todos os Setores</option>
            {SECTORS_LIST.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>

          <select
            value={selectedAccessFilter}
            onChange={(e) => setSelectedAccessFilter(e.target.value)}
            className="bg-[var(--bg)] border border-[var(--line)] rounded-[10px] px-3 py-2 text-[12.5px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
          >
            <option value="ALL">Todos os Níveis</option>
            <option value="ALL_GUESTS">Todos os Convidados</option>
            {ACCESS_LEVELS_META.map((lvl) => (
              <option key={lvl.value} value={lvl.value}>
                {lvl.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* LISTA DE COLABORADORES DIVIDIDA POR SETOR */}
      <div className="flex flex-col gap-6">
        {groupedBySector.length === 0 ? (
          <div className="p-12 text-center rounded-[16px] bg-[var(--surface)] border border-dashed border-[var(--line2)] flex flex-col items-center justify-center gap-3">
            <Users className="w-10 h-10 text-[var(--ds-muted)] opacity-50" />
            <div className="text-[15px] font-semibold">Nenhum colaborador encontrado</div>
            <p className="text-[13px] text-[var(--ds-muted)] max-w-md">
              Não encontramos colaboradores correspondentes à sua busca ou filtro. Que tal convidar um novo membro para o workspace?
            </p>
            <button
              onClick={handleOpenInviteModal}
              className="mt-2 px-4 py-2 rounded-[10px] bg-[#0066FF] text-white font-medium text-[13px] hover:opacity-90 cursor-pointer"
            >
              Convidar Colaborador
            </button>
          </div>
        ) : (
          groupedBySector.map(([sectorName, members]) => (
            <div
              key={sectorName}
              className="rounded-[16px] bg-[var(--surface)] border border-[var(--line2)] overflow-hidden shadow-sm"
            >
              {/* CABEÇALHO DO SETOR */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-[var(--bg)]/60 border-b border-[var(--line)]">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#0066FF]" />
                  <h2 className="text-[14px] font-bold text-[var(--fg)] tracking-tight">
                    {sectorName}
                  </h2>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--ds-muted)] border border-[var(--line)]">
                    {members.length} {members.length === 1 ? 'colaborador' : 'colaboradores'}
                  </span>
                </div>
              </div>

              {/* LISTA FORMATADA DE COLABORADORES DO SETOR */}
              <div className="divide-y divide-[var(--line)]">
                {members.map((member) => {
                  const age = calculateAge(member.birth_date)
                  const isBday = isBirthdayThisMonth(member.birth_date)

                  return (
                    <div
                      key={member.id}
                      onClick={() => handleOpenMemberDetail(member)}
                      className="group flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 hover:bg-[var(--ds-hover)] transition-colors cursor-pointer"
                    >
                      {/* Lado Esquerdo: Avatar, Nome, E-mail, Cargo */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-[#0066FF]/20 to-[#0066FF]/5 border border-[#0066FF]/40 flex items-center justify-center text-[14px] font-bold text-[#0066FF] shrink-0">
                          {member.full_name ? member.full_name.slice(0, 2).toUpperCase() : member.email.slice(0, 2).toUpperCase()}
                          {isBday && (
                            <span
                              title="Aniversariante do Mês!"
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ec4899] text-white flex items-center justify-center text-[9px]"
                            >
                              🎂
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[14px] truncate group-hover:text-[#0066FF] transition-colors">
                              {member.full_name || member.email.split('@')[0]}
                            </span>
                            {(() => {
                              const levelMeta = getAccessLevelMeta(member.access_type)
                              const customCount = Object.keys(member.custom_permissions || {}).length
                              return (
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-[6px] border whitespace-nowrap"
                                  style={{
                                    backgroundColor: `${levelMeta.badgeColor}18`,
                                    color: levelMeta.badgeColor,
                                    borderColor: `${levelMeta.badgeColor}45`,
                                  }}
                                  title={
                                    customCount > 0
                                      ? `${levelMeta.description} (${customCount} ajuste(s) fino(s))`
                                      : levelMeta.description
                                  }
                                >
                                  {levelMeta.shortLabel}
                                  {customCount > 0 ? ` +${customCount}` : ''}
                                </span>
                              )
                            })()}
                          </div>

                          <div className="flex items-center gap-2 text-[12px] text-[var(--ds-muted)] truncate">
                            <span className="text-[var(--fg)] font-medium">{member.job_title}</span>
                            <span>•</span>
                            <span className="truncate">{member.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito: Contrato, Admissão, Acessos e Ação */}
                      <div className="flex items-center justify-between md:justify-end gap-6 text-[12px] text-[var(--ds-muted)] shrink-0">
                        <div className="flex items-center gap-4">
                          <div className="hidden sm:flex flex-col text-right">
                            <span className="text-[11px] uppercase tracking-wider text-[var(--ds-muted)]">
                              Contrato
                            </span>
                            <span className="font-medium text-[var(--fg)]">
                              {member.contract_type} · {member.work_regime}
                            </span>
                          </div>

                          <div className="hidden lg:flex flex-col text-right">
                            <span className="text-[11px] uppercase tracking-wider text-[var(--ds-muted)]">
                              Admissão
                            </span>
                            <span className="font-medium text-[var(--fg)]">
                              {member.hiring_date || 'Não informada'}
                            </span>
                          </div>

                          {age !== null && (
                            <div className="hidden md:flex flex-col text-right">
                              <span className="text-[11px] uppercase tracking-wider text-[var(--ds-muted)]">
                                Idade
                              </span>
                              <span className="font-medium text-[var(--fg)]">
                                {age} anos {isBday && '🎉'}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const link = `${window.location.origin}/login?invited=true&email=${encodeURIComponent(member.email)}`
                              navigator.clipboard.writeText(link)
                              setCopiedMemberId(member.id)
                              setTimeout(() => setCopiedMemberId(null), 2000)
                            }}
                            title="Copiar link de acesso rápido para enviar ao colaborador"
                            className="p-1.5 rounded-[8px] bg-[var(--surface)] hover:bg-[var(--line2)] border border-[var(--line2)] text-[var(--ds-muted)] hover:text-[#0066FF] transition-colors cursor-pointer"
                          >
                            {copiedMemberId === member.id ? (
                              <Check className="w-3.5 h-3.5 text-[#2f9e5a]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="text-[11.5px] font-medium text-[#0066FF] group-hover:underline">
                            Ver Ficha 360º
                          </span>
                          <ChevronRight className="w-4 h-4 text-[var(--ds-muted)] group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
      </>
      )}

      {/* ===================================================================== */}
      {/* POPUP GRANDE: FICHA 360º DO COLABORADOR */}
      {/* ===================================================================== */}
      {activeDetailMember && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--line2)] w-full max-w-4xl rounded-[20px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* TOPO DO MODAL */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--line)] bg-[var(--bg)]/40">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#0066FF]/20 border-2 border-[#0066FF] flex items-center justify-center text-lg font-bold text-[#0066FF]">
                  {activeDetailMember.full_name ? activeDetailMember.full_name.slice(0, 2).toUpperCase() : activeDetailMember.email.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-[var(--fg)]">
                      {activeDetailMember.full_name || activeDetailMember.email.split('@')[0]}
                    </h2>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-[6px] ${
                        activeDetailMember.access_type === 'MEMBER'
                          ? 'bg-[#5cd3a8]/15 text-[#5cd3a8] border border-[#5cd3a8]/30'
                          : 'bg-[#e8c14a]/15 text-[#e8c14a] border border-[#e8c14a]/30'
                      }`}
                    >
                      {activeDetailMember.access_type === 'MEMBER' ? 'Membro Full' : 'Convidado Restrito'}
                    </span>
                  </div>
                  <p className="text-[13px] text-[var(--ds-muted)]">
                    {activeDetailMember.job_title} · {activeDetailMember.sector}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveDetailMember(null)}
                className="w-9 h-9 rounded-full hover:bg-[var(--ds-hover)] grid place-items-center text-[var(--ds-muted)] hover:text-[var(--fg)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ABAS DA FICHA */}
            <div className="flex items-center border-b border-[var(--line)] px-6 bg-[var(--bg)]/20 overflow-x-auto">
              <button
                onClick={() => setActiveModalTab('pessoal')}
                className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeModalTab === 'pessoal'
                    ? 'border-[#0066FF] text-[#0066FF]'
                    : 'border-transparent text-[var(--ds-muted)] hover:text-[var(--fg)]'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Dados Pessoais & Contato</span>
              </button>

              <button
                onClick={() => setActiveModalTab('contrato')}
                className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeModalTab === 'contrato'
                    ? 'border-[#0066FF] text-[#0066FF]'
                    : 'border-transparent text-[var(--ds-muted)] hover:text-[var(--fg)]'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Contrato & RH</span>
              </button>

              <button
                onClick={() => setActiveModalTab('acessos')}
                className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeModalTab === 'acessos'
                    ? 'border-[#0066FF] text-[#0066FF]'
                    : 'border-transparent text-[var(--ds-muted)] hover:text-[var(--fg)]'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Acessos & Permissões</span>
              </button>

              <button
                onClick={() => setActiveModalTab('historico')}
                className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeModalTab === 'historico'
                    ? 'border-[#0066FF] text-[#0066FF]'
                    : 'border-transparent text-[var(--ds-muted)] hover:text-[var(--fg)]'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Histórico & Anotações RH</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[var(--surface)] text-[var(--ds-muted)] border border-[var(--line)]">
                  {hrNotes.filter((n) => n.member_id === activeDetailMember.id).length}
                </span>
              </button>
            </div>

            {/* CONTEÚDO DAS ABAS */}
            <div className="flex-1 overflow-y-auto p-6 text-[13px]">
              {/* ABA 1: DADOS PESSOAIS */}
              {activeModalTab === 'pessoal' && (
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--ds-muted)] uppercase mb-1">
                        Nome Completo (sincronizado pelo login)
                      </label>
                      <input
                        type="text"
                        value={editFormData.full_name || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                        className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[10px] px-3 py-2 text-[13px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--ds-muted)] uppercase mb-1">
                        E-mail Corporativo
                      </label>
                      <input
                        type="email"
                        value={editFormData.email || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[10px] px-3 py-2 text-[13px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--ds-muted)] uppercase mb-1">
                        WhatsApp / Telefone (sincronizado pelo login)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={editFormData.whatsapp_phone || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, whatsapp_phone: e.target.value })
                          }
                          className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[10px] px-3 py-2 text-[13px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                          placeholder="+55 11 99999-9999"
                        />
                        {editFormData.whatsapp_phone && (
                          <a
                            href={`https://wa.me/${editFormData.whatsapp_phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5cd3a8] hover:underline text-[11px] font-semibold flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" /> Abrir WhatsApp
                          </a>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--ds-muted)] uppercase mb-1">
                        Data de Nascimento
                      </label>
                      <CoyDatePicker
                        value={editFormData.birth_date || ''}
                        onChange={(val) => setEditFormData({ ...editFormData, birth_date: val })}
                        placeholder="Selecionar data..."
                        className="w-full"
                      />
                      {calculateAge(editFormData.birth_date) !== null && (
                        <span className="text-[11px] text-[var(--ds-muted)] mt-1 block">
                          Idade calculada: {calculateAge(editFormData.birth_date)} anos
                          {isBirthdayThisMonth(editFormData.birth_date) && ' (🎂 Faz aniversário este mês!)'}
                        </span>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11.5px] font-medium text-[var(--ds-muted)] uppercase mb-1">
                        Contato de Emergência
                      </label>
                      <input
                        type="text"
                        value={editFormData.emergency_contact || ''}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, emergency_contact: e.target.value })
                        }
                        placeholder="Nome e telefone de familiar/responsável para emergências"
                        className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[10px] px-3 py-2 text-[13px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2: CONTRATO & DADOS DE RH */}
              {activeModalTab === 'contrato' && (
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--ds-muted)] uppercase mb-1">
                        Modelo de Contratação
                      </label>
                      <select
                        value={editFormData.contract_type || 'PJ'}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, contract_type: e.target.value as ContractType })
                        }
                        className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[10px] px-3 py-2 text-[13px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                      >
                        <option value="PJ">Pessoa Jurídica (PJ)</option>
                        <option value="CLT">Carteira Assinada (CLT)</option>
                        <option value="ESTAGIO">Estágio</option>
                        <option value="OUTRO">Prestador / Freelancer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--ds-muted)] uppercase mb-1">
                        Regime de Trabalho
                      </label>
                      <select
                        value={editFormData.work_regime || 'REMOTO'}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, work_regime: e.target.value as WorkRegime })
                        }
                        className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[10px] px-3 py-2 text-[13px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                      >
                        <option value="REMOTO">100% Remoto</option>
                        <option value="HIBRIDO">Híbrido</option>
                        <option value="PRESENCIAL">Presencial no Escritório</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--ds-muted)] uppercase mb-1">
                        Data de Admissão / Início
                      </label>
                      <CoyDatePicker
                        value={editFormData.hiring_date || ''}
                        onChange={(val) => setEditFormData({ ...editFormData, hiring_date: val })}
                        placeholder="Selecionar data de início..."
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--ds-muted)] uppercase mb-1">
                        Status do Colaborador
                      </label>
                      <select
                        value={editFormData.member_status || 'ACTIVE'}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, member_status: e.target.value as MemberStatus })
                        }
                        className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[10px] px-3 py-2 text-[13px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                      >
                        <option value="ACTIVE">Ativo / Trabalhando</option>
                        <option value="VACATION">Em Férias</option>
                        <option value="INVITED">Convite Enviado / Pendente</option>
                        <option value="TERMINATED">Desligado / Inativo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--ds-muted)] uppercase mb-1">
                        Remuneração Mensal (R$)
                      </label>
                      <input
                        type="number"
                        value={editFormData.salary_amount ?? ''}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, salary_amount: Number(e.target.value) })
                        }
                        placeholder="Ex: 5000"
                        className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[10px] px-3 py-2 text-[13px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--ds-muted)] uppercase mb-1">
                        Dados de Pagamento / Chave PIX
                      </label>
                      <input
                        type="text"
                        value={editFormData.payment_info || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, payment_info: e.target.value })}
                        placeholder="Chave PIX ou Banco/Agência/Conta"
                        className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[10px] px-3 py-2 text-[13px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11.5px] font-medium text-[var(--ds-muted)] uppercase mb-1">
                        Link do Contrato / Documentos (Google Drive / Nuvem)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={editFormData.contract_document_url || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, contract_document_url: e.target.value })
                          }
                          placeholder="https://drive.google.com/..."
                          className="flex-1 bg-[var(--bg)] border border-[var(--line)] rounded-[10px] px-3 py-2 text-[13px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                        />
                        {editFormData.contract_document_url && (
                          <a
                            href={editFormData.contract_document_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-[10px] text-[var(--fg)] hover:text-[#0066FF] flex items-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Acessar
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: ACESSOS & PERMISSÕES */}
              {activeModalTab === 'acessos' && (
                <div className="flex flex-col gap-6">
                  {/* CREDENCIAIS DE LOGIN: E-MAIL E TROCA DE SENHA PELO ADMIN */}
                  <div className="p-4 rounded-[14px] bg-[var(--surface)] border border-[#0066FF]/40 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-[#0066FF] uppercase tracking-wider flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5" /> Credenciais de Acesso (E-mail &amp; Senha)
                      </span>
                      <span className="text-[11px] font-medium text-[var(--ds-muted)]">
                        Alteração direta pelo administrador
                      </span>
                    </div>

                    {credFeedback && (
                      <div
                        className={`p-2.5 rounded-[10px] text-[12px] font-medium border ${
                          credFeedback.type === 'success'
                            ? 'bg-[#2F9E5A]/10 border-[#2F9E5A]/40 text-[#2F9E5A]'
                            : 'bg-[#ef4444]/10 border-[#ef4444]/40 text-[#ef4444]'
                        }`}
                      >
                        {credFeedback.text}
                      </div>
                    )}

                    <form onSubmit={handleAdminUpdateCredentials} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--ds-muted)] uppercase mb-1">
                          E-mail de Login
                        </label>
                        <input
                          type="email"
                          required
                          value={credEmail}
                          onChange={(e) => setCredEmail(e.target.value)}
                          placeholder="colaborador@coytech.com.br"
                          className="w-full h-[38px] px-3 rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[12.5px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-semibold text-[var(--ds-muted)] uppercase">
                            Nova Senha (opcional)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setCredPassword(generateStrongPassword(10))
                              setShowCredPassword(true)
                            }}
                            className="text-[10.5px] font-semibold text-[#0066FF] hover:underline cursor-pointer"
                          >
                            Gerar senha forte
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showCredPassword ? 'text' : 'password'}
                            value={credPassword}
                            onChange={(e) => setCredPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full h-[38px] pl-3 pr-9 rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[12.5px] font-mono text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCredPassword((v) => !v)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
                          >
                            {showCredPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="sm:col-span-2 flex items-center justify-between gap-3 pt-1">
                        <span className="text-[11px] text-[var(--ds-muted)]">
                          O colaborador também poderá alterar sua própria senha em Configurações.
                        </span>
                        <button
                          type="submit"
                          disabled={isSavingCreds}
                          className="h-[36px] px-4 rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-[#141414] font-semibold text-[12px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>{isSavingCreds ? 'Salvando...' : 'Atualizar E-mail / Senha'}</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* LINK DE ACESSO DO COLABORADOR */}
                  <div className="p-4 rounded-[14px] bg-[#0066FF]/10 border border-[#0066FF]/30 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-[#0066FF] uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" /> Link de Acesso / Convite do Colaborador
                      </span>
                      <span className="text-[11px] font-medium text-[var(--ds-muted)]">
                        Status: <strong className="text-[var(--fg)]">{activeDetailMember.member_status === 'ACTIVE' ? 'Ativo' : 'Pendente / Convidado'}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/login?invited=true&email=${encodeURIComponent(activeDetailMember.email)}`}
                        className="flex-1 h-[38px] px-3 rounded-[8px] bg-[var(--surface)] border border-[var(--line2)] text-[12px] text-[var(--fg)] select-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const link = `${window.location.origin}/login?invited=true&email=${encodeURIComponent(activeDetailMember.email)}`
                          navigator.clipboard.writeText(link)
                          setCopiedLink(true)
                          setTimeout(() => setCopiedLink(false), 2500)
                        }}
                        className="h-[38px] px-3.5 rounded-[8px] bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-[12px] flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Copiado!' : 'Copiar link'}</span>
                      </button>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `Olá ${activeDetailMember.full_name || ''}! Seu acesso ao workspace da Coytech está pronto. Acesse pelo link: ${typeof window !== 'undefined' ? window.location.origin : ''}/login?invited=true&email=${encodeURIComponent(activeDetailMember.email)}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="h-[38px] px-3.5 rounded-[8px] bg-[#25d366] text-black font-semibold text-[12px] hover:opacity-90 flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Seletor Tipo de Acesso (5 Níveis RBAC) */}
                  <div className="p-4 rounded-[14px] bg-[var(--bg)]/50 border border-[var(--line)] flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-bold text-[var(--fg)] uppercase tracking-wider">
                        Nível de Acesso no Workspace
                      </span>
                      <span className="text-[11px] text-[var(--ds-muted)]">
                        {isGuestScopedLevel(editFormData.access_type)
                          ? 'Escopo restrito a telas e projetos autorizados'
                          : 'Acesso global ao workspace Coytech'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {ACCESS_LEVELS_META.map((lvl) => {
                        const isSelected = normalizeAccessType(editFormData.access_type) === lvl.value
                        return (
                          <label
                            key={lvl.value}
                            className={`flex items-start gap-2.5 p-3 rounded-[12px] border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[var(--surface)] shadow-sm text-[var(--fg)]'
                                : 'bg-[var(--surface)]/60 border-[var(--line)] hover:border-[var(--line2)] text-[var(--ds-muted)]'
                            }`}
                            style={
                              isSelected
                                ? {
                                    borderColor: lvl.badgeColor,
                                    backgroundColor: `${lvl.badgeColor}12`,
                                  }
                                : undefined
                            }
                          >
                            <input
                              type="radio"
                              name="access_type_edit"
                              checked={isSelected}
                              onChange={() => setEditFormData({ ...editFormData, access_type: lvl.value })}
                              className="mt-1 accent-[#0066FF]"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-[12.5px] text-[var(--fg)]">
                                  {lvl.label}
                                </span>
                              </div>
                              <span
                                className="inline-block mt-0.5 text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: `${lvl.badgeColor}20`,
                                  color: lvl.badgeColor,
                                }}
                              >
                                {lvl.group === 'CONVIDADO' ? 'Escopo Restrito' : 'Equipe Interna'}
                              </span>
                              <div className="text-[11px] mt-1 text-[var(--ds-muted)] leading-snug">
                                {lvl.description}
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Configurações de Cargo e Setor */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--ds-muted)] uppercase mb-1">
                        Setor do Colaborador
                      </label>
                      <select
                        value={editFormData.sector || 'Geral'}
                        onChange={(e) => {
                          const newSec = e.target.value
                          const newScreens = getScreensForSectorAndRole(newSec, editFormData.job_title || '')
                          setEditFormData({ ...editFormData, sector: newSec, allowed_screens: newScreens })
                        }}
                        className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[10px] px-3 py-2 text-[13px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                      >
                        {SECTORS_LIST.map((sec) => (
                          <option key={sec} value={sec}>
                            {sec}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--ds-muted)] uppercase mb-1">
                        Cargo / Função
                      </label>
                      <input
                        type="text"
                        value={editFormData.job_title || ''}
                        onChange={(e) => {
                          const newJob = e.target.value
                          const newScreens = getScreensForSectorAndRole(editFormData.sector || 'Geral', newJob)
                          setEditFormData({ ...editFormData, job_title: newJob, allowed_screens: newScreens })
                        }}
                        className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[10px] px-3 py-2 text-[13px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                      />
                    </div>
                  </div>

                  {/* Telas Liberadas (para todos os níveis de Convidado) */}
                  {isGuestScopedLevel(editFormData.access_type) && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-[var(--fg)] uppercase tracking-wider">
                          Telas do Sistema Permitidas
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setEditFormData({
                                ...editFormData,
                                allowed_screens: SYSTEM_SCREENS.map((s) => s.key),
                              })
                            }
                            className="text-[11px] text-[#0066FF] hover:underline cursor-pointer"
                          >
                            Marcar Todas
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditFormData({
                                ...editFormData,
                                allowed_screens: getScreensForSectorAndRole(
                                  editFormData.sector || 'Geral',
                                  editFormData.job_title || ''
                                ),
                              })
                            }
                            className="text-[11px] text-[var(--ds-muted)] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" /> Padrão do Cargo
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {SYSTEM_SCREENS.map((screen) => {
                          const IconComp = screen.icon
                          const isAllowed = (editFormData.allowed_screens || []).includes(screen.key)

                          return (
                            <label
                              key={screen.key}
                              className={`flex items-center gap-2.5 p-2.5 rounded-[10px] border cursor-pointer transition-colors ${
                                isAllowed
                                  ? 'bg-[#0066FF]/10 border-[#0066FF]/40 text-[var(--fg)] font-medium'
                                  : 'bg-[var(--bg)]/40 border-[var(--line)] text-[var(--ds-muted)]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isAllowed}
                                onChange={(e) => {
                                  const current = editFormData.allowed_screens || []
                                  if (e.target.checked) {
                                    setEditFormData({
                                      ...editFormData,
                                      allowed_screens: [...current, screen.key],
                                    })
                                  } else {
                                    setEditFormData({
                                      ...editFormData,
                                      allowed_screens: current.filter((k) => k !== screen.key),
                                    })
                                  }
                                }}
                                className="rounded text-[#0066FF]"
                              />
                              <IconComp className="w-4 h-4 shrink-0 text-[#0066FF]" />
                              <span className="text-[12px] truncate">{screen.label}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Projetos e Listas Liberados (para todos os níveis de Convidado) */}
                  {isGuestScopedLevel(editFormData.access_type) && (
                    <div className="flex flex-col gap-3">
                      <span className="text-[12px] font-bold text-[var(--fg)] uppercase tracking-wider">
                        Setores, Projetos & Listas de Tarefas Liberados
                      </span>
                      <p className="text-[11.5px] text-[var(--ds-muted)]">
                        Marque quais pastas ou listas este colaborador tem permissão de visualizar e interagir no painel de Tarefas.
                      </p>

                      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto p-3 bg-[var(--bg)]/40 rounded-[12px] border border-[var(--line)]">
                        {taskFolders.length === 0 ? (
                          <span className="text-[12px] text-[var(--ds-muted)]">
                            Nenhum projeto ou pasta cadastrada no momento.
                          </span>
                        ) : (
                          taskFolders.map((folder) => {
                            const isFolderAllowed = (editFormData.allowed_folder_ids || []).includes(folder.id)
                            const folderLists = taskLists.filter((l) => l.folder_id === folder.id)

                            return (
                              <div key={folder.id} className="flex flex-col gap-1.5 p-2 rounded-[8px] hover:bg-[var(--surface)]">
                                <label className="flex items-center gap-2 font-semibold text-[12.5px] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isFolderAllowed}
                                    onChange={(e) => {
                                      const current = editFormData.allowed_folder_ids || []
                                      if (e.target.checked) {
                                        setEditFormData({
                                          ...editFormData,
                                          allowed_folder_ids: [...current, folder.id],
                                        })
                                      } else {
                                        setEditFormData({
                                          ...editFormData,
                                          allowed_folder_ids: current.filter((id) => id !== folder.id),
                                        })
                                      }
                                    }}
                                  />
                                  <Folder className="w-3.5 h-3.5 text-[#0066FF]" />
                                  <span>{folder.name} (Setor/Pasta Completa)</span>
                                </label>

                                {folderLists.length > 0 && (
                                  <div className="pl-6 flex flex-col gap-1">
                                    {folderLists.map((list) => {
                                      const isListAllowed = (editFormData.allowed_list_ids || []).includes(list.id)
                                      return (
                                        <label
                                          key={list.id}
                                          className="flex items-center gap-2 text-[12px] text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isListAllowed}
                                            onChange={(e) => {
                                              const current = editFormData.allowed_list_ids || []
                                              if (e.target.checked) {
                                                setEditFormData({
                                                  ...editFormData,
                                                  allowed_list_ids: [...current, list.id],
                                                })
                                              } else {
                                                setEditFormData({
                                                  ...editFormData,
                                                  allowed_list_ids: current.filter((id) => id !== list.id),
                                                })
                                              }
                                            }}
                                          />
                                          <List className="w-3 h-3" />
                                          <span>{list.name}</span>
                                        </label>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Matriz Granular de Permissões por Funcionalidade (Ajuste Fino) */}
                  <div className="p-4 rounded-[14px] bg-[var(--bg)]/50 border border-[var(--line)] flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[12px] font-bold text-[var(--fg)] uppercase tracking-wider block">
                          Permissões por Funcionalidade (Ajuste Fino)
                        </span>
                        <span className="text-[11.5px] text-[var(--ds-muted)]">
                          Por padrão, o colaborador herda as regras do nível{' '}
                          <strong>{getAccessLevelMeta(editFormData.access_type).label}</strong>. Você pode conceder ou revogar ações individuais abaixo.
                        </span>
                      </div>
                      {Object.keys(editFormData.custom_permissions || {}).length > 0 && (
                        <button
                          type="button"
                          onClick={() => setEditFormData({ ...editFormData, custom_permissions: {} })}
                          className="text-[11px] font-semibold text-[#0066FF] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" /> Restaurar padrão do nível
                        </button>
                      )}
                    </div>

                    <div className="max-h-[300px] overflow-y-auto pr-1 flex flex-col gap-1.5">
                      {FEATURE_PERMISSION_CATALOG.map((feat) => {
                        const normalizedLvl = normalizeAccessType(editFormData.access_type)
                        const inheritedAllowed =
                          normalizedLvl === 'ADMIN' ||
                          feat.defaultLevels.includes(normalizedLvl)
                        const overrides = editFormData.custom_permissions || {}
                        const hasOverride = Object.prototype.hasOwnProperty.call(overrides, feat.key)
                        const overrideVal = hasOverride ? overrides[feat.key] : undefined
                        const effectiveAllowed =
                          typeof overrideVal === 'boolean' ? overrideVal : inheritedAllowed

                        const setOverride = (mode: 'default' | 'allow' | 'deny') => {
                          const next = { ...(editFormData.custom_permissions || {}) }
                          if (mode === 'default') {
                            delete next[feat.key]
                          } else if (mode === 'allow') {
                            next[feat.key] = true
                          } else {
                            next[feat.key] = false
                          }
                          setEditFormData({ ...editFormData, custom_permissions: next })
                        }

                        return (
                          <div
                            key={feat.key}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2.5 rounded-[10px] border transition-colors ${
                              hasOverride
                                ? 'bg-[var(--surface)] border-[#0066FF]/40'
                                : 'bg-[var(--surface)]/60 border-[var(--line)]'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--bg)] border border-[var(--line)] text-[var(--ds-muted)]">
                                  {feat.module}
                                </span>
                                <span className="text-[12.5px] font-semibold text-[var(--fg)]">
                                  {feat.label}
                                </span>
                                {hasOverride && (
                                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-[#0066FF]/15 text-[#0066FF]">
                                    Personalizado
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[var(--ds-muted)] mt-0.5 leading-snug">
                                {feat.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 bg-[var(--bg)] p-1 rounded-[8px] border border-[var(--line)]">
                              <button
                                type="button"
                                onClick={() => setOverride('default')}
                                className={`px-2 py-1 rounded-[6px] text-[10.5px] font-medium transition-colors cursor-pointer ${
                                  !hasOverride
                                    ? 'bg-[var(--surface)] text-[var(--fg)] shadow-sm border border-[var(--line)]'
                                    : 'text-[var(--ds-muted)] hover:text-[var(--fg)]'
                                }`}
                                title={`Herdar padrão do nível (${inheritedAllowed ? 'Permitido' : 'Bloqueado'})`}
                              >
                                Padrão ({inheritedAllowed ? 'Sim' : 'Não'})
                              </button>
                              <button
                                type="button"
                                onClick={() => setOverride('allow')}
                                className={`px-2 py-1 rounded-[6px] text-[10.5px] font-semibold transition-colors cursor-pointer ${
                                  overrideVal === true
                                    ? 'bg-[#22c55e] text-white'
                                    : effectiveAllowed && !hasOverride
                                    ? 'text-[#22c55e]/70 hover:bg-[#22c55e]/10'
                                    : 'text-[var(--ds-muted)] hover:text-[#22c55e]'
                                }`}
                              >
                                Permitir
                              </button>
                              <button
                                type="button"
                                onClick={() => setOverride('deny')}
                                className={`px-2 py-1 rounded-[6px] text-[10.5px] font-semibold transition-colors cursor-pointer ${
                                  overrideVal === false
                                    ? 'bg-[#ef4444] text-white'
                                    : !effectiveAllowed && !hasOverride
                                    ? 'text-[#ef4444]/70 hover:bg-[#ef4444]/10'
                                    : 'text-[var(--ds-muted)] hover:text-[#ef4444]'
                                }`}
                              >
                                Bloquear
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 4: HISTÓRICO & CHAT DE ANOTAÇÕES DO RH */}
              {activeModalTab === 'historico' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-[14px]">Anotações Confidenciais de RH</h3>
                      <p className="text-[12px] text-[var(--ds-muted)]">
                        Histórico de reuniões de feedback, 1-on-1s, acordos, promoções e ocorrências. Visível apenas para a liderança.
                      </p>
                    </div>
                  </div>

                  {/* Formulário de Envio de Nova Nota */}
                  <form onSubmit={handleAddNote} className="p-3.5 rounded-[12px] bg-[var(--bg)] border border-[var(--line)] flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11.5px] font-semibold text-[var(--ds-muted)] uppercase">
                        Nova Anotação de RH
                      </span>
                      <select
                        value={newNoteCategory}
                        onChange={(e) => setNewNoteCategory(e.target.value)}
                        className="bg-[var(--surface)] border border-[var(--line)] rounded-[8px] px-2 py-1 text-[11.5px] text-[var(--fg)]"
                      >
                        <option value="1-on-1">Reunião 1-on-1</option>
                        <option value="Feedback">Feedback de Desempenho</option>
                        <option value="Contrato">Alteração Contratual / Salário</option>
                        <option value="Férias">Alinhamento de Férias</option>
                        <option value="Ocorrência">Ocorrência / Observação</option>
                      </select>
                    </div>

                    <textarea
                      rows={2}
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Escreva anotações internas sobre o desempenho, alinhamentos ou próximos passos..."
                      className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-[10px] p-2.5 text-[13px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] focus:outline-none focus:border-[#0066FF]"
                    />

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!newNoteContent.trim()}
                        className="px-3.5 py-1.5 rounded-[8px] bg-[#0066FF] text-white font-semibold text-[12px] hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" /> Registrar Anotação
                      </button>
                    </div>
                  </form>

                  {/* Timeline de Anotações */}
                  <div className="flex flex-col gap-3 mt-2">
                    {hrNotes.filter((n) => n.member_id === activeDetailMember.id).length === 0 ? (
                      <div className="p-6 text-center text-[var(--ds-muted)] text-[12.5px] border border-dashed border-[var(--line)] rounded-[12px]">
                        Nenhuma anotação registrada ainda para este colaborador.
                      </div>
                    ) : (
                      hrNotes
                        .filter((n) => n.member_id === activeDetailMember.id)
                        .map((note) => (
                          <div
                            key={note.id}
                            className="p-3.5 rounded-[12px] bg-[var(--bg)]/60 border border-[var(--line)] flex flex-col gap-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[12.5px] text-[var(--fg)]">
                                  {note.author_name}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#0066FF]/15 text-[#0066FF]">
                                  #{note.category}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-[var(--ds-muted)]">{note.created_at}</span>
                                <button
                                  type="button"
                                  onClick={() => deleteHrNote(note.id)}
                                  className="text-[var(--ds-muted)] hover:text-red-400 p-1 cursor-pointer"
                                  title="Excluir anotação"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[13px] text-[var(--fg)] whitespace-pre-wrap">{note.content}</p>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RODAPÉ DO MODAL (AÇÕES) */}
            <div className="flex items-center justify-between p-4 px-6 border-t border-[var(--line)] bg-[var(--bg)]/40">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Tem certeza que deseja remover ${activeDetailMember.full_name || activeDetailMember.email} da equipe?`)) {
                    deleteTeamMember(activeDetailMember.id)
                    setActiveDetailMember(null)
                  }
                }}
                className="text-red-400 hover:text-red-300 text-[12.5px] font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Remover Colaborador
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDetailMember(null)}
                  className="px-4 py-2 rounded-[10px] bg-[var(--bg)] border border-[var(--line)] text-[13px] hover:bg-[var(--ds-hover)] transition-colors cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleSaveMemberUpdates}
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-[10px] bg-[#0066FF] text-white font-semibold text-[13px] hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer shadow-md"
                >
                  {isSavingEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CONVIDAR COLABORADOR EM 3 ETAPAS INTUITIVAS */}
      {/* ===================================================================== */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--line2)] w-full max-w-xl rounded-[20px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* TOPO COM CABEÇALHO */}
            <div className="flex items-center justify-between p-5 px-6 border-b border-[var(--line)]">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#0066FF]" /> Convidar Colaborador
                </h2>
                <p className="text-[12.5px] text-[var(--ds-muted)]">
                  Compartilhar o workspace <strong>{currentOrg.name}</strong> com sua equipe.
                </p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-8 h-8 rounded-full hover:bg-[var(--ds-hover)] grid place-items-center text-[var(--ds-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BARRA DE PROGRESSO EM ETAPAS (STEPPER) */}
            <div className="flex items-center justify-between px-6 py-3 bg-[var(--bg)]/50 border-b border-[var(--line)]">
              <div
                onClick={() => setInviteStep(1)}
                className={`flex items-center gap-2 cursor-pointer transition-colors ${
                  inviteStep === 1 ? 'text-[#0066FF] font-semibold' : 'text-[var(--ds-muted)] hover:text-[var(--fg)]'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    inviteStep === 1
                      ? 'bg-[#0066FF] text-white'
                      : 'bg-[var(--surface)] border border-[var(--line)]'
                  }`}
                >
                  1
                </div>
                <span className="text-[12px]">E-mail & Nível</span>
              </div>

              <div className="w-6 h-[1px] bg-[var(--line)]" />

              <div
                onClick={() => {
                  if (inviteForm.email.trim()) setInviteStep(2)
                }}
                className={`flex items-center gap-2 transition-colors ${
                  inviteStep === 2
                    ? 'text-[#0066FF] font-semibold'
                    : inviteForm.email.trim()
                    ? 'text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer'
                    : 'text-[var(--ds-muted)] opacity-50 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    inviteStep === 2
                      ? 'bg-[#0066FF] text-white'
                      : 'bg-[var(--surface)] border border-[var(--line)]'
                  }`}
                >
                  2
                </div>
                <span className="text-[12px]">Cargo & Setor</span>
              </div>

              <div className="w-6 h-[1px] bg-[var(--line)]" />

              <div
                onClick={() => {
                  if (inviteForm.email.trim() && isGuestScopedLevel(inviteForm.access_type)) setInviteStep(3)
                }}
                className={`flex items-center gap-2 transition-colors ${
                  inviteStep === 3
                    ? 'text-[#0066FF] font-semibold'
                    : inviteForm.email.trim() && isGuestScopedLevel(inviteForm.access_type)
                    ? 'text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer'
                    : 'text-[var(--ds-muted)] opacity-50 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    inviteStep === 3
                      ? 'bg-[#0066FF] text-white'
                      : 'bg-[var(--surface)] border border-[var(--line)]'
                  }`}
                >
                  3
                </div>
                <span className="text-[12px]">Telas Permitidas</span>
              </div>
            </div>

            {/* CORPO DO FORMULÁRIO DIVIDIDO POR ETAPA */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 text-[13px]">
              {/* =================================================================== */}
              {/* ETAPA 1: E-MAIL E NÍVEL DE ACESSO */}
              {/* =================================================================== */}
              {inviteStep === 1 && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                  {inviteError && (
                    <div className="p-3 rounded-[10px] bg-[#ef4444]/10 border border-[#ef4444]/40 text-[#ef4444] text-[12.5px] font-medium">
                      {inviteError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11.5px] font-semibold text-[var(--ds-muted)] uppercase mb-1.5">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        value={inviteForm.full_name}
                        onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
                        placeholder="Ex: João Silva"
                        className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[12px] px-3.5 py-2.5 text-[13.5px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-semibold text-[var(--ds-muted)] uppercase mb-1.5">
                        E-mail de Acesso *
                      </label>
                      <input
                        type="email"
                        required
                        autoFocus
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                        placeholder="nome@coytech.com.br"
                        className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[12px] px-3.5 py-2.5 text-[13.5px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11.5px] font-semibold text-[var(--ds-muted)] uppercase">
                        Definir Senha de Acesso *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setInviteForm({ ...inviteForm, password: generateStrongPassword(10) })
                          setShowInvitePassword(true)
                        }}
                        className="text-[11px] font-semibold text-[#0066FF] hover:underline cursor-pointer"
                      >
                        Gerar senha forte
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showInvitePassword ? 'text' : 'password'}
                        value={inviteForm.password}
                        onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[12px] pl-3.5 pr-10 py-2.5 text-[13.5px] font-mono text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowInvitePassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
                      >
                        {showInvitePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-[11.5px] text-[var(--ds-muted)] bg-[var(--bg)]/60 p-2.5 rounded-[10px] border border-[var(--line)]">
                      <Info className="w-4 h-4 text-[#0066FF] shrink-0" />
                      <span>
                        Com e-mail e senha definidos, o acesso é liberado na hora. Tanto você quanto o colaborador podem trocar a senha depois.
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-[11.5px] font-semibold text-[var(--ds-muted)] uppercase">
                        Escolha o Nível de Acesso
                      </label>
                      <span className="text-[11px] text-[var(--ds-muted)]">
                        {isGuestScopedLevel(inviteForm.access_type)
                          ? 'Escopo de telas e pastas selecionado na etapa 3'
                          : 'Acesso global ao workspace'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {ACCESS_LEVELS_META.map((lvl) => {
                        const isSelected = normalizeAccessType(inviteForm.access_type) === lvl.value
                        return (
                          <label
                            key={lvl.value}
                            className={`flex items-start gap-2.5 p-3 rounded-[14px] border cursor-pointer transition-all ${
                              isSelected
                                ? 'shadow-sm text-[var(--fg)]'
                                : 'bg-[var(--bg)] border-[var(--line)] hover:border-[var(--line2)] text-[var(--ds-muted)]'
                            }`}
                            style={
                              isSelected
                                ? {
                                    borderColor: lvl.badgeColor,
                                    backgroundColor: `${lvl.badgeColor}14`,
                                  }
                                : undefined
                            }
                          >
                            <input
                              type="radio"
                              name="step1_access_type"
                              checked={isSelected}
                              onChange={() => setInviteForm({ ...inviteForm, access_type: lvl.value })}
                              className="mt-1 accent-[#0066FF]"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-[12.5px] text-[var(--fg)]">
                                  {lvl.label}
                                </span>
                                <span
                                  className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: `${lvl.badgeColor}20`,
                                    color: lvl.badgeColor,
                                  }}
                                >
                                  {lvl.group === 'CONVIDADO' ? 'Convidado' : 'Equipe'}
                                </span>
                              </div>
                              <div className="text-[11px] mt-0.5 text-[var(--ds-muted)] leading-snug">
                                {lvl.description}
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================================== */}
              {/* ETAPA 2: CARGO E SETOR (Altera telas automaticamente) */}
              {/* =================================================================== */}
              {inviteStep === 2 && (
                <div className="flex flex-col gap-5 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[var(--ds-muted)] uppercase mb-1.5">
                      Selecione o Setor da Empresa
                    </label>
                    <select
                      value={inviteForm.sector}
                      onChange={(e) => handleSectorChange(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[12px] px-3.5 py-2.5 text-[13.5px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                    >
                      {SECTORS_LIST.map((sec) => (
                        <option key={sec} value={sec}>
                          {sec}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-semibold text-[var(--ds-muted)] uppercase mb-1.5">
                      Cargo / Função no Time
                    </label>

                    {/* Chips de Sugestões de Cargos para o Setor Escolhido */}
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {(SECTOR_CONFIG[inviteForm.sector]?.roles || []).map((suggestedRole) => (
                        <button
                          key={suggestedRole}
                          type="button"
                          onClick={() => handleJobTitleChange(suggestedRole)}
                          className={`text-[11.5px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                            inviteForm.job_title === suggestedRole
                              ? 'bg-[#0066FF] text-white font-semibold border-[#0066FF]'
                              : 'bg-[var(--bg)] border-[var(--line)] text-[var(--ds-muted)] hover:text-[var(--fg)]'
                          }`}
                        >
                          {suggestedRole}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={inviteForm.job_title}
                      onChange={(e) => handleJobTitleChange(e.target.value)}
                      placeholder="Ex: Designer Gráfico, Dev Fullstack, CS"
                      className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[12px] px-3.5 py-2.5 text-[13.5px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>

                  {/* BOX INFORMATIVO DE TELAS ATRIBUÍDAS PELO CARGO */}
                  <div className="p-3.5 rounded-[14px] bg-[var(--bg)]/70 border border-[#0066FF]/30 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--fg)]">
                      <Sparkles className="w-4 h-4 text-[#0066FF]" />
                      <span>Telas sugeridas para {inviteForm.job_title}:</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {inviteForm.allowed_screens.map((screenKey) => {
                        const screenObj = SYSTEM_SCREENS.find((s) => s.key === screenKey)
                        return (
                          <span
                            key={screenKey}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-[6px] bg-[var(--surface)] text-[var(--fg)] border border-[var(--line)]"
                          >
                            {screenObj ? screenObj.label : screenKey}
                          </span>
                        )
                      })}
                    </div>

                    {!isGuestScopedLevel(inviteForm.access_type) ? (
                      <p className="text-[11px] text-[#5cd3a8] mt-1">
                        Como você selecionou <strong>{getAccessLevelMeta(inviteForm.access_type).label}</strong>, este colaborador terá acesso global ao workspace.
                      </p>
                    ) : (
                      <p className="text-[11px] text-[var(--ds-muted)] mt-1">
                        Na próxima etapa você poderá personalizar telas, pastas autorizadas e permissões de{' '}
                        <strong>{getAccessLevelMeta(inviteForm.access_type).label}</strong>.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* =================================================================== */}
              {/* ETAPA 3: TELAS E PROJETOS PERMITIDOS (Ajuste fino para Convidados) */}
              {/* =================================================================== */}
              {inviteStep === 3 && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[12px] font-bold text-[var(--fg)] uppercase tracking-wider block">
                        Telas Permitidas
                      </span>
                      <span className="text-[11.5px] text-[var(--ds-muted)]">
                        Pré-configuradas para o cargo <strong>{inviteForm.job_title}</strong>:
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setInviteForm({
                            ...inviteForm,
                            allowed_screens: SYSTEM_SCREENS.map((s) => s.key),
                          })
                        }
                        className="text-[11px] text-[#0066FF] hover:underline cursor-pointer"
                      >
                        Marcar Todas
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() =>
                          setInviteForm({
                            ...inviteForm,
                            allowed_screens: getScreensForSectorAndRole(inviteForm.sector, inviteForm.job_title),
                          })
                        }
                        className="text-[11px] text-[var(--ds-muted)] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Padrão do Cargo
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {SYSTEM_SCREENS.map((s) => {
                      const IconComp = s.icon
                      const checked = inviteForm.allowed_screens.includes(s.key)
                      return (
                        <label
                          key={s.key}
                          className={`flex items-center gap-2.5 p-2 rounded-[10px] border text-[12px] cursor-pointer transition-colors ${
                            checked
                              ? 'bg-[#0066FF]/10 border-[#0066FF]/40 text-[var(--fg)] font-medium'
                              : 'bg-[var(--bg)]/40 border-[var(--line)] text-[var(--ds-muted)]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setInviteForm({
                                  ...inviteForm,
                                  allowed_screens: [...inviteForm.allowed_screens, s.key],
                                })
                              } else {
                                setInviteForm({
                                  ...inviteForm,
                                  allowed_screens: inviteForm.allowed_screens.filter((k) => k !== s.key),
                                })
                              }
                            }}
                          />
                          <IconComp className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
                          <span className="truncate">{s.label}</span>
                        </label>
                      )
                    })}
                  </div>

                  {/* Pastas e Projetos de Tarefas */}
                  {taskFolders.length > 0 && (
                    <div className="pt-2 border-t border-[var(--line)] flex flex-col gap-2">
                      <span className="text-[11.5px] font-semibold text-[var(--ds-muted)] uppercase">
                        Pastas e Projetos Liberados no Módulo de Tarefas
                      </span>

                      <div className="max-h-[140px] overflow-y-auto p-2 rounded-[10px] bg-[var(--bg)] border border-[var(--line)] flex flex-col gap-1.5">
                        {taskFolders.map((folder) => {
                          const isFolderChecked = inviteForm.allowed_folder_ids.includes(folder.id)
                          return (
                            <label
                              key={folder.id}
                              className="flex items-center gap-2 text-[12px] text-[var(--fg)] hover:text-[#0066FF] cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isFolderChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setInviteForm({
                                      ...inviteForm,
                                      allowed_folder_ids: [...inviteForm.allowed_folder_ids, folder.id],
                                    })
                                  } else {
                                    setInviteForm({
                                      ...inviteForm,
                                      allowed_folder_ids: inviteForm.allowed_folder_ids.filter((id) => id !== folder.id),
                                    })
                                  }
                                }}
                              />
                              <Folder className="w-3 h-3 text-[#0066FF]" />
                              <span>{folder.name}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ETAPA 4: RESULTADO DO CONVITE & LINK DIRETO */}
              {inviteStep === 4 && inviteResult && (
                <div className="p-6 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-14 h-14 rounded-full bg-[#2f9e5a]/15 text-[#2f9e5a] flex items-center justify-center">
                    <Check className="w-7 h-7" strokeWidth={2.6} />
                  </div>

                  <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-bold text-[var(--fg)]">
                      Acesso Criado com Sucesso!
                    </h3>
                    <p className="text-[13px] text-[var(--ds-muted)] max-w-md">
                      O acesso para <strong className="text-[var(--fg)]">{inviteResult.email}</strong> foi configurado no workspace <strong>{currentOrg.name}</strong>.
                    </p>
                  </div>

                  {/* CREDENCIAIS DEFINIDAS (E-MAIL E SENHA) */}
                  {inviteResult.password && (
                    <div className="w-full text-left p-4 rounded-[14px] bg-[var(--bg)] border border-[#0066FF]/40 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11.5px] font-bold text-[#0066FF] uppercase tracking-wider flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5" /> Credenciais de Acesso Imediato
                        </span>
                        <span className="text-[11px] font-medium text-[#2F9E5A]">Conta Ativa</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[12px]">
                        <div className="p-2.5 rounded-[8px] bg-[var(--surface)] border border-[var(--line)]">
                          <span className="text-[10.5px] text-[var(--ds-muted)] block">E-mail:</span>
                          <span className="font-mono font-semibold text-[var(--fg)] select-all">{inviteResult.email}</span>
                        </div>
                        <div className="p-2.5 rounded-[8px] bg-[var(--surface)] border border-[var(--line)]">
                          <span className="text-[10.5px] text-[var(--ds-muted)] block">Senha:</span>
                          <span className="font-mono font-semibold text-[var(--fg)] select-all">{inviteResult.password}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const text = `Acesso CoyDash (${currentOrg.name})\nLink: ${window.location.origin}/login?email=${encodeURIComponent(inviteResult.email)}\nE-mail: ${inviteResult.email}\nSenha: ${inviteResult.password}`
                          navigator.clipboard.writeText(text)
                          setCopiedLink(true)
                          setTimeout(() => setCopiedLink(false), 2500)
                        }}
                        className="w-full h-[38px] rounded-[10px] bg-[#0066FF] hover:bg-[#0052CC] text-[#141414] font-semibold text-[12.5px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedLink ? 'Credenciais Copiadas!' : 'Copiar E-mail, Senha e Link'}</span>
                      </button>
                    </div>
                  )}

                  {/* STATUS DO E-MAIL */}
                  <div className="w-full text-left p-3.5 rounded-[12px] bg-[var(--bg)] border border-[var(--line2)] text-[12px] flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 font-semibold">
                      {inviteResult.passwordSet ? (
                        <span className="text-[#2f9e5a] flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> Login e senha prontos para uso imediato
                        </span>
                      ) : inviteResult.alreadyRegistered ? (
                        <span className="text-[#3b82f6] flex items-center gap-1.5">
                          <Info className="w-4 h-4" /> Usuário já possui conta no sistema
                        </span>
                      ) : inviteResult.emailSent ? (
                        <span className="text-[#2f9e5a] flex items-center gap-1.5">
                          <Mail className="w-4 h-4" /> E-mail de convite enviado via Supabase
                        </span>
                      ) : (
                        <span className="text-[#e8c14a] flex items-center gap-1.5">
                          <Info className="w-4 h-4" /> Compartilhe o link direto abaixo
                        </span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-[var(--ds-muted)] leading-relaxed">
                      {inviteResult.passwordSet
                        ? 'O colaborador já pode acessar em /login com o e-mail e senha definidos acima. Ele poderá alterar a senha depois em Configurações.'
                        : 'Caso o e-mail atrase, utilize o link de acesso rápido abaixo para liberar o acesso imediatamente.'}
                    </p>
                  </div>

                  {/* LINK DIRETO DE ACESSO */}
                  <div className="w-full flex flex-col gap-2 text-left">
                    <label className="text-[11.5px] font-semibold uppercase text-[var(--ds-muted)]">
                      Link Direto de Login
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={inviteResult.inviteLink}
                        className="flex-1 h-[42px] px-3 rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[12px] text-[var(--fg)] select-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(inviteResult.inviteLink)
                          setCopiedLink(true)
                          setTimeout(() => setCopiedLink(false), 2500)
                        }}
                        className="h-[42px] px-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line2)] hover:border-[#0066FF] text-[var(--fg)] font-semibold text-[12.5px] flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copiar Link</span>
                      </button>
                    </div>
                  </div>

                  {/* COMPARTILHAMENTO WHATSAPP */}
                  <div className="w-full flex items-center justify-between p-3 rounded-[12px] bg-[#25d366]/10 border border-[#25d366]/20">
                    <div className="flex items-center gap-2.5 text-[12px]">
                      <MessageSquare className="w-4 h-4 text-[#25d366]" />
                      <span className="text-[var(--fg)] font-medium">Enviar acesso no WhatsApp</span>
                    </div>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        inviteResult.password
                          ? `Olá! Seu acesso ao workspace da Coytech (${inviteForm.job_title}) foi liberado.\nLink: ${typeof window !== 'undefined' ? window.location.origin : ''}/login?email=${encodeURIComponent(inviteResult.email)}\nE-mail: ${inviteResult.email}\nSenha: ${inviteResult.password}`
                          : `Olá! Você foi convidado para o workspace da Coytech no cargo de ${inviteForm.job_title}. Acesse seu painel pelo link: ${inviteResult.inviteLink}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-[8px] bg-[#25d366] text-black font-semibold text-[11.5px] hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Enviar no WhatsApp</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* RODAPÉ DO MODAL COM BOTÕES DE NAVEGAÇÃO ENTRE ETAPAS */}
            <div className="flex items-center justify-between p-4 px-6 border-t border-[var(--line)] bg-[var(--bg)]/40">
              {inviteStep === 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false)
                    setInviteStep(1)
                    setInviteResult(null)
                  }}
                  className="w-full h-[42px] rounded-[10px] bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-[13px] transition-colors cursor-pointer"
                >
                  Concluir & Fechar
                </button>
              ) : (
                <>
                  {inviteStep === 1 ? (
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="px-4 py-2 rounded-[10px] bg-[var(--bg)] border border-[var(--line)] text-[13px] hover:bg-[var(--ds-hover)] transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSendingInvite}
                      onClick={() => setInviteStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2) : 1))}
                      className="px-4 py-2 rounded-[10px] bg-[var(--bg)] border border-[var(--line)] text-[13px] hover:bg-[var(--ds-hover)] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" /> Voltar
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    {inviteStep === 1 && (
                      <button
                        type="button"
                        disabled={!inviteForm.email.trim()}
                        onClick={() => setInviteStep(2)}
                        className="px-5 py-2 rounded-[10px] bg-[#0066FF] text-white font-semibold text-[13px] hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <span>Próximo: Cargo & Setor</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}

                    {inviteStep === 2 && (
                      <>
                        {!isGuestScopedLevel(inviteForm.access_type) ? (
                          <button
                            type="button"
                            disabled={isSendingInvite}
                            onClick={handleSendInvite}
                            className="px-5 py-2 rounded-[10px] bg-[#0066FF] text-white font-semibold text-[13px] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>
                              {isSendingInvite
                                ? 'Criando acesso...'
                                : `Criar Acesso (${getAccessLevelMeta(inviteForm.access_type).shortLabel})`}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setInviteStep(3)}
                            className="px-5 py-2 rounded-[10px] bg-[#0066FF] text-white font-semibold text-[13px] hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <span>Próximo: Telas Permitidas</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}

                    {inviteStep === 3 && (
                      <button
                        type="button"
                        disabled={isSendingInvite}
                        onClick={handleSendInvite}
                        className="px-5 py-2 rounded-[10px] bg-[#0066FF] text-white font-semibold text-[13px] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSendingInvite ? 'Enviando convite...' : 'Enviar Convite'}</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
