'use client'

import React, { useState, useEffect } from 'react'
import { ArrowUpRight, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'
import type { LifecycleStage } from '@/types/coydash'

const STAGES: {
  id: LifecycleStage
  num: string
  title: string
  when: string
  pilar: string
  goal: string
}[] = [
  {
    id: 'STAGE_1_ONBOARDING',
    num: '01',
    title: 'Onboarding em 5 min',
    when: 'Dias 0 a 3',
    pilar: 'Preparação Flow',
    goal: 'Pastas Drive e grupo WhatsApp criados no automático, senhas no Vault testadas e Kick-off realizado.',
  },
  {
    id: 'STAGE_2_PLANNING_BIA',
    num: '02',
    title: 'Planejamento & BIA',
    when: 'Semana 1 (Dias 1 a 5)',
    pilar: 'Studio & Pulse',
    goal: 'Impacto financeiro mapeado (R$/hora), telas/fluxos desenhados e regra 80/20 aplicada.',
  },
  {
    id: 'STAGE_3_PRESENTATION',
    num: '03',
    title: 'Apresentação (Sem. 1 e 3)',
    when: 'Fim Sem. 1 e Fim Sem. 3',
    pilar: 'Validação Criação',
    goal: 'Roteiro de 4 passos: aprovação do plano na Semana 1 e aprovação do sistema ao vivo na Semana 3.',
  },
  {
    id: 'STAGE_4_GO_LIVE',
    num: '04',
    title: 'Entrega & Go-Live',
    when: 'Semana 4 (Dias 22 a 30)',
    pilar: 'Implementação',
    goal: 'Sequência segura Passo A (Pulse) -> Passo B (Studio/Flow) -> Passo C (Travar planilhas + Vídeos 3 min).',
  },
  {
    id: 'STAGE_5_LTV_RECURRING',
    num: '05',
    title: 'Suporte & LTV (MRR)',
    when: 'Mês 2 em diante',
    pilar: 'Monitoramento 24/7',
    goal: 'SLA 15 min P1, Relatório toda segunda às 08h no WhatsApp e reunião trimestral QBR a cada 90 dias.',
  },
  {
    id: 'STAGE_6_OFFBOARDING',
    num: '06',
    title: 'Offboarding Seguro',
    when: 'Ciclo de 15 dias',
    pilar: 'Retenção ou Entrega',
    goal: 'Oferta de Plano Passivo (Dias 1-3) ou entrega Git/DB/n8n/Zabbix + revogação LiteLLM/LGPD (Dias 4-15).',
  },
]

export default function GovernancaPage() {
  const {
    currentOrg,
    credentials,
    addCredential,
    validateAllPreKickoffCredentials,
    deleteCredential,
    triggerOnboarding5MinAutomation,
    goliveSteps,
    executeGoLiveStep,
    offboarding,
    executeOffboardingAction,
    updateOrganizationStage,
  } = useCoyDash()

  const [selectedStage, setSelectedStage] = useState<LifecycleStage>(currentOrg.current_stage)
  const [onboardingFeedback, setOnboardingFeedback] = useState(false)

  // Modal / form de Nova Credencial no Vault
  const [showNewCredForm, setShowNewCredForm] = useState(false)
  const [credServiceName, setCredServiceName] = useState('')
  const [credPilar, setCredPilar] = useState<'STUDIO' | 'FLOW' | 'PULSE'>('STUDIO')
  const [credEndpoint, setCredEndpoint] = useState('')
  const [isSavingCred, setIsSavingCred] = useState(false)

  useEffect(() => {
    setSelectedStage(currentOrg.current_stage)
  }, [currentOrg.current_stage])

  async function handleAddCredential(e: React.FormEvent) {
    e.preventDefault()
    if (!credServiceName.trim() || !credEndpoint.trim()) return
    setIsSavingCred(true)
    await addCredential({
      service_name: credServiceName.trim(),
      pilar: credPilar,
      endpoint_or_host: credEndpoint.trim(),
    })
    setCredServiceName('')
    setCredEndpoint('')
    setShowNewCredForm(false)
    setIsSavingCred(false)
  }

  const activeStageMeta = STAGES.find((s) => s.id === selectedStage) || STAGES[0]

  return (
    <div className="px-[26px] pb-[40px] flex flex-col gap-[24px]">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-[16px] pt-[6px]">
        <div>
          <div className="text-[12px] text-[#0066FF] font-semibold">
            Console Interno de Engenharia · Ciclo de Vida B2B
          </div>
          <h1 className="text-[28px] font-semibold tracking-[-0.8px] mt-[2px]">
            Jornada operacional de 6 etapas · Sprint 30 dias &amp; LTV
          </h1>
          <p className="text-[13px] text-[var(--ds-muted)] mt-[4px]">
            Cliente ativo: <strong className="text-[var(--fg)]">{currentOrg.name}</strong> · MRR R${' '}
            {currentOrg.monthly_mrr_value.toLocaleString('pt-BR')} · Próxima QBR 90d:{' '}
            {currentOrg.next_qbr_date}
          </p>
        </div>

        {/* Barras de Etapas 22x4px (Exato do DESIGN.md Seção 6) */}
        <div className="flex items-center gap-[6px]">
          {STAGES.map((st) => {
            const active = selectedStage === st.id
            return (
              <button
                key={st.id}
                onClick={() => setSelectedStage(st.id)}
                title={st.title}
                className={`h-[4px] w-[26px] rounded-[4px] transition-colors cursor-pointer ${
                  active ? 'bg-[#0066FF]' : 'bg-[var(--line2)]'
                }`}
              />
            )
          })}
        </div>
      </div>

      {/* Seletor das 6 Etapas em Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-[10px] border-t border-[var(--line)] pt-[22px]">
        {STAGES.map((st) => {
          const isSelected = selectedStage === st.id
          const isCurrentOrgStage = currentOrg.current_stage === st.id
          return (
            <button
              key={st.id}
              onClick={() => setSelectedStage(st.id)}
              className={`rounded-[12px] p-[14px] text-left flex flex-col gap-[6px] border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[var(--surface)] border-[#0066FF]'
                  : 'bg-[var(--surface)] border-[var(--line)] hover:border-[var(--line2)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#0066FF]">{st.num}</span>
                {isCurrentOrgStage && (
                  <span className="flex items-center gap-[4px] bg-[var(--bg)] border border-[var(--line2)] rounded-[6px] px-[6px] py-[2px] text-[10.5px]">
                    <span className="w-[5px] h-[5px] rounded-full bg-[#2f9e5a]"></span>
                    Etapa atual
                  </span>
                )}
              </div>
              <div className="text-[14px] font-medium leading-[1.2]">{st.title}</div>
              <div className="text-[11px] text-[var(--ds-muted)]">{st.when}</div>
            </button>
          )
        })}
      </div>

      {/* Barra de Status da Etapa Selecionada + Ação de Definir como Etapa Oficial */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[16px] flex flex-col sm:flex-row sm:items-center justify-between gap-[12px]">
        <div>
          <div className="text-[11.5px] text-[#0066FF] font-semibold">
            Etapa {activeStageMeta.num} · {activeStageMeta.pilar} ({activeStageMeta.when})
          </div>
          <div className="text-[14px] font-medium mt-[2px]">{activeStageMeta.goal}</div>
        </div>
        {currentOrg.current_stage !== selectedStage ? (
          <button
            onClick={() => updateOrganizationStage(selectedStage)}
            className="h-[38px] px-[16px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white text-[12px] font-semibold shrink-0 cursor-pointer transition-colors"
          >
            Definir como etapa atual da organização
          </button>
        ) : (
          <span className="inline-flex items-center gap-[6px] h-[36px] px-[14px] rounded-full bg-[var(--bg)] border border-[var(--line2)] text-[12px] text-[var(--ds-muted)] shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2f9e5a]" />
            Etapa ativa no banco de dados
          </span>
        )}
      </div>

      {/* DETALHE INTERATIVO DA ETAPA SELECIONADA */}
      {selectedStage === 'STAGE_1_ONBOARDING' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-[24px]">
          <div className="flex flex-col gap-[14px]">
            <div className="flex flex-wrap items-center justify-between gap-[12px]">
              <div>
                <div className="text-[18px]">
                  Validador pré-Kickoff de credenciais e APIs (Dias 1 e 2)
                </div>
                <div className="text-[12px] text-[var(--ds-muted)]">
                  Regra obrigatória: testar todas as chaves no Supabase Vault antes da reunião do Dia 3.
                </div>
              </div>

              <div className="flex items-center gap-[8px]">
                <button
                  onClick={() => setShowNewCredForm((v) => !v)}
                  className="h-[38px] px-[14px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white text-[12px] font-semibold flex items-center gap-[6px] cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                  <span>Nova credencial</span>
                </button>
                {credentials.length > 0 && (
                  <button
                    onClick={validateAllPreKickoffCredentials}
                    className="h-[38px] px-[16px] rounded-full bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[12px] font-medium cursor-pointer transition-colors"
                  >
                    Revalidar conexões
                  </button>
                )}
              </div>
            </div>

            {showNewCredForm && (
              <form
                onSubmit={handleAddCredential}
                className="bg-[var(--surface)] border border-[#0066FF] rounded-[14px] p-[16px] flex flex-col gap-[12px]"
              >
                <div className="text-[14px] font-medium">
                  Cadastrar credencial ou endpoint para validação pré-Kickoff
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-[10px]">
                  <input
                    type="text"
                    required
                    value={credServiceName}
                    onChange={(e) => setCredServiceName(e.target.value)}
                    placeholder="Ex: API ERP Omie / SEFAZ NFe"
                    className="h-[40px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] outline-none focus:border-[#0066FF]"
                  />
                  <select
                    value={credPilar}
                    onChange={(e) => setCredPilar(e.target.value as 'STUDIO' | 'FLOW' | 'PULSE')}
                    className="h-[40px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] outline-none focus:border-[#0066FF]"
                  >
                    <option value="STUDIO">Pilar STUDIO (ERP / Banco)</option>
                    <option value="FLOW">Pilar FLOW (WhatsApp / LiteLLM)</option>
                    <option value="PULSE">Pilar PULSE (Zabbix / SEFAZ)</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={credEndpoint}
                    onChange={(e) => setCredEndpoint(e.target.value)}
                    placeholder="Host/URL (ex: api.omie.com.br)"
                    className="h-[40px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] outline-none focus:border-[#0066FF]"
                  />
                </div>
                <div className="flex justify-end gap-[8px]">
                  <button
                    type="button"
                    onClick={() => setShowNewCredForm(false)}
                    className="h-[36px] px-[14px] rounded-full border border-[var(--line2)] text-[12px] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingCred}
                    className="h-[36px] px-[16px] rounded-full bg-[#0066FF] text-white text-[12px] font-semibold cursor-pointer"
                  >
                    {isSavingCred ? 'Validando...' : 'Salvar e testar no Vault'}
                  </button>
                </div>
              </form>
            )}

            {credentials.length === 0 ? (
              <div className="bg-[var(--surface)] border border-dashed border-[var(--line2)] rounded-[14px] p-[28px] text-center flex flex-col items-center gap-[10px]">
                <div className="text-[15px] font-medium">
                  Nenhuma credencial cadastrada no cofre desta organização
                </div>
                <div className="text-[12.5px] text-[var(--ds-muted)] max-w-[460px]">
                  Adicione as chaves de API do ERP, WhatsApp Cloud API, gateway bancário ou certificado SEFAZ para validar a conectividade antes do Kick-off.
                </div>
                <button
                  onClick={() => setShowNewCredForm(true)}
                  className="mt-[4px] h-[38px] px-[16px] rounded-full bg-[#0066FF] text-white text-[12px] font-semibold cursor-pointer"
                >
                  + Adicionar primeira credencial
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-[10px]">
                {credentials.map((cred) => (
                  <div
                    key={cred.id}
                    className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] p-[14px] flex flex-col sm:flex-row sm:items-center justify-between gap-[10px]"
                  >
                    <div>
                      <div className="text-[11px] text-[#0066FF] font-semibold">
                        Pilar {cred.pilar}
                      </div>
                      <div className="text-[14px] font-medium">{cred.service_name}</div>
                      <div className="text-[11.5px] text-[var(--ds-muted)]">
                        Host: {cred.endpoint_or_host}
                      </div>
                    </div>
                    <div className="flex items-center gap-[10px] shrink-0">
                      <span className="text-[11px] text-[var(--ds-muted)]">
                        {cred.latency_ms} ms · {cred.last_tested_at}
                      </span>
                      <span className="flex items-center gap-[5px] bg-[var(--bg)] border border-[var(--line2)] rounded-[6px] px-[8px] py-[4px] text-[10.5px]">
                        <span className="w-[5px] h-[5px] rounded-full bg-[#2f9e5a]"></span>
                        Conectada e validada
                      </span>
                      <button
                        onClick={() => deleteCredential(cred.id)}
                        title="Remover credencial"
                        className="w-[30px] h-[30px] rounded-[8px] bg-[var(--bg)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] grid place-items-center text-[var(--ds-muted)] hover:text-[#0066FF] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[18px] flex flex-col gap-[14px]">
            <div className="text-[16px] font-medium">
              Automação de boas-vindas em 5 minutos (Dia 0)
            </div>
            <div className="text-[12px] text-[var(--ds-muted)] leading-[1.5]">
              Ao receber o webhook de contrato assinado, o n8n cria a pasta no Google Drive, monta o grupo executivo no WhatsApp e envia o link do Cofre de Senhas + agendamento do Kick-off.
            </div>
            <button
              onClick={async () => {
                await triggerOnboarding5MinAutomation()
                setOnboardingFeedback(true)
              }}
              className="h-[46px] bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-full px-[18px] text-[13px] font-semibold flex items-center justify-between cursor-pointer transition-colors"
            >
              <span>Disparar provisionamento de Onboarding</span>
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
            {(onboardingFeedback || currentOrg.google_drive_folder_url) && (
              <div className="bg-[var(--bg)] border border-[#0066FF] rounded-[10px] p-[12px] text-[12px] flex flex-col gap-[6px]">
                <div className="font-semibold text-[#0066FF]">
                  Provisionamento registrado no banco!
                </div>
                {currentOrg.google_drive_folder_url && (
                  <div className="text-[11.5px] text-[var(--ds-muted)] break-all">
                    Drive: <span className="text-[var(--fg)]">{currentOrg.google_drive_folder_url}</span>
                  </div>
                )}
                {currentOrg.whatsapp_group_jid && (
                  <div className="text-[11.5px] text-[var(--ds-muted)] break-all">
                    Grupo JID: <span className="text-[var(--fg)]">{currentOrg.whatsapp_group_jid}</span>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      )}

      {(selectedStage === 'STAGE_2_PLANNING_BIA' || selectedStage === 'STAGE_3_PRESENTATION') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[20px]">
          {/* Regra 80/20 da Sprint de 30 Dias */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[18px] flex flex-col gap-[12px]">
            <div className="text-[18px]">Divisão de escopo · Regra 80/20 (Dia 4)</div>
            <div className="text-[12px] text-[var(--ds-muted)]">
              Tudo o que gera retorno imediato entra nas Semanas 2 e 3; pedidos secundários vão para o backlog evolutivo do Mês 2+.
            </div>

            <div className="flex flex-col gap-[8px] pt-[6px]">
              <div className="text-[12px] font-semibold text-[#0066FF]">
                Entregas críticas 80/20 (Semanas 2 e 3 — Setup 30 dias):
              </div>
              <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[10px] p-[10px] text-[12.5px]">
                · Portal Studio com Fila de Aprovação em 1 Clique (&lt; 3s) integrado ao ERP
                <br />· Conciliação financeira Pix/Cartão + Lote NFe com contingência SEFAZ
                <br />· Monitoramento 4 camadas + Painel Executivo no celular do CEO
              </div>

              <div className="text-[12px] font-semibold text-[var(--ds-muted)] mt-[6px]">
                Backlog evolutivo mensal (Mês 2 em diante — MRR):
              </div>
              <div className="bg-[var(--bg)] border border-[var(--line)] rounded-[10px] p-[10px] text-[12.5px] text-[var(--ds-muted)]">
                · Portal externo para transportadoras homologadas
                <br />· Agente 04 de expansão preditiva por regional
              </div>
            </div>
          </div>

          {/* Roteiro de 4 Passos das Apresentações (Semana 1 e Semana 3) */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[18px] flex flex-col gap-[12px]">
            <div className="text-[18px]">Roteiro oficial de apresentação (4 passos · 45 min)</div>
            <div className="flex flex-col gap-[8px]">
              {[
                {
                  step: 'Passo 1 (5 min)',
                  title: 'Relembrar o cenário anterior',
                  desc: 'Mostrar em 1 tela quantas planilhas paralelas, horas manuais e quedas sem alerta existiam antes.',
                },
                {
                  step: 'Passo 2 (20 min)',
                  title: 'Prática ao vivo para CEO e COO (sem código)',
                  desc: 'Clicar ao vivo na Aprovação em 1 Clique, disparar automação em 3s e abrir o painel no celular.',
                },
                {
                  step: 'Passo 3 (10 min)',
                  title: 'Segurança técnica para CTO e SRE',
                  desc: 'Mostrar Zabbix 7.0 sem alarmes falsos (>75% redução), logs n8n e orçamento LiteLLM.',
                },
                {
                  step: 'Passo 4 (10 min)',
                  title: 'Separar ajustes rápidos (48h) de ideias novas',
                  desc: 'Ajustes do escopo atual resolvidos em 48h; ideias novas agendadas para o plano mensal Mês 2.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="bg-[var(--bg)] border border-[var(--line2)] rounded-[10px] p-[10px] flex flex-col gap-[2px]"
                >
                  <div className="text-[12.5px] font-semibold">
                    <span className="text-[#0066FF]">{item.step}:</span> {item.title}
                  </div>
                  <div className="text-[11.5px] text-[var(--ds-muted)]">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedStage === 'STAGE_4_GO_LIVE' && (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[20px] flex flex-col gap-[16px]">
          <div>
            <div className="text-[18px]">
              Virada segura em produção (Sequência obrigatória Passo A &rarr; B &rarr; C)
            </div>
            <div className="text-[12px] text-[var(--ds-muted)]">
              Garante visibilidade total antes da migração e impede que a equipe volte a alimentar planilhas antigas.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
            {/* Passo A */}
            <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[12px] p-[16px] flex flex-col gap-[10px]">
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-semibold text-[#0066FF]">Passo A</span>
                <span className="flex items-center gap-[5px] text-[10.5px]">
                  <span
                    className="w-[5px] h-[5px] rounded-full"
                    style={{
                      backgroundColor: goliveSteps.stepA_pulseActive ? '#2f9e5a' : '#e8c14a',
                    }}
                  ></span>
                  {goliveSteps.stepA_pulseActive ? 'Concluído' : 'Pendente'}
                </span>
              </div>
              <div className="text-[15px] font-medium">Ligar primeiro o Coytech Pulse</div>
              <div className="text-[12px] text-[var(--ds-muted)]">
                Monitoramento 4 camadas e sondas SEFAZ/Pix ativos para enxergar toda a virada ao vivo.
              </div>
              <button
                onClick={() => executeGoLiveStep('A')}
                className="mt-auto h-[40px] px-[16px] rounded-full bg-[var(--surface)] hover:bg-[#0066FF] hover:text-white border border-[var(--line2)] text-[12.5px] font-semibold flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>
                  {goliveSteps.stepA_pulseActive ? 'Passo A ativo' : 'Ativar Passo A (Pulse)'}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>

            {/* Passo B */}
            <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[12px] p-[16px] flex flex-col gap-[10px]">
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-semibold text-[#0066FF]">Passo B</span>
                <span className="flex items-center gap-[5px] text-[10.5px]">
                  <span
                    className="w-[5px] h-[5px] rounded-full"
                    style={{
                      backgroundColor: goliveSteps.stepB_studioFlowActive ? '#2f9e5a' : '#e8c14a',
                    }}
                  ></span>
                  {goliveSteps.stepB_studioFlowActive ? 'Concluído' : 'Aguardando Passo A'}
                </span>
              </div>
              <div className="text-[15px] font-medium">Importar dados &amp; ligar Studio + Flow</div>
              <div className="text-[12px] text-[var(--ds-muted)]">
                Carga final no PostgreSQL 16 e ativação dos workflows n8n e dos 5 Agentes de IA.
              </div>
              <button
                onClick={() => executeGoLiveStep('B')}
                disabled={!goliveSteps.stepA_pulseActive}
                className="mt-auto h-[40px] px-[16px] rounded-full bg-[var(--surface)] hover:bg-[#0066FF] hover:text-white disabled:opacity-40 border border-[var(--line2)] text-[12.5px] font-semibold flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>
                  {goliveSteps.stepB_studioFlowActive
                    ? 'Passo B concluído'
                    : 'Executar Passo B (Studio + Flow)'}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>

            {/* Passo C */}
            <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[12px] p-[16px] flex flex-col gap-[10px]">
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-semibold text-[#0066FF]">Passo C</span>
                <span className="flex items-center gap-[5px] text-[10.5px]">
                  <span
                    className="w-[5px] h-[5px] rounded-full"
                    style={{
                      backgroundColor: goliveSteps.stepC_lockSheets ? '#2f9e5a' : '#e8c14a',
                    }}
                  ></span>
                  {goliveSteps.stepC_lockSheets ? 'Planilhas travadas' : 'Pronto p/ acionar'}
                </span>
              </div>
              <div className="text-[15px] font-medium">
                Travar planilhas &amp; liberar vídeos 3 min
              </div>
              <div className="text-[12px] text-[var(--ds-muted)]">
                Altera planilhas antigas para Somente Leitura e libera vídeos de 3 min (Sócios, Operação e TI).
              </div>
              <button
                onClick={() => executeGoLiveStep('C')}
                disabled={!goliveSteps.stepB_studioFlowActive}
                className="mt-auto h-[40px] px-[16px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-40 text-[#141414] text-[12.5px] font-semibold flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>
                  {goliveSteps.stepC_lockSheets
                    ? 'Passo C executado com sucesso'
                    : 'Executar Passo C de Go-Live'}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedStage === 'STAGE_5_LTV_RECURRING' && (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[20px] grid grid-cols-1 md:grid-cols-3 gap-[14px]">
          <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[12px] p-[16px] flex flex-col gap-[6px]">
            <div className="text-[12px] text-[#0066FF] font-semibold">SLAs operacionais</div>
            <div className="text-[15px] font-medium">Atendimento por prioridade BIA</div>
            <div className="text-[12px] text-[var(--ds-muted)] mt-[4px]">
              · Crítica P1 (Vendas travadas): ação em até 15 min
              <br />· Alta P2 (SEFAZ/Bancos): contingência em até 30 min
              <br />· Dúvidas e ajustes: mesmo dia útil
            </div>
          </div>
          <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[12px] p-[16px] flex flex-col gap-[6px]">
            <div className="text-[12px] text-[#0066FF] font-semibold">Toda segunda às 08:00</div>
            <div className="text-[15px] font-medium">Prova de valor semanal no WhatsApp</div>
            <div className="text-[12px] text-[var(--ds-muted)] mt-[4px]">
              Resumo automático para CEO e COO com processos automáticos, horas poupadas e falhas evitadas.
            </div>
          </div>
          <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[12px] p-[16px] flex flex-col gap-[6px]">
            <div className="text-[12px] text-[#0066FF] font-semibold">A cada 90 dias</div>
            <div className="text-[15px] font-medium">Reunião trimestral de expansão (QBR)</div>
            <div className="text-[12px] text-[var(--ds-muted)] mt-[4px]">
              Apresenta o ROI acumulado no trimestre e destrava a venda de novos módulos web ou novos Agentes de IA.
            </div>
          </div>
        </div>
      )}

      {selectedStage === 'STAGE_6_OFFBOARDING' && (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] p-[20px] flex flex-col gap-[16px]">
          <div>
            <div className="text-[18px]">
              Offboarding seguro &amp; retenção passiva (Checklist de 15 dias — US-COY-10)
            </div>
            <div className="text-[12px] text-[var(--ds-muted)]">
              Soberania total de ativos para o CTO ou retenção inteligente no Plano Enxuto Passivo.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-[12px]">
            {/* Dias 1 a 3 */}
            <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[12px] p-[14px] flex flex-col gap-[10px]">
              <div className="text-[11px] font-semibold text-[#0066FF]">Dias 1 a 3 · Retenção</div>
              <div className="text-[14px] font-medium">
                Oferta de Downsell (Plano Passivo + Backup)
              </div>
              <div className="text-[11.5px] text-[var(--ds-muted)]">
                Mantém o monitoramento passivo e backups ativos por uma mensalidade reduzida.
              </div>
              <button
                onClick={() => executeOffboardingAction('ACCEPT_PASSIVE')}
                className="mt-auto h-[38px] px-[12px] rounded-full bg-[var(--surface)] hover:bg-[#0066FF] hover:text-white border border-[var(--line2)] text-[12px] font-medium cursor-pointer transition-colors"
              >
                {offboarding.retained_on_passive_plan
                  ? 'Retido no plano passivo'
                  : 'Reter no plano enxuto'}
              </button>
            </div>

            {/* Dias 4 a 10 */}
            <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[12px] p-[14px] flex flex-col gap-[10px]">
              <div className="text-[11px] font-semibold text-[#0066FF]">Dias 4 a 10 · Ativos</div>
              <div className="text-[14px] font-medium">
                Exportação Git + DB + n8n + Zabbix
              </div>
              <div className="text-[11.5px] text-[var(--ds-muted)]">
                Gera pacote completo com código-fonte, dump criptografado, JSONs n8n e templates Grafana.
              </div>
              <button
                onClick={() => executeOffboardingAction('EXPORT_ASSETS')}
                className="mt-auto h-[38px] px-[12px] rounded-full bg-[var(--surface)] hover:bg-[#0066FF] hover:text-white border border-[var(--line2)] text-[12px] font-medium cursor-pointer transition-colors"
              >
                {offboarding.git_repo_exported ? 'Pacote exportado' : 'Gerar pacote de entrega'}
              </button>
            </div>

            {/* Dias 11 a 15 */}
            <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[12px] p-[14px] flex flex-col gap-[10px]">
              <div className="text-[11px] font-semibold text-[#0066FF]">Dias 11 a 15 · LGPD</div>
              <div className="text-[14px] font-medium">
                Kill-Switch LiteLLM &amp; limpeza Vault
              </div>
              <div className="text-[11.5px] text-[var(--ds-muted)]">
                Revoga a virtual_key do cliente no LiteLLM, desliga túnel VPN e emite log de expurgo LGPD.
              </div>
              <button
                onClick={() => executeOffboardingAction('REVOKE_KEYS_LGPD')}
                className="mt-auto h-[38px] px-[12px] rounded-full bg-[var(--surface)] hover:bg-[#0066FF] hover:text-white border border-[var(--line2)] text-[12px] font-medium cursor-pointer transition-colors"
              >
                {offboarding.litellm_key_revoked ? 'Chaves revogadas' : 'Revogar chaves e VPN'}
              </button>
            </div>

            {/* Pós-Saída 60 e 120 dias */}
            <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[12px] p-[14px] flex flex-col gap-[10px]">
              <div className="text-[11px] font-semibold text-[#0066FF]">Dia 15 · Reconexão</div>
              <div className="text-[14px] font-medium">
                Termo assinado &amp; follow-up 60/120d
              </div>
              <div className="text-[11.5px] text-[var(--ds-muted)]">
                Agenda reconexão comercial automática para {offboarding.followup_60d_date} e{' '}
                {offboarding.followup_120d_date}.
              </div>
              <button
                onClick={() => executeOffboardingAction('SIGN_TERM')}
                className="mt-auto h-[38px] px-[12px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white text-[12px] font-semibold cursor-pointer transition-colors"
              >
                {offboarding.handover_term_signed
                  ? 'Termo assinado & agendado'
                  : 'Emitir termo final'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
