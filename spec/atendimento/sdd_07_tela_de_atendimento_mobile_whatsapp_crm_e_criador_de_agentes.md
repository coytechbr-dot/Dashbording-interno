# SDD 07 — Especificação da Tela de Atendimento WhatsApp (Formato Mobile no Painel Central), Sincronização CRM e Criador de Agentes IA

**Projeto:** CoyDash  
**Módulos Especificados:**  
1. `/atendimento` (`src/app/atendimento/page.tsx`)  
2. `/clientes` (`src/app/clientes/page.tsx` — Integração CRM 360º com Leads do WhatsApp)  
3. `/agentes` (`src/app/agentes/page.tsx` — Criador de Agentes IA, Prompt Builder, Conexão Z-API QR Code e Exportador de Template n8n)  
**Design System:** `spec/DESIGN.md` (ROOMIE OFFICE AI — Zero emojis, 100% Português, Acento Laranja `#F0521F`, Tinta `#141414`, Papel `#F4F4F2`, Pontos de status circulares de 5–8px).

---

## 1. Arquitetura Visual e Funcional da Tela de Atendimento (`/atendimento`)

Analisando a imagem real da sua tela **Atendimento WhatsApp** no CoyDash e unindo com as exigências do vídeo (chat idêntico ao WhatsApp no formato mobile com agrupamento de datas, horário em cada balão e scroll para a mensagem mais recente embaixo), a tela `/atendimento` mantém sua **estrutura de 3 colunas**, porém com o **Painel Central (Coluna 2) exibindo a conversa na estética e proporção Mobile do WhatsApp**:

```
+---------------------------------------------------------------------------------------------------+
| Topbar Global CoyDash: Busca | Seletor Org (Felipe Cavalcante) | 5 agentes IA | WhatsApp 24h | FC |
+---------------------------------------------------------------------------------------------------+
| Atendimento WhatsApp                                                           [ + Nova conversa ]|
| Inbox ao vivo · IA responde 24h com memória vetorial (pgvector) e transbordo humano               |
+------------------------+-------------------------------------------------+------------------------+
| COLUNA 1: INBOX (280px)| COLUNA 2: ÁREA DE CONVERSA & VIEWPORT MOBILE    | COLUNA 3: CRM & MEMÓRIA|
|                        |                                                 | (310px)                |
| [Buscar conversa...]   | Header do Contato:                              | Cliente                |
| [Todas][IA][Humano]    | Lucas Ferreira                                  | +------+ +----+ +-----+|
|                        | +55 11 98877-1234 · [•] IA respondendo 24h      | |  1   | |R$ 0| |R$0,0||
| +--------------------+ | [Simular Áudio Cliente] [Assumir conversa] [Lix]| |pedido| |gast| |cashb||
| | (L) Lucas Ferreira | |-------------------------------------------------| +------+ +----+ +-----+|
| |     20:32          | |        +-------------------------------+        |                        |
| |     Conversa inic..| |        |  MOLDURA / CONTAINER MOBILE   |        | Etapa no Funil CRM:    |
| +--------------------+ |        |  WHATSAPP (max-w: 420px-480px |        | [ Qualificado      v ] |
|                        |        |  ou 100% responsivo c/ toggle)|        | [ Abrir Ficha 360º ->] |
|                        |        |                               |        |                        |
|                        |        |         [ HOJE ]              |        | Memória da IA (pgvector|
|                        |        |                               |        | +--------------------+ |
|                        |        | +-------------------+         |        | | Sempre acompanha   | |
|                        |        | | Oi, boa noite     |         |        | | relatórios às seg  | |
|                        |        | |             20:31 |         |        | | 08h                | |
|                        |        | +-------------------+         |        | +--------------------+ |
|                        |        |         +-------------------+ |        | +--------------------+ |
|                        |        |         | Oi boa noite! Seja| |        | | Escritório no      | |
|                        |        |         | bem-vindo...      | |        | | Jardim Paulista-SP | |
|                        |        |         |       20:32 · IA  | |        | +--------------------+ |
|                        |        |         +-------------------+ |        | [Nova memória...] [+]  |
|                        |        +-------------------------------+        |                        |
|                        |-------------------------------------------------|                        |
|                        | [ Responder como atendente...            ] [|>] |                        |
+------------------------+-------------------------------------------------+------------------------+
```

---

### 1.1. Detalhamento da Coluna 1 — Lista de Conversas (Inbox Ao Vivo)
* **Fonte de Dados:** Tabela `leads` cruzada com a última mensagem de `n8n_chat_histories` (via `leads.lead_id = n8n_chat_histories.session_id`).
* **Ordenação:** Conversas com a mensagem mais recente (`MAX(hora_data_mensagem)`) aparecem no topo da lista.
* **Card de Cada Contato:**
  * Avatar circular com as iniciais do `lead_nome` (fundo em tom sutil de `#F0521F` quando selecionado e borda `#F0521F` de `1.5px`, idêntico ao card de *Lucas Ferreira* da imagem).
  * Nome do Lead (`lead_nome`) em `font-weight: 600`.
  * Horário da última mensagem no canto superior direito no formato `HH:mm` (ou `Ontem` / `DD/MM`).
  * Preview truncado em 1 linha da última mensagem trocada + ponto circular de status (`5px`): Verde `#2F9E5A` quando a IA está ativa 24h, Laranja `#F0521F` quando está em atendimento humano (*Transbordo*).
* **Filtro Rápido no Topo da Inbox:** Pílulas compactas para alternar entre `Todas`, `Com IA` e `Com Humano`.

---

### 1.2. Detalhamento da Coluna 2 — Chat no Formato Mobile estilo WhatsApp

Para atender fielmente tanto ao layout atual do CoyDash quanto à experiência visual do WhatsApp mostrada no vídeo, o painel central funciona da seguinte forma:

#### A. Cabeçalho Superior da Conversa
* **Esquerda:**
  * Nome do contato (`lead_nome`, ex: `Lucas Ferreira`).
  * Telefone formatado (`+55 11 98877-1234`) seguido do status dinâmico:
    * Quando `human_takeover = false`: Ponto circular verde `#2F9E5A` + texto `IA respondendo automaticamente 24h`.
    * Quando `human_takeover = true`: Ponto circular laranja `#F0521F` + texto `Atendimento humano ativo (IA pausada)`.
* **Direita (Ações Rápidas):**
  * Botão **`Simular Áudio Cliente`**: Dispara um teste simulando o envio de uma mensagem/áudio do cliente para testar a resposta do Agente e a memória vetorial em tempo real.
  * Botão **`Assumir conversa` / `Devolver para IA`**:
    * Ao clicar em **`Assumir conversa`**, atualiza `leads.human_takeover = true` no Supabase. O fluxo do n8n lê essa flag e pausa as respostas automáticas da IA para aquele telefone.
    * Ao clicar em **`Devolver para IA`**, restaura `leads.human_takeover = false`.
  * Botão **Alternador de Visualização (`Modo Mobile 412px` / `Modo Expandido`)**: Mantém por padrão o container centralizado em formato **Mobile WhatsApp (`width: 412px`, `max-width: 100%`)** dentro do painel central (com bordas arredondadas de smartphone, barra de status superior sutil e fundo texturizado geométrico discreto do Design System), permitindo expandir caso o operador deseje.
  * Botão **Excluir conversa** (ícone de lixeira).

#### B. Regras Obrigatórias das Mensagens no Formato WhatsApp Mobile
1. **Agrupamento Cronológico por Datas (Pílulas Centralizadas):**
   * Todas as mensagens retornadas de `n8n_chat_histories` (ordenadas por `hora_data_mensagem ASC`) são agrupadas por dia calendário no fuso `America/Sao_Paulo`.
   * Entre cada grupo diário, renderiza-se uma pílula centralizada:
     * **`Hoje`** (se a data for o dia atual);
     * **`Ontem`** (se a data for o dia anterior);
     * **`DD/MM/AAAA`** (ex: `02/02/2026`, para datas anteriores).
2. **Ordem de Leitura e Auto-Scroll (Mais Recentes Embaixo):**
   * As mensagens mais antigas ficam no topo e as **mensagens mais novas ficam sempre na parte inferior da tela**.
   * Sempre que a conversa é aberta ou chega uma nova mensagem via *Supabase Realtime*, o container executa `scrollTo({ top: scrollHeight, behavior: 'smooth' })`.
3. **Posição e Estilo dos Balões de Mensagem (Correção Crítica do Vídeo):**
   * **Mensagens enviadas pelo Cliente/Lead (`message.type === 'human'`):**
     * Alinhadas à **ESQUERDA**.
     * Fundo `--surface` (`#222222` no Dark Mode / `#FFFFFF` no Light Mode), borda `1px solid var(--border)`, canto superior esquerdo reto (`border-top-left-radius: 2px`).
     * Rodapé interno do balão (canto inferior direito): horário exato `HH:mm` extraído de `hora_data_mensagem` (ex: `20:31`).
   * **Mensagens enviadas pelo Agente IA ou Atendente Humano (`message.type === 'ai'` ou `operator`):**
     * Alinhadas à **DIREITA**.
     * No **Agente IA / Atendente**: Fundo em tom escuro destacado com borda sutil laranja `rgba(240, 82, 31, 0.35)` (ou fundo `#F0521F` com texto branco para respostas diretas do atendente), canto superior direito reto (`border-top-right-radius: 2px`).
     * Rodapé interno do balão (canto inferior direito): Selo discreto `IA` (ou `Atendente`) + horário `HH:mm` (ex: `20:32`) + ícone SVG de duplo check (`✓✓`).
4. **Barra Inferior de Envio (`Responder como atendente...`):**
   * Campo de texto na base da conversa com botão laranja `#F0521F` de envio (ícone de avião de papel SVG).
   * Ao enviar uma mensagem pelo painel:
     1. Se a conversa ainda estava apenas com a IA, assume automaticamente a conversa (`human_takeover = true`) ou envia como intervenção;
     2. Grava o registro em `n8n_chat_histories` com `session_id = lead_id` e `hora_data_mensagem = now()`;
     3. Dispara a rota `/api/whatsapp/send` do CoyDash, que chama o endpoint `/send-text` da Z-API para entregar a mensagem no WhatsApp real do cliente em menos de 1 segundo.

---

### 1.3. Detalhamento da Coluna 3 — Painel Lateral de CRM do Cliente & Memória Vetorial (`pgvector`)

Exatamente como na imagem de referência do CoyDash, a coluna direita conecta o atendimento ao CRM:
1. **Resumo Financeiro e Operacional do Cliente (3 Mini-Cards no Topo):**
   * **`pedidos`**: Contador de pedidos/contratos vinculados ao cliente (`leads.orders_count` / `clients`).
   * **`gasto`**: Valor total gasto em `R$` (`leads.total_spent`).
   * **`cashback`** (Card com destaque em borda/fundo laranja sutil `#F0521F`): Saldo de cashback ou benefício acumulado (`leads.cashback_balance`).
2. **Vínculo Direto com o Funil CRM (`/clientes`):**
   * Seletor rápido de **Estágio do Cliente no CRM** (`Onboarding`, `Ativo`, `Qualificado`, `Em Negociação`, `Aviso de Churn`) sincronizado diretamente com a tabela `clients` e `leads`.
   * Botão secundário **"Abrir Ficha 360º do Cliente"** que leva diretamente à ficha completa daquele contato em `/clientes` (ou cria o cliente automaticamente a partir do Lead do WhatsApp em 1 clique).
3. **Memória da IA (`pgvector`):**
   * Lista de cartões de memória persistente daquele cliente específico (ex: *"Sempre acompanha relatórios às segundas 08h"*, *"Escritório no Jardim Paulista - SP"*), lidos da tabela `client_ai_memories` onde `lead_id = telefone`.
   * Input inferior **`Nova memória deste cliente...`** + botão **`+`**: Ao adicionar um fato sobre o cliente, o CoyDash salva na tabela `client_ai_memories` (gerando o embedding vetorial quando a chave OpenAI está ativa), permitindo que o Agente no n8n lembre desse contexto em todas as próximas conversas.

---

## 2. Funcionamento Integrado do CRM (`/clientes` $\leftrightarrow$ `/atendimento`)

No vídeo, o CRM é apenas um visualizador de mensagens. No **CoyDash**, o CRM já possui a **Central de Clientes 360º (`/clientes`)** com as colunas `• ONBOARDING`, `• ATIVO` e `• AVISO DE CHURN`. A integração entre os dois módulos deve funcionar assim:

1. **Captura Automática de Leads via WhatsApp:**
   * Quando um novo número manda mensagem no WhatsApp, o n8n cria a linha na tabela `leads` (`lead_nome`, `lead_id`).
   * No CoyDash, esse contato aparece **imediatamente** na Inbox de `/atendimento` e na aba de **Leads / Clientes (`/clientes`)**.
2. **Sincronização de Histórico na Ficha 360º:**
   * Ao abrir a Ficha 360º de um cliente em `/clientes`, a aba de **Atendimento / WhatsApp** exibe o resumo das conversas de `n8n_chat_histories` daquele telefone (`session_id`) e a contagem de memórias vetoriais (`pgvector`) registradas.
3. **Indicador de Conexão WhatsApp + IA nos Cards do CRM:**
   * Os 6 ícones de status do card do cliente em `/clientes` (Meta, Google, WhatsApp, IA, CRM, Financeiro) acendem automaticamente os indicadores `WhatsApp` e `IA` em verde (`#2F9E5A`) assim que há sessão ativa em `n8n_chat_histories`.

---

## 3. Tela de Criação e Configuração do Agente IA (`/agentes` e `/flow`)

Para que você ou seu cliente criem e configurem o Agente de IA diretamente pelo SaaS (sem precisar montar tudo do zero toda vez), a tela `/agentes` deve possuir um **Assistente de Criação e Conexão de Agente em 4 Abas**:

### Aba 1: Identidade e Prompt do Sistema (System Message)
* **Nome do Agente:** Ex: `Agente Comercial SDR 24h`.
* **Provedor e Modelo LLM:** Seletor para `OpenAI (GPT-4o / GPT-4o-mini)`, `Google Gemini (Gemini 2.5 Flash / Pro)` ou `Groq (Llama 3.3 70B)`.
* **Editor de Prompt do Sistema (`System Message`):**
  * Possui botões de **Templates Prontos de Alta Conversão** (baseados no vídeo):
    1. *SDR de Qualificação e Agendamento Comercial*;
    2. *Atendimento e Suporte Nível 1 com Transbordo Humano*;
    3. *Recuperação de Vendas e Cashback*.
* **Comportamentos Humanizados (Toggles):**
  * `Ignorar mensagens de grupos (isGroup = false)` (Ativado por padrão);
  * `Pausar IA automaticamente quando atendente clicar em Assumir Conversa` (Ativado por padrão);
  * `Quebrar respostas longas em mensagens curtas humanizadas` (Opcional);
  * `Compreender Áudio (Whisper) e Imagens (Vision)` (Opcional).

### Aba 2: Conexão WhatsApp (Z-API) e Webhook
* **Campos de Configuração Persistidos no Supabase (`organization_settings`):**
  * `URL da API da Instância Z-API` (ex: `https://api.z-api.io/instances/ID/token/TOKEN`);
  * `Client-Token de Segurança Z-API`;
  * `URL do Webhook do n8n (Ao receber)` (ex: `https://n8n.seudominio.com/webhook/mensagem`).
* **Botão "Testar Conexão Z-API" & Visualizador de Status:**
  * Verifica se a instância está conectada (`Conectado` com ponto verde `#2F9E5A` ou exibe o **QR Code** na tela para leitura caso esteja desconectada).

### Aba 3: Banco de Dados e Memória (`Supabase + pgvector`)
* Exibe o status de saúde das tabelas `leads`, `n8n_chat_histories` (verificando a presença da coluna `hora_data_mensagem`) e `client_ai_memories`.
* Possui botão **"Copiar Parâmetros do Pooler (Porta 6543)"** para facilitar a colagem no node *Postgres Chat Memory* do n8n.

### Aba 4: Gerador e Download do Fluxo `.json` para o n8n
* Botão **"Baixar JSON do Agente para n8n"**:
  * Gera dinamicamente o arquivo `agente_coydash_n8n.json` **já preenchido** com o *System Prompt* configurado na Aba 1, a URL da instância Z-API configurada na Aba 2 e o filtro de `human_takeover` integrado ao CoyDash.
  * Basta o usuário abrir o n8n e pressionar `Ctrl + V` (ou *Import from File*) para ter o fluxo completo funcionando em menos de 2 minutos.

---

## 4. Contratos de API no Next.js App Router

Para suportar toda a operação em tempo real entre o front-end do CoyDash, a Z-API e o Supabase:

1. **`GET /api/whatsapp/conversations`**:
   * Lista todos os contatos da tabela `leads` com suas últimas mensagens de `n8n_chat_histories` e memórias de `client_ai_memories`.
2. **`GET /api/whatsapp/messages?sessionId=5511988771234`**:
   * Retorna o histórico completo de `n8n_chat_histories` daquele `session_id` ordenado por `hora_data_mensagem ASC`.
3. **`POST /api/whatsapp/send`**:
   * Recebe `{ sessionId, message, senderType: 'operator' | 'client_simulation' }`.
   * Insere o registro em `n8n_chat_histories` com `hora_data_mensagem = now()` e, se a instância Z-API estiver configurada, dispara o `POST /send-text` com o header `Client-Token` para o WhatsApp real do cliente.
4. **`PATCH /api/whatsapp/takeover`**:
   * Alterna a coluna `human_takeover` (`true`/`false`) na tabela `leads` para o botão **"Assumir conversa"**.
5. **`POST /api/agents/export-n8n`**:
   * Retorna o JSON estruturado do workflow do n8n pronto para importação.