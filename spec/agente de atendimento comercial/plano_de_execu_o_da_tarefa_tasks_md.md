# TASKS.md — Plano de Execução: Workflow n8n do Agente WhatsApp + Atendimento Mobile & CRM no CoyDash

**Projeto:** CoyDash (Coytech Studio, Coytech Flow & Coytech Pulse)  
**Banco de Dados:** Supabase (`cbhunupletswkjozcjze`)  
**Design System Obrigatório:** `spec/DESIGN.md` (100% fiel ao ROOMIE OFFICE AI — Zero emojis na UI, 100% Português, Acento `#F0521F`, Tinta `#141414`, Papel `#F4F4F2`, tipografia *Schibsted Grotesk*)

---

## Histórico de Fases Concluídas (Fases 0 a 10)

* [x] **FASE 0 a FASE 8:** Fundação Next.js, Design System ROOMIE OFFICE AI, Schema Base Supabase (`001_coydash_schema_and_rls.sql`), Home (`/`), Studio (`/studio`), Flow (`/flow`), Pulse (`/pulse`), Governança (`/governanca`), Executivo Mobile (`/executivo`), Login (`/login`) e Rotas de API SDD 05.
* [x] **FASE 9:** Conexão Real com Supabase (`cbhunupletswkjozcjze`), Auth SSR completa, Tela de Cadastro (`/cadastro`), Recuperação de Senha e Sincronização limpa via `/api/coydash/sync`.
* [x] **FASE 10:** Central de Clientes 360º (`/clientes`), Sistema de Setores & Tarefas Kanban Drag-and-Drop (`/tarefas` e `/listas/[listId]`), Módulos Operacionais (`/atendimento`, `/trafego-pago`, `/marketing`, `/financeiro`, `/configuracoes`, `/agentes`) e Migration `002_coydash_clients_tasks_and_modules.sql`.

---

## FASE 11 — Execução do Workflow n8n, Tabelas Supabase (`leads` + `n8n_chat_histories`), Tela de Atendimento no Formato Mobile WhatsApp e Criador de Agentes

**Documentos de Especificação (SDDs) desta Fase:**
* `spec/coytech_sdd_06_whatsapp_n8n_agent_architecture.md`
* `spec/coytech_sdd_07_atendimento_mobile_chat_crm_and_agent_builder.md`
* `spec/coytech_sdd_08_n8n_agent_nodes_and_functions_reference.md`

---

### ETAPA 1 — Configuração Operacional do Agente no n8n + Z-API + Supabase (`TASK-11.1`)
- [ ] **TASK-11.1.1 (Importar Workflow no n8n):** Copiar o código JSON da Seção 5 do `SDD 08` e colar (`Ctrl + V`) no canvas do n8n (ou importar via *Import from File*).
- [ ] **TASK-11.1.2 (Conectar Webhook na Z-API):**
  - No Node 1 (`Webhook Z-API`), definir o Path como `mensagem-teste` e copiar a URL.
  - Na Z-API $\rightarrow$ **Instâncias Web** $\rightarrow$ conectar o WhatsApp via QR Code, colar a URL do Webhook no campo **"Ao receber"**, marcar **"Notificar as mensagens enviadas por mim também"** (para testes) e salvar.
- [ ] **TASK-11.1.3 (Conectar `HTTP Request Z-API` no n8n):**
  - No Node 9 (`HTTP Request Z-API`), criar credencial `Header Auth` com `Name: Client-Token` e `Value:` Token de segurança da conta (Z-API $\rightarrow$ Segurança).
  - Substituir a URL pela **API da instância** da Z-API acrescida de `/send-text` e garantir que o campo `message` do Body aponte para `{{ $json.output }}`.
- [ ] **TASK-11.1.4 (Conectar as 2 Credenciais do Supabase no n8n):**
  - Criar a credencial **Supabase API** (`Host: https://cbhunupletswkjozcjze.supabase.co` + `Service Role Secret`) e selecioná-la **tanto** no node `Encontrar Cliente` **quanto** no node `Criar Cliente`.
  - Criar a credencial **Postgres** no sub-node `Postgres Chat Memory` usando os dados de `Connect` $\rightarrow$ `Transaction pooler` do Supabase (Host `aws-0-us-east-1.pooler.supabase.com`, Porta `6543`, User `postgres.cbhunupletswkjozcjze`, Database `postgres`, Senha do banco e **`Ignore SSL Issues = ON`**).

---

### ETAPA 2 — Banco de Dados & Migration `003` no Supabase (`TASK-11.2`)
- [ ] **TASK-11.2.1:** Criar e aplicar a migration `supabase/migrations/003_coydash_whatsapp_n8n_crm_sync.sql` no projeto Supabase (`cbhunupletswkjozcjze`).
- [ ] **TASK-11.2.2:** Criar/validar a tabela `public.leads` com as 4 colunas exigidas pelo n8n (`id` int8 auto, `created_at` timestamptz `now()`, `lead_nome` text, `lead_id` text unique) + colunas operacionais do CoyDash (`organization_id`, `human_takeover`, `orders_count`, `total_spent`, `cashback_balance`).
- [ ] **TASK-11.2.3:** Criar/validar a tabela `public.n8n_chat_histories` (`id`, `session_id`, `message` JSONB) garantindo a coluna **`hora_data_mensagem`** do tipo **`timestamptz`** com **`DEFAULT now()`**.
- [ ] **TASK-11.2.4:** Criar a tabela `public.client_ai_memories` (`pgvector`) para a coluna direita da tela `/atendimento` e ativar **Supabase Realtime** para `leads`, `n8n_chat_histories` e `client_ai_memories`.

---

### ETAPA 3 — Rotas de API Backend no CoyDash (`TASK-11.3`)
- [ ] **TASK-11.3.1:** Criar `GET /api/whatsapp/conversations` (`src/app/api/whatsapp/conversations/route.ts`) fazendo o cruzamento `leads.lead_id = n8n_chat_histories.session_id`.
- [ ] **TASK-11.3.2:** Criar `GET /api/whatsapp/messages` (`src/app/api/whatsapp/messages/route.ts`) retornando as mensagens de `n8n_chat_histories` ordenadas por `hora_data_mensagem ASC` (mensagens mais recentes no final da lista).
- [ ] **TASK-11.3.3:** Criar `POST /api/whatsapp/send` (`src/app/api/whatsapp/send/route.ts`) para enviar mensagens pelo campo `Responder como atendente...` e pelo botão `Simular Áudio Cliente`, salvando em `n8n_chat_histories` com `hora_data_mensagem = now()` e disparando na Z-API (`/send-text`).
- [ ] **TASK-11.3.4:** Criar `PATCH /api/whatsapp/takeover` (`src/app/api/whatsapp/takeover/route.ts`) para o botão **`Assumir conversa`** alternar `leads.human_takeover` no Supabase.
- [ ] **TASK-11.3.5:** Criar `POST /api/agents/export-n8n` (`src/app/api/agents/export-n8n/route.ts`) para exportar o JSON do workflow do n8n configurado pelo usuário direto da tela `/agentes`.

---

### ETAPA 4 — Atualização da Tela de Atendimento (`/atendimento`), CRM (`/clientes`) e Agentes (`/agentes`) (`TASK-11.4`)
- [ ] **TASK-11.4.1 (Chat Mobile WhatsApp no Painel Central de `/atendimento`):**
  - Refatorar `src/app/atendimento/page.tsx` mantendo as 3 colunas da sua tela atual, inserindo no centro o **Viewport Mobile estilo WhatsApp** (`412px–460px` com opção de expandir).
  - Agrupar todas as mensagens por data (`Hoje`, `Ontem`, `DD/MM/AAAA`) usando `hora_data_mensagem`.
  - Posicionar mensagens do Lead (`human`) à **esquerda** e mensagens do Agente/Atendente (`ai`/`operator`) à **direita**, exibindo o horário `HH:mm` embaixo de cada balão e mantendo as **mensagens mais recentes sempre na parte inferior do scroll** (auto-scroll para baixo).
- [ ] **TASK-11.4.2 (Ações e Painel Direito de CRM + `pgvector` em `/atendimento`):**
  - Conectar os botões `Simular Áudio Cliente`, `Assumir conversa` / `Devolver para IA` e `Excluir conversa`.
  - Conectar os 3 indicadores do cliente (`pedidos`, `gasto`, `cashback`), seletor de etapa do funil CRM e lista de `Memória da IA (pgvector)` com input `Nova memória deste cliente...`.
- [ ] **TASK-11.4.3 (Construtor e Exportador do Workflow n8n em `/agentes`):**
  - Adicionar em `src/app/agentes/page.tsx` o configurador de Prompt do Sistema, credenciais Z-API (`API da instância` + `Client-Token` + Webhook), status das tabelas `leads` / `n8n_chat_histories` e botão **"Baixar / Copiar JSON do Agente para n8n"**.
- [ ] **TASK-11.4.4 (Sincronização com `/clientes` e Validação Final):**
  - Sincronizar os leads do WhatsApp com a Central de Clientes 360º (`/clientes`), validar `npx tsc --noEmit` (0 erros), `npm run build` e registrar a conclusão no `MEMORY.md`.