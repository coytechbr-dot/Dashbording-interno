'use client'

import React, { useState, useMemo } from 'react'
import {
  FileText,
  X,
  Copy,
  Check,
  Printer,
  Sparkles,
  Calculator,
  Shield,
  Layers,
  Clock,
  ArrowRight
} from 'lucide-react'
import type { ClientAccount } from '@/types/coydash'

interface ProposalGeneratorDialogProps {
  open: boolean
  onClose: () => void
  clients: ClientAccount[]
  initialClient?: ClientAccount | null
}

export function ProposalGeneratorDialog({
  open,
  onClose,
  clients,
  initialClient
}: ProposalGeneratorDialogProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClient?.id || '')
  const [customClientName, setCustomClientName] = useState('')
  const [clientSegment, setClientSegment] = useState('Energia Solar')

  // Modalidade de Contratação (Tópico 5 e 9)
  const [contractModel, setContractModel] = useState<'MODELO' | 'PERSONALIZADO'>('MODELO')

  // Se Sistema Modelo:
  const [selectedModules, setSelectedModules] = useState<string[]>([
    'Comercial (CRM & Leads)',
    'Operacional (Tarefas & Kanban)'
  ])
  const [modelSetupFee, setModelSetupFee] = useState<number>(2500)
  const [modelMonthlyLicense, setModelMonthlyLicense] = useState<number>(499)

  // Se Sistema Personalizado:
  const [customComplexity, setCustomComplexity] = useState<'SIMPLES' | 'INTERMEDIARIO' | 'AVANCADO' | 'ENTERPRISE'>('INTERMEDIARIO')
  const [customProjectValue, setCustomProjectValue] = useState<number>(35000)

  // Adaptações / Customizações (Tópico 9.3)
  const [hasAdaptation, setHasAdaptation] = useState<boolean>(true)
  const [adaptationLevel, setAdaptationLevel] = useState<'SIMPLES' | 'INTERMEDIARIA' | 'AVANCADA'>('SIMPLES')
  const [adaptationValue, setAdaptationValue] = useState<number>(1200)

  // Implementação & Migração (Tópico 9.1 / 9.5)
  const [implementationValue, setImplementationValue] = useState<number>(2500)

  // Treinamento das Equipes (Tópico 6 - Etapa 5 / 9.5)
  const [trainingValue, setTrainingValue] = useState<number>(800)

  // Infraestrutura & APIs (Tópico 11.2 / 9.5)
  const [infraMonthlyValue, setInfraMonthlyValue] = useState<number>(450)

  // Manutenção e Suporte Recorrente (Tópico 9.4)
  const [supportPlan, setSupportPlan] = useState<'BASICO' | 'PROFISSIONAL' | 'AVANCADO' | 'ENTERPRISE'>('PROFISSIONAL')
  const [supportMonthlyValue, setSupportMonthlyValue] = useState<number>(1000)

  // Prazos e Validade
  const [deliveryWeeks, setDeliveryWeeks] = useState<number>(4)
  const [proposalValidityDays, setProposalValidityDays] = useState<number>(15)

  const [copied, setCopied] = useState(false)

  // Atualiza valores automáticos ao mudar opções
  const handleModelChange = (model: 'MODELO' | 'PERSONALIZADO') => {
    setContractModel(model)
    if (model === 'MODELO') {
      setModelSetupFee(2500)
      setModelMonthlyLicense(499)
      setImplementationValue(2000)
      setDeliveryWeeks(3)
    } else {
      setCustomProjectValue(35000)
      setImplementationValue(5000)
      setDeliveryWeeks(8)
    }
  }

  const handleComplexityChange = (comp: 'SIMPLES' | 'INTERMEDIARIO' | 'AVANCADO' | 'ENTERPRISE') => {
    setCustomComplexity(comp)
    const map = {
      SIMPLES: 20000,
      INTERMEDIARIO: 35000,
      AVANCADO: 50000,
      ENTERPRISE: 95000
    }
    setCustomProjectValue(map[comp])
  }

  const handleSupportPlanChange = (plan: 'BASICO' | 'PROFISSIONAL' | 'AVANCADO' | 'ENTERPRISE') => {
    setSupportPlan(plan)
    const map = {
      BASICO: 500,
      PROFISSIONAL: 1000,
      AVANCADO: 2500,
      ENTERPRISE: 4500
    }
    setSupportMonthlyValue(map[plan])
  }

  // Nome do cliente
  const clientObj = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId)
  }, [clients, selectedClientId])

  const targetClientName = clientObj?.name || customClientName.trim() || 'Cliente Parceiro'

  // Cálculos consolidados (Regra 9.5)
  // 1. Criação
  const creationValue = contractModel === 'MODELO' ? modelSetupFee : customProjectValue
  // 2. Adaptação
  const effectiveAdaptation = hasAdaptation ? adaptationValue : 0
  // 3. Implementação
  const effectiveImplementation = implementationValue
  // 4. Treinamento
  const effectiveTraining = trainingValue
  // Total de Investimento Inicial (Setup / Projeto)
  const totalOneTime = creationValue + effectiveAdaptation + effectiveImplementation + effectiveTraining

  // Recorrência Mensal
  // 5. Infraestrutura e licenças
  const effectiveLicenseOrInfra = (contractModel === 'MODELO' ? modelMonthlyLicense : 0) + infraMonthlyValue
  // 6. Manutenção e suporte
  const effectiveSupport = supportMonthlyValue
  // Total Recorrência Mensal
  const totalMonthly = effectiveLicenseOrInfra + effectiveSupport

  // Geração do texto oficial da proposta
  const generatedProposalText = useMemo(() => {
    const today = new Date().toLocaleDateString('pt-BR')
    const validUntil = new Date(Date.now() + proposalValidityDays * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')

    return `====================================================================
PROPOSTA TÉCNICA E COMERCIAL — COYTECH
Sistemas Inteligentes & Automações Empresariais
Data: ${today} | Validade da Proposta: ${validUntil} (${proposalValidityDays} dias)
====================================================================

CLIENTE: ${targetClientName}
SEGMENTO: ${clientObj?.sector || clientSegment}
MODALIDADE: ${contractModel === 'MODELO' ? 'Sistema Modelo Padronizado & Modular' : 'Desenvolvimento de Sistema Personalizado'}
PRAZO ESTIMADO DE ENTREGA: ${deliveryWeeks} semanas

--------------------------------------------------------------------
1. ESCOPO DO PROJETO & ENTREGAS
--------------------------------------------------------------------
${contractModel === 'MODELO'
  ? `Módulos Selecionados do Sistema Modelo:\n${selectedModules.map(m => ` • ${m}`).join('\n')}\n • Metodologia Operacional Coytech de 7 Etapas inclusa.`
  : `Desenvolvimento Exclusivo (Complexidade: ${customComplexity}):\n • Arquitetura de software sob medida com APIs proprietárias.\n • Banco de dados PostgreSQL isolado e painéis específicos.\n • Integração completa com Agentes de IA e automações n8n.`}

--------------------------------------------------------------------
2. DISCRIMINAÇÃO DE INVESTIMENTO (CONFORME REGRA 9.5 DO PLANO DE NEGÓCIO)
--------------------------------------------------------------------
[ INVESTIMENTO PONTUAL — IMPLANTAÇÃO ]
1. Criação do Sistema: .............. R$ ${creationValue.toLocaleString('pt-BR')},00
2. Adaptações & Customizações: ...... R$ ${effectiveAdaptation.toLocaleString('pt-BR')},00
3. Implementação & Migração de Dados: R$ ${effectiveImplementation.toLocaleString('pt-BR')},00
4. Treinamento das Equipes: ......... R$ ${effectiveTraining.toLocaleString('pt-BR')},00
--------------------------------------------------------------------
TOTAL DO INVESTIMENTO INICIAL: ...... R$ ${totalOneTime.toLocaleString('pt-BR')},00

[ CUSTO OPERACIONAL RECORRENTE — MENSALIDADE ]
5. Infraestrutura, Licenças & APIs: . R$ ${effectiveLicenseOrInfra.toLocaleString('pt-BR')},00 / mês
6. Manutenção & Monitoramento Ativo:. R$ ${effectiveSupport.toLocaleString('pt-BR')},00 / mês (Plano ${supportPlan})
--------------------------------------------------------------------
TOTAL RECORRENTE MENSAL: ............ R$ ${totalMonthly.toLocaleString('pt-BR')},00 / mês

--------------------------------------------------------------------
3. CONDIÇÕES GERAIS E METODOLOGIA
--------------------------------------------------------------------
• O projeto segue o ciclo de 7 Etapas da Coytech: Diagnóstico, Planejamento, Criação, Implementação, Treinamento, Monitoramento e Otimização.
• Suporte ativo com monitoramento de disponibilidade, retentativa automática de fluxos e atendimento com SLA prioritário.
• Conformidade plena com a LGPD e garantia de sigilo de dados (NDA e DPA).

COYTECH TECNOLOGIA DA INFORMAÇÃO
"Desenvolvemos e implementamos sistemas inteligentes que se adaptam à sua empresa."
====================================================================`
  }, [
    targetClientName,
    clientObj,
    clientSegment,
    contractModel,
    deliveryWeeks,
    proposalValidityDays,
    selectedModules,
    customComplexity,
    creationValue,
    effectiveAdaptation,
    effectiveImplementation,
    effectiveTraining,
    totalOneTime,
    effectiveLicenseOrInfra,
    effectiveSupport,
    supportPlan,
    totalMonthly
  ])

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedProposalText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Proposta Comercial - Coytech - ${targetClientName}</title>
            <style>
              body { font-family: monospace; white-space: pre-wrap; padding: 30px; font-size: 13px; line-height: 1.4; color: #111; }
            </style>
          </head>
          <body>${generatedProposalText}</body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[var(--surface)] border border-[var(--line2)] w-full max-w-4xl rounded-[20px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-[var(--line2)] flex items-center justify-between bg-[var(--bg)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0066FF]/15 border border-[#0066FF]/30 grid place-items-center text-[#0066FF]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-bold">Gerador de Propostas Comerciais</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0066FF]/15 text-[#0066FF] border border-[#0066FF]/30">
                  Regra 9.5 Oficial
                </span>
              </div>
              <p className="text-[12px] text-[var(--ds-muted)]">
                Discriminação automática de custos: Criação, Adaptação, Implementação, Treinamento, Infra e Suporte.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--surface)] hover:bg-[var(--ds-hover)] grid place-items-center text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTENT (2 COLUNAS) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUNA ESQUERDA: PARÂMETROS COMERCIAIS */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Destinatário */}
            <div className="bg-[var(--bg)] p-4 rounded-xl border border-[var(--line2)] flex flex-col gap-3">
              <label className="text-[12px] font-semibold text-[var(--fg)] flex items-center gap-2">
                <span>Cliente / Destinatário da Proposta</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--line2)] text-[12.5px] outline-none"
                >
                  <option value="">Selecionar cliente cadastrado...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.sector})
                    </option>
                  ))}
                </select>

                {!selectedClientId && (
                  <input
                    type="text"
                    placeholder="Ou digite o nome do prospect..."
                    value={customClientName}
                    onChange={(e) => setCustomClientName(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--line2)] text-[12.5px] outline-none"
                  />
                )}
              </div>

              <div className="flex items-center gap-3 text-[11.5px] text-[var(--ds-muted)]">
                <span>Segmento foco:</span>
                {['Energia Solar', 'Mercado Imobiliário', 'Serviços B2B'].map((seg) => (
                  <button
                    key={seg}
                    type="button"
                    onClick={() => setClientSegment(seg)}
                    className={`px-2 py-0.5 rounded text-[11px] cursor-pointer transition-colors ${
                      clientSegment === seg
                        ? 'bg-[#0066FF] text-white font-semibold'
                        : 'bg-[var(--surface)] hover:text-[var(--fg)]'
                    }`}
                  >
                    {seg}
                  </button>
                ))}
              </div>
            </div>

            {/* Modalidade de Contrato */}
            <div className="bg-[var(--bg)] p-4 rounded-xl border border-[var(--line2)] flex flex-col gap-3">
              <div className="text-[12px] font-semibold flex items-center justify-between">
                <span>Modalidade de Desenvolvimento</span>
                <span className="text-[11px] text-[#0066FF] font-normal">Tópico 5 do Plano de Negócio</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleModelChange('MODELO')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    contractModel === 'MODELO'
                      ? 'bg-[#0066FF]/10 border-[#0066FF] text-[var(--fg)]'
                      : 'bg-[var(--surface)] border-[var(--line2)] text-[var(--ds-muted)] hover:text-[var(--fg)]'
                  }`}
                >
                  <div className="text-[12.5px] font-bold">Sistema Modelo</div>
                  <div className="text-[11px] mt-0.5 leading-tight">Solução padronizada e modular com menor tempo de entrega.</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleModelChange('PERSONALIZADO')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    contractModel === 'PERSONALIZADO'
                      ? 'bg-[#0066FF]/10 border-[#0066FF] text-[var(--fg)]'
                      : 'bg-[var(--surface)] border-[var(--line2)] text-[var(--ds-muted)] hover:text-[var(--fg)]'
                  }`}
                >
                  <div className="text-[12.5px] font-bold">Sistema Personalizado</div>
                  <div className="text-[11px] mt-0.5 leading-tight">Desenvolvimento exclusivo sob medida para a regra do cliente.</div>
                </button>
              </div>

              {contractModel === 'MODELO' ? (
                <div className="pt-2 flex flex-col gap-2">
                  <span className="text-[11px] text-[var(--ds-muted)]">Módulos inclusos no pacote:</span>
                  <div className="grid grid-cols-2 gap-1.5 text-[11.5px]">
                    {[
                      'Comercial (CRM & Leads)',
                      'Operacional (Tarefas & Kanban)',
                      'Financeiro (Contas & DRE)',
                      'Gestão & Painel C-Level',
                      'Atendimento WhatsApp IA'
                    ].map((mod) => (
                      <label key={mod} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedModules.includes(mod)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedModules([...selectedModules, mod])
                            else setSelectedModules(selectedModules.filter((m) => m !== mod))
                          }}
                          className="accent-[#0066FF]"
                        />
                        <span>{mod}</span>
                      </label>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <span className="text-[11px] text-[var(--ds-muted)]">Setup Inicial (R$):</span>
                      <input
                        type="number"
                        value={modelSetupFee}
                        onChange={(e) => setModelSetupFee(Number(e.target.value) || 0)}
                        className="w-full h-8 px-2 mt-1 rounded bg-[var(--surface)] border border-[var(--line2)] text-[12px]"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-[var(--ds-muted)]">Licença Mensal (R$/mês):</span>
                      <input
                        type="number"
                        value={modelMonthlyLicense}
                        onChange={(e) => setModelMonthlyLicense(Number(e.target.value) || 0)}
                        className="w-full h-8 px-2 mt-1 rounded bg-[var(--surface)] border border-[var(--line2)] text-[12px]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-2 flex flex-col gap-2">
                  <span className="text-[11px] text-[var(--ds-muted)]">Faixa de Complexidade (Tópico 9.2):</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['SIMPLES', 'INTERMEDIARIO', 'AVANCADO', 'ENTERPRISE'] as const).map((comp) => (
                      <button
                        key={comp}
                        type="button"
                        onClick={() => handleComplexityChange(comp)}
                        className={`py-1.5 rounded text-[10.5px] font-medium border cursor-pointer ${
                          customComplexity === comp
                            ? 'bg-[#0066FF] text-white font-semibold border-[#0066FF]'
                            : 'bg-[var(--surface)] border-[var(--line2)] text-[var(--ds-muted)]'
                        }`}
                      >
                        {comp}
                      </button>
                    ))}
                  </div>
                  <div>
                    <span className="text-[11px] text-[var(--ds-muted)]">Investimento de Desenvolvimento (R$):</span>
                    <input
                      type="number"
                      value={customProjectValue}
                      onChange={(e) => setCustomProjectValue(Number(e.target.value) || 0)}
                      className="w-full h-8 px-2 mt-1 rounded bg-[var(--surface)] border border-[var(--line2)] text-[12px]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Adaptações, Implantação e Treinamento */}
            <div className="bg-[var(--bg)] p-4 rounded-xl border border-[var(--line2)] flex flex-col gap-3">
              <span className="text-[12px] font-semibold">Serviços Obrigatórios de Implantação</span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10.5px] text-[var(--ds-muted)]">Adaptações (R$):</span>
                  <input
                    type="number"
                    value={hasAdaptation ? adaptationValue : 0}
                    onChange={(e) => {
                      setHasAdaptation(true)
                      setAdaptationValue(Number(e.target.value) || 0)
                    }}
                    className="w-full h-8 px-2 mt-1 rounded bg-[var(--surface)] border border-[var(--line2)] text-[12px]"
                  />
                </div>
                <div>
                  <span className="text-[10.5px] text-[var(--ds-muted)]">Implementação (R$):</span>
                  <input
                    type="number"
                    value={implementationValue}
                    onChange={(e) => setImplementationValue(Number(e.target.value) || 0)}
                    className="w-full h-8 px-2 mt-1 rounded bg-[var(--surface)] border border-[var(--line2)] text-[12px]"
                  />
                </div>
                <div>
                  <span className="text-[10.5px] text-[var(--ds-muted)]">Treinamento (R$):</span>
                  <input
                    type="number"
                    value={trainingValue}
                    onChange={(e) => setTrainingValue(Number(e.target.value) || 0)}
                    className="w-full h-8 px-2 mt-1 rounded bg-[var(--surface)] border border-[var(--line2)] text-[12px]"
                  />
                </div>
              </div>
            </div>

            {/* Suporte Recorrente & Sustentação */}
            <div className="bg-[var(--bg)] p-4 rounded-xl border border-[var(--line2)] flex flex-col gap-3">
              <div className="text-[12px] font-semibold flex items-center justify-between">
                <span>Plano Recorrente de Suporte & Monitoramento</span>
                <span className="text-[11px] text-[#2f9e5a] font-medium">Motor de MRR (Tópico 9.4)</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(['BASICO', 'PROFISSIONAL', 'AVANCADO', 'ENTERPRISE'] as const).map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => handleSupportPlanChange(plan)}
                    className={`py-1.5 rounded text-[10.5px] font-medium border cursor-pointer ${
                      supportPlan === plan
                        ? 'bg-[#2f9e5a] text-black font-semibold border-[#2f9e5a]'
                        : 'bg-[var(--surface)] border-[var(--line2)] text-[var(--ds-muted)]'
                    }`}
                  >
                    {plan}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10.5px] text-[var(--ds-muted)]">Suporte Mensal (R$/mês):</span>
                  <input
                    type="number"
                    value={supportMonthlyValue}
                    onChange={(e) => setSupportMonthlyValue(Number(e.target.value) || 0)}
                    className="w-full h-8 px-2 mt-1 rounded bg-[var(--surface)] border border-[var(--line2)] text-[12px]"
                  />
                </div>
                <div>
                  <span className="text-[10.5px] text-[var(--ds-muted)]">Infra & APIs (R$/mês):</span>
                  <input
                    type="number"
                    value={infraMonthlyValue}
                    onChange={(e) => setInfraMonthlyValue(Number(e.target.value) || 0)}
                    className="w-full h-8 px-2 mt-1 rounded bg-[var(--surface)] border border-[var(--line2)] text-[12px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: PREVIEW OFICIAL DISCRIMINADO */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[var(--fg)] flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-[#0066FF]" />
                Preview Oficial da Proposta (Regra 9.5)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[11.5px] font-medium flex items-center gap-1.5 cursor-pointer text-[var(--fg)]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#2f9e5a]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-2.5 py-1 rounded-lg bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] text-[11.5px] font-medium flex items-center gap-1.5 cursor-pointer text-[var(--fg)]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF</span>
                </button>
              </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
                <div className="text-[11px] text-[var(--ds-muted)] uppercase tracking-wider">Investimento Inicial</div>
                <div className="text-[20px] font-bold text-[#0066FF] mt-0.5">
                  R$ {totalOneTime.toLocaleString('pt-BR')}
                </div>
                <div className="text-[10px] text-[var(--ds-muted)] mt-1">Criação + Setup + Implantação</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
                <div className="text-[11px] text-[var(--ds-muted)] uppercase tracking-wider">Recorrência Mensal (MRR)</div>
                <div className="text-[20px] font-bold text-[#2f9e5a] mt-0.5">
                  R$ {totalMonthly.toLocaleString('pt-BR')} <span className="text-[12px] font-normal text-[var(--ds-muted)]">/mês</span>
                </div>
                <div className="text-[10px] text-[var(--ds-muted)] mt-1">Suporte + Monitoramento + Infra</div>
              </div>
            </div>

            {/* Terminal Previsualizador */}
            <div className="flex-1 min-h-[300px] p-4 rounded-xl bg-black/60 border border-[var(--line2)] font-mono text-[11.5px] text-[var(--fg)]/90 leading-relaxed overflow-y-auto whitespace-pre-wrap select-all">
              {generatedProposalText}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 border-t border-[var(--line2)] bg-[var(--bg)] flex items-center justify-between text-[12px]">
          <span className="text-[var(--ds-muted)]">
            Coytech Dashboard · Motor de Propostas em Conformidade com o Plano de Negócio
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--ds-hover)] border border-[var(--line2)] font-medium text-[var(--fg)] cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

