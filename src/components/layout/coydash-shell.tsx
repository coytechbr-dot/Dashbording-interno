'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Users,
  UserCheck,
  MessageSquare,
  CheckSquare,
  Bot,
  Megaphone,
  Target,
  Wallet,
  Settings,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
  ArrowUpRight,
  LogOut,
  Plus,
  Folder,
  Briefcase,
  Scale,
  DollarSign,
  Code,
  Headphones,
  List,
  FileText,
  Rocket,
  Shield,
  Pencil,
  Trash2,
  Activity,
  Compass,
  Smartphone,
} from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'
import { signOutAction } from '@/app/actions/auth'
import { hasFeaturePermission, isGuestScopedLevel } from '@/lib/access-control'
import {
  IllustrationNpcMascot,
  IconRobot16,
  IconArrowUpRight10,
} from './roomie-illustrations'

const MAIN_NAV_ITEMS = [
  { icon: Home, label: 'Início', path: '/', screenKey: 'inicio' },
  { icon: Briefcase, label: 'Comercial', path: '/comercial', screenKey: 'comercial' },
  { icon: Users, label: 'Clientes', path: '/clientes', screenKey: 'clientes' },
  { icon: MessageSquare, label: 'Atendimento', path: '/atendimento', screenKey: 'atendimento' },
  { icon: CheckSquare, label: 'Tarefas', path: '/tarefas', screenKey: 'tarefas' },
  { icon: Bot, label: 'Agentes IA', path: '/agentes', screenKey: 'agentes' },
  { icon: Megaphone, label: 'Marketing', path: '/marketing', screenKey: 'marketing' },
  { icon: UserCheck, label: 'Membros e Colaboradores', path: '/colaboradores', screenKey: 'colaboradores' },
  { icon: Wallet, label: 'Financeiro', path: '/financeiro', screenKey: 'financeiro' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes', screenKey: 'configuracoes' },
]

const EXTRA_NAV_ITEMS = [
  { icon: CheckSquare, label: 'Filas 1-Clique', path: '/studio', screenKey: 'studio' },
  { icon: Activity, label: 'Saúde & Alertas', path: '/pulse', screenKey: 'pulse' },
  { icon: Compass, label: 'Jornada do Cliente', path: '/governanca', screenKey: 'governanca' },
  { icon: Smartphone, label: 'Visão Mobile CEO', path: '/executivo', screenKey: 'executivo' },
]

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Folder,
  Briefcase,
  Scale,
  Megaphone,
  DollarSign,
  Code,
  Headphones,
  List,
  FileText,
  Target,
  Rocket,
  Shield,
}

const FOLDER_ICONS = [
  { key: 'Folder', label: 'Geral' },
  { key: 'Briefcase', label: 'Comercial' },
  { key: 'Scale', label: 'Jurídico' },
  { key: 'Megaphone', label: 'Marketing' },
  { key: 'Target', label: 'Tráfego' },
  { key: 'DollarSign', label: 'Financeiro' },
  { key: 'Code', label: 'Tecnologia' },
  { key: 'Headphones', label: 'Suporte / CS' },
]

const LIST_ICONS = [
  { key: 'List', label: 'Lista' },
  { key: 'FileText', label: 'Demandas' },
  { key: 'Target', label: 'Campanha' },
  { key: 'Rocket', label: 'Onboarding' },
  { key: 'Shield', label: 'Auditoria' },
  { key: 'Briefcase', label: 'Projeto' },
]

export function CoyDashShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const {
    authenticatedUser,
    searchQuery,
    setSearchQuery,
    organizations,
    currentOrg,
    setCurrentOrgId,
    createNewOrganization,
    personas,
    currentPersona,
    setCurrentPersonaId,
    agents,
    activeAgentDrawer,
    setActiveAgentDrawer,
    incidents,
    approvalQueues,
    sendTaskToAgent,
    clients,
    whatsappConversations,
    tasks,
    deals,
    taskFolders,
    taskLists,
    createTaskFolder,
    updateTaskFolder,
    deleteTaskFolder,
    createTaskList,
    updateTaskList,
    deleteTaskList,
    currentUserPermissions,
  } = useCoyDash()

  const isGuest = isGuestScopedLevel(currentUserPermissions?.access_type)
  const canManageStructure = hasFeaturePermission(
    {
      userId: authenticatedUser?.id,
      email: authenticatedUser?.email,
      role: currentUserPermissions?.role || authenticatedUser?.role,
      access_type: currentUserPermissions?.access_type,
      custom_permissions: currentUserPermissions?.custom_permissions,
    },
    'tasks.manage_structure'
  )
  const allowedScreens = currentUserPermissions?.allowed_screens || []

  const canAccessScreen = (screenKey?: string) => {
    if (!isGuest || !screenKey) return true
    // Tarefas e planejamento estratégico são liberados para todos os convidados com acesso
    if (screenKey === 'tarefas') return true
    if (allowedScreens.length === 0) return true
    return allowedScreens.includes(screenKey)
  }

  const visibleMainNavItems = MAIN_NAV_ITEMS.filter((item) => canAccessScreen(item.screenKey))
  const visibleExtraNavItems = EXTRA_NAV_ITEMS.filter((item) => canAccessScreen(item.screenKey))

  const visibleTaskFolders = taskFolders.filter((f) => {
    if (!isGuest) return true
    // O Planejamento Estratégico é sempre visível para todos os convidados com acesso à operação
    if (f.name.toLowerCase().includes('planejamento estratégico')) return true
    if (!currentUserPermissions?.allowed_folder_ids || currentUserPermissions.allowed_folder_ids.length === 0) return true
    return currentUserPermissions.allowed_folder_ids.includes(f.id)
  })

  const visibleTaskLists = taskLists.filter((l) => {
    if (!isGuest) return true
    const parentFolder = taskFolders.find((f) => f.id === l.folder_id)
    if (parentFolder?.name.toLowerCase().includes('planejamento estratégico')) return true
    if (!currentUserPermissions?.allowed_list_ids || currentUserPermissions.allowed_list_ids.length === 0) return true
    return currentUserPermissions.allowed_list_ids.includes(l.id)
  })

  const [isDark, setIsDark] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dash-sidebar-collapsed')
      if (saved !== null) {
        setSidebarCollapsed(saved === 'true')
      }
    } catch (e) {}
  }, [])

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('dash-sidebar-collapsed', String(next))
      } catch (e) {}
      return next
    })
  }
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false)
  const [showNewOrgModal, setShowNewOrgModal] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgSector, setNewOrgSector] = useState('Agência / Operações B2B')
  const [newOrgTier, setNewOrgTier] = useState<'MID_MARKET' | 'ENTERPRISE'>('MID_MARKET')
  const [newOrgHourlyRev, setNewOrgHourlyRev] = useState('0')

  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false)
  const [agentInput, setAgentInput] = useState('')
  const [agentMessages, setAgentMessages] = useState<
    Record<string, { sender: 'agent' | 'user'; text: string; time: string }[]>
  >({})

  // Expansão de Setores & Projetos (ROOMIE OFFICE AI)
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({})
  const [showExtraNav, setShowExtraNav] = useState(false)

  // Modal Criar / Editar Setor (Folder)
  const [folderModal, setFolderModal] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    folderId?: string
    name: string
    icon: string
  }>({ open: false, mode: 'create', name: '', icon: 'Folder' })

  // Modal Criar / Editar Projeto/Lista (List)
  const [listModal, setListModal] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    folderId: string
    listId?: string
    name: string
    icon: string
  }>({ open: false, mode: 'create', folderId: '', name: '', icon: 'List' })
  const [isSavingTaskItem, setIsSavingTaskItem] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('dash-theme') || 'dark'
    setIsDark(saved === 'dark')
  }, [])

  // Abrir todos os setores por padrão quando carregarem
  useEffect(() => {
    if (taskFolders.length > 0) {
      setOpenFolders((prev) => {
        const next = { ...prev }
        taskFolders.forEach((f) => {
          if (next[f.id] === undefined) next[f.id] = true
        })
        return next
      })
    }
  }, [taskFolders])

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    localStorage.setItem('dash-theme', nextTheme)
    if (nextTheme === 'light') {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }

  // Rotas de autenticação renderizam em tela cheia sem sidebar/header
  const authRoutes = ['/login', '/cadastro', '/recuperar-senha', '/atualizar-senha']
  if (authRoutes.some((r) => pathname.startsWith(r))) {
    return <>{children}</>
  }

  const pendingApprovalsCount = approvalQueues.filter((q) => q.status === 'PENDING').length
  const openIncidentsCount = incidents.filter((i) => i.status !== 'RESOLVED').length
  const humanHandoffCount = whatsappConversations.filter((w) => w.handoff_to_human).length
  const openTasksCount = tasks.filter(
    (t) => !t.status_key.toUpperCase().includes('CONCLU') && t.status_key !== 'DONE'
  ).length

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgName.trim()) return
    await createNewOrganization({
      name: newOrgName.trim(),
      sector: newOrgSector.trim() || 'Operações B2B',
      tier: newOrgTier,
      hourlyRevenue: Number(newOrgHourlyRev) || 0,
    })
    setNewOrgName('')
    setShowNewOrgModal(false)
    setOrgDropdownOpen(false)
  }

  const handleSaveFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSavingTaskItem) return
    const name = folderModal.name.trim()
    if (!name) return

    // Previne criação de pasta com mesmo nome duplicado
    if (folderModal.mode === 'create') {
      const existing = taskFolders.find((f) => f.name.toLowerCase() === name.toLowerCase())
      if (existing) {
        setFolderModal({ open: false, mode: 'create', name: '', icon: 'Folder' })
        return
      }
    }

    setIsSavingTaskItem(true)
    try {
      if (folderModal.mode === 'create') {
        await createTaskFolder(name, folderModal.icon)
      } else if (folderModal.folderId) {
        await updateTaskFolder(folderModal.folderId, name, folderModal.icon)
      }
    } catch (err) {
      console.error('Erro ao salvar pasta/setor:', err)
    } finally {
      setIsSavingTaskItem(false)
      setFolderModal({ open: false, mode: 'create', name: '', icon: 'Folder' })
    }
  }

  const handleSaveList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSavingTaskItem) return
    const name = listModal.name.trim()
    const folderId = listModal.folderId
    if (!name || !folderId) return

    // Previne criação de lista com mesmo nome duplicado na mesma pasta
    if (listModal.mode === 'create') {
      const existing = taskLists.find(
        (l) => l.folder_id === folderId && l.name.toLowerCase() === name.toLowerCase()
      )
      if (existing) {
        setListModal({ open: false, mode: 'create', folderId: '', name: '', icon: 'List' })
        router.push(`/listas/${existing.id}`)
        return
      }
    }

    setIsSavingTaskItem(true)
    try {
      if (listModal.mode === 'create') {
        const newId = await createTaskList(folderId, name, listModal.icon)
        setListModal({ open: false, mode: 'create', folderId: '', name: '', icon: 'List' })
        if (newId) {
          router.push(`/listas/${newId}`)
        }
      } else if (listModal.listId) {
        await updateTaskList(listModal.listId, name, listModal.icon)
        setListModal({ open: false, mode: 'create', folderId: '', name: '', icon: 'List' })
      }
    } catch (err) {
      console.error('Erro ao salvar lista/projeto:', err)
      setListModal({ open: false, mode: 'create', folderId: '', name: '', icon: 'List' })
    } finally {
      setIsSavingTaskItem(false)
    }
  }

  const handleSendAgentMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeAgentDrawer || !agentInput.trim()) return
    const text = agentInput.trim()
    setAgentInput('')

    const agentId = activeAgentDrawer.id
    const currentList = agentMessages[agentId] || []

    setAgentMessages({
      ...agentMessages,
      [agentId]: [
        ...currentList,
        { sender: 'user', text, time: 'Agora' },
        {
          sender: 'agent',
          text: `Tarefa registrada e executada no banco via ${activeAgentDrawer.modelRouted}: "${text}".`,
          time: 'Agora',
        },
      ],
    })

    await sendTaskToAgent(agentId, text)
  }

  const displayUserName = authenticatedUser?.name || currentPersona.name
  const initials = displayUserName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex h-screen bg-[var(--bg)] text-[var(--fg)] overflow-hidden select-none">
      {/* SIDEBAR DESKTOP */}
      <aside
        className={`hidden md:flex shrink-0 flex-col border-r border-[var(--line)] bg-[var(--bg)] pt-[18px] pb-[14px] transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'w-[74px] px-[8px]' : 'w-[280px] px-[14px]'
        }`}
      >
        {/* Topo da Sidebar: Logo + Minimizar / Expandir */}
        {!sidebarCollapsed ? (
          <div className="px-[6px] mb-[16px] flex items-center justify-between">
            <div className="flex items-center gap-[8px]">
              <Link
                href="/"
                className="text-[24px] font-bold tracking-[-0.5px] text-[#0066FF] leading-none hover:opacity-90 transition-opacity"
              >
                coydash
              </Link>
              <span className="flex items-center gap-[4px] bg-[var(--surface)] border border-[var(--line2)] rounded-[6px] px-[6px] py-[1.5px] text-[10px] text-[var(--ds-muted)]">
                <span className="w-[5px] h-[5px] rounded-full bg-[#2f9e5a]" />
                v2.0
              </span>
            </div>

            <button
              type="button"
              onClick={toggleSidebar}
              className="w-[30px] h-[30px] rounded-[8px] hover:bg-[var(--surface)] border border-transparent hover:border-[var(--line2)] grid place-items-center text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer transition-colors"
              title="Minimizar barra lateral"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="mb-[16px] flex flex-col items-center gap-[8px]">
            <Link
              href="/"
              className="w-[36px] h-[36px] rounded-[10px] bg-[#0066FF] text-white font-extrabold text-[15px] grid place-items-center shadow-sm hover:opacity-90 transition-opacity"
              title="coydash v2.0"
            >
              cd
            </Link>
            <button
              type="button"
              onClick={toggleSidebar}
              className="w-[30px] h-[30px] rounded-[8px] hover:bg-[var(--surface)] border border-transparent hover:border-[var(--line2)] grid place-items-center text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer transition-colors"
              title="Expandir barra lateral"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Seletor de Organização Cliente B2B (Multi-Tenant) */}
        {!sidebarCollapsed ? (
          <div className="relative mb-[12px]">
            <div className="flex items-center justify-between px-[10px] mb-[3px]">
              <span className="text-[10.5px] text-[var(--ds-muted)]">Workspace ativo</span>
              {isGuest ? (
                <span className="text-[9.5px] font-semibold px-[6px] py-[1px] rounded-[4px] bg-[#e8c14a]/15 text-[#e8c14a] border border-[#e8c14a]/30">
                  Convidado
                </span>
              ) : (
                <span className="text-[9.5px] font-semibold px-[6px] py-[1px] rounded-[4px] bg-[#5cd3a8]/15 text-[#5cd3a8] border border-[#5cd3a8]/30">
                  Membro Full
                </span>
              )}
            </div>
            <button
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="w-full flex items-center justify-between px-[12px] h-[36px] bg-[var(--surface)] hover:bg-[var(--ds-hover)] rounded-[10px] text-[12.5px] font-medium transition-colors cursor-pointer"
            >
              <span className="truncate">{currentOrg.name}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[var(--ds-muted)] shrink-0 transition-transform ${
                  orgDropdownOpen ? 'rotate-180' : ''
                }`}
                strokeWidth={1.4}
              />
            </button>

            {orgDropdownOpen && (
              <div className="absolute left-0 right-0 top-[58px] bg-[var(--surface)] border border-[var(--line2)] rounded-[10px] overflow-hidden shadow-xl z-50">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      setCurrentOrgId(org.id)
                      setOrgDropdownOpen(false)
                    }}
                    className={`w-full flex flex-col px-[12px] py-[8px] text-left hover:bg-[var(--ds-hover)] transition-colors border-b border-[var(--line)] cursor-pointer ${
                      org.id === currentOrg.id
                        ? 'text-[#0066FF] font-semibold'
                        : 'text-[var(--fg)]'
                    }`}
                  >
                    <span className="text-[12.5px] truncate">{org.name}</span>
                    <span className="text-[10.5px] text-[var(--ds-muted)]">
                      {org.tier === 'ENTERPRISE' ? 'Grande Porte' : 'Médio Porte'} · {org.sector}
                    </span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setShowNewOrgModal(true)
                    setOrgDropdownOpen(false)
                  }}
                  className="w-full flex items-center gap-[8px] px-[12px] py-[10px] text-left text-[12px] font-medium text-[#0066FF] hover:bg-[var(--ds-hover)] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>Nova organização</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="relative mb-[12px] flex justify-center">
            <button
              type="button"
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              title={`Operação ativa: ${currentOrg.name}`}
              className="w-[42px] h-[36px] rounded-[10px] bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] grid place-items-center text-[12px] font-bold text-[#0066FF] cursor-pointer transition-colors"
            >
              {currentOrg.name.slice(0, 2).toUpperCase()}
            </button>

            {orgDropdownOpen && (
              <div className="absolute left-[48px] top-0 w-[240px] bg-[var(--surface)] border border-[var(--line2)] rounded-[10px] overflow-hidden shadow-2xl z-50">
                <div className="px-[12px] py-[8px] border-b border-[var(--line)] text-[11px] text-[var(--ds-muted)] font-semibold uppercase">
                  Trocar operação
                </div>
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      setCurrentOrgId(org.id)
                      setOrgDropdownOpen(false)
                    }}
                    className={`w-full flex flex-col px-[12px] py-[8px] text-left hover:bg-[var(--ds-hover)] transition-colors border-b border-[var(--line)] cursor-pointer ${
                      org.id === currentOrg.id
                        ? 'text-[#0066FF] font-semibold'
                        : 'text-[var(--fg)]'
                    }`}
                  >
                    <span className="text-[12.5px] truncate">{org.name}</span>
                    <span className="text-[10px] text-[var(--ds-muted)]">
                      {org.tier === 'ENTERPRISE' ? 'Grande Porte' : 'Médio Porte'} · {org.sector}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ÁREA ROLÁVEL DA SIDEBAR: MENU PRINCIPAL + SETORES & PROJETOS */}
        <div className="flex-1 overflow-y-auto pr-[2px] flex flex-col gap-[14px]">
          {/* Navegação Principal Intuitiva */}
          <nav className="flex flex-col gap-[2px] text-[12.5px]">
            {visibleMainNavItems.map(({ icon: Icon, label, path }) => {
              const active = isActive(path)
              return (
                <Link
                  key={path}
                  href={path}
                  title={label}
                  className={`relative flex items-center ${
                    sidebarCollapsed
                      ? 'justify-center w-[44px] h-[40px] mx-auto rounded-[10px]'
                      : 'justify-between px-[12px] py-[8.5px] rounded-[10px]'
                  } transition-colors ${
                    active
                      ? 'bg-[var(--surface)] text-[var(--fg)] font-semibold'
                      : 'text-[var(--ds-muted)] hover:bg-[var(--ds-hover)] hover:text-[var(--fg)]'
                  }`}
                >
                  <span className="flex items-center gap-[10px] truncate">
                    <Icon
                      className={`w-[16px] h-[16px] shrink-0 ${active ? 'text-[#0066FF]' : ''}`}
                      strokeWidth={1.5}
                    />
                    {!sidebarCollapsed && <span className="truncate">{label}</span>}
                  </span>

                  {!sidebarCollapsed && path === '/comercial' && deals.length > 0 && (
                    <span className="bg-[var(--bg)] border border-[var(--line2)] rounded-[6px] px-[6px] py-[1px] text-[10.5px] text-[var(--fg)] font-medium">
                      {deals.length}
                    </span>
                  )}

                  {!sidebarCollapsed && path === '/clientes' && clients.length > 0 && (
                    <span className="bg-[var(--bg)] border border-[var(--line2)] rounded-[6px] px-[6px] py-[1px] text-[10.5px] text-[var(--fg)] font-medium">
                      {clients.length}
                    </span>
                  )}

                  {!sidebarCollapsed && path === '/atendimento' && humanHandoffCount > 0 && (
                    <span className="flex items-center gap-[4px] bg-[#0066FF]/15 border border-[#0066FF]/40 rounded-[6px] px-[6px] py-[1px] text-[10px] font-semibold text-[#0066FF]">
                      {humanHandoffCount} novo
                    </span>
                  )}

                  {!sidebarCollapsed && path === '/tarefas' && openTasksCount > 0 && (
                    <span className="bg-[var(--bg)] border border-[var(--line2)] rounded-[6px] px-[6px] py-[1px] text-[10.5px] text-[var(--fg)] font-medium">
                      {openTasksCount}
                    </span>
                  )}

                  {sidebarCollapsed && (
                    <>
                      {path === '/comercial' && deals.length > 0 && (
                        <span className="absolute top-[5px] right-[5px] w-[6px] h-[6px] rounded-full bg-[#0066FF]" />
                      )}
                      {path === '/atendimento' && humanHandoffCount > 0 && (
                        <span className="absolute top-[5px] right-[5px] w-[7px] h-[7px] rounded-full bg-[#0066FF]" />
                      )}
                      {path === '/tarefas' && openTasksCount > 0 && (
                        <span className="absolute top-[5px] right-[5px] w-[6px] h-[6px] rounded-full bg-[var(--ds-muted)]" />
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* ÁRVORE DE SETORES & PROJETOS */}
          {!sidebarCollapsed && (
            <>
              <div className="border-t border-[var(--line)] pt-[12px] flex flex-col gap-[6px]">
            <div className="flex items-center justify-between px-[10px]">
              <span className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-[var(--ds-muted)]">
                Setores & Projetos
              </span>
              {canManageStructure && (
                <button
                  type="button"
                  onClick={() =>
                    setFolderModal({
                      open: true,
                      mode: 'create',
                      name: '',
                      icon: 'Folder',
                    })
                  }
                  title="Criar novo setor"
                  className="w-[22px] h-[22px] rounded-[6px] bg-[var(--surface)] hover:bg-[#0066FF] hover:text-white grid place-items-center text-[var(--ds-muted)] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              )}
            </div>

            {visibleTaskFolders.length === 0 ? (
              <div className="px-[10px] py-[8px] text-[11px] text-[var(--ds-muted)] bg-[var(--surface)]/50 rounded-[10px] border border-dashed border-[var(--line2)]">
                {isGuest
                  ? 'Nenhum setor ou projeto liberado para o seu perfil.'
                  : 'Clique em + para criar setores (ex: Tráfego, Comercial, Design).'}
              </div>
            ) : (
              <div className="flex flex-col gap-[4px]">
                {visibleTaskFolders.map((folder) => {
                  const FolderIcon = ICON_MAP[folder.icon] || Folder
                  const isOpen = openFolders[folder.id] ?? true
                  const folderLists = visibleTaskLists.filter((l) => l.folder_id === folder.id)

                  return (
                    <div key={folder.id} className="flex flex-col gap-[2px]">
                      <div className="group flex items-center justify-between px-[8px] py-[6px] rounded-[8px] hover:bg-[var(--ds-hover)] text-[12px] text-[var(--fg)]">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenFolders((prev) => ({
                              ...prev,
                              [folder.id]: !isOpen,
                            }))
                          }
                          className="flex items-center gap-[6px] flex-1 min-w-0 text-left cursor-pointer"
                        >
                          {isOpen ? (
                            <ChevronDown className="w-3 h-3 text-[var(--ds-muted)] shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-[var(--ds-muted)] shrink-0" />
                          )}
                          <FolderIcon className="w-3.5 h-3.5 text-[#0066FF] shrink-0" strokeWidth={1.6} />
                          <span className="truncate font-medium">{folder.name}</span>
                        </button>

                        {canManageStructure && (
                          <div className="flex items-center gap-[2px] opacity-80 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() =>
                                setListModal({
                                  open: true,
                                  mode: 'create',
                                  folderId: folder.id,
                                  name: '',
                                  icon: 'List',
                                })
                              }
                              title="Criar projeto/lista neste setor"
                              className="w-[20px] h-[20px] rounded-[5px] hover:bg-[var(--surface)] grid place-items-center text-[var(--ds-muted)] hover:text-[#0066FF] cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setFolderModal({
                                  open: true,
                                  mode: 'edit',
                                  folderId: folder.id,
                                  name: folder.name,
                                  icon: folder.icon,
                                })
                              }
                              title="Editar setor"
                              className="w-[20px] h-[20px] rounded-[5px] hover:bg-[var(--surface)] grid place-items-center text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTaskFolder(folder.id)}
                              title="Excluir setor"
                              className="w-[20px] h-[20px] rounded-[5px] hover:bg-[var(--surface)] grid place-items-center text-[var(--ds-muted)] hover:text-[#0066FF] cursor-pointer"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {isOpen && (
                        <div className="pl-[20px] flex flex-col gap-[2px]">
                          {folderLists.length === 0 ? (
                            canManageStructure ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setListModal({
                                    open: true,
                                    mode: 'create',
                                    folderId: folder.id,
                                    name: '',
                                    icon: 'List',
                                  })
                                }
                                className="text-left px-[8px] py-[4px] text-[11px] text-[var(--ds-muted)] hover:text-[#0066FF] cursor-pointer"
                              >
                                + Criar primeira lista
                              </button>
                            ) : null
                          ) : (
                            folderLists.map((list) => {
                              const ListIcon = ICON_MAP[list.icon] || List
                              const listPath = `/listas/${list.id}`
                              const listActive = pathname === listPath
                              const countInList = tasks.filter(
                                (t) => t.list_id === list.id && !t.is_archived
                              ).length

                              return (
                                <div
                                  key={list.id}
                                  className={`group flex items-center justify-between px-[8px] py-[5px] rounded-[8px] text-[11.5px] transition-colors ${
                                    listActive
                                      ? 'bg-[var(--surface)] text-[#0066FF] font-semibold'
                                      : 'text-[var(--ds-muted)] hover:bg-[var(--ds-hover)] hover:text-[var(--fg)]'
                                  }`}
                                >
                                  <Link
                                    href={listPath}
                                    className="flex items-center gap-[7px] flex-1 min-w-0 truncate"
                                  >
                                    <ListIcon className="w-3 h-3 shrink-0" strokeWidth={1.6} />
                                    <span className="truncate">{list.name}</span>
                                  </Link>
                                  <div className="flex items-center gap-[3px]">
                                    {countInList > 0 && (
                                      <span className="text-[10px] text-[var(--ds-muted)] px-[4px]">
                                        {countInList}
                                      </span>
                                    )}
                                    {canManageStructure && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setListModal({
                                              open: true,
                                              mode: 'edit',
                                              folderId: folder.id,
                                              listId: list.id,
                                              name: list.name,
                                              icon: list.icon,
                                            })
                                          }
                                          className="opacity-0 group-hover:opacity-100 w-[18px] h-[18px] grid place-items-center text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
                                          title="Renomear lista"
                                        >
                                          <Pencil className="w-2.5 h-2.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => deleteTaskList(list.id)}
                                          className="opacity-0 group-hover:opacity-100 w-[18px] h-[18px] grid place-items-center text-[var(--ds-muted)] hover:text-[#0066FF] cursor-pointer"
                                          title="Excluir lista"
                                        >
                                          <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Módulos Complementares Colapsáveis */}
          <div className="border-t border-[var(--line)] pt-[8px]">
            <button
              type="button"
              onClick={() => setShowExtraNav(!showExtraNav)}
              className="w-full flex items-center justify-between px-[10px] py-[6px] text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
            >
              <span>Governança & NOC</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showExtraNav ? 'rotate-180' : ''}`}
              />
            </button>
            {showExtraNav && (
              <div className="flex flex-col gap-[2px] mt-[2px]">
                {visibleExtraNavItems.map(({ icon: Icon, label, path }) => {
                  const active = isActive(path)
                  return (
                    <Link
                      key={path}
                      href={path}
                      className={`flex items-center justify-between px-[10px] py-[7px] rounded-[8px] text-[12px] transition-colors ${
                        active
                          ? 'bg-[var(--surface)] text-[var(--fg)] font-medium'
                          : 'text-[var(--ds-muted)] hover:bg-[var(--ds-hover)] hover:text-[var(--fg)]'
                      }`}
                    >
                      <span className="flex items-center gap-[8px] truncate">
                        <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.4} />
                        <span className="truncate">{label}</span>
                      </span>
                      {path === '/studio' && pendingApprovalsCount > 0 && (
                        <span className="text-[10px] text-[#0066FF] font-semibold">
                          {pendingApprovalsCount}
                        </span>
                      )}
                      {path === '/pulse' && openIncidentsCount > 0 && (
                        <span className="text-[10px] text-[#e8c14a] font-semibold">
                          {openIncidentsCount}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
          </>
          )}
        </div>

        {/* Banner Acento Azul (Gradiente em Código + Imagem) */}
        {!sidebarCollapsed ? (
          <div className="mt-auto pt-[10px] shrink-0">
            <div className="relative rounded-[12px] p-[1px] shadow-sm overflow-hidden bg-gradient-to-br from-white/30 via-white/10 to-transparent">
              <div className="relative rounded-[11px] px-[12px] py-[10px] flex items-center justify-between gap-[10px] overflow-hidden bg-accent-blue-card text-white">
                {/* Overlay sutil para reforçar legibilidade e profundidade */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/35 pointer-events-none" />
                
                <div className="relative z-10 flex items-center gap-[9px] min-w-0">
                  <div className="w-[30px] h-[30px] shrink-0 rounded-[8px] bg-white/20 backdrop-blur-md grid place-items-center p-[2px] border border-white/25 shadow-inner">
                    <IllustrationNpcMascot className="w-full h-full object-contain brightness-125" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-[12.5px] leading-tight truncate text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                      Central de Clientes
                    </div>
                    <div className="text-[10px] text-white/90 font-medium leading-none mt-[2px] truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                      Ficha 360º &amp; Operação
                    </div>
                  </div>
                </div>
                <Link
                  href="/clientes"
                  className="relative z-10 h-[28px] px-[10px] rounded-[7px] bg-white/95 hover:bg-white text-[#0a1e3f] hover:text-[#0047cc] text-[11px] font-bold flex items-center gap-[4px] shrink-0 transition-all shadow-md active:scale-95 cursor-pointer"
                  title="Abrir Central de Clientes"
                >
                  <span>Abrir</span>
                  <IconArrowUpRight10 />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-auto pt-[8px] flex justify-center shrink-0">
            <Link
              href="/clientes"
              title="Central de Clientes 360º"
              className="relative w-[42px] h-[42px] rounded-[10px] bg-accent-blue-card text-white grid place-items-center shadow-md border border-white/25 hover:scale-105 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-black/20 pointer-events-none" />
              <Users className="relative z-10 w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" strokeWidth={2.2} />
            </Link>
          </div>
        )}
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* HEADER SUPERIOR */}
        <header className="flex items-center gap-[14px] px-[26px] py-[14px] border-b border-[var(--line)] shrink-0">
          {sidebarCollapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden md:grid place-items-center w-[34px] h-[34px] rounded-[8px] bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer transition-colors shrink-0"
              title="Expandir barra lateral"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}

          {/* Busca Funcional */}
          <div className="flex items-center gap-[10px] flex-1 text-[var(--ds-muted)] text-[13px] min-w-0">
            <Search className="w-[14px] h-[14px] shrink-0" strokeWidth={1.6} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar clientes, conversas no WhatsApp, tarefas, campanhas ou financeiro…"
              className="bg-transparent border-0 outline-none text-[var(--fg)] placeholder:text-[var(--ds-muted)] w-full text-[13px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Seletor de Perfil / Conta Logada + Logout */}
          <div className="relative">
            <button
              onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
              className="flex items-center gap-[8px] bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] rounded-full px-[12px] h-[36px] text-[12px] transition-colors cursor-pointer"
            >
              <span className="w-[6px] h-[6px] rounded-full bg-[#0066FF]"></span>
              <span className="font-medium text-[var(--fg)] hidden sm:inline">
                {displayUserName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--ds-muted)]" strokeWidth={1.4} />
            </button>

            {personaDropdownOpen && (
              <div className="absolute right-0 top-[42px] w-[290px] bg-[var(--surface)] border border-[var(--line2)] rounded-[12px] p-[8px] shadow-2xl z-50 flex flex-col gap-[4px]">
                <div className="px-[10px] py-[6px] border-b border-[var(--line)]">
                  <div className="text-[13px] font-semibold text-[var(--fg)] truncate">
                    {displayUserName}
                  </div>
                  <div className="text-[11px] text-[var(--ds-muted)] truncate">
                    {authenticatedUser?.email || currentOrg.name}
                  </div>
                </div>

                <div className="px-[10px] pt-[6px] pb-[2px] text-[10.5px] text-[var(--ds-muted)]">
                  Perspectiva operacional
                </div>
                {personas.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setCurrentPersonaId(p.id)
                      setPersonaDropdownOpen(false)
                    }}
                    className={`w-full flex flex-col gap-[2px] px-[10px] py-[6px] rounded-[8px] text-left transition-colors cursor-pointer ${p.id === currentPersona.id
                      ? 'bg-[var(--bg)] text-[#0066FF]'
                      : 'hover:bg-[var(--ds-hover)] text-[var(--fg)]'
                      }`}
                  >
                    <div className="flex items-center justify-between text-[12px] font-medium">
                      <span>{p.personaTitle}</span>
                      <span className="text-[10.5px] text-[var(--ds-muted)]">
                        {p.primaryModule}
                      </span>
                    </div>
                  </button>
                ))}

                <div className="border-t border-[var(--line)] mt-[4px] pt-[4px]">
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-[8px] px-[10px] py-[8px] rounded-[8px] text-[12.5px] font-medium text-[#0066FF] hover:bg-[var(--ds-hover)] transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" strokeWidth={1.6} />
                      <span>Sair da conta</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Selo de Presença Oficial */}
          <div className="hidden sm:flex items-center bg-[var(--surface)] rounded-full p-[4px] text-[12px] shrink-0 whitespace-nowrap">
            <button
              onClick={() => setActiveAgentDrawer(agents[0])}
              className="flex items-center gap-[8px] py-[4px] pr-[12px] pl-[4px] border-r border-[var(--line2)] hover:opacity-85 transition-opacity cursor-pointer"
            >
              <span className="w-[20px] h-[20px] rounded-full bg-[#0066FF] grid place-items-center text-white">
                <IconRobot16 className="w-[12px] h-[12px]" />
              </span>
              <span>{agents.length} agentes IA</span>
            </button>
            <Link
              href="/atendimento"
              className="flex items-center gap-[8px] py-[4px] px-[10px] hover:opacity-85 transition-opacity"
            >
              <span
                className="w-[8px] h-[8px] rounded-full bg-[#2f9e5a]"
                style={{ boxShadow: '0 0 0 3px rgba(47,158,90,.25)' }}
              ></span>
              <span>WhatsApp 24h</span>
            </Link>
          </div>

          {/* Botão Circular 38px Alternar Tema */}
          <button
            onClick={toggleTheme}
            title="Alternar tema"
            className="w-[38px] h-[38px] rounded-full bg-[var(--surface)] hover:bg-[var(--line2)] grid place-items-center cursor-pointer text-[var(--fg)] shrink-0 transition-colors"
          >
            {isDark ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <circle cx="8" cy="8" r="3"></circle>
                <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1"></path>
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              >
                <path d="M13.5 9.5A6 6 0 0 1 6.5 2.5a6 6 0 1 0 7 7z"></path>
              </svg>
            )}
          </button>

          {/* Avatar Circular 38px */}
          <button
            onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
            title={`Logado como ${displayUserName}`}
            className="w-[38px] h-[38px] rounded-full bg-[#0066FF] text-white border-2 border-[var(--line2)] grid place-items-center text-[13px] font-bold shrink-0 cursor-pointer"
          >
            {initials}
          </button>
        </header>

        {/* CONTEÚDO ROLÁVEL DA PÁGINA */}
        <div className="flex-1 overflow-y-auto pb-[96px] md:pb-0">{children}</div>

        {/* BARRA INFERIOR MOBILE FLUTUANTE */}
        <nav className="md:hidden fixed left-[16px] right-[16px] bottom-[18px] h-[64px] bg-[var(--surface)] border border-[var(--line2)] rounded-[22px] flex items-center justify-around z-40 shadow-2xl">
          {visibleMainNavItems.slice(0, 5).map(({ icon: Icon, label, path }) => {
            const active = isActive(path)
            return (
              <Link
                key={path}
                href={path}
                title={label}
                className={
                  active
                    ? 'w-[46px] h-[46px] rounded-[15px] bg-[#0066FF] grid place-items-center text-white'
                    : 'w-[46px] h-[46px] grid place-items-center text-[var(--ds-muted)]'
                }
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.4} />
              </Link>
            )
          })}
        </nav>

        {/* MODAL DE CRIAR / EDITAR SETOR (FOLDER) */}
        {folderModal.open && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-[18px]">
            <form
              onSubmit={handleSaveFolder}
              className="w-full max-w-[400px] bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] p-[22px] flex flex-col gap-[16px]"
            >
              <div className="flex items-center justify-between">
                <div className="text-[18px] font-semibold tracking-[-0.3px]">
                  {folderModal.mode === 'create' ? 'Novo setor de tarefas' : 'Editar setor'}
                </div>
                <button
                  type="button"
                  onClick={() => setFolderModal({ ...folderModal, open: false })}
                  className="w-[30px] h-[30px] rounded-full bg-[var(--bg)] grid place-items-center text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Nome do setor
                <input
                  value={folderModal.name}
                  onChange={(e) => setFolderModal({ ...folderModal, name: e.target.value })}
                  placeholder="Ex: Tráfego Pago, Comercial, Design, Jurídico..."
                  required
                  className="h-[44px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                />
              </label>

              <div className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                <span>Ícone do setor</span>
                <div className="grid grid-cols-4 gap-[8px]">
                  {FOLDER_ICONS.map((ic) => {
                    const Comp = ICON_MAP[ic.key] || Folder
                    const selected = folderModal.icon === ic.key
                    return (
                      <button
                        key={ic.key}
                        type="button"
                        onClick={() => setFolderModal({ ...folderModal, icon: ic.key })}
                        className={`flex flex-col items-center gap-[4px] py-[8px] rounded-[10px] border text-[11px] transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[#0066FF] text-white border-[#0066FF] font-semibold'
                            : 'bg-[var(--bg)] text-[var(--ds-muted)] border-[var(--line2)] hover:text-[var(--fg)]'
                        }`}
                      >
                        <Comp className="w-4 h-4" />
                        <span>{ic.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingTaskItem}
                className={`h-[46px] bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-full px-[18px] text-[13px] font-semibold flex items-center justify-between transition-colors ${
                  isSavingTaskItem ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <span>
                  {isSavingTaskItem
                    ? 'Salvando...'
                    : folderModal.mode === 'create'
                    ? 'Criar setor'
                    : 'Salvar alterações'}
                </span>
                <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </form>
          </div>
        )}

        {/* MODAL DE CRIAR / EDITAR LISTA / PROJETO (LIST) */}
        {listModal.open && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-[18px]">
            <form
              onSubmit={handleSaveList}
              className="w-full max-w-[400px] bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] p-[22px] flex flex-col gap-[16px]"
            >
              <div className="flex items-center justify-between">
                <div className="text-[18px] font-semibold tracking-[-0.3px]">
                  {listModal.mode === 'create' ? 'Nova lista / projeto' : 'Editar lista'}
                </div>
                <button
                  type="button"
                  onClick={() => setListModal({ ...listModal, open: false })}
                  className="w-[30px] h-[30px] rounded-full bg-[var(--bg)] grid place-items-center text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Nome da lista ou projeto
                <input
                  value={listModal.name}
                  onChange={(e) => setListModal({ ...listModal, name: e.target.value })}
                  placeholder="Ex: Demandas da Semana, Onboarding Clientes..."
                  required
                  className="h-[44px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                />
              </label>

              <div className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                <span>Ícone</span>
                <div className="grid grid-cols-3 gap-[8px]">
                  {LIST_ICONS.map((ic) => {
                    const Comp = ICON_MAP[ic.key] || List
                    const selected = listModal.icon === ic.key
                    return (
                      <button
                        key={ic.key}
                        type="button"
                        onClick={() => setListModal({ ...listModal, icon: ic.key })}
                        className={`flex items-center justify-center gap-[6px] py-[8px] rounded-[10px] border text-[11.5px] transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[#0066FF] text-white border-[#0066FF] font-semibold'
                            : 'bg-[var(--bg)] text-[var(--ds-muted)] border-[var(--line2)] hover:text-[var(--fg)]'
                        }`}
                      >
                        <Comp className="w-3.5 h-3.5" />
                        <span>{ic.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingTaskItem}
                className={`h-[46px] bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-full px-[18px] text-[13px] font-semibold flex items-center justify-between transition-colors ${
                  isSavingTaskItem ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <span>
                  {isSavingTaskItem
                    ? 'Salvando...'
                    : listModal.mode === 'create'
                    ? 'Criar lista com Kanban'
                    : 'Salvar'}
                </span>
                <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </form>
          </div>
        )}

        {/* MODAL DE CRIAR NOVA ORGANIZAÇÃO B2B */}
        {showNewOrgModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-[18px]">
            <form
              onSubmit={handleCreateOrg}
              className="w-full max-w-[420px] bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] p-[24px] flex flex-col gap-[16px]"
            >
              <div className="flex items-center justify-between">
                <div className="text-[20px] font-semibold tracking-[-0.4px]">
                  Nova organização B2B
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewOrgModal(false)}
                  className="w-[32px] h-[32px] rounded-full bg-[var(--bg)] grid place-items-center text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Nome da empresa
                <input
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Ex: Distribuidora Atlas Ltda."
                  required
                  className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                />
              </label>

              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Setor de atuação
                <input
                  value={newOrgSector}
                  onChange={(e) => setNewOrgSector(e.target.value)}
                  placeholder="Ex: Varejo, Logística, Indústria"
                  required
                  className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-[10px]">
                <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                  Porte
                  <select
                    value={newOrgTier}
                    onChange={(e) => setNewOrgTier(e.target.value as 'MID_MARKET' | 'ENTERPRISE')}
                    className="h-[46px] px-[12px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                  >
                    <option value="MID_MARKET">Médio Porte</option>
                    <option value="ENTERPRISE">Grande Porte</option>
                  </select>
                </label>

                <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                  Faturamento/hora (R$)
                  <input
                    type="number"
                    value={newOrgHourlyRev}
                    onChange={(e) => setNewOrgHourlyRev(e.target.value)}
                    min="0"
                    className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="h-[48px] bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-full px-[18px] text-[13.5px] font-semibold flex items-center justify-between cursor-pointer transition-colors mt-[4px]"
              >
                <span>Criar organização limpa</span>
                <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </form>
          </div>
        )}

        {/* DRAWER LATERAL DE CONVERSA COM AGENTE DE IA */}
        {activeAgentDrawer && (
          <div className="fixed inset-y-0 right-0 w-full sm:w-[380px] bg-[var(--surface)] border-l border-[var(--line2)] rounded-l-[18px] z-50 flex flex-col shadow-2xl">
            <div className="p-[18px] border-b border-[var(--line)] flex items-center justify-between gap-[12px]">
              <div className="flex items-center gap-[12px] min-w-0">
                <div className="w-[38px] h-[38px] rounded-full bg-[#0066FF] text-white grid place-items-center shrink-0">
                  <IconRobot16 className="w-[18px] h-[18px]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold truncate">{activeAgentDrawer.name}</div>
                  <div className="text-[11.5px] text-[var(--ds-muted)] truncate">
                    {activeAgentDrawer.roleLabel} · {activeAgentDrawer.modelRouted}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-[8px] shrink-0">
                <div className="flex items-center gap-[5px] bg-[var(--bg)] border border-[var(--line2)] rounded-[6px] px-[8px] py-[4px] text-[10.5px]">
                  <span
                    className="w-[5px] h-[5px] rounded-full"
                    style={{
                      backgroundColor:
                        activeAgentDrawer.status === 'Entregue'
                          ? '#0066FF'
                          : activeAgentDrawer.status === 'Em andamento'
                            ? '#e8c14a'
                            : '#8f7dff',
                    }}
                  ></span>
                  {activeAgentDrawer.status}
                </div>
                <button
                  onClick={() => setActiveAgentDrawer(null)}
                  className="w-[32px] h-[32px] rounded-full bg-[var(--bg)] hover:bg-[var(--ds-hover)] grid place-items-center text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
                >
                  <X className="w-4 h-4" strokeWidth={1.4} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-[18px] flex flex-col gap-[14px]">
              <div className="text-[11px] text-[var(--ds-muted)]">
                Gatilho: {activeAgentDrawer.triggerDescription}
              </div>

              <div className="flex flex-col gap-[8px]">
                <div className="text-[12px] font-medium">
                  Ferramentas conectadas (n8n / Supabase)
                </div>
                {activeAgentDrawer.tools.map((tool) => (
                  <div
                    key={tool.name}
                    className="bg-[var(--bg)] border border-[var(--line2)] rounded-[12px] p-[12px] flex flex-col gap-[4px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-[#0066FF]">{tool.name}</span>
                      <span className="text-[10.5px] text-[var(--ds-muted)]">Ativa</span>
                    </div>
                    <div className="text-[11.5px] text-[var(--ds-muted)]">{tool.description}</div>
                    <div className="text-[11px] text-[var(--fg2)] mt-[4px] pt-[6px] border-t border-[var(--line)]">
                      Retorno: {tool.sampleOutput}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-[10px] mt-[6px]">
                <div className="text-[12px] font-medium">Histórico da sessão (Working Memory)</div>
                <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[12px] p-[12px] text-[13px] leading-[1.45]">
                  {activeAgentDrawer.lastDeliverySummary}
                </div>

                {(agentMessages[activeAgentDrawer.id] || []).map((msg, idx) => (
                  <div
                    key={idx}
                    className={
                      msg.sender === 'user'
                        ? 'self-end max-w-[85%] bg-[#0066FF] text-white rounded-[12px] px-[14px] py-[10px] text-[13px] font-medium shadow-sm'
                        : 'self-start max-w-[90%] bg-[var(--bg)] border border-[var(--line2)] text-[var(--fg)] rounded-[12px] px-[14px] py-[10px] text-[13px]'
                    }
                  >
                    <div>{msg.text}</div>
                    <div className="text-[10.5px] opacity-70 mt-[4px]">{msg.time}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-[16px] border-t border-[var(--line)] flex flex-col gap-[10px]">
              <button
                onClick={() => {
                  sendTaskToAgent(
                    activeAgentDrawer.id,
                    `Executar rotina prioritária de ${activeAgentDrawer.name}`
                  )
                }}
                className="w-full h-[42px] bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-full px-[18px] text-[13px] font-semibold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Executar tarefa com {activeAgentDrawer.name}</span>
                <ArrowUpRight className="w-4 h-4" strokeWidth={2.2} />
              </button>

              <form onSubmit={handleSendAgentMessage} className="flex items-center gap-[8px]">
                <input
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  placeholder="Enviar comando ao agente (Enter)…"
                  className="flex-1 h-[48px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] outline-none transition-colors"
                />
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
