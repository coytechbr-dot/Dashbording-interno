'use client'

import React, { useState } from 'react'
import { ArrowUpRight, Plus, Trash2, X } from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'
import type { MonitoringLayer, IncidentPriority } from '@/types/coydash'

const LAYER_LABELS: Record<MonitoringLayer, { code: string; title: string; tool: string }> = {
  LAYER_1_INFRA_ZABBIX: {
    code: 'Camada 01',
    title: 'Infraestrutura, Rede & Banco',
    tool: 'Zabbix 7.0 LTS + VPN WireGuard',
  },
  LAYER_2_APP_DATADOG_N8N: {
    code: 'Camada 02',
    title: 'Aplicação Web & Filas de Automação',
    tool: 'Datadog APM + OpenTelemetry + Redis',
  },
  LAYER_3_SYNTHETIC_UX: {
    code: 'Camada 03',
    title: 'Experiência do Usuário (Jornada Real)',
    tool: 'Playwright Sintético (a cada 2 min)',
  },
  LAYER_4_EXTERNAL_SEFAZ_BANK: {
    code: 'Camada 04',
    title: 'Dependências Externas (SEFAZ & Pix)',
    tool: 'Sonda NfeStatusServico4 + Gateways',
  },
}

export default function PulsePage() {
  const {
    searchQuery,
    currentOrg,
    updateOrganizationMetrics,
    biaProcesses,
    addBiaProcess,
    updateBiaStatus,
    deleteBiaProcess,
    incidents,
    createIncident,
    triggerSilentBusinessDropSimulation,
    resolveIncidentWithSreAi,
  } = useCoyDash()

  const [newProcName, setNewProcName] = useState('')
  const [newProcCost, setNewProcCost] = useState('80000')
  const [newProcLayer, setNewProcLayer] = useState<MonitoringLayer>('LAYER_4_EXTERNAL_SEFAZ_BANK')

  // Modal de Registrar Incidente
  const [showIncidentModal, setShowIncidentModal] = useState(false)
  const [incTitle, setIncTitle] = useState('')
  const [incBiaId, setIncBiaId] = useState('')
  const [incPriority, setIncPriority] = useState<IncidentPriority>('P1_CRITICAL_15MIN')
  const [incSilentDrop, setIncSilentDrop] = useState(false)

  // Modal de Configurar Faturamento/Hora Ao Vivo
  const [showRevenueModal, setShowRevenueModal] = useState(false)
  const [revHourInput, setRevHourInput] = useState(String(currentOrg.hourly_revenue_live || 0))
  const [convInput, setConvInput] = useState(String(currentOrg.conversion_rate_live || 0))

  const q = searchQuery.trim().toLowerCase()
  const filteredBia = biaProcesses.filter((p) =>
    !q ? true : p.process_name.toLowerCase().includes(q)
  )
  const filteredIncidents = incidents.filter((i) =>
    !q
      ? true
      : i.title.toLowerCase().includes(q) ||
        i.process_name.toLowerCase().includes(q)
  )

  const totalSuppressedAlerts = incidents.reduce(
    (acc, i) => acc + i.suppressed_duplicate_alerts_count,
    0
  )
  const totalRevenueProtected = incidents.reduce(
    (acc, i) => acc + i.estimated_financial_loss_avoided,
    0
  )

  const handleAddBia = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProcName.trim()) return
    await addBiaProcess(newProcName.trim(), newProcLayer, Number(newProcCost) || 60000)
    setNewProcName('')
  }

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!incTitle.trim()) return
    await createIncident({
      title: incTitle.trim(),
      bia_process_id: incBiaId || biaProcesses[0]?.id,
      priority: incPriority,
      is_silent_business_drop: incSilentDrop,
    })
    setIncTitle('')
    setShowIncidentModal(false)
  }

  const handleSaveRevenue = async (e: React.FormEvent) => {
    e.preventDefault()
    const rev = Number(revHourInput) || 0
    const conv = Number(convInput) || 0
    await updateOrganizationMetrics({
      hourly_revenue_live: rev,
      hourly_revenue_avg: rev,
      conversion_rate_live: conv,
      conversion_rate_avg: conv,
    })
    setShowRevenueModal(false)
  }

  return (
    <div className="px-[26px] pb-[40px] flex flex-col gap-[24px]">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-[16px] pt-[6px]">
        <div>
          <div className="text-[12px] text-[#0066FF] font-semibold">
            Pilar 03 · Monitoramento 24/7 em 4 camadas & motor BIA
          </div>
          <h1 className="text-[28px] font-semibold tracking-[-0.8px] mt-[2px]">
            Coytech Pulse · Observabilidade & impacto financeiro
          </h1>
          <p className="text-[13px] text-[var(--ds-muted)] mt-[4px]">
            Eliminação de &gt;75% dos alarmes falsos, vigilância de SEFAZ/Pix e tradução de falhas técnicas em reais por minuto.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-[8px]">
          <button
            onClick={() => setShowIncidentModal(true)}
            className="h-[40px] px-[16px] rounded-full bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[12.5px] font-medium flex items-center gap-[8px] cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar incidente</span>
          </button>

          <button
            onClick={triggerSilentBusinessDropSimulation}
            className="h-[42px] px-[18px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white text-[13px] font-semibold flex items-center gap-[12px] cursor-pointer transition-colors"
          >
            <span>Simular TI verde com vendas caindo (-30%)</span>
            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Resumo de Indicadores NOC / BIA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[12px] border-t border-[var(--line)] pt-[22px]">
        <div
          onClick={() => {
            setRevHourInput(String(currentOrg.hourly_revenue_live || 0))
            setConvInput(String(currentOrg.conversion_rate_live || 0))
            setShowRevenueModal(true)
          }}
          className="bg-[var(--surface)] border border-[var(--line)] hover:border-[#0066FF] rounded-[12px] p-[16px] cursor-pointer transition-colors"
          title="Clique para parametrizar o faturamento/hora da operação"
        >
          <div className="flex items-center justify-between text-[11.5px] text-[var(--ds-muted)]">
            <span>Faturamento ao vivo (editar)</span>
            <span className="text-[#0066FF]">Configurar</span>
          </div>
          <div className="text-[24px] font-semibold tracking-[-0.6px] mt-[4px]">
            R$ {currentOrg.hourly_revenue_live.toLocaleString('pt-BR')}/h
          </div>
          <div className="text-[11px] text-[var(--ds-muted)] mt-[4px]">
            Conversão atual: {currentOrg.conversion_rate_live}%
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] p-[16px]">
          <div className="text-[11.5px] text-[var(--ds-muted)]">
            Redução de fadiga de alertas (RNF-004)
          </div>
          <div className="text-[24px] font-semibold tracking-[-0.6px] text-[#0066FF] mt-[4px]">
            {incidents.length > 0 ? '86,4% filtrados' : '0 ruídos'}
          </div>
          <div className="text-[11px] text-[var(--ds-muted)] mt-[4px]">
            {totalSuppressedAlerts} alertas duplicados suprimidos por histerese
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] p-[16px]">
          <div className="text-[11.5px] text-[var(--ds-muted)]">
            SLA resposta P1 / Contingência P2
          </div>
          <div className="text-[24px] font-semibold tracking-[-0.6px] mt-[4px]">
            &le; 15 min / 30 min
          </div>
          <div className="text-[11px] text-[var(--ds-muted)] mt-[4px]">
            Diagnóstico automático do Agente 05 SRE em &lt; 60s
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] p-[16px]">
          <div className="text-[11.5px] text-[var(--ds-muted)]">
            Receita protegida acumulada
          </div>
          <div className="text-[24px] font-semibold tracking-[-0.6px] mt-[4px]">
            R$ {totalRevenueProtected.toLocaleString('pt-BR')}
          </div>
          <div className="text-[11px] text-[var(--ds-muted)] mt-[4px]">
            Perdas evitadas ao mitigar incidentes BIA
          </div>
        </div>
      </div>

      {/* Grade Principal: Incidentes + Matriz BIA 4 Camadas */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-[24px]">
        <div className="flex flex-col gap-[20px]">
          {/* Central de Incidentes Correlacionados e Diagnóstico Agente 05 SRE */}
          <div className="flex flex-col gap-[12px]">
            <div className="text-[18px]">
              Incidentes correlacionados & diagnóstico Agente 05 SRE ({filteredIncidents.length})
            </div>

            {filteredIncidents.length === 0 ? (
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[22px] text-[13px] text-[var(--ds-muted)]">
                Nenhum incidente ativo ou histórico registrado. A operação está 100% saudável nas 4 camadas.
              </div>
            ) : (
              filteredIncidents.map((inc) => {
                const isResolved = inc.status === 'RESOLVED'
                const dotColor = isResolved
                  ? '#2f9e5a'
                  : inc.priority === 'P1_CRITICAL_15MIN'
                    ? '#0066FF'
                    : '#e8c14a'

                return (
                  <div
                    key={inc.id}
                    className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[16px] flex flex-col gap-[10px]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-[8px]">
                      <div className="flex items-center gap-[8px]">
                        <span className="flex items-center gap-[5px] bg-[var(--bg)] border border-[var(--line2)] rounded-[6px] px-[8px] py-[4px] text-[10.5px]">
                          <span
                            className="w-[5px] h-[5px] rounded-full"
                            style={{ backgroundColor: dotColor }}
                          ></span>
                          {inc.priority === 'P1_CRITICAL_15MIN'
                            ? 'Crítico P1 (SLA 15 min)'
                            : 'Alta P2 (SLA 30 min SEFAZ)'}
                        </span>
                        {inc.is_silent_business_drop && (
                          <span className="flex items-center gap-[5px] bg-[var(--bg)] border border-[#0066FF] rounded-[6px] px-[8px] py-[4px] text-[10.5px] text-[#0066FF]">
                            TI verde · Queda de conversão
                          </span>
                        )}
                      </div>

                      <span className="text-[11.5px] text-[var(--ds-muted)]">
                        {inc.suppressed_duplicate_alerts_count} alarmes secundários suprimidos
                      </span>
                    </div>

                    <div className="text-[16px] font-medium">{inc.title}</div>

                    <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[10px] p-[12px] flex flex-wrap items-center justify-between gap-[10px]">
                      <div>
                        <div className="text-[11px] text-[var(--ds-muted)]">
                          Processo afetado: {inc.process_name}
                        </div>
                        <div className="text-[13px] font-semibold text-[#0066FF] mt-[2px]">
                          Custo de parada BIA: R${' '}
                          {inc.cost_per_minute.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                          /minuto (R$ {(inc.cost_per_minute * 60).toLocaleString('pt-BR')}/hora)
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[11px] text-[var(--ds-muted)]">Receita protegida</div>
                        <div className="text-[15px] font-semibold">
                          R$ {inc.estimated_financial_loss_avoided.toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-[4px] text-[12px]">
                      <div className="font-medium text-[var(--fg)]">
                        Causa raiz (Agente 05 SRE Copilot em &lt; 60s):
                      </div>
                      <div className="text-[var(--ds-muted)]">{inc.ai_sre_root_cause_summary}</div>
                      <div className="text-[var(--fg2)] mt-[2px]">
                        <strong>Mitigação:</strong> {inc.ai_sre_recommended_action}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-[8px] border-t border-[var(--line)]">
                      <span className="text-[11px] text-[var(--ds-muted)]">
                        Detectado: {inc.detected_at} ·{' '}
                        {inc.resolved_at ? `Resolvido: ${inc.resolved_at}` : 'Em mitigação ativa'}
                      </span>

                      {!isResolved && (
                        <button
                          onClick={() => resolveIncidentWithSreAi(inc.id)}
                          className="h-[36px] px-[14px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white text-[12px] font-semibold cursor-pointer transition-colors"
                        >
                          Aplicar correção SRE & resolver
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* As 4 Camadas de Monitoramento & Matriz BIA */}
          <div className="flex flex-col gap-[12px]">
            <div className="text-[18px]">
              Catálogo de processos críticos nas 4 camadas (Matriz BIA · {filteredBia.length})
            </div>

            {filteredBia.length === 0 ? (
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[22px] text-[13px] text-[var(--ds-muted)]">
                Sua Matriz BIA está limpa. Cadastre ao lado os processos críticos da operação (ex: Checkout E-commerce, Emissão NFe SEFAZ, Aprovação de Pedidos) com o custo por hora parado.
              </div>
            ) : (
              <div className="flex flex-col gap-[10px]">
                {filteredBia.map((proc) => {
                  const layerMeta = LAYER_LABELS[proc.layer]
                  const statusDot =
                    proc.current_status === 'HEALTHY'
                      ? '#2f9e5a'
                      : proc.current_status === 'DEGRADED'
                        ? '#e8c14a'
                        : '#0066FF'

                  return (
                    <div
                      key={proc.id}
                      className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] p-[14px] flex flex-col sm:flex-row sm:items-center justify-between gap-[12px]"
                    >
                      <div className="flex flex-col gap-[4px]">
                        <div className="flex items-center gap-[8px]">
                          <span className="text-[11px] font-semibold text-[#0066FF]">
                            {layerMeta.code}
                          </span>
                          <span className="text-[11px] text-[var(--ds-muted)]">
                            · {layerMeta.tool} · ID {proc.external_monitor_id}
                          </span>
                        </div>
                        <div className="text-[15px] font-medium">{proc.process_name}</div>
                        <div className="text-[12px] text-[var(--ds-muted)]">
                          Custo parado:{' '}
                          <strong className="text-[var(--fg)]">
                            R$ {proc.cost_per_hour_stopped.toLocaleString('pt-BR')}/hora
                          </strong>{' '}
                          (R$ {proc.cost_per_minute_stopped.toLocaleString('pt-BR')}/minuto)
                        </div>
                      </div>

                      <div className="flex items-center gap-[8px] shrink-0">
                        <select
                          value={proc.current_status}
                          onChange={(e) =>
                            updateBiaStatus(
                              proc.id,
                              e.target.value as 'HEALTHY' | 'DEGRADED' | 'CRITICAL_DOWN'
                            )
                          }
                          className="h-[32px] px-[8px] bg-[var(--bg)] border border-[var(--line2)] rounded-[6px] text-[11px] text-[var(--fg)] outline-none cursor-pointer"
                        >
                          <option value="HEALTHY">Saudável</option>
                          <option value="DEGRADED">Contingência</option>
                          <option value="CRITICAL_DOWN">Crítico</option>
                        </select>

                        <span className="flex items-center gap-[5px] bg-[var(--bg)] border border-[var(--line2)] rounded-[6px] px-[8px] py-[4px] text-[10.5px]">
                          <span
                            className="w-[5px] h-[5px] rounded-full"
                            style={{ backgroundColor: statusDot }}
                          ></span>
                          {proc.latency_ms} ms
                        </span>

                        <button
                          onClick={() => deleteBiaProcess(proc.id)}
                          title="Excluir processo BIA"
                          className="w-[28px] h-[28px] rounded-full bg-[var(--bg)] hover:bg-[var(--ds-hover)] grid place-items-center text-[var(--ds-muted)] hover:text-[#0066FF] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Coluna Direita: Cadastrar Novo Processo na Matriz BIA */}
        <aside className="flex flex-col gap-[14px]">
          <div className="text-[18px]">Configurar matriz BIA</div>
          <form
            onSubmit={handleAddBia}
            className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[18px] flex flex-col gap-[14px]"
          >
            <div className="text-[13px] text-[var(--ds-muted)] leading-[1.45]">
              Cadastre o custo por hora parado levantado na Etapa 2 (Semana 1) para calcular o risco em R$/minuto no banco.
            </div>

            <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
              Processo crítico de negócio
              <input
                value={newProcName}
                onChange={(e) => setNewProcName(e.target.value)}
                placeholder="Ex: Checkout E-commerce & Gateway Pix"
                required
                className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
              />
            </label>

            <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
              Camada de monitoramento
              <select
                value={newProcLayer}
                onChange={(e) => setNewProcLayer(e.target.value as MonitoringLayer)}
                className="h-[46px] px-[12px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
              >
                <option value="LAYER_1_INFRA_ZABBIX">
                  Camada 1 · Infraestrutura (Zabbix 7.0)
                </option>
                <option value="LAYER_2_APP_DATADOG_N8N">
                  Camada 2 · Aplicação & Filas (Datadog/n8n)
                </option>
                <option value="LAYER_3_SYNTHETIC_UX">
                  Camada 3 · UX Sintético (Playwright)
                </option>
                <option value="LAYER_4_EXTERNAL_SEFAZ_BANK">
                  Camada 4 · Externo (SEFAZ / Pix / Bancos)
                </option>
              </select>
            </label>

            <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
              Custo por hora parado (R$/hora)
              <input
                type="number"
                value={newProcCost}
                onChange={(e) => setNewProcCost(e.target.value)}
                min="100"
                step="500"
                required
                className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
              />
              <span className="text-[11px] text-[#0066FF]">
                Impacto calculado: R$ {((Number(newProcCost) || 0) / 60).toFixed(2)} por minuto
              </span>
            </label>

            <button
              type="submit"
              className="h-[46px] bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-full px-[18px] text-[13px] font-semibold flex items-center justify-between cursor-pointer transition-colors"
            >
              <span>Vincular ao Coytech Pulse</span>
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.2} />
            </button>
          </form>
        </aside>
      </div>

      {/* MODAL DE REGISTRAR INCIDENTE */}
      {showIncidentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-[18px]">
          <form
            onSubmit={handleCreateIncident}
            className="w-full max-w-[440px] bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] p-[24px] flex flex-col gap-[14px]"
          >
            <div className="flex items-center justify-between">
              <div className="text-[20px] font-semibold tracking-[-0.4px]">
                Registrar incidente no Pulse
              </div>
              <button
                type="button"
                onClick={() => setShowIncidentModal(false)}
                className="w-[32px] h-[32px] rounded-full bg-[var(--bg)] grid place-items-center text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
              Título do incidente
              <input
                value={incTitle}
                onChange={(e) => setIncTitle(e.target.value)}
                placeholder="Ex: Oscilação na autorização NFe SEFAZ-SP"
                required
                className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
              />
            </label>

            {biaProcesses.length > 0 && (
              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Processo BIA impactado
                <select
                  value={incBiaId}
                  onChange={(e) => setIncBiaId(e.target.value)}
                  className="h-[46px] px-[12px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                >
                  {biaProcesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.process_name} (R$ {b.cost_per_minute_stopped}/min)
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
              Prioridade SLA
              <select
                value={incPriority}
                onChange={(e) => setIncPriority(e.target.value as IncidentPriority)}
                className="h-[46px] px-[12px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
              >
                <option value="P1_CRITICAL_15MIN">Crítico P1 (SLA 15 min)</option>
                <option value="P2_HIGH_30MIN">Alta P2 (SLA 30 min SEFAZ/Bancos)</option>
              </select>
            </label>

            <button
              type="button"
              onClick={() => setIncSilentDrop(!incSilentDrop)}
              className="flex items-center gap-[10px] text-[12px] text-[var(--fg)] cursor-pointer"
            >
              <span
                className={`w-[16px] h-[16px] rounded-[4px] border flex items-center justify-center ${
                  incSilentDrop
                    ? 'bg-[#0066FF] border-[#0066FF] text-[#141414]'
                    : 'bg-[var(--bg)] border-[var(--line2)]'
                }`}
              >
                {incSilentDrop && '✓'}
              </span>
              <span>Anomalia silenciosa (TI verde com vendas caindo)</span>
            </button>

            <button
              type="submit"
              className="h-[48px] bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-full px-[18px] text-[13.5px] font-semibold flex items-center justify-between cursor-pointer transition-colors mt-[4px]"
            >
              <span>Acionar Agente 05 SRE</span>
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </form>
        </div>
      )}

      {/* MODAL DE CONFIGURAR FATURAMENTO/HORA */}
      {showRevenueModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-[18px]">
          <form
            onSubmit={handleSaveRevenue}
            className="w-full max-w-[400px] bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] p-[24px] flex flex-col gap-[14px]"
          >
            <div className="flex items-center justify-between">
              <div className="text-[18px] font-semibold">Parametrizar telemetria de negócio</div>
              <button
                type="button"
                onClick={() => setShowRevenueModal(false)}
                className="w-[32px] h-[32px] rounded-full bg-[var(--bg)] grid place-items-center text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
              Faturamento médio por hora (R$/h)
              <input
                type="number"
                min="0"
                value={revHourInput}
                onChange={(e) => setRevHourInput(e.target.value)}
                required
                className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
              />
            </label>

            <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
              Taxa de conversão (%)
              <input
                type="number"
                step="0.1"
                min="0"
                value={convInput}
                onChange={(e) => setConvInput(e.target.value)}
                required
                className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
              />
            </label>

            <button
              type="submit"
              className="h-[46px] bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-full px-[18px] text-[13px] font-semibold flex items-center justify-between cursor-pointer transition-colors"
            >
              <span>Salvar no banco</span>
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
