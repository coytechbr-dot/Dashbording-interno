'use client'

import React, { useActionState } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resetPassword } from '@/app/actions/auth'

export default function RecuperarSenhaPage() {
  const [state, formAction, isPending] = useActionState(resetPassword, null)

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex items-center justify-center p-[24px]">
      <div className="w-full max-w-[420px] bg-[var(--surface)] border border-[var(--line)] rounded-[18px] p-[32px] flex flex-col gap-[20px]">
        <div className="font-bold text-[26px] leading-none text-[#0066FF] tracking-[-0.5px]">
          coydash
        </div>

        <div className="flex flex-col gap-[8px]">
          <h1 className="font-semibold text-[32px] leading-[1.04] tracking-[-1px]">
            Recuperar senha
          </h1>
          <p className="text-[13.5px] text-[var(--ds-muted)]">
            Informe seu e-mail corporativo para receber o link de redefinição.
          </p>
        </div>

        {state?.error && (
          <div className="p-3 bg-[var(--bg)] text-[#0066FF] border border-[#0066FF] text-[13px] rounded-[12px]">
            {state.error}
          </div>
        )}

        {state?.success && (
          <div className="p-3 bg-[var(--bg)] text-[var(--fg)] border border-[#2f9e5a] text-[13px] rounded-[12px] flex items-center gap-[8px]">
            <span className="w-[6px] h-[6px] rounded-full bg-[#2f9e5a] shrink-0"></span>
            <span>{state.success}</span>
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-[16px]">
          <label className="flex flex-col gap-[8px] text-[12px] text-[var(--ds-muted)]">
            E-mail
            <Input
              type="email"
              name="email"
              placeholder="voce@empresa.com.br"
              required
              className="h-[48px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] text-[var(--fg)] rounded-[12px]"
            />
          </label>

          <Button
            className="w-full h-[50px] bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange-hover)] text-[#141414] rounded-full text-[14px] font-semibold flex justify-between items-center px-5 cursor-pointer"
            type="submit"
            disabled={isPending}
          >
            <span>{isPending ? 'Enviando...' : 'Enviar link de recuperação'}</span>
            <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
          </Button>
        </form>

        <div className="text-[13px] text-[var(--ds-muted)]">
          Lembrou da senha?{' '}
          <Link href="/login" className="text-[#0066FF] hover:underline font-medium">
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  )
}

