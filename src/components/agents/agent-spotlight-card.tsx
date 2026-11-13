import React from 'react'
import {
  ArrowUpRight,
  Bot,
  Copy,
  Check,
  Settings2,
  Trash2,
  Zap,
  Clock,
  Sparkles,
  Link as LinkIcon,
  Cpu,
  Layers,
  Terminal,
} from 'lucide-react'
import { AgentBanner, AgentBannerVariant } from './agent-banner'
import type { CoytechAgentSpec } from '@/types/coydash'

export interface CustomAgentItem {
  id: string
  organization_id: string | null
  name: string
  description: string
  webhook_url: string
  channel: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface NativeAgentCardProps {
  agent: CoytechAgentSpec
  onOpenDrawer: (agent: CoytechAgentSpec) => void
}

export function NativeAgentSpotlightCard({ agent, onOpenDrawer }: NativeAgentCardProps) {
  const getVariant = (code: string): AgentBannerVariant => {
    switch (code) {
      case 'A1':
        return 'A1'
      case 'A2':
        return 'A2'
      case 'A3':
        return 'A3'
      case 'A4':
        return 'A4'
      case 'A5':
        return 'A5'
      default:
        return 'A1'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Entregue':
        return '#2F9E5A'
      case 'Em andamento':
        return '#E8C14A'
      case 'Aguardando você':
      default:
        return '#0066FF'
    }
  }

  return (
    <div className="group bg-[var(--surface)] border border-[var(--line2)] hover:border-[#0066FF]/60 rounded-[20px] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* 1. TOPO: BANNER VISUAL 3D ESTILO SPOTLIGHT */}
      <div>
        <AgentBanner
          variant={getVariant(agent.code)}
          badgeLabel={`${agent.code} · ${agent.modelRouted}`}
          statusLabel="Online 24h"
          isOnline={true}
        />

        {/* 2. CORPO DO CARD: INFORMAÇÕES E METADADOS */}
        <div className="p-5 flex flex-col gap-3.5">
          {/* Título & Código do Agente */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[17px] font-bold text-[var(--fg)] tracking-[-0.3px] group-hover:text-[#0066FF] transition-colors">
                {agent.name}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--line2)] text-[10.5px] font-mono font-bold text-[var(--fg)] shrink-0">
                {agent.code}
              </span>
            </div>

            <p className="text-[12.5px] font-medium text-[var(--hero-sub)] mt-0.5">
              {agent.roleLabel}
            </p>
          </div>

          {/* Resumo da Entrega & Capacidade */}
          <p className="text-[12.5px] text-[var(--ds-muted)] leading-relaxed line-clamp-2">
            {agent.lastDeliverySummary}
          </p>

          {/* Gatilho / Trigger */}
          <div className="p-2.5 rounded-[10px] bg-[var(--bg)] border border-[var(--line)] flex items-start gap-2">
            <Zap className="w-3.5 h-3.5 text-[#0066FF] shrink-0 mt-0.5" />
            <div className="text-[11px] text-[var(--fg)] leading-snug line-clamp-2">
              <strong className="text-[var(--ds-muted)] font-medium">Gatilho: </strong>
              {agent.triggerDescription}
            </div>
          </div>

          {/* Ferramentas e Ferramental Habilitado */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="text-[10.5px] uppercase font-mono tracking-wider text-[var(--ds-muted)] font-semibold flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-[#0066FF]" />
              <span>Ferramentas Habilitadas ({agent.tools.length})</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {agent.tools.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded-[6px] bg-[var(--bg)] border border-[var(--line2)] text-[10.5px] text-[var(--fg)] font-medium font-mono"
                  title={t.description}
                >
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. RODAPÉ DE AÇÕES COM DESIGN SYSTEM ROOMIE OFFICE AI */}
      <div className="px-5 py-4 border-t border-[var(--line)] bg-[var(--bg)]/50 flex items-center justify-between gap-3">
        {/* Status com ponto de cor oficial */}
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getStatusColor(agent.status) }}
          />
          <span className="text-[11.5px] font-medium text-[var(--ds-muted)]">
            {agent.status}
          </span>
        </div>

        {/* Botão Primário em Pílula Laranja com Seta ↗ */}
        <button
          type="button"
          onClick={() => onOpenDrawer(agent)}
          className="h-[38px] px-4 rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-[#141414] font-semibold text-[12.5px] flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow"
        >
          <span>Conversar com Agente</span>
          <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>
    </div>
  )
}

interface CustomAgentCardProps {
  agent: CustomAgentItem
  onEdit: (agent: CustomAgentItem) => void
  onDelete: (id: string) => void
  onToggleActive: (agent: CustomAgentItem) => void
  onCopyWebhook: (id: string, url: string) => void
  isCopied: boolean
}

export function CustomAgentSpotlightCard({
  agent,
  onEdit,
  onDelete,
  onToggleActive,
  onCopyWebhook,
  isCopied,
}: CustomAgentCardProps) {
  const getChannelBadge = (ch: string) => {
    switch (ch) {
      case 'WHATSAPP_COMMERCIAL':
        return { label: 'WhatsApp Comercial (SDR)', variant: 'WHATSAPP_COMMERCIAL' }
      case 'WHATSAPP_CLIENTS':
        return { label: 'Suporte a Clientes (RAG)', variant: 'WHATSAPP_CLIENTS' }
      case 'INTERNAL_AUTOMATION':
      default:
        return { label: 'Automação & Processos n8n', variant: 'INTERNAL_AUTOMATION' }
    }
  }

  const channelInfo = getChannelBadge(agent.channel)

  return (
    <div className={`group bg-[var(--surface)] border rounded-[20px] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
      agent.is_active
        ? 'border-[var(--line2)] hover:border-[#0066FF]/60'
        : 'border-[var(--line2)] opacity-75'
    }`}>
      {/* 1. BANNER VISUAL 3D */}
      <div>
        <AgentBanner
          variant={channelInfo.variant}
          badgeLabel={`✦ ${channelInfo.label}`}
          statusLabel={agent.is_active ? 'Ativo Online' : 'Pausado'}
          isOnline={agent.is_active}
        />

        {/* 2. CORPO DO CARD */}
        <div className="p-5 flex flex-col gap-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-[17px] font-bold text-[var(--fg)] tracking-[-0.3px] group-hover:text-[#0066FF] transition-colors">
                {agent.name}
              </h3>
              <p className="text-[11.5px] font-medium text-[var(--ds-muted)] mt-0.5">
                {channelInfo.label}
              </p>
            </div>

            {/* Alternador Ativo / Pausado com 1 clique */}
            <button
              type="button"
              onClick={() => onToggleActive(agent)}
              className={`h-[26px] px-2.5 rounded-full text-[10.5px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 ${
                agent.is_active
                  ? 'bg-[#2F9E5A]/15 text-[#2F9E5A] border border-[#2F9E5A]/30 hover:bg-[#2F9E5A]/25'
                  : 'bg-[var(--bg)] text-[var(--ds-muted)] border border-[var(--line2)] hover:text-[var(--fg)]'
              }`}
              title={agent.is_active ? 'Clique para pausar este agente' : 'Clique para ativar este agente'}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  agent.is_active ? 'bg-[#2F9E5A]' : 'bg-[var(--ds-muted)]'
                }`}
              />
              <span>{agent.is_active ? 'Ativo' : 'Pausado'}</span>
            </button>
          </div>

          <p className="text-[12.5px] text-[var(--fg)] leading-relaxed line-clamp-2 min-h-[38px]">
            {agent.description || 'Agente customizado integrado ao n8n.'}
          </p>

          {/* Conexão com o n8n */}
          <div className="p-2.5 rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-[var(--ds-muted)] flex items-center gap-1.5">
                <LinkIcon className="w-3 h-3 text-[#0066FF]" />
                <span>Webhook do n8n:</span>
              </span>

              {agent.webhook_url && (
                <button
                  type="button"
                  onClick={() => onCopyWebhook(agent.id, agent.webhook_url)}
                  className="text-[#0066FF] hover:underline flex items-center gap-1 cursor-pointer font-medium text-[11px]"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 text-[#2F9E5A]" />
                      <span className="text-[#2F9E5A]">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="text-[11.5px] font-mono text-[var(--fg)] truncate">
              {agent.webhook_url ? (
                agent.webhook_url
              ) : (
                <span className="text-[var(--ds-muted)] italic">
                  Nenhum webhook conectado
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. RODAPÉ DE AÇÕES */}
      <div className="px-5 py-3.5 border-t border-[var(--line)] bg-[var(--bg)]/50 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onEdit(agent)}
          className="h-[32px] px-3 rounded-[8px] bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[11.5px] font-semibold text-[var(--fg)] flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5 text-[#0066FF]" />
          <span>Configurações</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(agent.id)}
          className="w-[32px] h-[32px] rounded-[8px] hover:bg-[#ef4444]/15 border border-transparent hover:border-[#ef4444]/30 text-[var(--ds-muted)] hover:text-[#ef4444] grid place-items-center cursor-pointer transition-colors"
          title="Excluir agente"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

