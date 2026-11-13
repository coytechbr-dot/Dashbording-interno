'use client'

import React, { useState, useMemo } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  User,
  Plus,
  Check,
  Search,
  X,
  Users,
  Briefcase,
  ChevronDown,
} from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'
import type { TeamMemberItem } from '@/types/coydash'

export interface AssigneeUserOption {
  id: string
  name: string
  email?: string
  role?: string
  jobTitle?: string
  sector?: string
  avatarUrl?: string
  color?: string
}

export interface CoyAssigneePickerProps {
  /** Lista de nomes ou IDs selecionados */
  value?: string | string[]
  /** Callback ao alterar (retorna array se multiple, string se single) */
  onChange: (value: any) => void
  /** Se permite selecionar mais de um responsável */
  multiple?: boolean
  /** Lista opcional customizada de membros; se não informada, consome orgMembers de useCoyDash */
  members?: AssigneeUserOption[]
  /** Placeholder quando nada estiver selecionado */
  placeholder?: string
  /** Trigger customizado opcional */
  children?: React.ReactNode
  /** Classes CSS extras para o trigger padrão */
  className?: string
  /** Se o componente está desabilitado */
  disabled?: boolean
  /** Alinhamento do minipop */
  align?: 'start' | 'center' | 'end'
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Cores de gradiente rotativas para avatares elegantes
const AVATAR_COLORS = [
  'from-[#0066FF] to-[#0052CC]',
  'from-[#2F9E5A] to-[#10B981]',
  'from-[#8F7DFF] to-[#6366F1]',
  'from-[#E8C14A] to-[#F59E0B]',
  'from-[#06B6D4] to-[#0284C7]',
  'from-[#EC4899] to-[#D946EF]',
]

function getAvatarGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

export function CoyAssigneePicker({
  value,
  onChange,
  multiple = false,
  members: propMembers,
  placeholder = 'Selecionar responsável...',
  children,
  className = '',
  disabled = false,
  align = 'start',
}: CoyAssigneePickerProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { orgMembers, authenticatedUser, personas } = useCoyDash()

  // Converte a lista do banco ou props em lista padronizada de usuários
  const allUsers: AssigneeUserOption[] = useMemo(() => {
    if (propMembers && propMembers.length > 0) {
      return propMembers
    }

    const map = new Map<string, AssigneeUserOption>()

    // 1. Membros reais de RH / equipe (orgMembers)
    orgMembers.forEach((m) => {
      const name = m.full_name || m.email?.split('@')[0] || 'Colaborador'
      map.set(name.toLowerCase().trim(), {
        id: m.id,
        name,
        email: m.email,
        role: m.role || 'Membro',
        jobTitle: m.job_title || m.role || 'Especialista',
        sector: m.sector || 'Operação',
      })
    })

    // 2. Usuário autenticado se não estiver na lista
    if (authenticatedUser?.name) {
      const authKey = authenticatedUser.name.toLowerCase().trim()
      if (!map.has(authKey)) {
        map.set(authKey, {
          id: authenticatedUser.id || 'auth-user',
          name: authenticatedUser.name,
          email: authenticatedUser.email,
          role: authenticatedUser.role || 'Equipe',
          jobTitle: authenticatedUser.role || 'Especialista Coytech',
          sector: 'Geral',
        })
      }
    }

    // 3. Personas oficiais do sistema se ainda tiver poucos membros
    personas.forEach((p) => {
      const pKey = p.name.toLowerCase().trim()
      if (!map.has(pKey)) {
        map.set(pKey, {
          id: p.id,
          name: p.name,
          email: p.email,
          role: p.shortRole,
          jobTitle: p.personaTitle || p.shortRole,
          sector: p.primaryModule || 'Operação',
        })
      }
    })

    return Array.from(map.values())
  }, [propMembers, orgMembers, authenticatedUser, personas])

  // Normalização do valor atual para array
  const selectedList: string[] = useMemo(() => {
    if (!value) return []
    if (Array.isArray(value)) return value.map((v) => String(v).trim())
    return [String(value).trim()]
  }, [value])

  // Filtro de busca por nome, cargo ou setor
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return allUsers
    const q = searchQuery.toLowerCase().trim()
    return allUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.jobTitle && u.jobTitle.toLowerCase().includes(q)) ||
        (u.sector && u.sector.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
    )
  }, [allUsers, searchQuery])

  // Alternar ou selecionar membro
  const handleToggleMember = (userName: string) => {
    const targetName = userName.trim()
    if (multiple) {
      const exists = selectedList.some((s) => s.toLowerCase() === targetName.toLowerCase())
      let next: string[]
      if (exists) {
        next = selectedList.filter((s) => s.toLowerCase() !== targetName.toLowerCase())
      } else {
        next = [...selectedList, targetName]
      }
      onChange(next)
    } else {
      onChange(targetName)
      setOpen(false)
      setSearchQuery('')
    }
  }

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    onChange(multiple ? [] : '')
    setSearchQuery('')
  }

  // Primeiro usuário selecionado para exibição do trigger single
  const singleSelectedUser = useMemo(() => {
    if (selectedList.length === 0) return null
    return allUsers.find((u) => u.name.toLowerCase() === selectedList[0].toLowerCase()) || {
      id: 'custom',
      name: selectedList[0],
      jobTitle: 'Responsável',
    }
  }, [selectedList, allUsers])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={`outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed ${
          children ? '' : 'cursor-pointer'
        } ${className}`}
      >
        {children ? (
          children
        ) : multiple ? (
          /* Trigger Padrão Múltiplo (Avatares + Botão + Atribuir) */
          <div className="flex items-center gap-1.5 flex-wrap">
            {selectedList.length > 0 && (
              <div className="flex -space-x-2 overflow-hidden py-0.5">
                {selectedList.slice(0, 3).map((name, i) => (
                  <div
                    key={i}
                    className={`h-7 w-7 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                      name
                    )} text-white ring-2 ring-[var(--surface)] flex items-center justify-center text-[10px] font-bold shrink-0 select-none shadow-sm`}
                    title={name}
                  >
                    {getInitials(name)}
                  </div>
                ))}
                {selectedList.length > 3 && (
                  <div
                    className="h-7 w-7 rounded-full bg-[var(--line2)] text-[var(--fg)] ring-2 ring-[var(--surface)] flex items-center justify-center text-[10px] font-bold shrink-0 select-none shadow-sm"
                    title={`+${selectedList.length - 3} responsáveis`}
                  >
                    +{selectedList.length - 3}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              className={`h-[32px] px-2.5 rounded-lg border border-[var(--line2)] hover:border-[#0066FF] hover:bg-[#0066FF]/10 text-[11.5px] font-medium text-[var(--ds-muted)] hover:text-[#0066FF] flex items-center gap-1.5 transition-colors cursor-pointer ${
                open ? 'border-[#0066FF] bg-[#0066FF]/10 text-[#0066FF]' : ''
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>{selectedList.length === 0 ? 'Atribuir responsável' : 'Adicionar'}</span>
            </button>
          </div>
        ) : (
          /* Trigger Padrão Único (Pílula com Foto, Nome e Chevron) */
          <div
            className={`h-[38px] px-3 rounded-xl bg-[var(--surface)] border border-[var(--line2)] text-[12.5px] text-[var(--fg)] flex items-center justify-between gap-2.5 hover:border-[#0066FF]/60 hover:bg-[var(--ds-hover)] transition-all ${
              open ? 'border-[#0066FF] ring-2 ring-[#0066FF]/15' : ''
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 truncate">
              {singleSelectedUser ? (
                <>
                  <div
                    className={`w-6 h-6 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                      singleSelectedUser.name
                    )} text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm`}
                  >
                    {getInitials(singleSelectedUser.name)}
                  </div>
                  <span className="truncate font-semibold text-[var(--fg)]">
                    {singleSelectedUser.name}
                  </span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4 text-[var(--ds-muted)] shrink-0" />
                  <span className="text-[var(--ds-muted)] truncate">{placeholder}</span>
                </>
              )}
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-[var(--ds-muted)] shrink-0" />
          </div>
        )}
      </PopoverTrigger>

      {/* MINIPOP COM LISTA DE USUÁRIOS, FOTO, NOME E CARGO */}
      <PopoverContent
        align={align}
        className="w-[330px] p-3 rounded-2xl bg-[var(--surface)] border border-[var(--line2)] shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-100"
      >
        <div className="flex flex-col gap-2.5">
          {/* Cabeçalho do Minipop */}
          <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--fg)]">
              <Users className="w-4 h-4 text-[#0066FF]" />
              <span>{multiple ? 'Atribuir Responsáveis' : 'Selecionar Responsável'}</span>
            </div>

            {selectedList.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] font-semibold text-red-500 hover:underline cursor-pointer flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" />
                <span>{multiple ? 'Remover todos' : 'Limpar'}</span>
              </button>
            )}
          </div>

          {/* Campo de Busca Rápida */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-[var(--ds-muted)] absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, cargo ou setor..."
              className="w-full h-8 pl-8 pr-2.5 rounded-lg bg-[var(--bg)] border border-[var(--line2)] text-[12px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] outline-none focus:border-[#0066FF]"
              autoFocus
            />
          </div>

          {/* Lista de Membros com Foto, Nome e Cargo */}
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto no-scrollbar pr-0.5">
            {filteredUsers.length === 0 ? (
              <div className="py-6 text-center text-[12px] text-[var(--ds-muted)]">
                Nenhum colaborador encontrado.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedList.some(
                  (s) => s.toLowerCase() === user.name.toLowerCase()
                )

                return (
                  <button
                    key={user.id || user.name}
                    type="button"
                    onClick={() => handleToggleMember(user.name)}
                    className={`flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-[#0066FF]/12 border border-[#0066FF]/35 text-[var(--fg)]'
                        : 'hover:bg-[var(--ds-hover)] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Foto / Avatar com Gradiente e Iniciais */}
                      <div
                        className={`relative w-9 h-9 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                          user.name
                        )} text-white flex items-center justify-center text-[12px] font-bold shrink-0 shadow-sm ring-2 ring-white/10`}
                      >
                        {getInitials(user.name)}
                        {isSelected && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#0066FF] border-2 border-[var(--surface)] flex items-center justify-center">
                            <Check className="w-2 h-2 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Nome e Cargo / Especialidade */}
                      <div className="min-w-0 flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[12.5px] text-[var(--fg)] truncate group-hover:text-[#0066FF] transition-colors">
                            {user.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-[var(--ds-muted)] truncate leading-tight flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3 h-3 shrink-0 opacity-70" />
                          <span>{user.jobTitle || user.role || 'Especialista'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Lado Direito: Setor e Check */}
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {user.sector && (
                        <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--bg)] border border-[var(--line2)] text-[var(--ds-muted)] uppercase tracking-wide">
                          {user.sector}
                        </span>
                      )}
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#0066FF] text-white flex items-center justify-center shadow-sm">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
