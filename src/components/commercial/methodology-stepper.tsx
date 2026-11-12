'use client'

import React, { useState } from 'react'
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  FileCheck,
  Check,
  Sparkles,
  Users,
  Settings,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react'
import type { ClientAccount } from '@/types/coydash'

interface MethodologyStepperProps {
  client: ClientAccount
  onUpdateClient?: (updatedData: Partial<ClientAccount>) => void
}

const METHODOLOGY_STAGES = [
  {
    step: 1,
    name: 'Diagnóstico',
    icon: Users,
    deliverable: 'Relatório de Diagnóstico',
    description: 'Reunião de alinhamento, mapeamento de processos manuais, levantamento de departamentos e sistemas legados.',
    checklist: [
      'Reunião de diagnóstico realizada com diretores',
      'Mapeamento de gargalos e tarefas manuais',
      'Levantamento de acessos e planilhas legadas',
      'Emissão e entrega do Relatório de Diagnóstico'
    ]
  },
  {
    step: 2,
    name: 'Planejamento',
    icon: Layers,
    deliverable: 'Proposta Técnica & Comercial',
    description: 'Definição entre Sistema Modelo vs Personalizado, planejamento de integrações, estimativa de custos e prazos.',
    checklist: [
      'Definição de modelo ou escopo personalizado',
      'Mapeamento de APIs e webhooks necessários',
      'Estimativa de horas e orçamento fechado',
      'Proposta comercial assinada pelo cliente'
    ]
  },
  {
    step: 3,
    name: 'Criação & Dev',
    icon: Settings,
    deliverable: 'Sistema Desenvolvido',
    description: 'Construção ou parametrização do software, fluxos do n8n, configuração dos agentes de IA e testes técnicos de carga.',
    checklist: [
      'Estruturação de banco de dados e telas',
      'Criação de fluxos autônomos no n8n',
      'Parametrização do agente de IA e WhatsApp',
      'Testes técnicos de integração e RLS'
    ]
  },
  {
    step: 4,
    name: 'Implementação',
    icon: Sparkles,
    deliverable: 'Sistema Operacional',
    description: 'Instalação em produção, migração de dados das planilhas, configuração de usuários/permissões e homologação.',
    checklist: [
      'Setup de instâncias e conexão com WhatsApp',
      'Migração e saneamento dos dados existentes',
      'Configuração de cargos e perfis de acesso',
      'Testes práticos com usuários-chave (Go-live)'
    ]
  },
  {
    step: 5,
    name: 'Treinamento',
    icon: FileCheck,
    deliverable: 'Equipes Capacitadas',
    description: 'Capacitação prática dos operadores e gestores, entrega de manuais simplificados e padronização dos procedimentos operacionais.',
    checklist: [
      'Sessão de treinamento ao vivo gravada',
      'Orientação dos gestores sobre relatórios',
      'Disponibilização de manuais rápidos em PDF',
      'Definição formal dos responsáveis internos'
    ]
  },
  {
    step: 6,
    name: 'Monitoramento',
    icon: Activity,
    deliverable: 'Relatório de Acompanhamento & NPS',
    description: 'Vigilância da operação diária, avaliação de desempenho, identificação proativa de incidentes e pesquisa de satisfação.',
    checklist: [
      'Monitoramento de integridade e falhas silenciosas',
      'Envio do Relatório de Valor Semanal',
      'Medição de satisfação (NPS do cliente)',
      'Identificação de oportunidades de evolução'
    ]
  },
  {
    step: 7,
    name: 'Otimização',
    icon: Clock,
    deliverable: 'Plano de Melhorias Contínuas',
    description: 'Aprimoramento contínuo, desenvolvimento de novos módulos sob demanda, ajustes finos de IA e expansão de capacidade.',
    checklist: [
      'Reunião trimestral de resultados (QBR)',
      'Ajustes nos prompts e automações de IA',
      'Apresentação de novos módulos e expansão',
      'Atualização do plano de melhorias anual'
    ]
  }
]

export function MethodologyStepper({ client, onUpdateClient }: MethodologyStepperProps) {
  // Lê a etapa salva nos metadados do cliente ou inicia na Etapa 1
  const savedStage = Number(client.briefing_data?.methodology_current_step || 1)
  const [currentStep, setCurrentStep] = useState<number>(savedStage)
  const [completedSteps, setCompletedSteps] = useState<number[]>(() => {
    const list: number[] = []
    for (let i = 1; i < savedStage; i++) list.push(i)
    return list
  })

  const [activeTabStep, setActiveTabStep] = useState<number>(savedStage)

  const handleAdvanceStep = (newStep: number) => {
    setCurrentStep(newStep)
    setActiveTabStep(newStep)

    const newCompleted = Array.from(new Set([...completedSteps, currentStep]))
    setCompletedSteps(newCompleted)

    if (onUpdateClient) {
      onUpdateClient({
        briefing_data: {
          ...client.briefing_data,
          methodology_current_step: String(newStep),
          methodology_updated_at: new Date().toISOString()
        }
      })
    }
  }

  const activeStageObj = METHODOLOGY_STAGES.find((s) => s.step === activeTabStep) || METHODOLOGY_STAGES[0]

  return (
    <div className="flex flex-col gap-5 bg-[var(--surface)] p-5 rounded-[16px] border border-[var(--line2)]">
      {/* HEADER DA RÉGUA */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line2)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-bold tracking-tight">Metodologia Operacional de 7 Etapas</h3>
            <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0066FF]/15 text-[#0066FF] border border-[#0066FF]/30">
              Tópico 6 do Plano de Negócio
            </span>
          </div>
          <p className="text-[12px] text-[var(--ds-muted)] mt-0.5">
            Jornada estruturada do cliente Coytech: do diagnóstico inicial à otimização contínua.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[var(--ds-muted)]">Progresso da Implantação:</span>
          <span className="text-[13px] font-bold text-[#0066FF]">
            Etapa {currentStep} de 7 ({Math.round((currentStep / 7) * 100)}%)
          </span>
        </div>
      </div>

      {/* STEPPER HORIZONTAL VISUAL */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {METHODOLOGY_STAGES.map((st) => {
          const isCurrent = currentStep === st.step
          const isDone = completedSteps.includes(st.step) || currentStep > st.step
          const isSelected = activeTabStep === st.step

          return (
            <button
              key={st.step}
              type="button"
              onClick={() => setActiveTabStep(st.step)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#0066FF] bg-[#0066FF]/10 shadow-sm'
                  : isDone
                  ? 'border-[#2f9e5a]/40 bg-[#2f9e5a]/5 hover:border-[#2f9e5a]'
                  : 'border-[var(--line2)] bg-[var(--bg)] hover:border-[var(--ds-muted)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase text-[var(--ds-muted)]">
                  Etapa 0{st.step}
                </span>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-[#2f9e5a]" />
                ) : isCurrent ? (
                  <Clock className="w-4 h-4 text-[#0066FF] animate-pulse" />
                ) : (
                  <Circle className="w-4 h-4 text-[var(--line2)]" />
                )}
              </div>

              <div>
                <div className={`text-[12px] font-semibold truncate ${isSelected ? 'text-[#0066FF]' : 'text-[var(--fg)]'}`}>
                  {st.name}
                </div>
                <div className="text-[10px] text-[var(--ds-muted)] truncate mt-0.5">
                  {st.deliverable}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* DETALHES DA ETAPA SELECIONADA */}
      <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--line2)] flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line2)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0066FF]/15 border border-[#0066FF]/30 grid place-items-center text-[#0066FF]">
              <activeStageObj.icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[13.5px] font-bold">
                Etapa {activeStageObj.step}: {activeStageObj.name}
              </div>
              <div className="text-[11.5px] text-[var(--ds-muted)]">
                Entrega Obrigatória: <strong className="text-[var(--fg)]">{activeStageObj.deliverable}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeStageObj.step < 7 && (
              <button
                type="button"
                onClick={() => handleAdvanceStep(activeStageObj.step + 1)}
                className="h-8 px-3 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-black font-semibold text-[11.5px] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Avançar para Etapa {activeStageObj.step + 1}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <p className="text-[12.5px] text-[var(--fg)]/85 leading-relaxed">
          {activeStageObj.description}
        </p>

        {/* CHECKLIST DE ITENS DA ETAPA */}
        <div className="flex flex-col gap-2 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ds-muted)]">
            Critérios de Aceite e Entregas desta Etapa
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
            {activeStageObj.checklist.map((chk, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface)] border border-[var(--line2)]"
              >
                <div className="w-4 h-4 rounded-full bg-[#2f9e5a]/15 text-[#2f9e5a] grid place-items-center shrink-0">
                  <Check className="w-2.5 h-2.5" strokeWidth={3} />
                </div>
                <span>{chk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

