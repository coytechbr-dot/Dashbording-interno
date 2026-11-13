'use client'

import React, { useActionState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowUpRight, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { login } from '@/app/actions/auth'
import {
  IllustrationFocusRoom,
  IllustrationAiAgents,
  IllustrationTeamLounge,
} from '@/components/layout/roomie-illustrations'

function LoginForm() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const prefilledEmail = searchParams.get('email') || ''
  const [state, formAction, isPending] = useActionState(login, null)

  return (
    <div className="w-full min-h-screen bg-[var(--bg)] text-[var(--fg)] overflow-hidden grid grid-cols-1 md:grid-cols-2 p-[14px] gap-[14px] box-border">
      {/* Esquerda */}
      <div className="flex-1 flex flex-col p-[26px] md:pl-[40px] md:pr-[52px]">
        <div className="font-bold text-[26px] leading-none text-[#0066FF] tracking-[-0.5px]">
          coydash
        </div>

        <div className="my-auto flex flex-col gap-[26px] max-w-[400px] w-full mx-auto md:mx-0">
          <div className="flex flex-col gap-[10px]">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--line2)] text-[11px] font-semibold text-[#0066FF] w-fit">
              <Lock className="w-3 h-3" />
              <span>Plataforma Interna Coytech</span>
            </div>

            <h1 className="font-semibold text-[42px] leading-[1.02] tracking-[-1.4px] text-balance">
              Que bom te ver de novo
            </h1>
            <p className="text-[14px] text-[var(--ds-muted)]">
              Entre com seu e-mail Coytech ou credenciais de membro cadastradas no sistema.
            </p>
          </div>

          {message && (
            <div className="p-3 bg-[var(--surface)] text-[var(--fg)] border border-[#2f9e5a] text-[13px] rounded-[12px] flex items-center gap-[8px]">
              <span className="w-[6px] h-[6px] rounded-full bg-[#2f9e5a] shrink-0"></span>
              <span>{message}</span>
            </div>
          )}

          {state?.error && (
            <div className="p-3 bg-[var(--surface)] text-[#0066FF] border border-[#0066FF] text-[13px] rounded-[12px]">
              {state.error}
            </div>
          )}

          <form action={formAction} className="flex flex-col gap-[16px]">
            <label className="flex flex-col gap-[8px] text-[12px] text-[var(--ds-muted)]">
              E-mail de Acesso
              <Input
                type="email"
                name="email"
                defaultValue={prefilledEmail}
                placeholder="nome@coytech.com.br"
                required
                className="h-[48px] bg-[var(--surface)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] text-[var(--fg)] rounded-[12px]"
              />
            </label>

            <label className="flex flex-col gap-[8px] text-[12px] text-[var(--ds-muted)]">
              <div className="flex justify-between items-center">
                <span>Senha</span>
                <Link
                  href="/recuperar-senha"
                  className="text-[12px] text-[#0066FF] hover:underline font-medium"
                >
                  Esqueci a senha
                </Link>
              </div>
              <PasswordInput
                name="password"
                placeholder="••••••••"
                required
                className="h-[48px] bg-[var(--surface)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] text-[var(--fg)] rounded-[12px]"
              />
            </label>

            <div className="flex flex-col gap-[14px] mt-2">
              <Button
                className="w-full h-[50px] bg-[#0066FF] hover:bg-[#0052CC] text-[#141414] rounded-full text-[14px] font-semibold flex justify-between items-center px-5 cursor-pointer shadow-sm transition-colors"
                type="submit"
                disabled={isPending}
              >
                <span>{isPending ? 'Autenticando...' : 'Entrar na operação'}</span>
                <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
              </Button>
            </div>
          </form>

          <div className="p-3.5 rounded-[12px] bg-[var(--surface)] border border-[var(--line)] text-[12px] text-[var(--ds-muted)] leading-relaxed">
            Acesso restrito a colaboradores e parceiros autorizados. Caso precise de acesso ou alteração de senha, solicite diretamente a um membro administrador.
          </div>
        </div>

        <div className="text-[11px] text-[var(--ds-muted)] mt-auto">© 2026 coydash · Acesso Interno</div>
      </div>

      {/* Direita */}
      <div className="hidden md:flex flex-1 m-[14px] ml-0 bg-[var(--hero)] rounded-[18px] relative overflow-hidden flex-col p-[40px]">
        <div className="text-[14px] text-[var(--hero-sub)]">
          Sistemas + Automação + Monitoramento
        </div>
        <div className="font-semibold text-[40px] leading-[1.02] tracking-[-1.4px] mt-[18px] max-w-[440px] text-balance text-[var(--fg)]">
          Sua operação inteira blindada no mesmo lugar
        </div>

        <div className="absolute left-[40px] right-[-40px] bottom-[-30px] h-[360px]">
          {/* Card 1 */}
          <div className="absolute left-[0px] bottom-[40px] w-[210px] h-[280px] bg-[#f4f4f2] rounded-[14px] p-[18px] text-[#141414] flex flex-col overflow-hidden rotate-[-6deg]">
            <div className="flex justify-between items-center text-[11px] font-semibold relative z-10">
              <span className="text-[#0066FF]">01</span>
              <span className="flex items-center gap-[5px] font-medium bg-[#e6e5e1] text-[#141414] rounded-full px-[8px] py-[3px] text-[10px]">
                <span className="w-[6px] h-[6px] rounded-full bg-[#2f9e5a]"></span>
                1-clique &lt; 3s
              </span>
            </div>
            <div className="font-medium text-[22px] leading-[1.05] tracking-[-0.4px] mt-[18px] relative z-10">
              Coytech
              <br />
              Studio
            </div>
            <IllustrationFocusRoom />
          </div>

          {/* Card 2 (Laranja Oficial #0066FF) */}
          <div className="absolute left-[180px] bottom-[70px] w-[210px] h-[280px] bg-[#0066FF] rounded-[14px] p-[18px] text-[#141414] flex flex-col overflow-hidden rotate-[3deg] shadow-[0_20px_40px_rgba(240,82,31,0.3)] z-10">
            <div className="flex justify-between items-center text-[11px] font-semibold relative z-10">
              <span className="text-[#141414]/80">02</span>
              <span className="flex items-center gap-[5px] font-medium bg-black/15 text-[#141414] rounded-full px-[8px] py-[3px] text-[10px]">
                <span className="w-[6px] h-[6px] rounded-full bg-[#141414]"></span>
                5 agentes IA
              </span>
            </div>
            <div className="font-semibold text-[22px] leading-[1.05] tracking-[-0.4px] mt-[18px] relative z-10 text-[#141414]">
              Coytech
              <br />
              Flow
            </div>
            <div className="relative z-10 mt-auto">
              <IllustrationAiAgents />
            </div>
          </div>

          {/* Card 3 */}
          <div className="absolute left-[360px] bottom-[20px] w-[210px] h-[280px] bg-[#f4f4f2] rounded-[14px] p-[18px] text-[#141414] flex flex-col overflow-hidden rotate-[9deg] shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
            <div className="flex justify-between items-center text-[11px] font-semibold relative z-10">
              <span className="text-[#0066FF]">03</span>
              <span className="flex items-center gap-[5px] font-medium bg-[#e6e5e1] text-[#141414] rounded-full px-[8px] py-[3px] text-[10px]">
                <span className="w-[6px] h-[6px] rounded-full bg-[#2f9e5a]"></span>
                4 camadas
              </span>
            </div>
            <div className="font-medium text-[22px] leading-[1.05] tracking-[-0.4px] mt-[18px] relative z-10">
              Coytech
              <br />
              Pulse
            </div>
            <IllustrationTeamLounge />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center p-4 text-[13px]">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  )
}
