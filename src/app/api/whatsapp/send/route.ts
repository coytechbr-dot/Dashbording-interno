import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
    const {
      sessionId,
      content,
      senderType = 'operator',
      isAudioSimulation = false,
      orgId = null,
    } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId é obrigatório' }, { status: 400 })
    }

    // Buscar o lead atual
    const { data: leadRow } = await admin
      .from('leads')
      .select('*')
      .eq('lead_id', String(sessionId))
      .maybeSingle()

    // Caso seja a ação "Simular Áudio Cliente"
    if (isAudioSimulation || senderType === 'human_simulation') {
      const audioContent =
        content ||
        'Áudio transcrito (0:08) — "Oi! Quero aprovar a proposta comercial e já agendar o kickoff da campanha desta semana."'

      await admin.from('n8n_chat_histories').insert({
        session_id: String(sessionId),
        organization_id: orgId,
        hora_data_mensagem: new Date().toISOString(),
        message: {
          type: 'human',
          sender_label: leadRow?.lead_nome || 'Cliente',
          is_audio: true,
          data: { content: audioContent },
        },
      })

      // Se a conversa NÃO estiver em atendimento humano (human_takeover = false), a IA responde automaticamente!
      if (!leadRow?.human_takeover) {
        const aiReply =
          'Áudio compreendido via Whisper! Já registrei sua aprovação na memória da conta, gerei o contrato/Pix e agendei o alinhamento com nossa equipe.'

        await admin.from('n8n_chat_histories').insert({
          session_id: String(sessionId),
          organization_id: orgId,
          hora_data_mensagem: new Date(Date.now() + 1000).toISOString(),
          message: {
            type: 'ai',
            sender_label: 'IA',
            data: { content: aiReply },
          },
        })

        // Adicionar fato aprendido na memória vetorial pgvector
        await admin.from('client_ai_memories').insert({
          organization_id: orgId,
          lead_id: String(sessionId),
          memory_text: 'Aprovou proposta por áudio e solicitou Kickoff imediato',
        })
      }

      return NextResponse.json({ ok: true })
    }

    // Envio de mensagem pelo Atendente Humano ("Responder como atendente...")
    if (!content || !String(content).trim()) {
      return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
    }

    const cleanText = String(content).trim()

    // 1. Marcar `human_takeover = true` no lead (intervenção humana assume a conversa)
    await admin
      .from('leads')
      .update({ human_takeover: true })
      .eq('lead_id', String(sessionId))

    // 2. Gravar a mensagem em `n8n_chat_histories` com `hora_data_mensagem = now()`
    await admin.from('n8n_chat_histories').insert({
      session_id: String(sessionId),
      organization_id: orgId,
      hora_data_mensagem: new Date().toISOString(),
      message: {
        type: 'operator',
        sender_label: 'Atendente',
        data: { content: cleanText },
      },
    })

    // 3. Verificar se a organização possui credenciais Z-API configuradas para disparo real no WhatsApp
    let zapiDelivered = false
    if (orgId) {
      const { data: settings } = await admin
        .from('organization_settings')
        .select('zapi_instance_url, zapi_client_token')
        .eq('organization_id', orgId)
        .maybeSingle()

      const baseUrl = String(settings?.zapi_instance_url || '').trim()
      const clientToken = String(settings?.zapi_client_token || '').trim()

      if (baseUrl && clientToken) {
        const endpoint = baseUrl.endsWith('/send-text')
          ? baseUrl
          : `${baseUrl.replace(/\/$/, '')}/send-text`

        try {
          const zapiRes = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Client-Token': clientToken,
            },
            body: JSON.stringify({
              phone: String(sessionId).replace(/\D/g, ''),
              message: cleanText,
            }),
          })
          zapiDelivered = zapiRes.ok
        } catch (zapiErr) {
          console.warn('Aviso ao disparar Z-API (modo local/homologação):', zapiErr)
        }
      }
    }

    return NextResponse.json({ ok: true, zapiDelivered })
  } catch (err) {
    console.error('Erro em POST /api/whatsapp/send:', err)
    return NextResponse.json({ error: 'Falha ao enviar mensagem' }, { status: 500 })
  }
}

