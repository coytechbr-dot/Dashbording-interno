export type McpRole = 'READ_ONLY' | 'OPERATOR' | 'MANAGER' | 'ADMIN'

export type McpScope =
  | '*'
  | 'atendimento:read'
  | 'atendimento:write'
  | 'comercial:read'
  | 'comercial:write'
  | 'tarefas:read'
  | 'tarefas:write'
  | 'tarefas:delete'
  | 'clientes:read'
  | 'clientes:write'
  | 'agentes:read'
  | 'agentes:write'

export interface McpApiToken {
  id: string
  organization_id: string
  created_by_user_id?: string | null
  name: string
  token_hash: string
  token_prefix: string
  role: McpRole
  allowed_scopes: McpScope[]
  rate_limit_per_minute: number
  is_revoked: boolean
  last_used_at?: string | null
  expires_at?: string | null
  created_at: string
  updated_at: string
}

export interface McpAuditLog {
  id: string
  organization_id: string
  token_id?: string | null
  tool_name: string
  arguments?: Record<string, unknown> | null
  status: 'SUCCESS' | 'FORBIDDEN' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR'
  execution_time_ms: number
  error_message?: string | null
  client_ip?: string | null
  created_at: string
}

export interface JsonRpcRequest {
  jsonrpc: '2.0'
  id?: string | number | null
  method: string
  params?: Record<string, any>
}

export interface JsonRpcResponse {
  jsonrpc: '2.0'
  id?: string | number | null
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

export interface McpToolDefinition {
  name: string
  description: string
  requiredScope: McpScope
  inputSchema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

