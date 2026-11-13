/**
 * Controle de Acesso & Matriz RBAC CoyDash
 *
 * Documento de referência oficial de funcionalidades e níveis:
 * -> spec/coydash_funcionalidades_e_permissoes.md
 *
 * Hierarquia de Níveis (AccessType):
 * 1. GUEST               — Convidado (Restrito / Leitor)
 * 2. GUEST_COLLABORATOR  — Convidado Colaborador (Operacional)
 * 3. GUEST_MANAGER       — Convidado Gerente (Líder de Projeto)
 * 4. MEMBER              — Membro Full (Equipe Coytech)
 * 5. ADMIN               — Administrador (Governança, Acessos & Sistema)
 */

import type { AccessType } from '@/types/coydash'

export const COYTECH_MASTER_EMAILS = [
  'coytechbr@gmail.com',
  'contato@coytech.com.br',
  'admin@coytech.com.br',
]

export function isCoytechMasterEmail(email?: string | null): boolean {
  if (!email) return false
  const clean = email.trim().toLowerCase()
  if (COYTECH_MASTER_EMAILS.includes(clean)) return true
  if (clean.endsWith('@coytech.com.br') || clean.endsWith('@coytech.com')) return true
  return false
}

export type FeaturePermissionKey =
  | 'tasks.create'
  | 'tasks.edit_assigned'
  | 'tasks.archive_own'
  | 'tasks.archive_any'
  | 'tasks.delete_own'
  | 'tasks.delete_any'
  | 'tasks.manage_columns'
  | 'tasks.manage_structure'
  | 'custom_fields.manage'
  | 'clients.manage'
  | 'clients.create_order_service'
  | 'clients.view_demands_kanban'
  | 'crm.manage_deals'
  | 'leads.request_commercial_proposal'
  | 'whatsapp.operate'
  | 'agents.manage'
  | 'finance.manage'
  | 'team.manage_members'
  | 'team.manage_mcp_tokens'
  | 'workspace.manage_settings'

export interface AccessLevelMeta {
  value: AccessType
  rank: number
  label: string
  shortLabel: string
  group: 'CONVIDADO' | 'EQUIPE'
  badgeColor: string
  description: string
}

export const ACCESS_LEVELS_META: AccessLevelMeta[] = [
  {
    value: 'GUEST',
    rank: 1,
    label: 'Convidado (Leitor / Restrito)',
    shortLabel: 'Convidado',
    group: 'CONVIDADO',
    badgeColor: '#e8c14a',
    description:
      'Acesso limitado às telas e projetos autorizados. Pode comentar, atualizar status/briefing e arquivar/excluir apenas tarefas que ele mesmo criou.',
  },
  {
    value: 'GUEST_COLLABORATOR',
    rank: 2,
    label: 'Convidado Colaborador (Operacional)',
    shortLabel: 'Convidado Colab.',
    group: 'CONVIDADO',
    badgeColor: '#38bdf8',
    description:
      'Nível intermediário: cria tarefas e subtarefas, opera CRM e atendimento nas telas liberadas. Exclui/arquiva apenas suas próprias tarefas.',
  },
  {
    value: 'GUEST_MANAGER',
    rank: 3,
    label: 'Convidado Gerente (Líder de Projeto)',
    shortLabel: 'Convidado Gerente',
    group: 'CONVIDADO',
    badgeColor: '#0066FF',
    description:
      'Escopo focado nos projetos liberados com autoridade gerencial: pode excluir e arquivar qualquer tarefa, gerenciar colunas Kanban, campos personalizados e modelos.',
  },
  {
    value: 'MEMBER',
    rank: 4,
    label: 'Membro (Equipe Coytech Full)',
    shortLabel: 'Membro Full',
    group: 'EQUIPE',
    badgeColor: '#5cd3a8',
    description:
      'Acesso completo a todas as telas operacionais, projetos, clientes, CRM, financeiro, criação de modelos e arquivamento/exclusão de tarefas.',
  },
  {
    value: 'ADMIN',
    rank: 5,
    label: 'Administrador (Governança & Segurança)',
    shortLabel: 'Admin',
    group: 'EQUIPE',
    badgeColor: '#8f7dff',
    description:
      'Poder total sobre o ecossistema: gerenciamento de membros, níveis de permissão, alteração de e-mails/senhas, tokens MCP e estrutura crítica.',
  },
]

export interface FeaturePermissionDefinition {
  key: FeaturePermissionKey
  module: string
  label: string
  description: string
  defaultLevels: AccessType[]
  sensitive?: boolean
}

export const FEATURE_PERMISSION_CATALOG: FeaturePermissionDefinition[] = [
  {
    key: 'tasks.create',
    module: 'Tarefas & Projetos',
    label: 'Criar tarefas e subtarefas',
    description: 'Permite abrir novas demandas e subtarefas nas listas visíveis.',
    defaultLevels: ['GUEST_COLLABORATOR', 'GUEST_MANAGER', 'MEMBER', 'ADMIN'],
  },
  {
    key: 'tasks.edit_assigned',
    module: 'Tarefas & Projetos',
    label: 'Editar tarefas e trocar status/responsáveis',
    description: 'Atualiza status, briefing, responsáveis, datas e valores de campos.',
    defaultLevels: ['GUEST', 'GUEST_COLLABORATOR', 'GUEST_MANAGER', 'MEMBER', 'ADMIN'],
  },
  {
    key: 'tasks.archive_own',
    module: 'Tarefas & Projetos',
    label: 'Arquivar tarefas criadas por si mesmo',
    description: 'Permite arquivar e desarquivar apenas tarefas de autoria própria.',
    defaultLevels: ['GUEST', 'GUEST_COLLABORATOR', 'GUEST_MANAGER', 'MEMBER', 'ADMIN'],
  },
  {
    key: 'tasks.archive_any',
    module: 'Tarefas & Projetos',
    label: 'Arquivar tarefas de qualquer membro',
    description: 'Autoriza arquivar e restaurar qualquer tarefa dentro dos projetos visíveis.',
    defaultLevels: ['GUEST_MANAGER', 'MEMBER', 'ADMIN'],
    sensitive: true,
  },
  {
    key: 'tasks.delete_own',
    module: 'Tarefas & Projetos',
    label: 'Excluir tarefas criadas por si mesmo',
    description: 'Permite exclusão permanente apenas quando o usuário foi o criador.',
    defaultLevels: ['GUEST', 'GUEST_COLLABORATOR', 'GUEST_MANAGER', 'MEMBER', 'ADMIN'],
  },
  {
    key: 'tasks.delete_any',
    module: 'Tarefas & Projetos',
    label: 'Excluir tarefas de terceiros',
    description: 'Autoriza excluir permanentemente qualquer tarefa e suas subtarefas.',
    defaultLevels: ['GUEST_MANAGER', 'MEMBER', 'ADMIN'],
    sensitive: true,
  },
  {
    key: 'tasks.manage_columns',
    module: 'Tarefas & Projetos',
    label: 'Gerenciar colunas de status Kanban',
    description: 'Criar, renomear ou remover colunas do quadro Kanban.',
    defaultLevels: ['GUEST_MANAGER', 'MEMBER', 'ADMIN'],
  },
  {
    key: 'tasks.manage_structure',
    module: 'Tarefas & Projetos',
    label: 'Criar e excluir Setores e Listas',
    description: 'Altera pastas de setores e listas de projetos na barra lateral.',
    defaultLevels: ['GUEST_MANAGER', 'MEMBER', 'ADMIN'],
    sensitive: true,
  },
  {
    key: 'custom_fields.manage',
    module: 'Campos Personalizados',
    label: 'Gerenciar Campos, Modelos e Grupos',
    description: 'Criar, editar alcance por tarefa, criar grupos modelos ou excluir definições de campos.',
    defaultLevels: ['GUEST_MANAGER', 'MEMBER', 'ADMIN'],
  },
  {
    key: 'clients.manage',
    module: 'Clientes & CRM',
    label: 'Editar Clientes 360º',
    description: 'Criar e editar contas de clientes, histórico e notas de equipe.',
    defaultLevels: ['GUEST_MANAGER', 'MEMBER', 'ADMIN'],
  },
  {
    key: 'clients.create_order_service',
    module: 'Clientes & CRM',
    label: 'Abrir Ordens de Serviço (O.S.)',
    description: 'Emitir Ordens de Serviço guiadas em 3 etapas vinculadas ao cliente e enviadas para Clientes - Tarefas.',
    defaultLevels: ['GUEST_COLLABORATOR', 'GUEST_MANAGER', 'MEMBER', 'ADMIN'],
  },
  {
    key: 'clients.view_demands_kanban',
    module: 'Clientes & CRM',
    label: 'Visualizar Kanban de Demandas do Cliente',
    description: 'Alternar entre lista e quadro Kanban embutido dentro da Ficha 360º do Cliente.',
    defaultLevels: ['GUEST', 'GUEST_COLLABORATOR', 'GUEST_MANAGER', 'MEMBER', 'ADMIN'],
  },
  {
    key: 'crm.manage_deals',
    module: 'Clientes & CRM',
    label: 'Operar Funil Comercial & Oportunidades',
    description: 'Criar e movimentar negócios e contatos nas pipelines comerciais.',
    defaultLevels: ['GUEST_COLLABORATOR', 'GUEST_MANAGER', 'MEMBER', 'ADMIN'],
  },
  {
    key: 'leads.request_commercial_proposal',
    module: 'Clientes & CRM',
    label: 'Solicitar Proposta Comercial para Leads',
    description: 'Gerar tarefa com dossiê completo de atendimento/CRM direcionada para Leads - Tarefas -> Proposta Comercial.',
    defaultLevels: ['GUEST_COLLABORATOR', 'GUEST_MANAGER', 'MEMBER', 'ADMIN'],
  },
  {
    key: 'whatsapp.operate',
    module: 'Atendimento & Operação',
    label: 'Operar Atendimento WhatsApp & Handoff',
    description: 'Responder conversas, assumir atendimento humano e gerenciar memórias IA.',
    defaultLevels: ['GUEST_COLLABORATOR', 'GUEST_MANAGER', 'MEMBER', 'ADMIN'],
  },
  {
    key: 'agents.manage',
    module: 'Agentes & Automação',
    label: 'Configurar Agentes IA & Disparos',
    description: 'Criar ou editar agentes personalizados, fluxos e campanhas.',
    defaultLevels: ['GUEST_MANAGER', 'MEMBER', 'ADMIN'],
  },
  {
    key: 'finance.manage',
    module: 'Financeiro & DRE',
    label: 'Lançar e excluir registros Financeiros',
    description: 'Controlar entradas/saídas financeiras e DRE da organização.',
    defaultLevels: ['MEMBER', 'ADMIN'],
    sensitive: true,
  },
  {
    key: 'team.manage_members',
    module: 'Governança & Acessos',
    label: 'Gerenciar Membros, Permissões e Senhas',
    description: 'Conceder acessos, promover convidados para gerente e alterar credenciais.',
    defaultLevels: ['ADMIN'],
    sensitive: true,
  },
  {
    key: 'team.manage_mcp_tokens',
    module: 'Governança & Acessos',
    label: 'Gerenciar Tokens do MCP Universal',
    description: 'Emitir e revogar chaves de API para integração via MCP.',
    defaultLevels: ['ADMIN'],
    sensitive: true,
  },
  {
    key: 'workspace.manage_settings',
    module: 'Governança & Acessos',
    label: 'Configurações Globais e Integrações',
    description: 'Editar webhooks n8n, tokens Z-API e dados estruturais do workspace.',
    defaultLevels: ['ADMIN'],
    sensitive: true,
  },
]

const ADMIN_ROLES = new Set([
  'COYTECH_ADMIN',
  'COYTECH_SRE',
  'CLIENT_CEO_DIRECTOR',
])

const MANAGER_ROLES = new Set([
  'CLIENT_COO_MANAGER',
])

export interface UserPermissionContext {
  userId?: string | null
  email?: string | null
  name?: string | null
  role?: string | null
  access_type?: string | null
  custom_permissions?: Record<string, boolean> | null
}

export function normalizeAccessType(
  accessType?: string | null,
  role?: string | null,
  email?: string | null
): AccessType {
  if (isCoytechMasterEmail(email)) return 'ADMIN'
  const raw = String(accessType || '').trim().toUpperCase()
  if (
    raw === 'ADMIN' ||
    raw === 'MEMBER' ||
    raw === 'GUEST_MANAGER' ||
    raw === 'GUEST_COLLABORATOR' ||
    raw === 'GUEST'
  ) {
    return raw as AccessType
  }
  const normalizedRole = String(role || '').trim().toUpperCase()
  if (ADMIN_ROLES.has(normalizedRole)) return 'ADMIN'
  if (MANAGER_ROLES.has(normalizedRole)) return 'MEMBER'
  return 'MEMBER'
}

export function isGuestScopedLevel(accessType?: string | null): boolean {
  const raw = String(accessType || '').trim().toUpperCase()
  return raw === 'GUEST' || raw === 'GUEST_COLLABORATOR' || raw === 'GUEST_MANAGER'
}

export function getAccessLevelMeta(accessType?: string | null): AccessLevelMeta {
  const found = ACCESS_LEVELS_META.find((l) => l.value === accessType)
  return found || ACCESS_LEVELS_META[3] // MEMBER fallback
}

export function hasFeaturePermission(
  ctx: UserPermissionContext,
  feature: FeaturePermissionKey
): boolean {
  if (isCoytechMasterEmail(ctx.email)) return true

  const resolvedLevel = normalizeAccessType(ctx.access_type, ctx.role, ctx.email)
  if (resolvedLevel === 'ADMIN') return true

  // Overrides explícitos salvos em organization_members.custom_permissions
  if (ctx.custom_permissions && typeof ctx.custom_permissions[feature] === 'boolean') {
    return ctx.custom_permissions[feature]
  }

  const def = FEATURE_PERMISSION_CATALOG.find((f) => f.key === feature)
  if (!def) return false
  return def.defaultLevels.includes(resolvedLevel)
}

export interface TaskOwnershipTarget {
  created_by_user_id?: string | null
  created_by_name?: string | null
}

export function isTaskCreator(
  ctx: UserPermissionContext,
  task?: TaskOwnershipTarget | null
): boolean {
  if (!task) return false
  if (ctx.userId && task.created_by_user_id) {
    return task.created_by_user_id === ctx.userId
  }
  return false
}

export function canUserArchiveTask(
  ctx: UserPermissionContext,
  task?: TaskOwnershipTarget | null
): boolean {
  if (hasFeaturePermission(ctx, 'tasks.archive_any')) return true
  if (task && isTaskCreator(ctx, task)) {
    return hasFeaturePermission(ctx, 'tasks.archive_own')
  }
  return false
}

export function canUserDeleteTask(
  ctx: UserPermissionContext,
  task?: TaskOwnershipTarget | null
): boolean {
  if (hasFeaturePermission(ctx, 'tasks.delete_any')) return true
  if (task && isTaskCreator(ctx, task)) {
    return hasFeaturePermission(ctx, 'tasks.delete_own')
  }
  return false
}

/**
 * Compatibilidade retroativa com chamadas simples de exclusão global de tarefas.
 */
export function canUserDeleteTasks(
  email?: string | null,
  role?: string | null,
  accessType?: string | null,
  customPermissions?: Record<string, boolean> | null
): boolean {
  return hasFeaturePermission(
    {
      email,
      role,
      access_type: accessType,
      custom_permissions: customPermissions,
    },
    'tasks.delete_any'
  )
}

export function generateStrongPassword(length = 10): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnpqrstuvwxyz'
  const digits = '23456789'
  const special = '@#$!'
  const all = upper + lower + digits + special

  let pwd =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)] +
    special[Math.floor(Math.random() * special.length)]

  for (let i = pwd.length; i < length; i++) {
    pwd += all[Math.floor(Math.random() * all.length)]
  }

  return pwd
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}
