'use client'

import React, { useState } from 'react'
import { ArrowUpRight, Trash2 } from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'
import { IconRobot16 } from '@/components/layout/roomie-illustrations'
import type { AgentClass } from '@/types/coydash'

export default function FlowPage() {
  const {
    authenticatedUser,
    searchQuery,
    currentOrg,
    updateOrganizationMetrics,
    agents,
    setActiveAgentDrawer,
    flowRuns,
    createFlowRun,
    knowledgeChunks,
    addKnowledgeDoc,
    deleteKnowledgeDoc,
    weeklyReports,
    generateMonday8amReportNow,
  } = useCoyDash()

  const [activeTab, setActiveTab] = useState<
    'AGENTES' | 'AUTOMACOES' | 'MEMORIA_LITELLM' | 'RELATORIO_8H'
  >('AGENTES')

  // Formulário de Nova Execução n8n
  const [wfName, setWfName] = useState('')
  const [wfAgent, setWfAgent] = useState<AgentClass>('AGENT_1_SALES_QUALIFIER')
  const [wfStatus, setWfStatus] = useState<
    'SUCCESS' | 'RETRIED_SUCCESS' | 'CONTINGENCY_QUEUED'
  >('SUCCESS')
  const [wfMinutes, setWfMinutes] = useState('25')
  const [wfValue, setWfValue] = useState('0')
  const [wfSummary, setWfSummary] = useState('')

  // Formulário de Novo Documento RAG (pgvector)
  const [docCategory, setDocCategory] = useState<
    'COMPANY_SOP' | 'COMMERCIAL_POLICY' | 'SRE_RUNBOOK' | 'ERP_API_DOC'
  >('COMPANY_SOP')
  const [docTitle, setDocTitle] = useState('')
  const [docContent, setDocContent] = useState('')

  // Orçamento LiteLLM
  const [budgetInput, setBudgetInput] = useState('')

  const q = searchQuery.trim().toLowerCase()
  const filteredRuns = flowRuns.filter((r) =>
    !q
      ? true
      : r.workflow_name.toLowerCase().includes(q) ||
        r.summary_result.toLowerCase().includes(q)
  )
  const filteredDocs = knowledgeChunks.filter((k) =>
    !q
      ? true
      : k.title.toLowerCase().includes(q) ||
        k.content_chunk.toLowerCase().includes(q)
  )

  const latestReport = weeklyReports[0]

  const handleAddFlowRun = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wfName.trim()) return
    await createFlowRun({
      workflow_name: wfName.trim(),
      agent_used: wfAgent,
      status: wfStatus,
      manual_minutes_saved: Number(wfMinutes) || 15,
      financial_value_processed: Number(wfValue) || 0,
      summary_result:
        wfSummary.trim() || 'Workflow executado e sincronizado com o banco PostgreSQL.',
    })
    setWfName('')
    setWfSummary('')
  }

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docTitle.trim() || !docContent.trim()) return
    await addKnowledgeDoc({
      doc_category: docCategory,
      title: docTitle.trim(),
      content_chunk: docContent.trim(),
    })
    setDocTitle('')
    setDocContent('')
  }

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    const val = Number(budgetInput)
    if (!val || val <= 0) return
    await updateOrganizationMetrics({ litellm_monthly_budget: val })
    setBudgetInput('')
  }

  return (
    <div className="px-[26px] pb-[40px] flex flex-col gap-[24px]">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-[16px] pt-[6px]">
        <div>
          <div className="text-[12px] text-[#0066FF] font-semibold">
            Pilar 02 · Implementação, automação n8n & IA governada
          </div>
          <h1 className="text-[28px] font-semibold tracking-[-0.8px] mt-[2px]">
            Coytech Flow · Orquestração & 5 agentes de IA
          </h1>
          <p className="text-[13px] text-[var(--ds-muted)] mt-[4px]">
            Workflows n8n em Queue Mode, memória corporativa em 4 camadas (pgvector), gateway LiteLLM e prova de valor toda segunda às 08h.
          </p>
        </div>

        <div className="flex flex-wrap gap-[8px]">
          {(
            [
              { id: 'AGENTES', label: '5 Agentes de IA' },
              { id: 'AUTOMACOES', label: `Backoffice n8n (${flowRuns.length})` },
              {
                id: 'MEMORIA_LITELLM',
                label: `Memória RAG (${knowledgeChunks.length}) & LiteLLM`,
              },
              { id: 'RELATORIO_8H', label: `Relatório segunda 08h (${weeklyReports.length})` },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`h-[36px] px-[14px] rounded-full text-[13px] font-medium transition-colors cursor-pointer border-[1.5px] ${
                  active
                    ? 'bg-[#0066FF] text-white border-[#0066FF]'
                    : 'bg-[var(--surface)] text-[var(--fg)] border-[var(--line2)] hover:bg-[var(--ds-hover)]'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ABA 1: AS 5 CLASSES DE AGENTES DE IA */}
      {activeTab === 'AGENTES' && (
        <div className="border-t border-[var(--line)] pt-[22px] flex flex-col gap-[16px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[14px]">
            {agents.map((ag) => {
              const dotColor =
                ag.status === 'Entregue'
                  ? '#0066FF'
                  : ag.status === 'Em andamento'
                    ? '#e8c14a'
                    : '#8f7dff'

              return (
                <div
                  key={ag.id}
                  className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[18px] flex flex-col gap-[12px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-[10px]">
                      <span className="w-[32px] h-[32px] rounded-full bg-[#0066FF] text-white grid place-items-center font-bold text-[12px]">
                        {ag.code}
                      </span>
                      <div>
                        <div className="text-[15px] font-semibold">{ag.name}</div>
                        <div className="text-[11px] text-[var(--ds-muted)]">{ag.roleLabel}</div>
                      </div>
                    </div>

                    <span className="flex items-center gap-[5px] bg-[var(--bg)] border border-[var(--line2)] rounded-[6px] px-[8px] py-[4px] text-[10.5px]">
                      <span
                        className="w-[5px] h-[5px] rounded-full"
                        style={{ backgroundColor: dotColor }}
                      ></span>
                      {ag.status}
                    </span>
                  </div>

                  <div className="text-[12.5px] text-[var(--fg2)] leading-[1.45]">
                    {ag.lastDeliverySummary}
                  </div>

                  <div className="flex flex-col gap-[6px] pt-[8px] border-t border-[var(--line)]">
                    <div className="text-[11px] text-[var(--ds-muted)]">
                      Tools conectadas (Function Calling):
                    </div>
                    {ag.tools.map((t) => (
                      <div
                        key={t.name}
                        className="bg-[var(--bg)] border border-[var(--line2)] rounded-[8px] px-[10px] py-[6px] text-[11px] flex items-center justify-between"
                      >
                        <span className="font-medium text-[var(--fg)] truncate">{t.name}</span>
                        <span className="text-[10.5px] text-[var(--ds-muted)] ml-2 shrink-0">
                          {ag.deliveriesToday} exec.
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-[10px] flex items-center justify-between">
                    <span className="text-[11px] text-[var(--ds-muted)]">
                      Modelo: {ag.modelRouted}
                    </span>
                    <button
                      onClick={() => setActiveAgentDrawer(ag)}
                      className="h-[36px] px-[14px] rounded-full bg-[var(--bg)] hover:bg-[#0066FF] hover:text-white border border-[var(--line2)] hover:border-[#0066FF] text-[12px] font-medium flex items-center gap-[8px] transition-colors cursor-pointer"
                    >
                      <span>Abrir e comandar</span>
                      <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ABA 2: ROTINAS CRÍTICAS DE BACKOFFICE */}
      {activeTab === 'AUTOMACOES' && (
        <div className="border-t border-[var(--line)] pt-[22px] grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-[24px]">
          <div className="flex flex-col gap-[12px]">
            <div className="text-[18px]">
              Execuções gravadas no banco (flow_automation_runs)
            </div>

            {filteredRuns.length === 0 ? (
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[24px] text-[13px] text-[var(--ds-muted)]">
                Nenhuma automação registrada ainda. Execute uma tarefa com um Agente de IA ou registre um workflow ao lado (ex: Conciliação Pix ou Emissão NFe em Lote).
              </div>
            ) : (
              filteredRuns.map((run) => {
                const dotColor =
                  run.status === 'SUCCESS'
                    ? '#2f9e5a'
                    : run.status === 'CONTINGENCY_QUEUED'
                      ? '#e8c14a'
                      : '#0066FF'

                return (
                  <div
                    key={run.id}
                    className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] p-[16px] flex flex-col gap-[8px]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-[8px]">
                      <span className="text-[12px] text-[#0066FF] font-semibold">
                        {run.agent_display_name} · ID {run.n8n_execution_id}
                      </span>
                      <span className="flex items-center gap-[5px] bg-[var(--bg)] border border-[var(--line2)] rounded-[6px] px-[8px] py-[4px] text-[10.5px]">
                        <span
                          className="w-[5px] h-[5px] rounded-full"
                          style={{ backgroundColor: dotColor }}
                        ></span>
                        {run.status === 'SUCCESS'
                          ? 'Concluído'
                          : run.status === 'CONTINGENCY_QUEUED'
                            ? 'Fila de contingência SEFAZ ativa'
                            : 'Retentativa'}
                      </span>
                    </div>

                    <div className="text-[15px] font-medium">{run.workflow_name}</div>
                    <div className="text-[12.5px] text-[var(--ds-muted)]">{run.summary_result}</div>

                    <div className="flex flex-wrap items-center justify-between gap-[12px] pt-[8px] border-t border-[var(--line)] text-[11.5px] text-[var(--ds-muted)]">
                      <span>Tempo manual poupado: {run.manual_minutes_saved} min</span>
                      <span>
                        Valor processado: R${' '}
                        {run.financial_value_processed.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      <span>{run.executed_at}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Formulário: Registrar / Disparar Execução n8n */}
          <aside className="flex flex-col gap-[14px]">
            <div className="text-[18px]">Disparar / registrar fluxo n8n</div>
            <form
              onSubmit={handleAddFlowRun}
              className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[18px] flex flex-col gap-[12px]"
            >
              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Nome do workflow
                <input
                  value={wfName}
                  onChange={(e) => setWfName(e.target.value)}
                  placeholder="Ex: Conciliação Financeira Diária ERP x Pix"
                  required
                  className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                />
              </label>

              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Agente vinculado
                <select
                  value={wfAgent}
                  onChange={(e) => setWfAgent(e.target.value as AgentClass)}
                  className="h-[46px] px-[12px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                >
                  <option value="AGENT_1_SALES_QUALIFIER">Agente 01 · Qualificador</option>
                  <option value="AGENT_2_RECOVERY_BILLING">Agente 02 · Recuperador</option>
                  <option value="AGENT_3_SUPPORT_TIER1">Agente 03 · Suporte N1</option>
                  <option value="AGENT_4_CUSTOMER_SUCCESS_LTV">Agente 04 · Sucesso LTV</option>
                  <option value="AGENT_5_SRE_INVESTIGATOR">Agente 05 · SRE Copilot</option>
                </select>
              </label>

              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Status operacional
                <select
                  value={wfStatus}
                  onChange={(e) =>
                    setWfStatus(
                      e.target.value as 'SUCCESS' | 'RETRIED_SUCCESS' | 'CONTINGENCY_QUEUED'
                    )
                  }
                  className="h-[46px] px-[12px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                >
                  <option value="SUCCESS">Sucesso imediato</option>
                  <option value="CONTINGENCY_QUEUED">Contingência SEFAZ (SVC-AN)</option>
                  <option value="RETRIED_SUCCESS">Sucesso após retentativa</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-[10px]">
                <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                  Minutos poupados
                  <input
                    type="number"
                    min="1"
                    value={wfMinutes}
                    onChange={(e) => setWfMinutes(e.target.value)}
                    required
                    className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                  />
                </label>

                <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                  Valor processado (R$)
                  <input
                    type="number"
                    min="0"
                    value={wfValue}
                    onChange={(e) => setWfValue(e.target.value)}
                    required
                    className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Resumo da entrega
                <input
                  value={wfSummary}
                  onChange={(e) => setWfSummary(e.target.value)}
                  placeholder="Ex: 140 notas fiscais processadas sem erro"
                  className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                />
              </label>

              <button
                type="submit"
                className="h-[46px] bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-full px-[18px] text-[13px] font-semibold flex items-center justify-between cursor-pointer transition-colors mt-[4px]"
              >
                <span>Registrar execução</span>
                <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </form>
          </aside>
        </div>
      )}

      {/* ABA 3: ARQUITETURA DE MEMÓRIA EM 4 CAMADAS & GOVERNANÇA LITELLM */}
      {activeTab === 'MEMORIA_LITELLM' && (
        <div className="border-t border-[var(--line)] pt-[22px] grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-[24px]">
          <div className="flex flex-col gap-[16px]">
            <div className="text-[18px]">
              Memória corporativa em 4 camadas isolada por cliente (Supabase + pgvector)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
              {[
                {
                  layer: '01 · Memória operacional (Working)',
                  tech: 'agent_sessions (JSONB) + Redis',
                  desc: 'Estado ativo da conversa no WhatsApp/Direct e checklist do incidente P1.',
                },
                {
                  layer: '02 · Memória episódica (Audit)',
                  tech: 'flow_automation_runs + LiteLLM Logs',
                  desc: 'Histórico cronológico imutável de decisões e causas raiz passadas.',
                },
                {
                  layer: '03 · Memória semântica (Vector RAG)',
                  tech: 'pgvector vector(1536) · knowledge_and_runbooks',
                  desc: 'Manuais operacionais, políticas comerciais, documentação de ERP e Runbooks SRE.',
                },
                {
                  layer: '04 · Memória procedural (Regras & BIA)',
                  tech: 'approval_policies + bia_critical_processes',
                  desc: 'Travas determinísticas Human-in-the-Loop e custo por minuto parado.',
                },
              ].map((m) => (
                <div
                  key={m.layer}
                  className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] p-[14px] flex flex-col gap-[6px]"
                >
                  <div className="text-[13.5px] font-semibold text-[#0066FF]">{m.layer}</div>
                  <div className="text-[11px] text-[var(--ds-muted)]">{m.tech}</div>
                  <div className="text-[12px] text-[var(--fg2)] mt-[4px]">{m.desc}</div>
                </div>
              ))}
            </div>

            <div className="text-[16px] font-medium mt-[6px]">
              Base vetorial ativa (knowledge_and_runbooks · {filteredDocs.length} documentos)
            </div>

            {filteredDocs.length === 0 ? (
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] p-[20px] text-[13px] text-[var(--ds-muted)]">
                Sua base de conhecimento vetorial está limpa. Adicione manuais (SOPs), políticas comerciais ou Runbooks SRE usando o formulário ao lado.
              </div>
            ) : (
              <div className="flex flex-col gap-[10px]">
                {filteredDocs.map((kb) => (
                  <div
                    key={kb.id}
                    className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] p-[14px] flex flex-col gap-[6px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#0066FF] font-semibold">
                        {kb.doc_category}
                      </span>
                      <div className="flex items-center gap-[10px]">
                        <span className="text-[11px] text-[var(--ds-muted)]">{kb.created_at}</span>
                        <button
                          onClick={() => deleteKnowledgeDoc(kb.id)}
                          title="Excluir documento"
                          className="text-[var(--ds-muted)] hover:text-[#0066FF] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-[14px] font-medium">{kb.title}</div>
                    <div className="text-[12px] text-[var(--ds-muted)]">{kb.content_chunk}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Coluna Direita: Indexar Documento RAG + Gateway LiteLLM */}
          <aside className="flex flex-col gap-[16px]">
            <div className="text-[18px]">Indexar documento no RAG</div>
            <form
              onSubmit={handleAddDoc}
              className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[18px] flex flex-col gap-[12px]"
            >
              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Categoria do documento
                <select
                  value={docCategory}
                  onChange={(e) =>
                    setDocCategory(
                      e.target.value as
                        | 'COMPANY_SOP'
                        | 'COMMERCIAL_POLICY'
                        | 'SRE_RUNBOOK'
                        | 'ERP_API_DOC'
                    )
                  }
                  className="h-[46px] px-[12px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                >
                  <option value="COMPANY_SOP">Manual Operacional (SOP)</option>
                  <option value="COMMERCIAL_POLICY">Política Comercial & Alçada</option>
                  <option value="SRE_RUNBOOK">Runbook SRE (Mitigação)</option>
                  <option value="ERP_API_DOC">Documentação de API / ERP</option>
                </select>
              </label>

              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Título
                <input
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Ex: Política de Desconto B2B Atacado"
                  required
                  className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                />
              </label>

              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Conteúdo / regra para os Agentes
                <textarea
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  placeholder="Descreva a regra de negócio ou procedimento de contingência..."
                  rows={3}
                  required
                  className="p-[12px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none resize-none"
                />
              </label>

              <button
                type="submit"
                className="h-[44px] bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-full px-[18px] text-[13px] font-semibold flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>Salvar no pgvector</span>
                <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </form>

            {/* Painel LiteLLM Proxy Gateway */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[18px] flex flex-col gap-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium">Gateway LiteLLM & LGPD</span>
                <span className="flex items-center gap-[5px] bg-[var(--bg)] border border-[var(--line2)] rounded-[6px] px-[8px] py-[3px] text-[10.5px]">
                  <span className="w-[5px] h-[5px] rounded-full bg-[#2f9e5a]"></span>
                  Ativo
                </span>
              </div>
              <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[8px] px-[10px] py-[8px] text-[11.5px] font-mono truncate">
                {currentOrg.litellm_virtual_key_id}
              </div>

              <div className="flex flex-col gap-[6px]">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--ds-muted)]">Consumo mensal de IA</span>
                  <span>
                    R$ {currentOrg.litellm_current_spend.toLocaleString('pt-BR')} / R${' '}
                    {currentOrg.litellm_monthly_budget.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="w-full h-[6px] bg-[var(--line2)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0066FF]"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (currentOrg.litellm_current_spend /
                            Math.max(1, currentOrg.litellm_monthly_budget)) *
                            100
                        )
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              <form onSubmit={handleUpdateBudget} className="flex items-center gap-[8px] pt-[4px]">
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  placeholder="Novo teto mensal (R$)"
                  className="flex-1 h-[38px] px-[12px] bg-[var(--bg)] border border-[var(--line2)] rounded-[10px] text-[12px] text-[var(--fg)] outline-none"
                />
                <button
                  type="submit"
                  className="h-[38px] px-[12px] rounded-[10px] bg-[var(--bg)] hover:bg-[#0066FF] hover:text-white border border-[var(--line2)] text-[12px] font-medium cursor-pointer transition-colors"
                >
                  Salvar
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* ABA 4: RELATÓRIO EXECUTIVO DE SEGUNDA-FEIRA ÀS 08H00 */}
      {activeTab === 'RELATORIO_8H' && (
        <div className="border-t border-[var(--line)] pt-[22px] grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-[24px]">
          <div className="flex flex-col gap-[14px]">
            <div className="flex flex-wrap items-center justify-between gap-[12px]">
              <div>
                <div className="text-[18px]">
                  Prova de valor semanal (Toda segunda-feira às 08:00)
                </div>
                <div className="text-[12px] text-[var(--ds-muted)]">
                  Consolida todas as execuções e incidentes resolvidos no banco e gera o resumo para o WhatsApp da diretoria.
                </div>
              </div>

              <button
                onClick={generateMonday8amReportNow}
                className="h-[42px] px-[18px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white text-[13px] font-semibold flex items-center gap-[12px] cursor-pointer transition-colors"
              >
                <span>Gerar relatório consolidado agora</span>
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>

            {weeklyReports.length === 0 ? (
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[24px] text-[13px] text-[var(--ds-muted)]">
                Nenhum relatório semanal gerado ainda para esta organização. Clique em &ldquo;Gerar relatório consolidado agora&rdquo; para calcular os dados reais do banco.
              </div>
            ) : (
              <div className="flex flex-col gap-[10px]">
                {weeklyReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] p-[16px] flex flex-col gap-[10px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-medium">
                        Semana {rep.week_start} a {rep.week_end}
                      </span>
                      <span className="flex items-center gap-[5px] bg-[var(--bg)] border border-[var(--line2)] rounded-[6px] px-[8px] py-[3px] text-[10.5px]">
                        <span className="w-[5px] h-[5px] rounded-full bg-[#2f9e5a]"></span>
                        {rep.sent_via_whatsapp_at}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-[10px] pt-[6px]">
                      <div className="bg-[var(--bg)] border border-[var(--line)] rounded-[10px] p-[10px]">
                        <div className="text-[11px] text-[var(--ds-muted)]">Execuções n8n/IA</div>
                        <div className="text-[18px] font-semibold mt-[2px]">
                          {rep.total_automated_runs.toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <div className="bg-[var(--bg)] border border-[var(--line)] rounded-[10px] p-[10px]">
                        <div className="text-[11px] text-[var(--ds-muted)]">Horas poupadas</div>
                        <div className="text-[18px] font-semibold mt-[2px]">
                          {rep.total_hours_saved}h
                        </div>
                      </div>
                      <div className="bg-[var(--bg)] border border-[var(--line)] rounded-[10px] p-[10px]">
                        <div className="text-[11px] text-[var(--ds-muted)]">Falhas evitadas</div>
                        <div className="text-[18px] font-semibold mt-[2px]">
                          {rep.incidents_prevented_count}
                        </div>
                      </div>
                      <div className="bg-[var(--bg)] border border-[var(--line)] rounded-[10px] p-[10px]">
                        <div className="text-[11px] text-[var(--ds-muted)]">Receita protegida</div>
                        <div className="text-[18px] font-semibold text-[#0066FF] mt-[2px]">
                          R$ {rep.revenue_protected_value.toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pré-visualização da Mensagem no WhatsApp dos Sócios */}
          <aside className="bg-[var(--surface)] border border-[var(--line)] rounded-[16px] p-[18px] flex flex-col gap-[12px]">
            <div className="flex items-center gap-[10px]">
              <span className="w-[28px] h-[28px] rounded-full bg-[#0066FF] text-white grid place-items-center">
                <IconRobot16 className="w-[14px] h-[14px]" />
              </span>
              <div>
                <div className="text-[13px] font-semibold">Prévia no WhatsApp dos sócios</div>
                <div className="text-[11px] text-[var(--ds-muted)]">
                  Segunda-feira · 08:00 (America/Sao_Paulo)
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[12px] p-[14px] text-[12.5px] leading-[1.55] flex flex-col gap-[8px]">
              <div className="font-semibold text-[#0066FF]">
                Resumo Executivo Coytech · {currentOrg.name}
              </div>
              <div>
                Bom dia, {authenticatedUser?.name || 'Diretoria'}! Aqui está o balanço consolidado da sua operação:
              </div>
              <div>
                ·{' '}
                <strong>
                  {(latestReport?.total_automated_runs ?? flowRuns.length).toLocaleString('pt-BR')}{' '}
                  processos
                </strong>{' '}
                executados pelos fluxos n8n e Agentes de IA
                <br />·{' '}
                <strong>{latestReport?.total_hours_saved ?? 0} horas manuais</strong> poupadas da equipe
                <br />·{' '}
                <strong>{latestReport?.incidents_prevented_count ?? 0} incidentes</strong>{' '}
                neutralizados pelo Coytech Pulse
                <br />· <strong>SLA de disponibilidade:</strong>{' '}
                {latestReport?.sla_uptime_percentage ?? 99.98}%
                <br />· <strong>Receita protegida no período:</strong> R${' '}
                {(latestReport?.revenue_protected_value ?? 0).toLocaleString('pt-BR')}
              </div>
              <div className="text-[11px] text-[var(--ds-muted)] pt-[4px] border-t border-[var(--line)]">
                Acompanhe ao vivo no celular: /executivo
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
