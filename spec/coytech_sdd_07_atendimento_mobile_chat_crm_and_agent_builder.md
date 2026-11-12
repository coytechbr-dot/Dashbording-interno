# SDD 07 — Especificação da Tela de Atendimento WhatsApp (Formato Mobile no Painel Central), Sincronização CRM e Criador de Agentes IA

**Projeto:** CoyDash  
**Módulos Especificados:**  
1. `/atendimento` (`src/app/atendimento/page.tsx`)  
2. `/clientes` (`src/app/clientes/page.tsx` — Integração CRM 360º com Leads do WhatsApp)  
3. `/agentes` (`src/app/agentes/page.tsx` — Criador de Agentes IA, Prompt Builder, Conexão Z-API QR Code e Exportador de Template n8n)  
**Design System:** `spec/DESIGN.md` (ROOMIE OFFICE AI — Zero emojis, 100% Português, Acento Laranja `#F0521F`, Tinta `#141414`, Papel `#F4F4F2`, Pontos de status circulares de 5–8px).

---

## 1. Arquitetura Visual e Funcional da Tela de Atendimento (`/atendimento`)

A tela `/atendimento` mantém sua **estrutura de 3 colunas**, com o **Painel Central (Coluna 2) exibindo a conversa na estética e proporção Mobile do WhatsApp (`412px` centralizado com alternador para modo expandido)**:

- **Coluna 1 — Lista de Conversas (Inbox Ao Vivo `280px`):**
  - Fonte de Dados: Tabela `leads` cruzada com a última mensagem de `n8n_chat_histories` (`leads.lead_id = n8n_chat_histories.session_id`).
  - Ordenação: Conversas com a mensagem mais recente (`MAX(hora_data_mensagem)`) no topo.
  - Filtro rápido no topo da Inbox: Pílulas compactas para alternar entre `Todas`, `Com IA` e `Com Humano` + busca por nome ou telefone.
  - Ponto circular de status (`5px`): Verde `#2F9E5A` quando a IA está ativa 24h, Laranja `#F0521F` quando está em atendimento humano (*Transbordo*).
- **Coluna 2 — Chat no Formato Mobile estilo WhatsApp:**
  - Cabeçalho superior com Nome do contato (`lead_nome`), telefone (`lead_id`), ponto de status (`#2F9E5A` ou `#F0521F`) e botões: **`Simular Áudio Cliente`**, **`Assumir conversa` / `Devolver para IA`**, **`Modo Mobile 412px` / `Modo Expandido`** e **Excluir conversa**.
  - Agrupamento Cronológico por Datas (Pílulas Centralizadas: `Hoje`, `Ontem` ou `DD/MM/AAAA`).
  - Ordem Cronológica Invertida (mensagens antigas no topo e **mensagens mais recentes na parte inferior**, com auto-scroll automático).
  - Balões de Mensagem Fidedignos:
    - **Lead/Cliente (`type === 'human'`)**: Alinhado à **ESQUERDA**, canto superior esquerdo reto, horário `HH:mm` no canto inferior direito.
    - **Agente IA / Atendente (`type === 'ai'` ou `'operator'`)**: Alinhado à **DIREITA**, canto superior direito reto, selo `IA` ou `Atendente`, horário `HH:mm` e ícone SVG de duplo check (`✓✓`).
  - Conexão **Supabase Realtime** (`postgres_changes` em `n8n_chat_histories` e `leads`).
- **Coluna 3 — Painel Lateral de CRM do Cliente & Memória Vetorial (`pgvector` `310px`):**
  - 3 Mini-Cards: `pedidos`, `gasto` e `cashback` (lidos/atualizados em `public.leads`).
  - Vínculo Direto com o Funil CRM (`/clientes`): Seletor rápido de estágio (`Onboarding`, `Ativo`, `Aviso de Churn`) + botão **"Abrir Ficha 360º do Cliente"**.
  - Memória da IA (`pgvector`): Lista de memórias persistidas em `public.client_ai_memories` + input `Nova memória deste cliente...` + botão `+`.

