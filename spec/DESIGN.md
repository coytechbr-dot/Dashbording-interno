# DESIGN — Design System Oficial (Idêntico ao ROOMIE OFFICE AI)

> **REGRA INVIOLÁVEL DO PROJETO COYDASH:** Usar **exatamente** o Design System do projeto `C:\Espaço de Trabalho\JuriPages\Projetos\ROOMIE OFFICE AI` (`spec/17-spec-design-system/DESIGN-SYSTEM.md`, `docs/DESIGN.md` e `src/app/globals.css`) **sem mudar nada** (mesmas variáveis CSS, mesmas cores fixas e de tema, mesma tipografia `Schibsted Grotesk`, mesmos raios, mesmos componentes, mesmas ilustrações de traço 2px `#141414`, mesmos pontos de status de 5–8px e mesmas regras "Não faça").

---

## 1. Princípios

1. **Um só acento.** Laranja `#F0521F` é a única cor de ação e destaque. Não crie outras cores de marca.
2. **Escuro por padrão, claro por opção.** Superfícies usam variáveis de tema; só laranja, tinta e papel são fixos.
3. **Linha, não preenchimento.** Ilustrações e ícones são traço preto; a cor vem do fundo do card.
4. **Denso, mas calmo.** Pouco texto, hierarquia clara, nada decorativo sem função.
5. **Tudo em português.** pt-BR, tom direto e amigável.

---

## 2. Cores

### 2.1 Fixas (não mudam com o tema)

| Token no design | Variável no código | Hex | Uso |
|---|---|---|---|
| Laranja | `--color-brand-orange` | `#F0521F` | Botão primário, item ativo, progresso, card de agente |
| Laranja hover | `--color-brand-orange-hover` | `#FF6A36` | Hover do primário |
| Tinta | `--color-brand-ink` | `#141414` | Texto/traço sobre laranja e papel |
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
| `--hero` | `--hero` | `#3B1E15` | `#FFDDCC` | Bloco de destaque |
| `--hero-sub` | `--hero-sub` | `#E8D8D0` | `#7A3A22` | Texto dentro do destaque |

### 2.3 Status (só em pontos de 5–8 px, nunca como fundo)

| Cor | Hex | Significado |
|---|---|---|
| Verde | `#2F9E5A` | Online / presença / Disponível |
| Laranja | `#F0521F` | Tarefa entregue · Evento de equipe |
| Amarelo | `#E8C14A` | Em andamento · Evento individual |
| Lilás | `#8F7DFF` | Aguardando você · Evento aberto |

---

## 3. Tipografia

Fonte única: **Schibsted Grotesk** (400/500/600/700), carregada por `next/font/google` em `--font-sans`.

| Estilo | Tamanho / peso / entrelinha | Tracking | Uso |
|---|---|---|---|
| Logo | 26 / 700 / 1 | -0.5px | Sempre laranja `#F0521F` |
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
| Botão sobre laranja | 9px |
| Tag | 6px |
| Botões e pílulas | 999px |

- **Padding:** app 26px lateral · cards 14–16px · destaque 28px.
- **Gaps:** sempre flex/grid + `gap`. Menu 4px · campos 14–16px · grupos 22–28px.
- **Alturas:** botão 50px (mobile 54) · campo 48px (mobile 52) · chip 36px (mobile 44). No mobile, nada abaixo de 44px.

---

## 5. Ícones

- Grade 16×16, traço **1.4px**, `stroke="currentColor"`.
- Tinta sobre laranja; `--ds-muted` quando inativos.
- Biblioteca: `lucide-react` com `strokeWidth={1.4}` (ou os SVGs exatos 16×16 do Design System).
- A seta **↗** (`ArrowUpRight`) acompanha **todo** botão primário, à direita.

---

## 6. Componentes

### Botões
| Tipo | Especificação |
|---|---|
| Primário | Pílula laranja `#F0521F`, texto tinta `#141414` 14/600, seta ↗ à direita (`justify-between`). Hover `#FF6A36`. **Um por tela.** |
| Compacto | Igual, 42px de altura, para ações dentro de cards ("Ver entregas") |
| Sobre laranja | Retângulo tinta `#141414`, raio 9px, texto branco + seta ("Fazer upgrade") |
| Social | Pílula `--surface`, inicial dentro de círculo com contorno (Google, Microsoft) |
| Alternar tema | Círculo 38px `--surface`; sol no escuro, lua no claro |

### Campos
- Fundo `--surface`, borda 1.5px `--line2`, **borda laranja `#F0521F` no foco**.
- Rótulo acima, 12px `--ds-muted`. No mobile, só placeholder.
- Força da senha: 4 barras de 3px (laranja = preenchida).

### Seleção
- **Chips:** selecionado laranja com texto tinta; padrão `--surface` com borda `--line2`.
- **Checkbox:** 16px, laranja com check tinta.
- **Etapas:** barras 22×4px, laranja = atual.

### Selos e tags
- **Selo de presença:** pílula `--surface`: `[robô laranja] 3 agentes ativos | [ponto verde] 8 online`. `nowrap`.
- **Tag de status:** raio 6px, fundo `--bg`, borda `--line2`, ponto colorido (5px), texto 10.5px.

### Navegação
- **Sidebar desktop (220px):** logo, itens, card Plus no rodapé. Ativo `--surface` + `--fg`; inativo `--ds-muted`; hover `--ds-hover`.
- **Barra inferior mobile:** flutuante, raio 22px, 64px; item ativo = quadrado laranja 46px raio 15px.

### Card de sala
- Estrutura: **número** (01, 02…) · **selo de presença** · **título em 2 linhas** · **ilustração ancorada na base**, cortada pela borda.
- Fundo Papel `#F4F4F2` ou Laranja `#F0521F`. Alternar na sequência.
- No dashboard, os cards vazam pela direita; no login, ficam em leque (-6° a 9°).

### Linha de agente NPC
`[avatar com inicial] · Nome · Função · Descrição da entrega · Tag de status`
- Tarefa entregue: avatar com borda laranja + selo de check.
- A descrição diz **o que o agente devolveu** ("Relatório semanal de vendas pronto.").
- Mobile: descrição abaixo do nome, sem tag.

### Card de agenda
`--surface`, raio 12px, título, horário ou "Começa em X min", tag do tipo e avatares sobrepostos (-7px); um pode ser agente (círculo laranja com robô).

### Bloco de destaque
Fundo `--hero`: saudação → título → botão primário compacto → cards de sala à direita (abaixo no mobile).

### Card Plus
Fundo laranja `#F0521F`, mascote NPC saindo pelo topo, título 23/700 tinta, botão "Fazer upgrade".

### Painel de conversa com agente (Drawer)
- Drawer à direita, 380px, `--surface`, raio 18px nos cantos internos.
- Cabeçalho: avatar laranja com robô + nome + cargo + tag de status.
- Mensagens do agente em `--bg` com borda `--line2`; do usuário em laranja com texto tinta.
- Ação primária: "Criar tarefa para {nome}" (botão primário com ↗).
- Rodapé: campo de texto 48px, enviar com Enter.

---

## 7. Ilustrações

- Traço **2px `#141414`**, pontas e junções arredondadas, sem sombra nem gradiente.
- Sobre Papel `#F4F4F2` ou Laranja `#F0521F`; preenchimento interno com a cor do fundo para esconder linhas de trás.
- Sempre **cortada pela borda inferior**. Nunca flutua.
- `viewBox` com 200 de largura e recorte superior (`0 20 200 130`, `0 10 200 140`).
- Conjunto: Sala de foco · Agentes de IA · Copa da equipe · Mascote NPC.

---

## 8. Tema claro / escuro

- Aplicado via `document.documentElement.dataset.theme = 'light' | 'dark'` **e** classe `.dark` (para o shadcn).
- Persistido em `localStorage['dash-theme']`, compartilhado por todas as telas.
- Laranja, cards ilustrados, card Plus e botões primários **não mudam** com o tema.

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

- Nenhuma cor de acento além do laranja `#F0521F`; nenhum gradiente decorativo.
- Nenhum emoji na interface do dashboard.
- Nenhuma ilustração colorida.
- Nunca dois botões primários na mesma área.
- Nenhum texto em inglês.
- Nenhum texto abaixo de 10.5px; no mobile, alvos ≥ 44px.
