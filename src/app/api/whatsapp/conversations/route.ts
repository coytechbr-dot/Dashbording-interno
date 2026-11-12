import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
    const orgId = request.nextUrl.searchParams.get('orgId') || null
    const inboxType = request.nextUrl.searchParams.get('inboxType') || null

    // Buscar todos os leads (filtrando opcionalmente por inboxType: 'CLIENT' | 'COMMERCIAL')
    let leadsQuery = admin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (orgId) {
      leadsQuery = leadsQuery.or(`organization_id.eq.${orgId},organization_id.is.null`)
    }

    if (inboxType && inboxType !== 'ALL') {
      leadsQuery = leadsQuery.eq('inbox_type', inboxType)
    }

    const { data: leadsData, error: leadsErr } = await leadsQuery
    if (leadsErr) {
      return NextResponse.json({ error: leadsErr.message }, { status: 500 })
    }

    const leads = leadsData || []
    const sessionIds = leads.map((l) => String(l.lead_id))

    let allHistories: Record<string, unknown>[] = []
    let allMemories: Record<string, unknown>[] = []

    if (sessionIds.length > 0) {
      const [histRes, memRes] = await Promise.all([
        admin
          .from('n8n_chat_histories')
          .select('*')
          .in('session_id', sessionIds)
          .order('hora_data_mensagem', { ascending: true }),
        admin
          .from('client_ai_memories')
          .select('*')
          .in('lead_id', sessionIds)
          .order('created_at', { ascending: true }),
      ])

      allHistories = histRes.data || []
      allMemories = memRes.data || []
    }

    // Cruzar `leads.lead_id = n8n_chat_histories.session_id` e ordenar por MAX(hora_data_mensagem) DESC
    const conversations = leads
      .map((lead) => {
        const lid = String(lead.lead_id)
        const msgs = allHistories.filter((h) => String(h.session_id) === lid)
        const mems = allMemories.filter((m) => String(m.lead_id) === lid)
        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null
        const lastTime = lastMsg
          ? String(lastMsg.hora_data_mensagem)
          : String(lead.created_at)

        const msgObj = (lastMsg?.message as { type?: string; data?: { content?: string } }) || null
        const lastPreview = msgObj?.data?.content || 'Conversa iniciada'

        return {
          id: Number(lead.id),
          lead_id: lid,
          lead_nome: String(lead.lead_nome || lid),
          organization_id: lead.organization_id ? String(lead.organization_id) : orgId,
          client_id: lead.client_id ? String(lead.client_id) : null,
          inbox_type: (lead.inbox_type as 'CLIENT' | 'COMMERCIAL') || 'CLIENT',
          commercial_stage: String(lead.commercial_stage || 'NOVO'),
          meeting_scheduled_at: lead.meeting_scheduled_at ? String(lead.meeting_scheduled_at) : null,
          meeting_link: lead.meeting_link ? String(lead.meeting_link) : null,
          qualification_score: Number(lead.qualification_score ?? 0),
          crm_stage: String(lead.crm_stage || 'ONBOARDING'),
          human_takeover: Boolean(lead.human_takeover),
          orders_count: Number(lead.orders_count ?? 0),
          total_spent: Number(lead.total_spent ?? 0),
          cashback_balance: Number(lead.cashback_balance ?? 0),
          created_at: String(lead.created_at),
          last_message_at: lastTime,
          last_message_preview: lastPreview,
          messages_count: msgs.length,
          memories: mems.map((m) => ({
            id: String(m.id),
            memory_text: String(m.memory_text),
            created_at: String(m.created_at),
          })),
        }
      })
      .sort(
        (a, b) =>
          new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      )

    return NextResponse.json({ conversations })
  } catch (err) {
    console.error('Erro em GET /api/whatsapp/conversations:', err)
    return NextResponse.json({ error: 'Falha ao listar conversas' }, { status: 500 })
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

    const admin = createAdminClient()
    const body = await request.json()
    const { action, orgId } = body

    // Ação de Seed para demonstração imediata
    if (action === 'SEED_DEMO') {
      const demoLeads = [
        // 1. ATENDIMENTO A CLIENTES DA CARTEIRA
        {
          lead_id: '5511988771234',
          lead_nome: 'Lucas Ferreira (Wilson Cobra Advogados)',
          inbox_type: 'CLIENT',
          organization_id: orgId || null,
          crm_stage: 'ACTIVE',
          commercial_stage: 'GANHO',
          meeting_scheduled_at: null,
          meeting_link: null,
          qualification_score: 100,
          human_takeover: false,
          orders_count: 14,
          total_spent: 6120,
          cashback_balance: 84.5,
          memories: [
            'Sempre acompanha relatórios executivos às segundas 08h',
            'Escritório localizado no Jardim Paulista - SP',
            'Foco em campanhas de Direito Previdenciário e Trabalhista',
          ],
          messages: [
            {
              type: 'human',
              content: 'Oi, boa noite! Quero acompanhar como estão os leads da campanha desta semana.',
              offsetMinutes: -45,
            },
            {
              type: 'ai',
              content:
                'Olá, Lucas! Boa noite. Já consultei sua conta aqui no CoyDash: foram 64 novos leads qualificados nesta semana com custo por resultado de R$ 3,85 e ROAS de 6.8x.',
              offsetMinutes: -44,
            },
            {
              type: 'human',
              content: 'Excelente! Podemos aumentar o orçamento diário de Meta Ads para R$ 120/dia?',
              offsetMinutes: -12,
            },
            {
              type: 'ai',
              content:
                'Perfeito, Lucas! Já deixei o ajuste de orçamento para R$ 120/dia preparado na fila de aprovação em 1 clique e avisei a gestora Gabrielly Maia.',
              offsetMinutes: -11,
            },
          ],
        },
        {
          lead_id: '5511977114455',
          lead_nome: 'Juliana Rocha (Marcelo Teles Advocacia)',
          inbox_type: 'CLIENT',
          organization_id: orgId || null,
          crm_stage: 'ACTIVE',
          commercial_stage: 'GANHO',
          meeting_scheduled_at: null,
          meeting_link: null,
          qualification_score: 100,
          human_takeover: false,
          orders_count: 8,
          total_spent: 3500,
          cashback_balance: 45.0,
          memories: [
            'Prefere pagamento via Pix com QR Code automático',
            'Cliente Promotora (NPS 10)',
          ],
          messages: [
            {
              type: 'human',
              content: 'Acabei de fazer o Pix da mensalidade deste mês!',
              offsetMinutes: -120,
            },
            {
              type: 'ai',
              content:
                'Pagamento confirmado automaticamente via webhook em 2 segundos, Juliana! Sua nota fiscal e o recibo já foram enviados.',
              offsetMinutes: -119,
            },
          ],
        },
        {
          lead_id: '5521991239988',
          lead_nome: 'Pedro Alves (Eulálio Oliveira Advocacia)',
          inbox_type: 'CLIENT',
          organization_id: orgId || null,
          crm_stage: 'ONBOARDING',
          commercial_stage: 'GANHO',
          meeting_scheduled_at: null,
          meeting_link: null,
          qualification_score: 90,
          human_takeover: true,
          orders_count: 1,
          total_spent: 2500,
          cashback_balance: 0,
          memories: [
            'Em fase de Kickoff e configuração do WhatsApp Z-API',
            'Solicitou alinhamento com especialista humano',
          ],
          messages: [
            {
              type: 'human',
              content: 'Oi, quero falar com um especialista para alinhar os criativos do onboarding.',
              offsetMinutes: -25,
            },
            {
              type: 'ai',
              content:
                'Claro, Pedro! Já pausei o atendimento automático e chamei o especialista responsável aqui no painel para te atender agora mesmo.',
              offsetMinutes: -24,
            },
          ],
        },

        // 2. ATENDIMENTO COMERCIAL & SDR (LEADS DE ANÚNCIOS / AGENDAMENTO DE REUNIÕES)
        {
          lead_id: '5511994443322',
          lead_nome: 'Dr. Eduardo Guimarães',
          inbox_type: 'COMMERCIAL',
          organization_id: orgId || null,
          crm_stage: 'ACTIVE',
          commercial_stage: 'REUNIAO_AGENDADA',
          meeting_scheduled_at: new Date(Date.now() + 24 * 3600000).toISOString(), // Amanhã
          meeting_link: 'https://meet.google.com/coy-sdr-reuniao',
          qualification_score: 95,
          human_takeover: false,
          orders_count: 0,
          total_spent: 0,
          cashback_balance: 0,
          memories: [
            'Sócio de escritório com 6 advogados em Campinas - SP',
            'Interesse em escalar captação de causas cíveis e tributárias',
            'Reunião agendada para amanhã às 15h00 via Google Meet',
          ],
          messages: [
            {
              type: 'human',
              content: 'Olá! Vi o anúncio de vocês sobre automação e tráfego para escritórios jurídicos. Como funciona?',
              offsetMinutes: -75,
            },
            {
              type: 'ai',
              content:
                'Olá, Dr. Eduardo! Tudo bem? Prazer falar com você.\n\nNós estruturamos a máquina completa de prospecção, atendimento com IA 24h e CRM para escritórios jurídicos.\n\nAtualmente vocês já investem em anúncios ou dependem mais de indicações?',
              offsetMinutes: -74,
            },
            {
              type: 'human',
              content: 'Hoje dependemos 100% de indicações, mas queremos gerar de 30 a 50 contatos qualificados por mês.',
              offsetMinutes: -50,
            },
            {
              type: 'ai',
              content:
                'Excelente meta, Dr. Eduardo. Conseguimos estruturar exatamente isso.\n\nPodemos fazer uma call rápida de 30 minutos amanhã às 15h para te mostrar um diagnóstico gratuito e o desenho da campanha?',
              offsetMinutes: -49,
            },
            {
              type: 'human',
              content: 'Perfeito! Amanhã às 15h está ótimo para mim.',
              offsetMinutes: -10,
            },
            {
              type: 'ai',
              content:
                'Confirmadíssimo! Acabei de gerar o link da nossa reunião no Google Meet: https://meet.google.com/coy-sdr-reuniao\n\nJá reservei a sala executiva com nosso especialista comercial. Até amanhã às 15h!',
              offsetMinutes: -9,
            },
          ],
        },
        {
          lead_id: '5511982221199',
          lead_nome: 'Dra. Mariana Siqueira',
          inbox_type: 'COMMERCIAL',
          organization_id: orgId || null,
          crm_stage: 'ONBOARDING',
          commercial_stage: 'QUALIFICANDO',
          meeting_scheduled_at: null,
          meeting_link: null,
          qualification_score: 75,
          human_takeover: false,
          orders_count: 0,
          total_spent: 0,
          cashback_balance: 0,
          memories: [
            'Direito de Família e Sucessões',
            'Perguntou sobre valores de setup e mensalidade',
          ],
          messages: [
            {
              type: 'human',
              content: 'Boa tarde! Qual é o valor da mensalidade e taxa de implantação de vocês?',
              offsetMinutes: -30,
            },
            {
              type: 'ai',
              content:
                'Boa tarde, Dra. Mariana! Nosso plano sob medida para advocacia inclui gestão de anúncios, agente IA no WhatsApp e CRM centralizado.\n\nPara passarmos a proposta exata, qual é a sua área de atuação principal e a cidade do seu escritório?',
              offsetMinutes: -29,
            },
            {
              type: 'human',
              content: 'Atuamos com Direito de Família e Sucessões em Belo Horizonte e região metropolitana.',
              offsetMinutes: -8,
            },
            {
              type: 'ai',
              content:
                'Excelente nicho, Dra. Mariana! Temos cases com taxa de conversão altíssima em Direito de Família em BH.\n\nVocê tem 25 minutos nesta quinta-feira às 11h para conhecer a demonstração ao vivo da plataforma?',
              offsetMinutes: -7,
            },
          ],
        },
        {
          lead_id: '5521971118833',
          lead_nome: 'Roberto Vasconcelos',
          inbox_type: 'COMMERCIAL',
          organization_id: orgId || null,
          crm_stage: 'ONBOARDING',
          commercial_stage: 'NOVO',
          meeting_scheduled_at: null,
          meeting_link: null,
          qualification_score: 50,
          human_takeover: false,
          orders_count: 0,
          total_spent: 0,
          cashback_balance: 0,
          memories: ['Lead novo vindo da campanha de Meta Ads'],
          messages: [
            {
              type: 'human',
              content: 'Olá! Gostaria de mais informações sobre o serviço.',
              offsetMinutes: -5,
            },
            {
              type: 'ai',
              content:
                'Olá, Roberto! Seja muito bem-vindo.\n\nCom certeza podemos te ajudar! Me conta um pouquinho: qual é a sua empresa ou segmento de atuação hoje?',
              offsetMinutes: -4,
            },
          ],
        },
        {
          lead_id: '5511985554433',
          lead_nome: 'Dra. Beatriz Fontes',
          inbox_type: 'COMMERCIAL',
          organization_id: orgId || null,
          crm_stage: 'ACTIVE',
          commercial_stage: 'PROPOSTA',
          meeting_scheduled_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          meeting_link: 'https://meet.google.com/coy-proposta-beatriz',
          qualification_score: 88,
          human_takeover: true,
          orders_count: 0,
          total_spent: 3500,
          cashback_balance: 0,
          memories: [
            'Escritório de Direito Trabalhista Patronal em Campinas',
            'Proposta de R$ 3.500/mês enviada em PDF após a reunião comercial',
            'Aguardando validação com sócio até amanhã às 18h',
          ],
          messages: [
            {
              type: 'human',
              content: 'Recebi a proposta comercial por e-mail! Gostamos muito da estrutura do agente IA integrado.',
              offsetMinutes: -60,
            },
            {
              type: 'ai',
              content: 'Excelente, Dra. Beatriz! Ficamos muito felizes. Conseguimos agendar a assinatura e o kick-off até amanhã?',
              offsetMinutes: -45,
            },
          ],
        },
        {
          lead_id: '5511977778899',
          lead_nome: 'Dr. Marcos Valério Advogados',
          inbox_type: 'COMMERCIAL',
          organization_id: orgId || null,
          crm_stage: 'ACTIVE',
          commercial_stage: 'GANHO',
          meeting_scheduled_at: new Date(Date.now() - 3600000 * 48).toISOString(),
          meeting_link: 'https://meet.google.com/coy-kickoff-marcos',
          qualification_score: 100,
          human_takeover: true,
          orders_count: 1,
          total_spent: 4200,
          cashback_balance: 0,
          memories: [
            'Contrato assinado - Plano Tráfego + IA + CRM',
            'Onboarding agendado com a equipe de CS',
          ],
          messages: [
            {
              type: 'human',
              content: 'Contrato assinado e taxa de implantação paga! Vamos iniciar o onboarding.',
              offsetMinutes: -120,
            },
            {
              type: 'ai',
              content: 'Sejam bem-vindos! Nossa equipe de Onboarding já está com todos os acessos em preparação.',
              offsetMinutes: -115,
            },
          ],
        },
        {
          lead_id: '5531988881122',
          lead_nome: 'Rodrigo Alvarenga',
          inbox_type: 'COMMERCIAL',
          organization_id: orgId || null,
          crm_stage: 'CHURN_RISK',
          commercial_stage: 'PERDIDO',
          meeting_scheduled_at: null,
          meeting_link: null,
          qualification_score: 20,
          human_takeover: false,
          orders_count: 0,
          total_spent: 0,
          cashback_balance: 0,
          memories: [
            'Sem orçamento para investimento em anúncios no momento',
            'Procurava apenas software gratuito',
          ],
          messages: [
            {
              type: 'human',
              content: 'Entendi, no momento não tenho verba para marketing pago.',
              offsetMinutes: -240,
            },
            {
              type: 'ai',
              content: 'Sem problemas, Rodrigo! Salve nosso contato e quando fizer sentido estruturar a captação estamos à disposição.',
              offsetMinutes: -238,
            },
          ],
        },
      ]

      for (const d of demoLeads) {
        await admin.from('leads').upsert(
          {
            lead_id: d.lead_id,
            lead_nome: d.lead_nome,
            inbox_type: d.inbox_type,
            organization_id: d.organization_id,
            crm_stage: d.crm_stage,
            commercial_stage: d.commercial_stage,
            meeting_scheduled_at: d.meeting_scheduled_at,
            meeting_link: d.meeting_link,
            qualification_score: d.qualification_score,
            human_takeover: d.human_takeover,
            orders_count: d.orders_count,
            total_spent: d.total_spent,
            cashback_balance: d.cashback_balance,
          },
          { onConflict: 'lead_id' }
        )

        // Limpar histórico anterior de demo para este session_id para evitar duplicatas
        await admin.from('n8n_chat_histories').delete().eq('session_id', d.lead_id)
        await admin.from('client_ai_memories').delete().eq('lead_id', d.lead_id)

        for (const m of d.messages) {
          const ts = new Date(Date.now() + m.offsetMinutes * 60000).toISOString()
          await admin.from('n8n_chat_histories').insert({
            session_id: d.lead_id,
            organization_id: d.organization_id,
            hora_data_mensagem: ts,
            message: {
              type: m.type,
              data: { content: m.content },
            },
          })
        }

        for (const mem of d.memories) {
          await admin.from('client_ai_memories').insert({
            organization_id: d.organization_id,
            lead_id: d.lead_id,
            memory_text: mem,
          })
        }
      }

      return NextResponse.json({ ok: true })
    }

    // Criação de uma nova conversa individual
    const rawPhone = String(body.lead_id || body.contact_phone || '5511999990000').replace(
      /\D/g,
      ''
    )
    const leadId = rawPhone || `55119${Math.floor(10000000 + Math.random() * 89999999)}`
    const leadNome = String(body.lead_nome || body.contact_name || 'Cliente WhatsApp').trim()
    const initialMsg = String(
      body.initial_message || 'Olá, gostaria de saber mais sobre o atendimento!'
    ).trim()

    const { data: leadRow, error: leadErr } = await admin
      .from('leads')
      .upsert(
        {
          lead_id: leadId,
          lead_nome: leadNome,
          organization_id: orgId || null,
          inbox_type: body.inbox_type || 'CLIENT',
          commercial_stage: body.commercial_stage || 'NOVO',
          crm_stage: body.crm_stage || 'ONBOARDING',
          human_takeover: false,
          orders_count: 1,
          total_spent: 0,
          cashback_balance: 0,
        },
        { onConflict: 'lead_id' }
      )
      .select('*')
      .single()

    if (leadErr) {
      return NextResponse.json({ error: leadErr.message }, { status: 500 })
    }

    const now1 = new Date(Date.now() - 10000).toISOString()
    const now2 = new Date().toISOString()

    await admin.from('n8n_chat_histories').insert([
      {
        session_id: leadId,
        organization_id: orgId || null,
        hora_data_mensagem: now1,
        message: {
          type: 'human',
          data: { content: initialMsg },
        },
      },
      {
        session_id: leadId,
        organization_id: orgId || null,
        hora_data_mensagem: now2,
        message: {
          type: 'ai',
          data: {
            content: `Olá, ${leadNome}! Seja muito bem-vindo. Já localizei seu contato aqui na base do CoyDash. Como posso te ajudar hoje?`,
          },
        },
      },
    ])

    await admin.from('client_ai_memories').insert({
      organization_id: orgId || null,
      lead_id: leadId,
      memory_text: 'Contato iniciado via WhatsApp Oficial · IA ativa 24h',
    })

    return NextResponse.json({ ok: true, lead: leadRow })
  } catch (err) {
    console.error('Erro em POST /api/whatsapp/conversations:', err)
    return NextResponse.json({ error: 'Falha ao criar conversa' }, { status: 500 })
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

    const admin = createAdminClient()
    const sessionId = request.nextUrl.searchParams.get('sessionId')
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId obrigatório' }, { status: 400 })
    }

    await Promise.all([
      admin.from('n8n_chat_histories').delete().eq('session_id', sessionId),
      admin.from('client_ai_memories').delete().eq('lead_id', sessionId),
      admin.from('leads').delete().eq('lead_id', sessionId),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erro em DELETE /api/whatsapp/conversations:', err)
    return NextResponse.json({ error: 'Falha ao excluir conversa' }, { status: 500 })
  }
}

