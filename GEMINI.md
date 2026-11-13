# 🧠 DIRETRIZES DE WORKFLOW DO PROJETO COYDASH (`GEMINI.md`)

## 🚨 REGRA MANDATÓRIA: ATUALIZAÇÃO CONTÍNUA DA MEMÓRIA (`MEMORY.md`)

Sempre que qualquer agente implementar, alterar ou corrigir qualquer funcionalidade, componente, tela, rota de API, migração de banco de dados ou integração neste projeto:

### 1. OBRIGATÓRIO ATUALIZAR `spec/coydash_funcionalidades_e_permissoes.md` E `MEMORY.md` APÓS CADA IMPLEMENTAÇÃO:
Antes de responder ao usuário informando que a tarefa foi finalizada, o agente **DEVE**:
1. **Catalogar Funcionalidades e Permissões em [`spec/coydash_funcionalidades_e_permissoes.md`](./spec/coydash_funcionalidades_e_permissoes.md):**
   - Toda nova funcionalidade, tela, modal ou ação destrutiva/administrativa criada no app **DEVE** ser adicionada à matriz de funcionalidades do documento `spec/coydash_funcionalidades_e_permissoes.md` com o seu nível mínimo de permissão (`GUEST`, `GUEST_COLLABORATOR`, `GUEST_MANAGER`, `MEMBER`, `ADMIN`) e sincronizada com `src/lib/access-control.ts` e rotas de API.
2. **Adicionar a Sessão no Diário de Progresso & Changelog (Seção 5 de `MEMORY.md`):**
   - Data, arquivos criados e modificados, lógica implementada, permissões adicionadas e decisões técnicas.
3. **Atualizar o Estado Atual (Seção 2 de `MEMORY.md`):**
   - Fase atual, última task entregue e mapa de novos arquivos criados.
4. **Marcar `[x]` no arquivo `TASKS.md`:**
   - Garantir que as tasks concluídas estejam marcadas com `[x]`.

### 2. PRINCÍPIOS FUNDAMENTAIS DO PROJETO:
- **Idioma:** Sempre responder em Português.
- **Design System:** Seguir 100% o Design System do `CoyDash` ([`spec/DESIGN.md`](./spec/DESIGN.md)) — Único acento oficial **Azul Elétrico `#0066FF`** (hover `#0052CC`), Papel `#F4F4F2`, Tinta `#141414`, Schibsted Grotesk, dropdowns premium (`CoyDropdown`) com ícones de tarefas, sem selects nativos sem estilo e sem emojis na interface. Nunca utilizar laranja como acento de marca.
- **Validação de Build:** Sempre rodar `npx tsc --noEmit` ou `npm run build` após mudanças de código antes de considerar concluído.

