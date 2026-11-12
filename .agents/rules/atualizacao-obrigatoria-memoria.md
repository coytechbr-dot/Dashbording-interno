---
description: Obriga todo agente a atualizar o arquivo MEMORY.md e TASKS.md logo após implementar qualquer funcionalidade ou alteração.
globs: ["**/*"]
always_on: true
---

# 🚨 Atualização Obrigatória da Memória do Projeto (`MEMORY.md`)

Todo agente (Antigravity, Claude, Gemini, etc.) atuando no projeto **CoyDash** DEVE seguir este protocolo:

## Protocolo de Pós-Implementação:
Sempre que concluir a implementação ou alteração de código (frontend, backend, SQL, componentes, tipos, scripts):
1. **Editar `MEMORY.md`:**
   - Registrar no Diário de Progresso (Seção 5) a sessão atual com o que foi feito e os arquivos modificados/criados.
   - Atualizar a Seção 2 com o Estado Atual e mapa de novos arquivos.
2. **Atualizar `TASKS.md`:**
   - Marcar `[x]` nas tasks concluídas.
3. **Validação de Tipagem & Build:**
   - Executar `npx tsc --noEmit` para garantir 0 erros de TypeScript.
4. **Comunicação com o Usuário:**
   - Responder em Português confirmando o que foi feito e que a memória do projeto foi devidamente atualizada.

