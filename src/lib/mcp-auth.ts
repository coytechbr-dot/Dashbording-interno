import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { McpApiToken, McpScope } from '@/types/mcp'

export function generateMcpToken(): { rawToken: string; tokenPrefix: string; tokenHash: string } {
  const randomHex = crypto.randomBytes(24).toString('hex')
  const rawToken = `coydash_mcp_live_${randomHex}`
  const tokenPrefix = `coydash_mcp_live_${randomHex.slice(0, 6)}...`
  const tokenHash = hashMcpToken(rawToken)
  return { rawToken, tokenPrefix, tokenHash }
}

export function hashMcpToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex')
}

export interface ValidationResult {
  ok: boolean
  error?: string
  token?: McpApiToken
}

export async function validateMcpToken(authHeader: string | null): Promise<ValidationResult> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, error: 'Cabeçalho Authorization Bearer ausente ou formato inválido.' }
  }

  const rawToken = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!rawToken || !rawToken.startsWith('coydash_mcp_')) {
    return { ok: false, error: 'Token com formato incorreto. Esperado prefixo coydash_mcp_.' }
  }

  const tokenHash = hashMcpToken(rawToken)

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('mcp_api_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('is_revoked', false)
      .single()

    if (error || !data) {
      return { ok: false, error: 'Token de API MCP não encontrado, inválido ou revogado.' }
    }

    const token = data as McpApiToken

    if (token.expires_at && new Date(token.expires_at) < new Date()) {
      return { ok: false, error: 'Token de API expirado.' }
    }

    // Atualiza last_used_at sem bloquear
    void (async () => {
      try {
        await admin
          .from('mcp_api_tokens')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', token.id)
      } catch (e) {
        console.error('[MCP Auth] Falha ao atualizar last_used_at:', e)
      }
    })()

    return { ok: true, token }
  } catch (err: any) {
    return { ok: false, error: `Erro na validação do token: ${err.message || 'Desconhecido'}` }
  }
}

export function hasScope(allowedScopes: McpScope[] | string[], requiredScope: McpScope): boolean {
  if (!allowedScopes || !Array.isArray(allowedScopes)) return false
  if (allowedScopes.includes('*')) return true
  if (allowedScopes.includes(requiredScope)) return true

  // Se tem permissão de escrita no módulo, também tem leitura
  if (requiredScope.endsWith(':read')) {
    const modulePrefix = requiredScope.split(':')[0]
    if (allowedScopes.includes(`${modulePrefix}:write` as McpScope)) {
      return true
    }
  }

  return false
}

export async function recordMcpAuditLog(params: {
  organization_id: string
  token_id?: string | null
  tool_name: string
  arguments?: Record<string, unknown> | null
  status: 'SUCCESS' | 'FORBIDDEN' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR'
  execution_time_ms: number
  error_message?: string | null
  client_ip?: string | null
}) {
  try {
    const admin = createAdminClient()
    await admin.from('mcp_audit_logs').insert({
      organization_id: params.organization_id,
      token_id: params.token_id || null,
      tool_name: params.tool_name,
      arguments: params.arguments || null,
      status: params.status,
      execution_time_ms: params.execution_time_ms,
      error_message: params.error_message || null,
      client_ip: params.client_ip || null,
    })
  } catch (err) {
    console.error('[MCP Audit] Erro ao registrar auditoria imutável:', err)
  }
}
