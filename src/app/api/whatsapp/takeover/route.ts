import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: NextRequest) {
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
    const { action, sessionId, orgId } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId é obrigatório' }, { status: 400 })
    }

    // 1. Alternar Assumir Conversa / Devolver para IA (`human_takeover`)
    if (action === 'TOGGLE_TAKEOVER') {
      const nextTakeover = Boolean(body.human_takeover)
      await admin
        .from('leads')
        .update({ human_takeover: nextTakeover })
        .eq('lead_id', String(sessionId))

      const statusMsg = nextTakeover
        ? 'Atendimento assumido por especialista humano. Respostas automáticas da IA pausadas para este contato.'
        : 'Conversa devolvida para o Agente IA. Monitoramento e respostas automáticas 24h reativados.'

      await admin.from('n8n_chat_histories').insert({
        session_id: String(sessionId),
        organization_id: orgId || null,
        hora_data_mensagem: new Date().toISOString(),
        message: {
          type: 'ai',
          sender_label: nextTakeover ? 'Atendente' : 'IA',
          data: { content: statusMsg },
        },
      })

      return NextResponse.json({ ok: true, human_takeover: nextTakeover })
    }

    // 2. Adicionar Memória Vetorial (pgvector) na tabela `client_ai_memories`
    if (action === 'ADD_MEMORY') {
      const memoryText = String(body.memory_text || '').trim()
      if (!memoryText) {
        return NextResponse.json({ error: 'memory_text vazio' }, { status: 400 })
      }

      const { data: memRow, error: memErr } = await admin
        .from('client_ai_memories')
        .insert({
          organization_id: orgId || null,
          lead_id: String(sessionId),
          memory_text: memoryText,
        })
        .select('*')
        .single()

      if (memErr) {
        return NextResponse.json({ error: memErr.message }, { status: 500 })
      }

      return NextResponse.json({ ok: true, memory: memRow })
    }

    // 3. Remover Memória Vetorial
    if (action === 'DELETE_MEMORY') {
      await admin.from('client_ai_memories').delete().eq('id', body.memoryId)
      return NextResponse.json({ ok: true })
    }

    // 4. Atualizar estágio do Lead no Funil CRM e sincronizar com a Central de Clientes 360º (`public.clients`)
    if (action === 'UPDATE_CRM_STAGE') {
      const nextStage = String(body.crm_stage || 'ONBOARDING')
      const leadNome = String(body.lead_nome || 'Cliente WhatsApp')

      const { data: updatedLead } = await admin
        .from('leads')
        .update({ crm_stage: nextStage })
        .eq('lead_id', String(sessionId))
        .select('*')
        .single()

      // Sincronizar com `public.clients` se houver `orgId`
      if (orgId) {
        const mappedStatus =
          nextStage === 'ACTIVE' || nextStage === 'QUALIFIED'
            ? 'ACTIVE'
            : nextStage === 'CHURN_RISK'
              ? 'CHURN_RISK'
              : 'ONBOARDING'

        const { data: existingClient } = await admin
          .from('clients')
          .select('id')
          .eq('organization_id', orgId)
          .or(`contact_phone.eq.${sessionId},name.ilike.%${leadNome}%`)
          .maybeSingle()

        if (existingClient?.id) {
          await admin
            .from('clients')
            .update({ status: mappedStatus, contact_phone: String(sessionId) })
            .eq('id', existingClient.id)

          await admin
            .from('leads')
            .update({ client_id: existingClient.id })
            .eq('lead_id', String(sessionId))
        } else {
          const { data: createdClient } = await admin
            .from('clients')
            .insert({
              organization_id: orgId,
              name: leadNome,
              contact_name: leadNome,
              contact_phone: String(sessionId),
              status: mappedStatus,
              priority: 'medium',
              team_squad: 'Sparta',
              service_type: 'Tráfego + IA + CRM',
              mrr_value: Number(updatedLead?.total_spent || 2500),
              connections: {
                meta: 'connected',
                google: 'connected',
                whatsapp: 'connected',
                ai: 'connected',
                crm: 'connected',
                finance: 'connected',
              },
            })
            .select('id')
            .single()

          if (createdClient?.id) {
            await admin
              .from('leads')
              .update({ client_id: createdClient.id })
              .eq('lead_id', String(sessionId))

            await admin.from('client_history_events').insert({
              organization_id: orgId,
              client_id: createdClient.id,
              event_type: 'WHATSAPP_LINKED',
              title: `Lead sincronizado automaticamente a partir do WhatsApp (${sessionId})`,
              description: `Estágio inicial: ${mappedStatus}`,
              actor_name: 'Agente IA · WhatsApp',
            })
          }
        }
      }

      return NextResponse.json({ ok: true, crm_stage: nextStage })
    }

    // 5. Atualizar detalhes comerciais e agendamento de reuniões (SDR)
    if (action === 'UPDATE_COMMERCIAL_DETAILS') {
      const updates: Record<string, unknown> = {}
      if (body.commercial_stage !== undefined) updates.commercial_stage = String(body.commercial_stage)
      if (body.meeting_scheduled_at !== undefined) updates.meeting_scheduled_at = body.meeting_scheduled_at || null
      if (body.meeting_link !== undefined) updates.meeting_link = String(body.meeting_link || '').trim() || null
      if (body.qualification_score !== undefined) updates.qualification_score = Number(body.qualification_score)
      if (body.inbox_type !== undefined) updates.inbox_type = String(body.inbox_type)

      await admin
        .from('leads')
        .update(updates)
        .eq('lead_id', String(sessionId))

      return NextResponse.json({ ok: true, updates })
    }

    // 6. Converter Lead Comercial em Cliente Oficial (1 Clique para Onboarding)
    if (action === 'CONVERT_LEAD_TO_CLIENT') {
      const leadNome = String(body.lead_nome || 'Novo Cliente').trim()
      const effectiveOrgId = orgId || null

      const { data: createdClient, error: clientErr } = await admin
        .from('clients')
        .insert({
          organization_id: effectiveOrgId,
          name: leadNome,
          contact_name: leadNome,
          contact_phone: String(sessionId),
          status: 'ONBOARDING',
          priority: 'high',
          team_squad: 'Sparta',
          service_type: 'Tráfego + IA + CRM',
          mrr_value: 2500,
          ad_balance: 1500,
          traffic_manager_name: 'Gabrielly Maia',
          designer_name: 'Felipe Cavalcante',
          cs_manager_name: 'Débora Carvalho',
          connections: {
            meta: 'disconnected',
            google: 'disconnected',
            whatsapp: 'connected',
            ai: 'connected',
            crm: 'connected',
            finance: 'connected',
          },
        })
        .select('*')
        .single()

      if (clientErr) {
        return NextResponse.json({ error: clientErr.message }, { status: 500 })
      }

      await admin
        .from('leads')
        .update({
          client_id: createdClient.id,
          commercial_stage: 'GANHO',
          inbox_type: 'CLIENT',
        })
        .eq('lead_id', String(sessionId))

      if (effectiveOrgId) {
        await admin.from('client_history_events').insert({
          organization_id: effectiveOrgId,
          client_id: createdClient.id,
          event_type: 'WHATSAPP_LINKED',
          title: `Lead Comercial convertido em Cliente (${leadNome})`,
          description: `Reunião comercial concluída. Conta movida para Onboarding com WhatsApp vinculado (${sessionId}).`,
          actor_name: 'SDR Comercial · CoyDash',
        })
      }

      return NextResponse.json({ ok: true, client: createdClient })
    }

    // 7. Atualizar métricas financeiras do Lead (pedidos, gasto, cashback)
    if (action === 'UPDATE_METRICS') {
      await admin
        .from('leads')
        .update({
          orders_count: Number(body.orders_count ?? 0),
          total_spent: Number(body.total_spent ?? 0),
          cashback_balance: Number(body.cashback_balance ?? 0),
        })
        .eq('lead_id', String(sessionId))

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (err) {
    console.error('Erro em PATCH /api/whatsapp/takeover:', err)
    return NextResponse.json({ error: 'Falha ao atualizar lead' }, { status: 500 })
  }
}

