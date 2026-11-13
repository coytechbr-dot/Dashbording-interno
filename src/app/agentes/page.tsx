'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  RefreshCw,
  X,
  Bot,
  Sparkles,
  Layers,
  Zap,
  ArrowUpRight,
  Shield,
  Activity,
} from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'
import {
  NativeAgentSpotlightCard,
  CustomAgentSpotlightCard,
  type CustomAgentItem,
} from '@/components/agents/agent-spotlight-card'
import type { CoytechAgentSpec } from '@/types/coydash'

export default function AgentesIaPage() {
  const { currentOrg, agents: nativeAgents, setActiveAgentDrawer } = useCoyDash()

  const [customAgents, setCustomAgents] = useState<CustomAgentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'NATIVE' | 'CUSTOM'>('ALL')

  // Modal Criar / Editar Agente
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<CustomAgentItem | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [channel, setChannel] = useState('WHATSAPP_COMMERCIAL')
  const [isActive, setIsActive] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const fetchAgents = useCallback(async () => {
    try {
      const orgParam =
        currentOrg.id && currentOrg.id !== 'org-default'
          ? `?orgId=${encodeURIComponent(currentOrg.id)}`
          : ''
      const res = await fetch(`/api/agents${orgParam}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setCustomAgents(data.agents || [])
    } catch (err) {
      console.error('Erro ao buscar agentes customizados:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrg.id])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const handleCopyWebhook = async (id: string, url: string) => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Fallback
    }
  }

  const handleToggleActive = async (agent: CustomAgentItem) => {
    const nextState = !agent.is_active
    setCustomAgents((prev) =>
      prev.map((ag) => (ag.id === agent.id ? { ...ag, is_active: nextState } : ag))
    )
    await fetch('/api/agents', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: agent.id,
        is_active: nextState,
      }),
    })
  }

  const openCreateModal = () => {
    setEditingAgent(null)
    setName('')
    setDescription('')
    setWebhookUrl('')
    setChannel('WHATSAPP_COMMERCIAL')
    setIsActive(true)
    setModalOpen(true)
  }

  const openEditModal = (agent: CustomAgentItem) => {
    setEditingAgent(agent)
    setName(agent.name)
    setDescription(agent.description || '')
    setWebhookUrl(agent.webhook_url || '')
    setChannel(agent.channel || 'WHATSAPP_COMMERCIAL')
    setIsActive(agent.is_active)
    setModalOpen(true)
  }

  const handleSaveAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsSaving(true)

    try {
      if (editingAgent) {
        await fetch('/api/agents', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingAgent.id,
            name: name.trim(),
            description: description.trim(),
            webhook_url: webhookUrl.trim(),
            channel,
            is_active: isActive,
          }),
        })
      } else {
        await fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            webhook_url: webhookUrl.trim(),
            channel,
            is_active: isActive,
            orgId: currentOrg.id !== 'org-default' ? currentOrg.id : null,
          }),
        })
      }

      setModalOpen(false)
      await fetchAgents()
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAgent = async (id: string) => {
    if (!confirm('Tem certeza de que deseja remover este agente?')) return
    setCustomAgents((prev) => prev.filter((ag) => ag.id !== id))
    await fetch(`/api/agents?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  // Estatísticas Consolidadas
  const totalAgentsCount = nativeAgents.length + customAgents.length
  const activeCustomCount = customAgents.filter((a) => a.is_active).length
  const totalActiveOnline = nativeAgents.length + activeCustomCount
  const connectedWebhooks = customAgents.filter((a) => a.webhook_url).length
  const totalDeliveriesToday = nativeAgents.reduce((acc, a) => acc + (a.deliveriesToday || 0), 0)

  // Filtragem de Agentes
  const showNative = activeFilter === 'ALL' || activeFilter === 'NATIVE'
  const showCustom = activeFilter === 'ALL' || activeFilter === 'CUSTOM'

  return (
    <div className="px-[26px] pt-[20px] pb-[50px] flex flex-col gap-[24px] max-w-[1700px] mx-auto text-[var(--fg)]">
      {/* ===================================================================== */}
      {/* 1. CABEÇALHO EXECUTIVO COM DESIGN SYSTEM ROOMIE OFFICE AI             */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[28px] font-bold tracking-[-0.8px] text-[var(--fg)]">
              Agentes de IA &amp; Automação Cognitiva
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#0066FF]/15 border border-[#0066FF]/30 text-[11px] font-bold text-[#0066FF]">
              5 Nativos + {customAgents.length} Customizados
            </span>
          </div>
          <p className="text-[13px] text-[var(--ds-muted)] mt-1 max-w-[850px] leading-relaxed">
            Agentes autônomos operando com inteligência generativa multimodelo (Claude 3.7, Gemini e pgvector) e orquestração n8n para vendas, cobrança, suporte e infraestrutura 24/7.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchAgents}
            className="h-[42px] px-3.5 rounded-full bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[12.5px] font-medium text-[var(--fg)] flex items-center gap-2 cursor-pointer transition-colors"
            title="Atualizar lista de agentes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#0066FF]' : ''}`} />
            <span>Atualizar</span>
          </button>

          {/* Botão Primário Oficial: Pílula Laranja com Seta ↗ */}
          <button
            type="button"
            onClick={openCreateModal}
            className="h-[42px] px-5 rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-[#141414] font-semibold text-[13px] flex items-center gap-2 cursor-pointer transition-all shadow-sm hover:shadow"
          >
            <span>Novo Agente com IA</span>
            <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. RESUMO DE INDICADORES RÁPIDOS                                      */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11.5px] text-[var(--ds-muted)] font-medium">
            <span>Total de Agentes</span>
            <Bot className="w-4 h-4 text-[#0066FF]" />
          </div>
          <div className="text-[26px] font-bold text-[var(--fg)] mt-1.5 tracking-tight">
            {totalAgentsCount} Agentes
          </div>
          <div className="text-[11px] text-[var(--ds-muted)] mt-1">
            5 do ecossistema + {customAgents.length} fluxos
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11.5px] text-[var(--ds-muted)] font-medium">
            <span>Status da Operação</span>
            <span className="w-2 h-2 rounded-full bg-[#2F9E5A] animate-pulse" />
          </div>
          <div className="text-[26px] font-bold text-[#2F9E5A] mt-1.5 tracking-tight">
            {totalActiveOnline} Ativos
          </div>
          <div className="text-[11px] text-[var(--ds-muted)] mt-1">
            {customAgents.length - activeCustomCount} agentes pausados
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11.5px] text-[var(--ds-muted)] font-medium">
            <span>Conexões n8n Webhook</span>
            <Zap className="w-4 h-4 text-[#0066FF]" />
          </div>
          <div className="text-[26px] font-bold text-[var(--fg)] mt-1.5 tracking-tight">
            {connectedWebhooks} Conectados
          </div>
          <div className="text-[11px] text-[var(--ds-muted)] mt-1">
            Webhooks de produção e teste
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11.5px] text-[var(--ds-muted)] font-medium">
            <span>Entregas Concluídas Hoje</span>
            <Activity className="w-4 h-4 text-[#2F9E5A]" />
          </div>
          <div className="text-[26px] font-bold text-[#0066FF] mt-1.5 tracking-tight">
            {totalDeliveriesToday} Entregas
          </div>
          <div className="text-[11px] text-[var(--ds-muted)] mt-1">
            Relatórios, triagens e rotinas
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. FILTROS POR TIPO DE AGENTE (TABS ROOMIE OFFICE AI)                 */}
      {/* ===================================================================== */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line2)] pb-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`h-[34px] px-3.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-[#0066FF] text-[#141414] font-semibold'
                : 'bg-[var(--surface)] text-[var(--ds-muted)] hover:text-[var(--fg)] border border-[var(--line2)]'
            }`}
          >
            Todos ({totalAgentsCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('NATIVE')}
            className={`h-[34px] px-3.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
              activeFilter === 'NATIVE'
                ? 'bg-[#0066FF] text-[#141414] font-semibold'
                : 'bg-[var(--surface)] text-[var(--ds-muted)] hover:text-[var(--fg)] border border-[var(--line2)]'
            }`}
          >
            Agentes Nativos Coytech (5)
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('CUSTOM')}
            className={`h-[34px] px-3.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
              activeFilter === 'CUSTOM'
                ? 'bg-[#0066FF] text-[#141414] font-semibold'
                : 'bg-[var(--surface)] text-[var(--ds-muted)] hover:text-[var(--fg)] border border-[var(--line2)]'
            }`}
          >
            Personalizados &amp; n8n ({customAgents.length})
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[11px] text-[var(--ds-muted)]">
          <span className="w-2 h-2 rounded-full bg-[#2F9E5A]" />
          <span>Design System Roomie Office AI · Banners 3D Integrados</span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. GRADE DOS CARDS COM IMAGEM 3D / SPOTLIGHT (3 COLUNAS)              */}
      {/* ===================================================================== */}
      {isLoading ? (
        <div className="p-16 text-center text-[13px] text-[var(--ds-muted)] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
          <span>Carregando agentes cognitivos da operação...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {/* A. AGENTES NATIVOS DO ECOSSISTEMA COYTECH (A1 A A5) */}
          {showNative &&
            nativeAgents.map((ag) => (
              <NativeAgentSpotlightCard
                key={ag.id}
                agent={ag}
                onOpenDrawer={(targetAgent) => setActiveAgentDrawer(targetAgent)}
              />
            ))}

          {/* B. AGENTES CUSTOMIZADOS DA OPERAÇÃO / N8N */}
          {showCustom &&
            customAgents.map((ag) => (
              <CustomAgentSpotlightCard
                key={ag.id}
                agent={ag}
                onEdit={openEditModal}
                onDelete={handleDeleteAgent}
                onToggleActive={handleToggleActive}
                onCopyWebhook={handleCopyWebhook}
                isCopied={copiedId === ag.id}
              />
            ))}

          {/* C. CARD SPOTLIGHT DE CRIAÇÃO RÁPIDA (CONVITE NA GRADE) */}
          {showCustom && (
            <div
              onClick={openCreateModal}
              className="group bg-[var(--surface)] border-2 border-dashed border-[var(--line2)] hover:border-[#0066FF]/70 rounded-[20px] p-6 flex flex-col items-center justify-center text-center gap-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 min-h-[380px]"
            >
              <div className="w-14 h-14 rounded-2xl bg-[var(--bg)] border border-[var(--line2)] group-hover:border-[#0066FF] group-hover:bg-[#0066FF]/10 grid place-items-center transition-colors">
                <Plus className="w-7 h-7 text-[var(--ds-muted)] group-hover:text-[#0066FF] transition-colors stroke-[2]" />
              </div>

              <div>
                <h3 className="text-[17px] font-bold text-[var(--fg)] group-hover:text-[#0066FF] transition-colors">
                  Conectar Novo Agente
                </h3>
                <p className="text-[12.5px] text-[var(--ds-muted)] max-w-[280px] mt-1.5 leading-relaxed">
                  Crie um agente personalizado e conecte ao fluxo do n8n para WhatsApp, CRM ou processos internos.
                </p>
              </div>

              <div className="h-[36px] px-4 rounded-full bg-[var(--bg)] border border-[var(--line2)] group-hover:border-[#0066FF]/40 text-[12px] font-semibold text-[var(--fg)] flex items-center gap-1.5 transition-colors">
                <span>Configurar Webhook</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#0066FF]" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. MODAL DE CRIAR / CONFIGURAR AGENTE COM DESIGN SYSTEM OFICIAL       */}
      {/* ===================================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#141414]/85 backdrop-blur-md grid place-items-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[22px] p-6 w-full max-w-[520px] shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line2)]">
              <div>
                <h2 className="text-[18px] font-bold text-[var(--fg)]">
                  {editingAgent ? 'Configurações do Agente' : 'Criar Novo Agente com IA'}
                </h2>
                <p className="text-[12px] text-[var(--ds-muted)] mt-0.5">
                  Configure o nome, descrição, destino e o webhook do fluxo no n8n
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-[var(--bg)] grid place-items-center text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAgent} className="flex flex-col gap-3.5">
              {/* Nome */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[var(--fg)]">
                  Nome do Agente
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Agente SDR Imobiliário"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-[40px] px-3 rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF] transition-colors"
                />
              </div>

              {/* Descrição */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[var(--fg)]">
                  Descrição do Agente &amp; Objetivo
                </label>
                <textarea
                  rows={3}
                  placeholder="Explique o que este agente faz (ex: atende novos contatos, qualifica orçamento e agenda reunião)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="p-3 rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[12.5px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF] resize-none transition-colors"
                />
              </div>

              {/* Conectar ao n8n (Webhook URL) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[var(--fg)] flex items-center justify-between">
                  <span>Conectar ao n8n (Webhook URL)</span>
                  <span className="text-[10.5px] text-[var(--ds-muted)]">Opcional</span>
                </label>
                <input
                  type="url"
                  placeholder="https://seu-n8n.cloud/webhook/meu-agente"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="h-[40px] px-3 rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[12px] font-mono text-[var(--fg)] focus:outline-none focus:border-[#0066FF] transition-colors"
                />
                <span className="text-[11px] text-[var(--ds-muted)]">
                  Cole a URL do nó Webhook criado no seu fluxo do n8n para sincronizar os eventos.
                </span>
              </div>

              {/* Canal / Destino */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[var(--fg)]">
                  Canal de Destino &amp; Estilo Visual
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="h-[40px] px-3 rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[12.5px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF] cursor-pointer transition-colors"
                >
                  <option value="WHATSAPP_COMMERCIAL">
                    WhatsApp Comercial (SDR &amp; Vendas — Banner Laranja)
                  </option>
                  <option value="WHATSAPP_CLIENTS">
                    Suporte a Clientes (RAG &amp; Suporte — Banner Cyan)
                  </option>
                  <option value="INTERNAL_AUTOMATION">
                    Automação &amp; Processos Internos (n8n — Banner Esmeralda)
                  </option>
                </select>
              </div>

              {/* Opção de Ativar */}
              <div className="flex items-center justify-between p-3.5 rounded-[12px] bg-[var(--bg)] border border-[var(--line2)]">
                <div>
                  <div className="text-[12.5px] font-semibold text-[var(--fg)]">Agente Ativo</div>
                  <div className="text-[11px] text-[var(--ds-muted)]">
                    Permite que o agente responda e execute tarefas imediatamente
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-[44px] h-[24px] rounded-full transition-colors relative cursor-pointer ${
                    isActive ? 'bg-[#2F9E5A]' : 'bg-[var(--line2)]'
                  }`}
                >
                  <span
                    className={`absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white transition-all ${
                      isActive ? 'left-[22px]' : 'left-[2px]'
                    }`}
                  />
                </button>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--line2)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-[38px] px-4 rounded-full border border-[var(--line2)] text-[12px] font-medium text-[var(--fg)] hover:bg-[var(--ds-hover)] cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !name.trim()}
                  className="h-[38px] px-5 rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-[#141414] font-bold text-[12.5px] cursor-pointer disabled:opacity-40 transition-colors shadow-sm"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Agente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
