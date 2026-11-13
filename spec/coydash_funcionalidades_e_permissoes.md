# Matriz Oficial de Funcionalidades, Permissões e Governança RBAC (`CoyDash`)

> **Status:** Ativo — Fonte da Verdade de Controle de Acesso e Funcionalidades  
> **Última Atualização:** 2026-11-13 (Sessão 28 — Sistema de Ordens de Serviço em 3 Etapas para Clientes, Kanban Embutido na Ficha 360º e Solicitação de Proposta Comercial para Leads)  
> **Motor Central:** [`src/lib/access-control.ts`](../src/lib/access-control.ts)  
> **Componente Dropdown:** [`src/components/ui/coy-dropdown.tsx`](../src/components/ui/coy-dropdown.tsx)  
> **Enforcement Backend:** [`src/app/api/coydash/sync/route.ts`](../src/app/api/coydash/sync/route.ts)

---

## 1. Propósito do Documento

Este documento cataloga **todas as funcionalidades operacionais e administrativas do CoyDash**, definindo com exatidão qual nível de acesso tem permissão para visualizar, operar, configurar ou excluir cada recurso.

> **REGRA OBRIGATÓRIA DE WORKFLOW (`AGENTS.md` & `GEMINI.md`):**  
> Sempre que uma nova funcionalidade, tela, ação destrutiva, modal ou regra operacional for criada ou modificada no CoyDash, o agente ou desenvolvedor **DEVE obrigatoriamente**:
> 1. Catalogar ou atualizar a funcionalidade na **Seção 3 (Matriz Oficial de Funcionalidades)** deste arquivo;
> 2. Garantir a chave correspondente em `FEATURE_PERMISSION_CATALOG` (`src/lib/access-control.ts`) e sua verificação no backend (`/api/coydash/sync` ou rota dedicada) e no frontend;
> 3. Registrar a alteração em [`MEMORY.md`](../MEMORY.md).

---

## 2. Os 5 Níveis Hierárquicos de Acesso (`AccessType`)

O sistema evoluiu do modelo binário (`MEMBER` / `GUEST`) para uma hierarquia de **5 níveis**, divididos em **Grupo Convidado (Escopo Cirúrgico)** e **Grupo Equipe Coytech (Acesso Global)**:

| Rank | Código (`AccessType`) | Rótulo Oficial | Grupo / Escopo de Visibilidade | Descrição Executiva |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `GUEST` | **Convidado (Leitor / Restrito)** | **Convidado** (Apenas telas, pastas e listas liberadas) | Visualiza apenas o que foi autorizado, atualiza status/descrição/campos em suas tarefas atribuídas e **só arquiva ou exclui tarefas criadas por si mesmo**. |
| **2** | `GUEST_COLLABORATOR` | **Convidado Colaborador (Operacional)** | **Convidado** (Apenas telas, pastas e listas liberadas) | Além das permissões do Convidado Leitor, cria novas tarefas e subtarefas, movimenta oportunidades no Funil Comercial e opera Atendimento WhatsApp nas telas liberadas. Ainda **só arquiva/exclui tarefas criadas por si mesmo**. |
| **3** | `GUEST_MANAGER` | **Convidado Gerente (Líder de Projeto)** | **Convidado** (Escopo restrito às telas, pastas e listas liberadas) | Possui autoridade gerencial dentro dos projetos/telas autorizados: **pode arquivar, restaurar e excluir tarefas de qualquer membro**, gerenciar colunas do Kanban, gerenciar pastas/listas, criar/configurar campos personalizados e modelos, editar Clientes 360º e configurar Agentes. |
| **4** | `MEMBER` | **Membro (Equipe Coytech Full)** | **Equipe Interna** (Acesso global ao workspace) | Acesso operacional completo a todas as telas, setores, pastas, tarefas, clientes, CRM, atendimento e lançamentos financeiros, podendo arquivar/excluir qualquer tarefa. |
| **5** | `ADMIN` | **Administrador (Governança & Segurança)** | **Equipe Interna** (Acesso global + Governança) | Acesso total e irrestrito ao sistema, incluindo gestão de colaboradores, troca de credenciais (e-mail/senha), promoção de níveis, ajuste fino de permissões, tokens MCP Universal e configurações globais do workspace. |

### Regra de Escopo Cirúrgico (`isGuestScopedLevel`)
- Retorna `true` para `GUEST`, `GUEST_COLLABORATOR` e `GUEST_MANAGER`.
- Usuários nesses 3 níveis obedecem rigorosamente às listas `allowed_screens`, `allowed_folder_ids` e `allowed_list_ids` definidas em `/colaboradores`.
- Mesmo quando um convidado é promovido a `GUEST_MANAGER`, ele continua vendo apenas os clientes/projetos/telas atribuídos a ele, **sem vazar outros projetos ou o módulo administrativo/financeiro** (salvo liberação explícita via telas + ajuste fino).

---

## 3. Matriz Oficial de Funcionalidades (`FEATURE_PERMISSION_CATALOG`)

Legenda:
- **Sim** = Permitido por padrão para o nível
- **Não** = Bloqueado por padrão (pode ser liberado individualmente via **Ajuste Fino** `custom_permissions` em `/colaboradores`, exceto travas administrativas quando aplicável)

### 3.1. Módulo: Tarefas & Projetos (`tasks.*`)

| Chave (`FeaturePermissionKey`) | Funcionalidade | `GUEST` | `GUEST_COLLABORATOR` | `GUEST_MANAGER` | `MEMBER` | `ADMIN` | Sensível |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `tasks.create` | **Criar tarefas e subtarefas** | Não | **Sim** | **Sim** | **Sim** | **Sim** | Não |
| `tasks.edit_assigned` | **Editar tarefas e trocar status/responsáveis** (briefing, datas, campos personalizados) | **Sim** | **Sim** | **Sim** | **Sim** | **Sim** | Não |
| `tasks.archive_own` | **Arquivar/restaurar tarefas criadas por si mesmo** | **Sim** | **Sim** | **Sim** | **Sim** | **Sim** | Não |
| `tasks.archive_any` | **Arquivar/restaurar tarefas de qualquer membro** | Não | Não | **Sim** | **Sim** | **Sim** | **Sim** |
| `tasks.delete_own` | **Excluir permanentemente tarefas criadas por si mesmo** | **Sim** | **Sim** | **Sim** | **Sim** | **Sim** | Não |
| `tasks.delete_any` | **Excluir permanentemente tarefas de terceiros** | Não | Não | **Sim** | **Sim** | **Sim** | **Sim** |
| `tasks.manage_columns` | **Gerenciar colunas de status Kanban** (criar/excluir colunas) | Não | Não | **Sim** | **Sim** | **Sim** | Não |
| `tasks.manage_structure` | **Criar e excluir Setores (Pastas) e Listas** na barra lateral | Não | Não | **Sim** | **Sim** | **Sim** | **Sim** |

### 3.2. Módulo: Campos Personalizados (`custom_fields.*`)

| Chave (`FeaturePermissionKey`) | Funcionalidade | `GUEST` | `GUEST_COLLABORATOR` | `GUEST_MANAGER` | `MEMBER` | `ADMIN` | Sensível |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `custom_fields.manage` | **Gerenciar Campos, Modelos e Grupos** (criar campos, configurar alcance para todas as tarefas ou específicas, aplicar grupos modelos, excluir definições) | Não | Não | **Sim** | **Sim** | **Sim** | Não |

### 3.3. Módulo: Clientes & CRM (`clients.*`, `crm.*`, `leads.*`)

| Chave (`FeaturePermissionKey`) | Funcionalidade | `GUEST` | `GUEST_COLLABORATOR` | `GUEST_MANAGER` | `MEMBER` | `ADMIN` | Sensível |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `clients.manage` | **Editar Clientes 360º** (contas, histórico, notas de equipe) | Não | Não | **Sim** | **Sim** | **Sim** | Não |
| `clients.create_order_service` | **Abrir Ordens de Serviço (O.S.)** (emissor guiado em 3 etapas com setor, checklist e direcionamento para Clientes - Tarefas) | Não | **Sim** | **Sim** | **Sim** | **Sim** | Não |
| `clients.view_demands_kanban` | **Visualizar Kanban de Demandas do Cliente** (alternância lista e quadro kanban embutido dentro da ficha) | **Sim** | **Sim** | **Sim** | **Sim** | **Sim** | Não |
| `crm.manage_deals` | **Operar Funil Comercial & Oportunidades** (pipelines, deals, contatos 1:N) | Não | **Sim** | **Sim** | **Sim** | **Sim** | Não |
| `leads.request_commercial_proposal` | **Solicitar Proposta Comercial para Leads** (gera tarefa com histórico e notas em Leads - Tarefas -> Proposta Comercial) | Não | **Sim** | **Sim** | **Sim** | **Sim** | Não |

### 3.4. Módulo: Atendimento & Operação (`whatsapp.*`)

| Chave (`FeaturePermissionKey`) | Funcionalidade | `GUEST` | `GUEST_COLLABORATOR` | `GUEST_MANAGER` | `MEMBER` | `ADMIN` | Sensível |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `whatsapp.operate` | **Operar Atendimento WhatsApp & Handoff** (responder conversas, assumir IA, memórias) | Não | **Sim** | **Sim** | **Sim** | **Sim** | Não |

### 3.5. Módulo: Agentes & Automação (`agents.*`)

| Chave (`FeaturePermissionKey`) | Funcionalidade | `GUEST` | `GUEST_COLLABORATOR` | `GUEST_MANAGER` | `MEMBER` | `ADMIN` | Sensível |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `agents.manage` | **Configurar Agentes IA & Disparos** (criar/editar agentes, fluxos e campanhas) | Não | Não | **Sim** | **Sim** | **Sim** | Não |

### 3.6. Módulo: Financeiro & DRE (`finance.*`)

| Chave (`FeaturePermissionKey`) | Funcionalidade | `GUEST` | `GUEST_COLLABORATOR` | `GUEST_MANAGER` | `MEMBER` | `ADMIN` | Sensível |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `finance.manage` | **Lançar e excluir registros Financeiros** (entradas, saídas e DRE) | Não | Não | Não | **Sim** | **Sim** | **Sim** |

### 3.7. Módulo: Governança & Acessos (`team.*`, `workspace.*`)

| Chave (`FeaturePermissionKey`) | Funcionalidade | `GUEST` | `GUEST_COLLABORATOR` | `GUEST_MANAGER` | `MEMBER` | `ADMIN` | Sensível |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `team.manage_members` | **Gerenciar Membros, Permissões e Senhas** (convidar, definir nível, ajustar permissões finas, trocar senha) | Não | Não | Não | Não | **Sim** | **Sim** |
| `team.manage_mcp_tokens` | **Gerenciar Tokens do MCP Universal** (emitir e revogar chaves Bearer) | Não | Não | Não | Não | **Sim** | **Sim** |
| `workspace.manage_settings` | **Configurações Globais e Integrações** (webhooks n8n, Z-API, estrutura do workspace) | Não | Não | Não | Não | **Sim** | **Sim** |

---

## 4. Regras de Autoria, Arquivamento e Exclusão de Tarefas

Implementadas em conjunto no banco de dados (Migration `012`), API (`/api/coydash/sync`), store (`coydash-store.tsx`) e UI (`task-dialog.tsx` / `tasks-workspace-view.tsx`):

1. **Rastreamento de Autoria (`CREATE_TASK`):**
   - Toda nova tarefa e subtarefa registra automaticamente `created_by_user_id` (UUID do criador autenticado) e `created_by_name` (nome exibido do criador).
   - A comparação de autoria (`isTaskCreator`) aceita tanto correspondência exata por `created_by_user_id === actor.userId` quanto fallback por `created_by_name` em registros legados quando o ID não estiver preenchido.
2. **Arquivamento Seguro (`ARCHIVE_TASK` / `UPDATE_TASK.is_archived`):**
   - `public.tasks` armazena `is_archived BOOLEAN DEFAULT false`, `archived_at TIMESTAMPTZ` e `archived_by_user_id UUID`.
   - **`canUserArchiveTask(ctx, task)`:** Retorna `true` se o usuário possui `tasks.archive_any` (`GUEST_MANAGER`, `MEMBER`, `ADMIN`) **OU** se possui `tasks.archive_own` **e** é o criador da tarefa (`isTaskCreator(ctx, task)`).
   - Tarefas arquivadas saem da listagem/kanban padrão e dos contadores da barra lateral, ficando acessíveis pelo filtro **"Arquivadas"** na visualização de lista/kanban.
3. **Exclusão Permanente Protegida (`DELETE_TASK`):**
   - **`canUserDeleteTask(ctx, task)`:** Retorna `true` se o usuário possui `tasks.delete_any` (`GUEST_MANAGER`, `MEMBER`, `ADMIN`) **OU** se possui `tasks.delete_own` **e** é o criador da tarefa.
   - Tanto na UI (`TaskDialog` menu discreto `...` e ações da lista) quanto no endpoint `POST /api/coydash/sync` (`403 Forbidden`), usuários sem permissão não conseguem excluir tarefas de terceiros.

---

## 5. Ajuste Fino por Usuário (`custom_permissions JSONB`)

Mesmo com os 5 níveis padrão, administradores (`ADMIN` / `team.manage_members`) podem personalizar permissões individuais em **`/colaboradores` → Ficha 360º → Aba `Acessos & Permissões` → `Permissões por Funcionalidade (Ajuste Fino)`**:
- Cada funcionalidade da lista aceita 3 estados:
  - **Padrão (herdado):** Remove a chave de `custom_permissions`, seguindo `defaultLevels` do nível atual do usuário.
  - **Permitir (`true`):** Concede explicitamente a funcionalidade (ex.: liberar `custom_fields.manage` para um `GUEST_COLLABORATOR` específico).
  - **Bloquear (`false`):** Revoga explicitamente a funcionalidade para aquele usuário, mesmo que o nível padrão permita (exceto conta master `coytechbr@gmail.com` / `ADMIN` em blindagem interna).
- Persistência em `public.organization_members.custom_permissions` e `public.workspace_invitations.custom_permissions`.

---

## 6. Arquitetura Técnica e Enforcement

| Camada | Arquivo | Responsabilidade |
| :--- | :--- | :--- |
| **Banco de Dados** | `supabase/migrations/012_coydash_rbac_levels_and_task_archive.sql` | Colunas `custom_permissions JSONB`, `created_by_user_id`, `created_by_name`, `is_archived`, `archived_at`, `archived_by_user_id` e índices. |
| **Motor RBAC** | `src/lib/access-control.ts` | Catálogo `ACCESS_LEVELS_META`, `FEATURE_PERMISSION_CATALOG`, `hasFeaturePermission`, `canUserArchiveTask`, `canUserDeleteTask`, `isGuestScopedLevel`, `isTaskCreator`, `normalizeAccessType`. |
| **API Backend** | `src/app/api/coydash/sync/route.ts` | Carrega `actorCtx` autenticado no `POST` e retorna `403` em ações não autorizadas (`CREATE_TASK`, `UPDATE_TASK`, `ARCHIVE_TASK`, `DELETE_TASK`, `CREATE/DELETE_TASK_FOLDER`, `CREATE/DELETE_TASK_LIST`, `CREATE/DELETE_TASK_STATUS*`, `*_CUSTOM_FIELD_*`, `INVITE/UPDATE/DELETE_TEAM_MEMBER`, `ADMIN_UPDATE_MEMBER_CREDENTIALS`). |
| **Estado Global** | `src/lib/coydash-store.tsx` | Exposição de `currentUserPermissions` (incluindo `custom_permissions`) e ação `archiveTask(taskId, archived)`. |
| **Navegação & Telas** | `src/components/layout/coydash-shell.tsx`, `src/components/tasks/*`, `src/app/colaboradores/page.tsx` | Aplicação visual das restrições, filtragem de pastas/telas para `isGuestScopedLevel`, filtro `Arquivadas`, criação/exclusão condicionada e gestão completa de níveis e ajustes finos em `/colaboradores`. |

---

## 7. Checklist Obrigatório ao Criar Nova Funcionalidade

Ao implementar qualquer nova tela, rota de API ou ação operacional no CoyDash:

1. [ ] Definir em qual(is) dos 5 níveis (`GUEST`, `GUEST_COLLABORATOR`, `GUEST_MANAGER`, `MEMBER`, `ADMIN`) a funcionalidade deve ser liberada por padrão.
2. [ ] Adicionar ou reutilizar a `FeaturePermissionKey` correspondente em `src/lib/access-control.ts` (`FEATURE_PERMISSION_CATALOG`).
3. [ ] Validar `hasFeaturePermission(actorCtx, ...)` no route handler do backend (`/api/coydash/sync` ou rota específica) antes de persistir alterações.
4. [ ] Aplicar a verificação equivalente na UI (ocultar ou desabilitar botões restritos conforme Design System).
5. [ ] Atualizar este documento ([`spec/coydash_funcionalidades_e_permissoes.md`](./coydash_funcionalidades_e_permissoes.md)) na tabela do módulo correspondente.
6. [ ] Registrar a nova funcionalidade e decisões técnicas no diário de sessão do [`MEMORY.md`](../MEMORY.md).
