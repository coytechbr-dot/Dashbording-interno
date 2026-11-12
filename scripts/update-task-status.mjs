import fs from 'fs'
import path from 'path'

// 1. Atualizar TASKS.md
const tasksPath = path.resolve(process.cwd(), 'TASKS.md')
let tasksContent = fs.readFileSync(tasksPath, 'utf8')

tasksContent = tasksContent.replace(
  /- \[ \] \*\*TASK-13\.8 — Adicionar o Módulo no Shell e Validar Build:\*\*[\s\S]*?- Testar todas as rotas em `http:\/\/localhost:3005` e validar fidelidade estética ao `spec\/DESIGN\.md`\./,
  `- [x] **TASK-13.8 — Adicionar o Módulo no Shell e Validar Build:**
  - Incluir item **"Comercial & Vendas"** (\`/comercial\`) no menu principal da Sidebar (\`src/components/layout/coydash-shell.tsx\`) com ícone \`Briefcase\`, contador dinâmico de oportunidades (\`deals.length\`) e indicador de notificação na sidebar minimizada.
  - Atualizar controle granular de telas do sistema (\`SYSTEM_SCREENS\`) e presets de cargos do setor Comercial & Vendas em \`src/app/colaboradores/page.tsx\` para suporte automático de permissões.
  - Executar verificação estrita de TypeScript (\`npx tsc --noEmit\` — 0 erros com código de saída 0).
  - Executar build de produção do Next.js Turbopack (\`npm run build\` — 34/34 rotas compiladas com sucesso).
  - Validar fidelidade estética absoluta ao Design System Roomie Office AI (\`spec/DESIGN.md\`).`
)

fs.writeFileSync(tasksPath, tasksContent, 'utf8')
console.log('✅ TASKS.md atualizado com sucesso!')

// 2. Atualizar task.md
const taskMdPath = path.resolve(process.cwd(), 'task.md')
let taskMdContent = fs.readFileSync(taskMdPath, 'utf8')

taskMdContent = taskMdContent.replace(
  /- \[ \] \*\*TASK-13\.8:\*\* Atualizar navegação e validar projeto:[\s\S]*?- Garantir 100% de conformidade com o Design System Roomie Office AI \(`spec\/DESIGN\.md`\)\./,
  `- [x] **TASK-13.8:** Atualizar navegação e validar projeto:
  - Inserir **"Comercial & Vendas"** (\`/comercial\`) no menu da Sidebar (\`src/components/layout/coydash-shell.tsx\`) com ícone \`Briefcase\`, contador dinâmico (\`deals.length\`) e badge minimizado.
  - Atualizar permissões de tela (\`SYSTEM_SCREENS\`) e presets de cargos no setor Comercial & Vendas em \`/colaboradores\`.
  - Executar verificação estrita de TypeScript (\`npx tsc --noEmit\` — 0 erros).
  - Executar build de produção do Next.js Turbopack (\`npm run build\` — 34/34 rotas compiladas com sucesso).
  - Fidelidade estética absoluta ao Design System Roomie Office AI (\`spec/DESIGN.md\`).`
)

fs.writeFileSync(taskMdPath, taskMdContent, 'utf8')
console.log('✅ task.md atualizado com sucesso!')

