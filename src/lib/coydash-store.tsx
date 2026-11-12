'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type {
  Organization,
  PersonaProfile,
  BiaCriticalProcess,
  PulseIncident,
  StudioApprovalItem,
  StudioAuditLog,
  LegacySpreadsheet,
  FlowAutomationRun,
  CoytechAgentSpec,
  KnowledgeChunk,
  LtvWeeklyReport,
  CredentialValidationItem,
  OffboardingState,
  ApprovalStatus,
  LifecycleStage,
  MonitoringLayer,
  QueueType,
  AgentClass,
  IncidentPriority,
  ClientAccount,
  ClientHistoryEvent,
  ClientTeamNote,
  ClientConnections,
  ClientPriority,
  ClientStatus,
  ClientAdPlatform,
  TaskFolderItem,
  TaskListItem,
  TaskStatusColumn,
  TaskItem,
  CustomFieldDefinition,
  TaskCustomFieldValue,
  TaskPriorityLevel,
  TaskSubtaskItem,
  TaskAttachmentItem,
  TaskExternalLink,
  TaskCommentItem,
  WhatsappConversation,
  WhatsappMessageItem,
  PaidTrafficCampaign,
  MarketingBlast,
  FinancialEntry,
  OrganizationSettings,
  AccessType,
  ContractType,
  WorkRegime,
  MemberStatus,
  TeamMemberItem,
  MemberHrNoteItem,
  PipelineItem,
  PipelineStageItem,
  DealItem,
  ClientContactItem,
  ActivityTimelineItem,
  WorkspaceSavedViewItem,
  DealPriority,
  TimelineEntityType,
  TimelineEventType,
  SavedViewScope,
} from '@/types/coydash'

const BASE_AGENTS: CoytechAgentSpec[] = [
  {
    id: 'AGENT_1_SALES_QUALIFIER',
    code: 'A1',
    name: 'Agente 01 · Qualificador',
    roleLabel: 'Vendas & triagem WhatsApp 24/7 (< 5s)',
    modelRouted: 'Claude 3.5 Haiku',
    triggerDescription: 'Webhook WhatsApp Cloud API / Direct a cada novo lead inbound',
    status: 'Aguardando você',
    lastDeliverySummary:
      'Pronto para atender leads inbound em menos de 5 segundos e consultar catálogo no ERP.',
    deliveriesToday: 0,
    tools: [
      {
        name: 'query_erp_catalog_and_stock',
        description: 'Consulta disponibilidade de estoque e tabela de preços por CNPJ no ERP.',
        sampleOutput: 'Estoque consultado em tempo real via API.',
      },
      {
        name: 'qualify_lead_and_update_crm',
        description: 'Classifica perfil Mid-Market/Enterprise e atualiza etapa do funil no CRM.',
        sampleOutput: 'Lead qualificado e etapa atualizada no CRM.',
      },
      {
        name: 'book_calendar_or_create_order',
        description: 'Agenda reunião com closer ou gera pré-pedido no Coytech Studio.',
        sampleOutput: 'Pré-pedido enviado para a fila do Coytech Studio.',
      },
    ],
  },
  {
    id: 'AGENT_2_RECOVERY_BILLING',
    code: 'A2',
    name: 'Agente 02 · Recuperador',
    roleLabel: 'Cobrança inteligente & recuperação de vendas',
    modelRouted: 'Claude 3.7 Sonnet',
    triggerDescription: 'Cron diário 09h00 + Webhook de abandono de checkout ou boleto vencido',
    status: 'Aguardando você',
    lastDeliverySummary:
      'Pronto para reemitir Pix/Boleto e submeter descontos acima da alçada para a fila 1-clique.',
    deliveriesToday: 0,
    tools: [
      {
        name: 'get_customer_payment_history',
        description: 'Verifica histórico de adimplência e LTV do cliente antes de negociar.',
        sampleOutput: 'Histórico financeiro verificado no ERP.',
      },
      {
        name: 'reissue_pix_or_boleto',
        description: 'Gera 2ª via atualizada ou Pix Copia e Cola no gateway bancário.',
        sampleOutput: 'Pix Copia e Cola emitido e enviado no WhatsApp.',
      },
      {
        name: 'submit_discount_for_1click_approval',
        description: 'Envia exceção de desconto (> alçada automática) para a fila 1-Clique.',
        sampleOutput: 'Solicitação inserida em studio_approval_queues.',
      },
    ],
  },
  {
    id: 'AGENT_3_SUPPORT_TIER1',
    code: 'A3',
    name: 'Agente 03 · Suporte N1',
    roleLabel: 'Atendimento autônomo RAG (> 70% resolução)',
    modelRouted: 'Claude 3.5 Haiku',
    triggerDescription: 'Chamados via WhatsApp / Portal do Cliente',
    status: 'Aguardando você',
    lastDeliverySummary:
      'Pronto para responder dúvidas com base nos manuais indexados no pgvector e consultar XML SEFAZ.',
    deliveriesToday: 0,
    tools: [
      {
        name: 'search_company_knowledge_rag',
        description: 'Busca semântica em knowledge_and_runbooks (pgvector 1536 dims).',
        sampleOutput: 'Trecho recuperado da base vetorial da organização.',
      },
      {
        name: 'fetch_order_or_invoice_status',
        description: 'Consulta rastreio logístico e baixa XML/DANFE autorizado na SEFAZ.',
        sampleOutput: 'DANFE e XML localizados e enviados ao cliente.',
      },
    ],
  },
  {
    id: 'AGENT_4_CUSTOMER_SUCCESS_LTV',
    code: 'A4',
    name: 'Agente 04 · Sucesso LTV',
    roleLabel: 'Retenção, Health Score & Relatório Segunda 08h',
    modelRouted: 'Claude 3.7 Sonnet',
    triggerDescription: 'Cron toda segunda-feira 08h00 (America/Sao_Paulo) + QBR 90 dias',
    status: 'Aguardando você',
    lastDeliverySummary:
      'Pronto para consolidar horas poupadas, receita protegida e gerar o resumo de segunda-feira às 08h.',
    deliveriesToday: 0,
    tools: [
      {
        name: 'calculate_tenant_health_score',
        description: 'Avalia adoção semanal do portal e tempo médio de resposta nas filas.',
        sampleOutput: 'Health Score atualizado com base no uso real.',
      },
      {
        name: 'generate_monday_8am_value_report',
        description: 'Consolida execuções n8n, horas poupadas e receita protegida.',
        sampleOutput: 'Relatório semanal gravado em ltv_weekly_reports.',
      },
    ],
  },
  {
    id: 'AGENT_5_SRE_INVESTIGATOR',
    code: 'A5',
    name: 'Agente 05 · SRE Copilot',
    roleLabel: 'Investigação de causa raiz em < 60s & BIA',
    modelRouted: 'Claude 3.7 Sonnet',
    triggerDescription: 'Webhook Coytech Pulse em incidentes P1/P2 ou queda silenciosa de vendas',
    status: 'Aguardando você',
    lastDeliverySummary:
      'Monitorando as 4 camadas (Zabbix, APM, Playwright e SEFAZ/Pix) para diagnóstico em menos de 60s.',
    deliveriesToday: 0,
    tools: [
      {
        name: 'fetch_correlated_telemetry',
        description: 'Cruza métricas Zabbix 7.0 LTS, logs n8n e sonda SEFAZ/Pix.',
        sampleOutput: 'Telemetria das 4 camadas correlacionada.',
      },
      {
        name: 'calculate_live_bia_exposure',
        description: 'Multiplica minutos de degradação pelo custo/minuto na matriz BIA.',
        sampleOutput: 'Exposição financeira calculada em R$/minuto.',
      },
    ],
  },
]

const PERSONAS: PersonaProfile[] = [
  {
    id: 'persona-ceo',
    name: 'Diretoria Executiva',
    shortRole: 'CEO / Sócios',
    personaTitle: 'Visão CEO · Diretoria',
    role: 'CLIENT_CEO_DIRECTOR',
    email: '',
    whatsapp: '',
    focusDescription: 'Foco em ROI, BIA R$/minuto, Painel Executivo Mobile e Alçada.',
    primaryModule: 'Painel Mobile & BIA',
  },
  {
    id: 'persona-coo',
    name: 'Diretoria de Operações',
    shortRole: 'COO / Operações',
    personaTitle: 'Visão COO · Operações',
    role: 'CLIENT_COO_MANAGER',
    email: '',
    whatsapp: '',
    focusDescription: 'Foco em Filas SLA ao vivo, Aprovação em 1 Clique (< 3s) e Fim de Planilhas.',
    primaryModule: 'Coytech Studio',
  },
  {
    id: 'persona-cto',
    name: 'Liderança de TI',
    shortRole: 'CTO / Head de TI',
    personaTitle: 'Visão CTO · Governança TI',
    role: 'CLIENT_CTO_IT',
    email: '',
    whatsapp: '',
    focusDescription: 'Foco em Redução >75% de Alarmes Falsos, Gateway LiteLLM e Soberania.',
    primaryModule: 'Pulse & LiteLLM',
  },
  {
    id: 'persona-sre',
    name: 'Engenharia NOC / SRE',
    shortRole: 'DevOps / SRE',
    personaTitle: 'Visão SRE · Observabilidade',
    role: 'COYTECH_SRE',
    email: '',
    whatsapp: '',
    focusDescription: 'Foco em 4 Camadas (Zabbix/APM/Playwright/SEFAZ) e Agente 05 SRE.',
    primaryModule: 'Coytech Pulse NOC',
  },
]

const EMPTY_ORG: Organization = {
  id: 'org-default',
  name: 'Sua Operação',
  slug: 'sua-operacao',
  cnpj: '',
  sector: 'Operações B2B',
  tier: 'MID_MARKET',
  current_stage: 'STAGE_1_ONBOARDING',
  google_drive_folder_url: '',
  whatsapp_group_jid: '',
  litellm_virtual_key_id: 'sk-coytech-clean',
  litellm_monthly_budget: 2500,
  litellm_current_spend: 0,
  monthly_mrr_value: 0,
  setup_fee_value: 0,
  kickoff_completed_at: null,
  golive_completed_at: null,
  next_qbr_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  health_score: 100,
  hourly_revenue_live: 0,
  hourly_revenue_avg: 0,
  conversion_rate_live: 0,
  conversion_rate_avg: 0,
}

const DEFAULT_ORG_SETTINGS: OrganizationSettings = {
  organization_id: 'org-default',
  daily_budget_ads: 70,
  cashback_enabled: true,
  cashback_percent: 5,
  hunger_coupon_enabled: true,
  ai_auto_accept: true,
  handoff_only_on_insistence: true,
  selected_gateway: 'MERCADO_PAGO',
  gateway_status: 'NOT_CONFIGURED',
  pix_key: '',
  whatsapp_number: '+55 11 99999-0000',
  integrations_state: {
    whatsapp_cloud: true,
    meta_ads: true,
    google_ads: true,
    erp_webhook: true,
  },
}

const DEFAULT_PIPELINE_STAGES_SPEC = [
  { name: 'Novo Lead / Diagnóstico', probability_percent: 10, color: '#38bdf8', is_won: false, is_lost: false, stage_order: 0 },
  { name: 'Qualificação & BIA', probability_percent: 25, color: '#e8c14a', is_won: false, is_lost: false, stage_order: 1 },
  { name: 'Reunião de Apresentação', probability_percent: 50, color: '#8f7dff', is_won: false, is_lost: false, stage_order: 2 },
  { name: 'Proposta Enviada', probability_percent: 75, color: '#f0521f', is_won: false, is_lost: false, stage_order: 3 },
  { name: 'Contrato Fechado', probability_percent: 100, color: '#2f9e5a', is_won: true, is_lost: false, stage_order: 4 },
  { name: 'Perdido / Desqualificado', probability_percent: 0, color: '#ef4444', is_won: false, is_lost: true, stage_order: 5 },
]

export const DEFAULT_INITIAL_PIPELINE: PipelineItem = {
  id: 'pipe-coytech-default',
  organization_id: 'org-default',
  name: '🚀 Novos Clientes Coytech',
  is_default: true,
  color: '#F0521F',
  created_at: new Date().toISOString(),
}

export const DEFAULT_INITIAL_STAGES: PipelineStageItem[] = DEFAULT_PIPELINE_STAGES_SPEC.map((s, idx) => ({
  id: `stage-${idx + 1}-${s.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
  organization_id: 'org-default',
  pipeline_id: 'pipe-coytech-default',
  name: s.name,
  stage_order: s.stage_order,
  probability_percent: s.probability_percent,
  color: s.color,
  is_won: s.is_won,
  is_lost: s.is_lost,
  created_at: new Date().toISOString(),
}))

interface CreateQueueInput {
  queue_type: QueueType
  title: string
  reference_code?: string
  requester_name?: string
  amount_value: number
  sla_minutes?: number
  notes?: string
}

interface AddSpreadsheetInput {
  sheet_name: string
  department: string
  rows_count: number
  replaced_by_module: string
}

interface CreateIncidentInput {
  title: string
  bia_process_id?: string
  priority: IncidentPriority
  is_silent_business_drop?: boolean
  ai_sre_root_cause_summary?: string
  ai_sre_recommended_action?: string
}

interface CreateFlowRunInput {
  workflow_name: string
  agent_used: AgentClass
  status: 'SUCCESS' | 'RETRIED_SUCCESS' | 'CONTINGENCY_QUEUED' | 'FAILED'
  manual_minutes_saved: number
  financial_value_processed: number
  summary_result: string
}

interface AddKnowledgeInput {
  doc_category: 'COMPANY_SOP' | 'COMMERCIAL_POLICY' | 'SRE_RUNBOOK' | 'ERP_API_DOC'
  title: string
  content_chunk: string
}

interface AddCredentialInput {
  service_name: string
  pilar: 'STUDIO' | 'FLOW' | 'PULSE'
  endpoint_or_host: string
}

interface CoyDashContextValue {
  isLoading: boolean
  authenticatedUser: { id: string; name: string; email: string; role: string } | null
  searchQuery: string
  setSearchQuery: (q: string) => void
  organizations: Organization[]
  currentOrg: Organization
  setCurrentOrgId: (id: string) => void
  createNewOrganization: (input: {
    name: string
    sector: string
    tier: 'MID_MARKET' | 'ENTERPRISE'
    mrr?: number
    setupFee?: number
    hourlyRevenue?: number
  }) => Promise<void>
  updateOrganizationMetrics: (updates: Partial<Organization>) => Promise<void>
  personas: PersonaProfile[]
  currentPersona: PersonaProfile
  setCurrentPersonaId: (id: string) => void
  agents: CoytechAgentSpec[]
  activeAgentDrawer: CoytechAgentSpec | null
  setActiveAgentDrawer: (agent: CoytechAgentSpec | null) => void
  approvalQueues: StudioApprovalItem[]
  createQueueItem: (input: CreateQueueInput) => Promise<void>
  decideApprovalOneClick: (queueId: string, decision: ApprovalStatus) => Promise<void>
  deleteQueueItem: (queueId: string) => Promise<void>
  auditLogs: StudioAuditLog[]
  spreadsheets: LegacySpreadsheet[]
  addSpreadsheet: (input: AddSpreadsheetInput) => Promise<void>
  updateSpreadsheetStatus: (
    sheetId: string,
    status: 'PARALLEL_ACTIVE' | 'MIGRATED_POSTGRES' | 'READ_ONLY_LOCKED'
  ) => Promise<void>
  lockAllLegacySpreadsheets: () => Promise<void>
  biaProcesses: BiaCriticalProcess[]
  addBiaProcess: (name: string, layer: MonitoringLayer, costPerHour: number) => Promise<void>
  updateBiaStatus: (
    processId: string,
    status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL_DOWN'
  ) => Promise<void>
  deleteBiaProcess: (processId: string) => Promise<void>
  incidents: PulseIncident[]
  createIncident: (input: CreateIncidentInput) => Promise<void>
  triggerSilentBusinessDropSimulation: () => Promise<void>
  resolveIncidentWithSreAi: (incidentId: string) => Promise<void>
  flowRuns: FlowAutomationRun[]
  createFlowRun: (input: CreateFlowRunInput) => Promise<void>
  knowledgeChunks: KnowledgeChunk[]
  addKnowledgeDoc: (input: AddKnowledgeInput) => Promise<void>
  deleteKnowledgeDoc: (docId: string) => Promise<void>
  weeklyReports: LtvWeeklyReport[]
  generateMonday8amReportNow: () => Promise<void>
  credentials: CredentialValidationItem[]
  addCredential: (input: AddCredentialInput) => Promise<void>
  validateAllPreKickoffCredentials: () => Promise<void>
  deleteCredential: (credentialId: string) => Promise<void>
  goliveSteps: {
    stepA_pulseActive: boolean
    stepB_studioFlowActive: boolean
    stepC_lockSheets: boolean
  }
  executeGoLiveStep: (step: 'A' | 'B' | 'C') => Promise<void>
  offboarding: OffboardingState
  executeOffboardingAction: (
    action: 'ACCEPT_PASSIVE' | 'EXPORT_ASSETS' | 'REVOKE_KEYS_LGPD' | 'SIGN_TERM'
  ) => Promise<void>
  sendTaskToAgent: (agentId: AgentClass, taskText: string) => Promise<void>
  updateOrganizationStage: (stage: LifecycleStage) => Promise<void>
  triggerOnboarding5MinAutomation: () => Promise<void>
  refreshFromDatabase: (orgIdOverride?: string) => Promise<void>

  // =========================================================================
  // NOVOS MÓDULOS: CLIENTES 360º, TAREFAS & PROJETOS, E RANGOLIVRE
  // =========================================================================
  clients: ClientAccount[]
  clientHistoryEvents: ClientHistoryEvent[]
  clientTeamNotes: ClientTeamNote[]
  createClient: (input: Partial<ClientAccount>) => Promise<void>
  updateClient: (
    clientId: string,
    updates: Partial<ClientAccount>,
    historyTitle?: string,
    historyDesc?: string,
    historyType?: string
  ) => Promise<void>
  deleteClient: (clientId: string) => Promise<void>
  addClientNote: (clientId: string, content: string, noteType?: string) => Promise<void>
  deleteClientNote: (noteId: string) => Promise<void>

  taskFolders: TaskFolderItem[]
  taskLists: TaskListItem[]
  taskStatuses: TaskStatusColumn[]
  tasks: TaskItem[]
  createTaskFolder: (name: string, icon?: string) => Promise<void>
  updateTaskFolder: (folderId: string, name: string, icon: string) => Promise<void>
  deleteTaskFolder: (folderId: string) => Promise<void>
  createTaskList: (folderId: string, name: string, icon?: string) => Promise<string | null>
  updateTaskList: (listId: string, name: string, icon: string) => Promise<void>
  deleteTaskList: (listId: string) => Promise<void>
  createTaskStatus: (listId: string, name: string, color: string, orderIndex: number) => Promise<void>
  updateTaskStatusColumn: (
    statusId: string,
    updates: { name?: string; color?: string; order_index?: number }
  ) => Promise<void>
  deleteTaskStatusColumn: (statusId: string) => Promise<void>
  createTask: (input: Partial<TaskItem>) => Promise<void>
  updateTask: (taskId: string, updates: Partial<TaskItem>) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  addTaskComment: (taskId: string, comment: TaskCommentItem) => Promise<void>
  customFieldDefs: CustomFieldDefinition[]
  createCustomFieldDef: (def: Partial<CustomFieldDefinition>) => Promise<void>
  deleteCustomFieldDef: (defId: string) => Promise<void>

  whatsappConversations: WhatsappConversation[]
  createWhatsappConv: (input: {
    contact_name: string
    contact_phone: string
    client_id?: string | null
    initial_message?: string
    ai_reply?: string
    ai_memory?: string[]
  }) => Promise<void>
  sendOperatorWhatsappMessage: (convId: string, text: string) => Promise<void>
  simulateCustomerWhatsappAudio: (convId: string) => Promise<void>
  toggleWhatsappHandoff: (convId: string, handoffToHuman: boolean) => Promise<void>
  addWhatsappMemory: (convId: string, memoryText: string) => Promise<void>
  acceptWhatsappDraftOrder: (convId: string) => Promise<void>
  deleteWhatsappConv: (convId: string) => Promise<void>

  paidCampaigns: PaidTrafficCampaign[]
  createPaidCampaign: (input: Partial<PaidTrafficCampaign>) => Promise<void>
  togglePaidCampaignStatus: (campaignId: string) => Promise<void>
  toggleChampionOffer: (campaignId: string) => Promise<void>
  deletePaidCampaign: (campaignId: string) => Promise<void>

  marketingBlasts: MarketingBlast[]
  createMarketingBlast: (input: Partial<MarketingBlast>) => Promise<void>
  deleteMarketingBlast: (blastId: string) => Promise<void>

  financialEntries: FinancialEntry[]
  createFinancialEntry: (input: Partial<FinancialEntry>) => Promise<void>
  deleteFinancialEntry: (entryId: string) => Promise<void>

  orgSettings: OrganizationSettings
  updateOrgSettings: (updates: Partial<OrganizationSettings>) => Promise<void>

  orgMembers: TeamMemberItem[]
  hrNotes: MemberHrNoteItem[]
  currentUserPermissions: {
    role: string
    access_type: AccessType
    sector: string
    job_title: string
    allowed_screens: string[]
    allowed_folder_ids: string[]
    allowed_list_ids: string[]
  } | null
  inviteTeamMember: (input: {
    full_name: string
    email: string
    whatsapp_phone?: string
    whatsapp?: string
    role?: string
    access_type?: AccessType
    sector?: string
    job_title?: string
    birth_date?: string | null
    contract_type?: ContractType
    hiring_date?: string | null
    salary_amount?: number
    payment_info?: string
    work_regime?: WorkRegime
    member_status?: MemberStatus
    emergency_contact?: string
    contract_document_url?: string
    allowed_screens?: string[]
    allowed_folder_ids?: string[]
    allowed_list_ids?: string[]
  }) => Promise<{
    ok: boolean
    emailSent?: boolean
    alreadyRegistered?: boolean
    inviteLink?: string
    directLoginUrl?: string
    token?: string
    error?: string
  }>
  updateTeamMember: (memberId: string, updates: Partial<TeamMemberItem>) => Promise<void>
  deleteTeamMember: (memberId: string) => Promise<void>
  createHrNote: (memberId: string, content: string, category?: string) => Promise<void>
  deleteHrNote: (noteId: string) => Promise<void>

  // ============================================================================
  // COYCRM — TWENTY CRM REVERSE ENGINEERING: PIPELINES, DEALS, CONTATOS & TIMELINE
  // ============================================================================
  pipelines: PipelineItem[]
  pipelineStages: PipelineStageItem[]
  deals: DealItem[]
  clientContacts: ClientContactItem[]
  activityTimeline: ActivityTimelineItem[]
  savedViews: WorkspaceSavedViewItem[]

  createPipeline: (
    name: string,
    color?: string,
    stages?: Partial<PipelineStageItem>[]
  ) => Promise<PipelineItem | null>
  updatePipeline: (pipelineId: string, updates: Partial<PipelineItem>) => Promise<void>
  deletePipeline: (pipelineId: string) => Promise<void>

  createDeal: (input: Partial<DealItem>) => Promise<DealItem | null>
  updateDeal: (dealId: string, updates: Partial<DealItem>) => Promise<void>
  updateDealStage: (dealId: string, stageId: string) => Promise<void>
  deleteDeal: (dealId: string) => Promise<void>
  convertDealToClient: (
    dealId: string,
    options?: {
      clientName?: string
      cnpj?: string
      sector?: string
      contactName?: string
      contactPhone?: string
      contactEmail?: string
    }
  ) => Promise<string | null>

  createClientContact: (input: Partial<ClientContactItem>) => Promise<ClientContactItem | null>
  updateClientContact: (contactId: string, updates: Partial<ClientContactItem>) => Promise<void>
  deleteClientContact: (contactId: string) => Promise<void>

  logActivityTimeline: (input: {
    entity_type: TimelineEntityType
    entity_id: string
    event_type: TimelineEventType
    title: string
    description?: string
    metadata?: Record<string, unknown>
  }) => Promise<void>

  saveWorkspaceView: (
    view: Partial<WorkspaceSavedViewItem> & {
      view_scope: SavedViewScope
      name: string
    }
  ) => Promise<WorkspaceSavedViewItem | null>
  deleteWorkspaceView: (viewId: string) => Promise<void>
}

const CoyDashContext = createContext<CoyDashContextValue | null>(null)

function formatTimeOrDate(iso?: string | null) {
  if (!iso) return 'Agora'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function calcSlaMinutesRemaining(slaDueAt?: string | null) {
  if (!slaDueAt) return 30
  const diff = Math.round((new Date(slaDueAt).getTime() - Date.now()) / 60000)
  return Math.max(0, diff)
}

function mapRawTask(t: Record<string, unknown>): TaskItem {
  return {
    id: String(t.id),
    organization_id: String(t.organization_id),
    list_id: t.list_id ? String(t.list_id) : null,
    client_id: t.client_id ? String(t.client_id) : null,
    client_name_snapshot: String(t.client_name_snapshot || ''),
    status_id: t.status_id ? String(t.status_id) : null,
    status_key: String(t.status_key || 'A FAZER'),
    title: String(t.title || ''),
    description: String(t.description || ''),
    priority: (t.priority as TaskPriorityLevel) || 'medium',
    assignee_name: String(t.assignee_name || ''),
    assignees: Array.isArray(t.assignees)
      ? (t.assignees as string[])
      : t.assignee_name
        ? [String(t.assignee_name)]
        : [],
    start_date: t.start_date ? String(t.start_date) : null,
    due_date: t.due_date ? String(t.due_date) : null,
    time_estimate: t.time_estimate ? String(t.time_estimate) : null,
    time_spent_seconds: Number(t.time_spent_seconds || 0),
    is_tracking_time: Boolean(t.is_tracking_time),
    tags: Array.isArray(t.tags) ? (t.tags as string[]) : [],
    custom_fields: Array.isArray(t.custom_fields)
      ? (t.custom_fields as TaskCustomFieldValue[])
      : [],
    subtasks: Array.isArray(t.subtasks)
      ? (t.subtasks as any[]).map((s) => ({
        id: String(s.id || `sub_${Math.random().toString(36).substring(2, 7)}`),
        title: String(s.title || ''),
        is_completed: Boolean(s.is_completed ?? s.completed),
        due_date: s.due_date ? String(s.due_date) : undefined,
        assignee: s.assignee ? String(s.assignee) : undefined,
      }))
      : [],
    comments: Array.isArray(t.comments)
      ? (t.comments as any[]).map((c) => ({
        id: String(c.id || `comm_${Math.random().toString(36).substring(2, 7)}`),
        author_name: String(c.author_name || c.user_name || 'Membro'),
        author_avatar: c.author_avatar ? String(c.author_avatar) : undefined,
        content: String(c.content || c.text || ''),
        audio_url: c.audio_url ? String(c.audio_url) : undefined,
        attachments: Array.isArray(c.attachments) ? c.attachments : [],
        is_system_event: Boolean(c.is_system_event),
        created_at: String(c.created_at || new Date().toISOString()),
      }))
      : [],
    attachments: Array.isArray(t.attachments) ? (t.attachments as TaskAttachmentItem[]) : [],
    links: Array.isArray(t.links) ? (t.links as TaskExternalLink[]) : [],
    linked_task_ids: Array.isArray(t.linked_task_ids) ? (t.linked_task_ids as string[]) : [],
    parent_task_id: t.parent_task_id ? String(t.parent_task_id) : null,
    origin_reference: t.origin_reference ? String(t.origin_reference) : '',
    created_at: formatTimeOrDate(t.created_at as string),
  }
}

export function CoyDashProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [authenticatedUser, setAuthenticatedUser] = useState<{
    id: string
    name: string
    email: string
    role: string
  } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrgId, setCurrentOrgIdState] = useState<string>('')
  const [currentPersonaId, setCurrentPersonaId] = useState<string>('persona-ceo')
  const [agents, setAgents] = useState<CoytechAgentSpec[]>(BASE_AGENTS)
  const [activeAgentDrawer, setActiveAgentDrawer] = useState<CoytechAgentSpec | null>(null)

  const [approvalQueues, setApprovalQueues] = useState<StudioApprovalItem[]>([])
  const [auditLogs, setAuditLogs] = useState<StudioAuditLog[]>([])
  const [spreadsheets, setSpreadsheets] = useState<LegacySpreadsheet[]>([])
  const [biaProcesses, setBiaProcesses] = useState<BiaCriticalProcess[]>([])
  const [incidents, setIncidents] = useState<PulseIncident[]>([])
  const [flowRuns, setFlowRuns] = useState<FlowAutomationRun[]>([])
  const [knowledgeChunks, setKnowledgeChunks] = useState<KnowledgeChunk[]>([])
  const [weeklyReports, setWeeklyReports] = useState<LtvWeeklyReport[]>([])
  const [credentials, setCredentials] = useState<CredentialValidationItem[]>([])

  // Novos Estados: Clientes, Tarefas, Atendimento, Tráfego, Marketing, Financeiro, Configurações
  const [clients, setClients] = useState<ClientAccount[]>([])
  const [clientHistoryEvents, setClientHistoryEvents] = useState<ClientHistoryEvent[]>([])
  const [clientTeamNotes, setClientTeamNotes] = useState<ClientTeamNote[]>([])

  const [taskFolders, setTaskFolders] = useState<TaskFolderItem[]>([])
  const [taskLists, setTaskLists] = useState<TaskListItem[]>([])
  const [taskStatuses, setTaskStatuses] = useState<TaskStatusColumn[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDefinition[]>([])

  const [whatsappConversations, setWhatsappConversations] = useState<WhatsappConversation[]>([])
  const [paidCampaigns, setPaidCampaigns] = useState<PaidTrafficCampaign[]>([])
  const [marketingBlasts, setMarketingBlasts] = useState<MarketingBlast[]>([])
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>([])
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings>(DEFAULT_ORG_SETTINGS)
  const [orgMembers, setOrgMembers] = useState<TeamMemberItem[]>([])
  const [hrNotes, setHrNotes] = useState<MemberHrNoteItem[]>([])
  const [currentUserPermissions, setCurrentUserPermissions] = useState<{
    role: string
    access_type: AccessType
    sector: string
    job_title: string
    allowed_screens: string[]
    allowed_folder_ids: string[]
    allowed_list_ids: string[]
  } | null>(null)

  // CoyCRM: Pipelines, Estágios, Oportunidades (Deals), Contatos 1:N, Timeline e Visões Salvas
  const [pipelines, setPipelines] = useState<PipelineItem[]>([DEFAULT_INITIAL_PIPELINE])
  const [pipelineStages, setPipelineStages] = useState<PipelineStageItem[]>(DEFAULT_INITIAL_STAGES)
  const [deals, setDeals] = useState<DealItem[]>([])
  const [clientContacts, setClientContacts] = useState<ClientContactItem[]>([])
  const [activityTimeline, setActivityTimeline] = useState<ActivityTimelineItem[]>([])
  const [savedViews, setSavedViews] = useState<WorkspaceSavedViewItem[]>([])

  const [goliveSteps, setGoliveSteps] = useState({
    stepA_pulseActive: false,
    stepB_studioFlowActive: false,
    stepC_lockSheets: false,
  })

  const [offboarding, setOffboarding] = useState<OffboardingState>({
    organization_id: '',
    active: false,
    current_day: 1,
    exit_reason: 'Avaliação de encerramento ou migração para plano passivo',
    passive_plan_offered: false,
    retained_on_passive_plan: false,
    git_repo_exported: false,
    db_dump_exported: false,
    n8n_json_exported: false,
    zabbix_templates_exported: false,
    litellm_key_revoked: false,
    vpn_and_vault_wiped: false,
    handover_term_signed: false,
    followup_60d_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
    followup_120d_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toLocaleDateString(
      'pt-BR'
    ),
  })

  const currentOrg =
    organizations.find((o) => o.id === currentOrgId) || organizations[0] || EMPTY_ORG

  const basePersona = PERSONAS.find((p) => p.id === currentPersonaId) || PERSONAS[0]
  const currentPersona: PersonaProfile = {
    ...basePersona,
    name: authenticatedUser?.name || basePersona.name,
    email: authenticatedUser?.email || basePersona.email,
  }

  const refreshFromDatabase = useCallback(async (orgIdOverride?: string) => {
    try {
      setIsLoading(true)
      const targetOrg = orgIdOverride || currentOrgId
      const url = targetOrg
        ? `/api/coydash/sync?orgId=${encodeURIComponent(targetOrg)}`
        : '/api/coydash/sync'

      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) {
        setIsLoading(false)
        return
      }

      const data = await res.json()
      if (!data.authenticated) {
        setIsLoading(false)
        return
      }

      setAuthenticatedUser(data.user)

      const mappedOrgs: Organization[] = (data.organizations || []).map(
        (o: Record<string, unknown>) => ({
          id: String(o.id),
          name: String(o.name || 'Operação'),
          slug: String(o.slug || 'operacao'),
          cnpj: String(o.cnpj || ''),
          sector: String(o.sector || 'Operações B2B'),
          tier: (o.tier as 'MID_MARKET' | 'ENTERPRISE') || 'MID_MARKET',
          current_stage: (o.current_stage as LifecycleStage) || 'STAGE_1_ONBOARDING',
          google_drive_folder_url: String(o.google_drive_folder_url || ''),
          whatsapp_group_jid: String(o.whatsapp_group_jid || ''),
          litellm_virtual_key_id: String(o.litellm_virtual_key_id || 'sk-coytech-tenant'),
          litellm_monthly_budget: Number(o.litellm_monthly_budget ?? 2500),
          litellm_current_spend: Number(o.litellm_current_spend ?? 0),
          monthly_mrr_value: Number(o.monthly_mrr_value ?? 0),
          setup_fee_value: Number(o.setup_fee_value ?? 0),
          kickoff_completed_at: o.kickoff_completed_at ? String(o.kickoff_completed_at) : null,
          golive_completed_at: o.golive_completed_at ? String(o.golive_completed_at) : null,
          next_qbr_date: o.next_qbr_date
            ? new Date(String(o.next_qbr_date)).toLocaleDateString('pt-BR')
            : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
          health_score: 100,
          hourly_revenue_live: Number(o.hourly_revenue_live ?? 0),
          hourly_revenue_avg: Number(o.hourly_revenue_avg ?? 0),
          conversion_rate_live: Number(o.conversion_rate_live ?? 0),
          conversion_rate_avg: Number(o.conversion_rate_avg ?? 0),
        })
      )

      setOrganizations(mappedOrgs)
      if (data.activeOrgId) {
        setCurrentOrgIdState(data.activeOrgId)
      }

      const activeRawOrg = (data.organizations || []).find(
        (o: Record<string, unknown>) => o.id === data.activeOrgId
      )
      if (activeRawOrg) {
        setGoliveSteps({
          stepA_pulseActive: Boolean(activeRawOrg.golive_step_a_pulse),
          stepB_studioFlowActive: Boolean(activeRawOrg.golive_step_b_studio_flow),
          stepC_lockSheets: Boolean(activeRawOrg.golive_step_c_lock_sheets),
        })
      }

      // Mapear BIA
      const mappedBia: BiaCriticalProcess[] = (data.biaProcesses || []).map(
        (b: Record<string, unknown>) => {
          const costHour = Number(b.cost_per_hour_stopped || 0)
          return {
            id: String(b.id),
            organization_id: String(b.organization_id),
            process_name: String(b.process_name),
            layer: (b.layer as MonitoringLayer) || 'LAYER_1_INFRA_ZABBIX',
            cost_per_hour_stopped: costHour,
            cost_per_minute_stopped: Number(
              b.cost_per_minute_stopped ?? Number((costHour / 60).toFixed(2))
            ),
            external_monitor_id: String(b.external_monitor_id || 'MON-01'),
            current_status:
              (b.current_status as 'HEALTHY' | 'DEGRADED' | 'CRITICAL_DOWN') || 'HEALTHY',
            latency_ms: Number(b.latency_ms ?? 85),
            last_checked_at: formatTimeOrDate(b.last_checked_at as string),
          }
        }
      )
      setBiaProcesses(mappedBia)

      // Mapear Incidentes
      const mappedIncidents: PulseIncident[] = (data.incidents || []).map(
        (inc: Record<string, unknown>) => {
          const linkedBia = mappedBia.find((b) => b.id === inc.bia_process_id)
          const costMin =
            Number(inc.cost_per_minute_snapshot) || linkedBia?.cost_per_minute_stopped || 1000
          return {
            id: String(inc.id),
            organization_id: String(inc.organization_id),
            bia_process_id: String(inc.bia_process_id || ''),
            process_name:
              String(inc.process_name_snapshot || '') ||
              linkedBia?.process_name ||
              'Processo Crítico',
            priority: (inc.priority as IncidentPriority) || 'P1_CRITICAL_15MIN',
            status: (inc.status as PulseIncident['status']) || 'OPEN',
            title: String(inc.title),
            is_silent_business_drop: Boolean(inc.is_silent_business_drop),
            suppressed_duplicate_alerts_count: Number(inc.suppressed_duplicate_alerts_count ?? 0),
            ai_sre_root_cause_summary: inc.ai_sre_root_cause_summary
              ? String(inc.ai_sre_root_cause_summary)
              : null,
            ai_sre_recommended_action: inc.ai_sre_recommended_action
              ? String(inc.ai_sre_recommended_action)
              : null,
            detected_at: formatTimeOrDate(inc.detected_at as string),
            acknowledged_at: inc.acknowledged_at
              ? formatTimeOrDate(inc.acknowledged_at as string)
              : null,
            resolved_at: inc.resolved_at ? formatTimeOrDate(inc.resolved_at as string) : null,
            downtime_minutes: 0,
            cost_per_minute: costMin,
            estimated_financial_loss_avoided: Number(inc.estimated_financial_loss_avoided ?? 0),
          }
        }
      )
      setIncidents(mappedIncidents)

      // Mapear Filas Studio
      const mappedQueues: StudioApprovalItem[] = (data.approvalQueues || []).map(
        (q: Record<string, unknown>) => ({
          id: String(q.id),
          organization_id: String(q.organization_id),
          queue_type: (q.queue_type as QueueType) || 'PURCHASE_ORDER',
          title: String(q.title),
          requester_name: String(q.requester_name || 'Operação'),
          reference_code: String(q.reference_code || '#ERP'),
          amount_value: Number(q.amount_value ?? 0),
          payload_summary: (q.payload_summary as Record<string, string | number>) || {},
          status: (q.status as ApprovalStatus) || 'PENDING',
          sla_due_at: formatTimeOrDate(q.sla_due_at as string),
          sla_minutes_remaining: calcSlaMinutesRemaining(q.sla_due_at as string),
          decided_by_name: q.decided_by_name ? String(q.decided_by_name) : undefined,
          decided_at: q.decided_at ? formatTimeOrDate(q.decided_at as string) : undefined,
          created_at: formatTimeOrDate(q.created_at as string),
        })
      )
      setApprovalQueues(mappedQueues)

      // Mapear Audit Logs
      const mappedLogs: StudioAuditLog[] = (data.auditLogs || []).map(
        (l: Record<string, unknown>) => {
          const meta = (l.metadata as Record<string, unknown>) || {}
          return {
            id: String(l.id),
            organization_id: String(l.organization_id),
            actor_name: String(l.actor_name || data.user?.name || 'Usuário'),
            actor_role: 'CLIENT_CEO_DIRECTOR',
            action_type: String(l.action_type),
            entity_table: String(l.entity_table),
            entity_id: String(l.entity_id || ''),
            ip_address: String(l.ip_address || '127.0.0.1'),
            payload_before: (meta.payload_before as Record<string, unknown>) || {},
            payload_after: (meta.payload_after as Record<string, unknown>) || {},
            created_at: formatTimeOrDate(l.created_at as string),
          }
        }
      )
      setAuditLogs(mappedLogs)

      // Mapear Planilhas Legadas
      const mappedSheets: LegacySpreadsheet[] = (data.spreadsheets || []).map(
        (s: Record<string, unknown>) => ({
          id: String(s.id),
          organization_id: String(s.organization_id),
          sheet_name: String(s.sheet_name),
          department: String(s.department || 'Operações'),
          rows_count: Number(s.rows_count ?? 0),
          status:
            (s.status as 'PARALLEL_ACTIVE' | 'MIGRATED_POSTGRES' | 'READ_ONLY_LOCKED') ||
            'PARALLEL_ACTIVE',
          google_drive_id: String(s.id).slice(0, 8),
          replaced_by_module: String(s.replaced_by_module || 'Coytech Studio'),
        })
      )
      setSpreadsheets(mappedSheets)

      // Mapear Execuções Flow
      const agentNames: Record<string, string> = {
        AGENT_1_SALES_QUALIFIER: 'Agente 01 · Qualificador',
        AGENT_2_RECOVERY_BILLING: 'Agente 02 · Recuperador',
        AGENT_3_SUPPORT_TIER1: 'Agente 03 · Suporte N1',
        AGENT_4_CUSTOMER_SUCCESS_LTV: 'Agente 04 · Sucesso LTV',
        AGENT_5_SRE_INVESTIGATOR: 'Agente 05 · SRE Copilot',
      }

      const mappedRuns: FlowAutomationRun[] = (data.flowRuns || []).map(
        (r: Record<string, unknown>) => {
          const agClass = (r.agent_used as AgentClass) || 'AGENT_1_SALES_QUALIFIER'
          return {
            id: String(r.id),
            organization_id: String(r.organization_id),
            workflow_name: String(r.workflow_name),
            agent_used: agClass,
            agent_display_name: agentNames[agClass] || 'Workflow n8n',
            n8n_execution_id: String(r.n8n_execution_id || 'n8n-exec'),
            status: (r.status as FlowAutomationRun['status']) || 'SUCCESS',
            manual_minutes_saved: Number(r.manual_minutes_saved ?? 5),
            financial_value_processed: Number(r.financial_value_processed ?? 0),
            tokens_consumed: Number(r.tokens_consumed ?? 0),
            summary_result: String(r.summary_result || ''),
            executed_at: formatTimeOrDate(r.executed_at as string),
          }
        }
      )
      setFlowRuns(mappedRuns)

      setAgents(
        BASE_AGENTS.map((baseAg) => {
          const agRuns = mappedRuns.filter((r) => r.agent_used === baseAg.id)
          if (agRuns.length === 0) return baseAg
          return {
            ...baseAg,
            status: 'Entregue',
            deliveriesToday: agRuns.length,
            lastDeliverySummary: agRuns[0].summary_result || baseAg.lastDeliverySummary,
          }
        })
      )

      // Mapear Conhecimento RAG
      const mappedDocs: KnowledgeChunk[] = (data.knowledgeChunks || []).map(
        (k: Record<string, unknown>) => ({
          id: String(k.id),
          organization_id: String(k.organization_id),
          doc_category:
            (k.doc_category as KnowledgeChunk['doc_category']) || 'COMPANY_SOP',
          title: String(k.title),
          content_chunk: String(k.content_chunk),
          similarity_score: 0.96,
          created_at: formatTimeOrDate(k.created_at as string),
        })
      )
      setKnowledgeChunks(mappedDocs)

      // Mapear Relatórios LTV
      const mappedReports: LtvWeeklyReport[] = (data.weeklyReports || []).map(
        (rep: Record<string, unknown>) => ({
          id: String(rep.id),
          organization_id: String(rep.organization_id),
          week_start: String(rep.week_start),
          week_end: String(rep.week_end),
          total_automated_runs: Number(rep.total_automated_runs ?? 0),
          total_hours_saved: Number(rep.total_hours_saved ?? 0),
          incidents_prevented_count: Number(rep.incidents_prevented_count ?? 0),
          revenue_protected_value: Number(rep.revenue_protected_value ?? 0),
          sla_uptime_percentage: Number(rep.sla_uptime_percentage ?? 99.98),
          sent_via_whatsapp_at: formatTimeOrDate(rep.sent_via_whatsapp_at as string),
        })
      )
      setWeeklyReports(mappedReports)

      // Mapear Credenciais Pré-Kickoff
      const mappedCreds: CredentialValidationItem[] = (data.credentials || []).map(
        (c: Record<string, unknown>) => ({
          id: String(c.id),
          organization_id: String(c.organization_id),
          pilar: (c.pilar as 'STUDIO' | 'FLOW' | 'PULSE') || 'FLOW',
          service_name: String(c.service_name),
          endpoint_or_host: String(c.endpoint_or_host),
          status:
            c.status === 'CONNECTED_VALIDATED'
              ? 'VALIDATED'
              : c.status === 'FAILED_AUTH'
                ? 'ERROR'
                : 'PENDING_TEST',
          latency_ms: Number(c.latency_ms ?? 42),
          last_tested_at: formatTimeOrDate(c.last_tested_at as string),
        })
      )
      setCredentials(mappedCreds)

      // Mapear Offboarding
      if (data.offboarding) {
        const ob = data.offboarding as Record<string, unknown>
        setOffboarding({
          organization_id: String(ob.organization_id),
          active: true,
          current_day: 1,
          exit_reason: String(ob.exit_reason || 'Solicitação de encerramento ou plano passivo'),
          passive_plan_offered: Boolean(ob.passive_plan_offered),
          retained_on_passive_plan: Boolean(ob.retained_on_passive_plan),
          git_repo_exported: Boolean(ob.git_repo_archive_url),
          db_dump_exported: Boolean(ob.db_backup_dump_url),
          n8n_json_exported: Boolean(ob.n8n_workflows_export_url),
          zabbix_templates_exported: Boolean(ob.monitoring_templates_export_url),
          litellm_key_revoked: Boolean(ob.litellm_key_revoked_at),
          vpn_and_vault_wiped: Boolean(ob.vpn_and_vault_wiped_at),
          handover_term_signed: Boolean(ob.signed_handover_term_url),
          followup_60d_date: ob.followup_60d_scheduled_for
            ? String(ob.followup_60d_scheduled_for)
            : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
          followup_120d_date: ob.followup_120d_scheduled_for
            ? String(ob.followup_120d_scheduled_for)
            : new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        })
      }

      // =========================================================================
      // MAPEAR NOVOS MÓDULOS: CLIENTES 360º, TAREFAS & PROJETOS, RANGOLIVRE
      // =========================================================================
      const mappedClients: ClientAccount[] = (data.clients || []).map(
        (c: Record<string, unknown>) => ({
          id: String(c.id),
          organization_id: String(c.organization_id),
          name: String(c.name || 'Cliente'),
          cnpj: String(c.cnpj || ''),
          sector: String(c.sector || 'Advocacia / Serviços'),
          team_squad: String(c.team_squad || 'Sparta'),
          priority: (c.priority as ClientPriority) || 'medium',
          status: (c.status as ClientStatus) || 'ONBOARDING',
          ad_platform: (c.ad_platform as ClientAdPlatform) || 'BOTH',
          service_type: String(c.service_type || 'Tráfego + IA + CRM'),
          is_mc: Boolean(c.is_mc ?? true),
          nps_score: Number(c.nps_score ?? 9),
          last_optimization_date: String(c.last_optimization_date || 'Hoje'),
          ad_spend: Number(c.ad_spend ?? 0),
          ad_results: Number(c.ad_results ?? 0),
          ad_cpr: Number(c.ad_cpr ?? 0),
          ad_balance: Number(c.ad_balance ?? 0),
          mrr_value: Number(c.mrr_value ?? 0),
          setup_fee: Number(c.setup_fee ?? 0),
          traffic_manager_name: String(c.traffic_manager_name || 'Gabrielly Maia'),
          designer_name: String(c.designer_name || 'Felipe Cavalcante'),
          cs_manager_name: String(c.cs_manager_name || 'Débora Carvalho'),
          contact_name: String(c.contact_name || ''),
          contact_phone: String(c.contact_phone || ''),
          contact_email: String(c.contact_email || ''),
          whatsapp_group_link: String(c.whatsapp_group_link || ''),
          drive_folder_link: String(c.drive_folder_link || ''),
          connections: (c.connections as ClientConnections) || {
            meta: 'connected',
            google: 'connected',
            whatsapp: 'connected',
            ai: 'connected',
            crm: 'connected',
            finance: 'connected',
          },
          briefing_data: (c.briefing_data as Record<string, string>) || {},
          commercial_data: (c.commercial_data as Record<string, string>) || {},
          backups_data: (c.backups_data as Record<string, string>) || {},
          agenda_items:
            (c.agenda_items as {
              id: string
              title: string
              date: string
              type: string
              status: string
            }[]) || [],
          created_at: formatTimeOrDate(c.created_at as string),
        })
      )
      setClients(mappedClients)

      const mappedHistory: ClientHistoryEvent[] = (data.clientHistoryEvents || []).map(
        (h: Record<string, unknown>) => ({
          id: String(h.id),
          organization_id: String(h.organization_id),
          client_id: String(h.client_id),
          event_type: String(h.event_type || 'ACTION'),
          title: String(h.title || ''),
          description: String(h.description || ''),
          actor_name: String(h.actor_name || 'Administrador'),
          created_at: formatTimeOrDate(h.created_at as string),
        })
      )
      setClientHistoryEvents(mappedHistory)

      const mappedNotes: ClientTeamNote[] = (data.clientTeamNotes || []).map(
        (n: Record<string, unknown>) => ({
          id: String(n.id),
          organization_id: String(n.organization_id),
          client_id: String(n.client_id),
          note_type: String(n.note_type || 'GERAL'),
          content: String(n.content || ''),
          author_name: String(n.author_name || 'Time'),
          created_at: formatTimeOrDate(n.created_at as string),
        })
      )
      setClientTeamNotes(mappedNotes)

      // Tarefas & Setores com deduplicação de integridade
      const rawFolders: TaskFolderItem[] = (data.taskFolders || []).map((f: Record<string, unknown>) => ({
        id: String(f.id),
        organization_id: String(f.organization_id),
        name: String(f.name || 'Setor'),
        icon: String(f.icon || 'Folder'),
        created_at: String(f.created_at || ''),
      }))
      const uniqueFolders = Array.from(new Map(rawFolders.map((f) => [f.id, f])).values())
      setTaskFolders(uniqueFolders)

      const rawLists: TaskListItem[] = (data.taskLists || []).map((l: Record<string, unknown>) => ({
        id: String(l.id),
        organization_id: String(l.organization_id),
        folder_id: String(l.folder_id),
        name: String(l.name || 'Projeto'),
        icon: String(l.icon || 'List'),
        created_at: String(l.created_at || ''),
      }))
      // Deduplica por id e por (folder_id + name) para garantir que nenhuma lista apareça duplicada na UI
      const uniqueListsMap = new Map<string, TaskListItem>()
      for (const item of rawLists) {
        const key = `${item.folder_id}::${item.name.toLowerCase()}`
        if (!uniqueListsMap.has(key) && !uniqueListsMap.has(item.id)) {
          uniqueListsMap.set(key, item)
        }
      }
      setTaskLists(Array.from(uniqueListsMap.values()))

      setTaskStatuses(
        (data.taskStatuses || []).map((s: Record<string, unknown>) => ({
          id: String(s.id),
          organization_id: String(s.organization_id),
          list_id: String(s.list_id),
          name: String(s.name || 'Status'),
          color: String(s.color || '#64748b'),
          order_index: Number(s.order_index ?? 0),
        }))
      )

      setTasks((data.tasks || []).map(mapRawTask))

      if (Array.isArray(data.customFieldDefs)) {
        setCustomFieldDefs(
          data.customFieldDefs.map((d: Record<string, unknown>) => ({
            id: String(d.id),
            organization_id: String(d.organization_id),
            list_id: d.list_id ? String(d.list_id) : undefined,
            name: String(d.name || ''),
            type: d.type as any,
            options: Array.isArray(d.options) ? (d.options as any) : [],
            scope: (d.scope as any) || 'list',
            is_required: Boolean(d.is_required),
          }))
        )
      }

      // WhatsApp Conversations
      setWhatsappConversations(
        (data.whatsappConversations || []).map((w: Record<string, unknown>) => ({
          id: String(w.id),
          organization_id: String(w.organization_id),
          client_id: w.client_id ? String(w.client_id) : null,
          contact_name: String(w.contact_name || 'Contato'),
          contact_phone: String(w.contact_phone || ''),
          handoff_to_human: Boolean(w.handoff_to_human),
          orders_count: Number(w.orders_count ?? 1),
          total_spent: Number(w.total_spent ?? 0),
          cashback_balance: Number(w.cashback_balance ?? 0),
          ai_memory: (w.ai_memory as string[]) || [],
          draft_order: (w.draft_order as { item: string; price: number }[] | null) || null,
          draft_accepted: Boolean(w.draft_accepted),
          messages: (w.messages as WhatsappMessageItem[]) || [],
          last_message_at: formatTimeOrDate(w.last_message_at as string),
        }))
      )

      // Tráfego Pago
      setPaidCampaigns(
        (data.paidCampaigns || []).map((p: Record<string, unknown>) => ({
          id: String(p.id),
          organization_id: String(p.organization_id),
          client_id: p.client_id ? String(p.client_id) : null,
          campaign_name: String(p.campaign_name || ''),
          platform: String(p.platform || 'Meta Ads · Instagram + Facebook'),
          note: String(p.note || ''),
          daily_budget: Number(p.daily_budget ?? 50),
          spent_week: Number(p.spent_week ?? 0),
          ctr_percent: Number(p.ctr_percent ?? 3.8),
          conversions_count: Number(p.conversions_count ?? 0),
          revenue_attributed: Number(p.revenue_attributed ?? 0),
          roas: Number(p.roas ?? 0),
          is_champion_offer: Boolean(p.is_champion_offer),
          status: String(p.status || 'ACTIVE'),
        }))
      )

      // Marketing Blasts
      setMarketingBlasts(
        (data.marketingBlasts || []).map((m: Record<string, unknown>) => ({
          id: String(m.id),
          organization_id: String(m.organization_id),
          campaign_name: String(m.campaign_name || ''),
          segment_label: String(m.segment_label || 'Todos os clientes'),
          scheduled_for: String(m.scheduled_for || 'Hoje'),
          delivered_count: Number(m.delivered_count ?? 0),
          read_count: Number(m.read_count ?? 0),
          conversions_count: Number(m.conversions_count ?? 0),
        }))
      )

      // Financeiro
      setFinancialEntries(
        (data.financialEntries || []).map((fe: Record<string, unknown>) => ({
          id: String(fe.id),
          organization_id: String(fe.organization_id),
          item_name: String(fe.item_name || ''),
          category:
            (fe.category as FinancialEntry['category']) || 'RECEITA_SERVICO',
          channel: String(fe.channel || 'WhatsApp IA Direto'),
          quantity_sold: Number(fe.quantity_sold ?? 1),
          margin_percent: Number(fe.margin_percent ?? 65),
          amount_value: Number(fe.amount_value ?? 0),
          health_tag: (fe.health_tag as FinancialEntry['health_tag']) || 'Estrela',
        }))
      )

      // Organization Settings
      if (data.orgSettings) {
        const s = data.orgSettings as Record<string, unknown>
        setOrgSettings({
          organization_id: String(s.organization_id || data.activeOrgId),
          daily_budget_ads: Number(s.daily_budget_ads ?? 70),
          cashback_enabled: Boolean(s.cashback_enabled ?? true),
          cashback_percent: Number(s.cashback_percent ?? 5),
          hunger_coupon_enabled: Boolean(s.hunger_coupon_enabled ?? true),
          ai_auto_accept: Boolean(s.ai_auto_accept ?? true),
          handoff_only_on_insistence: Boolean(s.handoff_only_on_insistence ?? true),
          selected_gateway:
            (s.selected_gateway as OrganizationSettings['selected_gateway']) || 'MERCADO_PAGO',
          gateway_status:
            (s.gateway_status as OrganizationSettings['gateway_status']) || 'NOT_CONFIGURED',
          pix_key: String(s.pix_key || ''),
          whatsapp_number: String(s.whatsapp_number || '+55 11 99999-0000'),
          integrations_state: (s.integrations_state as Record<string, boolean>) || {
            whatsapp_cloud: true,
            meta_ads: true,
            google_ads: true,
            erp_webhook: true,
          },
        })
      }

      // Membros da Equipe & RH
      setOrgMembers(
        (data.orgMembers || []).map((mb: Record<string, unknown>) => ({
          id: String(mb.id),
          organization_id: String(mb.organization_id),
          user_id: mb.user_id ? String(mb.user_id) : null,
          full_name: String(mb.full_name || 'Colaborador'),
          email: String(mb.email || ''),
          whatsapp_phone: String(mb.whatsapp_phone || mb.whatsapp || ''),
          whatsapp: String(mb.whatsapp || mb.whatsapp_phone || ''),
          role: String(mb.role || 'CLIENT_OPERATIONS'),
          access_type: (mb.access_type as AccessType) || 'MEMBER',
          sector: String(mb.sector || 'Geral'),
          job_title: String(mb.job_title || 'Colaborador'),
          birth_date: mb.birth_date ? String(mb.birth_date) : null,
          contract_type: (mb.contract_type as ContractType) || 'PJ',
          hiring_date: mb.hiring_date ? String(mb.hiring_date) : null,
          salary_amount: Number(mb.salary_amount) || 0,
          payment_info: String(mb.payment_info || ''),
          work_regime: (mb.work_regime as WorkRegime) || 'REMOTO',
          member_status: (mb.member_status as MemberStatus) || 'ACTIVE',
          emergency_contact: String(mb.emergency_contact || ''),
          contract_document_url: String(mb.contract_document_url || ''),
          allowed_screens: Array.isArray(mb.allowed_screens) ? (mb.allowed_screens as string[]) : [],
          allowed_folder_ids: Array.isArray(mb.allowed_folder_ids) ? (mb.allowed_folder_ids as string[]) : [],
          allowed_list_ids: Array.isArray(mb.allowed_list_ids) ? (mb.allowed_list_ids as string[]) : [],
          created_at: formatTimeOrDate(mb.created_at as string),
        }))
      )

      if (data.currentMemberPermissions) {
        setCurrentUserPermissions(data.currentMemberPermissions)
      }

      setHrNotes(
        (data.hrNotes || []).map((n: Record<string, unknown>) => ({
          id: String(n.id),
          organization_id: String(n.organization_id),
          member_id: String(n.member_id),
          author_id: n.author_id ? String(n.author_id) : null,
          author_name: String(n.author_name || 'Admin RH'),
          category: String(n.category || 'Geral'),
          content: String(n.content || ''),
          created_at: formatTimeOrDate(n.created_at as string),
        }))
      )

      // CoyCRM: Pipelines, Stages, Deals, Contatos, Timeline e SavedViews
      const fetchedPipelines = (data.pipelines || []) as PipelineItem[]
      const fetchedStages = (data.pipelineStages || []) as PipelineStageItem[]

      if (fetchedPipelines.length > 0) {
        setPipelines(fetchedPipelines)
        setPipelineStages(fetchedStages)
      } else {
        const fallbackPipe: PipelineItem = {
          ...DEFAULT_INITIAL_PIPELINE,
          organization_id: currentOrgId || 'org-default',
        }
        setPipelines([fallbackPipe])
        setPipelineStages(
          DEFAULT_INITIAL_STAGES.map((s) => ({
            ...s,
            organization_id: currentOrgId || 'org-default',
            pipeline_id: fallbackPipe.id,
          }))
        )
      }
      setDeals((data.deals || []) as DealItem[])
      setClientContacts((data.clientContacts || []) as ClientContactItem[])
      setActivityTimeline((data.activityTimeline || []) as ActivityTimelineItem[])
      setSavedViews((data.savedViews || []) as WorkspaceSavedViewItem[])
    } catch (err) {
      console.error('Erro ao carregar dados do CoyDash:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrgId])

  useEffect(() => {
    const authPages = ['/login', '/cadastro', '/recuperar-senha', '/atualizar-senha']
    if (authPages.some((p) => pathname.startsWith(p))) {
      setIsLoading(false)
      return
    }
    refreshFromDatabase()
  }, [pathname, refreshFromDatabase])

  const setCurrentOrgId = (id: string) => {
    setCurrentOrgIdState(id)
    refreshFromDatabase(id)
  }

  const postAction = async (action: string, payload: Record<string, unknown> = {}) => {
    try {
      const res = await fetch('/api/coydash/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          orgId: currentOrg.id,
          payload,
        }),
      })
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        console.warn(`[coydash-sync] API retornou status ${res.status}:`, errText)
        return { ok: false, status: res.status, error: errText }
      }
      return await res.json()
    } catch (err) {
      console.error(`[coydash-sync] Erro de rede ou servidor ao executar "${action}":`, err)
      return { ok: false, error: err instanceof Error ? err.message : 'Network error' }
    }
  }

  const createNewOrganization = async (input: {
    name: string
    sector: string
    tier: 'MID_MARKET' | 'ENTERPRISE'
    mrr?: number
    setupFee?: number
    hourlyRevenue?: number
  }) => {
    const res = await postAction('CREATE_ORG', input)
    if (res?.organization?.id) {
      await refreshFromDatabase(res.organization.id)
    }
  }

  const updateOrganizationMetrics = async (updates: Partial<Organization>) => {
    setOrganizations((prev) =>
      prev.map((o) => (o.id === currentOrg.id ? { ...o, ...updates } : o))
    )
    await postAction('UPDATE_ORG', updates as Record<string, unknown>)
    await refreshFromDatabase(currentOrg.id)
  }

  const createQueueItem = async (input: CreateQueueInput) => {
    const payloadSummary: Record<string, string | number> = {}
    if (input.notes) payloadSummary['Observação'] = input.notes
    payloadSummary['Alçada'] = input.amount_value > 50000 ? 'CEO (> R$ 50k)' : 'COO / Operações'

    await postAction('CREATE_QUEUE_ITEM', {
      ...input,
      payload_summary: payloadSummary,
    })
    await refreshFromDatabase(currentOrg.id)
  }

  const decideApprovalOneClick = async (queueId: string, decision: ApprovalStatus) => {
    setApprovalQueues((prev) =>
      prev.map((q) =>
        q.id === queueId
          ? {
            ...q,
            status: decision,
            decided_by_name: currentPersona.name,
            decided_at: 'Agora (< 1s)',
            sla_minutes_remaining: 0,
          }
          : q
      )
    )
    await postAction('DECIDE_QUEUE_ITEM', { queueId, decision })
    await refreshFromDatabase(currentOrg.id)
  }

  const deleteQueueItem = async (queueId: string) => {
    setApprovalQueues((prev) => prev.filter((q) => q.id !== queueId))
    await postAction('DELETE_QUEUE_ITEM', { queueId })
  }

  const addSpreadsheet = async (input: AddSpreadsheetInput) => {
    await postAction('ADD_SPREADSHEET', { ...input })
    await refreshFromDatabase(currentOrg.id)
  }

  const updateSpreadsheetStatus = async (
    sheetId: string,
    status: 'PARALLEL_ACTIVE' | 'MIGRATED_POSTGRES' | 'READ_ONLY_LOCKED'
  ) => {
    setSpreadsheets((prev) =>
      prev.map((s) => (s.id === sheetId ? { ...s, status } : s))
    )
    await postAction('UPDATE_SPREADSHEET', { sheetId, status })
    await refreshFromDatabase(currentOrg.id)
  }

  const lockAllLegacySpreadsheets = async () => {
    setSpreadsheets((prev) => prev.map((s) => ({ ...s, status: 'READ_ONLY_LOCKED' })))
    await postAction('LOCK_ALL_SPREADSHEETS')
    await refreshFromDatabase(currentOrg.id)
  }

  const addBiaProcess = async (
    name: string,
    layer: MonitoringLayer,
    costPerHour: number
  ) => {
    await postAction('ADD_BIA_PROCESS', {
      process_name: name,
      layer,
      cost_per_hour_stopped: costPerHour,
    })
    await refreshFromDatabase(currentOrg.id)
  }

  const updateBiaStatus = async (
    processId: string,
    status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL_DOWN'
  ) => {
    setBiaProcesses((prev) =>
      prev.map((p) => (p.id === processId ? { ...p, current_status: status } : p))
    )
    await postAction('UPDATE_BIA_STATUS', { processId, current_status: status })
    await refreshFromDatabase(currentOrg.id)
  }

  const deleteBiaProcess = async (processId: string) => {
    setBiaProcesses((prev) => prev.filter((p) => p.id !== processId))
    await postAction('DELETE_BIA_PROCESS', { processId })
  }

  const createIncident = async (input: CreateIncidentInput) => {
    const linked = biaProcesses.find((b) => b.id === input.bia_process_id)
    await postAction('CREATE_INCIDENT', {
      ...input,
      process_name: linked?.process_name || 'Operação Crítica',
      cost_per_minute: linked?.cost_per_minute_stopped || 1000,
    })
    if (linked) {
      await postAction('UPDATE_BIA_STATUS', {
        processId: linked.id,
        current_status: input.priority === 'P1_CRITICAL_15MIN' ? 'CRITICAL_DOWN' : 'DEGRADED',
      })
    }
    await refreshFromDatabase(currentOrg.id)
  }

  const triggerSilentBusinessDropSimulation = async () => {
    const firstBia = biaProcesses[0]
    await postAction('CREATE_INCIDENT', {
      bia_process_id: firstBia?.id || null,
      process_name: firstBia?.process_name || 'Checkout & Vendas',
      cost_per_minute: firstBia?.cost_per_minute_stopped || 1333.33,
      priority: 'P1_CRITICAL_15MIN',
      title: 'Queda silenciosa de 32% na conversão (Camada 1 Infra Verde · Falha em Gateway/Checkout)',
      is_silent_business_drop: true,
      suppressed_alerts: 29,
      ai_sre_root_cause_summary:
        'Agente 05 SRE detectou em 38s que CPU/RAM estão normais, porém o teste sintético Playwright falhou na confirmação do webhook Pix.',
      ai_sre_recommended_action:
        'Chavear roteamento para adquirente secundária via n8n e reprocessar pedidos retidos.',
    })
    await refreshFromDatabase(currentOrg.id)
  }

  const resolveIncidentWithSreAi = async (incidentId: string) => {
    await postAction('RESOLVE_INCIDENT', { incidentId })
    await refreshFromDatabase(currentOrg.id)
  }

  const createFlowRun = async (input: CreateFlowRunInput) => {
    await postAction('CREATE_FLOW_RUN', { ...input })
    await refreshFromDatabase(currentOrg.id)
  }

  const addKnowledgeDoc = async (input: AddKnowledgeInput) => {
    await postAction('ADD_KNOWLEDGE_DOC', { ...input })
    await refreshFromDatabase(currentOrg.id)
  }

  const deleteKnowledgeDoc = async (docId: string) => {
    setKnowledgeChunks((prev) => prev.filter((d) => d.id !== docId))
    await postAction('DELETE_KNOWLEDGE_DOC', { docId })
  }

  const generateMonday8amReportNow = async () => {
    await postAction('GENERATE_WEEKLY_REPORT')
    await refreshFromDatabase(currentOrg.id)
  }

  const addCredential = async (input: AddCredentialInput) => {
    await postAction('ADD_CREDENTIAL', { ...input })
    await refreshFromDatabase(currentOrg.id)
  }

  const validateAllPreKickoffCredentials = async () => {
    await postAction('VALIDATE_CREDENTIALS')
    await refreshFromDatabase(currentOrg.id)
  }

  const deleteCredential = async (credentialId: string) => {
    setCredentials((prev) => prev.filter((c) => c.id !== credentialId))
    await postAction('DELETE_CREDENTIAL', { credentialId })
  }

  const executeGoLiveStep = async (step: 'A' | 'B' | 'C') => {
    await postAction('EXECUTE_GOLIVE_STEP', { step })
    await refreshFromDatabase(currentOrg.id)
  }

  const executeOffboardingAction = async (
    subAction: 'ACCEPT_PASSIVE' | 'EXPORT_ASSETS' | 'REVOKE_KEYS_LGPD' | 'SIGN_TERM'
  ) => {
    await postAction('EXECUTE_OFFBOARDING_STEP', { subAction })
    await refreshFromDatabase(currentOrg.id)
  }

  const sendTaskToAgent = async (agentId: AgentClass, taskText: string) => {
    const target = agents.find((a) => a.id === agentId)
    await postAction('CREATE_FLOW_RUN', {
      workflow_name: `Tarefa sob demanda · ${target?.name || agentId}`,
      agent_used: agentId,
      status: 'SUCCESS',
      manual_minutes_saved: 15,
      financial_value_processed: 0,
      tokens_consumed: 780,
      summary_result: `Comando concluído: "${taskText}"`,
    })
    await refreshFromDatabase(currentOrg.id)
  }

  const updateOrganizationStage = async (stage: LifecycleStage) => {
    await updateOrganizationMetrics({ current_stage: stage })
  }

  const triggerOnboarding5MinAutomation = async () => {
    const slug = currentOrg.slug || 'cliente'
    await updateOrganizationMetrics({
      google_drive_folder_url: `https://drive.google.com/drive/folders/coytech-${slug}`,
      whatsapp_group_jid: `5511999990000-grupo-${slug}@g.us`,
    })
    await createFlowRun({
      workflow_name: 'Onboarding Automático em 5 Minutos (Drive + WhatsApp + Vault)',
      agent_used: 'AGENT_4_CUSTOMER_SUCCESS_LTV',
      status: 'SUCCESS',
      manual_minutes_saved: 45,
      financial_value_processed: 0,
      summary_result:
        'Pasta Google Drive criada, grupo WhatsApp provisionado e link do Cofre de Senhas enviado.',
    })
  }

  // =========================================================================
  // ACTIONS: CLIENTES 360º
  // =========================================================================
  const createClient = async (input: Partial<ClientAccount>) => {
    await postAction('CREATE_CLIENT', input as Record<string, unknown>)
    await refreshFromDatabase(currentOrg.id)
  }

  const updateClient = async (
    clientId: string,
    updates: Partial<ClientAccount>,
    historyTitle?: string,
    historyDesc?: string,
    historyType?: string
  ) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, ...updates } : c))
    )
    await postAction('UPDATE_CLIENT', {
      clientId,
      updates,
      historyTitle,
      historyDesc,
      historyType,
    })
    await refreshFromDatabase(currentOrg.id)
  }

  const deleteClient = async (clientId: string) => {
    setClients((prev) => prev.filter((c) => c.id !== clientId))
    await postAction('DELETE_CLIENT', { clientId })
  }

  const addClientNote = async (clientId: string, content: string, noteType = 'GERAL') => {
    await postAction('ADD_CLIENT_NOTE', { clientId, content, note_type: noteType })
    await refreshFromDatabase(currentOrg.id)
  }

  const deleteClientNote = async (noteId: string) => {
    setClientTeamNotes((prev) => prev.filter((n) => n.id !== noteId))
    await postAction('DELETE_CLIENT_NOTE', { noteId })
  }

  // =========================================================================
  // ACTIONS: TAREFAS, SETORES E PROJETOS (ROOMIE OFFICE AI)
  // =========================================================================
  const createTaskFolder = async (name: string, icon = 'Folder') => {
    try {
      const res = await postAction('CREATE_TASK_FOLDER', { name, icon })
      const folderId = res?.data?.id || res?.folder?.id
      if (folderId) {
        await refreshFromDatabase(currentOrg.id)
        return
      }
      // Fallback local caso servidor/DB não responda
      const localFolder: TaskFolderItem = {
        id: `folder_${Date.now()}`,
        organization_id: currentOrg.id,
        name,
        icon,
        created_at: new Date().toISOString(),
      }
      setTaskFolders((prev) => [...prev, localFolder])
    } catch {
      const localFolder: TaskFolderItem = {
        id: `folder_${Date.now()}`,
        organization_id: currentOrg.id,
        name,
        icon,
        created_at: new Date().toISOString(),
      }
      setTaskFolders((prev) => [...prev, localFolder])
    }
  }

  const updateTaskFolder = async (folderId: string, name: string, icon: string) => {
    setTaskFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name, icon } : f))
    )
    await postAction('UPDATE_TASK_FOLDER', { folderId, name, icon })
    await refreshFromDatabase(currentOrg.id)
  }

  const deleteTaskFolder = async (folderId: string) => {
    setTaskFolders((prev) => prev.filter((f) => f.id !== folderId))
    await postAction('DELETE_TASK_FOLDER', { folderId })
    await refreshFromDatabase(currentOrg.id)
  }

  const createTaskList = async (
    folderId: string,
    name: string,
    icon = 'List'
  ): Promise<string | null> => {
    try {
      const res = await postAction('CREATE_TASK_LIST', { folder_id: folderId, name, icon })
      const listId = res?.data?.id || res?.list?.id
      if (listId) {
        await refreshFromDatabase(currentOrg.id)
        return String(listId)
      }
      // Fallback local caso offline
      const localId = `list_${Date.now()}`
      const newList: TaskListItem = {
        id: localId,
        organization_id: currentOrg.id,
        folder_id: folderId,
        name,
        icon,
        created_at: new Date().toISOString(),
      }
      setTaskLists((prev) => [...prev, newList])
      return localId
    } catch (err) {
      console.error('Erro ao criar lista:', err)
      const localId = `list_${Date.now()}`
      const newList: TaskListItem = {
        id: localId,
        organization_id: currentOrg.id,
        folder_id: folderId,
        name,
        icon,
        created_at: new Date().toISOString(),
      }
      setTaskLists((prev) => [...prev, newList])
      return localId
    }
  }

  const updateTaskList = async (listId: string, name: string, icon: string) => {
    setTaskLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, name, icon } : l))
    )
    await postAction('UPDATE_TASK_LIST', { listId, name, icon })
    await refreshFromDatabase(currentOrg.id)
  }

  const deleteTaskList = async (listId: string) => {
    setTaskLists((prev) => prev.filter((l) => l.id !== listId))
    await postAction('DELETE_TASK_LIST', { listId })
    await refreshFromDatabase(currentOrg.id)
  }

  const createTaskStatus = async (
    listId: string,
    name: string,
    color: string,
    orderIndex: number
  ) => {
    await postAction('CREATE_TASK_STATUS', {
      list_id: listId,
      name,
      color,
      order_index: orderIndex,
    })
    await refreshFromDatabase(currentOrg.id)
  }

  const updateTaskStatusColumn = async (
    statusId: string,
    updates: { name?: string; color?: string; order_index?: number }
  ) => {
    await postAction('UPDATE_TASK_STATUS_COLUMN', { statusId, updates })
    await refreshFromDatabase(currentOrg.id)
  }

  const deleteTaskStatusColumn = async (statusId: string) => {
    setTaskStatuses((prev) => prev.filter((s) => s.id !== statusId))
    await postAction('DELETE_TASK_STATUS_COLUMN', { statusId })
  }

  const createTask = async (input: Partial<TaskItem>) => {
    await postAction('CREATE_TASK', input as Record<string, unknown>)
    await refreshFromDatabase(currentOrg.id)
  }

  const updateTask = async (taskId: string, updates: Partial<TaskItem>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    )
    await postAction('UPDATE_TASK', { taskId, updates })
    await refreshFromDatabase(currentOrg.id)
  }

  const deleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    await postAction('DELETE_TASK', { taskId })
  }

  const addTaskComment = async (taskId: string, comment: TaskCommentItem) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const currentComments = Array.isArray(t.comments) ? t.comments : []
          return { ...t, comments: [...currentComments, comment] }
        }
        return t
      })
    )
    await postAction('ADD_TASK_COMMENT', { taskId, comment: comment as unknown as Record<string, unknown> })
  }

  const createCustomFieldDef = async (def: Partial<CustomFieldDefinition>) => {
    await postAction('CREATE_CUSTOM_FIELD_DEF', def as Record<string, unknown>)
    await refreshFromDatabase(currentOrg.id)
  }

  const deleteCustomFieldDef = async (defId: string) => {
    setCustomFieldDefs((prev) => prev.filter((d) => d.id !== defId))
    await postAction('DELETE_CUSTOM_FIELD_DEF', { defId })
  }

  // =========================================================================
  // ACTIONS: ATENDIMENTO WHATSAPP (RANGOLIVRE)
  // =========================================================================
  const createWhatsappConv = async (input: {
    contact_name: string
    contact_phone: string
    client_id?: string | null
    initial_message?: string
    ai_reply?: string
    ai_memory?: string[]
  }) => {
    await postAction('CREATE_WHATSAPP_CONV', input)
    await refreshFromDatabase(currentOrg.id)
  }

  const sendOperatorWhatsappMessage = async (convId: string, text: string) => {
    const target = whatsappConversations.find((w) => w.id === convId)
    if (!target) return
    const updatedMessages: WhatsappMessageItem[] = [
      ...target.messages,
      { from: 'operator', text, time: 'Agora' },
    ]
    setWhatsappConversations((prev) =>
      prev.map((w) =>
        w.id === convId ? { ...w, messages: updatedMessages, last_message_at: 'Agora' } : w
      )
    )
    await postAction('UPDATE_WHATSAPP_CONV', {
      convId,
      updates: { messages: updatedMessages },
    })
  }

  const simulateCustomerWhatsappAudio = async (convId: string) => {
    const target = whatsappConversations.find((w) => w.id === convId)
    if (!target) return
    const updatedMessages: WhatsappMessageItem[] = [
      ...target.messages,
      {
        from: 'customer',
        text: '🎙️ Áudio (0:07) — "Oi! Quero fechar a proposta comercial e já validar o próximo passo da campanha!"',
        is_audio: true,
        time: 'Agora',
      },
      {
        from: 'ai',
        text: 'Áudio transcrito via Whisper! Já deixei a proposta pronta para aprovação e atualizei os itens abaixo.',
        time: 'Agora',
      },
    ]
    const draftOrder = [
      { item: 'Gestão Tráfego Pago (Meta + Google)', price: 2500 },
      { item: 'Automação WhatsApp + IA 24h', price: 1200 },
    ]
    setWhatsappConversations((prev) =>
      prev.map((w) =>
        w.id === convId
          ? {
            ...w,
            messages: updatedMessages,
            draft_order: draftOrder,
            draft_accepted: false,
          }
          : w
      )
    )
    await postAction('UPDATE_WHATSAPP_CONV', {
      convId,
      updates: {
        messages: updatedMessages,
        draft_order: draftOrder,
        draft_accepted: false,
      },
    })
  }

  const toggleWhatsappHandoff = async (convId: string, handoffToHuman: boolean) => {
    const target = whatsappConversations.find((w) => w.id === convId)
    if (!target) return
    const sysMsg: WhatsappMessageItem = handoffToHuman
      ? {
        from: 'ai',
        text: 'Só um minutinho que estou transferindo para um especialista humano te auxiliar.',
        time: 'Agora',
      }
      : {
        from: 'ai',
        text: 'Atendimento automático IA reativado! Estou acompanhando esta conversa 24h.',
        time: 'Agora',
      }
    const updatedMessages = [...target.messages, sysMsg]
    setWhatsappConversations((prev) =>
      prev.map((w) =>
        w.id === convId
          ? { ...w, handoff_to_human: handoffToHuman, messages: updatedMessages }
          : w
      )
    )
    await postAction('UPDATE_WHATSAPP_CONV', {
      convId,
      updates: { handoff_to_human: handoffToHuman, messages: updatedMessages },
    })
  }

  const addWhatsappMemory = async (convId: string, memoryText: string) => {
    const target = whatsappConversations.find((w) => w.id === convId)
    if (!target) return
    const updatedMem = [...target.ai_memory, memoryText]
    setWhatsappConversations((prev) =>
      prev.map((w) => (w.id === convId ? { ...w, ai_memory: updatedMem } : w))
    )
    await postAction('UPDATE_WHATSAPP_CONV', {
      convId,
      updates: { ai_memory: updatedMem },
    })
  }

  const acceptWhatsappDraftOrder = async (convId: string) => {
    const target = whatsappConversations.find((w) => w.id === convId)
    if (!target) return
    const draftTotal = (target.draft_order || []).reduce((acc, i) => acc + i.price, 0)
    const updatedMessages: WhatsappMessageItem[] = [
      ...target.messages,
      {
        from: 'ai',
        text: `Proposta/Pedido aprovado (R$ ${draftTotal.toLocaleString('pt-BR')})! Link Pix/Contrato enviado ao cliente.`,
        time: 'Agora',
      },
    ]
    setWhatsappConversations((prev) =>
      prev.map((w) =>
        w.id === convId
          ? {
            ...w,
            draft_accepted: true,
            orders_count: w.orders_count + 1,
            total_spent: w.total_spent + draftTotal,
            messages: updatedMessages,
          }
          : w
      )
    )
    await postAction('UPDATE_WHATSAPP_CONV', {
      convId,
      updates: {
        draft_accepted: true,
        orders_count: target.orders_count + 1,
        total_spent: target.total_spent + draftTotal,
        messages: updatedMessages,
      },
    })
  }

  const deleteWhatsappConv = async (convId: string) => {
    setWhatsappConversations((prev) => prev.filter((w) => w.id !== convId))
    await postAction('DELETE_WHATSAPP_CONV', { convId })
  }

  // =========================================================================
  // ACTIONS: TRÁFEGO PAGO, MARKETING, FINANCEIRO E CONFIGURAÇÕES
  // =========================================================================
  const createPaidCampaign = async (input: Partial<PaidTrafficCampaign>) => {
    await postAction('CREATE_PAID_CAMPAIGN', input as Record<string, unknown>)
    await refreshFromDatabase(currentOrg.id)
  }

  const togglePaidCampaignStatus = async (campaignId: string) => {
    const target = paidCampaigns.find((c) => c.id === campaignId)
    if (!target) return
    const nextStatus = target.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    setPaidCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, status: nextStatus } : c))
    )
    await postAction('UPDATE_PAID_CAMPAIGN', {
      campaignId,
      updates: { status: nextStatus },
    })
  }

  const toggleChampionOffer = async (campaignId: string) => {
    const target = paidCampaigns.find((c) => c.id === campaignId)
    if (!target) return
    const nextVal = !target.is_champion_offer
    setPaidCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, is_champion_offer: nextVal } : c))
    )
    await postAction('UPDATE_PAID_CAMPAIGN', {
      campaignId,
      updates: { is_champion_offer: nextVal },
    })
  }

  const deletePaidCampaign = async (campaignId: string) => {
    setPaidCampaigns((prev) => prev.filter((c) => c.id !== campaignId))
    await postAction('DELETE_PAID_CAMPAIGN', { campaignId })
  }

  const createMarketingBlast = async (input: Partial<MarketingBlast>) => {
    await postAction('CREATE_MARKETING_BLAST', input as Record<string, unknown>)
    await refreshFromDatabase(currentOrg.id)
  }

  const deleteMarketingBlast = async (blastId: string) => {
    setMarketingBlasts((prev) => prev.filter((b) => b.id !== blastId))
    await postAction('DELETE_MARKETING_BLAST', { blastId })
  }

  const createFinancialEntry = async (input: Partial<FinancialEntry>) => {
    await postAction('CREATE_FINANCIAL_ENTRY', input as Record<string, unknown>)
    await refreshFromDatabase(currentOrg.id)
  }

  const deleteFinancialEntry = async (entryId: string) => {
    setFinancialEntries((prev) => prev.filter((e) => e.id !== entryId))
    await postAction('DELETE_FINANCIAL_ENTRY', { entryId })
  }

  const updateOrgSettings = async (updates: Partial<OrganizationSettings>) => {
    const merged = { ...orgSettings, ...updates }
    setOrgSettings(merged)
    await postAction('UPSERT_ORG_SETTINGS', merged as unknown as Record<string, unknown>)
  }

  const inviteTeamMember = async (input: {
    full_name: string
    email: string
    whatsapp_phone?: string
    whatsapp?: string
    role?: string
    access_type?: AccessType
    sector?: string
    job_title?: string
    birth_date?: string | null
    contract_type?: ContractType
    hiring_date?: string | null
    salary_amount?: number
    payment_info?: string
    work_regime?: WorkRegime
    member_status?: MemberStatus
    emergency_contact?: string
    contract_document_url?: string
    allowed_screens?: string[]
    allowed_folder_ids?: string[]
    allowed_list_ids?: string[]
  }) => {
    const res = await postAction('INVITE_TEAM_MEMBER', input as Record<string, unknown>)
    await refreshFromDatabase(currentOrg.id)
    return res as {
      ok: boolean
      emailSent?: boolean
      alreadyRegistered?: boolean
      inviteLink?: string
      directLoginUrl?: string
      token?: string
      error?: string
    }
  }

  const updateTeamMember = async (memberId: string, updates: Partial<TeamMemberItem>) => {
    setOrgMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, ...updates } : m))
    )
    await postAction('UPDATE_TEAM_MEMBER', { memberId, updates })
    await refreshFromDatabase(currentOrg.id)
  }

  const deleteTeamMember = async (memberId: string) => {
    setOrgMembers((prev) => prev.filter((m) => m.id !== memberId))
    await postAction('DELETE_TEAM_MEMBER', { memberId })
    await refreshFromDatabase(currentOrg.id)
  }

  const createHrNote = async (memberId: string, content: string, category: string = 'Geral') => {
    await postAction('CREATE_HR_NOTE', { memberId, content, category })
    await refreshFromDatabase(currentOrg.id)
  }

  const deleteHrNote = async (noteId: string) => {
    setHrNotes((prev) => prev.filter((n) => n.id !== noteId))
    await postAction('DELETE_HR_NOTE', { noteId })
    await refreshFromDatabase(currentOrg.id)
  }

  // ============================================================================
  // COYCRM — TWENTY CRM MUTATORS: PIPELINES, DEALS, CONTATOS & SAVED VIEWS
  // ============================================================================

  const createPipeline = async (
    name: string,
    color: string = '#F0521F',
    stages?: Partial<PipelineStageItem>[]
  ): Promise<PipelineItem | null> => {
    const defaultStages = stages || DEFAULT_PIPELINE_STAGES_SPEC
    const res = await postAction('CREATE_PIPELINE', { name, color, stages: defaultStages })
    if (res?.ok && res.pipeline) {
      setPipelines((prev) => [...prev, res.pipeline])
      if (Array.isArray(res.stages)) {
        setPipelineStages((prev) => [...prev, ...res.stages])
      }
      return res.pipeline
    }
    return null
  }

  const updatePipeline = async (pipelineId: string, updates: Partial<PipelineItem>) => {
    setPipelines((prev) => prev.map((p) => (p.id === pipelineId ? { ...p, ...updates } : p)))
    await postAction('UPDATE_PIPELINE', { pipelineId, updates })
  }

  const deletePipeline = async (pipelineId: string) => {
    setPipelines((prev) => prev.filter((p) => p.id !== pipelineId))
    setPipelineStages((prev) => prev.filter((s) => s.pipeline_id !== pipelineId))
    setDeals((prev) => prev.filter((d) => d.pipeline_id !== pipelineId))
    await postAction('DELETE_PIPELINE', { pipelineId })
  }

  const createDeal = async (input: Partial<DealItem>): Promise<DealItem | null> => {
    try {
      const res = await postAction('CREATE_DEAL', input)
      if (res?.ok && res.deal) {
        setDeals((prev) => [res.deal, ...prev])
        return res.deal
      }
    } catch (err) {
      console.warn('Erro ao chamar API CREATE_DEAL, usando fallback otimista:', err)
    }

    // Fallback resiliente: cria localmente caso o backend falhe ou ainda não tenha finalizado a migration
    const fallbackDeal: DealItem = {
      id: `deal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      organization_id: currentOrgId || 'org-default',
      pipeline_id: input.pipeline_id || pipelines[0]?.id || DEFAULT_INITIAL_PIPELINE.id,
      stage_id: input.stage_id || pipelineStages[0]?.id || DEFAULT_INITIAL_STAGES[0].id,
      title: input.title || 'Nova Oportunidade',
      value_mrr: Number(input.value_mrr) || 0,
      value_setup: Number(input.value_setup) || 0,
      lead_id: input.lead_id || null,
      client_id: input.client_id || null,
      client_name: input.client_name || undefined,
      priority: input.priority || 'medium',
      expected_close_date: input.expected_close_date || null,
      assigned_member_id: input.assigned_member_id || null,
      assigned_member_name: input.assigned_member_name || undefined,
      notes: input.notes || undefined,
      custom_fields: input.custom_fields || {},
      created_at: new Date().toISOString(),
    }
    setDeals((prev) => [fallbackDeal, ...prev])
    return fallbackDeal
  }

  const updateDeal = async (dealId: string, updates: Partial<DealItem>) => {
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, ...updates } : d)))
    await postAction('UPDATE_DEAL', { dealId, updates })
  }

  const updateDealStage = async (dealId: string, stageId: string) => {
    const targetDeal = deals.find((d) => d.id === dealId)
    const targetStage = pipelineStages.find((s) => s.id === stageId)
    if (!targetDeal) return

    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId ? { ...d, stage_id: stageId, updated_at: new Date().toISOString() } : d
      )
    )

    await postAction('UPDATE_DEAL_STAGE', {
      dealId,
      stageId,
      stageName: targetStage?.name || '',
      isWon: targetStage?.is_won,
      isLost: targetStage?.is_lost,
      leadId: targetDeal.lead_id,
    })
  }

  const deleteDeal = async (dealId: string) => {
    setDeals((prev) => prev.filter((d) => d.id !== dealId))
    await postAction('DELETE_DEAL', { dealId })
  }

  const convertDealToClient = async (
    dealId: string,
    options?: {
      clientName?: string
      cnpj?: string
      sector?: string
      contactName?: string
      contactPhone?: string
      contactEmail?: string
    }
  ): Promise<string | null> => {
    const res = await postAction('CONVERT_DEAL_TO_CLIENT', { dealId, ...options })
    if (res?.ok && res.client) {
      setClients((prev) => [res.client, ...prev])
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, client_id: res.client.id } : d))
      )
      await refreshFromDatabase(currentOrg.id)
      return res.client.id
    }
    return null
  }

  const createClientContact = async (
    input: Partial<ClientContactItem>
  ): Promise<ClientContactItem | null> => {
    const res = await postAction('CREATE_CLIENT_CONTACT', input)
    if (res?.ok && res.contact) {
      setClientContacts((prev) => [...prev, res.contact])
      return res.contact
    }
    return null
  }

  const updateClientContact = async (contactId: string, updates: Partial<ClientContactItem>) => {
    setClientContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, ...updates } : c))
    )
    await postAction('UPDATE_CLIENT_CONTACT', { contactId, updates })
  }

  const deleteClientContact = async (contactId: string) => {
    setClientContacts((prev) => prev.filter((c) => c.id !== contactId))
    await postAction('DELETE_CLIENT_CONTACT', { contactId })
  }

  const logActivityTimeline = async (input: {
    entity_type: TimelineEntityType
    entity_id: string
    event_type: TimelineEventType
    title: string
    description?: string
    metadata?: Record<string, unknown>
  }) => {
    const res = await postAction('LOG_ACTIVITY_TIMELINE', input)
    if (res?.ok && res.activity) {
      setActivityTimeline((prev) => [res.activity, ...prev])
    }
  }

  const saveWorkspaceView = async (
    view: Partial<WorkspaceSavedViewItem> & {
      view_scope: SavedViewScope
      name: string
    }
  ): Promise<WorkspaceSavedViewItem | null> => {
    const res = await postAction('SAVE_WORKSPACE_VIEW', view)
    if (res?.ok && res.view) {
      setSavedViews((prev) => {
        const idx = prev.findIndex((v) => v.id === res.view.id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = res.view
          return next
        }
        return [...prev, res.view]
      })
      return res.view
    }
    return null
  }

  const deleteWorkspaceView = async (viewId: string) => {
    setSavedViews((prev) => prev.filter((v) => v.id !== viewId))
    await postAction('DELETE_WORKSPACE_VIEW', { viewId })
  }

  return (
    <CoyDashContext.Provider
      value={{
        isLoading,
        authenticatedUser,
        searchQuery,
        setSearchQuery,
        organizations,
        currentOrg,
        setCurrentOrgId,
        createNewOrganization,
        updateOrganizationMetrics,
        personas: PERSONAS,
        currentPersona,
        setCurrentPersonaId,
        agents,
        activeAgentDrawer,
        setActiveAgentDrawer,
        approvalQueues,
        createQueueItem,
        decideApprovalOneClick,
        deleteQueueItem,
        auditLogs,
        spreadsheets,
        addSpreadsheet,
        updateSpreadsheetStatus,
        lockAllLegacySpreadsheets,
        biaProcesses,
        addBiaProcess,
        updateBiaStatus,
        deleteBiaProcess,
        incidents,
        createIncident,
        triggerSilentBusinessDropSimulation,
        resolveIncidentWithSreAi,
        flowRuns,
        createFlowRun,
        knowledgeChunks,
        addKnowledgeDoc,
        deleteKnowledgeDoc,
        weeklyReports,
        generateMonday8amReportNow,
        credentials,
        addCredential,
        validateAllPreKickoffCredentials,
        deleteCredential,
        goliveSteps,
        executeGoLiveStep,
        offboarding,
        executeOffboardingAction,
        sendTaskToAgent,
        updateOrganizationStage,
        triggerOnboarding5MinAutomation,
        refreshFromDatabase,
        clients,
        clientHistoryEvents,
        clientTeamNotes,
        createClient,
        updateClient,
        deleteClient,
        addClientNote,
        deleteClientNote,
        taskFolders,
        taskLists,
        taskStatuses,
        tasks,
        createTaskFolder,
        updateTaskFolder,
        deleteTaskFolder,
        createTaskList,
        updateTaskList,
        deleteTaskList,
        createTaskStatus,
        updateTaskStatusColumn,
        deleteTaskStatusColumn,
        createTask,
        updateTask,
        deleteTask,
        addTaskComment,
        customFieldDefs,
        createCustomFieldDef,
        deleteCustomFieldDef,
        whatsappConversations,
        createWhatsappConv,
        sendOperatorWhatsappMessage,
        simulateCustomerWhatsappAudio,
        toggleWhatsappHandoff,
        addWhatsappMemory,
        acceptWhatsappDraftOrder,
        deleteWhatsappConv,
        paidCampaigns,
        createPaidCampaign,
        togglePaidCampaignStatus,
        toggleChampionOffer,
        deletePaidCampaign,
        marketingBlasts,
        createMarketingBlast,
        deleteMarketingBlast,
        financialEntries,
        createFinancialEntry,
        deleteFinancialEntry,
        orgSettings,
        updateOrgSettings,
        orgMembers,
        hrNotes,
        currentUserPermissions,
        inviteTeamMember,
        updateTeamMember,
        deleteTeamMember,
        createHrNote,
        deleteHrNote,
        // CoyCRM
        pipelines,
        pipelineStages,
        deals,
        clientContacts,
        activityTimeline,
        savedViews,
        createPipeline,
        updatePipeline,
        deletePipeline,
        createDeal,
        updateDeal,
        updateDealStage,
        deleteDeal,
        convertDealToClient,
        createClientContact,
        updateClientContact,
        deleteClientContact,
        logActivityTimeline,
        saveWorkspaceView,
        deleteWorkspaceView,
      }}
    >
      {children}
    </CoyDashContext.Provider>
  )
}

export function useCoyDash() {
  const ctx = useContext(CoyDashContext)
  if (!ctx) {
    throw new Error('useCoyDash deve ser usado dentro de CoyDashProvider')
  }
  return ctx
}
