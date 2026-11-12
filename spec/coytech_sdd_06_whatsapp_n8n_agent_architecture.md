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
     --p 5678:5678 \
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

## 3. Modelagem de Banco de Dados no Supabase (Migration `003`)

Para que o **CoyDash** funcione simultaneamente com o fluxo padrão do n8n ensinado no vídeo (`leads` e `n8n_chat_histories`) **e** com a arquitetura Multi-Tenant já existente na migration `002` (`whatsapp_conversations`, `clients` e `pgvector`), a migration `supabase/migrations/003_coydash_whatsapp_n8n_crm_sync.sql` implementa as tabelas `public.leads`, `public.n8n_chat_histories` (com `hora_data_mensagem TIMESTAMPTZ NOT NULL DEFAULT now()`) e `public.client_ai_memories` com suporte a **Supabase Realtime**.

