// ============================================================================
// COYDASH — Tipagens TypeScript Unificadas (SDD 01–05 + Clientes 360º + Roomie Tasks + Rangolivre)
// ============================================================================

export type CompanyTier = 'MID_MARKET' | 'ENTERPRISE'

export type LifecycleStage =
  | 'STAGE_1_ONBOARDING'       // Dias 0 a 3
  | 'STAGE_2_PLANNING_BIA'     // Semana 1 (Dias 1 a 5)
  | 'STAGE_3_PRESENTATION'     // Fim Semana 1 e Fim Semana 3
  | 'STAGE_4_GO_LIVE'          // Semana 4 (Dias 22 a 30)
  | 'STAGE_5_LTV_RECURRING'    // Mês 2 em diante (MRR Contínuo)
  | 'STAGE_6_OFFBOARDING'      // Encerramento seguro (15 dias)
  | 'PASSIVE_RETENTION_PLAN'   // Plano enxuto de Monitoramento Passivo + Backup
  | 'CHURNED_ARCHIVED'

export type OrgRole =
  | 'COYTECH_ADMIN'
  | 'COYTECH_SRE'
  | 'CLIENT_CEO_DIRECTOR'
  | 'CLIENT_COO_MANAGER'
  | 'CLIENT_CTO_IT'
  | 'CLIENT_OPERATIONS'
  | 'EXTERNAL_PARTNER'

export type MonitoringLayer =
  | 'LAYER_1_INFRA_ZABBIX'
  | 'LAYER_2_APP_DATADOG_N8N'
  | 'LAYER_3_SYNTHETIC_UX'
  | 'LAYER_4_EXTERNAL_SEFAZ_BANK'

export type IncidentPriority = 'P1_CRITICAL_15MIN' | 'P2_HIGH_30MIN' | 'P3_NORMAL_SAMEDAY'
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'CONTINGENCY_ACTIVE' | 'RESOLVED'

export type ApprovalStatus = 'PENDING' | 'APPROVED_1CLICK' | 'REJECTED' | 'NEEDS_REVISION'
export type QueueType = 'PURCHASE_ORDER' | 'FINANCIAL_RELEASE' | 'DISCOUNT_EXCEPTION' | 'KYC_ONBOARDING'

export type AgentClass =
  | 'AGENT_1_SALES_QUALIFIER'
  | 'AGENT_2_RECOVERY_BILLING'
  | 'AGENT_3_SUPPORT_TIER1'
  | 'AGENT_4_CUSTOMER_SUCCESS_LTV'
  | 'AGENT_5_SRE_INVESTIGATOR'

export interface Organization {
  id: string
  name: string
  slug: string
  cnpj: string
  sector: string
  tier: CompanyTier
  current_stage: LifecycleStage
  google_drive_folder_url: string
  whatsapp_group_jid: string
  litellm_virtual_key_id: string
  litellm_monthly_budget: number
  litellm_current_spend: number
  monthly_mrr_value: number
  setup_fee_value: number
  kickoff_completed_at: string | null
  golive_completed_at: string | null
  next_qbr_date: string
  health_score: number
  hourly_revenue_live: number
  hourly_revenue_avg: number
  conversion_rate_live: number
  conversion_rate_avg: number
}

export interface PersonaProfile {
  id: string
  name: string
  shortRole: string
  personaTitle: string
  role: OrgRole
  email: string
  whatsapp: string
  focusDescription: string
  primaryModule: string
}

export interface BiaCriticalProcess {
  id: string
  organization_id: string
  process_name: string
  layer: MonitoringLayer
  cost_per_hour_stopped: number
  cost_per_minute_stopped: number
  external_monitor_id: string
  current_status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL_DOWN'
  latency_ms: number
  last_checked_at: string
}

export interface PulseIncident {
  id: string
  organization_id: string
  bia_process_id: string
  process_name: string
  priority: IncidentPriority
  status: IncidentStatus
  title: string
  is_silent_business_drop: boolean
  suppressed_duplicate_alerts_count: number
  ai_sre_root_cause_summary: string | null
  ai_sre_recommended_action: string | null
  detected_at: string
  acknowledged_at: string | null
  resolved_at: string | null
  downtime_minutes: number
  cost_per_minute: number
  estimated_financial_loss_avoided: number
}

export interface StudioApprovalItem {
  id: string
  organization_id: string
  queue_type: QueueType
  title: string
  requester_name: string
  reference_code: string
  amount_value: number
  payload_summary: Record<string, string | number>
  status: ApprovalStatus
  sla_due_at: string
  sla_minutes_remaining: number
  decided_by_name?: string
  decided_at?: string
  created_at: string
}

export interface StudioAuditLog {
  id: string
  organization_id: string
  actor_name: string
  actor_role: OrgRole
  action_type: string
  entity_table: string
  entity_id: string
  ip_address: string
  payload_before: Record<string, unknown>
  payload_after: Record<string, unknown>
  created_at: string
}

export interface LegacySpreadsheet {
  id: string
  organization_id: string
  sheet_name: string
  department: string
  rows_count: number
  status: 'PARALLEL_ACTIVE' | 'MIGRATED_POSTGRES' | 'READ_ONLY_LOCKED'
  google_drive_id: string
  replaced_by_module: string
  locked_at?: string
}

export interface FlowAutomationRun {
  id: string
  organization_id: string
  workflow_name: string
  agent_used: AgentClass | null
  agent_display_name: string
  n8n_execution_id: string
  status: 'SUCCESS' | 'RETRIED_SUCCESS' | 'CONTINGENCY_QUEUED' | 'FAILED'
  manual_minutes_saved: number
  financial_value_processed: number
  tokens_consumed: number
  summary_result: string
  executed_at: string
}

export interface CoytechAgentSpec {
  id: AgentClass
  code: string
  name: string
  roleLabel: string
  modelRouted: 'Claude 3.5 Haiku' | 'Claude 3.7 Sonnet'
  triggerDescription: string
  status: 'Entregue' | 'Em andamento' | 'Aguardando você'
  lastDeliverySummary: string
  deliveriesToday: number
  tools: {
    name: string
    description: string
    sampleOutput: string
  }[]
}

export interface KnowledgeChunk {
  id: string
  organization_id: string
  doc_category: 'COMPANY_SOP' | 'COMMERCIAL_POLICY' | 'SRE_RUNBOOK' | 'ERP_API_DOC'
  title: string
  content_chunk: string
  similarity_score?: number
  created_at: string
}

export interface LtvWeeklyReport {
  id: string
  organization_id: string
  week_start: string
  week_end: string
  total_automated_runs: number
  total_hours_saved: number
  incidents_prevented_count: number
  revenue_protected_value: number
  sla_uptime_percentage: number
  sent_via_whatsapp_at: string
}

export interface CredentialValidationItem {
  id: string
  organization_id: string
  pilar: 'STUDIO' | 'FLOW' | 'PULSE'
  service_name: string
  endpoint_or_host: string
  status: 'VALIDATED' | 'PENDING_TEST' | 'ERROR'
  latency_ms?: number
  last_tested_at: string
}

export interface OffboardingState {
  organization_id: string
  active: boolean
  current_day: number // 1 a 15
  exit_reason: string
  passive_plan_offered: boolean
  retained_on_passive_plan: boolean
  git_repo_exported: boolean
  db_dump_exported: boolean
  n8n_json_exported: boolean
  zabbix_templates_exported: boolean
  litellm_key_revoked: boolean
  vpn_and_vault_wiped: boolean
  handover_term_signed: boolean
  followup_60d_date: string
  followup_120d_date: string
}

// ============================================================================
// NOVOS TIPOS: CENTRAL DE CLIENTES 360º (IMAGENS 2 E 3)
// ============================================================================
export type ClientStatus = 'ONBOARDING' | 'ACTIVE' | 'CHURN_RISK'
export type ClientPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ClientAdPlatform = 'META' | 'GOOGLE' | 'BOTH' | 'NONE'
export type ConnectionHealth = 'connected' | 'warning' | 'disconnected'

export interface ClientConnections {
  meta: ConnectionHealth
  google: ConnectionHealth
  whatsapp: ConnectionHealth
  ai: ConnectionHealth
  crm: ConnectionHealth
  finance: ConnectionHealth
}

export interface ClientAccount {
  id: string
  organization_id: string
  name: string
  cnpj: string
  sector: string
  team_squad: string
  priority: ClientPriority
  status: ClientStatus
  ad_platform: ClientAdPlatform
  service_type: string
  is_mc: boolean
  nps_score: number
  last_optimization_date: string
  ad_spend: number
  ad_results: number
  ad_cpr: number
  ad_balance: number
  mrr_value: number
  setup_fee: number
  traffic_manager_name: string
  designer_name: string
  cs_manager_name: string
  contact_name: string
  contact_phone: string
  contact_email: string
  whatsapp_group_link: string
  drive_folder_link: string
  connections: ClientConnections
  briefing_data: Record<string, string>
  commercial_data: Record<string, string>
  backups_data: Record<string, string>
  agenda_items: { id: string; title: string; date: string; type: string; status: string }[]
  created_at: string
}

export interface ClientHistoryEvent {
  id: string
  organization_id: string
  client_id: string
  event_type: string
  title: string
  description: string
  actor_name: string
  created_at: string
}

export interface ClientTeamNote {
  id: string
  organization_id: string
  client_id: string
  note_type: string
  content: string
  author_name: string
  created_at: string
}

// ============================================================================
// NOVOS TIPOS: SETORES, PROJETOS E TAREFAS (SISTEMA DO ROOMIE OFFICE AI)
// ============================================================================
export type TaskPriorityLevel = 'low' | 'medium' | 'high' | 'urgent'

export interface TaskFolderItem {
  id: string
  organization_id: string
  name: string
  icon: string
  created_at: string
}

export interface TaskListItem {
  id: string
  organization_id: string
  folder_id: string
  name: string
  icon: string
  created_at: string
}

export interface TaskStatusColumn {
  id: string
  organization_id: string
  list_id: string
  name: string
  color: string
  order_index: number
}

export interface TaskSubtaskItem {
  id: string
  title: string
  is_completed?: boolean
  completed?: boolean
}

export interface TaskAttachmentItem {
  id: string
  file_name: string
  file_url: string
  file_type?: string
  file_size?: number
}

export interface TaskExternalLink {
  id: string
  title: string
  url: string
}

export type CustomFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'url'
  | 'select'
  | 'checkbox'
  | 'date'
  | 'user'
  | 'file'

export interface CustomFieldDefinition {
  id: string
  name: string
  type: CustomFieldType
  options?: { label: string; color?: string }[]
  scope: 'task' | 'list' | 'template' | 'client' | 'deal'
  list_id?: string
  is_required?: boolean
}

export interface TaskCustomFieldValue {
  field_id: string
  field_name?: string
  field_type?: CustomFieldType
  value: any
}

export interface TaskCommentItem {
  id: string
  author_name: string
  author_avatar?: string
  content: string
  audio_url?: string
  attachments?: TaskAttachmentItem[]
  is_system_event?: boolean
  created_at: string
}

export interface TaskItem {
  id: string
  organization_id: string
  list_id: string | null
  client_id: string | null
  client_name_snapshot: string
  status_id: string | null
  status_key: string
  title: string
  description: string
  priority: TaskPriorityLevel
  assignee_name: string
  assignees?: string[]
  start_date?: string | null
  due_date: string | null
  time_estimate?: string | null
  time_spent_seconds?: number
  is_tracking_time?: boolean
  tags?: string[]
  custom_fields?: TaskCustomFieldValue[]
  subtasks: TaskSubtaskItem[]
  comments: TaskCommentItem[]
  attachments?: TaskAttachmentItem[]
  links?: TaskExternalLink[]
  linked_task_ids?: string[]
  parent_task_id?: string | null
  origin_reference?: string
  created_at: string
}

// ============================================================================
// NOVOS TIPOS: MÓDULOS OPERACIONAIS DO RANGOLIVRE
// ============================================================================
export interface WhatsappMessageItem {
  from: 'customer' | 'ai' | 'operator'
  text: string
  is_audio?: boolean
  time?: string
}

export interface WhatsappConversation {
  id: string
  organization_id: string
  client_id: string | null
  contact_name: string
  contact_phone: string
  handoff_to_human: boolean
  orders_count: number
  total_spent: number
  cashback_balance: number
  ai_memory: string[]
  draft_order: { item: string; price: number }[] | null
  draft_accepted: boolean
  messages: WhatsappMessageItem[]
  last_message_at: string
}

export interface PaidTrafficCampaign {
  id: string
  organization_id: string
  client_id: string | null
  campaign_name: string
  platform: string
  note: string
  daily_budget: number
  spent_week: number
  ctr_percent: number
  conversions_count: number
  revenue_attributed: number
  roas: number
  is_champion_offer: boolean
  status: string
}

export interface MarketingBlast {
  id: string
  organization_id: string
  campaign_name: string
  segment_label: string
  scheduled_for: string
  delivered_count: number
  read_count: number
  conversions_count: number
}

export interface FinancialEntry {
  id: string
  organization_id: string
  item_name: string
  category: 'RECEITA_SERVICO' | 'TAXA_IMPOSTO' | 'CUSTO_CMV' | 'DESCONTO_CASHBACK'
  channel: string
  quantity_sold: number
  margin_percent: number
  amount_value: number
  health_tag: 'Estrela' | 'Atenção' | 'Margem crítica'
}

export interface OrganizationSettings {
  organization_id: string
  daily_budget_ads: number
  cashback_enabled: boolean
  cashback_percent: number
  hunger_coupon_enabled: boolean
  ai_auto_accept: boolean
  handoff_only_on_insistence: boolean
  selected_gateway: 'MERCADO_PAGO' | 'ASAAS' | 'BANCO_INTER' | 'EFI_BANK'
  gateway_status: 'CONNECTED' | 'NOT_CONFIGURED'
  pix_key: string
  whatsapp_number: string
  zapi_instance_url?: string
  zapi_client_token?: string
  n8n_webhook_url?: string
  integrations_state: Record<string, boolean>
}

// ============================================================================
// GESTÃO DE MEMBROS, COMPARTILHAMENTO DE WORKSPACE E RH PROFISSIONAL
// ============================================================================
export type AccessType = 'MEMBER' | 'GUEST'
export type ContractType = 'PJ' | 'CLT' | 'ESTAGIO' | 'OUTRO'
export type WorkRegime = 'REMOTO' | 'HIBRIDO' | 'PRESENCIAL'
export type MemberStatus = 'ACTIVE' | 'INVITED' | 'VACATION' | 'TERMINATED'

export interface MemberHrNoteItem {
  id: string
  organization_id: string
  member_id: string
  author_id?: string | null
  author_name: string
  category: string
  content: string
  created_at: string
}

export interface TeamMemberItem {
  id: string
  organization_id: string
  user_id?: string | null
  full_name: string
  email: string
  whatsapp_phone?: string
  whatsapp?: string // compatibilidade retroativa
  role: string
  access_type: AccessType
  sector: string
  job_title: string
  birth_date?: string | null
  contract_type: ContractType
  hiring_date?: string | null
  salary_amount: number
  payment_info?: string
  work_regime: WorkRegime
  member_status: MemberStatus
  emergency_contact?: string
  contract_document_url?: string
  allowed_screens: string[]
  allowed_folder_ids: string[]
  allowed_list_ids: string[]
  created_at: string
}

export interface WorkspaceInvitation {
  id: string
  organization_id: string
  email: string
  full_name: string
  sector: string
  job_title: string
  access_type: AccessType
  allowed_screens: string[]
  allowed_folder_ids: string[]
  allowed_list_ids: string[]
  token: string
  invited_by?: string | null
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED'
  created_at: string
  expires_at: string
}

// ============================================================================
// NOVO: ENGENHARIA REVERSA TWENTY CRM (COYCRM) — PIPELINES, DEALS, CONTATOS 1:N,
// ACTIVITY TIMELINE E SAVED VIEWS
// ============================================================================

export interface PipelineItem {
  id: string
  organization_id: string
  name: string
  is_default: boolean
  color: string
  created_at: string
  updated_at?: string
}

export interface PipelineStageItem {
  id: string
  organization_id: string
  pipeline_id: string
  name: string
  stage_order: number
  probability_percent: number
  color: string
  is_won: boolean
  is_lost: boolean
  created_at: string
}

export type DealPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface DealItem {
  id: string
  organization_id: string
  pipeline_id: string
  stage_id: string
  client_id?: string | null
  client_name?: string
  lead_id?: string | null
  title: string
  value_mrr: number
  value_setup: number
  expected_close_date?: string | null
  priority: DealPriority
  assigned_member_id?: string | null
  assigned_member_name?: string
  lost_reason?: string | null
  notes?: string
  custom_fields?: Record<string, unknown>
  created_at: string
  updated_at?: string
}

export interface ClientContactItem {
  id: string
  organization_id: string
  client_id: string
  client_name?: string
  lead_id?: string | null
  name: string
  job_title: string
  role_title?: string
  department: string
  email?: string
  phone?: string
  whatsapp?: string
  is_decision_maker: boolean
  is_primary_decision_maker?: boolean
  notes?: string
  avatar_url?: string
  created_at: string
  updated_at?: string
}

export type TimelineEntityType = 'CLIENT' | 'DEAL' | 'LEAD' | 'TASK' | 'client' | 'deal' | 'lead' | 'task'
export type TimelineEventType =
  | 'STATUS_CHANGED'
  | 'STAGE_MOVED'
  | 'NOTE_ADDED'
  | 'MEETING_SCHEDULED'
  | 'PROPOSAL_CREATED'
  | 'DEAL_WON'
  | 'DEAL_LOST'
  | 'TASK_COMPLETED'
  | 'FIELD_UPDATED'
  | 'COMMUNICATION_LOGGED'
  | 'note'
  | 'stage_change'
  | 'deal_created'
  | 'status_change'
  | string

export interface ActivityTimelineItem {
  id: string
  organization_id: string
  entity_type: TimelineEntityType
  entity_id: string
  deal_id?: string | null
  client_id?: string | null
  actor_name: string
  actor_id?: string | null
  event_type: TimelineEventType
  title: string
  description: string
  metadata?: Record<string, unknown>
  created_at: string
}

export type SavedViewScope = 'CLIENTS' | 'DEALS' | 'TASKS'

export interface SavedViewFilterRule {
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in'
  value: unknown
}

export interface SavedViewSortRule {
  field: string
  direction: 'asc' | 'desc'
}

export interface WorkspaceSavedViewItem {
  id: string
  organization_id: string
  user_id?: string | null
  view_scope: SavedViewScope
  name: string
  icon?: string
  is_shared: boolean
  columns_visible: string[]
  filters_config: SavedViewFilterRule[]
  sort_config: SavedViewSortRule
  created_at: string
}


