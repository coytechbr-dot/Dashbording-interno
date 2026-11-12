import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateMcpToken, hasScope, recordMcpAuditLog } from '@/lib/mcp-auth'
import { McpToolDefinition, McpScope } from '@/types/mcp'

export const dynamic = 'force-dynamic'

// Catálogo das 16 Ferramentas Oficiais do CoyDash Universal MCP Server (SDD 10)
const MCP_TOOLS: McpToolDefinition[] = [
  // --- 1. MÓDULO: ATENDIMENTO & WHATSAPP ---
  {
    name: 'atendimento_list_conversations',
    description: 'Lista conversas e leads de WhatsApp com filtro por estágio comercial e paginação.',
    requiredScope: 'atendimento:read',
    inputSchema: {
      type: 'object',
      properties: {
        commercial_stage: {
          type: 'string',
          description: 'Filtro por estágio comercial (ex: NOVO, CONTATO, QUALIFICADO, REUNIAO_AGENDADA, NEGOCIACAO, GANHO, PERDIDO)',
        },
        limit: {
          type: 'number',
          description: 'Limite máximo de conversas retornadas (padrão 20, máximo 100)',
        },
      },
    },
  },
  {
    name: 'atendimento_get_chat_history',
    description: 'Retorna dados e histórico de mensagens de um lead específico no WhatsApp.',
    requiredScope: 'atendimento:read',
    inputSchema: {
      type: 'object',
      properties: {
        lead_id: {
          type: 'string',
          description: 'Número de WhatsApp do lead (ex: 5511999999999)',
        },
      },
      required: ['lead_id'],
    },
  },
  {
    name: 'atendimento_update_lead_stage',
    description: 'Atualiza o estágio comercial de um lead no WhatsApp (ex: QUALIFICADO, REUNIAO_AGENDADA, GANHO).',
    requiredScope: 'atendimento:write',
    inputSchema: {
      type: 'object',
      properties: {
        lead_id: {
          type: 'string',
          description: 'Número de WhatsApp do lead (ex: 5511999999999)',
        },
        stage: {
          type: 'string',
          description: 'Novo estágio: NOVO, CONTATO, QUALIFICADO, REUNIAO_AGENDADA, NEGOCIACAO, GANHO ou PERDIDO',
        },
      },
      required: ['lead_id', 'stage'],
    },
  },
  {
    name: 'atendimento_toggle_human_takeover',
    description: 'Ativa ou desativa a intervenção humana para silenciar ou reativar o Agente de IA SDR.',
    requiredScope: 'atendimento:write',
    inputSchema: {
      type: 'object',
      properties: {
        lead_id: {
          type: 'string',
          description: 'Número de WhatsApp do lead',
        },
        human_takeover: {
          type: 'boolean',
          description: 'true para assumir manualmente (pausar IA), false para devolver para a IA',
        },
      },
      required: ['lead_id', 'human_takeover'],
    },
  },

  // --- 2. MÓDULO: COMERCIAL & FUNIL DE VENDAS ---
  {
    name: 'comercial_get_pipeline_summary',
    description: 'Retorna resumo executivo consolidado do Comercial: MRR total, setup fee, forecast ponderado e negócios ativos.',
    requiredScope: 'comercial:read',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'comercial_list_deals',
    description: 'Lista oportunidades de negócio do CRM com filtros por estágio, pipeline ou status.',
    requiredScope: 'comercial:read',
    inputSchema: {
      type: 'object',
      properties: {
        pipeline_id: {
          type: 'string',
          description: 'ID UUID do pipeline (opcional)',
        },
        stage_id: {
          type: 'string',
          description: 'ID UUID do estágio (opcional)',
        },
        status: {
          type: 'string',
          description: 'Filtro por status (OPEN, WON, LOST, ARCHIVED)',
        },
        limit: {
          type: 'number',
          description: 'Limite máximo de resultados (padrão 50)',
        },
      },
    },
  },
  {
    name: 'comercial_create_deal',
    description: 'Cria uma nova oportunidade no funil comercial do CRM.',
    requiredScope: 'comercial:write',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Título do negócio / oportunidade (ex: Contrato Anual - Empresa X)',
        },
        mrr_value: {
          type: 'number',
          description: 'Valor recorrente mensal estimado (R$ MRR)',
        },
        setup_fee: {
          type: 'number',
          description: 'Taxa de adesão / setup inicial (R$)',
        },
        lead_id: {
          type: 'string',
          description: 'Número de WhatsApp do lead relacionado (opcional)',
        },
        client_id: {
          type: 'string',
          description: 'UUID do cliente existente na base (opcional)',
        },
        stage_id: {
          type: 'string',
          description: 'UUID do estágio inicial no Kanban',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'comercial_update_deal_stage',
    description: 'Move uma oportunidade para outro estágio do Kanban comercial com registro no histórico.',
    requiredScope: 'comercial:write',
    inputSchema: {
      type: 'object',
      properties: {
        deal_id: {
          type: 'string',
          description: 'UUID da oportunidade (deal)',
        },
        stage_id: {
          type: 'string',
          description: 'UUID do novo estágio do pipeline',
        },
        notes: {
          type: 'string',
          description: 'Nota ou motivo da movimentação (opcional)',
        },
      },
      required: ['deal_id', 'stage_id'],
    },
  },
  {
    name: 'comercial_convert_deal_to_client',
    description: 'Converte uma oportunidade ganha (WON) em Cliente 360º oficial, criando a empresa e contato.',
    requiredScope: 'comercial:write',
    inputSchema: {
      type: 'object',
      properties: {
        deal_id: {
          type: 'string',
          description: 'UUID da oportunidade ganha',
        },
        client_name: {
          type: 'string',
          description: 'Nome da empresa do cliente',
        },
        cnpj: {
          type: 'string',
          description: 'CNPJ do cliente (opcional)',
        },
      },
      required: ['deal_id', 'client_name'],
    },
  },

  // --- 3. MÓDULO: TAREFAS, PROJETOS & SETORES ---
  {
    name: 'tarefas_list_tasks',
    description: 'Lista tarefas do espaço de trabalho com filtros por status, prioridade ou lista.',
    requiredScope: 'tarefas:read',
    inputSchema: {
      type: 'object',
      properties: {
        status_key: {
          type: 'string',
          description: 'Chave do status da tarefa (ex: TODO, IN_PROGRESS, REVIEW, DONE)',
        },
        priority: {
          type: 'string',
          description: 'Prioridade (LOW, MEDIUM, HIGH, URGENT)',
        },
        limit: {
          type: 'number',
          description: 'Quantidade máxima de tarefas (padrão 30)',
        },
      },
    },
  },
  {
    name: 'tarefas_create_task',
    description: 'Cria uma nova tarefa com prioridade, prazo e descrição.',
    requiredScope: 'tarefas:write',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Título da tarefa',
        },
        description: {
          type: 'string',
          description: 'Descrição detalhada dos requisitos',
        },
        priority: {
          type: 'string',
          description: 'Prioridade: LOW, MEDIUM, HIGH ou URGENT (padrão: MEDIUM)',
        },
        due_date: {
          type: 'string',
          description: 'Data de entrega no formato AAAA-MM-DD (opcional)',
        },
        list_id: {
          type: 'string',
          description: 'UUID da lista/pasta pertencente (opcional)',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'tarefas_update_task_status',
    description: 'Atualiza o status de execução de uma tarefa (ex: TODO -> IN_PROGRESS -> DONE).',
    requiredScope: 'tarefas:write',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'UUID da tarefa',
        },
        status_key: {
          type: 'string',
          description: 'Novo status (TODO, IN_PROGRESS, DONE, etc.)',
        },
      },
      required: ['task_id', 'status_key'],
    },
  },
  {
    name: 'tarefas_add_comment',
    description: 'Adiciona um comentário ou parecer técnico no chat lateral de uma tarefa.',
    requiredScope: 'tarefas:write',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'UUID da tarefa',
        },
        content: {
          type: 'string',
          description: 'Texto do comentário',
        },
        author_name: {
          type: 'string',
          description: 'Nome do autor ou agente que comentou',
        },
      },
      required: ['task_id', 'content'],
    },
  },

  // --- 4. MÓDULO: CENTRAL DE CLIENTES 360º ---
  {
    name: 'clientes_get_client_360',
    description: 'Retorna a ficha 360º completa do cliente: cadastro, MRR, NPS, contatos e negócios vinculados.',
    requiredScope: 'clientes:read',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: {
          type: 'string',
          description: 'UUID do cliente cadastrado',
        },
        client_name: {
          type: 'string',
          description: 'Ou busca pelo nome aproximado da empresa',
        },
      },
    },
  },
  {
    name: 'clientes_create_contact',
    description: 'Cadastra um novo contato ou tomador de decisão vinculado a uma empresa cliente.',
    requiredScope: 'clientes:write',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: {
          type: 'string',
          description: 'UUID do cliente',
        },
        name: {
          type: 'string',
          description: 'Nome completo do contato',
        },
        role_title: {
          type: 'string',
          description: 'Cargo (ex: Diretor de Tecnologia, CFO, Gerente)',
        },
        phone: {
          type: 'string',
          description: 'Celular / WhatsApp (ex: 5511999999999)',
        },
        email: {
          type: 'string',
          description: 'E-mail corporativo',
        },
        is_decision_maker: {
          type: 'boolean',
          description: 'Indica se é o tomador de decisão principal da conta',
        },
      },
      required: ['client_id', 'name'],
    },
  },

  // --- 5. MÓDULO: AGENTES DE IA & EQUIPE ---
  {
    name: 'agentes_get_status_overview',
    description: 'Retorna a lista e prontidão dos Agentes de IA da operação (SDR, Qualificador, Suporte, Customizados).',
    requiredScope: 'agentes:read',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
]

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept',
    },
  })
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1'

  // Validação da Autenticação do Token MCP
  const authHeader = request.headers.get('authorization')
  const authResult = await validateMcpToken(authHeader)

  if (!authResult.ok || !authResult.token) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32000,
          message: authResult.error || 'Autenticação MCP falhou. Forneça Authorization: Bearer coydash_mcp_live_...',
        },
      },
      { status: 401 }
    )
  }

  const token = authResult.token
  const admin = createAdminClient()

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error: JSON inválido.' },
      },
      { status: 400 }
    )
  }

  const { jsonrpc, id, method, params } = body

  if (jsonrpc !== '2.0') {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: id ?? null,
        error: { code: -32600, message: 'Invalid Request: jsonrpc deve ser 2.0.' },
      },
      { status: 400 }
    )
  }

  // --- 1. Handshake do Protocolo MCP ---
  if (method === 'initialize') {
    return NextResponse.json({
      jsonrpc: '2.0',
      id: id ?? null,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: false },
          resources: {},
          prompts: {},
        },
        serverInfo: {
          name: 'coydash-universal-mcp',
          version: '1.0.0',
        },
        instructions:
          'Servidor MCP Corporativo CoyDash. Opera Atendimento, Comercial, Tarefas e Clientes com isolamento estrito de tenant e RBAC.',
      },
    })
  }

  if (method === 'notifications/initialized' || method === 'ping') {
    return NextResponse.json({
      jsonrpc: '2.0',
      id: id ?? null,
      result: {},
    })
  }

  // --- 2. Listagem de Ferramentas (tools/list) ---
  if (method === 'tools/list') {
    // Retorna as ferramentas que o token tem permissão de visualizar
    const allowedTools = MCP_TOOLS.filter((t) => hasScope(token.allowed_scopes, t.requiredScope))

    return NextResponse.json({
      jsonrpc: '2.0',
      id: id ?? null,
      result: {
        tools: allowedTools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      },
    })
  }

  // --- 3. Execução de Ferramentas (tools/call) ---
  if (method === 'tools/call') {
    const toolName = params?.name
    const toolArgs = params?.arguments || {}

    const toolDef = MCP_TOOLS.find((t) => t.name === toolName)
    if (!toolDef) {
      await recordMcpAuditLog({
        organization_id: token.organization_id,
        token_id: token.id,
        tool_name: toolName || 'unknown',
        arguments: toolArgs,
        status: 'VALIDATION_ERROR',
        execution_time_ms: Date.now() - startTime,
        error_message: `Ferramenta '${toolName}' não existe no servidor MCP.`,
        client_ip: clientIp,
      })

      return NextResponse.json({
        jsonrpc: '2.0',
        id: id ?? null,
        result: {
          content: [{ type: 'text', text: `Erro: Ferramenta '${toolName}' não reconhecida no servidor CoyDash.` }],
          isError: true,
        },
      })
    }

    // Trava de Permissão (RBAC)
    if (!hasScope(token.allowed_scopes, toolDef.requiredScope)) {
      await recordMcpAuditLog({
        organization_id: token.organization_id,
        token_id: token.id,
        tool_name: toolName,
        arguments: toolArgs,
        status: 'FORBIDDEN',
        execution_time_ms: Date.now() - startTime,
        error_message: `Acesso negado. Escopo necessário: '${toolDef.requiredScope}'. Escopos permitidos para este token: ${JSON.stringify(token.allowed_scopes)}.`,
        client_ip: clientIp,
      })

      return NextResponse.json({
        jsonrpc: '2.0',
        id: id ?? null,
        result: {
          content: [
            {
              type: 'text',
              text: `Permissão negada (403): O token não possui o escopo '${toolDef.requiredScope}' necessário para executar '${toolName}'.`,
            },
          ],
          isError: true,
        },
      })
    }

    // Execução Segura da Tool
    try {
      let executionResult: any

      switch (toolName) {
        // --- ATENDIMENTO ---
        case 'atendimento_list_conversations': {
          let query = admin
            .from('leads')
            .select('id, lead_id, lead_nome, crm_stage, commercial_stage, human_takeover, qualification_score, created_at')
            .eq('organization_id', token.organization_id)
            .order('created_at', { ascending: false })
            .limit(Math.min(toolArgs.limit || 20, 100))

          if (toolArgs.commercial_stage) {
            query = query.eq('commercial_stage', toolArgs.commercial_stage)
          }

          const { data, error } = await query
          if (error) throw new Error(error.message)
          executionResult = { total: data?.length || 0, conversations: data || [] }
          break
        }

        case 'atendimento_get_chat_history': {
          const { lead_id } = toolArgs
          const { data: lead, error } = await admin
            .from('leads')
            .select('*')
            .eq('organization_id', token.organization_id)
            .eq('lead_id', lead_id)
            .maybeSingle()

          if (error) throw new Error(error.message)
          if (!lead) {
            executionResult = { found: false, message: `Lead com WhatsApp ${lead_id} não encontrado.` }
          } else {
            executionResult = { found: true, lead }
          }
          break
        }

        case 'atendimento_update_lead_stage': {
          const { lead_id, stage } = toolArgs
          const { data, error } = await admin
            .from('leads')
            .update({ commercial_stage: stage })
            .eq('organization_id', token.organization_id)
            .eq('lead_id', lead_id)
            .select()

          if (error) throw new Error(error.message)
          executionResult = { success: true, updated_lead: data?.[0] || null }
          break
        }

        case 'atendimento_toggle_human_takeover': {
          const { lead_id, human_takeover } = toolArgs
          const { data, error } = await admin
            .from('leads')
            .update({ human_takeover: Boolean(human_takeover) })
            .eq('organization_id', token.organization_id)
            .eq('lead_id', lead_id)
            .select()

          if (error) throw new Error(error.message)
          executionResult = {
            success: true,
            human_takeover: Boolean(human_takeover),
            lead: data?.[0] || null,
          }
          break
        }

        // --- COMERCIAL ---
        case 'comercial_get_pipeline_summary': {
          const { data: deals, error } = await admin
            .from('deals')
            .select(`
              id, title, value_mrr, value_setup, stage_id,
              pipeline_stages (
                name, probability_percent, is_won, is_lost
              )
            `)
            .eq('organization_id', token.organization_id)

          if (error) throw new Error(error.message)

          const totalDeals = deals?.length || 0
          const activeDeals = deals?.filter((d: any) => !d.pipeline_stages?.is_lost) || []
          const totalMRR = activeDeals.reduce((sum: number, d: any) => sum + Number(d.value_mrr || 0), 0)
          const totalSetup = activeDeals.reduce((sum: number, d: any) => sum + Number(d.value_setup || 0), 0)
          const weightedMRR = activeDeals.reduce(
            (sum: number, d: any) => sum + Number(d.value_mrr || 0) * ((d.pipeline_stages?.probability_percent || 50) / 100),
            0
          )

          executionResult = {
            active_deals_count: activeDeals.length,
            total_deals_count: totalDeals,
            total_open_mrr: totalMRR,
            total_open_setup_fee: totalSetup,
            weighted_forecast_mrr: Math.round(weightedMRR),
          }
          break
        }

        case 'comercial_list_deals': {
          let query = admin
            .from('deals')
            .select(`
              id, title, value_mrr, value_setup, stage_id, pipeline_id, lead_id, client_id, priority, created_at,
              pipeline_stages ( name, probability_percent, color, is_won, is_lost )
            `)
            .eq('organization_id', token.organization_id)
            .order('created_at', { ascending: false })
            .limit(toolArgs.limit || 50)

          if (toolArgs.pipeline_id) query = query.eq('pipeline_id', toolArgs.pipeline_id)
          if (toolArgs.stage_id) query = query.eq('stage_id', toolArgs.stage_id)

          const { data, error } = await query
          if (error) throw new Error(error.message)
          executionResult = { total: data?.length || 0, deals: data || [] }
          break
        }

        case 'comercial_create_deal': {
          // Busca estágio default se não fornecido
          let stageId = toolArgs.stage_id
          let pipelineId = null

          if (!stageId) {
            const { data: stage } = await admin
              .from('pipeline_stages')
              .select('id, pipeline_id')
              .eq('organization_id', token.organization_id)
              .order('position', { ascending: true })
              .limit(1)
              .maybeSingle()

            if (stage) {
              stageId = stage.id
              pipelineId = stage.pipeline_id
            }
          }

          const { data: deal, error } = await admin
            .from('deals')
            .insert({
              organization_id: token.organization_id,
              pipeline_id: pipelineId,
              stage_id: stageId,
              title: toolArgs.title.trim(),
              value_mrr: toolArgs.value_mrr ?? toolArgs.mrr_value ?? 0,
              value_setup: toolArgs.value_setup ?? toolArgs.setup_fee ?? 0,
              lead_id: toolArgs.lead_id || null,
              client_id: toolArgs.client_id || null,
              priority: toolArgs.priority || 'medium',
            })
            .select()
            .single()

          if (error) throw new Error(error.message)

          // Timeline
          await admin.from('activity_timeline').insert({
            organization_id: token.organization_id,
            deal_id: deal.id,
            activity_type: 'STAGE_CHANGE',
            title: 'Negócio criado via MCP Server',
            content: `Negócio "${deal.title}" cadastrado com sucesso por Agente de IA.`,
          })

          executionResult = { success: true, deal }
          break
        }

        case 'comercial_update_deal_stage': {
          const { deal_id, stage_id, notes } = toolArgs
          const { data: updated, error } = await admin
            .from('deals')
            .update({ stage_id, updated_at: new Date().toISOString() })
            .eq('organization_id', token.organization_id)
            .eq('id', deal_id)
            .select()
            .single()

          if (error) throw new Error(error.message)

          await admin.from('activity_timeline').insert({
            organization_id: token.organization_id,
            deal_id: deal_id,
            activity_type: 'STAGE_CHANGE',
            title: 'Estágio alterado via MCP',
            content: notes || `Estágio alterado para ${stage_id}.`,
          })

          executionResult = { success: true, deal: updated }
          break
        }

        case 'comercial_convert_deal_to_client': {
          const { deal_id, client_name, cnpj } = toolArgs

          // 1. Cria cliente
          const { data: newClient, error: clientErr } = await admin
            .from('clients')
            .insert({
              organization_id: token.organization_id,
              name: client_name.trim(),
              cnpj: cnpj || null,
              status: 'Ativo',
            })
            .select()
            .single()

          if (clientErr) throw new Error(clientErr.message)

          // 2. Atualiza deal como WON
          await admin
            .from('deals')
            .update({
              status: 'WON',
              client_id: newClient.id,
              updated_at: new Date().toISOString(),
            })
            .eq('organization_id', token.organization_id)
            .eq('id', deal_id)

          executionResult = {
            success: true,
            client_id: newClient.id,
            client_name: newClient.name,
            message: 'Oportunidade convertida em Cliente 360º com sucesso.',
          }
          break
        }

        // --- TAREFAS ---
        case 'tarefas_list_tasks': {
          let query = admin
            .from('tasks')
            .select('id, title, description, priority, status_key, due_date, created_at')
            .eq('organization_id', token.organization_id)
            .order('created_at', { ascending: false })
            .limit(toolArgs.limit || 30)

          if (toolArgs.status_key) query = query.eq('status_key', toolArgs.status_key)
          if (toolArgs.priority) query = query.eq('priority', toolArgs.priority)

          const { data, error } = await query
          if (error) throw new Error(error.message)
          executionResult = { total: data?.length || 0, tasks: data || [] }
          break
        }

        case 'tarefas_create_task': {
          const { title, description, priority = 'MEDIUM', due_date, list_id } = toolArgs
          const { data: task, error } = await admin
            .from('tasks')
            .insert({
              organization_id: token.organization_id,
              list_id: list_id || null,
              title: title.trim(),
              description: description || null,
              priority: priority,
              status_key: 'TODO',
              due_date: due_date || null,
            })
            .select()
            .single()

          if (error) throw new Error(error.message)
          executionResult = { success: true, task }
          break
        }

        case 'tarefas_update_task_status': {
          const { task_id, status_key } = toolArgs
          const { data: task, error } = await admin
            .from('tasks')
            .update({ status_key })
            .eq('organization_id', token.organization_id)
            .eq('id', task_id)
            .select()
            .single()

          if (error) throw new Error(error.message)
          executionResult = { success: true, task }
          break
        }

        case 'tarefas_add_comment': {
          const { task_id, content, author_name = 'Agente MCP' } = toolArgs
          // Busca comentários existentes na tarefa
          const { data: task, error: fetchErr } = await admin
            .from('tasks')
            .select('comments')
            .eq('organization_id', token.organization_id)
            .eq('id', task_id)
            .single()

          if (fetchErr) throw new Error(fetchErr.message)

          const existingComments = Array.isArray(task.comments) ? task.comments : []
          const newComment = {
            id: `cmt_${Date.now()}`,
            author: author_name,
            content,
            created_at: new Date().toISOString(),
          }

          const { error: updateErr } = await admin
            .from('tasks')
            .update({ comments: [...existingComments, newComment] })
            .eq('id', task_id)

          if (updateErr) throw new Error(updateErr.message)
          executionResult = { success: true, comment: newComment }
          break
        }

        // --- CLIENTES 360º ---
        case 'clientes_get_client_360': {
          let clientQuery = admin
            .from('clients')
            .select('*')
            .eq('organization_id', token.organization_id)

          if (toolArgs.client_id) {
            clientQuery = clientQuery.eq('id', toolArgs.client_id)
          } else if (toolArgs.client_name) {
            clientQuery = clientQuery.ilike('name', `%${toolArgs.client_name}%`)
          } else {
            throw new Error('Informe client_id ou client_name para buscar o cliente.')
          }

          const { data: client, error } = await clientQuery.maybeSingle()
          if (error) throw new Error(error.message)
          if (!client) {
            executionResult = { found: false, message: 'Cliente não encontrado.' }
            break
          }

          // Busca contatos e deals vinculados
          const { data: contacts } = await admin
            .from('client_contacts')
            .select('*')
            .eq('client_id', client.id)

          const { data: deals } = await admin
            .from('deals')
            .select('id, title, mrr_value, setup_fee, status, created_at')
            .eq('client_id', client.id)

          executionResult = {
            found: true,
            client,
            contacts: contacts || [],
            deals: deals || [],
          }
          break
        }

        case 'clientes_create_contact': {
          const { client_id, name, role_title, phone, email, is_decision_maker } = toolArgs
          const { data: contact, error } = await admin
            .from('client_contacts')
            .insert({
              organization_id: token.organization_id,
              client_id,
              name: name.trim(),
              role_title: role_title || 'Contato',
              phone: phone || null,
              email: email || null,
              is_decision_maker: Boolean(is_decision_maker),
            })
            .select()
            .single()

          if (error) throw new Error(error.message)
          executionResult = { success: true, contact }
          break
        }

        // --- AGENTES DE IA ---
        case 'agentes_get_status_overview': {
          const { data: customAgents } = await admin
            .from('custom_agents')
            .select('id, name, role, status')
            .eq('organization_id', token.organization_id)

          const standardAgents = [
            { id: 'a1-sdr', name: 'Agente 01 - SDR WhatsApp', role: 'Qualificação e triagem de leads', status: 'ACTIVE' },
            { id: 'a2-comercial', name: 'Agente 02 - Closer Comercial', role: 'Follow-up e agendamento de reuniões', status: 'ACTIVE' },
            { id: 'a3-onboarding', name: 'Agente 03 - Onboarding CS', role: 'Coleta de briefings e ativação de clientes', status: 'ACTIVE' },
            { id: 'a4-suporte', name: 'Agente 04 - Suporte Técnico', role: 'Resolução de chamados e FAQ corporativo', status: 'ACTIVE' },
            { id: 'a5-reativacao', name: 'Agente 05 - Reativação', role: 'Recuperação de clientes inativos', status: 'ACTIVE' },
          ]

          executionResult = {
            standard_agents: standardAgents,
            custom_agents: customAgents || [],
            total_active: standardAgents.length + (customAgents?.length || 0),
          }
          break
        }

        default:
          throw new Error(`Implementação pendente para ferramenta ${toolName}.`)
      }

      // Registro de Auditoria de Sucesso
      await recordMcpAuditLog({
        organization_id: token.organization_id,
        token_id: token.id,
        tool_name: toolName,
        arguments: toolArgs,
        status: 'SUCCESS',
        execution_time_ms: Date.now() - startTime,
        client_ip: clientIp,
      })

      return NextResponse.json({
        jsonrpc: '2.0',
        id: id ?? null,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(executionResult, null, 2),
            },
          ],
          isError: false,
        },
      })
    } catch (err: any) {
      await recordMcpAuditLog({
        organization_id: token.organization_id,
        token_id: token.id,
        tool_name: toolName,
        arguments: toolArgs,
        status: 'INTERNAL_ERROR',
        execution_time_ms: Date.now() - startTime,
        error_message: err.message || 'Erro inesperado na execução da tool.',
        client_ip: clientIp,
      })

      return NextResponse.json({
        jsonrpc: '2.0',
        id: id ?? null,
        result: {
          content: [
            {
              type: 'text',
              text: `Erro ao executar ${toolName}: ${err.message || 'Falha desconhecida'}`,
            },
          ],
          isError: true,
        },
      })
    }
  }

  // Método não suportado
  return NextResponse.json({
    jsonrpc: '2.0',
    id: id ?? null,
    error: {
      code: -32601,
      message: `Método '${method}' não implementado pelo servidor MCP CoyDash. Suportados: initialize, tools/list, tools/call.`,
    },
  })
}
