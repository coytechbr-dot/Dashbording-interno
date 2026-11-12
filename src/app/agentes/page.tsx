'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Trash2,
  Copy,
  Check,
  Bot,
  Settings2,
  ExternalLink,
  Power,
  RefreshCw,
  X,
  MessageSquare,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'

interface CustomAgentItem {
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

const CHANNEL_LABELS: Record<string, { label: string; badge: string }> = {
  WHATSAPP_COMMERCIAL: {
    label: 'WhatsApp Comercial (SDR)',
    badge: 'bg-[#0066FF]/15 text-[#0066FF] border-[#0066FF]/30',
  },
  WHATSAPP_CLIENTS: {
    label: 'Suporte a Clientes',
    badge: 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/30',
  },
  INTERNAL_AUTOMATION: {
    label: 'Automação & Processos',
    badge: 'bg-[#8f7dff]/15 text-[#8f7dff] border-[#8f7dff]/30',
  },
}

export default function AgentesIaPage() {
  const { currentOrg } = useCoyDash()

  const [agents, setAgents] = useState<CustomAgentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

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
      setAgents(data.agents || [])
    } catch (err) {
      console.error('Erro ao buscar agentes:', err)
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
    setAgents((prev) =>
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
        // Atualizar
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
        // Criar
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
    setAgents((prev) => prev.filter((ag) => ag.id !== id))
    await fetch(`/api/agents?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  const activeCount = agents.filter((a) => a.is_active).length

  return (
    <div className="px-[26px] pt-[18px] pb-[40px] flex flex-col gap-[20px]">
      {/* CABEÇALHO */}
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.5px]">Agentes de IA</h1>
          <p className="text-[13px] text-[var(--ds-muted)]">
            Crie novos agentes, configure suas descrições e conecte aos fluxos de automação do n8n
          </p>
        </div>

        <div className="flex items-center gap-[10px]">
          <button
            type="button"
            onClick={fetchAgents}
            className="h-[38px] px-[14px] rounded-full bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[12px] font-medium flex items-center gap-[6px] cursor-pointer transition-colors"
            title="Atualizar lista de agentes"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="h-[38px] px-[18px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-[13px] flex items-center gap-[6px] cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2.4} />
            <span>Criar Novo Agente</span>
          </button>
        </div>
      </div>

      {/* RESUMO RÁPIDO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[12px]">
        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[14px] p-[16px]">
          <div className="text-[12px] text-[var(--ds-muted)]">Agentes Cadastrados</div>
          <div className="text-[24px] font-bold mt-[2px]">{agents.length} Agentes</div>
          <div className="text-[11px] text-[var(--ds-muted)] mt-[2px]">
            Personalizados para sua operação
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[14px] p-[16px]">
          <div className="text-[12px] text-[var(--ds-muted)]">Status dos Agentes</div>
          <div className="text-[24px] font-bold text-[#2f9e5a] mt-[2px]">
            {activeCount} Ativos
          </div>
          <div className="text-[11px] text-[var(--ds-muted)] mt-[2px]">
            {agents.length - activeCount} Pausados no momento
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[14px] p-[16px]">
          <div className="text-[12px] text-[var(--ds-muted)]">Conexão com n8n</div>
          <div className="text-[24px] font-bold text-[#0066FF] mt-[2px]">
            {agents.filter((a) => a.webhook_url).length} Conectados
          </div>
          <div className="text-[11px] text-[var(--ds-muted)] mt-[2px]">
            Via Webhooks de produção ou teste
          </div>
        </div>
      </div>

      {/* GRADE DE CARDS DE AGENTES */}
      {isLoading ? (
        <div className="p-[40px] text-center text-[13px] text-[var(--ds-muted)]">
          Carregando seus agentes...
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] p-[40px] flex flex-col items-center justify-center text-center gap-[12px]">
          <Bot className="w-12 h-12 text-[#0066FF] opacity-80" />
          <h2 className="text-[18px] font-bold">Nenhum agente cadastrado</h2>
          <p className="text-[13px] text-[var(--ds-muted)] max-w-[420px]">
            Crie seu primeiro agente e conecte o webhook do fluxo criado no n8n para começar a
            automatizar atendimentos e vendas.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="h-[38px] px-[20px] rounded-full bg-[#0066FF] text-white font-semibold text-[13px] cursor-pointer mt-[6px]"
          >
            Criar Primeiro Agente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          {agents.map((ag) => {
            const ch = CHANNEL_LABELS[ag.channel] || CHANNEL_LABELS.WHATSAPP_COMMERCIAL
            const isCopied = copiedId === ag.id

            return (
              <div
                key={ag.id}
                className={`bg-[var(--surface)] border rounded-[18px] p-[20px] flex flex-col justify-between gap-[16px] transition-all ${
                  ag.is_active
                    ? 'border-[var(--line2)] hover:border-[#0066FF]/50 shadow-sm'
                    : 'border-[var(--line2)] opacity-75'
                }`}
              >
                <div className="flex flex-col gap-[12px]">
                  {/* Topo do Card: Avatar, Nome e Botão de Ativar/Desativar */}
                  <div className="flex items-start justify-between gap-[10px]">
                    <div className="flex items-center gap-[10px] min-w-0">
                      <div
                        className={`w-[40px] h-[40px] rounded-[12px] grid place-items-center font-bold text-[15px] shrink-0 ${
                          ag.is_active
                            ? 'bg-[#0066FF] text-white'
                            : 'bg-[var(--bg)] border border-[var(--line2)] text-[var(--ds-muted)]'
                        }`}
                      >
                        {ag.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-[15px] leading-tight truncate">
                          {ag.name}
                        </h3>
                        <span
                          className={`inline-block px-[6px] py-[1px] rounded-[4px] border text-[9.5px] font-semibold mt-[3px] ${ch.badge}`}
                        >
                          {ch.label}
                        </span>
                      </div>
                    </div>

                    {/* Botão de Ativar / Desativar com 1 clique */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(ag)}
                      className={`h-[28px] px-[10px] rounded-full text-[11px] font-semibold flex items-center gap-[5px] cursor-pointer transition-colors shrink-0 ${
                        ag.is_active
                          ? 'bg-[#2f9e5a]/15 text-[#2f9e5a] border border-[#2f9e5a]/30 hover:bg-[#2f9e5a]/25'
                          : 'bg-[var(--bg)] text-[var(--ds-muted)] border border-[var(--line2)] hover:text-[var(--fg)]'
                      }`}
                      title={
                        ag.is_active
                          ? 'Clique para pausar este agente'
                          : 'Clique para ativar este agente'
                      }
                    >
                      <span
                        className={`w-[6px] h-[6px] rounded-full ${
                          ag.is_active ? 'bg-[#2f9e5a]' : 'bg-[var(--ds-muted)]'
                        }`}
                      />
                      <span>{ag.is_active ? 'Ativo' : 'Pausado'}</span>
                    </button>
                  </div>

                  {/* Descrição do Agente */}
                  <p className="text-[12.5px] text-[var(--fg)] leading-relaxed min-h-[40px]">
                    {ag.description || 'Sem descrição informada.'}
                  </p>

                  {/* Conexão com o n8n */}
                  <div className="p-[10px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] flex flex-col gap-[6px]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-[var(--ds-muted)] flex items-center gap-[4px]">
                        <LinkIcon className="w-3 h-3 text-[#0066FF]" />
                        <span>Webhook do n8n:</span>
                      </span>

                      {ag.webhook_url && (
                        <button
                          type="button"
                          onClick={() => handleCopyWebhook(ag.id, ag.webhook_url)}
                          className="text-[#0066FF] hover:underline flex items-center gap-[3px] cursor-pointer font-medium"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-[#2f9e5a]" />
                              <span className="text-[#2f9e5a]">Copiado</span>
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
                      {ag.webhook_url ? (
                        ag.webhook_url
                      ) : (
                        <span className="text-[var(--ds-muted)] italic">
                          Nenhum webhook conectado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card: Configurações e Exclusão */}
                <div className="flex items-center justify-between pt-[10px] border-t border-[var(--line)]">
                  <button
                    type="button"
                    onClick={() => openEditModal(ag)}
                    className="h-[32px] px-[12px] rounded-[8px] bg-[var(--bg)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[11.5px] font-semibold flex items-center gap-[5px] cursor-pointer transition-colors"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>Configurações</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteAgent(ag.id)}
                    className="w-[32px] h-[32px] rounded-[8px] hover:bg-[#ef4444]/15 border border-transparent hover:border-[#ef4444]/30 text-[var(--ds-muted)] hover:text-[#ef4444] grid place-items-center cursor-pointer transition-colors"
                    title="Excluir agente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL CRIAR / CONFIGURAR AGENTE */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#141414]/85 backdrop-blur-sm grid place-items-center p-[16px]">
          <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[20px] p-[24px] w-full max-w-[500px] shadow-2xl flex flex-col gap-[16px]">
            <div className="flex items-center justify-between pb-[10px] border-b border-[var(--line2)]">
              <div>
                <h2 className="text-[18px] font-bold">
                  {editingAgent ? 'Configurações do Agente' : 'Criar Novo Agente'}
                </h2>
                <p className="text-[12px] text-[var(--ds-muted)] mt-[2px]">
                  Configure o nome, descrição, destino e o webhook do fluxo no n8n
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-[32px] h-[32px] rounded-full hover:bg-[var(--bg)] grid place-items-center text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAgent} className="flex flex-col gap-[14px]">
              {/* Nome */}
              <div className="flex flex-col gap-[5px]">
                <label className="text-[12px] font-semibold">Nome do Agente</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Agente SDR Imobiliário"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-[38px] px-[12px] rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] focus:outline-none focus:border-[#0066FF]"
                />
              </div>

              {/* Descrição */}
              <div className="flex flex-col gap-[5px]">
                <label className="text-[12px] font-semibold">Descrição do Agente</label>
                <textarea
                  rows={3}
                  placeholder="Explique o que este agente faz (ex: atende novos contatos, qualifica orçamento e agenda reunião)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="p-[10px] rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[12.5px] focus:outline-none focus:border-[#0066FF] resize-none"
                />
              </div>

              {/* Conectar ao n8n (Webhook URL) */}
              <div className="flex flex-col gap-[5px]">
                <label className="text-[12px] font-semibold flex items-center justify-between">
                  <span>Conectar ao n8n (Webhook URL)</span>
                  <span className="text-[10.5px] text-[var(--ds-muted)]">Opcional</span>
                </label>
                <input
                  type="url"
                  placeholder="https://seu-n8n.cloud/webhook/meu-agente"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="h-[38px] px-[12px] rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[12.5px] font-mono focus:outline-none focus:border-[#0066FF]"
                />
                <span className="text-[11px] text-[var(--ds-muted)]">
                  Cole a URL do nó Webhook criado no seu fluxo do n8n para sincronizar os eventos.
                </span>
              </div>

              {/* Canal / Destino */}
              <div className="flex flex-col gap-[5px]">
                <label className="text-[12px] font-semibold">Canal de Destino</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="h-[38px] px-[10px] rounded-[8px] bg-[var(--bg)] border border-[var(--line2)] text-[12.5px] text-[var(--fg)] focus:outline-none focus:border-[#0066FF]"
                >
                  <option value="WHATSAPP_COMMERCIAL">WhatsApp Comercial (SDR & Vendas)</option>
                  <option value="WHATSAPP_CLIENTS">Suporte a Clientes da Carteira</option>
                  <option value="INTERNAL_AUTOMATION">Automação & Processos Internos</option>
                </select>
              </div>

              {/* Opção de Ativar */}
              <div className="flex items-center justify-between p-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)]">
                <div>
                  <div className="text-[12.5px] font-semibold">Agente Ativo</div>
                  <div className="text-[11px] text-[var(--ds-muted)]">
                    Permite que o agente responda e execute tarefas imediatamente
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-[44px] h-[24px] rounded-full transition-colors relative cursor-pointer ${
                    isActive ? 'bg-[#2f9e5a]' : 'bg-[var(--line2)]'
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
              <div className="flex items-center justify-end gap-[10px] pt-[10px] border-t border-[var(--line2)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-[36px] px-[16px] rounded-full border border-[var(--line2)] text-[12px] font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !name.trim()}
                  className="h-[36px] px-[20px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-[12.5px] cursor-pointer disabled:opacity-40 transition-colors"
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
