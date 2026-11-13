<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 🚨 PROTOCOLO OBRIGATÓRIO DE WORKFLOW: ATUALIZAÇÃO CONTÍNUA DA MEMÓRIA (`MEMORY.md`)

## ⚡ REGRA MANDATÓRIA E INEGOCIÁVEL PARA TODOS OS AGENTES (ANTIGRAVITY / CLAUDE / GEMINI)

Sempre que você criar, modificar, corrigir ou implementar **QUALQUER** funcionalidade, tela, componente, rota de API, script, migração de banco de dados ou integração neste projeto:

### 1. ATUALIZAÇÃO IMEDIATA DO `MEMORY.md` E DO SPEC DE PERMISSÕES (`spec/coydash_funcionalidades_e_permissoes.md`):
Antes de dar qualquer resposta como "concluída" para o usuário, você **DEVE OBRIGATORIAMENTE**:
1. **Registrar Novas Funcionalidades & Permissões em [`spec/coydash_funcionalidades_e_permissoes.md`](./spec/coydash_funcionalidades_e_permissoes.md):**
   - Sempre que criar ou alterar uma funcionalidade, tela, ação ou botão operacional, catalogar a funcionalidade na matriz oficial do documento `spec/coydash_funcionalidades_e_permissoes.md`, definindo qual dos 5 níveis de acesso (`GUEST`, `GUEST_COLLABORATOR`, `GUEST_MANAGER`, `MEMBER`, `ADMIN`) pode visualizá-la/executá-la e atualizando `src/lib/access-control.ts` + validações de backend (`/api/coydash/sync`).
2. **Abrir e editar [`MEMORY.md`](./MEMORY.md) realizando os 3 passos:**
   - **Seção 5 (Diário de Progresso & Changelog):** Inserir data `[AAAA-MM-DD] — Sessão XX: [Título do que foi feito]`, listando o agente, objetivo, arquivos criados/modificados, funcionalidades/permissões atualizadas, decisões técnicas e status.
   - **Seção 2 (Estado Atual & Mapa de Arquivos):** Atualizar a `Fase Atual`, `Última Task Concluída` e listar novos arquivos relevantes criados no projeto.
   - **Sincronizar com `TASKS.md`:** Marcar `[x]` nas tasks concluídas correspondentes no arquivo [`TASKS.md`](./TASKS.md).

### 2. RIGOR DO DESIGN SYSTEM E IDIOMA:
- **Português obrigatório:** Sempre responder ao usuário em Português.
- **Design System Intocável:** Seguir 100% o Design System do `CoyDash` ([`spec/DESIGN.md`](./spec/DESIGN.md)): único acento oficial **Azul Elétrico `#0066FF`** (hover `#0052CC`), fonte Schibsted Grotesk, dropdowns premium estilizados (`CoyDropdown`) com ícones temáticos, sem selects nativos do SO, sem emojis na interface e sem textos em inglês. Nunca usar laranja como cor de destaque.

> **⚠️ NUNCA finalize um turno de implementação sem ter persistido a memória em `MEMORY.md`. Isso garante handover perfeito entre agentes e zero perda de contexto.**

