# DESIGN — Design System Oficial (CoyDash — Identidade Azul Elétrico)

> **REGRA OFICIAL DO PROJETO COYDASH:** O CoyDash adota o **Azul Elétrico `#0066FF`** como único acento de marca e destaque oficial (hover `#0052CC`), com fundo de superfícies adaptáveis claro/escuro, tipografia `Schibsted Grotesk`, ícones Lucide com traço fino, cantos arredondados modernos (12–16px, pílulas de 999px), modais cinematográficas (`bg-black/60 backdrop-blur-sm`) e **dropdowns premium estilizados (`CoyDropdown`) com ícones de tarefas**, eliminando selects nativos sem estilo.

---

## 1. Princípios

1. **Um só acento de marca.** **Azul Elétrico `#0066FF`** (`--color-brand-blue`, hover `#0052CC`) é a única cor de ação, botão primário e destaque. Não usar laranja como cor de destaque.
2. **Escuro por padrão, claro por opção.** Superfícies usam variáveis de tema; o acento azul, tinta e papel são os pilares de contraste.
3. **Contraste no Botão Primário.** Textos sobre botões de destaque azul usam `#FFFFFF` (branco puro).
4. **Linha e Forma Refinadas.** Ilustrações e ícones são traço limpo; nada decorativo sem função.
5. **Dropdowns & Janelas Premium.** Todas as seleções de listas, fases, clientes e prioridades usam `CoyDropdown` com ícones semânticos, checkmarks e popovers flutuantes com `shadow-2xl`. Janelas modais usam overlay escurecido com blur (`bg-black/60 backdrop-blur-sm`).
6. **Tudo em português.** pt-BR, tom direto, executivo e amigável.

---

## 2. Cores

### 2.1 Fixas (não mudam com o tema)

| Token no design | Variável no código | Hex | Uso |
|---|---|---|---|
| Azul da Marca | `--color-brand-blue` | `#0066FF` | Botão primário, item ativo, progresso, links de destaque |
| Azul hover | `--color-brand-blue-hover` | `#0052CC` | Hover do primário |
| Acento (retrocompat.) | `--color-brand-orange` | `#0066FF` | Redirecionado para azul para compatibilidade de tokens |
| Acento hover (retro.) | `--color-brand-orange-hover` | `#0052CC` | Redirecionado para azul hover |
| Tinta | `--color-brand-ink` | `#141414` | Texto/traço sobre papel e fundos claros |
| Papel | `--color-brand-paper` | `#F4F4F2` | Fundo de cards ilustrados claros |

### 2.2 De tema (`src/app/globals.css`)

| Design | Código | Escuro (`data-theme="dark"`) | Claro (`data-theme="light"`) | Uso |
|---|---|---|---|---|
| `--bg` | `--bg` | `#141414` | `#F4F3F0` | Fundo do app |
| `--fg` | `--fg` | `#F2F2F2` | `#141414` | Texto principal |
| `--fg2` | `--fg2` | `#D6D6D6` | `#2A2A2A` | Texto secundário forte |
| `--muted` | **`--ds-muted`** | `#9A9A9A` | `#6A6864` | Legendas, placeholders, ícones inativos |
| `--surface` | `--surface` | `#262626` | `#FFFFFF` | Cards, campos, item ativo |
| `--hover` | **`--ds-hover`** | `#1E1E1E` | `#EAE8E3` | Hover de menu |
| `--line` | `--line` | `#232323` | `#E2E0DB` | Divisórias |
| `--line2` | `--line2` | `#3A3A3A` | `#D4D1CB` | Bordas de campo, trilhos |
| `--hero` | `--hero` | `#0D223F` | `#E2EDFD` | Bloco de destaque (azul suave/profundo) |
| `--hero-sub` | `--hero-sub` | `#93C5FD` | `#1E40AF` | Texto dentro do destaque |

### 2.3 Status (só em pontos de 5–8 px ou badges de prioridade)

| Cor | Hex | Significado |
|---|---|---|
| Verde | `#2F9E5A` | Online / presença / Concluído |
| Azul | `#0066FF` | Tarefa entregue · Em andamento do CoyDash |
| Amarelo / Âmbar | `#E8C14A` | Alta prioridade · Atenção |
| Vermelho | `#EF4444` | Urgente · Bloqueio · Erro |
| Lilás | `#8F7DFF` | Aguardando validação · Evento aberto |

---

## 3. Tipografia

Fonte única: **Schibsted Grotesk** (400/500/600/700), carregada por `next/font/google` em `--font-sans`.

| Estilo | Tamanho / peso / entrelinha | Tracking | Uso |
|---|---|---|---|
| Logo | 26 / 700 / 1 | -0.5px | Sempre azul `#0066FF` |
| Display | 42 / 600 / 1.02 | -1.4px | Título de login/cadastro |
| Destaque | 34–40 / 600 / 1.02–1.04 | -1.2 a -1.4px | Boas-vindas, painéis |
| Título de página | 28 / 600 | -0.8px | Cabeçalho de cada rota |
| Card | 19–22 / 500 / 1.05 | -0.4px | Título de card de sala |
| Seção | 18 / 400 | — | "Tarefas de hoje", "Agenda" |
| Corpo | 13–14 / 400–500 | — | Listas, botões |
| Legenda | 11–12 / 400 | — | Descrições, horários |
| Mínimo | 10.5 | — | Tags. **Nada abaixo disso.** |

Títulos grandes: `text-wrap: balance`.

---

## 4. Espaçamento, forma e toque

| Elemento | Raio |
|---|---|
| Frame | 22px |
| Bloco de destaque | 18px |
| Card de sala | 12–14px |
| Card de lista / campo | 12px (mobile 14px) |
| Item de menu | 10px |
| Botão sobre azul | 9px |
| Tag | 6px |
| Botões e pílulas | 999px |

- **Padding:** app 26px lateral · cards 14–16px · destaque 28px.
- **Gaps:** sempre flex/grid + `gap`. Menu 4px · campos 14–16px · grupos 22–28px.
- **Alturas:** botão 50px (mobile 54) · campo 48px (mobile 52) · chip 36px (mobile 44). No mobile, nada abaixo de 44px.

---

## 5. Ícones

- Grade 16×16, traço **1.4px**, `stroke="currentColor"`.
- Branco sobre azul; `--ds-muted` quando inativos; `--color-brand-blue` quando ativos.
- Biblioteca: `lucide-react` com `strokeWidth={1.4}` (ou os SVGs exatos 16×16 do Design System).
- A seta **↗** (`ArrowUpRight`) acompanha **todo** botão primário, à direita.

---

## 6. Componentes

### Botões
| Tipo | Especificação |
|---|---|
| Primário | Pílula azul `#0066FF`, texto branco `#FFFFFF` 14/600, seta ↗ à direita (`justify-between`). Hover `#0052CC`. **Um por tela.** |
| Compacto | Igual, 42px de altura, para ações dentro de cards ("Ver entregas") |
| Sobre azul | Retângulo tinta `#141414`, raio 9px, texto branco + seta ("Fazer upgrade") |
| Social | Pílula `--surface`, inicial dentro de círculo com contorno (Google, Microsoft) |
| Alternar tema | Círculo 38px `--surface`; sol no escuro, lua no claro |

### Campos & Dropdowns
- Fundo `--surface`, borda 1.5px `--line2`, **borda azul `#0066FF` no foco** com anel suave `ring-2 ring-blue-500/15`.
- Rótulo acima, 12px `--ds-muted`. No mobile, só placeholder.
- **Dropdowns Premium (`CoyDropdown`):** filtros centrais de tarefas, listas, fases, clientes e prioridades utilizam o componente `CoyDropdown`, com ícones temáticos de tarefas e popover suspenso flutuante (`shadow-2xl rounded-xl`).
- Força da senha: 4 barras de 3px (azul = preenchida).

### Seleção
- **Chips:** selecionado azul `#0066FF` com texto branco; padrão `--surface` com borda `--line2`.
- **Checkbox:** 16px, azul com check branco.
- **Etapas:** barras 22×4px, azul = atual.

### Selos e tags
- **Selo de presença:** pílula `--surface`: `[robô azul] 3 agentes ativos | [ponto verde] 8 online`. `nowrap`.
- **Tag de status:** raio 6px, fundo `--bg`, borda `--line2`, ponto colorido (5px), texto 10.5px.

### Navegação
- **Sidebar desktop (220px):** logo, itens, card Plus no rodapé. Ativo `--surface` + `--fg`; inativo `--ds-muted`; hover `--ds-hover`.
- **Barra inferior mobile:** flutuante, raio 22px, 64px; item ativo = quadrado azul 46px raio 15px.

### Card de sala
- Estrutura: **número** (01, 02…) · **selo de presença** · **título em 2 linhas** · **ilustração ancorada na base**, cortada pela borda.
- Fundo Papel `#F4F4F2` ou Azul Escuro/Elétrico `#0066FF`. Alternar na sequência.
- No dashboard, os cards vazam pela direita; no login, ficam em leque (-6° a 9°).

### Linha de agente NPC
`[avatar com inicial] · Nome · Função · Descrição da entrega · Tag de status`
- Tarefa entregue: avatar com borda azul + selo de check.
- A descrição diz **o que o agente devolveu** ("Relatório semanal de vendas pronto.").
- Mobile: descrição abaixo do nome, sem tag.

### Card de agenda
`--surface`, raio 12px, título, horário ou "Começa em X min", tag do tipo e avatares sobrepostos (-7px); um pode ser agente (círculo azul com robô).

### Bloco de destaque
Fundo `--hero`: saudação → título → botão primário compacto → cards de sala à direita (abaixo no mobile).

### Card Plus
Fundo azul elétrico `#0066FF`, mascote NPC saindo pelo topo, título 23/700 texto branco, botão "Fazer upgrade".

### Painel de conversa com agente (Drawer)
- Drawer à direita, 380px, `--surface`, raio 18px nos cantos internos.
- Cabeçalho: avatar azul com robô + nome + cargo + tag de status.
- Mensagens do agente em `--bg` com borda `--line2`; do usuário em azul `#0066FF` com texto branco.
- Ação primária: "Criar tarefa para {nome}" (botão primário com ↗).
- Rodapé: campo de texto 48px, enviar com Enter.

---

## 7. Ilustrações

- Traço **2px `#141414`**, pontas e junções arredondadas, sem sombra nem gradiente.
- Sobre Papel `#F4F4F2` ou Azul `#0066FF`; preenchimento interno com a cor do fundo para esconder linhas de trás.
- Sempre **cortada pela borda inferior**. Nunca flutua.
- `viewBox` com 200 de largura e recorte superior (`0 20 200 130`, `0 10 200 140`).
- Conjunto: Sala de foco · Agentes de IA · Copa da equipe · Mascote NPC.

---

## 8. Tema claro / escuro

- Aplicado via `document.documentElement.dataset.theme = 'light' | 'dark'` **e** classe `.dark` (para o shadcn).
- Persistido em `localStorage['dash-theme']`, compartilhado por todas as telas.
- Azul, cards ilustrados, card Plus e botões primários mantêm o contraste com o tema.

---

## 9. Layout

| Contexto | Estrutura |
|---|---|
| Desktop (1200×820) | Sidebar 220px · conteúdo com cabeçalho (busca, selo, tema, avatar), destaque e grade `1fr / 330px` |
| Login/Cadastro desktop | Duas colunas `1fr 1fr`, 14px de respiro; formulário à esquerda (máx. 400–420px), painel ilustrado à direita |
| Mobile (390×844) | Cabeçalho compacto, destaque, seções empilhadas, barra inferior flutuante |

---

## 10. Voz e texto

- Segunda pessoa, frases curtas: "Que bom te ver de novo", "Seu time já está no escritório."
- Botões dizem o que acontece: "Entrar no escritório", "Criar escritório", "Ver entregas".
- Agentes: fale do **resultado**, não do processo: "Triou 14 currículos", não "Está processando currículos".
- Números `1.230`, horas `18:00–19:00`.

---

## 11. Não faça

- **Nenhuma cor de acento de marca além do azul elétrico `#0066FF`. Não usar laranja como cor de destaque.**
- **Nenhum select nativo sem estilo:** utilizar `CoyDropdown` nos filtros e telas para manter o visual premium com ícones.
- **Nenhum input de data ou hora nativo sem estilo (`<input type="date">` / `<input type="datetime-local">`):** utilizar sempre o componente oficial `CoyDatePicker` (`src/components/ui/coy-date-picker.tsx`), com popover suspenso flutuante, seleção em azul `#0066FF`, atalhos rápidos ("Hoje", "Amanhã", "+3 dias", "+1 semana") e dias em Português.
- **Nenhuma seleção de responsável sem minipop estilizado:** a escolha de responsáveis e colaboradores deve ser feita obrigatoriamente através do componente `CoyAssigneePicker` (`src/components/ui/coy-assignee-picker.tsx`), abrindo um minipop flutuante que exibe a foto/avatar circular com iniciais e gradiente, nome completo, cargo/especialidade e setor do usuário, com busca instantânea e suporte a seleção múltipla ou única.
- **Nenhum seletor de cor nativo cru (`<input type="color">`):** utilizar sempre `CoyColorPicker` (`src/components/ui/coy-color-picker.tsx`) com as cores pré-definidas da marca CoyDash e entrada hexadecimal estilizada.
- Nenhum emoji na interface do dashboard.
- Nenhuma ilustração colorida.
- Nunca dois botões primários na mesma área.
- Nenhum texto em inglês.
- Nenhum texto abaixo de 10.5px; no mobile, alvos ≥ 44px.
