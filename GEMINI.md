# 🧠 DIRETRIZES DE WORKFLOW DO PROJETO COYDASH (`GEMINI.md`)

## 🚨 REGRA MANDATÓRIA: ATUALIZAÇÃO CONTÍNUA DA MEMÓRIA (`MEMORY.md`)

Sempre que qualquer agente implementar, alterar ou corrigir qualquer funcionalidade, componente, tela, rota de API, migração de banco de dados ou integração neste projeto:

### 1. OBRIGATÓRIO ATUALIZAR `MEMORY.md` APÓS CADA IMPLEMENTAÇÃO:
Antes de responder ao usuário informando que a tarefa foi finalizada, o agente **DEVE**:
1. **Adicionar a Sessão no Diário de Progresso & Changelog (Seção 5 de `MEMORY.md`):**
   - Data, arquivos criados e modificados, lógica implementada e decisões técnicas.
2. **Atualizar o Estado Atual (Seção 2 de `MEMORY.md`):**
   - Fase atual, última task entregue e mapa de novos arquivos criados.
3. **Marcar `[x]` no arquivo `TASKS.md`:**
   - Garantir que as tasks concluídas estejam marcadas com `[x]`.

### 2. PRINCÍPIOS FUNDAMENTAIS DO PROJETO:
- **Idioma:** Sempre responder em Português.
- **Design System:** Seguir 100% o Design System do `ROOMIE OFFICE AI` ([`spec/DESIGN.md`](./spec/DESIGN.md)) — Laranja `#F0521F`, Papel `#F4F4F2`, Tinta `#141414`, Schibsted Grotesk, sem emojis na interface.
- **Validação de Build:** Sempre rodar `npx tsc --noEmit` ou `npm run build` após mudanças de código antes de considerar concluído.

