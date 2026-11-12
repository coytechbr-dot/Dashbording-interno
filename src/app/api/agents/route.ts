import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface CustomAgentRow {
  id: string
  organization_id: string | null
  name: string
  description: string
  webhook_url: string
  channel: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Agentes de exemplo caso o banco esteja limpo
const DEFAULT_AGENTS: CustomAgentRow[] = [
  {
    id: 'agent-sdr-comercial',
    organization_id: null,
    name: 'Agente SDR Comercial',
    description:
      'Qualifica leads de campanhas de tráfego pago, responde dúvidas e agenda reuniões no Google Meet diretamente no pipeline.',
    webhook_url: 'http://localhost:5678/webhook/whatsapp-coytech',
    channel: 'WHATSAPP_COMMERCIAL',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'agent-suporte-clientes',
    organization_id: null,
    name: 'Agente de Atendimento & Suporte',
    description:
      'Atende demandas de clientes contratados, tira dúvidas sobre campanhas e transfere para o gestor humano quando necessário.',
    webhook_url: 'http://localhost:5678/webhook/whatsapp-suporte-clientes',
    channel: 'WHATSAPP_CLIENTS',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Memória local em runtime para fallback caso a tabela ainda não exista no schema remoto
let inMemoryAgents: CustomAgentRow[] = [...DEFAULT_AGENTS]

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const orgId = request.nextUrl.searchParams.get('orgId') || null
    const admin = createAdminClient()

    try {
      let query = admin.from('custom_agents').select('*').order('created_at', { ascending: false })
      if (orgId) {
        query = query.or(`organization_id.eq.${orgId},organization_id.is.null`)
      }
      const { data, error } = await query

      if (!error && data && data.length > 0) {
        return NextResponse.json({ agents: data })
      }

      if (!error && data && data.length === 0) {
        // Se a tabela existe mas está vazia, insere os padrões
        for (const ag of DEFAULT_AGENTS) {
          await admin.from('custom_agents').insert({
            name: ag.name,
            description: ag.description,
            webhook_url: ag.webhook_url,
            channel: ag.channel,
            is_active: ag.is_active,
            organization_id: orgId || null,
          })
        }
        const { data: seeded } = await admin
          .from('custom_agents')
          .select('*')
          .order('created_at', { ascending: false })
        return NextResponse.json({ agents: seeded || DEFAULT_AGENTS })
      }
    } catch {
      // Falha de schema -> fallback para memória
    }

    return NextResponse.json({ agents: inMemoryAgents })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
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
    const { name, description, webhook_url, channel, is_active, orgId } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nome do agente é obrigatório' }, { status: 400 })
    }

    const newAgent: CustomAgentRow = {
      id: `ag-${Date.now()}`,
      organization_id: orgId || null,
      name: name.trim(),
      description: (description || '').trim(),
      webhook_url: (webhook_url || '').trim(),
      channel: channel || 'WHATSAPP_COMMERCIAL',
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const admin = createAdminClient()
    try {
      const { data, error } = await admin
        .from('custom_agents')
        .insert({
          name: newAgent.name,
          description: newAgent.description,
          webhook_url: newAgent.webhook_url,
          channel: newAgent.channel,
          is_active: newAgent.is_active,
          organization_id: newAgent.organization_id,
        })
        .select('*')
        .single()

      if (!error && data) {
        return NextResponse.json({ ok: true, agent: data })
      }
    } catch {
      // Fallback para memória local
    }

    inMemoryAgents = [newAgent, ...inMemoryAgents]
    return NextResponse.json({ ok: true, agent: newAgent })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
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
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID do agente é obrigatório' }, { status: 400 })
    }

    const admin = createAdminClient()
    try {
      const { data, error } = await admin
        .from('custom_agents')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()

      if (!error && data) {
        return NextResponse.json({ ok: true, agent: data })
      }
    } catch {
      // Fallback memória
    }

    inMemoryAgents = inMemoryAgents.map((ag) => (ag.id === id ? { ...ag, ...updates } : ag))
    const updated = inMemoryAgents.find((ag) => ag.id === id)
    return NextResponse.json({ ok: true, agent: updated })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const admin = createAdminClient()
    try {
      await admin.from('custom_agents').delete().eq('id', id)
    } catch {
      // Fallback
    }

    inMemoryAgents = inMemoryAgents.filter((ag) => ag.id !== id)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
