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

    const sessionId = request.nextUrl.searchParams.get('sessionId')
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId é obrigatório' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('n8n_chat_histories')
      .select('*')
      .eq('session_id', sessionId)
      .order('hora_data_mensagem', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const messages = (data || []).map((row) => {
      const msgObj = (row.message as {
        type?: string
        sender_label?: string
        is_audio?: boolean
        data?: { content?: string }
      }) || {}

      return {
        id: Number(row.id),
        session_id: String(row.session_id),
        type: (msgObj.type as 'human' | 'ai' | 'operator') || 'human',
        sender_label:
          msgObj.sender_label ||
          (msgObj.type === 'operator'
            ? 'Atendente'
            : msgObj.type === 'ai'
              ? 'IA'
              : 'Cliente'),
        is_audio: Boolean(msgObj.is_audio),
        content: String(msgObj.data?.content || ''),
        hora_data_mensagem: String(row.hora_data_mensagem),
      }
    })

    return NextResponse.json({ messages })
  } catch (err) {
    console.error('Erro em GET /api/whatsapp/messages:', err)
    return NextResponse.json({ error: 'Falha ao carregar mensagens' }, { status: 500 })
  }
}

