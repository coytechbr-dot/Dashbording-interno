# SDD 08: Engenharia Reversa do Twenty CRM e Arquitetura do Módulo Comercial & CRM Avançado (CoyCRM)

> **Documento:** `spec/coytech_sdd_08_crm_twenty_reverse_engineering.md`  
> **Status:** Aprovado para Implementação  
> **Referências:**  
> - [`TASKS.md`](../TASKS.md) (Fase 13)  
> - [`coytech_sdd_01_requisitos_e_arquitetura.md`](./coytech_sdd_01_requisitos_e_arquitetura.md)  
> - [`coytech_sdd_05_modelagem_banco_de_dados_e_apis.md`](./coytech_sdd_05_modelagem_banco_de_dados_e_apis.md)  
> - [`coytech_sdd_09_relatorio_melhorias_app_plano_de_negocio.md`](./coytech_sdd_09_relatorio_melhorias_app_plano_de_negocio.md)  
> - [`spec/DESIGN.md`](./DESIGN.md) — 100% Design System Roomie Office AI  
> - Repositório de Referência: [twentyhq/twenty](https://github.com/twentyhq/twenty)

---

## 1. Visão Geral e Princípios da Engenharia Reversa

O **Twenty CRM** (`twentyhq/twenty`) é amplamente reconhecido como um dos CRMs open-source mais modernos e bem arquitetados do mercado. No entanto, sua stack (NestJS + Vite + Emotion CSS + Recoil + TypeORM) e sua licença **GNU AGPL-3.0** impedem a importação direta de código proprietário fechado.

A **Engenharia Reversa** adotada aqui consiste em extrair a **arquitetura de dados, a experiência de usuário (UX) e os fluxos de trabalho avançados** do Twenty e recriá-los de forma 100% nativa na stack do **Dashbording (Next.js 16 + React 19 + Tailwind CSS v4 + Supabase + Design System Roomie Office AI)**.

### 🛡️ Regra Pétrea: Preservação Absoluta do Ecossistema Atual
1. **Nenhuma tela ou recurso existente será deletado:**
   - Central de Clientes 360º (`/clientes`) com suas 13 abas permanece 100% funcional.
   - Sala de Tarefas Roomie (`/tarefas` e `/listas/[listId]`) com áudio player/recorder e custom fields continua intacta.
   - Atendimento WhatsApp (`/atendimento`), Tráfego Pago (`/trafego-pago`), Marketing (`/marketing`), Agentes (`/agentes`), Financeiro (`/financeiro`), Studio 1-Clique (`/studio`), Pulse BIA (`/pulse`), Governança 6 Etapas (`/governanca`) e Executivo Mobile (`/executivo`) continuam operando normalmente.
2. **Evolução Não-Destrutiva:**
   - As novas entidades no PostgreSQL herdam chaves estrangeiras seguras (`ON DELETE CASCADE` ou `SET NULL`).
   - Onde houver melhoria em tela existente, ela será adicionada como **nova aba, novo modo de visualização ou drawer complementar**, sem quebrar o fluxo habitual da equipe.

---

## 2. Matriz de Engenharia Reversa: Twenty CRM vs. Dashbording

| Capacidade do Twenty CRM | Limitação Atual do Dashbording | Solução Recriada no Dashbording (CoyCRM) |
| :--- | :--- | :--- |
| **Pipelines & Deals Multi-Funil** | O Kanban existia apenas em `/atendimento` atrelado à tabela `leads` do WhatsApp, sem gestão financeira de propostas e múltiplos funis. | **Novo Módulo Comercial (`/comercial`):** Gestão de Oportunidades com múltiplos pipelines (Novos Clientes, Upsell, Parcerias), valores de MRR + Setup, probabilidade ponderada, datas de fechamento e conversão em 1 clique para Cliente 360º. |
| **Pessoas / Contatos (1:N)** | A tabela `clients` continha apenas 3 campos estáticos (`contact_name`, `contact_phone`, `contact_email`). | **Nova Tabela `client_contacts`:** Vínculo de múltiplos contatos por empresa, cargos, e-mail/celular individual, indicação de tomador de decisão (CEO/Diretoria) e nova aba de Contatos na Ficha 360º. |
| **Data Grid & Saved Views** | Filtros estáticos e colunas pré-definidas em código fixo. | **Componente Reutilizável `CoyDataGrid`:** Tabela interativa com seleção de colunas visíveis, ordenação dinâmica, filtros compostos (AND/OR) e persistência de **Visões Salvas** na tabela `workspace_saved_views`. |
| **Timeline de Atividades Unificada** | Histórico manual e disperso entre notas e eventos soltos. | **Nova Tabela `activity_timeline`:** Auditoria automática e unificada de mudanças de status, propostas geradas, reuniões, anotações e mensagens trocadas, exibida de forma cronológica rica. |
| **Custom Fields Extensíveis** | Campos customizados existiam exclusivamente para Tarefas (`task_custom_field_values`). | **Extensão de Escopo:** Suporte a campos customizados para **Clientes (`scope: 'client'`)** e **Oportunidades (`scope: 'deal'`)**, permitindo criar campos de negócio em tempo de execução sem alterar o schema SQL. |
| **Servidor MCP Nativo** | Integração com IA restrita a chat local e LiteLLM. | **Endpoint Oficial `/api/mcp`:** Servidor Model Context Protocol nativo permitindo que Claude Desktop, Cursor e agentes externos consultem e manipulem o CRM de forma segura e contextualizada. |

---

## 3. Arquitetura do Banco de Dados (Migration `008_coydash_crm_twenty_reverse_engineering.sql`)

### 3.1. Tabelas de Pipelines e Oportunidades (Deals)
```sql
-- 1. Pipelines de Vendas
CREATE TABLE IF NOT EXISTS public.pipelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    color TEXT NOT NULL DEFAULT '#F0521F',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Estágios do Pipeline
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    stage_order INTEGER NOT NULL DEFAULT 0,
    probability_percent INTEGER NOT NULL DEFAULT 10,
    color TEXT NOT NULL DEFAULT '#38bdf8',
    is_won BOOLEAN NOT NULL DEFAULT false,
    is_lost BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Oportunidades de Venda (Deals)
CREATE TABLE IF NOT EXISTS public.deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES public.pipeline_stages(id) ON DELETE RESTRICT,
    client_id UUID NULL REFERENCES public.clients(id) ON DELETE SET NULL,
    lead_id TEXT NULL REFERENCES public.leads(lead_id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    value_mrr NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    value_setup NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    expected_close_date DATE NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_member_id UUID NULL REFERENCES public.organization_members(id) ON DELETE SET NULL,
    lost_reason TEXT NULL,
    notes TEXT DEFAULT '',
    custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.2. Pessoas e Múltiplos Contatos por Cliente (1:N)
```sql
CREATE TABLE IF NOT EXISTS public.client_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    job_title TEXT NOT NULL DEFAULT 'Contato Comercial',
    department TEXT NOT NULL DEFAULT 'Diretoria / Operações',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    whatsapp TEXT DEFAULT '',
    is_decision_maker BOOLEAN NOT NULL DEFAULT false,
    notes TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.3. Linha do Tempo Unificada de Atividades (Activity Timeline)
```sql
CREATE TABLE IF NOT EXISTS public.activity_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('CLIENT', 'DEAL', 'LEAD', 'TASK')),
    entity_id TEXT NOT NULL,
    actor_name TEXT NOT NULL DEFAULT 'Sistema',
    actor_id UUID NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'STATUS_CHANGED', 
        'STAGE_MOVED', 
        'NOTE_ADDED', 
        'MEETING_SCHEDULED', 
        'PROPOSAL_CREATED', 
        'DEAL_WON', 
        'DEAL_LOST', 
        'TASK_COMPLETED',
        'FIELD_UPDATED',
        'COMMUNICATION_LOGGED'
    )),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.4. Visões Salvas de Tabelas (Saved Views)
```sql
CREATE TABLE IF NOT EXISTS public.workspace_saved_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NULL,
    view_scope TEXT NOT NULL CHECK (view_scope IN ('CLIENTS', 'DEALS', 'TASKS')),
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'LayoutGrid',
    is_shared BOOLEAN NOT NULL DEFAULT true,
    columns_visible JSONB NOT NULL DEFAULT '[]'::jsonb,
    filters_config JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_config JSONB NOT NULL DEFAULT '{"field": "created_at", "direction": "desc"}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 4. Design de Interfaces e Telas

Todas as interfaces seguem 100% o **`spec/DESIGN.md` (Roomie Office AI)**:
- Fundo `var(--bg)` e Superfície `var(--surface)`.
- Acento único Laranja `#F0521F` (hover `#FF6A36`), Tinta `#141414`, Papel `#F4F4F2`.
- Tipografia Schibsted Grotesk, raios `rounded-[14px]` a `rounded-[18px]` e bordas `var(--line)`.

### 4.1. Nova Tela: `/comercial` (Pipeline de Negócios e Oportunidades)
* **Cabeçalho:** Seletor de Pipeline (ex: "🚀 Novos Clientes Coytech", "📈 Expansão & Upsell", "🤝 Parcerias"), métricas no topo (Pipeline Total em MRR, Total em Setup Fee, Forecast Ponderado, Taxa de Conversão).
* **Alternador de Visualização:**
  * **Modo Kanban:** Colunas drag-and-drop com totalizador financeiro no topo de cada coluna. Cards exibem: Nome da oportunidade, valor MRR e Setup, cliente vinculado (se houver), data prevista e prioridade.
  * **Modo Tabela (Spreadsheet View):** Edição rápida de valores, estágio e responsável.
* **Modal de Oportunidade:** Edição de dados, vínculo com lead do WhatsApp, gerador de propostas e botão de destaque:
  * **"🎉 Fechar Negócio e Converter em Cliente 360º"**: Cria automaticamente o cliente em `public.clients` com status `ONBOARDING`, importa o contato decisor para `client_contacts` e gera as tarefas de kickoff no `task_lists`.

### 4.2. Aprimoramento da Central de Clientes (`/clientes`)
* Adição da aba **"Contatos (Pessoas)"** na Ficha 360º, permitindo cadastrar diretoria, finanças e tecnologia com link direto para conversa de WhatsApp.
* Adição da aba **"Oportunidades"**, listando o histórico de propostas e negócios daquela conta.
* Nova visualização em **Tabela com Visões Salvas** além da visualização em colunas existente.

### 4.3. Servidor MCP Nativo (`/api/mcp`)
* Endpoint seguro com autenticação por chave de API (`litellm_virtual_key_id` ou token de organização).
* Ferramentas expostas aos agentes:
  1. `get_pipeline_summary`: Retorna métricas de vendas e negociações em aberto.
  2. `list_deals`: Busca oportunidades por estágio, valor ou responsável.
  3. `create_deal`: Cadastra nova oportunidade a partir de lead qualificado.
  4. `update_deal_stage`: Avança oportunidade no funil.
  5. `create_client_contact`: Adiciona novo contato a um cliente existente.
  6. `log_activity`: Registra evento na linha do tempo unificada.

---

## 5. Garantia de Estabilidade e Rollout Seguro
1. **Migrations Idempotentes:** Executadas com blocos `DO $$ BEGIN ... END $$` e `IF NOT EXISTS` para não quebrar instâncias existentes.
2. **Atualização Segura do `coydash-store.tsx`:** O estado global de deals, contatos e timelines é inicializado com fallbacks defensivos (`|| []`).
3. **RLS e Realtime:** Todas as novas tabelas habilitadas para Supabase Realtime para que movimentações no Kanban reflitam instantaneamente na tela de todos os membros conectados.
