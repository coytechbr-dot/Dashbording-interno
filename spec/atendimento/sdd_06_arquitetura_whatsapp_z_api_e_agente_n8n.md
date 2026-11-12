# SDD 06 — Análise Arquitetural do Vídeo, Motor de Agentes no n8n, Conexão WhatsApp (Z-API) e Persistência Supabase no CoyDash

**Projeto:** CoyDash (Ecossistema Coytech — Pilares *Coytech Studio*, *Coytech Flow* e *Coytech Pulse*)  
**Módulos Afetados:** `/atendimento`, `/agentes`, `/flow`, `/clientes`, `/configuracoes`  
**Banco de Dados Alvo:** Supabase PostgreSQL 16 + `pgvector` (`cbhunupletswkjozcjze`)  
**Padrão Visual Obrigatório:** 100% fiel ao `spec/DESIGN.md` (ROOMIE OFFICE AI — Acento único `#F0521F`, Tinta `#141414`, Papel `#F4F4F2`, tipografia *Schibsted Grotesk*, zero emojis na interface, 100% em Português).

---

## 1. Análise Técnica Completa do Vídeo de Referência

O vídeo demonstra a construção de uma arquitetura **Agente de IA para WhatsApp + CRM Visual em Tempo Real** utilizando **Z-API + n8n + Supabase (PostgreSQL) + Front-end Web**. Abaixo está a decomposição exata do que é ensinado no vídeo e como cada peça é elevada para o padrão **SaaS Multi-Tenant do CoyDash**:

### 1.1. O Problema de Negócio Resolvido
* **Dor na operação tradicional:** Quando se vende apenas um "bot" de WhatsApp, os sócios da empresa cliente e o time comercial precisam conectar o mesmo WhatsApp Web em vários computadores (o que desconecta sessões, impede auditoria e inviabiliza acompanhar dezenas de clientes simultaneamente).
* **Solução de Alto Valor Percebido:** Desacoplar o motor conversacional (n8n + Z-API) da visualização e operação humana, gravando **100% dos leads e do histórico de mensagens no Supabase** e exibindo tudo em um **CRM com Inbox Ao Vivo no formato WhatsApp**, protegido por autenticação (`Supabase Auth`) e com opção de intervenção humana (*Transbordo / Assumir conversa*).

### 1.2. Arquitetura do Fluxo no Vídeo vs. Evolução no CoyDash

| Componente | Como funciona no Vídeo (Single-Tenant) | Como deve funcionar no CoyDash (SaaS Multi-Tenant) |
| :--- | :--- | :--- |
| **Gateway WhatsApp** | Instância Web na **Z-API** conectada via QR Code, disparando Webhook em *"Ao receber"* e enviando respostas via endpoint REST da instância com header `Client-Token`. | Mesma mecânica **Z-API** (ou Evolution API compatível), porém parametrizada por `organization_id` na tabela `organization_settings` ou por instância de agente, permitindo conectar via QR Code direto na tela do SaaS. |
| **Orquestrador de IA** | **n8n** com 8 etapas: Webhook $\rightarrow$ Filtros de Ativação $\rightarrow$ Dados do Lead $\rightarrow$ Busca/Criação na tabela `leads` $\rightarrow$ AI Agent (OpenAI/Gemini/Groq + Postgres Chat Memory) $\rightarrow$ HTTP Request Z-API. | Mesmo fluxo no **n8n (Coytech Flow)** enriquecido com `organization_id`, verificação da flag `human_takeover` (se o atendente humano clicou em *"Assumir conversa"*, a IA não responde automaticamente) e consulta/gravação na memória vetorial (`pgvector`). |
| **Tabela de Clientes/Leads** | Tabela `leads` no Supabase com 4 colunas: `id` (int8 auto), `created_at` (timestamptz `now()`), `lead_nome` (text) e `lead_id` (text = telefone). | Sincronização bidirecional entre a tabela `leads` (compatível nativamente com o fluxo n8n do vídeo) e as tabelas `clients` e `whatsapp_conversations` já existentes na migration `002` do CoyDash, usando o telefone (`lead_id` / `session_id`) como chave de cruzamento. |
| **Histórico de Chat** | Tabela `n8n_chat_histories` criada automaticamente pelo node *Postgres Chat Memory* (`id`, `session_id`, `message` JSONB) acrescida manualmente da coluna `hora_data_mensagem` (`TIMESTAMPTZ DEFAULT now()`). | Tabela `n8n_chat_histories` com `hora_data_mensagem TIMESTAMPTZ DEFAULT now()`, `organization_id UUID` e suporte a **Supabase Realtime** para atualizar o chat mobile na tela `/atendimento` instantaneamente sem recarregar a página. |
| **Segurança e Acesso** | Login com e-mail e senha provisionados no painel de Authentication do Supabase (sem auto-cadastro aberto na tela de chat avulsa). | Autenticação SSR já implementada no CoyDash (`/login`, `/cadastro`, RLS por `public.has_org_access(organization_id)`). |

---

## 2. Guia Passo a Passo: Do Download do n8n até a Criação Completa do Agente

Esta seção documenta o procedimento operacional padrão (SOP) para instalar o n8n do zero, configurar as credenciais e construir o Agente Comercial integrado ao CoyDash.

### Passo 2.1. Como Baixar, Instalar e Rodar o n8n

Você pode rodar o **n8n** localmente (para desenvolvimento junto com o `localhost:3005` do CoyDash) ou em servidor VPS/Docker (produção do **Coytech Flow**):

#### Opção A — Instalação Rápida via Node.js (`npx` ou `npm`) no Computador Local
1. Certifique-se de ter o **Node.js (versão 18.17+ ou 20 LTS)** instalado.
2. No terminal, execute diretamente sem precisar instalar globalmente:
   ```bash
   npx n8n
   ```
   Ou instale globalmente:
   ```bash
   npm install -g n8n
   n8n start
   ```
3. Acesse o painel do n8n no navegador em: `http://localhost:5678`.
4. **Importante para Webhooks Locais (Z-API):** Como a Z-API está na nuvem e precisa enviar requisições para o seu n8n local, inicie o n8n com túnel ativo durante os testes locais:
   ```bash
   npx n8n start --tunnel
   ```

#### Opção B — Instalação Recomendada via Docker (Desenvolvimento ou Produção VPS/Hostinger)
1. Crie um volume persistente e suba o container oficial do n8n:
   ```bash
   docker volume create n8n_data

   docker run -it --rm \
     --name n8n \
     -p 5678:5678 \
     -e GENERIC_TIMEZONE="America/Sao_Paulo" \
     -e TZ="America/Sao_Paulo" \
     -v n8n_data:/home/node/.n8n \
     docker.n8n.io/n8nio/n8n
   ```

---

### Passo 2.2. Como Importar ou Criar a Estrutura do Fluxo no n8n

Dentro do painel do n8n (`http://localhost:5678`):
1. Clique em **Add Workflow** (novo fluxo vazio).
2. Para importar um template JSON pronto:
   * Clique no menu de três pontos (`...`) no canto superior direito $\rightarrow$ **Import from File** e selecione o arquivo `.json` do agente; **OU**
   * Copie o código JSON do fluxo e pressione `Ctrl + V` diretamente sobre o canvas vazio do n8n.

#### Topologia Exata dos 8 Nodes do Fluxo do Agente no n8n:

```
[1. Webhook (Z-API)] 
       │
       ▼
[2. Switch / Filter: Critérios de Ativação] ──(Ignora Grupos / Status / Human Takeover)
       │
       ▼
[3. Edit Fields (Set): Informações do Lead] ──(Extrai lead_id, lead_nome, texto_mensagem, foto)
       │
       ▼
[4. Supabase: Encontrar Cliente (GET em `leads` por `lead_id`)]
       │
       ├─► [5A. IF Cliente Não Existe] ──► [5B. Supabase: Criar Cliente (CREATE em `leads`)]
       │                                           │
       ◄───────────────────────────────────────────┘
       │
       ▼
[6. AI Agent (Tools Agent)]
    ├── Chat Model: OpenAI (gpt-4o-mini / gpt-4o) ou Gemini / Groq
    ├── Memory: Postgres Chat Memory (Tabela: `n8n_chat_histories`, Session Key: `lead_id`)
    └── Tool (Opcional CoyDash): Vector Store Supabase (`pgvector` Memória do Cliente)
       │
       ▼
[7. HTTP Request: Enviar Resposta via Z-API]
       │
       ▼
[8. No Operation, do nothing (Fim do Fluxo)]
```

---

### Passo 2.3. Configuração Detalhada de Cada Node no n8n

#### Node 1: `Webhook` (Recepção de Mensagens da Z-API)
* **HTTP Method:** `POST`
* **Path:** `mensagem-teste` (durante homologação) ou `whatsapp-inbound` (em produção).
* **URL gerada pelo n8n:**
  * *Test URL:* `https://<seu-dominio-n8n>/webhook-test/mensagem-teste`
  * *Production URL:* `https://<seu-dominio-n8n>/webhook/mensagem-teste`

#### Node 2: `Filter / If` (Critérios de Ativação)
Impede que o agente responda em grupos, transmissões ou quando um atendente humano do CoyDash assumiu a conversa:
* Condição 1 (`isGroup`): `{{ $json.body.isGroup }}` **is false**
* Condição 2 (`fromMe` em produção): `{{ $json.body.fromMe }}` **is false** *(Nota: durante testes com 1 único aparelho celular, pode-se permitir `fromMe` marcando "Notificar mensagens enviadas por mim também" na Z-API, mas em produção deve ser bloqueado para evitar loop infinito)*.
* Condição 3 (`texto válido`): `{{ $json.body.text.message }}` **is not empty**.

#### Node 3: `Edit Fields (Set)` (Compilado de Informações do Lead)
Normaliza o payload da Z-API para campos limpos que serão usados em todo o resto do fluxo:
* `lead_id` (String): `{{ $json.body.phone }}` *(Ex: `"5511988771234"` — sempre tratado como texto/string, nunca número, pois não sofre cálculo matemático)*.
* `lead_nome` (String): `{{ $json.body.senderName || $json.body.chatName || 'Cliente WhatsApp' }}`
* `mensagem_lead` (String): `{{ $json.body.text.message }}`
* `foto_perfil` (String): `{{ $json.body.photo || '' }}`

#### Node 4 & 5: `Supabase` (Encontrar Cliente e Criar Cliente na tabela `leads`)
1. **Node "Encontrar Cliente":**
   * **Resource:** `Row`
   * **Operation:** `Get`
   * **Table Name:** `leads`
   * **Select Conditions:** `lead_id` equals `{{ $('Informações do Lead').item.json.lead_id }}`
   * **Always Output Data:** `true` (para o fluxo não parar quando o lead ainda não existir).
2. **Node "IF Cliente Existe":**
   * Verifica se `{{ $json.lead_id }}` **exists**.
   * Se **True**: segue direto para o `AI Agent`.
   * Se **False**: passa pelo node **Criar Cliente** (`Resource: Row`, `Operation: Create`, `Table: leads`) preenchendo:
     * `lead_nome`: `{{ $('Informações do Lead').item.json.lead_nome }}`
     * `lead_id`: `{{ $('Informações do Lead').item.json.lead_id }}`
     *(As colunas `id` e `created_at` são preenchidas automaticamente pelo Supabase).*

#### Node 6: `AI Agent` + Modelo LLM + `Postgres Chat Memory`
* **Prompt Type:** `Define below`
* **Text (User Message):** `{{ $('Informações do Lead').item.json.mensagem_lead }}`
* **System Message (Prompt do Sistema):**
  Configurável por agente (no CoyDash, sincronizado com a tabela de Agentes IA). Define persona comercial, regras de qualificação, produtos/serviços, tom de voz humanizado e instruções de quando transferir para humano.
* **Sub-node Chat Model:**
  * Conecte `OpenAI Chat Model` (ou `Google Gemini Chat Model` / `Groq Chat Model`) com a respectiva API Key.
* **Sub-node Postgres Chat Memory:**
  * **Session ID:** `Define below` $\rightarrow$ Key: `{{ $('Informações do Lead').item.json.lead_id }}`
  * **Table Name:** `n8n_chat_histories`
  * **Context Window Length:** `10` a `20` mensagens.

#### Node 7: `HTTP Request` (Disparo da Resposta na Z-API)
* **Method:** `POST`
* **URL:** `https://api.z-api.io/instances/SUA_INSTANCIA_ID/token/SEU_TOKEN_INSTANCIA/send-text` *(A URL base é copiada de "API da instância" na Z-API acrescida de `/send-text`)*.
* **Authentication:** `Generic Credential Type` $\rightarrow$ `Header Auth`
  * **Name:** `Client-Token`
  * **Value:** `<SEU_TOKEN_DE_SEGURANCA_DA_CONTA_ZAPI>`
* **Send Body:** `true` (JSON)
* **Body Parameters:**
  * `phone`: `{{ $('Informações do Lead').item.json.lead_id }}`
  * `message`: `{{ $json.output }}` *(Saída gerada pelo node AI Agent)*.

---

## 3. Passo a Passo da Conexão com WhatsApp via Z-API e Credenciais Supabase

### 3.1. Configuração da Z-API
1. **Criar e Conectar Instância:**
   * Acesse o painel da **Z-API** $\rightarrow$ menu **Instâncias Web** $\rightarrow$ **Adicionar**.
   * Escaneie o **QR Code** com o aplicativo WhatsApp do número comercial até o status ficar **Conectado**.
2. **Configurar o Webhook de Recebimento:**
   * Na tela da instância conectada, localize a seção **Webhooks** $\rightarrow$ campo **Ao receber**.
   * Cole a URL do Webhook gerada no Node 1 do n8n (ex: `https://.../webhook-test/mensagem-teste` para testes ou `/webhook/mensagem-teste` em produção).
   * Para testar enviando mensagem de um único celular para si mesmo, marque a opção **"Notificar as mensagens enviadas por mim também"** (desative ao entrar em produção com clientes reais).
   * Clique em **Salvar**.
3. **Extrair a URL da API da Instância:**
   * Na mesma tela da instância, em **Dados da instância web**, copie o campo **API da instância** (ex: `https://api.z-api.io/instances/3C.../token/9F...`).
   * Essa URL é usada no Node 7 (`HTTP Request`) do n8n.
4. **Extrair o `Client-Token` (Token de Segurança da Conta):**
   * No menu lateral da Z-API, acesse **Segurança** $\rightarrow$ **Token de segurança da conta**.
   * Copie o código exibido e cadastre na credencial `Header Auth` do n8n com o nome exato `Client-Token`.

### 3.2. Configuração das Duas Credenciais do Supabase no n8n
O fluxo do n8n utiliza **duas conexões distintas** com o Supabase:

1. **Credencial 1: API REST do Supabase (Nodes `Encontrar Cliente` e `Criar Cliente`)**
   * No painel do Supabase (`cbhunupletswkjozcjze`), vá em **Project Settings** $\rightarrow$ **API Keys** (ou *Legacy / Service Role API Keys*).
   * Copie a **Project URL** (`https://cbhunupletswkjozcjze.supabase.co`) e cole no campo **Host** da credencial Supabase do n8n.
   * Copie a chave **`service_role` (secret)** e cole no campo **Service Role Secret** no n8n.
2. **Credencial 2: Banco PostgreSQL via Transaction Pooler (Node `Postgres Chat Memory`)**
   * No topo do painel do Supabase, clique no botão **Connect** $\rightarrow$ altere o modo de *Direct connection* para **Transaction pooler** $\rightarrow$ clique em **View parameters**:
     * **Host:** `aws-0-us-east-1.pooler.supabase.com`
     * **Database:** `postgres`
     * **User:** `postgres.cbhunupletswkjozcjze`
     * **Port:** `6543`
     * **Password:** Senha do banco configurada em *Database Settings* (`SUPABASE_DB_PASSWORD`).
     * **SSL:** Ativar a chave **Ignore SSL Issues** (`true`) dentro da credencial Postgres do n8n.

---

## 4. Modelagem de Banco de Dados no Supabase (Migration `003`)

Para que o **CoyDash** funcione simultaneamente com o fluxo padrão do n8n ensinado no vídeo (`leads` e `n8n_chat_histories`) **e** com a arquitetura Multi-Tenant já existente na migration `002` (`whatsapp_conversations`, `clients` e `pgvector`), a migration `supabase/migrations/003_coydash_whatsapp_n8n_crm_sync.sql` deve implementar:

```sql
-- ============================================================================
-- MIGRATION 003: Integração Nativa n8n (leads + n8n_chat_histories) + Triggers
-- de Sincronização Automática com Atendimento WhatsApp e CRM 360º do CoyDash
-- ============================================================================

-- 1. Tabela `public.leads` (100% compatível com os nodes Supabase do n8n)
CREATE TABLE IF NOT EXISTS public.leads (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    lead_nome TEXT NULL,
    lead_id TEXT NOT NULL UNIQUE, -- Telefone do cliente em formato texto (ex: 5511988771234)
    organization_id UUID NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    avatar_url TEXT NULL,
    human_takeover BOOLEAN NOT NULL DEFAULT false,
    assigned_agent_id UUID NULL,
    orders_count INTEGER NOT NULL DEFAULT 0,
    total_spent NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    cashback_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00
);

CREATE INDEX IF NOT EXISTS idx_leads_lead_id ON public.leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_org_id ON public.leads(organization_id);

-- 2. Tabela `public.n8n_chat_histories` (Compatível com Postgres Chat Memory do n8n
--    + coluna obrigatória `hora_data_mensagem` com DEFAULT now())
CREATE TABLE IF NOT EXISTS public.n8n_chat_histories (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL, -- Telefone do lead (cruza com leads.lead_id)
    message JSONB NOT NULL,           -- Formato LangChain/n8n: {"type": "human"|"ai", "data": {"content": "..."}}
    hora_data_mensagem TIMESTAMPTZ NOT NULL DEFAULT now(),
    organization_id UUID NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    sender_type TEXT GENERATED ALWAYS AS (COALESCE(message->>'type', 'human')) STORED
);

-- Caso a tabela já tenha sido criada automaticamente pelo n8n sem a coluna de data/hora:
ALTER TABLE public.n8n_chat_histories
    ADD COLUMN IF NOT EXISTS hora_data_mensagem TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS organization_id UUID NULL REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_n8n_chat_session_time
    ON public.n8n_chat_histories(session_id, hora_data_mensagem ASC);

-- 3. Tabela de Memória Vetorial do Cliente no Atendimento (pgvector)
CREATE TABLE IF NOT EXISTS public.client_ai_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id TEXT NOT NULL, -- Telefone do lead (ex: 5511988771234)
    memory_text TEXT NOT NULL,
    embedding vector(1536) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_ai_memories_lead_id
    ON public.client_ai_memories(lead_id);

-- 4. Habilitar Realtime para atualização instantânea da tela /atendimento
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.n8n_chat_histories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_ai_memories;
```

### 4.1. Como o Cruzamento de Dados Funciona (Relacionamento `leads` $\leftrightarrow$ `n8n_chat_histories`)
* Na tabela `leads`, o identificador único de negócio é a coluna **`lead_id`** (tipo `TEXT`), que armazena o número de WhatsApp do contato (ex: `"5511988771234"`).
* Na tabela `n8n_chat_histories`, o node *Postgres Chat Memory* do n8n grava o mesmo número de WhatsApp na coluna **`session_id`**.
* A tela `/atendimento` do CoyDash faz o `JOIN` lógico entre `leads.lead_id = n8n_chat_histories.session_id` e ordena todas as mensagens por `hora_data_mensagem ASC` (mensagens mais antigas no topo e **mensagens mais recentes na parte inferior do scroll**, exatamente como no WhatsApp).