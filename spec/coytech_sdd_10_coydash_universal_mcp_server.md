# SDD 10: Servidor Universal Model Context Protocol (MCP) e Governança de Tokens de IA (CoyDash Universal MCP Server)

> **Documento:** `spec/coytech_sdd_10_coydash_universal_mcp_server.md`  
> **Status:** **Implementado & Validado com 100% de Sucesso (Fase 13 - TASK-13.7)**  
> **Referências:**  
> - [`TASKS.md`](../TASKS.md) (TASK-13.7)  
> - [`coytech_sdd_05_modelagem_banco_de_dados_e_apis.md`](./coytech_sdd_05_modelagem_banco_de_dados_e_apis.md)  
> - [`coytech_sdd_08_crm_twenty_reverse_engineering.md`](./coytech_sdd_08_crm_twenty_reverse_engineering.md)  
> - Protocolo Oficial: [Model Context Protocol (MCP) Specification (JSON-RPC 2.0)](https://modelcontextprotocol.io/)

---

## 1. Visão Geral e Justificativa Estratégica

Com o crescimento do ecossistema CoyDash, agentes de Inteligência Artificial autônomos (como Claude Desktop, Cursor, agentes locais, automações n8n e assistentes customizados) precisam consultar, analisar e operar o CRM, o atendimento WhatsApp, tarefas de equipe e dados de clientes via **linguagem natural**.

No entanto, conceder acesso irrestrito de banco de dados ou credenciais administrativas a LLMs representa um risco crítico de **alucinações, vazamento de dados confidenciais e mutações destrutivas acidentais** (ex: deletar clientes, limpar listas ou alterar status indevidamente).

O **CoyDash Universal MCP Server** resolve esse desafio estabelecendo uma camada de intermediação **100% segura, padronizada e auditada**, baseada na especificação oficial do **Model Context Protocol (MCP)** sobre HTTP com autenticação Bearer Token, escopos granulares de permissão (RBAC) e trava anti-destruição.

---

## 2. Princípios de Segurança & Trava Anti-Alucinação (Guardrails)

```
┌─────────────────────────────────────────────────────────────┐
│ Agentes Externos (Claude Desktop / Cursor / n8n / Agentes)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON-RPC 2.0 (Bearer Token)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│           Endpoint Oficial: POST /api/mcp                  │
├─────────────────────────────────────────────────────────────┤
│ 1. Autenticação por Token Criptografado (SHA-256)           │
│ 2. Validação de Escopos (RBAC: atendimento, tarefas, etc.)  │
│ 3. Trava Anti-Destruição (Bloqueio de Drops/Deletes Críticos)│
│ 4. Rate-Limiting por Minuto                                 │
│ 5. Trilha de Auditoria Imutável (mcp_audit_logs)            │
└──────────────────────────────┬──────────────────────────────┘
                               │ Execução Controlada
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Banco Supabase PostgreSQL (Tabelas Isoladas por Tenant)   │
└─────────────────────────────────────────────────────────────┘
```

### 2.1. Regras Pétreas de Segurança (Non-Negotiable Invariants)
1. **Chaves com Hash Criptográfico no Banco:** Os tokens são gerados no formato `coydash_mcp_live_[random32]` e gravados no banco exclusivamente como hash **SHA-256**. O token em texto claro é exibido ao administrador **apenas uma vez** no momento da geração.
2. **Escopos Granulares Obrigatórios (`allowed_scopes`):** Toda tool exige um escopo específico. Uma IA conectada com escopo `atendimento:read` é sumariamente rejeitada com erro HTTP 403 se tentar alterar um deal no Comercial ou excluir uma tarefa.
3. **Imutabilidade e Trava Anti-Destruição:**
   - O servidor MCP **NUNCA** expõe ferramentas para deletar organizações, apagar clientes inteiros, truncar tabelas ou excluir contas de usuários.
   - Qualquer operação de exclusão permitida (ex: remover uma tarefa de teste) exige escopo explícito `tarefas:delete` e gera log com o autor e justificativa.
4. **Isolamento Multi-Tenant Estrito:** Todas as consultas e mutações são forçadas e filtradas pela `organization_id` atrelada à chave de API, impedindo qualquer vazamento entre diferentes empresas.
5. **Auditoria em Tempo Real (`mcp_audit_logs`):** Cada chamada JSON-RPC (método, ferramenta, parâmetros, tempo de resposta em milissegundos e status de sucesso/erro) é persistida de forma imutável.

---

## 3. Catálogo Unificado de Ferramentas (16 MCP Tools Oficiais)

O servidor expõe um conjunto cirúrgico de **16 ferramentas especializadas** cobrindo todos os módulos do Dashbording:

### 3.1. Módulo: Atendimento & WhatsApp (`/atendimento`)
| Tool MCP | Escopo Exigido | Descrição |
| :--- | :--- | :--- |
| `atendimento_list_conversations` | `atendimento:read` | Lista as conversas e leads de WhatsApp com filtro por estágio comercial e paginação. |
| `atendimento_get_chat_history` | `atendimento:read` | Retorna o histórico cronológico de mensagens e memórias de IA de uma conversa específica. |
| `atendimento_update_lead_stage` | `atendimento:write` | Atualiza o estágio comercial de um lead (ex: `NOVO` -> `QUALIFICADO` -> `REUNIAO_AGENDADA`). |
| `atendimento_toggle_human_takeover` | `atendimento:write` | Pausa ou retoma o atendimento autônomo da IA (Agente 01 SDR) para intervenção de atendente humano. |

### 3.2. Módulo: Comercial & Funil de Vendas (`/comercial`)
| Tool MCP | Escopo Exigido | Descrição |
| :--- | :--- | :--- |
| `comercial_get_pipeline_summary` | `comercial:read` | Retorna resumo executivo: pipeline total (MRR), setup fee, forecast ponderado e negócios ativos. |
| `comercial_list_deals` | `comercial:read` | Lista oportunidades com filtros por funil, estágio, faixa de valor de MRR e responsável. |
| `comercial_create_deal` | `comercial:write` | Cria nova oportunidade no funil de vendas, vinculando automaticamente ao lead no WhatsApp. |
| `comercial_update_deal_stage` | `comercial:write` | Avança ou retrocede o estágio de um deal no Kanban com registro automático na timeline. |
| `comercial_convert_deal_to_client` | `comercial:write` | Converte um negócio ganho em Cliente 360º com 1 clique, criando o cliente e o contato decisor. |

### 3.3. Módulo: Tarefas, Projetos & Setores (`/tarefas` e `/listas/[listId]`)
| Tool MCP | Escopo Exigido | Descrição |
| :--- | :--- | :--- |
| `tarefas_list_tasks` | `tarefas:read` | Lista tarefas com suporte a filtros por lista, status, responsável, prioridade ou "Modo Eu". |
| `tarefas_create_task` | `tarefas:write` | Cria uma nova tarefa com título, descrição, prioridade, data de entrega e múltiplos responsáveis. |
| `tarefas_update_task_status` | `tarefas:write` | Altera o status da tarefa no Kanban (ex: `TODO` -> `IN_PROGRESS` -> `DONE`). |
| `tarefas_add_comment` | `tarefas:write` | Insere comentário ou parecer técnico no chat lateral da tarefa. |

### 3.4. Módulo: Central de Clientes 360º (`/clientes`)
| Tool MCP | Escopo Exigido | Descrição |
| :--- | :--- | :--- |
| `clientes_get_client_360` | `clientes:read` | Retorna a ficha cadastral completa do cliente: dados contratuais, MRR, NPS, contatos e integrações. |
| `clientes_create_contact` | `clientes:write` | Adiciona um contato à empresa com cargo, e-mail, celular/WhatsApp e selo de tomador de decisão. |

### 3.5. Módulo: Agentes de IA & Equipe (`/flow` e `/colaboradores`)
| Tool MCP | Escopo Exigido | Descrição |
| :--- | :--- | :--- |
| `agentes_get_status_overview` | `agentes:read` | Retorna o status de prontidão e entregas do dia dos 5 Agentes de IA (A1 a A5) e filas do Studio. |

---

## 4. Modelagem de Banco de Dados (Migration `009`)

```sql
-- 1. Tabela de Tokens de Acesso ao Servidor MCP
CREATE TABLE IF NOT EXISTS public.mcp_api_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by_user_id UUID NULL,
    name TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    token_prefix TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'OPERATOR' CHECK (role IN ('READ_ONLY', 'OPERATOR', 'MANAGER', 'ADMIN')),
    allowed_scopes JSONB NOT NULL DEFAULT '["atendimento:read", "comercial:read", "tarefas:read", "clientes:read"]'::jsonb,
    rate_limit_per_minute INT NOT NULL DEFAULT 60,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    last_used_at TIMESTAMPTZ NULL,
    expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabela de Auditoria Imutável de Chamadas MCP
CREATE TABLE IF NOT EXISTS public.mcp_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    token_id UUID NULL REFERENCES public.mcp_api_tokens(id) ON DELETE SET NULL,
    tool_name TEXT NOT NULL,
    arguments JSONB NULL,
    status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FORBIDDEN', 'VALIDATION_ERROR', 'INTERNAL_ERROR')),
    execution_time_ms INT NOT NULL DEFAULT 0,
    error_message TEXT NULL,
    client_ip TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de Alta Performance
CREATE INDEX IF NOT EXISTS idx_mcp_tokens_org ON public.mcp_api_tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_mcp_tokens_hash ON public.mcp_api_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_mcp_audit_org_created ON public.mcp_audit_logs(organization_id, created_at DESC);
```

---

## 5. Integração com Claude Desktop, Cursor e Agentes Externos

### 5.1. Claude Desktop (`claude_desktop_config.json`)
No Windows, o arquivo fica em: `%APPDATA%\Claude\claude_desktop_config.json`  
No macOS, em: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "coydash": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "http://localhost:3005/api/mcp"],
      "env": {
        "COYDASH_MCP_TOKEN": "coydash_mcp_live_e8f29402948204918230948209384029"
      }
    }
  }
}
```

### 5.2. Cursor IDE (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "coydash-mcp": {
      "url": "http://localhost:3005/api/mcp",
      "headers": {
        "Authorization": "Bearer coydash_mcp_live_e8f29402948204918230948209384029"
      }
    }
  }
}
```

---

## 6. Guia Completo de Testes e Validação

### 6.1. Opção 1: Teste Visual pelo Navegador (UI de Governança)
1. **Acesso:** Abra o navegador em [http://localhost:3005/colaboradores](http://localhost:3005/colaboradores).
2. **Seletor de Abas:** No topo da página, clique na aba **"Tokens de IA & MCP"** (destaque com badge "Governança").
3. **Novo Token:** Clique no botão superior direito **"+ Novo Token de IA"**.
4. **Configuração da Chave:**
   - Preencha o nome (ex: `Claude Desktop Local` ou `Assistente N8N`).
   - Escolha o perfil de acesso (`Operador`, `Somente Leitura`, `Gerente` ou `Administrador`).
   - Selecione os escopos permitidos pelos chips interativos.
   - Escolha a validade (30 dias, 90 dias, 1 ano ou sem expiração).
5. **Geração & Cópia Segura:** Clique em **"Criar Token com Hash SHA-256"**.
   - A chave gerada (`coydash_mcp_live_...`) será exibida em destaque com botão de cópia.
   - Ela **nunca mais** será mostrada no banco ou na interface.
6. **Revogação Instantânea:** Na lista de tokens, clique no botão **"Revogar"** para suspender o acesso imediatamente de qualquer agente conectado àquela chave.

### 6.2. Opção 2: Teste Automatizado End-to-End pelo Terminal
O projeto conta com uma suíte de testes completa em [`scripts/test-mcp.mjs`](file:///c:/Espaço%20de%20Trabalho/Coytech/PORJETOS/Dashbording/scripts/test-mcp.mjs). Para rodar:

```powershell
node scripts/test-mcp.mjs
```

**Resultado esperado:**
- Handshake `initialize` retorna HTTP 200 e protocolo MCP `2024-11-05`.
- `tools/list` com token restrito lista apenas as ferramentas autorizadas para aquele escopo.
- `tools/call` com `comercial_get_pipeline_summary` consulta o Supabase ao vivo e retorna métricas em tempo real (`active_deals_count`, `total_open_mrr`, `weighted_forecast_mrr`).
- Trava de proteção RBAC: ao tentar executar ferramenta sem escopo (`tarefas_create_task` com token `comercial:read`), o servidor retorna `isError: true` com erro **403 Forbidden**.
- Verificação da tabela `public.mcp_audit_logs` comprovando que todas as requisições geraram registros de auditoria com milissegundos e status.

### 6.3. Opção 3: Teste via cURL / HTTP Manual

#### Handshake `initialize`
```bash
curl -X POST http://localhost:3005/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer coydash_mcp_live_teste_master_1234567890abcdef" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize"
  }'
```

#### Listagem de Ferramentas Autorizadas `tools/list`
```bash
curl -X POST http://localhost:3005/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer coydash_mcp_live_teste_master_1234567890abcdef" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list"
  }'
```

#### Consulta de Pipeline Comercial `tools/call`
```bash
curl -X POST http://localhost:3005/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer coydash_mcp_live_teste_master_1234567890abcdef" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "comercial_get_pipeline_summary",
      "arguments": {}
    }
  }'
```

---

## 7. Arquitetura Implementada & Arquivos do Sistema

| Arquivo | Papel no Sistema |
| :--- | :--- |
| `supabase/migrations/009_coydash_universal_mcp_and_api_tokens.sql` | Migration SQL criando `mcp_api_tokens` e `mcp_audit_logs`. |
| `scripts/apply-migration-009.mjs` | Script de aplicação da migration remota no Supabase PostgreSQL. |
| `src/types/mcp.ts` | Declaração TypeScript dos tipos de Tokens, Roles, Escopos e JSON-RPC. |
| `src/lib/mcp-auth.ts` | Motor de geração de tokens, hash SHA-256, RBAC e auditoria. |
| `src/app/api/mcp/route.ts` | Endpoint oficial JSON-RPC 2.0 com as 16 ferramentas e isolamento multi-tenant. |
| `src/app/api/mcp/tokens/route.ts` | Rota REST protegida para CRUD e revogação de tokens de IA pela UI. |
| `src/components/colaboradores/mcp-tokens-tab.tsx` | Componente visual no Design System Roomie Office AI para gestão de chaves. |
| `src/app/colaboradores/page.tsx` | Tela de Colaboradores com seletor de abas integrando a Governança de Tokens. |
| `scripts/test-mcp.mjs` | Suíte de testes automatizados end-to-end do MCP Server. |

---

## 8. Checklist de Conclusão (Fase 13 - TASK-13.7)

- [x] Criar migração SQL `009_coydash_universal_mcp_and_api_tokens.sql` e aplicar no PostgreSQL remoto do Supabase.
- [x] Implementar validador de tokens com hash SHA-256 e controle de escopos (`src/lib/mcp-auth.ts`).
- [x] Criar Route Handler MCP [`src/app/api/mcp/route.ts`](../src/app/api/mcp/route.ts) atendendo `initialize`, `tools/list` e `tools/call`.
- [x] Implementar as 16 ferramentas oficiais cobrindo Atendimento, Comercial, Tarefas, Clientes e Agentes.
- [x] Criar componente visual de Gerenciamento de Tokens de IA em `/colaboradores` (`src/components/colaboradores/mcp-tokens-tab.tsx`).
- [x] Validar testes de chamadas JSON-RPC com `scripts/test-mcp.mjs` e checagem de tipos `npx tsc --noEmit` (0 erros).
