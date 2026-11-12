# 📋 COYDASH — Plano Mestre de Tasks (SDD Task Plan)

> **Documento de Engenharia Reversa:** [`spec/coytech_sdd_08_crm_twenty_reverse_engineering.md`](./spec/coytech_sdd_08_crm_twenty_reverse_engineering.md)  
> **Arquivo Mestre Completo:** [`TASKS.md`](./TASKS.md)

---

## 📌 FASE 13: Engenharia Reversa do Twenty CRM para o CoyDash

O plano detalhado abaixo descreve a recriação das funcionalidades e superpoderes inspirados no **Twenty CRM** (`twentyhq/twenty`) adaptados 100% à stack e ao Design System do CoyDash (**Next.js 16 + React 19 + Tailwind CSS v4 + Supabase + Roomie Office AI**), com garantia de não excluir nenhuma funcionalidade existente.

```
Status:
[ ] Pendente
[~] Em andamento
[x] Concluído
```

---

### 🗄️ 13.1. Banco de Dados & Schema SQL
- [x] **TASK-13.1:** Aplicar a migration `supabase/migrations/008_coydash_crm_twenty_reverse_engineering.sql`:
  - `pipelines` (multi-funis de vendas).
  - `pipeline_stages` (estágios com probabilidade ponderada e cores).
  - `deals` (oportunidades comerciais com MRR e Setup fee).
  - `client_contacts` (múltiplos contatos/pessoas físicas por empresa 1:N).
  - `activity_timeline` (linha do tempo unificada de auditoria e atividades).
  - `workspace_saved_views` (configuração de colunas, ordenação e filtros salvos).
  - Atualização do `scope` em `custom_field_definitions` para suportar `client` e `deal`.
  - Habilitar `supabase_realtime` e políticas RLS multi-tenant.

---

### 💻 13.2. Tipagem TypeScript Unificada
- [x] **TASK-13.2:** Atualizar `src/types/coydash.ts`:
  - Declarar interfaces: `PipelineItem`, `PipelineStageItem`, `DealItem`, `ClientContactItem`, `ActivityTimelineItem`, `WorkspaceSavedViewItem`.
  - Estender `CustomFieldType` e `CustomFieldDefinition` para suportar campos adicionais no CRM.
  - Manter compatibilidade com todas as interfaces atuais de clientes, tarefas e módulos.

---

### 🔄 13.3. Store Global e API de Sincronização
- [x] **TASK-13.3:** Atualizar `src/lib/coydash-store.tsx` e `src/app/api/coydash/sync/route.ts`:
  - Implementar no store os estados reativos: `pipelines`, `pipelineStages`, `deals`, `clientContacts`, `timelineActivities` e `savedViews`.
  - Criar ações de mutação: `addPipeline`, `addDeal`, `updateDealStage`, `convertDealToClient`, `addClientContact`, `deleteClientContact`, `logTimelineActivity`, `saveTableViewConfig`.
  - Sincronização automática com Supabase via API Route com suporte a Realtime.

---

### 📊 13.4. Nova Tela: Comercial & Funil de Oportunidades (`/comercial`)
- [x] **TASK-13.4:** Criar `src/app/comercial/page.tsx`:
  - **Seletor de Pipelines:** Alternar entre funis (ex: Novos Clientes, Expansão & Upsell, Parcerias).
  - **KPIs do Topo:** Total em MRR, Total em Setup Fee, Forecast Ponderado e Taxa de Conversão.
  - **Quadro Kanban Drag-and-Drop:** Estágios customizados com cor, probabilidade e soma de valores monetários no topo de cada coluna usando `@hello-pangea/dnd`.
  - **Cards de Oportunidade:** Exibição do título, cliente vinculado, valor MRR e Setup, responsável com avatar, prioridade e data limite.
  - **Ação 1-Clique de Fechamento:** Botão no card ou modal de deal ganho para **"Converter em Cliente 360º"**, provisionando o cliente em `public.clients`, cadastrando o contato principal e abrindo o processo de onboarding.

---

### 🏢 13.5. Aprimoramento da Central de Clientes 360º (`/clientes`)
- [x] **TASK-13.5:** Atualizar `src/app/clientes/page.tsx`:
  - **Nova Aba "Contatos (Pessoas)":** Lista 1:N de contatos daquela empresa com cargo, e-mail, telefone, selo de tomador de decisão e botão para abrir conversa direta no WhatsApp (`src/components/clients/client-contacts-tab.tsx`).
  - **Nova Aba "Oportunidades":** Histórico de propostas e negócios em andamento ou ganhos vinculados àquela conta (`src/components/clients/client-deals-tab.tsx`).
  - **Aba "Histórico" Atualizada com a Timeline Unificada:** Visualização rica de atividades cronológicas integrando a tabela `activity_timeline`.
  - Preservar integralmente todas as outras 12 abas existentes.

---

### 📋 13.6. Motor de Data Grid com Visões Salvas (`CoyDataGrid`)
- [x] **TASK-13.6:** Criar componente reutilizável de tabela avançada:
  - Seleção de colunas visíveis (Show/Hide).
  - Ordenação dinâmica por múltiplas colunas (texto, valores R$, datas, estágios).
  - Filtros compostos com busca global instantânea.
  - Salvar e carregar visões customizadas (`Saved Views`) persistidas no Supabase (`workspace_saved_views`).
  - Exportação direta para CSV com 1 clique.
  - Implementado em `src/components/crm/coy-data-grid.tsx` e integrado no `/comercial` (modo Tabela).

---

### 🤖 13.7. Servidor MCP (Model Context Protocol) Nativo & Governança de Tokens
- [x] **TASK-13.7:** Implementar Servidor Universal MCP JSON-RPC 2.0 e Governança de Tokens:
  - Migration `009_coydash_universal_mcp_and_api_tokens.sql` aplicada no PostgreSQL remoto (`mcp_api_tokens` e `mcp_audit_logs`).
  - Motor de autenticação por token Bearer com hash SHA-256 e RBAC granular (`src/lib/mcp-auth.ts`).
  - Endpoint oficial MCP `POST /api/mcp` atendendo protocolo `2024-11-05` com 16 ferramentas integradas em Atendimento, Comercial, Tarefas, Clientes e Agentes com trava anti-destruição e isolamento multi-tenant.
  - API de gestão de tokens (`src/app/api/mcp/tokens/route.ts`).
  - Painel visual de Gestão de Tokens de IA em `/colaboradores` (`src/components/colaboradores/mcp-tokens-tab.tsx`) seguindo 100% o Design System Roomie Office AI.
  - Testes automatizados executados com sucesso via `scripts/test-mcp.mjs`.

---

### 🧭 13.8. App Shell e Validação de Compilação
- [x] **TASK-13.8:** Atualizar navegação e validar projeto:
  - Inserir **"Comercial & Vendas"** (`/comercial`) no menu da Sidebar (`src/components/layout/coydash-shell.tsx`) com ícone `Briefcase`, contador dinâmico (`deals.length`) e badge minimizado.
  - Atualizar permissões de tela (`SYSTEM_SCREENS`) e presets de cargos no setor Comercial & Vendas em `/colaboradores`.
  - Executar verificação estrita de TypeScript (`npx tsc --noEmit` — 0 erros).
  - Executar build de produção do Next.js Turbopack (`npm run build` — 34/34 rotas compiladas com sucesso).
  - Fidelidade estética absoluta ao Design System Roomie Office AI (`spec/DESIGN.md`).
