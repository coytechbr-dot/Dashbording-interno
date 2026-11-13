import React from 'react'

export type AgentBannerVariant =
  | 'A1' // Vendas & Qualificador (Laranja Coytech #0066FF)
  | 'A2' // Recuperador & Cobrança (Âmbar / Dourado)
  | 'A3' // Suporte N1 & RAG (Cyan / Vidro 3D)
  | 'A4' // Sucesso do Cliente & LTV (Violeta Cósmico)
  | 'A5' // SRE Copilot & Causa Raiz (Esmeralda Cyber)
  | 'WHATSAPP_COMMERCIAL' // Custom SDR
  | 'WHATSAPP_CLIENTS' // Custom Suporte
  | 'INTERNAL_AUTOMATION' // Custom Processos n8n

interface AgentBannerProps {
  variant: AgentBannerVariant | string
  badgeLabel?: string
  statusLabel?: string
  isOnline?: boolean
}

export function AgentBanner({
  variant,
  badgeLabel,
  statusLabel = 'Online 24h',
  isOnline = true,
}: AgentBannerProps) {
  // Configuração de cores e estilos por variante
  switch (variant) {
    case 'A1':
    case 'WHATSAPP_COMMERCIAL':
    case 'ORANGE_COSMIC':
      return (
        <div className="relative w-full h-[140px] overflow-hidden rounded-t-[18px] bg-gradient-to-br from-[#2a0f05] via-[#141414] to-[#3d1607] select-none border-b border-[#0066FF]/20">
          {/* Efeito de Nebulosa / Luz Ambiente */}
          <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-[#0066FF]/25 blur-[45px] pointer-events-none" />
          <div className="absolute -bottom-8 right-0 w-36 h-36 rounded-full bg-[#0052CC]/20 blur-[40px] pointer-events-none" />

          {/* Malha de Partículas Estelares (SVG) */}
          <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="28" r="1" fill="#FFFFFF" />
            <circle cx="85" cy="42" r="1.5" fill="#0066FF" />
            <circle cx="140" cy="20" r="1" fill="#FFFFFF" opacity="0.6" />
            <circle cx="180" cy="75" r="1.2" fill="#FF8D66" />
            <circle cx="230" cy="35" r="1.5" fill="#FFFFFF" />
            <circle cx="280" cy="90" r="1" fill="#0066FF" opacity="0.8" />
            <circle cx="340" cy="50" r="1.2" fill="#FFFFFF" />
          </svg>

          {/* Objeto 3D: Esfera Líquida Translúcida & Anéis Orbitais */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-[110px] h-[110px] pointer-events-none">
            <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-[0_8px_20px_rgba(240,82,31,0.4)]">
              <defs>
                <radialGradient id="sphereGradOrange" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#FFF2ED" stopOpacity="0.95" />
                  <stop offset="25%" stopColor="#FF7A4A" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#0066FF" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#1C0600" stopOpacity="0.9" />
                </radialGradient>
                <linearGradient id="ringGradOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFA07A" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#0066FF" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.9" />
                </linearGradient>
              </defs>

              {/* Anel Orbital Traseiro */}
              <ellipse
                cx="60"
                cy="60"
                rx="52"
                ry="18"
                fill="none"
                stroke="url(#ringGradOrange)"
                strokeWidth="1.6"
                strokeDasharray="4 2"
                transform="rotate(-25 60 60)"
                opacity="0.7"
              />

              {/* Esfera 3D com Refração Líquida */}
              <circle cx="60" cy="60" r="34" fill="url(#sphereGradOrange)" />

              {/* Reflexo Especular da Luz */}
              <ellipse cx="49" cy="48" rx="14" ry="8" fill="#FFFFFF" opacity="0.45" transform="rotate(-30 49 48)" />
              <circle cx="43" cy="43" r="3" fill="#FFFFFF" opacity="0.8" />

              {/* Anel Orbital Frontal */}
              <path
                d="M 12 76 A 52 18 0 0 0 108 44"
                fill="none"
                stroke="url(#ringGradOrange)"
                strokeWidth="2.2"
                transform="rotate(-25 60 60)"
              />
            </svg>
          </div>

          {/* Chips e Metadados sobre a Imagem */}
          <div className="absolute inset-0 p-3.5 flex flex-col justify-between pointer-events-none">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141414]/75 backdrop-blur-md border border-[#0066FF]/40 text-[11px] font-semibold text-[#FFF]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-pulse" />
                <span>{badgeLabel || '✦ Vendas & Qualificação'}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#141414]/70 backdrop-blur-md border border-white/10 text-[10px] font-medium text-[var(--fg2)]">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#2F9E5A]' : 'bg-[var(--ds-muted)]'}`} />
                <span>{statusLabel}</span>
              </div>
            </div>

            <div className="text-[10px] tracking-wider uppercase font-mono text-[#0066FF]/90 font-bold">
              Cognitive Sales Engine
            </div>
          </div>
        </div>
      )

    case 'A2':
    case 'AMBER_GOLD':
      return (
        <div className="relative w-full h-[140px] overflow-hidden rounded-t-[18px] bg-gradient-to-br from-[#291b05] via-[#141414] to-[#3d2908] select-none border-b border-[#E8C14A]/20">
          <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-[#E8C14A]/20 blur-[45px] pointer-events-none" />
          <div className="absolute -bottom-8 right-0 w-36 h-36 rounded-full bg-[#D49E24]/20 blur-[40px] pointer-events-none" />

          {/* Malha de Partículas Douradas */}
          <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
            <circle cx="30" cy="30" r="1" fill="#FFEDBA" />
            <circle cx="95" cy="50" r="1.4" fill="#E8C14A" />
            <circle cx="160" cy="25" r="1" fill="#FFFFFF" opacity="0.7" />
            <circle cx="210" cy="80" r="1.5" fill="#E8C14A" />
            <circle cx="290" cy="40" r="1" fill="#FFFFFF" />
          </svg>

          {/* Objeto 3D: Prisma Facetado / Escudo Dourado de Alçada */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-[110px] h-[110px] pointer-events-none">
            <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-[0_8px_20px_rgba(232,193,74,0.35)]">
              <defs>
                <linearGradient id="shieldGradGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF9E6" />
                  <stop offset="40%" stopColor="#E8C14A" />
                  <stop offset="80%" stopColor="#B38612" />
                  <stop offset="100%" stopColor="#3B2A03" />
                </linearGradient>
                <linearGradient id="shieldFacet2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFDF78" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#694C05" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Ondas Concéntricas de Recuperação */}
              <circle cx="60" cy="60" r="48" fill="none" stroke="#E8C14A" strokeWidth="1" opacity="0.3" strokeDasharray="3 3" />
              <circle cx="60" cy="60" r="40" fill="none" stroke="#E8C14A" strokeWidth="1.2" opacity="0.5" />

              {/* Diamante 3D Facetado */}
              <polygon points="60,24 88,48 60,96 32,48" fill="url(#shieldGradGold)" />
              <polygon points="60,24 88,48 60,68" fill="url(#shieldFacet2)" />
              <polygon points="60,24 32,48 60,68" fill="#FFF9E6" opacity="0.4" />
              <polygon points="60,68 88,48 60,96" fill="#3B2A03" opacity="0.6" />

              {/* Linha Central Brilhante */}
              <line x1="60" y1="24" x2="60" y2="96" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.8" />
            </svg>
          </div>

          <div className="absolute inset-0 p-3.5 flex flex-col justify-between pointer-events-none">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141414]/75 backdrop-blur-md border border-[#E8C14A]/40 text-[11px] font-semibold text-[#FFF]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8C14A] animate-pulse" />
                <span>{badgeLabel || '✦ Recuperação & Cobrança'}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#141414]/70 backdrop-blur-md border border-white/10 text-[10px] font-medium text-[var(--fg2)]">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#2F9E5A]' : 'bg-[var(--ds-muted)]'}`} />
                <span>{statusLabel}</span>
              </div>
            </div>

            <div className="text-[10px] tracking-wider uppercase font-mono text-[#E8C14A]/90 font-bold">
              Autonomous Billing Guard
            </div>
          </div>
        </div>
      )

    case 'A3':
    case 'WHATSAPP_CLIENTS':
    case 'CYAN_GLASS':
      return (
        <div className="relative w-full h-[140px] overflow-hidden rounded-t-[18px] bg-gradient-to-br from-[#061e29] via-[#141414] to-[#0a2e3d] select-none border-b border-[#38bdf8]/20">
          <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-[#38bdf8]/20 blur-[45px] pointer-events-none" />
          <div className="absolute -bottom-8 right-0 w-36 h-36 rounded-full bg-[#0284c7]/20 blur-[40px] pointer-events-none" />

          {/* Malha de Constelações Vetoriais RAG */}
          <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
            <line x1="30" y1="40" x2="80" y2="70" stroke="#38bdf8" strokeWidth="0.8" opacity="0.4" />
            <line x1="80" y1="70" x2="130" y2="35" stroke="#38bdf8" strokeWidth="0.8" opacity="0.4" />
            <line x1="130" y1="35" x2="170" y2="80" stroke="#38bdf8" strokeWidth="0.8" opacity="0.4" />
            <circle cx="30" cy="40" r="1.5" fill="#FFFFFF" />
            <circle cx="80" cy="70" r="2" fill="#38bdf8" />
            <circle cx="130" cy="35" r="1.5" fill="#FFFFFF" />
            <circle cx="170" cy="80" r="2" fill="#38bdf8" />
          </svg>

          {/* Objeto 3D: Esfera de Conhecimento RAG com Nós de Vidro */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-[110px] h-[110px] pointer-events-none">
            <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-[0_8px_20px_rgba(56,189,248,0.35)]">
              <defs>
                <radialGradient id="sphereGradCyan" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#E0F7FF" stopOpacity="0.95" />
                  <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.85" />
                  <stop offset="70%" stopColor="#0284c7" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#032030" stopOpacity="0.9" />
                </radialGradient>
              </defs>

              {/* Halo de Vidro Fosco */}
              <circle cx="60" cy="60" r="44" fill="none" stroke="#38bdf8" strokeWidth="1.2" opacity="0.4" strokeDasharray="4 2" />

              {/* Esfera Central de Dados */}
              <circle cx="60" cy="60" r="32" fill="url(#sphereGradCyan)" />

              {/* Nós Neurais Conectados na Superfície */}
              <circle cx="48" cy="48" r="4" fill="#FFFFFF" opacity="0.9" />
              <circle cx="72" cy="52" r="3.5" fill="#BAE6FD" opacity="0.8" />
              <circle cx="56" cy="74" r="3.5" fill="#7DD3FC" opacity="0.8" />
              <line x1="48" y1="48" x2="72" y2="52" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.7" />
              <line x1="48" y1="48" x2="56" y2="74" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.7" />
              <line x1="72" y1="52" x2="56" y2="74" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.7" />
            </svg>
          </div>

          <div className="absolute inset-0 p-3.5 flex flex-col justify-between pointer-events-none">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141414]/75 backdrop-blur-md border border-[#38bdf8]/40 text-[11px] font-semibold text-[#FFF]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
                <span>{badgeLabel || '✦ Suporte N1 & RAG'}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#141414]/70 backdrop-blur-md border border-white/10 text-[10px] font-medium text-[var(--fg2)]">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#2F9E5A]' : 'bg-[var(--ds-muted)]'}`} />
                <span>{statusLabel}</span>
              </div>
            </div>

            <div className="text-[10px] tracking-wider uppercase font-mono text-[#38bdf8]/90 font-bold">
              pgvector Knowledge Core
            </div>
          </div>
        </div>
      )

    case 'A4':
    case 'VIOLET_NEURAL':
      return (
        <div className="relative w-full h-[140px] overflow-hidden rounded-t-[18px] bg-gradient-to-br from-[#200a2e] via-[#141414] to-[#340f4a] select-none border-b border-[#a855f7]/20">
          <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-[#a855f7]/20 blur-[45px] pointer-events-none" />
          <div className="absolute -bottom-8 right-0 w-36 h-36 rounded-full bg-[#7c3aed]/20 blur-[40px] pointer-events-none" />

          {/* Partículas de Pulso */}
          <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="30" r="1.5" fill="#E9D5FF" />
            <circle cx="100" cy="65" r="1" fill="#C084FC" />
            <circle cx="170" cy="20" r="1.8" fill="#FFFFFF" />
            <circle cx="230" cy="85" r="1.2" fill="#A855F7" />
          </svg>

          {/* Objeto 3D: Prisma Piramidal de Retenção & LTV */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-[110px] h-[110px] pointer-events-none">
            <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-[0_8px_20px_rgba(168,85,247,0.35)]">
              <defs>
                <linearGradient id="prismVioletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F5EEFF" />
                  <stop offset="35%" stopColor="#C084FC" />
                  <stop offset="70%" stopColor="#7E22CE" />
                  <stop offset="100%" stopColor="#2E0854" />
                </linearGradient>
              </defs>

              {/* Anéis de Pulso LTV */}
              <ellipse cx="60" cy="75" rx="46" ry="16" fill="none" stroke="#C084FC" strokeWidth="1.2" opacity="0.4" strokeDasharray="3 3" />

              {/* Prisma 3D */}
              <polygon points="60,20 92,72 60,82 28,72" fill="url(#prismVioletGrad)" />
              <polygon points="60,20 92,72 60,82" fill="#FFFFFF" opacity="0.25" />
              <polygon points="60,20 28,72 60,82" fill="#3B0764" opacity="0.6" />

              {/* Feixe de Luz Holográfica Ascendente */}
              <line x1="60" y1="82" x2="60" y2="12" stroke="#FFFFFF" strokeWidth="1.8" opacity="0.85" />
              <circle cx="60" cy="14" r="2.5" fill="#FFFFFF" />
            </svg>
          </div>

          <div className="absolute inset-0 p-3.5 flex flex-col justify-between pointer-events-none">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141414]/75 backdrop-blur-md border border-[#a855f7]/40 text-[11px] font-semibold text-[#FFF]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7] animate-pulse" />
                <span>{badgeLabel || '✦ Sucesso do Cliente & LTV'}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#141414]/70 backdrop-blur-md border border-white/10 text-[10px] font-medium text-[var(--fg2)]">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#2F9E5A]' : 'bg-[var(--ds-muted)]'}`} />
                <span>{statusLabel}</span>
              </div>
            </div>

            <div className="text-[10px] tracking-wider uppercase font-mono text-[#a855f7]/90 font-bold">
              Predictive Health & Churn
            </div>
          </div>
        </div>
      )

    case 'A5':
    case 'INTERNAL_AUTOMATION':
    case 'EMERALD_RADAR':
    default:
      return (
        <div className="relative w-full h-[140px] overflow-hidden rounded-t-[18px] bg-gradient-to-br from-[#062419] via-[#141414] to-[#0a3826] select-none border-b border-[#2f9e5a]/20">
          <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-[#2f9e5a]/20 blur-[45px] pointer-events-none" />
          <div className="absolute -bottom-8 right-0 w-36 h-36 rounded-full bg-[#15803d]/20 blur-[40px] pointer-events-none" />

          {/* Retículo de Radar Militar / SRE */}
          <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="70" x2="380" y2="70" stroke="#2f9e5a" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.5" />
            <line x1="190" y1="0" x2="190" y2="140" stroke="#2f9e5a" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.5" />
            <circle cx="60" cy="40" r="1" fill="#FFFFFF" />
            <circle cx="120" cy="95" r="1.5" fill="#4ade80" />
            <circle cx="280" cy="30" r="1.2" fill="#FFFFFF" />
          </svg>

          {/* Objeto 3D: Radar Cibernético SRE & Feixe Circular */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-[110px] h-[110px] pointer-events-none">
            <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-[0_8px_20px_rgba(47,158,90,0.35)]">
              <defs>
                <radialGradient id="radarSweepGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity="0.7" />
                  <stop offset="70%" stopColor="#15803d" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#042617" stopOpacity="0.0" />
                </radialGradient>
              </defs>

              {/* Anéis de Varredura */}
              <circle cx="60" cy="60" r="46" fill="none" stroke="#2f9e5a" strokeWidth="1.2" opacity="0.4" />
              <circle cx="60" cy="60" r="32" fill="none" stroke="#4ade80" strokeWidth="1.4" opacity="0.6" strokeDasharray="4 2" />
              <circle cx="60" cy="60" r="18" fill="none" stroke="#86efac" strokeWidth="1.2" opacity="0.8" />

              {/* Feixe Angular de Varredura 3D */}
              <path d="M 60 60 L 96 36 A 46 46 0 0 1 106 60 Z" fill="url(#radarSweepGrad)" opacity="0.75" />

              {/* Ponto Central de Foco */}
              <circle cx="60" cy="60" r="4.5" fill="#FFFFFF" />
              <circle cx="60" cy="60" r="2" fill="#141414" />

              {/* Alvo Localizado */}
              <circle cx="82" cy="45" r="3.5" fill="#4ade80" className="animate-ping" opacity="0.75" />
              <circle cx="82" cy="45" r="3" fill="#FFFFFF" />
            </svg>
          </div>

          <div className="absolute inset-0 p-3.5 flex flex-col justify-between pointer-events-none">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141414]/75 backdrop-blur-md border border-[#2f9e5a]/40 text-[11px] font-semibold text-[#FFF]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2f9e5a] animate-pulse" />
                <span>{badgeLabel || '✦ SRE Copilot & Causa Raiz'}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#141414]/70 backdrop-blur-md border border-white/10 text-[10px] font-medium text-[var(--fg2)]">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#2F9E5A]' : 'bg-[var(--ds-muted)]'}`} />
                <span>{statusLabel}</span>
              </div>
            </div>

            <div className="text-[10px] tracking-wider uppercase font-mono text-[#2f9e5a]/90 font-bold">
              Sub-60s Telemetry Guard
            </div>
          </div>
        </div>
      )
  }
}

