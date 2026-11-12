import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateMcpToken } from '@/lib/mcp-auth'
import { McpRole, McpScope } from '@/types/mcp'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Busca organização do usuário
    const searchParams = request.nextUrl.searchParams
    let orgId = searchParams.get('organization_id')

    if (!orgId) {
      const { data: membership } = await admin
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (membership) {
        orgId = membership.organization_id
      } else {
        // Fallback para a primeira organização existente
        const { data: firstOrg } = await admin
          .from('organizations')
          .select('id')
          .limit(1)
          .maybeSingle()
        orgId = firstOrg?.id
      }
    }

    if (!orgId) {
      return NextResponse.json({ tokens: [] })
    }

    const { data: tokens, error } = await admin
      .from('mcp_api_tokens')
      .select('id, organization_id, created_by_user_id, name, token_prefix, role, allowed_scopes, rate_limit_per_minute, is_revoked, last_used_at, expires_at, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tokens: tokens || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      role = 'OPERATOR',
      allowed_scopes = ['atendimento:read', 'comercial:read', 'tarefas:read', 'clientes:read'],
      expires_in_days,
      organization_id,
    } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'O nome do token é obrigatório.' }, { status: 400 })
    }

    const admin = createAdminClient()
    let orgId = organization_id

    if (!orgId) {
      const { data: membership } = await admin
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
      orgId = membership?.organization_id
    }

    if (!orgId) {
      const { data: firstOrg } = await admin.from('organizations').select('id').limit(1).maybeSingle()
      orgId = firstOrg?.id
    }

    if (!orgId) {
      return NextResponse.json({ error: 'Organização não identificada.' }, { status: 400 })
    }

    const { rawToken, tokenPrefix, tokenHash } = generateMcpToken()

    let expiresAt: string | null = null
    if (expires_in_days && Number(expires_in_days) > 0) {
      const exp = new Date()
      exp.setDate(exp.getDate() + Number(expires_in_days))
      expiresAt = exp.toISOString()
    }

    const { data: tokenRecord, error } = await admin
      .from('mcp_api_tokens')
      .insert({
        organization_id: orgId,
        created_by_user_id: user.id,
        name: name.trim(),
        token_hash: tokenHash,
        token_prefix: tokenPrefix,
        role: (role as McpRole) || 'OPERATOR',
        allowed_scopes: (allowed_scopes as McpScope[]) || [],
        rate_limit_per_minute: 60,
        is_revoked: false,
        expires_at: expiresAt,
      })
      .select('id, organization_id, name, token_prefix, role, allowed_scopes, rate_limit_per_minute, is_revoked, expires_at, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      rawToken, // Exibido apenas nesta resposta
      token: tokenRecord,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, is_revoked } = body

    if (!id) {
      return NextResponse.json({ error: 'ID do token é obrigatório.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('mcp_api_tokens')
      .update({
        is_revoked: Boolean(is_revoked),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, is_revoked: Boolean(is_revoked) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}

