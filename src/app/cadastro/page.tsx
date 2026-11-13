'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowUpRight, Lock, ShieldCheck } from 'lucide-react'
import {
  IllustrationFocusRoom,
  IllustrationAiAgents,
  IllustrationTeamLounge,
} from '@/components/layout/roomie-illustrations'

export default function CadastroPage() {
  return (
    <div className="w-full min-h-screen bg-[var(--bg)] text-[var(--fg)] overflow-hidden grid grid-cols-1 md:grid-cols-2 p-[14px] gap-[14px] box-border">
      {/* Esquerda */}
      <div className="flex-1 flex flex-col p-[26px] md:pl-[40px] md:pr-[52px]">
        <div className="font-bold text-[26px] leading-none text-[#0066FF] tracking-[-0.5px]">
          coydash
        </div>

        <div className="my-auto flex flex-col gap-[24px] max-w-[420px] w-full mx-auto md:mx-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--line2)] text-[11.5px] font-semibold text-[#0066FF] w-fit">
            <Lock className="w-3.5 h-3.5" />
            <span>Plataforma Interna Coytech</span>
          </div>

          <div className="flex flex-col gap-[12px]">
            <h1 className="font-semibold text-[38px] leading-[1.04] tracking-[-1.2px] text-balance">
              Cadastro público desativado
            </h1>
            <p className="text-[14px] text-[var(--ds-muted)] leading-relaxed">
              O CoyDash é um ambiente interno restrito. Novas contas de acesso são criadas exclusivamente por membros autorizados dentro do painel administrativo da Coytech.
            </p>
          </div>

          <div className="p-4 rounded-[14px] bg-[var(--surface)] border border-[var(--line2)] flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#2F9E5A] shrink-0 mt-0.5" />
            <div className="text-[12.5px] text-[var(--fg)] leading-relaxed">
              Se você faz parte da equipe ou é um membro convidado, utilize o <strong>e-mail e senha</strong> fornecidos pela administração para entrar.
            </div>
          </div>

          <Link
            href="/login"
            className="w-full h-[50px] bg-[#0066FF] hover:bg-[#0052CC] text-[#141414] rounded-full text-[14px] font-semibold flex justify-between items-center px-5 cursor-pointer shadow-sm transition-colors"
          >
            <span>Ir para o Login</span>
            <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
          </Link>
        </div>

        <div className="text-[11px] text-[var(--ds-muted)] mt-auto">
          © 2026 coydash · Acesso Corporativo Interno
        </div>
      </div>

      {/* Direita */}
      <div className="hidden md:flex flex-1 m-[14px] ml-0 bg-[var(--hero)] rounded-[18px] relative overflow-hidden flex-col p-[40px]">
        <div className="text-[14px] text-[var(--hero-sub)]">
          Segurança &amp; Governança Corporativa
        </div>
        <div className="font-semibold text-[40px] leading-[1.02] tracking-[-1.4px] mt-[18px] max-w-[440px] text-balance text-[var(--fg)]">
          Acesso controlado diretamente pela equipe Coytech
        </div>

        <div className="absolute left-[40px] right-[-40px] bottom-[-30px] h-[360px]">
          <div className="absolute left-[0px] bottom-[40px] w-[210px] h-[280px] bg-[#f4f4f2] rounded-[14px] p-[18px] text-[#141414] flex flex-col overflow-hidden rotate-[-6deg]">
            <div className="flex justify-between items-center text-[11px] font-semibold relative z-10">
              <span className="text-[#0066FF]">01</span>
              <span className="flex items-center gap-[5px] font-medium bg-[#e6e5e1] text-[#141414] rounded-full px-[8px] py-[3px] text-[10px]">
                <span className="w-[5px] h-[5px] rounded-full bg-[#2f9e5a]"></span>
                Protegido
              </span>
            </div>
            <div className="font-semibold text-[18px] leading-[1.1] tracking-[-0.4px] mt-[14px] relative z-10">
              Operação &amp; Membros
            </div>
            <IllustrationFocusRoom className="absolute left-0 bottom-0 w-full pointer-events-none" />
          </div>

          <div className="absolute left-[185px] bottom-[60px] w-[210px] h-[280px] bg-[#0066FF] rounded-[14px] p-[18px] text-[#141414] flex flex-col overflow-hidden rotate-[2deg] z-10 shadow-xl">
            <div className="flex justify-between items-center text-[11px] font-semibold relative z-10">
              <span className="text-[#141414]/80">02</span>
              <span className="flex items-center gap-[5px] font-medium bg-black/15 text-[#141414] rounded-full px-[8px] py-[3px] text-[10px]">
                <span className="w-[5px] h-[5px] rounded-full bg-[#141414]"></span>
                IA 24h
              </span>
            </div>
            <div className="font-semibold text-[18px] leading-[1.1] tracking-[-0.4px] mt-[14px] relative z-10">
              Agentes &amp; MCP
            </div>
            <IllustrationAiAgents className="absolute left-0 bottom-0 w-full pointer-events-none" />
          </div>

          <div className="absolute left-[370px] bottom-[25px] w-[210px] h-[280px] bg-[#f4f4f2] rounded-[14px] p-[18px] text-[#141414] flex flex-col overflow-hidden rotate-[9deg]">
            <div className="flex justify-between items-center text-[11px] font-semibold relative z-10">
              <span className="text-[#0066FF]">03</span>
              <span className="flex items-center gap-[5px] font-medium bg-[#e6e5e1] text-[#141414] rounded-full px-[8px] py-[3px] text-[10px]">
                <span className="w-[5px] h-[5px] rounded-full bg-[#2f9e5a]"></span>
                Ativo
              </span>
            </div>
            <div className="font-semibold text-[18px] leading-[1.1] tracking-[-0.4px] mt-[14px] relative z-10">
              Clientes 360º
            </div>
            <IllustrationTeamLounge className="absolute left-0 bottom-0 w-full pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  )
}
