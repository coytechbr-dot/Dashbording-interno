'use client'

import React, { useActionState, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { signup } from '@/app/actions/auth'

export default function CadastroPage() {
  const [state, formAction, isPending] = useActionState(signup, null)
  const [selectedSize, setSelectedSize] = useState('6–20')
  const [passwordValue, setPasswordValue] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(true)

  const strengthLevel =
    passwordValue.length === 0
      ? 0
      : passwordValue.length < 6
        ? 1
        : passwordValue.length < 10
          ? 2
          : /[A-Z]/.test(passwordValue) && /[0-9]/.test(passwordValue)
            ? 4
            : 3

  return (
    <div className="w-full min-h-screen bg-[var(--bg)] text-[var(--fg)] overflow-hidden grid grid-cols-1 md:grid-cols-2 p-[14px] gap-[14px] box-border">
      {/* Esquerda (Exato de src/app/(auth)/cadastro/page.tsx do ROOMIE OFFICE AI) */}
      <div className="flex-1 flex flex-col p-[26px] md:pl-[40px] md:pr-[52px]">
        <div className="flex justify-between items-center mb-8 md:mb-0">
          <div className="font-bold text-[26px] leading-none text-[#0066FF] tracking-[-0.5px]">
            coydash
          </div>
          <div className="text-[12px] text-[var(--ds-muted)]">Etapa 1 de 2</div>
        </div>

        <div className="my-auto flex flex-col gap-[22px] max-w-[420px] w-full mx-auto md:mx-0 py-4">
          <div className="flex flex-col gap-[10px]">
            <h1 className="font-semibold text-[42px] leading-[1.02] tracking-[-1.4px] text-balance">
              Crie sua operação
            </h1>
            <p className="text-[14px] text-[var(--ds-muted)]">
              Monte o ecossistema da sua empresa em poucos minutos.
            </p>
          </div>

          {state?.error && (
            <div className="p-3 bg-[var(--surface)] text-[#0066FF] border border-[#0066FF] text-[13px] rounded-[12px]">
              {state.error}
            </div>
          )}

          <form action={formAction} className="flex flex-col gap-[14px]">
            <input type="hidden" name="team_size" value={selectedSize} />

            <div className="grid grid-cols-2 gap-[12px]">
              <label className="flex flex-col gap-[8px] text-[12px] text-[var(--ds-muted)]">
                Nome completo
                <Input
                  type="text"
                  name="name"
                  placeholder="Rodrigo Almeida"
                  required
                  className="h-[48px] bg-[var(--surface)] border-[1.5px] border-[var(--line2)] text-[var(--fg)] rounded-[12px]"
                />
              </label>
              <label className="flex flex-col gap-[8px] text-[12px] text-[var(--ds-muted)]">
                Empresa
                <Input
                  type="text"
                  name="company"
                  placeholder="Acme Ltda."
                  required
                  className="h-[48px] bg-[var(--surface)] border-[1.5px] border-[var(--line2)] text-[var(--fg)] rounded-[12px]"
                />
              </label>
            </div>

            <label className="flex flex-col gap-[8px] text-[12px] text-[var(--ds-muted)]">
              E-mail de trabalho
              <Input
                type="email"
                name="email"
                placeholder="voce@empresa.com.br"
                required
                className="h-[48px] bg-[var(--surface)] border-[1.5px] border-[var(--line2)] text-[var(--fg)] rounded-[12px]"
              />
            </label>

            <div className="flex flex-col gap-[6px]">
              <label className="flex flex-col gap-[8px] text-[12px] text-[var(--ds-muted)]">
                Senha
                <PasswordInput
                  name="password"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  required
                  className="h-[48px] bg-[var(--surface)] border-[1.5px] border-[var(--line2)] text-[var(--fg)] rounded-[12px]"
                />
              </label>
              <div className="grid grid-cols-4 gap-[4px] mt-1">
                {[1, 2, 3, 4].map((bar) => (
                  <span
                    key={bar}
                    className={`h-[3px] rounded-full transition-colors ${
                      strengthLevel >= bar ? 'bg-[#0066FF]' : 'bg-[var(--line2)]'
                    }`}
                  ></span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-[8px] text-[12px] text-[var(--ds-muted)] mt-2">
              Tamanho da equipe
              <div className="flex flex-wrap gap-[8px]">
                {['1–5', '6–20', '21–50', '51–200', '200+'].map((size) => {
                  const on = size === selectedSize
                  return (
                    <button
                      type="button"
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`flex items-center h-[36px] px-[14px] rounded-full text-[13px] cursor-pointer border-[1.5px] transition-colors ${
                        on
                          ? 'bg-[#0066FF] text-white border-[#0066FF] font-medium'
                          : 'bg-[var(--surface)] text-[var(--fg)] border-[var(--line2)]'
                      }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAcceptedTerms(!acceptedTerms)}
              className="flex items-center gap-[10px] text-[12px] text-[var(--ds-muted)] mt-2 text-left cursor-pointer"
            >
              <span
                className={`w-[16px] h-[16px] rounded-[4px] flex items-center justify-center shrink-0 border ${
                  acceptedTerms
                    ? 'bg-[#0066FF] border-[#0066FF] text-[#141414]'
                    : 'bg-[var(--surface)] border-[var(--line2)]'
                }`}
              >
                {acceptedTerms && (
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 8 8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <path d="m1 4 2 2 4-4"></path>
                  </svg>
                )}
              </span>
              <span>
                Concordo com os <span className="text-[#0066FF] underline">Termos de uso</span> e a{' '}
                <span className="text-[#0066FF] underline">Política de privacidade</span>
              </span>
            </button>

            <Button
              className="w-full h-[50px] bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange-hover)] text-[#141414] rounded-full text-[14px] font-semibold flex justify-between items-center px-5 mt-2 cursor-pointer"
              type="submit"
              disabled={isPending || !acceptedTerms}
            >
              <span>{isPending ? 'Criando...' : 'Criar operação'}</span>
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
            </Button>
          </form>

          <div className="text-[13px] text-[var(--ds-muted)]">
            Já tem uma conta?{' '}
            <Link
              href="/login"
              className="text-[var(--color-brand-orange)] hover:underline font-medium"
            >
              Entrar
            </Link>
          </div>
        </div>
      </div>

      {/* Direita (com Background Azul Gradiente / Imagem) */}
      <div className="hidden md:flex flex-1 m-[14px] ml-0 bg-accent-blue-card rounded-[18px] relative overflow-hidden flex-col p-[40px] text-white shadow-xl">
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        <div className="text-[14px] text-white/90 drop-shadow-sm">Seus primeiros agentes</div>
        <div className="font-semibold text-[40px] leading-[1.02] tracking-[-1.4px] mt-[18px] max-w-[440px] text-balance text-white drop-shadow-md">
          Uma equipe de IA pronta no primeiro dia
        </div>

        <div className="flex flex-col gap-[12px] mt-[28px] text-[14px] relative z-10 text-white drop-shadow-sm">
          <div className="flex items-center gap-[12px]">
            <span className="w-[24px] h-[24px] rounded-full bg-white text-[#0066FF] flex items-center justify-center text-[11px] font-bold flex-none shadow-sm">
              1
            </span>
            <span>
              <b className="font-semibold text-white">Coytech Studio</b> — filas com aprovação em 1 clique (&lt; 3s)
            </span>
          </div>
          <div className="flex items-center gap-[12px]">
            <span className="w-[24px] h-[24px] rounded-full bg-white text-[#0066FF] flex items-center justify-center text-[11px] font-bold flex-none shadow-sm">
              2
            </span>
            <span>
              <b className="font-semibold text-white">Coytech Flow</b> — 5 agentes de IA e automações n8n
            </span>
          </div>
          <div className="flex items-center gap-[12px]">
            <span className="w-[24px] h-[24px] rounded-full bg-white text-[#0066FF] flex items-center justify-center text-[11px] font-bold flex-none shadow-sm">
              3
            </span>
            <span>
              <b className="font-semibold text-white">Coytech Pulse</b> — monitoramento 4 camadas e motor BIA
            </span>
          </div>
        </div>

        <svg
          viewBox="0 10 200 140"
          className="absolute left-[10%] bottom-0 w-[80%] opacity-85"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M30 40v14M23 47h14M44 24v8M40 28h8"></path>
          <path d="M104 56V40"></path>
          <circle cx="104" cy="35" r="5" fill="#141414"></circle>
          <rect x="50" y="78" width="10" height="24" rx="4"></rect>
          <rect x="148" y="78" width="10" height="24" rx="4"></rect>
          <rect x="60" y="56" width="88" height="70" rx="18" fill="#0066FF"></rect>
          <rect x="72" y="72" width="64" height="30" rx="15" fill="#141414"></rect>
          <circle cx="92" cy="87" r="5" fill="#0066FF" stroke="none"></circle>
          <circle cx="116" cy="87" r="5" fill="#0066FF" stroke="none"></circle>
          <path d="M96 112c5 4 11 4 16 0"></path>
          <path d="M52 152C56 138 68 132 84 132H124C140 132 152 138 156 152" fill="#0066FF"></path>
          <path d="M104 132V152M90 140h28"></path>
          <rect x="140" y="14" width="54" height="30" rx="10" fill="#f4f4f2"></rect>
          <path d="M150 44 146 54 160 44"></path>
          <circle cx="156" cy="29" r="2.5" fill="#141414" stroke="none"></circle>
          <circle cx="167" cy="29" r="2.5" fill="#141414" stroke="none"></circle>
          <circle cx="178" cy="29" r="2.5" fill="#141414" stroke="none"></circle>
        </svg>
      </div>
    </div>
  )
}

