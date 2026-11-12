'use client'

import React, { useState } from 'react'
import { ArrowUpRight, Plus, Trash2, X } from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'
import type { QueueType } from '@/types/coydash'

const QUEUE_TYPE_LABELS: Record<QueueType | 'ALL', string> = {
  ALL: 'Todas as filas',
  DISCOUNT_EXCEPTION: 'Exceções de desconto (Agente 02)',
  PURCHASE_ORDER: 'Pedidos & compras ERP',
  FINANCIAL_RELEASE: 'Liberações financeiras',
  KYC_ONBOARDING: 'Cadastro & crédito B2B',
}

export default function StudioPage() {
  const {
    authenticatedUser,
    searchQuery,
    currentPersona,
    approvalQueues,
    createQueueItem,
    decideApprovalOneClick,
    deleteQueueItem,
    auditLogs,
    spreadsheets,
    addSpreadsheet,
    updateSpreadsheetStatus,
    lockAllLegacySpreadsheets,
  } = useCoyDash()

  const [selectedQueueType, setSelectedQueueType] = useState<QueueType | 'ALL'>('ALL')
  const [activeTab, setActiveTab] = useState<'FILAS' | 'AUDITORIA' | 'PLANILHAS'>('FILAS')

  // Estado do Modal de Nova Solicitação na Fila
  const [showNewQueueModal, setShowNewQueueModal] = useState(false)
  const [newQueueType, setNewQueueType] = useState<QueueType>('PURCHASE_ORDER')
  const [newQueueTitle, setNewQueueTitle] = useState('')
  const [newQueueRef, setNewQueueRef] = useState('')
  const [newQueueRequester, setNewQueueRequester] = useState('')
  const [newQueueAmount, setNewQueueAmount] = useState('')
  const [newQueueSla, setNewQueueSla] = useState('30')
  const [newQueueNotes, setNewQueueNotes] = useState('')

  // Estado do Formulário de Nova Planilha Legada
  const [sheetName, setSheetName] = useState('')
  const [sheetDept, setSheetDept] = useState('Financeiro & Compras')
  const [sheetRows, setSheetRows] = useState('1200')
  const [sheetModule, setSheetModule] = useState('Coytech Studio · Filas 1-Clique')

  const q = searchQuery.trim().toLowerCase()

  const filteredQueues = approvalQueues
    .filter((item) =>
      selectedQueueType === 'ALL' ? true : item.queue_type === selectedQueueType
    )
    .filter((item) =>
      !q
        ? true
        : item.title.toLowerCase().includes(q) ||
          item.reference_code.toLowerCase().includes(q) ||
          item.requester_name.toLowerCase().includes(q)
    )

  const filteredLogs = auditLogs.filter((log) =>
    !q
      ? true
      : log.action_type.toLowerCase().includes(q) ||
        log.actor_name.toLowerCase().includes(q) ||
        log.entity_table.toLowerCase().includes(q)
  )

  const pendingCount = approvalQueues.filter((item) => item.status === 'PENDING').length
  const lockedSheetsCount = spreadsheets.filter((s) => s.status === 'READ_ONLY_LOCKED').length
  const actorDisplay = authenticatedUser?.name || currentPersona.name

  const handleCreateQueue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQueueTitle.trim()) return
    await createQueueItem({
      queue_type: newQueueType,
      title: newQueueTitle.trim(),
      reference_code:
        newQueueRef.trim() || `#ERP-${Math.floor(1000 + Math.random() * 9000)}`,
      requester_name: newQueueRequester.trim() || actorDisplay,
      amount_value: Number(newQueueAmount) || 0,
      sla_minutes: Number(newQueueSla) || 30,
      notes: newQueueNotes.trim() || undefined,
    })
    setNewQueueTitle('')
    setNewQueueRef('')
    setNewQueueAmount('')
    setNewQueueNotes('')
    setShowNewQueueModal(false)
  }

  const handleAddSheet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sheetName.trim()) return
    await addSpreadsheet({
      sheet_name: sheetName.trim(),
      department: sheetDept.trim() || 'Operações',
      rows_count: Number(sheetRows) || 0,
      replaced_by_module: sheetModule.trim() || 'Coytech Studio',
    })
    setSheetName('')
  }

  return (
    <div className="px-[26px] pb-[40px] flex flex-col gap-[24px]">
      {/* Cabeçalho da Rota */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-[16px] pt-[6px]">
        <div>
          <div className="text-[12px] text-[#0066FF] font-semibold">
            Pilar 01 · Criação de sistemas sob medida
          </div>
          <h1 className="text-[28px] font-semibold tracking-[-0.8px] mt-[2px]">
            Coytech Studio · Portal operacional 1-clique
          </h1>
          <p className="text-[13px] text-[var(--ds-muted)] mt-[4px]">
            Filas com SLA regressivo ao vivo, sincronização com ERP em menos de 3 segundos e trilha de auditoria imutável.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-[8px]">
          {(
            [
              { id: 'FILAS', label: `Filas SLA (${pendingCount} pendentes)` },
              { id: 'AUDITORIA', label: `Audit log (${auditLogs.length})` },
              {
                id: 'PLANILHAS',
                label: `Planilhas legadas (${lockedSheetsCount}/${spreadsheets.length} travadas)`,
              },
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

      {/* ABA 1: FILAS OPERACIONAIS COM SLA AO VIVO E APROVAÇÃO EM 1 CLIQUE */}
      {activeTab === 'FILAS' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-[24px] border-t border-[var(--line)] pt-[22px]">
          <div className="flex flex-col gap-[16px]">
            <div className="flex flex-wrap items-center justify-between gap-[10px]">
              {/* Filtros por tipo de fila */}
              <div className="flex flex-wrap gap-[8px]">
                {(
                  [
                    'ALL',
                    'DISCOUNT_EXCEPTION',
                    'PURCHASE_ORDER',
                    'FINANCIAL_RELEASE',
                    'KYC_ONBOARDING',
                  ] as const
                ).map((type) => {
                  const selected = selectedQueueType === type
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedQueueType(type)}
                      className={`h-[34px] px-[12px] rounded-full text-[12px] transition-colors cursor-pointer border ${
                        selected
                          ? 'bg-[var(--surface)] text-[var(--fg)] border-[#0066FF] font-medium'
                          : 'bg-[var(--bg)] text-[var(--ds-muted)] border-[var(--line2)] hover:text-[var(--fg)]'
                      }`}
                    >
                      {QUEUE_TYPE_LABELS[type]}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setShowNewQueueModal(true)}
                className="h-[38px] px-[16px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white text-[12.5px] font-semibold flex items-center gap-[8px] cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>Nova solicitação na fila</span>
              </button>
            </div>

            {/* Cards da Fila */}
            {filteredQueues.length === 0 ? (
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[28px] flex flex-col items-start gap-[12px]">
                <div className="text-[16px] font-medium">Nenhuma solicitação na fila</div>
                <div className="text-[13px] text-[var(--ds-muted)] max-w-[520px]">
                  Adicione um pedido de compra, liberação financeira, exceção de desconto ou cadastro B2B para testar e operar a aprovação em 1 clique com gravação automática no Audit Log.
                </div>
                <button
                  onClick={() => setShowNewQueueModal(true)}
                  className="h-[40px] px-[18px] rounded-full bg-[var(--bg)] hover:bg-[#0066FF] hover:text-white border border-[var(--line2)] text-[12.5px] font-semibold flex items-center gap-[10px] cursor-pointer transition-colors"
                >
                  <span>Criar primeira solicitação</span>
                  <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.2} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-[12px]">
                {filteredQueues.map((item) => {
                  const isPending = item.status === 'PENDING'
                  const statusDot =
                    item.status === 'APPROVED_1CLICK'
                      ? '#2f9e5a'
                      : item.status === 'PENDING'
                        ? '#e8c14a'
                        : '#0066FF'

                  return (
                    <div
                      key={item.id}
                      className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] p-[16px] flex flex-col gap-[12px]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-[10px]">
                        <div className="flex items-center gap-[8px]">
                          <span className="text-[12px] font-semibold text-[#0066FF]">
                            {item.reference_code}
                          </span>
                          <span className="text-[12px] text-[var(--ds-muted)]">
                            · Origem: {item.requester_name}
                          </span>
                        </div>

                        <div className="flex items-center gap-[8px]">
                          {isPending && (
                            <span className="flex items-center gap-[5px] bg-[var(--bg)] border border-[var(--line2)] rounded-[6px] px-[8px] py-[4px] text-[10.5px]">
                              <span
                                className="w-[5px] h-[5px] rounded-full"
                                style={{
                                  backgroundColor:
                                    item.sla_minutes_remaining <= 15 ? '#0066FF' : '#e8c14a',
                                }}
                              ></span>
                              SLA ({item.sla_minutes_remaining} min restantes)
                            </span>
                          )}

                          <span className="flex items-center gap-[5px] bg-[var(--bg)] border border-[var(--line2)] rounded-[6px] px-[8px] py-[4px] text-[10.5px]">
                            <span
                              className="w-[5px] h-[5px] rounded-full"
                              style={{ backgroundColor: statusDot }}
                            ></span>
                            {item.status === 'APPROVED_1CLICK'
                              ? 'Aprovado em 1 clique'
                              : item.status === 'PENDING'
                                ? 'Aguardando decisão'
                                : item.status === 'NEEDS_REVISION'
                                  ? 'Ajuste solicitado'
                                  : 'Rejeitado'}
                          </span>

                          <button
                            onClick={() => deleteQueueItem(item.id)}
                            title="Remover item"
                            className="w-[28px] h-[28px] rounded-full bg-[var(--bg)] hover:bg-[var(--ds-hover)] grid place-items-center text-[var(--ds-muted)] hover:text-[#0066FF] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-[12px]">
                        <div>
                          <div className="text-[16px] font-medium">{item.title}</div>
                          <div className="flex flex-wrap gap-x-[16px] gap-y-[4px] mt-[6px]">
                            {Object.entries(item.payload_summary).map(([k, v]) => (
                              <span key={k} className="text-[12px] text-[var(--ds-muted)]">
                                {k}: <strong className="text-[var(--fg2)] font-medium">{v}</strong>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="text-[20px] font-semibold tracking-[-0.4px] shrink-0">
                          R${' '}
                          {item.amount_value.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </div>

                      {isPending ? (
                        <div className="flex flex-wrap items-center justify-between gap-[10px] pt-[10px] border-t border-[var(--line)]">
                          <span className="text-[11px] text-[var(--ds-muted)]">
                            Assinatura digital RBAC: {actorDisplay}
                          </span>

                          <div className="flex items-center gap-[8px]">
                            <button
                              onClick={() => decideApprovalOneClick(item.id, 'NEEDS_REVISION')}
                              className="h-[38px] px-[14px] rounded-full bg-[var(--bg)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[12px] font-medium cursor-pointer transition-colors"
                            >
                              Solicitar ajuste
                            </button>
                            <button
                              onClick={() => decideApprovalOneClick(item.id, 'REJECTED')}
                              className="h-[38px] px-[14px] rounded-full bg-[var(--bg)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[12px] font-medium cursor-pointer transition-colors"
                            >
                              Rejeitar
                            </button>
                            <button
                              onClick={() => decideApprovalOneClick(item.id, 'APPROVED_1CLICK')}
                              className="h-[42px] px-[18px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white text-[13px] font-semibold flex items-center gap-[12px] cursor-pointer transition-colors"
                            >
                              <span>Aprovar em 1 clique</span>
                              <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11.5px] text-[var(--ds-muted)] pt-[8px] border-t border-[var(--line)]">
                          Decidido por{' '}
                          <strong className="text-[var(--fg)]">
                            {item.decided_by_name || actorDisplay}
                          </strong>{' '}
                          · {item.decided_at} · Sincronizado no PostgreSQL e gravado no Audit Log.
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Coluna Direita (330px): Regras de Alçada RBAC & Performance */}
          <aside className="flex flex-col gap-[14px]">
            <div className="text-[18px]">Governança RBAC & SLA</div>

            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] p-[16px] flex flex-col gap-[10px]">
              <div className="text-[14px] font-medium">Política determinística de alçada</div>
              <div className="text-[12px] text-[var(--ds-muted)] leading-[1.45]">
                Nenhum Agente de IA aprova descontos ou pagamentos acima do limite parametrizado em{' '}
                <code className="text-[var(--fg)]">approval_policies</code>.
              </div>
              <div className="flex flex-col gap-[8px] pt-[8px] border-t border-[var(--line)] text-[12px]">
                <div className="flex justify-between">
                  <span className="text-[var(--ds-muted)]">Autônomo (Agente 02)</span>
                  <span className="font-medium">Até R$ 1.500 / 3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ds-muted)]">Alçada COO / Operações</span>
                  <span className="font-medium">Até R$ 50.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ds-muted)]">Alçada CEO / Diretoria</span>
                  <span className="font-medium">Acima de R$ 50.000</span>
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] p-[16px] flex flex-col gap-[8px]">
              <div className="text-[14px] font-medium">Meta RNF-003 (&lt; 3 segundos)</div>
              <div className="text-[28px] font-semibold tracking-[-0.8px] text-[#0066FF]">
                0,34s
              </div>
              <div className="text-[11.5px] text-[var(--ds-muted)]">
                Tempo médio entre o clique na tela, gravação no Supabase PostgreSQL e registro no Audit Log.
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ABA 2: TRILHA DE AUDITORIA IMUTÁVEL */}
      {activeTab === 'AUDITORIA' && (
        <div className="border-t border-[var(--line)] pt-[22px] flex flex-col gap-[14px]">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[18px]">Trilha de auditoria imutável (studio_audit_logs)</div>
              <div className="text-[12px] text-[var(--ds-muted)]">
                Registro criptográfico de actor_id, ip_address, payload_before e payload_after no Supabase.
              </div>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[24px] text-[13px] text-[var(--ds-muted)]">
              Nenhum evento de auditoria registrado ainda para esta organização. Crie ou aprove um item na fila para gerar registros imutáveis.
            </div>
          ) : (
            <div className="flex flex-col gap-[10px]">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] p-[16px] flex flex-col gap-[10px]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-[8px]">
                    <div className="flex items-center gap-[10px]">
                      <span className="flex items-center gap-[5px] bg-[var(--bg)] border border-[var(--line2)] rounded-[6px] px-[8px] py-[4px] text-[10.5px]">
                        <span className="w-[5px] h-[5px] rounded-full bg-[#0066FF]"></span>
                        {log.action_type}
                      </span>
                      <span className="text-[14px] font-medium">{log.actor_name}</span>
                    </div>
                    <div className="text-[11.5px] text-[var(--ds-muted)]">
                      IP: {log.ip_address} · Tabela: {log.entity_table} · {log.created_at}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px] text-[11.5px]">
                    <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[10px] p-[10px]">
                      <div className="text-[10.5px] text-[var(--ds-muted)] mb-[4px]">
                        ESTADO ANTERIOR (payload_before)
                      </div>
                      <pre className="overflow-x-auto text-[var(--fg2)]">
                        {JSON.stringify(log.payload_before, null, 2)}
                      </pre>
                    </div>
                    <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[10px] p-[10px]">
                      <div className="text-[10.5px] text-[#0066FF] mb-[4px]">
                        ESTADO POSTERIOR (payload_after)
                      </div>
                      <pre className="overflow-x-auto text-[var(--fg)]">
                        {JSON.stringify(log.payload_after, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 3: SUBSTITUIÇÃO E CONGELAMENTO DE PLANILHAS LEGADAS */}
      {activeTab === 'PLANILHAS' && (
        <div className="border-t border-[var(--line)] pt-[22px] grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-[24px]">
          <div className="flex flex-col gap-[16px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[12px]">
              <div>
                <div className="text-[18px]">
                  Migração e congelamento de planilhas paralelas (Semana 4 · Go-Live)
                </div>
                <div className="text-[12px] text-[var(--ds-muted)]">
                  Importa dados históricos para o PostgreSQL 16 e altera permissões para Somente Leitura.
                </div>
              </div>

              {spreadsheets.length > 0 && (
                <button
                  onClick={lockAllLegacySpreadsheets}
                  className="h-[40px] px-[18px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white text-[12.5px] font-semibold flex items-center gap-[10px] self-start cursor-pointer transition-colors"
                >
                  <span>Travar todas em somente leitura</span>
                  <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              )}
            </div>

            {spreadsheets.length === 0 ? (
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[24px] text-[13px] text-[var(--ds-muted)]">
                Nenhuma planilha legada mapeada ainda. Use o formulário ao lado para cadastrar as planilhas que serão substituídas pelo Coytech Studio.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">
                {spreadsheets.map((sheet) => {
                  const isLocked = sheet.status === 'READ_ONLY_LOCKED'
                  const isMigrated = sheet.status === 'MIGRATED_POSTGRES'
                  return (
                    <div
                      key={sheet.id}
                      className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] p-[16px] flex flex-col gap-[10px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[var(--ds-muted)]">
                          {sheet.department}
                        </span>
                        <span className="flex items-center gap-[5px] bg-[var(--bg)] border border-[var(--line2)] rounded-[6px] px-[8px] py-[3px] text-[10.5px]">
                          <span
                            className="w-[5px] h-[5px] rounded-full"
                            style={{
                              backgroundColor: isLocked
                                ? '#2f9e5a'
                                : isMigrated
                                  ? '#e8c14a'
                                  : '#0066FF',
                            }}
                          ></span>
                          {isLocked
                            ? 'Somente leitura (Drive API)'
                            : isMigrated
                              ? 'Migrada p/ PostgreSQL'
                              : 'Ativa em paralelo'}
                        </span>
                      </div>

                      <div className="text-[14px] font-medium break-all">{sheet.sheet_name}</div>

                      <div className="text-[12px] text-[var(--ds-muted)]">
                        {sheet.rows_count.toLocaleString('pt-BR')} linhas mapeadas · Substituída por:{' '}
                        <strong className="text-[var(--fg)]">{sheet.replaced_by_module}</strong>
                      </div>

                      {!isLocked && (
                        <div className="flex items-center gap-[8px] pt-[8px] border-t border-[var(--line)] mt-auto">
                          {!isMigrated && (
                            <button
                              onClick={() =>
                                updateSpreadsheetStatus(sheet.id, 'MIGRATED_POSTGRES')
                              }
                              className="h-[34px] px-[12px] rounded-full bg-[var(--bg)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[11.5px] font-medium cursor-pointer transition-colors"
                            >
                              Migrar p/ PostgreSQL
                            </button>
                          )}
                          <button
                            onClick={() =>
                              updateSpreadsheetStatus(sheet.id, 'READ_ONLY_LOCKED')
                            }
                            className="h-[34px] px-[12px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white text-[11.5px] font-semibold cursor-pointer transition-colors"
                          >
                            Travar somente leitura
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Formulário Lateral: Mapear Planilha Legada */}
          <aside className="flex flex-col gap-[14px]">
            <div className="text-[18px]">Mapear planilha legada</div>
            <form
              onSubmit={handleAddSheet}
              className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[18px] flex flex-col gap-[12px]"
            >
              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Nome do arquivo (.xlsx / Google Sheets)
                <input
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  placeholder="Ex: Controle_Aprovacoes_2026_v4.xlsx"
                  required
                  className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                />
              </label>

              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Departamento responsável
                <input
                  value={sheetDept}
                  onChange={(e) => setSheetDept(e.target.value)}
                  required
                  className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                />
              </label>

              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Quantidade estimada de linhas
                <input
                  type="number"
                  value={sheetRows}
                  onChange={(e) => setSheetRows(e.target.value)}
                  min="1"
                  required
                  className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                />
              </label>

              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Módulo substituto no Coytech Studio
                <input
                  value={sheetModule}
                  onChange={(e) => setSheetModule(e.target.value)}
                  required
                  className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                />
              </label>

              <button
                type="submit"
                className="h-[46px] bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-full px-[18px] text-[13px] font-semibold flex items-center justify-between cursor-pointer transition-colors mt-[4px]"
              >
                <span>Cadastrar planilha</span>
                <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </form>
          </aside>
        </div>
      )}

      {/* MODAL DE NOVA SOLICITAÇÃO NA FILA */}
      {showNewQueueModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-[18px]">
          <form
            onSubmit={handleCreateQueue}
            className="w-full max-w-[460px] bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] p-[24px] flex flex-col gap-[14px]"
          >
            <div className="flex items-center justify-between">
              <div className="text-[20px] font-semibold tracking-[-0.4px]">
                Nova solicitação na fila 1-clique
              </div>
              <button
                type="button"
                onClick={() => setShowNewQueueModal(false)}
                className="w-[32px] h-[32px] rounded-full bg-[var(--bg)] grid place-items-center text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
              Tipo de fila operacional
              <select
                value={newQueueType}
                onChange={(e) => setNewQueueType(e.target.value as QueueType)}
                className="h-[46px] px-[12px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
              >
                <option value="PURCHASE_ORDER">Pedido de compra / venda ERP</option>
                <option value="FINANCIAL_RELEASE">Liberação financeira</option>
                <option value="DISCOUNT_EXCEPTION">Exceção de desconto (Agente 02)</option>
                <option value="KYC_ONBOARDING">Cadastro & análise de crédito B2B</option>
              </select>
            </label>

            <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
              Título da solicitação
              <input
                value={newQueueTitle}
                onChange={(e) => setNewQueueTitle(e.target.value)}
                placeholder="Ex: Liberação de pedido atacado · Cliente Sul"
                required
                className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
              />
            </label>

            <div className="grid grid-cols-2 gap-[10px]">
              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Valor (R$)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newQueueAmount}
                  onChange={(e) => setNewQueueAmount(e.target.value)}
                  placeholder="12500"
                  required
                  className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                />
              </label>

              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Prazo SLA (minutos)
                <input
                  type="number"
                  min="5"
                  value={newQueueSla}
                  onChange={(e) => setNewQueueSla(e.target.value)}
                  required
                  className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-[10px]">
              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Código ERP (opcional)
                <input
                  value={newQueueRef}
                  onChange={(e) => setNewQueueRef(e.target.value)}
                  placeholder="#ERP-9042"
                  className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                />
              </label>

              <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
                Solicitante
                <input
                  value={newQueueRequester}
                  onChange={(e) => setNewQueueRequester(e.target.value)}
                  placeholder={actorDisplay}
                  className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
                />
              </label>
            </div>

            <label className="flex flex-col gap-[6px] text-[12px] text-[var(--ds-muted)]">
              Contexto / justificativa
              <input
                value={newQueueNotes}
                onChange={(e) => setNewQueueNotes(e.target.value)}
                placeholder="Ex: Margem preservada em 26% · Pagamento via Pix"
                className="h-[46px] px-[14px] bg-[var(--bg)] border-[1.5px] border-[var(--line2)] focus:border-[#0066FF] rounded-[12px] text-[13px] text-[var(--fg)] outline-none"
              />
            </label>

            <button
              type="submit"
              className="h-[48px] bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-full px-[18px] text-[13.5px] font-semibold flex items-center justify-between cursor-pointer transition-colors mt-[4px]"
            >
              <span>Inserir na fila ao vivo</span>
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
