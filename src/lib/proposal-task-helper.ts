import { ensurePropostaComercialList } from './task-lists-helper'
import type { TaskFolderItem, TaskListItem, TaskItem } from '@/types/coydash'

export interface ProposalLeadInput {
  leadName: string
  leadPhone?: string | null
  leadEmail?: string | null
  companyName?: string | null
  clientId?: string | null
  clientNameSnapshot?: string | null
  requestingUserName?: string | null
  closerName?: string | null
  notes?: string | null
  memories?: Array<{ memory_text: string }>
  recentMessages?: Array<{ sender?: string; content?: string; text?: string }>
  estimatedValue?: number | null
  origin?: string
}

export interface ProposalStoreContext {
  taskFolders: TaskFolderItem[]
  taskLists: TaskListItem[]
  createTaskFolder: (name: string, icon?: string) => Promise<string | null>
  createTaskList: (folderId: string, name: string, icon?: string) => Promise<string | null>
  createTask: (input: Partial<TaskItem>) => Promise<TaskItem | null>
  refreshFromDatabase?: (orgId?: string) => Promise<void>
}

/**
 * Cria automaticamente uma tarefa de solicitação de Proposta Comercial
 * alocada no projeto 'Leads - Tarefas' -> lista 'Proposta Comercial'
 * com todos os dados do cliente, anotações, memórias e histórico de atendimento do Lead.
 */
export async function createCommercialProposalTaskFromLead(
  lead: ProposalLeadInput,
  store: ProposalStoreContext
): Promise<TaskItem | null> {
  // 1. Garantir que a lista 'Proposta Comercial' no projeto 'Leads - Tarefas' exista
  const targetListId = await ensurePropostaComercialList(store)

  const finalClientName = (
    lead.clientNameSnapshot ||
    lead.companyName ||
    lead.leadName ||
    'Lead'
  ).trim()

  // 2. Compilar briefing completo e estruturado com dados do cliente em destaque
  const sections: string[] = []

  sections.push(`📋 SOLICITAÇÃO DE PROPOSTA COMERCIAL`)
  sections.push(`Origem: ${lead.origin || 'Atendimento / CRM Comercial'}`)
  sections.push(`----------------------------------------`)

  sections.push(`🏢 DADOS DO CLIENTE / LEAD:`)
  sections.push(`• Cliente / Razão: ${finalClientName}`)
  sections.push(`• Contato Principal: ${lead.leadName}`)
  if (lead.companyName && lead.companyName !== finalClientName) {
    sections.push(`• Empresa: ${lead.companyName}`)
  }
  if (lead.leadPhone) sections.push(`• WhatsApp / Telefone: ${lead.leadPhone}`)
  if (lead.leadEmail) sections.push(`• E-mail: ${lead.leadEmail}`)
  if (lead.estimatedValue) {
    sections.push(`• Valor Estimado: R$ ${lead.estimatedValue.toLocaleString('pt-BR')}`)
  }
  if (lead.closerName) {
    sections.push(`• Closer / Responsável: ${lead.closerName}`)
  }

  // Anotações comerciais
  if (lead.notes && lead.notes.trim()) {
    sections.push(`\n📝 ANOTAÇÕES COMERCIAIS:\n${lead.notes.trim()}`)
  }

  // Dores e Memórias gravadas pelo robô ou atendente
  if (lead.memories && lead.memories.length > 0) {
    sections.push(`\n🧠 DORES & MEMÓRIAS DO ATENDIMENTO:`)
    lead.memories.forEach((m, idx) => {
      sections.push(`${idx + 1}. ${m.memory_text}`)
    })
  }

  // Últimas mensagens da conversa
  if (lead.recentMessages && lead.recentMessages.length > 0) {
    sections.push(`\n💬 RESUMO DAS ÚLTIMAS MENSAGENS:`)
    lead.recentMessages.slice(-5).forEach((msg) => {
      const sender = msg.sender || 'Mensagem'
      const text = msg.content || msg.text || ''
      if (text) sections.push(`[${sender}]: ${text}`)
    })
  }

  const description = sections.join('\n')

  // 3. Subtarefas da proposta comercial
  const initialSubtasks = [
    { id: `sub_${Date.now()}_1`, title: 'Analisar dores e necessidades do cliente', is_completed: false },
    { id: `sub_${Date.now()}_2`, title: 'Estruturar proposta técnica e precificação', is_completed: false },
    { id: `sub_${Date.now()}_3`, title: 'Gerar documento/PDF da proposta oficial', is_completed: false },
    { id: `sub_${Date.now()}_4`, title: 'Apresentar proposta ao cliente (reunião ou WhatsApp)', is_completed: false },
  ]

  const title = `Proposta Comercial · ${finalClientName}`

  // Responsáveis: adiciona quem solicitou (para aparecer no Modo Eu!), o closer e a equipe comercial
  const assigneesSet = new Set<string>()
  if (lead.requestingUserName) assigneesSet.add(lead.requestingUserName)
  if (lead.closerName) assigneesSet.add(lead.closerName)
  assigneesSet.add('Comercial')
  assigneesSet.add('Coytech')
  const assigneesList = Array.from(assigneesSet)
  const assigneeName = assigneesList.join(', ')

  // 4. Criar a tarefa no store com vínculo real do cliente
  const createdTask = await store.createTask({
    title,
    description,
    list_id: targetListId || null,
    client_id: lead.clientId || null,
    client_name_snapshot: finalClientName,
    status_key: 'A FAZER',
    priority: 'high',
    assignees: assigneesList,
    assignee_name: assigneeName,
    subtasks: initialSubtasks,
  })

  return createdTask
}

