# 📋 COYDASH — Plano Mestre de Execução (TASKS.md)

**Propósito:** Este documento rastreia todas as fases e entregas de engenharia do **CoyDash**.  
**Protocolo Obrigatório:** Ler `MEMORY.md` e `spec/DESIGN.md` antes de qualquer alteração. Nunca utilizar emojis na UI, manter 100% em Português e preservar estritamente a paleta `#F0521F` / `#141414` / `#F4F4F2` e tipografia *Schibsted Grotesk*.

---

## ✅ Histórico Consolidado (Fases 0 a 10 — 100% Concluídas)

- [x] **FASE 0 a FASE 8 (`TASK-0.1` a `TASK-8.4`):** Fundação Next.js App Router, Design System ROOMIE OFFICE AI (`spec/DESIGN.md`), Migration `001_coydash_schema_and_rls.sql`, Store Multi-Tenant e telas dos 3 pilares (`/`, `/studio`, `/flow`, `/pulse`, `/governanca`, `/executivo`, `/login`) + 5 rotas de API do SDD 05.
- [x] **FASE 9 (`TASK-9.1` a `TASK-9.6`):** Conexão real com o projeto Supabase (`cbhunupletswkjozcjze`), clientes SSR/Browser/Admin, fluxo completo de Autenticação (`/login`, `/cadastro`, `/recuperar-senha`, `/atualizar-senha`) e sincronização real via `/api/coydash/sync` com estado inicial limpo.
- [x] **FASE 10 (`TASK-10.1` a `TASK-10.6`):** Migration `002_coydash_clients_tasks_and_modules.sql` (27 tabelas no Supabase), Central de Clientes 360º (`/clientes`), Sistema de Setores & Projetos com Kanban Drag-and-Drop (`/tarefas`) e Módulos Operacionais (`/atendimento`, `/trafego-pago`, `/marketing`, `/financeiro`, `/configuracoes`, `/agentes`).

---

## 🚀 FASE 11 — Atendimento WhatsApp Formato Mobile, Integração Real Z-API + n8n, Sincronização CRM (`leads` + `n8n_chat_histories`) e Criador de Agentes IA

**Referências Técnicas:**  
* [spec/coytech_sdd_06_whatsapp_n8n_agent_architecture.md](./spec/coytech_sdd_06_whatsapp_n8n_agent_architecture.md)  
* [spec/coytech_sdd_07_atendimento_mobile_chat_crm_and_agent_builder.md](./spec/coytech_sdd_07_atendimento_mobile_chat_crm_and_agent_builder.md)  
* [spec/DESIGN.md](./spec/DESIGN.md)

### 11.1. Banco de Dados e Migração SQL (`003_coydash_whatsapp_n8n_crm_sync.sql`)
- [x] **TASK-11.1 — Criar e aplicar a Migration `003` no Supabase (`cbhunupletswkjozcjze`):**
  - Criar a tabela `public.leads` com as colunas exatas exigidas pelo fluxo n8n (`id`, `created_at`, `lead_nome`, `lead_id` como `TEXT UNIQUE`) acrescidas dos metadados do CoyDash (`organization_id`, `human_takeover`, `orders_count`, `total_spent`, `cashback_balance`).
  - Criar/ajustar a tabela `public.n8n_chat_histories` com `id`, `session_id` (cruzando com `leads.lead_id`), `message` (`JSONB` no padrão LangChain/n8n `{"type": "human"|"ai", "data": {"content": "..."}}`) e a coluna obrigatória `hora_data_mensagem TIMESTAMPTZ NOT NULL DEFAULT now()`.
  - Criar a tabela `public.client_ai_memories` (`id`, `organization_id`, `lead_id`, `memory_text`, `embedding vector(1536)`, `created_at`) para persistir os itens de *"Memória da IA (pgvector)"* exibidos na coluna direita da tela de Atendimento.
  - Habilitar `supabase_realtime` para `leads`, `n8n_chat_histories` e `client_ai_memories` e configurar políticas RLS compatíveis com `service_role` (para o n8n) e `authenticated` (para o painel CoyDash).

### 11.2. Rotas de API de Integração WhatsApp, Z-API e n8n
- [x] **TASK-11.2 — Implementar Route Handlers de Mensageria e Transbordo (`/api/whatsapp/*`):**
  - Criar `src/app/api/whatsapp/conversations/route.ts` (`GET` e `POST`): busca os leads de `public.leads`, cruza com a última mensagem de `public.n8n_chat_histories` (`lead_id = session_id`) e memórias de `public.client_ai_memories`, e permite iniciar uma `+ Nova conversa`.
  - Criar `src/app/api/whatsapp/messages/route.ts` (`GET`): retorna todas as mensagens de `public.n8n_chat_histories` de um `session_id` ordenadas por `hora_data_mensagem ASC`.
  - Criar `src/app/api/whatsapp/send/route.ts` (`POST`):
    - Permite enviar mensagem como **Atendente Humano** (`Responder como atendente...`) ou disparar o botão **`Simular Áudio Cliente`** / mensagem de teste do cliente;
    - Persiste o balão em `public.n8n_chat_histories` com `hora_data_mensagem = now()`;
    - Quando a credencial Z-API (`instance_api_url` + `client_token`) estiver preenchida nas configurações da organização, dispara a requisição HTTP `POST /send-text` com o header `Client-Token` para entregar a mensagem no WhatsApp real do lead.
  - Criar `src/app/api/whatsapp/takeover/route.ts` (`PATCH`): alterna o estado do botão **`Assumir conversa`** (`human_takeover = true/false`) em `public.leads`.

### 11.3. Refatoração da Tela `/atendimento` (Chat Mobile Estilo WhatsApp + Realtime + CRM Lateral)
- [x] **TASK-11.3 — Implementar o Viewport de Chat Mobile Estilo WhatsApp no Painel Central de `/atendimento` (`src/app/atendimento/page.tsx`):**
  - Preservar integralmente a estrutura de 3 colunas da tela atual do CoyDash (Coluna 1: Inbox lateral à esquerda; Coluna 2: Painel central da conversa; Coluna 3: Painel direito de Cliente `pedidos / gasto / cashback` + `Memória da IA (pgvector)`).
  - Dentro da Coluna 2 (Painel Central), renderizar o container de conversa no **formato Mobile igual ao do WhatsApp** (largura mobile calibrada de `412px` centralizada no painel com opção de alternar para largura total):
    - **Agrupamento por Datas estilo WhatsApp:** Pílulas divisórias centralizadas exibindo `Hoje`, `Ontem` ou a data formatada `DD/MM/AAAA` (ex: `02/02/2026`).
    - **Ordem Cronológica Invertida (Mais Recentes Embaixo):** Mensagens antigas no topo e mensagens novas sempre na parte inferior, com auto-scroll automático para o fim da conversa ao abrir ou receber novas mensagens.
    - **Balões de Mensagem Fidedignos:**
      - Mensagens do **Lead/Cliente (`type: "human"`)** à **esquerda** com horário `HH:mm` no canto inferior direito do balão.
      - Mensagens do **Agente IA / Atendente (`type: "ai"` / `"operator"`)** à **direita** com indicador `IA` ou `Atendente`, horário `HH:mm` e ícone SVG de duplo check (`✓✓`) no canto inferior direito.
  - Conectar **Supabase Realtime** (`postgres_changes` em `n8n_chat_histories` e `leads`) para que qualquer mensagem processada pelo n8n apareça ao vivo na tela sem dar F5.
- [x] **TASK-11.4 — Conectar Ações do Cabeçalho e Painel Direito (`Cliente` + `pgvector`) em `/atendimento`:**
  - Implementar funcionamento real do botão **`Simular Áudio Cliente`** (insere mensagem/transcrição simulada do cliente e aciona resposta automática da IA caso `human_takeover` seja `false`).
  - Implementar funcionamento real do botão **`Assumir conversa`** (muda status do cabeçalho de `IA respondendo automaticamente 24h` com ponto verde `#2F9E5A` para `Atendimento humano ativo` com ponto laranja `#F0521F`, bloqueando respostas automáticas da IA no n8n).
  - Conectar os 3 contadores de `pedidos`, `gasto` e `cashback` e a lista de `Memória da IA (pgvector)` (`Nova memória deste cliente...` + botão `+`) diretamente às tabelas `public.leads` e `public.client_ai_memories`.

### 11.4. Sincronização Automática com o CRM (`/clientes`)
- [x] **TASK-11.5 — Integrar Leads do WhatsApp (`public.leads`) com a Central de Clientes 360º (`src/app/clientes/page.tsx`):**
  - Exibir na coluna direita de `/atendimento` o seletor rápido de estágio no CRM (`Onboarding`, `Ativo`, `Aviso de Churn`) e o botão **"Abrir Ficha 360º"**.
  - Garantir que novos contatos criados pelo n8n na tabela `leads` possam ser visualizados e promovidos para a Central de Clientes 360º (`/clientes`), exibindo o histórico de conversas do WhatsApp (`n8n_chat_histories`) dentro da Ficha 360º do cliente.

### 11.5. Criador de Agentes IA, Guia Passo a Passo n8n e Exportador de Workflow (`/agentes` e `/configuracoes`)
- [x] **TASK-11.6 — Construir o Construtor de Agentes e Gerador de Template JSON n8n em `/agentes` (`src/app/agentes/page.tsx`):**
  - Implementar configuração visual do Agente: Nome, Modelo LLM (`OpenAI`, `Gemini`, `Groq`), `System Prompt` com templates comerciais prontos, filtros de ativação (ignorar grupos, respeitar *"Assumir conversa"*) e conexão Z-API (`API da Instância` + `Client-Token` + `URL do Webhook`).
  - Adicionar botão **"Baixar Fluxo Pronto para n8n (.json)"** e **"Copiar JSON do Fluxo para Colar no n8n (`Ctrl+V`)"**: gera o JSON completo com os 8 nodes ensinados no vídeo (Webhook Z-API $\rightarrow$ Filtros $\rightarrow$ Dados do Lead $\rightarrow$ Supabase Get/Create `leads` $\rightarrow$ AI Agent + Postgres Chat Memory `n8n_chat_histories` $\rightarrow$ HTTP Request Z-API) já parametrizado com os dados do usuário.
  - Incluir um modal/aba **"Passo a Passo: Do Download do n8n à Conexão Z-API e Supabase"** diretamente dentro da tela `/agentes` para guiar o operador ou cliente na ativação em minutos.

### 11.6. Validação de Qualidade, Tipagem e Memória Persistente
- [x] **TASK-11.7 — Verificação de Design System, TypeScript e Build:**
  - Auditar `src/app/atendimento/page.tsx`, `src/app/agentes/page.tsx` e `src/app/clientes/page.tsx` contra `spec/DESIGN.md` (zero emojis, 100% Português, acento único `#F0521F`, fontes >= `10.5px`).
  - Executar `npx tsc --noEmit` (0 erros) e `npm run build`.
- [x] **TASK-11.8 — Atualizar `MEMORY.md` (Seções 2 e 5):**
  - Marcar `[x]` nas tasks da Fase 11 em `TASKS.md` e registrar o changelog completo no `MEMORY.md`.


---

## 🚀 FASE 12 — Atendimento Comercial Exclusivo (SDR & CRM) com Visões Chat, Kanban e Lista + Popup Detalhado

- [x] **TASK-12.1 — Foco Exclusivo no Atendimento Comercial & SDR em `/atendimento`:**
  - Removido o seletor dual de caixas; a tela agora é 100% dedicada ao pipeline de leads comerciais de anúncios, agendamento de reuniões e qualificação 24h com Agente SDR.
- [x] **TASK-12.2 — Seletor Tríplice de Visualização (`Chat ao vivo` | `Quadro Kanban` | `Lista`):**
  - Implementado controle de modos idêntico ao módulo de Setores e Tarefas (`tasks-workspace-view.tsx`).
  - Modo **Chat ao Vivo**: Mantém a visualização de 3 colunas (Inbox de leads, Viewport Mobile WhatsApp 412px com auto-scroll e balões em tempo real, Painel de Oportunidade Comercial SDR).
  - Modo **Quadro Kanban**: 6 colunas comerciais (`Novo Lead`, `Qualificando`, `Reunião Agendada`, `Proposta Enviada`, `Cliente Fechado`, `Desqualificado`) com drag-and-drop completo via `@hello-pangea/dnd` sincronizado com `public.leads` via `PATCH /api/whatsapp/takeover`.
  - Modo **Lista**: Tabela estruturada com Lead, Estágio, Score SDR, Reunião, Status de Atendimento (IA/Humano), Última Interação e Botão de Atendimento direto.
- [x] **TASK-12.3 — Modal / Popup Detalhado do Lead nos modos Kanban e Lista:**
  - Ao clicar em qualquer card do Kanban ou linha da Lista, abre um popup com:
    - Botão em destaque: **"Ir para o Modo Atendimento (Abrir Chat)"** que seleciona a conversa e transiciona imediatamente para o chat ao vivo.
    - Seção Comercial: Dropdown de estágio, Score SDR, Data/Hora da Reunião, Link da Sala (Meet/Zoom) com botão de salvar e botão laranja para **Converter Lead em Cliente (Onboarding)**.
    - Notas & Dores do Lead (SDR): listagem das notas registradas com exclusão e campo para adicionar novas notas.
    - Pré-visualização da conversa WhatsApp em tempo real com balões e histórico de mensagens.


---

## 🚀 FASE 13 — Chat Smartphone Realista WhatsApp, Kanban Carrossel e Gerenciador Simples de Agentes n8n

- [x] **TASK-13.1 — Smartphone Autêntico no Chat ao Vivo de `/atendimento`:**
  - Carcaça de smartphone moderna com cantos arredondados (`rounded-[44px]`), moldura escura com relevo metálico e sombra de dispositivo.
  - Barra de status de celular no topo (Horário 09:41, Dynamic Island / Alto-falante central, ícones de Wi-Fi e Bateria).
  - Topbar WhatsApp com foto redonda do contato, nome, status "online · IA 24h" e ícones de chamada de vídeo, telefone e menu.
  - Papel de parede oficial do WhatsApp Dark (`#0b141a` com textura sutil).
  - Balões de conversa autênticos:
    - Cliente (recebida): Fundo `#202c33` com rabicho superior esquerdo e horário no canto inferior direito.
    - IA / Atendente (enviada): Fundo `#005c4b` (verde autêntico WhatsApp) com rabicho superior direito, horário e duplo tique azul `#53bdeb`.
  - Barra de digitação do WhatsApp com botão de emoji, clipe de anexo, campo arredondado `#2a3942` e botão de envio circular verde `#00a884`.
- [x] **TASK-13.2 — Carrossel no Quadro Kanban de `/atendimento`:**
  - Substituído o grid espremido por um carrossel horizontal amplo com colunas fixas de `320px` cada (`snap-start`), eliminando o aperto visual dos cards.
  - Adicionados botões de navegação no topo: `Anterior` (`ChevronLeft`) e `Próximo` (`ChevronRight`) com rolagem suave (`smooth scroll`).
- [x] **TASK-13.3 — Reformulação Completa da Tela de Agentes (`/agentes`):**
  - Removidos os cards fixos engessados e o tutorial prolixo de terminal.
  - Criada grade dinâmica de cards de agentes de IA:
    - Nome, canal, descrição objetiva e toggle de 1 clique para `Ativar` ou `Pausar`.
    - Box de conexão com o n8n com a URL do Webhook do fluxo e botão de copiar.
    - Botões de `Configurações` e `Excluir`.
  - Modal intuitivo de `+ Criar Novo Agente`: Nome, Descrição, Conexão com n8n (Webhook URL), Canal e Chave de ativação inicial.
  - API dedicada `/api/agents` (`GET`, `POST`, `PATCH`, `DELETE`) com persistência segura no Supabase.

- [x] **TASK-13.4 — Banner Premium Executivo em `/atendimento`:**
  - Substituída a barra simples anterior por um **Banner Hero Premium** imponente (`rounded-[20px]` com degradê escuro sofisticado e glow sutil).
  - Lado esquerdo com identificação do status ativo 24h, conexão ao fluxo n8n e resumo operacional.
  - Lado direito com 3 cards executivos de alto contraste para **Reuniões Agendadas** (verde `#2F9E5A`), **Leads Qualificados** (dourado `#E8C14A`) e **Total no Funil** (azul `#38BDF8`).
