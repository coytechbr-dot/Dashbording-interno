'use client'

import React, { useActionState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
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
  const [state, formAction, isPending] = useActionState(login, null)

  return (
    <div className="w-full min-h-screen bg-[var(--bg)] text-[var(--fg)] overflow-hidden grid grid-cols-1 md:grid-cols-2 p-[14px] gap-[14px] box-border">
      {/* Esquerda */}
      <div className="flex-1 flex flex-col p-[26px] md:pl-[40px] md:pr-[52px]">
        <div className="font-bold text-[26px] leading-none text-[#0066FF] tracking-[-0.5px]">
          coydash
        </div>

        <div className="my-auto flex flex-col gap-[28px] max-w-[400px] w-full mx-auto md:mx-0">
          <div className="flex flex-col gap-[10px]">
            <h1 className="font-semibold text-[42px] leading-[1.02] tracking-[-1.4px] text-balance">
              Que bom te ver de novo
            </h1>
            <p className="text-[14px] text-[var(--ds-muted)]">
              Seus sistemas, automações e o monitoramento 24/7 estão ativos. Entre para acessar sua operação.
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
              E-mail
              <Input
                type="email"
                name="email"
                placeholder="voce@empresa.com.br"
                required
                className="h-[48px] bg-[var(--surface)] border-[1.5px] border-[var(--color-brand-blue)] text-[var(--fg)] rounded-[12px]"
              />
            </label>

            <label className="flex flex-col gap-[8px] text-[12px] text-[var(--ds-muted)]">
              <div className="flex justify-between items-center">
                <span>Senha</span>
                <Link
                  href="/recuperar-senha"
                  className="text-[12px] text-[var(--color-brand-blue)] hover:underline"
                >
                  Esqueci a senha
                </Link>
              </div>
              <PasswordInput
                name="password"
                placeholder="••••••••"
                required
                className="h-[48px] bg-[var(--surface)] border-[1.5px] border-[var(--line2)] text-[var(--fg)] rounded-[12px]"
              />
            </label>

            <div className="flex flex-col gap-[14px] mt-2">
              <Button
                className="w-full h-[50px] bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue-hover)] text-white rounded-full text-[14px] font-semibold flex justify-between items-center px-5 cursor-pointer shadow-sm"
                type="submit"
                disabled={isPending}
              >
                <span>{isPending ? 'Entrando...' : 'Entrar na operação'}</span>
                <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
              </Button>

              <div className="flex items-center gap-[12px] text-[12px] text-[var(--ds-muted)]">
                <span className="flex-1 h-[1px] bg-[var(--line2)]"></span>
                ou continue com
                <span className="flex-1 h-[1px] bg-[var(--line2)]"></span>
              </div>

              <div className="grid grid-cols-2 gap-[10px]">
                <button
                  type="button"
                  className="flex items-center justify-center gap-[10px] h-[48px] bg-[var(--surface)] hover:bg-[var(--line2)] rounded-full text-[13px] font-medium transition-colors border border-[var(--line2)] text-[var(--fg)]"
                >
                  <span className="w-[18px] h-[18px] rounded-full border-[1.5px] border-[var(--fg)] flex items-center justify-center text-[10px] font-bold">
                    G
                  </span>
                  Google
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-[10px] h-[48px] bg-[var(--surface)] hover:bg-[var(--line2)] rounded-full text-[13px] font-medium transition-colors border border-[var(--line2)] text-[var(--fg)]"
                >
                  <span className="w-[18px] h-[18px] rounded-full border-[1.5px] border-[var(--fg)] flex items-center justify-center text-[10px] font-bold">
                    M
                  </span>
                  Microsoft
                </button>
              </div>
            </div>
          </form>

          <div className="text-[13px] text-[var(--ds-muted)]">
            Ainda não tem conta?{' '}
            <Link
              href="/cadastro"
              className="text-[var(--color-brand-orange)] hover:underline font-medium"
            >
              Criar operação
            </Link>
          </div>
        </div>

        <div className="text-[11px] text-[var(--ds-muted)] mt-auto">© 2026 coydash</div>
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

          {/* Card 2 (Acento Azul Gradiente / Imagem) */}
          <div className="absolute left-[180px] bottom-[70px] w-[210px] h-[280px] bg-accent-blue-card rounded-[14px] p-[18px] text-white flex flex-col overflow-hidden rotate-[3deg] shadow-[0_20px_40px_rgba(0,102,255,0.3)]">
            <div className="absolute inset-0 bg-black/15 pointer-events-none" />
            <div className="flex justify-between items-center text-[11px] font-semibold relative z-10">
              <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">02</span>
              <span className="flex items-center gap-[5px] font-medium bg-black/40 backdrop-blur-md text-white rounded-full px-[8px] py-[3px] text-[10px] border border-white/20">
                <span className="w-[6px] h-[6px] rounded-full bg-[#0066FF]"></span>
                5 agentes IA
              </span>
            </div>
            <div className="font-semibold text-[22px] leading-[1.05] tracking-[-0.4px] mt-[18px] relative z-10 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
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
