<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 🚨 PROTOCOLO OBRIGATÓRIO DE WORKFLOW: ATUALIZAÇÃO CONTÍNUA DA MEMÓRIA (`MEMORY.md`)

## ⚡ REGRA MANDATÓRIA E INEGOCIÁVEL PARA TODOS OS AGENTES (ANTIGRAVITY / CLAUDE / GEMINI)

Sempre que você criar, modificar, corrigir ou implementar **QUALQUER** funcionalidade, tela, componente, rota de API, script, migração de banco de dados ou integração neste projeto:

### 1. ATUALIZAÇÃO IMEDIATA DO `MEMORY.md`:
Antes de dar qualquer resposta como "concluída" para o usuário, você **DEVE OBRIGATORIAMENTE** abrir e editar o arquivo [`MEMORY.md`](./MEMORY.md) realizando os 3 passos:
1. **Adicionar a Sessão Atual no Diário de Progresso & Changelog (Seção 5):**
   - Inserir data `[AAAA-MM-DD] — Sessão XX: [Título do que foi feito]`.
   - Listar o agente, objetivo, arquivos criados/modificados, decisões técnicas e status.
2. **Atualizar o Estado Atual & Mapa de Arquivos (Seção 2):**
   - Atualizar a `Fase Atual`, `Última Task Concluída` e listar novos arquivos relevantes criados no projeto.
3. **Sincronizar com `TASKS.md`:**
   - Marcar `[x]` nas tasks concluídas correspondentes no arquivo [`TASKS.md`](./TASKS.md).

### 2. RIGOR DO DESIGN SYSTEM E IDIOMA:
- **Português obrigatório:** Sempre responder ao usuário em Português.
- **Design System Intocável:** Seguir 100% o Design System do `ROOMIE OFFICE AI` ([`spec/DESIGN.md`](./spec/DESIGN.md)): único acento Laranja `#F0521F`, fonte Schibsted Grotesk, sem emojis na interface e sem textos em inglês.

> **⚠️ NUNCA finalize um turno de implementação sem ter persistido a memória em `MEMORY.md`. Isso garante handover perfeito entre agentes e zero perda de contexto.**

