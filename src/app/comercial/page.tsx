'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd'
import {
  Briefcase,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  TrendingUp,
  DollarSign,
  Filter,
  ArrowUpRight,
  Sparkles,
  Layers,
  Building,
  Calendar,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Phone,
  UserCheck,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useCoyDash, DEFAULT_INITIAL_PIPELINE, DEFAULT_INITIAL_STAGES } from '@/lib/coydash-store'
import { DealCard } from '@/components/commercial/deal-card'
import { DealDialog } from '@/components/commercial/deal-dialog'
import { CoyDataGrid, type DataGridColumn } from '@/components/crm/coy-data-grid'
import { createCommercialProposalTaskFromLead } from '@/lib/proposal-task-helper'
import type { DealItem, PipelineItem, PipelineStageItem } from '@/types/coydash'

function formatCurrency(val?: number): string {
  if (!val || isNaN(val)) return 'R$ 0'
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export default function ComercialPage() {
  const router = useRouter()
  const {
    pipelines,
    pipelineStages,
    deals,
    updateDealStage,
    deleteDeal,
    convertDealToClient,
    createPipeline,
    refreshFromDatabase,
    currentOrg,
    taskFolders,
    taskLists,
    createTaskFolder,
    createTaskList,
    createTask,
    authenticatedUser,
  } = useCoyDash()

  // 1. Estado do Pipeline Selecionado
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('')
  const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST'>('KANBAN')
  const [searchQuery, setSearchQuery] = useState('')
  const [dealDialogOpen, setDealDialogOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<DealItem | null>(null)
  const [newDealDefaultStage, setNewDealDefaultStage] = useState<string>('')
  const [isConverting, setIsConverting] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Recarrega os dados do banco ao montar a tela
  React.useEffect(() => {
    refreshFromDatabase()
  }, [refreshFromDatabase])

  // Pipeline ativo (prioriza o selecionado, ou o que tiver deals, ou o default)
  const activePipeline: PipelineItem = useMemo(() => {
    if (selectedPipelineId) {
      const found = pipelines.find((p) => p.id === selectedPipelineId)
      if (found) return found
    }
    const withDeals = pipelines.find((p) => deals.some((d) => d.pipeline_id === p.id))
    if (withDeals) return withDeals
    return pipelines.find((p) => p.is_default) || pipelines[0] || DEFAULT_INITIAL_PIPELINE
  }, [pipelines, selectedPipelineId, deals])

  // Estágios ordenados do pipeline ativo
  const currentStages: PipelineStageItem[] = useMemo(() => {
    const list = pipelineStages.filter((s) => s.pipeline_id === activePipeline.id)
    if (list.length > 0) {
      return list.sort((a, b) => a.stage_order - b.stage_order)
    }
    return DEFAULT_INITIAL_STAGES
  }, [activePipeline, pipelineStages])

  // Oportunidades filtradas pelo pipeline ativo e busca (tolerante a IDs entre funis)
  const filteredDeals = useMemo(() => {
    if (!activePipeline) return []

    // 1. Tenta filtrar pelo ID exato do pipeline
    let matched = deals.filter((d) => d.pipeline_id === activePipeline.id)

    // 2. Se não encontrar com ID exato, mas existirem deals na lista, inclui os deals para não deixar a tela vazia
    if (matched.length === 0 && deals.length > 0) {
      matched = deals
    }

    const q = searchQuery.trim().toLowerCase()
    if (!q) return matched
    return matched.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.client_name && d.client_name.toLowerCase().includes(q)) ||
        (d.assigned_member_name && d.assigned_member_name.toLowerCase().includes(q)) ||
        (d.lead_id && d.lead_id.includes(q))
    )
  }, [deals, activePipeline, searchQuery])

  // Métricas do Topo (KPIs Financeiros de Vendas)
  const metrics = useMemo(() => {
    let totalMrr = 0
    let totalSetup = 0
    let weightedForecast = 0
    let wonDealsCount = 0

    filteredDeals.forEach((d) => {
      totalMrr += Number(d.value_mrr) || 0
      totalSetup += Number(d.value_setup) || 0

      const stage = currentStages.find((s) => s.id === d.stage_id)
      const prob = stage ? stage.probability_percent / 100 : 0.1
      weightedForecast += (Number(d.value_mrr) || 0) * prob + (Number(d.value_setup) || 0) * prob

      if (stage?.is_won) {
        wonDealsCount++
      }
    })

    const winRate =
      filteredDeals.length > 0 ? Math.round((wonDealsCount / filteredDeals.length) * 100) : 0

    return {
      totalMrr,
      totalSetup,
      weightedForecast,
      activeCount: filteredDeals.length,
      winRate,
    }
  }, [filteredDeals, currentStages])

  // Drag and Drop Handler
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const newStageId = destination.droppableId
    await updateDealStage(draggableId, newStageId)
  }

  // Abertura de modal para criar oportunidade
  const handleOpenCreateDeal = (stageId?: string) => {
    setEditingDeal(null)
    setNewDealDefaultStage(stageId || currentStages[0]?.id || '')
    setDealDialogOpen(true)
  }

  const handleEditDeal = (deal: DealItem) => {
    setEditingDeal(deal)
    setDealDialogOpen(true)
  }

  const handleDeleteDeal = async (dealId: string) => {
    if (confirm('Tem certeza que deseja remover esta oportunidade?')) {
      await deleteDeal(dealId)
    }
  }

  const handleConvertDeal = async (deal: DealItem) => {
    setIsConverting(true)
    setFeedbackMsg(null)
    try {
      const clientId = await convertDealToClient(deal.id, {
        clientName: deal.title,
        contactPhone: deal.lead_id || '',
      })
      if (clientId) {
        setFeedbackMsg({
          type: 'success',
          text: `🎉 Negócio convertido com sucesso! O cliente já está disponível na Central de Clientes 360º.`,
        })
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Falha ao converter em cliente',
      })
    } finally {
      setIsConverting(false)
    }
  }

  const handleRequestProposalFromDeal = async (deal: DealItem) => {
    try {
      const clientName = deal.client_name || deal.title || 'Cliente'
      const task = await createCommercialProposalTaskFromLead(
        {
          leadName: deal.client_name || deal.title,
          leadPhone: deal.lead_id || undefined,
          companyName: deal.client_name || undefined,
          clientId: deal.client_id || undefined,
          clientNameSnapshot: clientName,
          requestingUserName: authenticatedUser?.name || 'Felipe Cavalcante',
          closerName: deal.assigned_member_name || undefined,
          notes: deal.notes,
          estimatedValue: deal.value_mrr || deal.value_setup || undefined,
          origin: `Funil Comercial (${deal.title})`,
        },
        {
          taskFolders,
          taskLists,
          createTaskFolder,
          createTaskList,
          createTask,
          refreshFromDatabase,
        }
      )

      if (task) {
        setFeedbackMsg({
          type: 'success',
          text: `📄 Proposta Comercial solicitada! A tarefa foi gerada em "Leads - Tarefas" -> "Proposta Comercial".`,
        })
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Falha ao gerar proposta comercial',
      })
    }
  }

  const handleCreateDefaultPipeline = async () => {
    const pipeName = prompt('Nome do novo funil de vendas:', 'Expansão & Upsell')
    if (pipeName) {
      await createPipeline(pipeName.trim(), '#8f7dff')
    }
  }

  // Colunas do Data Grid (Engenharia Reversa Twenty CRM)
  const dealColumns: DataGridColumn<DealItem>[] = useMemo(() => {
    return [
      {
        id: 'title',
        label: 'Oportunidade',
        accessor: (d) => d.title,
        renderCell: (d) => (
          <div>
            <div className="font-bold text-[var(--fg)]">{d.title}</div>
            {d.client_name && (
              <div className="text-[11px] text-[var(--ds-muted)]">{d.client_name}</div>
            )}
          </div>
        ),
        sortable: true,
      },
      {
        id: 'stage_id',
        label: 'Estágio do Funil',
        accessor: (d) => {
          const s = currentStages.find((st) => st.id === d.stage_id)
          return s?.name || 'Estágio'
        },
        renderCell: (d) => {
          const s = currentStages.find((st) => st.id === d.stage_id)
          return (
            <span
              className="px-[8px] py-[3px] rounded-full text-[11px] font-semibold border flex items-center gap-[5px] w-fit"
              style={{
                borderColor: `${s?.color || '#38bdf8'}40`,
                color: s?.color || '#38bdf8',
                backgroundColor: `${s?.color || '#38bdf8'}15`,
              }}
            >
              <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: s?.color }} />
              {s?.name || 'Estágio'} ({s?.probability_percent || 0}%)
            </span>
          )
        },
        sortable: true,
      },
      {
        id: 'value_mrr',
        label: 'MRR Recorrente',
        accessor: (d) => Number(d.value_mrr) || 0,
        renderCell: (d) => (
          <span className="font-bold text-[#2f9e5a]">{formatCurrency(d.value_mrr)}</span>
        ),
        sortable: true,
        align: 'right',
      },
      {
        id: 'value_setup',
        label: 'Taxa Setup',
        accessor: (d) => Number(d.value_setup) || 0,
        renderCell: (d) => (
          <span>{d.value_setup > 0 ? formatCurrency(d.value_setup) : '—'}</span>
        ),
        sortable: true,
        align: 'right',
      },
      {
        id: 'lead_id',
        label: 'WhatsApp / Lead',
        accessor: (d) => d.lead_id || '',
        renderCell: (d) =>
          d.lead_id ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/atendimento?leadId=${encodeURIComponent(d.lead_id!)}`)
              }}
              className="inline-flex items-center gap-[4px] text-[11px] font-semibold text-[#2f9e5a] hover:underline"
            >
              <Phone className="w-3 h-3" />
              <span>{d.lead_id}</span>
            </button>
          ) : (
            <span className="text-[var(--ds-muted)]">—</span>
          ),
        sortable: true,
      },
      {
        id: 'assigned_member_name',
        label: 'Responsável',
        accessor: (d) => d.assigned_member_name || '',
        renderCell: (d) => (
          <span className="text-[var(--ds-muted)]">{d.assigned_member_name || 'Não atribuído'}</span>
        ),
        sortable: true,
      },
      {
        id: 'expected_close_date',
        label: 'Previsão Fechamento',
        accessor: (d) => d.expected_close_date || '',
        renderCell: (d) => (
          <span className="text-[var(--ds-muted)]">
            {d.expected_close_date ? d.expected_close_date.split('T')[0] : '—'}
          </span>
        ),
        sortable: true,
      },
      {
        id: 'priority',
        label: 'Prioridade',
        accessor: (d) => d.priority || 'medium',
        renderCell: (d) => {
          const map = {
            low: { label: 'Baixa', dot: 'bg-[#2f9e5a]' },
            medium: { label: 'Média', dot: 'bg-[#38bdf8]' },
            high: { label: 'Alta', dot: 'bg-[#0066FF]' },
            urgent: { label: 'Urgente', dot: 'bg-[#ef4444]' },
          }
          const item = map[d.priority || 'medium'] || map.medium
          return (
            <span className="inline-flex items-center gap-[5px] text-[11px] font-semibold text-[var(--fg)]">
              <span className={`w-[6px] h-[6px] rounded-full ${item.dot}`} />
              {item.label}
            </span>
          )
        },
        sortable: true,
      },
      {
        id: 'actions',
        label: 'Ações',
        sortable: false,
        align: 'right',
        renderCell: (d) => {
          const stage = currentStages.find((s) => s.id === d.stage_id)
          return (
            <div className="flex items-center justify-end gap-[6px]" onClick={(e) => e.stopPropagation()}>
              {stage?.is_won && !d.client_id && (
                <button
                  type="button"
                  onClick={() => handleConvertDeal(d)}
                  className="px-[8px] py-[3px] rounded-[6px] bg-[#2f9e5a] text-white text-[11px] font-bold hover:bg-[#27864c] transition-colors"
                >
                  Converter 360º
                </button>
              )}
              <button
                type="button"
                onClick={() => handleEditDeal(d)}
                className="p-[5px] rounded-[6px] text-[var(--ds-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg)] transition-colors"
                title="Editar oportunidade"
              >
                <Briefcase className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteDeal(d.id)}
                className="p-[5px] rounded-[6px] text-[var(--ds-muted)] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                title="Remover oportunidade"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        },
      },
    ]
  }, [currentStages, router])

  return (
    <div className="px-[26px] pt-[18px] pb-[32px] flex flex-col gap-[20px] min-h-full">
      {/* 1. CABEÇALHO PRINCIPAL COM SELETORES E BOTÃO PRIMÁRIO */}
      <div className="flex flex-wrap items-center justify-between gap-[16px] shrink-0">
        <div>
          <div className="flex items-center gap-[8px]">
            <h1 className="text-[26px] font-bold tracking-[-0.5px] leading-tight text-[var(--fg)]">
              Comercial & Vendas
            </h1>
            <span className="px-[8px] py-[2px] rounded-full text-[11px] font-bold bg-[#0066FF]/15 text-[#0066FF] border border-[#0066FF]/30">
              CoyCRM
            </span>
          </div>
          <p className="text-[13px] text-[var(--ds-muted)] mt-[2px]">
            Funil estratégico de oportunidades, previsão de fechamento e sincronização com WhatsApp
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-[10px]">
          {/* Seletor de Pipeline (Multi-Funil) */}
          <div className="flex items-center bg-[var(--surface)] border border-[var(--line2)] rounded-full p-[3px]">
            {pipelines.length > 0 ? (
              pipelines.map((pipe) => {
                const isActive = (activePipeline?.id === pipe.id)
                return (
                  <button
                    key={pipe.id}
                    type="button"
                    onClick={() => setSelectedPipelineId(pipe.id)}
                    className={`h-[34px] px-[14px] rounded-full text-[12px] font-semibold flex items-center gap-[6px] transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[var(--fg)] text-[var(--bg)] shadow-sm'
                        : 'text-[var(--ds-muted)] hover:text-[var(--fg)]'
                    }`}
                  >
                    <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: pipe.color }} />
                    <span>{pipe.name}</span>
                  </button>
                )
              })
            ) : (
              <span className="px-[12px] py-[6px] text-[12px] text-[var(--ds-muted)]">
                Carregando funis...
              </span>
            )}
            <button
              type="button"
              onClick={handleCreateDefaultPipeline}
              className="w-[30px] h-[30px] rounded-full hover:bg-[var(--bg)] text-[var(--ds-muted)] hover:text-[var(--fg)] flex items-center justify-center transition-colors cursor-pointer"
              title="Criar novo funil de vendas"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Alternador de Modo: Kanban vs Lista */}
          <div className="flex items-center bg-[var(--surface)] border border-[var(--line2)] rounded-full p-[3px]">
            <button
              type="button"
              onClick={() => setViewMode('KANBAN')}
              className={`h-[34px] px-[12px] rounded-full text-[12px] font-semibold flex items-center gap-[6px] transition-colors cursor-pointer ${
                viewMode === 'KANBAN'
                  ? 'bg-[#0066FF] text-[#141414]'
                  : 'text-[var(--ds-muted)] hover:text-[var(--fg)]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Quadro</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`h-[34px] px-[12px] rounded-full text-[12px] font-semibold flex items-center gap-[6px] transition-colors cursor-pointer ${
                viewMode === 'LIST'
                  ? 'bg-[#0066FF] text-[#141414]'
                  : 'text-[var(--ds-muted)] hover:text-[var(--fg)]'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>Tabela</span>
            </button>
          </div>

          {/* Botão Atualizar / Sincronizar */}
          <button
            type="button"
            onClick={async () => {
              await refreshFromDatabase()
              setFeedbackMsg({ type: 'success', text: 'Funil e oportunidades sincronizados com sucesso!' })
            }}
            className="h-[40px] px-[14px] rounded-full bg-[var(--surface)] hover:bg-[var(--line2)] border border-[var(--line2)] text-[12.5px] font-semibold text-[var(--fg)] flex items-center gap-[6px] transition-colors cursor-pointer"
            title="Recarregar oportunidades do banco"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>Atualizar</span>
          </button>

          {/* Botão Primário Laranja */}
          <button
            type="button"
            onClick={() => handleOpenCreateDeal()}
            className="h-[40px] px-[18px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-[#141414] font-bold text-[13px] flex items-center gap-[8px] transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nova Oportunidade</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-[2px]" />
          </button>
        </div>
      </div>

      {/* FEEDBACK DE CONVERSÃO */}
      {feedbackMsg && (
        <div
          className={`p-[12px] rounded-[12px] border text-[13px] flex items-center justify-between gap-[10px] animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-[#2f9e5a]/15 border-[#2f9e5a]/40 text-[#2f9e5a]'
              : 'bg-[#ef4444]/15 border-[#ef4444]/40 text-[#ef4444]'
          }`}
        >
          <div className="flex items-center gap-[8px]">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-[11px] underline font-semibold cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* 2. BARRA DE MÉTRICAS / KPIS DE VENDAS (DESIGN SYSTEM ROOMIE) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[12px]">
        {/* Card 1: MRR Total no Funil */}
        <div className="p-[16px] rounded-[16px] bg-[var(--surface)] border border-[var(--line2)] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[11.5px] text-[var(--ds-muted)] font-semibold">
            <span>PIPELINE TOTAL (MRR)</span>
            <DollarSign className="w-4 h-4 text-[#2f9e5a]" />
          </div>
          <div className="mt-[10px]">
            <div className="text-[22px] font-bold text-[#2f9e5a] tracking-tight">
              {formatCurrency(metrics.totalMrr)}
              <span className="text-[12px] font-normal text-[var(--ds-muted)] ml-[4px]">/mês</span>
            </div>
            <div className="text-[11px] text-[var(--ds-muted)] mt-[2px]">
              Recorrência acumulada em negociação
            </div>
          </div>
        </div>

        {/* Card 2: Setup Fee Acumulado */}
        <div className="p-[16px] rounded-[16px] bg-[var(--surface)] border border-[var(--line2)] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[11.5px] text-[var(--ds-muted)] font-semibold">
            <span>TOTAL EM SETUP</span>
            <TrendingUp className="w-4 h-4 text-[#0066FF]" />
          </div>
          <div className="mt-[10px]">
            <div className="text-[22px] font-bold text-[var(--fg)] tracking-tight">
              {formatCurrency(metrics.totalSetup)}
            </div>
            <div className="text-[11px] text-[var(--ds-muted)] mt-[2px]">
              Taxas de implementação estimadas
            </div>
          </div>
        </div>

        {/* Card 3: Forecast Ponderado */}
        <div className="p-[16px] rounded-[16px] bg-[var(--surface)] border border-[var(--line2)] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[11.5px] text-[var(--ds-muted)] font-semibold">
            <span>FORECAST PONDERADO</span>
            <Sparkles className="w-4 h-4 text-[#8f7dff]" />
          </div>
          <div className="mt-[10px]">
            <div className="text-[22px] font-bold text-[#8f7dff] tracking-tight">
              {formatCurrency(metrics.weightedForecast)}
            </div>
            <div className="text-[11px] text-[var(--ds-muted)] mt-[2px]">
              Expectativa real (valor × probabilidade)
            </div>
          </div>
        </div>

        {/* Card 4: Oportunidades & Conversão */}
        <div className="p-[16px] rounded-[16px] bg-[var(--surface)] border border-[var(--line2)] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[11.5px] text-[var(--ds-muted)] font-semibold">
            <span>NEGÓCIOS NO FUNIL</span>
            <Layers className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div className="mt-[10px]">
            <div className="text-[22px] font-bold text-[var(--fg)] tracking-tight">
              {metrics.activeCount} <span className="text-[13px] font-normal text-[var(--ds-muted)]">deals</span>
            </div>
            <div className="text-[11px] text-[var(--ds-muted)] mt-[2px]">
              Taxa de fechamento atual: <span className="font-semibold text-[#2f9e5a]">{metrics.winRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE PESQUISA RÁPIDA */}
      <div className="flex items-center justify-between gap-[10px] bg-[var(--surface)] border border-[var(--line2)] rounded-[14px] px-[14px] py-[8px]">
        <div className="flex items-center gap-[10px] flex-1 max-w-[420px]">
          <Search className="w-4 h-4 text-[var(--ds-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, empresa, responsável ou WhatsApp..."
            className="w-full bg-transparent text-[13px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] focus:outline-none"
          />
        </div>

        <div className="text-[12px] text-[var(--ds-muted)]">
          Mostrando <span className="font-bold text-[var(--fg)]">{filteredDeals.length}</span> negócios
        </div>
      </div>

      {/* ====================================================================== */}
      {/* 3. MODO 1: QUADRO KANBAN COM DRAG-AND-DROP E SOMA MONETÁRIA NO TOPO   */}
      {/* ====================================================================== */}
      {viewMode === 'KANBAN' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div
            className="flex gap-[16px] items-start pb-[20px] overflow-x-auto scroll-smooth snap-x"
            style={{ scrollbarWidth: 'thin' }}
          >
            {currentStages.map((stage) => {
              const stageDeals = filteredDeals.filter((d) => {
                if (d.stage_id === stage.id) return true
                const dealStage = pipelineStages.find((s) => s.id === d.stage_id)
                if (dealStage) {
                  if (dealStage.name.toLowerCase() === stage.name.toLowerCase()) return true
                  if (dealStage.stage_order === stage.stage_order) return true
                }
                const matchesAny = currentStages.some(
                  (s) => s.id !== stage.id && (s.id === d.stage_id || (dealStage && s.name.toLowerCase() === dealStage.name.toLowerCase()))
                )
                if (!matchesAny && stage.stage_order === 0) return true
                return false
              })
              const stageMrr = stageDeals.reduce((acc, d) => acc + (Number(d.value_mrr) || 0), 0)
              const stageSetup = stageDeals.reduce((acc, d) => acc + (Number(d.value_setup) || 0), 0)

              return (
                <div
                  key={stage.id}
                  className="w-[300px] shrink-0 bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[12px] flex flex-col gap-[10px] max-h-[calc(100vh-290px)] min-h-[480px] snap-start shadow-sm"
                >
                  {/* Cabeçalho da Coluna do Kanban */}
                  <div className="flex items-center justify-between pb-[10px] border-b border-[var(--line2)]">
                    <div className="flex items-center gap-[8px]">
                      <span className="w-[8px] h-[8px] rounded-full" style={{ backgroundColor: stage.color }} />
                      <h3 className="font-bold text-[13.5px] text-[var(--fg)] truncate max-w-[170px]">
                        {stage.name}
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold px-[7px] py-[1px] rounded-full bg-[var(--bg)] border border-[var(--line2)] text-[var(--ds-muted)]">
                      {stage.probability_percent}%
                    </span>
                  </div>

                  {/* Totalizador Financeiro da Coluna */}
                  <div className="px-[8px] py-[6px] rounded-[8px] bg-[var(--bg)] border border-[var(--line2)]/50 flex items-center justify-between text-[11px]">
                    <span className="text-[var(--ds-muted)]">
                      Total ({stageDeals.length}):
                    </span>
                    <span className="font-bold text-[#2f9e5a]">
                      {formatCurrency(stageMrr)}
                      {stageSetup > 0 && (
                        <span className="text-[10px] font-normal text-[var(--ds-muted)] ml-[4px]">
                          + {formatCurrency(stageSetup)} setup
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Área Droppable dos Cards */}
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex flex-col gap-[10px] flex-1 overflow-y-auto pr-[2px] transition-colors rounded-[10px] ${
                          snapshot.isDraggingOver ? 'bg-[var(--bg)]/50' : ''
                        }`}
                        style={{ scrollbarWidth: 'thin' }}
                      >
                        {stageDeals.map((deal, idx) => (
                          <DealCard
                            key={deal.id}
                            deal={deal}
                            index={idx}
                            stage={stage}
                            onEdit={handleEditDeal}
                            onDelete={handleDeleteDeal}
                            onConvert={handleConvertDeal}
                            onRequestProposal={handleRequestProposalFromDeal}
                          />
                        ))}
                        {provided.placeholder}

                        {stageDeals.length === 0 && !snapshot.isDraggingOver && (
                          <div className="py-[32px] text-center border-2 border-dashed border-[var(--line2)]/70 rounded-[12px] flex flex-col items-center justify-center gap-[6px]">
                            <span className="text-[12px] text-[var(--ds-muted)]">
                              Nenhum negócio aqui
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenCreateDeal(stage.id)}
                              className="text-[11px] text-[#0066FF] font-semibold hover:underline cursor-pointer"
                            >
                              + Adicionar deal
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>

                  {/* Botão rápido no rodapé da coluna */}
                  <button
                    type="button"
                    onClick={() => handleOpenCreateDeal(stage.id)}
                    className="w-full h-[32px] rounded-[8px] hover:bg-[var(--bg)] text-[var(--ds-muted)] hover:text-[var(--fg)] text-[11.5px] font-semibold flex items-center justify-center gap-[6px] transition-colors cursor-pointer border border-transparent hover:border-[var(--line2)]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Oportunidade</span>
                  </button>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      )}

      {/* ====================================================================== */}
      {/* 4. MODO 2: VISUALIZAÇÃO EM TABELA ENTERPRISE (COYDATA GRID TWENTY)     */}
      {/* ====================================================================== */}
      {viewMode === 'LIST' && (
        <CoyDataGrid<DealItem>
          scope="DEALS"
          data={filteredDeals}
          columns={dealColumns}
          onRowClick={handleEditDeal}
          searchPlaceholder="Filtrar oportunidades por título, valor, responsável ou WhatsApp..."
          emptyMessage="Nenhuma oportunidade encontrada com os filtros atuais."
          defaultSort={{ field: 'value_mrr', direction: 'desc' }}
        />
      )}

      {/* DIÁLOGO DE NOVA / EDITAR OPORTUNIDADE */}
      <DealDialog
        open={dealDialogOpen}
        onClose={() => setDealDialogOpen(false)}
        initialDeal={editingDeal}
        defaultPipelineId={activePipeline?.id}
        defaultStageId={newDealDefaultStage}
      />
    </div>
  )
}

