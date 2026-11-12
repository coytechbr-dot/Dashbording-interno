import fs from 'fs'
import path from 'path'

const memoryPath = path.resolve(process.cwd(), 'MEMORY.md')
let memoryContent = fs.readFileSync(memoryPath, 'utf8')

// Atualizar Seção 2
memoryContent = memoryContent.replace(
  /- \*\*Fase Atual:\*\* `FASE 13 — Engenharia Reversa do Twenty CRM & Governança de IA: TASK-13\.1 até 13\.7 Concluídas[\s\S]*?- \*\*Últimas Entregas Concluídas:\*\*/,
  `- **Fase Atual:** \`FASE 13 CONCLUÍDA — Engenharia Reversa do Twenty CRM & Governança de IA: 100% das Tasks Entregues (TASK-13.1 até 13.8) com Build de Produção Aprovado (34/34 rotas), 0 Erros de TypeScript, App Shell Integrado e Protocolo MCP Universal Ativo\`
- **Últimas Entregas Concluídas:**
  0. **App Shell, Navegação Integrada & Build de Produção Final (TASK-13.8):**
     - Menu Lateral (\`coydash-shell.tsx\`) com **"Comercial"** (\`/comercial\`) plenamente integrado, exibindo ícone \`Briefcase\`, contador dinâmico de negócios em tempo real (\`deals.length\`) e indicador de notificação no modo minimizado.
     - Permissões de Telas Granulares (\`SYSTEM_SCREENS\`) e Presets de Convite do Setor Comercial & Vendas atualizados em \`/colaboradores\` com suporte nativo a \`comercial\`.
     - Verificação estrita de TypeScript (\`npx tsc --noEmit\`): **0 erros (Código de saída 0)**.
     - Build de Produção do Next.js Turbopack (\`npm run build\`): **100% de sucesso (34/34 rotas estáticas e dinâmicas compiladas)**.
     - Fidelidade estética total ao Design System Roomie Office AI (\`spec/DESIGN.md\`).`
)

// Adicionar Sessão 18 no final
const session18Text = `

### [2026-11-12] — Sessão 18: Conclusão da TASK-13.8 — App Shell, Navegação Integrada e Validação de Build de Produção (Fase 13 100% Finalizada)
- **Agente:** Antigravity (Gemini)
- **Objetivo da Sessão:** Concluir a última task da Fase 13, integrando o módulo Comercial no App Shell (\`coydash-shell.tsx\`) com badges de contadores e notificações minimizadas, alinhando as permissões de RH em \`/colaboradores\` e validando compilação estrita (\`tsc\`) e build de produção (\`npm run build\`).
- **Arquivos Modificados:**
  - [\`src/components/layout/coydash-shell.tsx\`](./src/components/layout/coydash-shell.tsx): Extração reativa de \`deals\` do store, badge com contagem de oportunidades ativas em \`/comercial\` (\`deals.length\`) e ponto de alerta laranja \`#F0521F\` na sidebar recolhida.
  - [\`src/app/colaboradores/page.tsx\`](./src/app/colaboradores/page.tsx): Adição de \`{ key: 'comercial', label: 'Comercial & Funil de Vendas', icon: Briefcase }\` em \`SYSTEM_SCREENS\` e inclusão de \`comercial\` nos presets do setor 'Comercial & Vendas' (Closer, SDR, Executivo de Contas e Gerente Comercial).
  - [\`spec/coytech_sdd_10_coydash_universal_mcp_server.md\`](./spec/coytech_sdd_10_coydash_universal_mcp_server.md): Documentação formal do MCP Server atualizada com guia de testes pelo navegador, terminal e cURL, e checklist 100% concluído.
  - [\`TASKS.md\`](./TASKS.md) & [\`task.md\`](./task.md): Marcação da TASK-13.8 como concluída (\`[x]\`).
- **Resultados da Validação Técnica:**
  - \`npx tsc --noEmit\`: **0 erros de tipagem**.
  - \`npm run build\`: **34/34 rotas compiladas com sucesso** via Next.js Turbopack.
- **Status da Fase 13:** **100% Concluída com Sucesso absoluto** (TASK-13.1 até TASK-13.8).`

memoryContent = memoryContent.trim() + session18Text + '\n'
fs.writeFileSync(memoryPath, memoryContent, 'utf8')
console.log('✅ MEMORY.md atualizado com sucesso!')

