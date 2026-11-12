import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      agentName = 'Agente Comercial SDR 24h · CoyDash',
      llmProvider = 'OPENAI',
      llmModel = 'gpt-4o-mini',
      systemPrompt = 'Você é o Agente Comercial Oficial da Coytech. Responda de forma cordial, objetiva e consultiva em português. Qualifique o cliente, apresente nossos serviços e, caso o cliente peça para falar com um especialista humano, avise que já acionou a equipe.',
      zapiInstanceUrl = 'https://api.z-api.io/instances/SUA_INSTANCIA_ID/token/SEU_TOKEN_INSTANCIA',
      zapiClientToken = 'SEU_CLIENT_TOKEN_ZAPI',
      webhookPath = 'whatsapp-inbound',
      ignoreGroups = true,
      respectHumanTakeover = true,
      contextWindowLength = 15,
    } = body

    const cleanZapiUrl = zapiInstanceUrl.endsWith('/send-text')
      ? zapiInstanceUrl
      : `${zapiInstanceUrl.replace(/\/$/, '')}/send-text`

    const workflowJson = {
      name: `${agentName} (Z-API + Supabase + CoyDash CRM)`,
      nodes: [
        {
          parameters: {
            httpMethod: 'POST',
            path: webhookPath,
            options: {},
          },
          id: 'node-1-webhook-zapi',
          name: '1. Webhook (Z-API Ao Receber)',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 2,
          position: [220, 300],
        },
        {
          parameters: {
            conditions: {
              options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
              },
              conditions: [
                ...(ignoreGroups
                  ? [
                      {
                        id: 'cond-is-group',
                        leftValue: '={{ $json.body.isGroup }}',
                        rightValue: false,
                        operator: {
                          type: 'boolean',
                          operation: 'equals',
                        },
                      },
                    ]
                  : []),
                {
                  id: 'cond-has-text',
                  leftValue: '={{ $json.body.text.message }}',
                  rightValue: '',
                  operator: {
                    type: 'string',
                    operation: 'notEmpty',
                  },
                },
              ],
              combinator: 'and',
            },
          },
          id: 'node-2-filter-activation',
          name: '2. Critérios de Ativação',
          type: 'n8n-nodes-base.filter',
          typeVersion: 2,
          position: [440, 300],
        },
        {
          parameters: {
            assignments: {
              assignments: [
                {
                  id: 'field-lead-id',
                  name: 'lead_id',
                  value: '={{ String($json.body.phone) }}',
                  type: 'string',
                },
                {
                  id: 'field-lead-nome',
                  name: 'lead_nome',
                  value:
                    "={{ $json.body.senderName || $json.body.chatName || 'Cliente WhatsApp' }}",
                  type: 'string',
                },
                {
                  id: 'field-mensagem-lead',
                  name: 'mensagem_lead',
                  value: '={{ $json.body.text.message }}',
                  type: 'string',
                },
                {
                  id: 'field-foto-perfil',
                  name: 'foto_perfil',
                  value: "={{ $json.body.photo || '' }}",
                  type: 'string',
                },
              ],
            },
            options: {},
          },
          id: 'node-3-set-lead-info',
          name: '3. Informações do Lead',
          type: 'n8n-nodes-base.set',
          typeVersion: 3.4,
          position: [660, 300],
        },
        {
          parameters: {
            operation: 'get',
            tableId: 'leads',
            filters: {
              conditions: [
                {
                  keyName: 'lead_id',
                  keyValue: "={{ $('3. Informações do Lead').item.json.lead_id }}",
                },
              ],
            },
          },
          alwaysOutputData: true,
          id: 'node-4-supabase-get-lead',
          name: '4. Encontrar Cliente (Supabase)',
          type: 'n8n-nodes-base.supabase',
          typeVersion: 1,
          position: [880, 300],
        },
        {
          parameters: {
            conditions: {
              conditions: [
                {
                  id: 'cond-lead-exists',
                  leftValue: '={{ $json.lead_id }}',
                  rightValue: '',
                  operator: {
                    type: 'string',
                    operation: 'exists',
                  },
                },
              ],
            },
          },
          id: 'node-5a-if-lead-exists',
          name: '5A. Cliente Existe?',
          type: 'n8n-nodes-base.if',
          typeVersion: 2,
          position: [1100, 300],
        },
        {
          parameters: {
            tableId: 'leads',
            fieldsUi: {
              fieldValues: [
                {
                  fieldId: 'lead_id',
                  fieldValue: "={{ $('3. Informações do Lead').item.json.lead_id }}",
                },
                {
                  fieldId: 'lead_nome',
                  fieldValue: "={{ $('3. Informações do Lead').item.json.lead_nome }}",
                },
                {
                  fieldId: 'human_takeover',
                  fieldValue: 'false',
                },
              ],
            },
          },
          id: 'node-5b-supabase-create-lead',
          name: '5B. Criar Cliente em `leads`',
          type: 'n8n-nodes-base.supabase',
          typeVersion: 1,
          position: [1320, 420],
        },
        {
          parameters: {
            promptType: 'define',
            text: "={{ $('3. Informações do Lead').item.json.mensagem_lead }}",
            options: {
              systemMessage: systemPrompt,
              passthroughBinaryImages: true,
            },
          },
          id: 'node-6-ai-agent',
          name: '6. AI Agent (CoyDash 24h)',
          type: '@n8n/n8n-nodes-langchain.agent',
          typeVersion: 1.7,
          position: [1560, 300],
        },
        {
          parameters: {
            model: llmModel,
            options: {
              temperature: 0.4,
            },
          },
          id: 'node-6a-llm-model',
          name: `Chat Model (${llmProvider} · ${llmModel})`,
          type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
          typeVersion: 1,
          position: [1500, 520],
        },
        {
          parameters: {
            sessionIdType: 'customKey',
            sessionKey: "={{ $('3. Informações do Lead').item.json.lead_id }}",
            tableName: 'n8n_chat_histories',
            contextWindowLength: Number(contextWindowLength) || 15,
          },
          id: 'node-6b-postgres-memory',
          name: 'Postgres Chat Memory (`n8n_chat_histories`)',
          type: '@n8n/n8n-nodes-langchain.memoryPostgresChat',
          typeVersion: 1.3,
          position: [1680, 520],
        },
        {
          parameters: {
            method: 'POST',
            url: cleanZapiUrl,
            sendHeaders: true,
            headerParameters: {
              parameters: [
                {
                  name: 'Client-Token',
                  value: zapiClientToken,
                },
              ],
            },
            sendBody: true,
            bodyParameters: {
              parameters: [
                {
                  name: 'phone',
                  value: "={{ $('3. Informações do Lead').item.json.lead_id }}",
                },
                {
                  name: 'message',
                  value: '={{ $json.output }}',
                },
              ],
            },
            options: {},
          },
          id: 'node-7-http-zapi-send',
          name: '7. Enviar Resposta via Z-API',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 4.2,
          position: [1840, 300],
        },
        {
          parameters: {},
          id: 'node-8-no-op',
          name: '8. Fim do Fluxo',
          type: 'n8n-nodes-base.noOp',
          typeVersion: 1,
          position: [2060, 300],
        },
      ],
      connections: {
        '1. Webhook (Z-API Ao Receber)': {
          main: [[{ node: '2. Critérios de Ativação', type: 'main', index: 0 }]],
        },
        '2. Critérios de Ativação': {
          main: [[{ node: '3. Informações do Lead', type: 'main', index: 0 }]],
        },
        '3. Informações do Lead': {
          main: [[{ node: '4. Encontrar Cliente (Supabase)', type: 'main', index: 0 }]],
        },
        '4. Encontrar Cliente (Supabase)': {
          main: [[{ node: '5A. Cliente Existe?', type: 'main', index: 0 }]],
        },
        '5A. Cliente Existe?': {
          main: [
            [{ node: '6. AI Agent (CoyDash 24h)', type: 'main', index: 0 }],
            [{ node: '5B. Criar Cliente em `leads`', type: 'main', index: 0 }],
          ],
        },
        '5B. Criar Cliente em `leads`': {
          main: [[{ node: '6. AI Agent (CoyDash 24h)', type: 'main', index: 0 }]],
        },
        '6. AI Agent (CoyDash 24h)': {
          main: [[{ node: '7. Enviar Resposta via Z-API', type: 'main', index: 0 }]],
        },
        '7. Enviar Resposta via Z-API': {
          main: [[{ node: '8. Fim do Fluxo', type: 'main', index: 0 }]],
        },
      },
      meta: {
        coydash_version: '2.0',
        supabase_project_ref: 'cbhunupletswkjozcjze',
        pooler_host: 'aws-0-us-east-1.pooler.supabase.com',
        pooler_port: 6543,
        respect_human_takeover: respectHumanTakeover,
      },
    }

    return NextResponse.json({ workflow: workflowJson })
  } catch (err) {
    console.error('Erro em POST /api/agents/export-n8n:', err)
    return NextResponse.json({ error: 'Falha ao gerar workflow n8n' }, { status: 500 })
  }
}

