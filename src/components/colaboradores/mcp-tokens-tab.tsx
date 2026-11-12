'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Key,
  Shield,
  Plus,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Activity,
  Trash2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { McpApiToken, McpScope, McpRole } from '@/types/mcp'

const ALL_AVAILABLE_SCOPES: { scope: McpScope; label: string; module: string }[] = [
  { scope: 'atendimento:read', label: 'Ler Conversas & Leads WhatsApp', module: 'Atendimento' },
  { scope: 'atendimento:write', label: 'Alterar Estágio & Intervenção', module: 'Atendimento' },
  { scope: 'comercial:read', label: 'Consultar Pipeline & Negócios', module: 'Comercial' },
  { scope: 'comercial:write', label: 'Criar & Mover Oportunidades', module: 'Comercial' },
  { scope: 'tarefas:read', label: 'Visualizar Tarefas & Listas', module: 'Tarefas' },
  { scope: 'tarefas:write', label: 'Criar Tarefas & Comentários', module: 'Tarefas' },
  { scope: 'tarefas:delete', label: 'Remover Tarefas', module: 'Tarefas' },
  { scope: 'clientes:read', label: 'Acessar Ficha 360º de Clientes', module: 'Clientes' },
  { scope: 'clientes:write', label: 'Criar Contatos & Decisores', module: 'Clientes' },
  { scope: 'agentes:read', label: 'Ver Status dos Agentes de IA', module: 'Agentes' },
  { scope: 'agentes:write', label: 'Disparar Execuções de IA', module: 'Agentes' },
  { scope: '*', label: 'Acesso Irrestrito (Super Admin)', module: 'Administração' },
]

export function McpTokensTab({ organizationId }: { organizationId: string }) {
  const [tokens, setTokens] = useState<McpApiToken[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [hasCopiedKey, setHasCopiedKey] = useState(false)

  // Formulário de Criação
  const [tokenName, setTokenName] = useState('')
  const [tokenRole, setTokenRole] = useState<McpRole>('OPERATOR')
  const [selectedScopes, setSelectedScopes] = useState<McpScope[]>([
    'comercial:read',
    'tarefas:read',
    'clientes:read',
    'atendimento:read',
  ])
  const [expiresInDays, setExpiresInDays] = useState('90')

  // Carregar Tokens
  const fetchTokens = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/mcp/tokens?organization_id=${organizationId}`)
      const data = await res.json()
      if (data.tokens) {
        setTokens(data.tokens)
      }
    } catch (err) {
      console.error('Erro ao carregar tokens MCP:', err)
    } finally {
      setIsLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  // Toggle de Escopo no Modal
  const toggleScope = (scope: McpScope) => {
    if (scope === '*') {
      setSelectedScopes(['*'])
      return
    }

    let updated = selectedScopes.filter((s) => s !== '*')
    if (updated.includes(scope)) {
      updated = updated.filter((s) => s !== scope)
    } else {
      updated.push(scope)
    }
    setSelectedScopes(updated)
  }

  // Criar Token
  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tokenName.trim()) return

    try {
      setIsCreating(true)
      const res = await fetch('/api/mcp/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tokenName.trim(),
          role: tokenRole,
          allowed_scopes: selectedScopes,
          expires_in_days: expiresInDays === 'never' ? null : Number(expiresInDays),
          organization_id: organizationId,
        }),
      })

      const data = await res.json()
      if (data.success && data.rawToken) {
        setGeneratedKey(data.rawToken)
        fetchTokens()
      } else {
        alert(`Erro ao gerar chave: ${data.error || 'Falha desconhecida'}`)
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  // Revogar Token
  const handleRevokeToken = async (tokenId: string, currentRevoked: boolean) => {
    const confirmMessage = currentRevoked
      ? 'Deseja reativar este token de IA?'
      : 'Tem certeza que deseja revogar este token de IA? Qualquer agente conectado a ele perderá o acesso imediatamente.'

    if (!confirm(confirmMessage)) return

    try {
      const res = await fetch('/api/mcp/tokens', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tokenId, is_revoked: !currentRevoked }),
      })
      const data = await res.json()
      if (data.success) {
        setTokens((prev) =>
          prev.map((t) => (t.id === tokenId ? { ...t, is_revoked: !currentRevoked } : t))
        )
      }
    } catch (err) {
      console.error('Erro ao alterar status do token:', err)
    }
  }

  // Copiar Chave
  const handleCopyKey = () => {
    if (!generatedKey) return
    navigator.clipboard.writeText(generatedKey)
    setHasCopiedKey(true)
    setTimeout(() => setHasCopiedKey(false), 3000)
  }

  // Fechar Modal e Resetar
  const handleCloseModal = () => {
    setShowCreateModal(false)
    setGeneratedKey(null)
    setTokenName('')
    setTokenRole('OPERATOR')
    setSelectedScopes(['comercial:read', 'tarefas:read', 'clientes:read', 'atendimento:read'])
    setExpiresInDays('90')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER DA ABA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-[16px] bg-[var(--surface)] border border-[var(--line2)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F0521F]" />
            <span className="text-[11.5px] font-semibold tracking-wider uppercase text-[var(--ds-muted)]">
              Model Context Protocol (MCP) & Governança de IA
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--fg)]">
            Tokens de Conexão para Agentes de IA
          </h2>
          <p className="text-[13px] text-[var(--ds-muted)] mt-1 max-w-3xl">
            Gere chaves de API com hash SHA-256 e escopos granulares (RBAC) para conectar Claude Desktop,
            Cursor IDE, automações n8n e agentes autônomos ao ecossistema CoyDash com proteção anti-destruição.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-[#F0521F] text-white font-semibold text-[13px] hover:opacity-90 transition-opacity shadow-lg shadow-[#F0521F]/20 cursor-pointer self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Token de IA</span>
        </button>
      </div>

      {/* CARDS DE DESTAQUE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-[14px] bg-[var(--surface)] border border-[var(--line2)] flex flex-col gap-1">
          <div className="flex items-center justify-between text-[var(--ds-muted)] text-[12px]">
            <span>Endpoint MCP Oficial</span>
            <Terminal className="w-4 h-4 text-[#F0521F]" />
          </div>
          <div className="text-[13px] font-mono font-semibold text-[var(--fg)] truncate mt-1">
            POST /api/mcp
          </div>
          <div className="text-[11px] text-[var(--ds-muted)]">Suporte a JSON-RPC 2.0 e HTTP Bearer</div>
        </div>

        <div className="p-4 rounded-[14px] bg-[var(--surface)] border border-[var(--line2)] flex flex-col gap-1">
          <div className="flex items-center justify-between text-[var(--ds-muted)] text-[12px]">
            <span>Tokens Ativos</span>
            <Key className="w-4 h-4 text-[#5cd3a8]" />
          </div>
          <div className="text-2xl font-bold text-[var(--fg)]">
            {tokens.filter((t) => !t.is_revoked).length}
          </div>
          <div className="text-[11px] text-[var(--ds-muted)]">Chaves com acesso operacional</div>
        </div>

        <div className="p-4 rounded-[14px] bg-[var(--surface)] border border-[var(--line2)] flex flex-col gap-1">
          <div className="flex items-center justify-between text-[var(--ds-muted)] text-[12px]">
            <span>Trava Anti-Alucinação</span>
            <Shield className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div className="text-[13px] font-semibold text-[#5cd3a8] mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Ativa (RBAC Estrito)</span>
          </div>
          <div className="text-[11px] text-[var(--ds-muted)]">Deletes e Drops críticos bloqueados</div>
        </div>
      </div>

      {/* TABELA DE TOKENS */}
      <div className="rounded-[16px] bg-[var(--surface)] border border-[var(--line2)] overflow-hidden">
        <div className="p-4 border-b border-[var(--line2)] flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-[var(--fg)] flex items-center gap-2">
            <Key className="w-4 h-4 text-[#F0521F]" />
            <span>Chaves de Acesso Cadastradas</span>
          </h3>
          <button
            onClick={fetchTokens}
            className="p-1.5 rounded-[8px] hover:bg-[var(--surface-hover)] text-[var(--ds-muted)] transition-colors cursor-pointer"
            title="Atualizar lista"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-[var(--ds-muted)] text-[13px]">
            Carregando tokens e credenciais...
          </div>
        ) : tokens.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--line2)] flex items-center justify-center text-[var(--ds-muted)]">
              <Key className="w-6 h-6" />
            </div>
            <div className="text-[14px] font-semibold text-[var(--fg)]">Nenhum token gerado ainda</div>
            <p className="text-[12.5px] text-[var(--ds-muted)] max-w-md">
              Crie seu primeiro token de IA para conectar o Claude Desktop ou seus agentes locais às ferramentas do CoyDash.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-2 inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] bg-[#F0521F] text-white font-semibold text-[12.5px] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Primeiro Token</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[var(--line2)] bg-[var(--surface-subtle)] text-[var(--ds-muted)] font-semibold text-[11.5px] uppercase tracking-wider">
                  <th className="py-3 px-4">Nome do Token</th>
                  <th className="py-3 px-4">Prefixo da Chave</th>
                  <th className="py-3 px-4">Perfil</th>
                  <th className="py-3 px-4">Escopos Permitidos</th>
                  <th className="py-3 px-4">Último Uso</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line2)]">
                {tokens.map((tok) => {
                  const isRevoked = tok.is_revoked
                  const scopes = tok.allowed_scopes || []

                  return (
                    <tr
                      key={tok.id}
                      className={`hover:bg-[var(--surface-hover)] transition-colors ${
                        isRevoked ? 'opacity-50 bg-[var(--surface-subtle)]' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-semibold text-[var(--fg)]">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#F0521F]" />
                          <span>{tok.name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[12px] text-[var(--ds-muted)]">
                        {tok.token_prefix}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-semibold bg-[var(--line2)] text-[var(--fg)]">
                          {tok.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {scopes.includes('*') ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10.5px] font-medium bg-[#F0521F]/10 text-[#F0521F]">
                              Acesso Total (*)
                            </span>
                          ) : (
                            scopes.slice(0, 3).map((sc) => (
                              <span
                                key={sc}
                                className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10.5px] font-medium bg-[var(--line2)] text-[var(--fg)]"
                              >
                                {sc}
                              </span>
                            ))
                          )}
                          {scopes.length > 3 && !scopes.includes('*') && (
                            <span className="text-[10.5px] text-[var(--ds-muted)] font-medium self-center">
                              +{scopes.length - 3} mais
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[12px] text-[var(--ds-muted)]">
                        {tok.last_used_at ? (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
                            <span>{new Date(tok.last_used_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        ) : (
                          <span className="text-[var(--ds-muted)] italic">Nunca</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isRevoked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/10 text-red-500">
                            <XCircle className="w-3 h-3" />
                            Revogado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#5cd3a8]/10 text-[#5cd3a8]">
                            <CheckCircle2 className="w-3 h-3" />
                            Ativo
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleRevokeToken(tok.id, isRevoked)}
                          className={`text-[12px] font-medium px-2.5 py-1 rounded-[8px] transition-colors cursor-pointer ${
                            isRevoked
                              ? 'text-[var(--fg)] hover:bg-[var(--line2)]'
                              : 'text-red-500 hover:bg-red-500/10'
                          }`}
                        >
                          {isRevoked ? 'Reativar' : 'Revogar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* GUIA DE CONEXÃO RÁPIDA (CLAUDE DESKTOP & CURSOR) */}
      <div className="p-5 rounded-[16px] bg-[var(--surface)] border border-[var(--line2)] flex flex-col gap-3">
        <h3 className="text-[14px] font-bold text-[var(--fg)] flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#F0521F]" />
          <span>Como Conectar no Claude Desktop ou Cursor</span>
        </h3>
        <p className="text-[12.5px] text-[var(--ds-muted)] leading-relaxed">
          Copie a configuração abaixo no arquivo de configuração do Claude Desktop (
          <code className="text-[#F0521F] bg-[var(--line2)] px-1 py-0.5 rounded">claude_desktop_config.json</code>
          ) substituindo a variável de ambiente pelo seu token de IA:
        </p>

        <div className="bg-[var(--line)]/50 p-4 rounded-[12px] font-mono text-[12px] text-[var(--fg)] overflow-x-auto relative">
          <pre>{`{
  "mcpServers": {
    "coydash": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "http://localhost:3005/api/mcp"],
      "env": {
        "COYDASH_MCP_TOKEN": "SEU_TOKEN_COYDASH_AQUI"
      }
    }
  }
}`}</pre>
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO / EXIBIÇÃO DE TOKEN */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[20px] max-w-xl w-full p-6 shadow-2xl flex flex-col gap-5">
            {generatedKey ? (
              // TELA DE CHAVE GERADA
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#5cd3a8]/20 flex items-center justify-center text-[#5cd3a8]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--fg)]">Token Gerado com Sucesso!</h3>
                    <p className="text-[12.5px] text-[var(--ds-muted)]">
                      Copie sua chave de acesso agora. Por motivos de segurança, ela nunca mais será exibida.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-[12px] bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-start gap-2.5 text-[12px]">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Armazene esta chave em um gerenciador de segredos seguro. Se você perder este token, precisará gerar um novo.
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11.5px] font-semibold text-[var(--ds-muted)] uppercase tracking-wider">
                    Chave de API do Servidor MCP
                  </label>
                  <div className="flex items-center gap-2 p-2.5 rounded-[12px] bg-[var(--line2)] border border-[var(--line)]">
                    <input
                      type="text"
                      readOnly
                      value={generatedKey}
                      className="bg-transparent font-mono text-[12.5px] text-[var(--fg)] flex-1 outline-none select-all"
                    />
                    <button
                      onClick={handleCopyKey}
                      className="px-3 py-1.5 rounded-[8px] bg-[#F0521F] text-white font-semibold text-[12px] flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer shrink-0"
                    >
                      {hasCopiedKey ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[var(--line2)]">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 rounded-[10px] bg-[var(--line2)] hover:bg-[var(--line)] text-[var(--fg)] font-semibold text-[13px] transition-colors cursor-pointer"
                  >
                    Concluir e Fechar
                  </button>
                </div>
              </div>
            ) : (
              // FORMULÁRIO DE CRIAÇÃO
              <form onSubmit={handleCreateToken} className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--line2)]">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-[#F0521F]" />
                    <h3 className="text-lg font-bold text-[var(--fg)]">Gerar Token de IA (MCP)</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="text-[var(--ds-muted)] hover:text-[var(--fg)] transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Nome do Token */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-[var(--fg)]">
                    Nome da Aplicação ou Agente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Claude Desktop Local, Agente Comercial N8N..."
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    className="px-3 py-2 rounded-[10px] bg-[var(--surface-subtle)] border border-[var(--line2)] text-[13px] text-[var(--fg)] outline-none focus:border-[#F0521F]"
                  />
                </div>

                {/* Perfil & Expiração */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-[var(--fg)]">Nível de Acesso (Papel)</label>
                    <select
                      value={tokenRole}
                      onChange={(e) => setTokenRole(e.target.value as McpRole)}
                      className="px-3 py-2 rounded-[10px] bg-[var(--surface-subtle)] border border-[var(--line2)] text-[13px] text-[var(--fg)] outline-none focus:border-[#F0521F]"
                    >
                      <option value="OPERATOR">Operador (Padrão)</option>
                      <option value="READ_ONLY">Somente Leitura</option>
                      <option value="MANAGER">Gerente</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-[var(--fg)]">Validade da Chave</label>
                    <select
                      value={expiresInDays}
                      onChange={(e) => setExpiresInDays(e.target.value)}
                      className="px-3 py-2 rounded-[10px] bg-[var(--surface-subtle)] border border-[var(--line2)] text-[13px] text-[var(--fg)] outline-none focus:border-[#F0521F]"
                    >
                      <option value="30">30 Dias</option>
                      <option value="90">90 Dias (Recomendado)</option>
                      <option value="365">1 Ano</option>
                      <option value="never">Sem Expiração</option>
                    </select>
                  </div>
                </div>

                {/* Seleção de Escopos RBAC */}
                <div className="flex flex-col gap-2 mt-1">
                  <label className="text-[12px] font-semibold text-[var(--fg)]">
                    Escopos Permitidos (Trava Anti-Alucinação)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 border border-[var(--line2)] rounded-[12px]">
                    {ALL_AVAILABLE_SCOPES.map(({ scope, label, module }) => {
                      const isSelected = selectedScopes.includes(scope) || selectedScopes.includes('*')

                      return (
                        <button
                          type="button"
                          key={scope}
                          onClick={() => toggleScope(scope)}
                          className={`flex items-start gap-2 p-2.5 rounded-[10px] text-left transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-[#F0521F]/10 border-[#F0521F]/40 text-[var(--fg)]'
                              : 'bg-[var(--surface)] border-[var(--line2)] text-[var(--ds-muted)] hover:border-[var(--line)]'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-[4px] mt-0.5 flex items-center justify-center border shrink-0 ${
                              isSelected
                                ? 'bg-[#F0521F] border-[#F0521F] text-white'
                                : 'border-[var(--line2)]'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[12px] font-semibold leading-tight">{label}</span>
                            <span className="text-[10px] text-[var(--ds-muted)] mt-0.5">
                              {module} • <code className="text-[#F0521F]">{scope}</code>
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--line2)] mt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 rounded-[10px] text-[13px] font-semibold text-[var(--ds-muted)] hover:bg-[var(--line2)] transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-4 py-2 rounded-[10px] bg-[#F0521F] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-lg shadow-[#F0521F]/20"
                  >
                    {isCreating ? 'Gerando Hash...' : 'Criar Token com Hash SHA-256'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

