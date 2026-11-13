'use client'

import React, { useActionState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { updatePassword } from '@/app/actions/auth'

export default function AtualizarSenhaPage() {
  const [state, formAction, isPending] = useActionState(updatePassword, null)

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex items-center justify-center p-[24px]">
      <div className="w-full max-w-[420px] bg-[var(--surface)] border border-[var(--line)] rounded-[18px] p-[32px] flex flex-col gap-[20px]">
        <div className="font-bold text-[26px] leading-none text-[#0066FF] tracking-[-0.5px]">
          coydash
        </div>

        <div className="flex flex-col gap-[8px]">
          <h1 className="font-semibold text-[32px] leading-[1.04] tracking-[-1px]">
            Definir nova senha
          </h1>
          <p className="text-[13.5px] text-[var(--ds-muted)]">
            Escolha sua nova senha de acesso para continuar.
          </p>
        </div>

        {state?.error && (
          <div className="p-3 bg-[var(--bg)] text-[#0066FF] border border-[#0066FF] text-[13px] rounded-[12px]">
            {state.error}
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-[16px]">
          <label className="flex flex-col gap-[8px] text-[12px] text-[var(--ds-muted)]">
            Nova senha
            <PasswordInput
              name="password"
              placeholder="Mínimo de 6 caracteres"
              required
              className="h-[48px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] text-[var(--fg)] rounded-[12px]"
            />
          </label>

          <Button
            className="w-full h-[50px] bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue-hover)] text-white rounded-full text-[14px] font-semibold flex justify-between items-center px-5 cursor-pointer"
            type="submit"
            disabled={isPending}
          >
            <span>{isPending ? 'Salvando...' : 'Salvar nova senha'}</span>
            <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
          </Button>
        </form>
      </div>
    </div>
  )
}

