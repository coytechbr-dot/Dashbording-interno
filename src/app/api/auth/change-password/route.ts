import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const newPassword = String(body.newPassword || '')

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'A nova senha precisa ter pelo menos 6 caracteres.' },
        { status: 400 }
      )
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      return NextResponse.json(
        { error: `Não foi possível atualizar a senha: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: 'Sua senha foi atualizada com sucesso.',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno ao alterar senha'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

