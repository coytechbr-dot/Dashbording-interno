# SDD 08 — Especificação Completa do Workflow n8n para Criação do Agente de IA no WhatsApp + Integração Supabase & CRM CoyDash

**Projeto:** CoyDash (Ecossistema Coytech — *Coytech Studio*, *Coytech Flow*, *Coytech Pulse*)  
**Referência Técnica:** Vídeo-fonte (Felipe Borges — *Agente de IA para WhatsApp com CRM Visual + n8n + Z-API + Supabase*)  
**Banco de Dados Conectado:** Supabase PostgreSQL 16 + `pgvector` (`cbhunupletswkjozcjze`)  
**Design System Obrigatório:** `spec/DESIGN.md` (ROOMIE OFFICE AI — Zero emojis na UI, 100% Português, Acento `#F0521F`, Tinta `#141414`, Papel `#F4F4F2`, fonte *Schibsted Grotesk*)

---

## 1. Visão Geral Arquitetural do Workflow no n8n (De Acordo com o Vídeo-Fonte)

No vídeo-fonte, a arquitetura do Agente no **n8n** resolve um problema crítico de operação comercial: permitir que o **Agente de IA atenda 24h no WhatsApp via Z-API**, registre automaticamente todos os contatos na tabela **`leads`** e grave todo o histórico de conversa na tabela **`n8n_chat_histories`** (com carimbo de data e hora na coluna **`hora_data_mensagem`**) para que os sócios e atendentes acompanhem tudo em tempo real pelo **CRM Visual (`/atendimento` e `/clientes` no CoyDash)** sem precisar desconectar o WhatsApp do celular.

O vídeo apresenta **dois modelos de Workflow no n8n**:
1. **Workflow 1 — Agente Completo de Atendimento (Fluxo Principal Construído Passo a Passo na Aula):** Fluxo enxuto, rápido e direto de 10 componentes para recepção via Webhook Z-API, filtragem de grupos, cadastro/busca do lead no Supabase, processamento com IA (`OpenAI` / `Gemini` / `Groq`) + memória PostgreSQL e envio da resposta via `HTTP Request` na Z-API.
2. **Workflow 2 — Super Agente Humanizado (Fluxo Avançado Comercial Mostrado na Aula):** Fluxo completo que adiciona compreensão de **Texto, Áudio (Whisper) e Imagem (Vision)**, **agrupamento de mensagens picadas enviadas pelo cliente** e **resposta dividida em mensagens picadas humanizadas** com status *"digitando..."* + respeito ao botão **"Assumir conversa"** (Transbordo Humano) da tela `/atendimento` do CoyDash.

---

## 2. Topologia Visual do Workflow no n8n

### 2.1. Fluxo Principal do Vídeo (Passo a Passo da Aula)

```
+-------------------+     +------------------------+     +-----------------------+     +------------------------+
| 1. Webhook        | --> | 2. Critérios de        | --> | 3. Informações do     | --> | 4. Extrair Texto       |
| (Path:            |     |    Ativação            |     |    Lead (Set)         |     |    da Mensagem (Set)   |
|  mensagem-teste)  |     | (Ignora Grupos/Status) |     | (lead_nome, lead_id)  |     | (mensagem_texto)       |
+-------------------+     +------------------------+     +-----------------------+     +------------------------+
                                                                                                   |
       +-------------------------------------------------------------------------------------------+
       v
+-------------------+     +------------------------+     (True: Já existe)
| 5. Encontrar      | --> | 6. Cliente Existe?     | ----------------------------+
|    Cliente        |     |    (Node IF)           |                             |
| (Supabase: GET    |     +------------------------+                             |
|  tabela `leads`)  |                 |                                          v
+-------------------+                 | (False: Não existe)            +------------------------+
                                      v                                | 8. AI Agent            |
                          +------------------------+                   |    (Tools Agent)       |
                          | 7. Criar Cliente       | ----------------> |  - System Message      |
                          | (Supabase: CREATE      |                   |  - User Message        |
                          |  na tabela `leads`)    |                   +------------------------+
                          +------------------------+                        ^              ^
                                                                            |              |
                                                                +---------------+      +--------------------+
                                                                | 8A. Chat Model|      | 8B. Postgres Chat  |
                                                                | (OpenAI /     |      |     Memory         |
                                                                |  Gemini/Groq) |      | (`n8n_chat_        |
                                                                +---------------+      |  histories`)       |
                                                                                       +--------------------+
                                                                                                   |
       +-------------------------------------------------------------------------------------------+
       v
+-------------------+     +------------------------+
| 9. HTTP Request   | --> | 10. Fim do Fluxo       |
| (Disparo Z-API    |     | (No Operation,         |
|  `/send-text`)    |     |  do nothing)           |
+-------------------+     +------------------------+
```

---

## 3. Passo a Passo de Configuração de Cada Componente no n8n

### Passo 0: Como Importar o Workflow no n8n
Existem duas formas ensinadas no vídeo para colocar o agente dentro do seu n8n:
1. **Via Arquivo (`.json`):** No canto superior direito do n8n, clique no menu de 3 pontos (`...`) $\rightarrow$ **`Import from File`** $\rightarrow$ selecione o arquivo `.json` do agente.
2. **Via `Ctrl + C` / `Ctrl + V` Direto no Canvas:** Copie todo o código JSON do workflow (disponível na **Seção 7** deste documento), abra um workflow vazio no n8n e pressione **`Ctrl + V`** na tela. Todos os nodes aparecem conectados instantaneamente.

---

### Componente 01: `Webhook` (Recepção da Mensagem vinda da Z-API)
* **Node no n8n:** `Webhook` (`n8n-nodes-base.webhook`)
* **Função:** Gerar o link único onde a Z-API vai notificar o n8n toda vez que alguém mandar uma mensagem no WhatsApp conectado.
* **Configuração Interna do Node:**
  * **HTTP Method:** `POST`
  * **Path:** `mensagem-teste`
    * *Por que mudar o Path (explicação do vídeo):* Por padrão o n8n gera um código gigante cheio de números e letras aleatórias. Escrever `mensagem-teste` (enquanto está em URL de teste) e depois mudar para `mensagem` (quando mudar para URL de Produção) evita confusão e erros na hora de colar na Z-API.
  * **Respond:** `Immediately`
* **Como Conectar este Webhook na Z-API (Passo a Passo Exato do Vídeo):**
  1. Crie/acesse sua conta na **Z-API** $\rightarrow$ menu lateral **Instâncias Web** $\rightarrow$ clique em **Adicionar**.
  2. Escaneie o **QR Code** com o WhatsApp que fará o atendimento até aparecer o status **"Conectado"** (*"Sua instância já está conectada"*).
  3. Na mesma tela da instância, desça até a seção **Webhooks** e localize o campo **"Ao receber"**.
  4. Volte no node `Webhook` do n8n, clique em cima da **Test URL** (ex: `https://seu-n8n.com/webhook-test/mensagem-teste`) para copiá-la e cole no campo **"Ao receber"** da Z-API.
  5. **Configuração crucial para testar com 1 celular:** Abaixo dos webhooks na Z-API, ative a opção **"Notificar as mensagens enviadas por mim também"**. Se isso estiver desativado e você mandar mensagem do seu próprio celular para si mesmo para testar, o Webhook do n8n não vai receber nada.
  6. Clique em **Salvar** na Z-API.
* **Como Testar e "Pinar" a Mensagem no Webhook (Segredo do Vídeo):**
  1. No node `Webhook` do n8n, clique no botão **`Listen for test event`**.
  2. No WhatsApp, envie a mensagem: `"Oi, boa noite"`.
  3. O node `Webhook` ficará verde e mostrará todos os dados recebidos (ex: nome `"Easus Felipe"`, link da foto, texto `"Oi, boa noite"` e número do telefone em `phone`).
  4. Clique no ícone de **Alfinete (`Pin data`)** no canto superior direito da saída do Webhook. Assim a mensagem fica salva ("pinada") e você pode rodar o fluxo inteiro quantas vezes quiser sem precisar enviar mensagem do celular a cada teste.

---

### Componente 02: `Critérios de Ativação` (Filtros de Segurança)
* **Node no n8n:** `Filter` ou `If` (`n8n-nodes-base.filter`)
* **Função:** Impedir que o Agente de IA seja ativado em grupos de WhatsApp, canais/newsletters ou quando um atendente humano clicou em **"Assumir conversa"** no CoyDash.
* **Condições Configuradas (`AND`):**
  1. **Bloquear Grupos:** `{{ $json.body.isGroup }}` $\rightarrow$ *Boolean* $\rightarrow$ **`is false`**
     *(Se você tiver grupos no WhatsApp conectado, o agente é proibido de responder no grupo).*
  2. **Bloquear Newsletters/Canais:** `{{ $json.body.isNewsletter }}` $\rightarrow$ *Boolean* $\rightarrow$ **`is false`**
  3. **Bloquear Transmissões:** `{{ $json.body.broadcast }}` $\rightarrow$ *Boolean* $\rightarrow$ **`is false`**
  4. **Garantir Telefone Válido:** `{{ $json.body.phone }}` $\rightarrow$ *String* $\rightarrow$ **`is not empty`**
  5. *(Em Produção com 2 números)* **Ignorar mensagens do próprio bot:** `{{ $json.body.fromMe }}` $\rightarrow$ *Boolean* $\rightarrow$ **`is false`**.

---

### Componente 03: `Informações do Lead` (Compilado dos Dados do Contato)
* **Node no n8n:** `Edit Fields (Set)` (`n8n-nodes-base.set`)
* **Função:** Organizar os dados brutos que vieram do Webhook da Z-API em variáveis limpas com exatamente os mesmos nomes que serão usados na tabela `leads` do Supabase.
* **Campos Mapeados (`Manual Mapping`):**
  * **`lead_nome`** (*String*):
    ```text
    {{ $json.body.senderName || $json.body.chatName || 'Cliente WhatsApp' }}
    ```
  * **`lead_id`** (*String*):
    ```text
    {{ String($json.body.phone).replace(/\D/g, '') }}
    ```
    * *Regra de Ouro da Programação explicada no vídeo:* O telefone (`lead_id`) **SEMPRE** deve ser configurado como **Texto (`String`)** e nunca como Número. Só usamos tipo Número quando queremos fazer contas matemáticas (somar, multiplicar). Como telefone é um identificador único que não se repete e não sofre cálculo, salvá-lo como texto facilita todo o cruzamento no banco de dados e no CRM.
  * **`foto_lead`** (*String*):
    ```text
    {{ $json.body.senderPhoto || $json.body.photo || '' }}
    ```

---

### Componente 04: `Extrair Texto da Mensagem`
* **Node no n8n:** `Edit Fields (Set)` (`n8n-nodes-base.set`)
* **Função:** Extrair apenas o texto da mensagem enviada pelo cliente para passar de forma limpa ao Agente de IA.
* **Configuração:**
  * **Include Other Input Fields:** `true` (mantém `lead_nome` e `lead_id` disponíveis).
  * **Campo Criado:**
    * **`mensagem_texto`** (*String*):
      ```text
      {{ $('Webhook Z-API').item.json.body.text.message || '' }}
      ```

---

### Componente 05: `Encontrar Cliente` (Busca na Tabela `leads` do Supabase)
* **Node no n8n:** `Supabase` (`n8n-nodes-base.supabase`)
* **Função:** Verificar se o cliente que acabou de mandar mensagem já está cadastrado na tabela `leads` do Supabase.
* **Como Criar a Credencial do Supabase no n8n (Passo a Passo do Vídeo):**
  1. Dentro do node `Supabase`, clique em **`Credential to connect with`** $\rightarrow$ **`Create new credential`**. O n8n pedirá **2 campos**: `Host` e `Service Role Secret`.
  2. Abra o seu projeto no **Supabase (`cbhunupletswkjozcjze`)** $\rightarrow$ menu esquerdo **Project Settings** $\rightarrow$ **API Keys** (ou *Legacy / Service Role API Keys*).
  3. Em **`service_role` (secret)**, clique em *Reveal* $\rightarrow$ *Copy* e cole no campo **`Service Role Secret`** do n8n.
  4. Para pegar o **`Host`**, digite `URL` na barra de busca superior do Supabase e clique em **`Copy API URL`** (ou copie `https://cbhunupletswkjozcjze.supabase.co` em Project Settings) e cole no campo **`Host`** do n8n.
  5. Clique em **Save** (deve aparecer a mensagem verde *"Connection tested successfully"*).
* **Como Criar a Tabela `leads` no Supabase (Exatamente como no Vídeo):**
  No menu **Table Editor** do Supabase, crie uma tabela chamada **`leads`** (tudo minúsculo, no plural com `s` no final) contendo exatamente estas **4 colunas base** (+ colunas extras do CoyDash na Migration 003):
  1. **`id`** (`int8`, Primary Key, preenchimento automático `1, 2, 3...` — padrão do Supabase);
  2. **`created_at`** (`timestamptz`, Default Value: `now()` — preenche automaticamente o dia e horário em que o lead entrou na base);
  3. **`lead_nome`** (`text`, Nullable — vem vazia porque o próprio fluxo do n8n vai preencher com o nome do contato);
  4. **`lead_id`** (`text`, Unique — vem vazia porque o fluxo do n8n vai preencher com o telefone do cliente em formato texto).
* **Parâmetros do Node `Encontrar Cliente`:**
  * **Resource:** `Row`
  * **Operation:** `Get`
  * **Table Name:** `leads`
  * **Select Conditions:**
    * **Column:** `lead_id` (String)
    * **Value:** `{{ $('Informações do Lead').item.json.lead_id }}`
  * **Aba `Settings` do Node:** Ative **`Always Output Data` = `ON`** (para o fluxo continuar até o `IF` mesmo quando a tabela estiver vazia ou o cliente for novo).

---

### Componente 06: `Cliente Já Existe?` (Decisor `If` + Verificação de Transbordo CoyDash)
* **Node no n8n:** `If` (`n8n-nodes-base.if`)
* **Função:**
  * Se o cliente **já existe** na tabela `leads` (`true`): segue em frente direto para o `AI Agent` (sem criar cadastro duplicado).
  * Se o cliente **não existe** na tabela `leads` (`false`): desvia para o node de baixo (`Criar Cliente`) para cadastrá-lo.
* **Condição Configurada:**
  * `{{ $json.lead_id }}` $\rightarrow$ *String* $\rightarrow$ **`is not empty`**
* **Integração com o Botão "Assumir conversa" do CoyDash:**
  * Na saída `true` (quando o cliente já existe), um filtro verifica se `{{ $json.human_takeover }}` é `false`. Se um atendente humano tiver clicado em **"Assumir conversa"** na tela `/atendimento` do CoyDash (`human_takeover = true`), o fluxo para aqui para a IA não responder por cima do atendente.

---

### Componente 07: `Criar Cliente` (Cadastro Automático na Tabela `leads`)
* **Node no n8n:** `Supabase` (`n8n-nodes-base.supabase`)
* **Alerta Crítico do Erro Mostrado no Vídeo:**
  * No vídeo, quando o Felipe rodou o teste pela primeira vez, a mensagem chegou no WhatsApp mas a tabela `leads` no Supabase continuou vazia! Por quê? Porque ele tinha atualizado a credencial do Supabase apenas no node de cima (`Encontrar Cliente`), mas esqueceu de selecionar a **mesma credencial** neste node de baixo (`Criar Cliente`).
  * **Regra:** Confira sempre se tanto `Encontrar Cliente` quanto `Criar Cliente` estão usando a mesma credencial do Supabase.
* **Parâmetros do Node `Criar Cliente`:**
  * **Resource:** `Row`
  * **Operation:** `Create`
  * **Table Name:** `leads`
  * **Fields to Send:** *(Preencha apenas estas 2 colunas, pois `id` e `created_at` o Supabase preenche sozinho)*:
    * **`lead_nome`**: `{{ $('Informações do Lead').item.json.lead_nome }}`
    * **`lead_id`**: `{{ $('Informações do Lead').item.json.lead_id }}`

---

### Componente 08: `AI Agent` + `Chat Model` + `Postgres Chat Memory`

#### 8.1. Node Pai: `AI Agent` (`@n8n/n8n-nodes-langchain.agent`)
* **Prompt (User Message):** `Define below` $\rightarrow$ `{{ $('Extrair Texto da Mensagem').item.json.mensagem_texto }}`
* **System Message (Prompt a Nível de Sistema):**
  No vídeo, o prompt de sistema vem configurado com o exemplo da empresa *TechMoney* (*"Oi boa noite! Seja bem-vindo! Me conta rapidinho: você tá buscando saber mais sobre automações com IA, cursos, eventos ou comunidade?"*), onde basta trocar o nome da empresa e os produtos/serviços para adaptar ao seu negócio ou ao seu cliente.

#### 8.2. Sub-node 8A: Modelo de Inteligência Artificial (`OpenAI` / `Gemini` / `Groq`)
* Conectado na porta **`Model`** do `AI Agent`.
* No vídeo é utilizado o **`OpenAI Chat Model`** (`gpt-4o-mini` ou `gpt-4o`), mas o fluxo aceita perfeitamente **`Google Gemini Chat Model`** ou **`Groq Chat Model`** bastando conectar o sub-node correspondente e inserir a API Key.

#### 8.3. Sub-node 8B: `Postgres Chat Memory` (Histórico Automático no Supabase)
* **Node no n8n:** `Postgres Chat Memory` (`@n8n/n8n-nodes-langchain.memoryPostgresChat`)
* **Como Conectar o PostgreSQL do Supabase no n8n (Passo a Passo Exato do Vídeo):**
  1. Abra o sub-node `Postgres Chat Memory` $\rightarrow$ **`Create new credential`**.
  2. No painel do Supabase, clique no botão **`Connect`** no topo da tela.
  3. Troque a opção de *Direct connection* para **`Transaction pooler`** e clique em **`View parameters`**.
  4. Copie cada dado do Supabase para a credencial Postgres do n8n:
     * **Host:** Copie o host do pooler (ex: `aws-0-us-east-1.pooler.supabase.com`) e cole em **Host**.
     * **Database:** `postgres` (já vem escrito por padrão no n8n).
     * **User:** Copie o usuário completo do pooler (`postgres.cbhunupletswkjozcjze`) e cole em **User** *(não deixe apenas `postgres`)*.
     * **Port:** Copie a porta **`6543`** e cole em **Port**.
     * **SSL:** Ative a chavinha **`Ignore SSL Issues` = `ON`** *(obrigatório!)*.
     * **Password:** Para pegar ou gerar a senha, vá no Supabase em **Database Settings** $\rightarrow$ **Database password** $\rightarrow$ **Reset database password** $\rightarrow$ clique em **Generate a password**, copie a senha gerada, clique em **Reset password**, aguarde salvar e cole no campo **Password** do n8n.
  5. Clique em **Save** no n8n.
* **Parâmetros do Sub-node `Postgres Chat Memory`:**
  * **Session ID:** `Define below`
  * **Key:** `{{ $('Informações do Lead').item.json.lead_id }}`
  * **Table Name:** `n8n_chat_histories`
* **Ajuste Obrigatório na Tabela `n8n_chat_histories` no Supabase (Explicado no Vídeo):**
  * Quando o fluxo roda a primeira mensagem, o n8n cria sozinho a tabela **`n8n_chat_histories`** no Supabase com 3 colunas: `id`, `session_id` (que guarda o telefone do lead, igual ao `lead_id` da tabela `leads`) e `message` (JSON com a conversa).
  * Para que o CRM mostre a data (`Hoje`, `Ontem`, `02/02/2026`) e a hora exata (`20:32`) embaixo de cada mensagem estilo WhatsApp, você precisa adicionar na tabela `n8n_chat_histories` uma **4ª coluna**:
    * **Name:** `hora_data_mensagem` (exatamente assim, tudo minúsculo com underline e sem espaço);
    * **Type:** `timestamptz` (Timestamp with time zone);
    * **Default Value:** **`now()`** *(No vídeo, na primeira tentativa o Felipe deixou o Default Value vazio e a coluna ficou vazia; ao colocar `now()` no Default Value, toda mensagem recebida ou enviada já grava automaticamente a data e hora exatas!)*.

---

### Componente 09: `Enviar Resposta Z-API` (`HTTP Request`)
* **Node no n8n:** `HTTP Request` (`n8n-nodes-base.httpRequest`)
* **Função:** Enviar a resposta gerada pelo `AI Agent` de volta para o WhatsApp do lead através da API da Z-API.
* **Como Configurar a Credencial e a URL da Z-API neste Node (Passo a Passo do Vídeo):**
  1. **Criar a Credencial Header Auth (`Client-Token`):**
     * No node `HTTP Request`, em **Authentication**, selecione `Generic Credential Type` $\rightarrow$ **Header Auth** $\rightarrow$ **`Create new credential`**.
     * No campo **Name**, digite exatamente: **`Client-Token`**
     * Para pegar o **Value**, abra o painel da **Z-API** $\rightarrow$ menu lateral esquerdo **Segurança** $\rightarrow$ bloco **Token de segurança da conta** $\rightarrow$ copie o token e cole no campo **Value** do n8n $\rightarrow$ clique em **Save**.
  2. **Colar a URL da Sua Instância Web:**
     * Na Z-API, volte em **Instâncias Web** $\rightarrow$ abra sua instância conectada $\rightarrow$ em **Dados da instância web**, copie o link de **API da instância** e adicione `/send-text` no final:
       ```text
       https://api.z-api.io/instances/SEU_ID_INSTANCIA/token/SEU_TOKEN_INSTANCIA/send-text
       ```
     * Apague a URL antiga que estava no node `HTTP Request` do n8n e cole a sua.
  3. **Configurar o Body (E Evitar o Erro de "Campo Mensagem Vazio" do Vídeo):**
     * **Method:** `POST`
     * **Send Body:** `ON` (`JSON`)
     * **Body Parameters:**
       * **`phone`**: `{{ $('Informações do Lead').item.json.lead_id }}`
       * **`message`**: `{{ $json.output }}`
       * *Como resolver se der erro de campo `message` vazio (mostrado no vídeo):* Abra o node `HTTP Request`, olhe no painel esquerdo a saída do node **`AI Agent`**, clique e arraste o campo **`output`** direto para dentro do campo **`message`**.

---

### Componente 10: `Fim do Fluxo` (`No Operation, do nothing`)
* **Node no n8n:** `No Operation, do nothing` (`n8n-nodes-base.noOp`)
* **Função:** Encerrar visualmente o fluxo após o disparo da mensagem.

---

## 4. Arquitetura do "Super Agente Humanizado" (Segundo Workflow Mostrado no Vídeo)

No vídeo (`02:02` e `27:55`), o Felipe mostra na tela o fluxo do **Super Agente Humanizado** que agrega ainda mais valor ao projeto comercial. No **CoyDash**, o exportador de agentes (`/agentes`) também suporta essa arquitetura completa com **4 módulos extras**:

1. **Roteador Multimodal (`Switch: Texto / Áudio / Imagem`):**
   * Se chegar **Texto** (`$json.body.text.message`): segue direto.
   * Se chegar **Áudio** (`$json.body.audio.audioUrl`): um node `HTTP Request (GET)` baixa o arquivo de áudio da Z-API e entrega para o node **`OpenAI Whisper (Transcribe a Recording)`**, convertendo a voz do cliente em texto para o `AI Agent`.
   * Se chegar **Imagem** (`$json.body.image.imageUrl`): entrega a URL para o node **`OpenAI Vision (Analyze Image)`** descrever fotos de produtos, documentos ou comprovantes Pix enviados pelo cliente.
2. **Buffer de Mensagens Picadas Recebidas (`Wait` + Agrupamento):**
   * Quando o cliente digita várias mensagens curtas seguidas (*"Oi"*, *"Tudo bem?"*, *"Como funciona?"*), o fluxo aguarda alguns segundos (`Wait`), junta todas as mensagens picadas do cliente em um único parágrafo e aciona o `AI Agent` uma única vez.
3. **Memória Vetorial do Cliente (`pgvector` na tabela `client_ai_memories` do CoyDash):**
   * Consulta os fatos importantes do cliente salvos na coluna direita da tela `/atendimento` do CoyDash.
4. **Disparo Humanizado em Mensagens Picadas (`Code Splitter` + `delayTyping`):**
   * Quebra a resposta da IA em balões curtos por parágrafo (`\n\n`) e envia um por um na Z-API com o parâmetro `"delayTyping": 3`, simulando um humano digitando no WhatsApp.

---

## 5. Código JSON Completo do Workflow para Copiar e Colar (`Ctrl + V`) no n8n

Copie o bloco JSON abaixo, abra uma tela vazia no seu **n8n** e pressione **`Ctrl + V`** (ou salve como `workflow-agente-whatsapp-coydash.json` e importe via *Import from File*):

```json
{
  "name": "CoyDash - Agente de IA Atendimento WhatsApp + CRM Supabase",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "mensagem-teste",
        "options": {}
      },
      "id": "1b9c8a10-0001-4000-8000-000000000001",
      "name": "Webhook Z-API",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [200, 320],
      "webhookId": "coydash-zapi-mensagem-teste"
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "cond-is-group",
              "leftValue": "={{ $json.body.isGroup }}",
              "rightValue": false,
              "operator": {
                "type": "boolean",
                "operation": "false",
                "singleValue": true
              }
            },
            {
              "id": "cond-is-newsletter",
              "leftValue": "={{ $json.body.isNewsletter }}",
              "rightValue": false,
              "operator": {
                "type": "boolean",
                "operation": "false",
                "singleValue": true
              }
            },
            {
              "id": "cond-phone-not-empty",
              "leftValue": "={{ $json.body.phone }}",
              "rightValue": "",
              "operator": {
                "type": "string",
                "operation": "notEmpty",
                "singleValue": true
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "1b9c8a10-0002-4000-8000-000000000002",
      "name": "Critérios de Ativação",
      "type": "n8n-nodes-base.filter",
      "typeVersion": 2,
      "position": [420, 320]
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "set-lead-nome",
              "name": "lead_nome",
              "value": "={{ $json.body.senderName || $json.body.chatName || 'Lead WhatsApp' }}",
              "type": "string"
            },
            {
              "id": "set-lead-id",
              "name": "lead_id",
              "value": "={{ String($json.body.phone).replace(/\\D/g, '') }}",
              "type": "string"
            },
            {
              "id": "set-foto-lead",
              "name": "foto_lead",
              "value": "={{ $json.body.senderPhoto || $json.body.photo || '' }}",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "id": "1b9c8a10-0003-4000-8000-000000000003",
      "name": "Informações do Lead",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [640, 320]
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "set-mensagem-texto",
              "name": "mensagem_texto",
              "value": "={{ $('Webhook Z-API').item.json.body.text.message || '' }}",
              "type": "string"
            }
          ]
        },
        "includeOtherFields": true,
        "options": {}
      },
      "id": "1b9c8a10-0004-4000-8000-000000000004",
      "name": "Extrair Texto da Mensagem",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [860, 320]
    },
    {
      "parameters": {
        "operation": "get",
        "tableId": "leads",
        "filters": {
          "conditions": [
            {
              "keyName": "lead_id",
              "keyValue": "={{ $('Informações do Lead').item.json.lead_id }}"
            }
          ]
        }
      },
      "id": "1b9c8a10-0005-4000-8000-000000000005",
      "name": "Encontrar Cliente",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [1080, 320],
      "alwaysOutputData": true
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "if-lead-exists",
              "leftValue": "={{ $json.lead_id }}",
              "rightValue": "",
              "operator": {
                "type": "string",
                "operation": "notEmpty",
                "singleValue": true
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "1b9c8a10-0006-4000-8000-000000000006",
      "name": "Cliente Existe?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [1300, 320]
    },
    {
      "parameters": {
        "tableId": "leads",
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "lead_nome",
              "fieldValue": "={{ $('Informações do Lead').item.json.lead_nome }}"
            },
            {
              "fieldId": "lead_id",
              "fieldValue": "={{ $('Informações do Lead').item.json.lead_id }}"
            }
          ]
        }
      },
      "id": "1b9c8a10-0007-4000-8000-000000000007",
      "name": "Criar Cliente",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [1520, 460]
    },
    {
      "parameters": {
        "promptType": "define",
        "text": "={{ $('Extrair Texto da Mensagem').item.json.mensagem_texto }}",
        "options": {
          "systemMessage": "Oi! Você é o assistente comercial inteligente da Coytech.\nAtenda o cliente {{ $('Informações do Lead').item.json.lead_nome }} de forma 100% humanizada, acolhedora e objetiva pelo WhatsApp.\n\nNa primeira mensagem, cumprimente pelo horário (bom dia, boa tarde ou boa noite), dê as boas-vindas e pergunte de forma rápida o que ele está buscando hoje: Automações e Agentes de IA (Coytech Flow), Sistemas Sob Medida e CRM (Coytech Studio) ou Monitoramento 24/7 (Coytech Pulse).\n\nRegras:\n- Faça apenas uma pergunta por vez.\n- Use mensagens curtas e naturais.\n- Nunca use listas robóticas numeradas."
        }
      },
      "id": "1b9c8a10-0008-4000-8000-000000000008",
      "name": "AI Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1.7,
      "position": [1780, 320]
    },
    {
      "parameters": {
        "model": {
          "__rl": true,
          "mode": "list",
          "value": "gpt-4o-mini"
        },
        "options": {
          "temperature": 0.4
        }
      },
      "id": "1b9c8a10-0009-4000-8000-000000000009",
      "name": "OpenAI Chat Model",
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "typeVersion": 1.2,
      "position": [1700, 540]
    },
    {
      "parameters": {
        "sessionIdType": "customKey",
        "sessionKey": "={{ $('Informações do Lead').item.json.lead_id }}",
        "tableName": "n8n_chat_histories",
        "contextWindowLength": 15
      },
      "id": "1b9c8a10-0010-4000-8000-000000000010",
      "name": "Postgres Chat Memory",
      "type": "@n8n/n8n-nodes-langchain.memoryPostgresChat",
      "typeVersion": 1.3,
      "position": [1880, 540]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.z-api.io/instances/COLE_ID_INSTANCIA/token/COLE_TOKEN_INSTANCIA/send-text",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "specifyBody": "keypair",
        "bodyParameters": {
          "parameters": [
            {
              "name": "phone",
              "value": "={{ $('Informações do Lead').item.json.lead_id }}"
            },
            {
              "name": "message",
              "value": "={{ $json.output }}"
            }
          ]
        },
        "options": {}
      },
      "id": "1b9c8a10-0011-4000-8000-000000000011",
      "name": "HTTP Request Z-API",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [2100, 320]
    },
    {
      "parameters": {},
      "id": "1b9c8a10-0012-4000-8000-000000000012",
      "name": "No Operation, do nothing",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [2320, 320]
    }
  ],
  "connections": {
    "Webhook Z-API": {
      "main": [
        [
          {
            "node": "Critérios de Ativação",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Critérios de Ativação": {
      "main": [
        [
          {
            "node": "Informações do Lead",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Informações do Lead": {
      "main": [
        [
          {
            "node": "Extrair Texto da Mensagem",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Extrair Texto da Mensagem": {
      "main": [
        [
          {
            "node": "Encontrar Cliente",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Encontrar Cliente": {
      "main": [
        [
          {
            "node": "Cliente Existe?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Cliente Existe?": {
      "main": [
        [
          {
            "node": "AI Agent",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Criar Cliente",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Criar Cliente": {
      "main": [
        [
          {
            "node": "AI Agent",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "OpenAI Chat Model": {
      "ai_languageModel": [
        [
          {
            "node": "AI Agent",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Postgres Chat Memory": {
      "ai_memory": [
        [
          {
            "node": "AI Agent",
            "type": "ai_memory",
            "index": 0
          }
        ]
      ]
    },
    "AI Agent": {
      "main": [
        [
          {
            "node": "HTTP Request Z-API",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "HTTP Request Z-API": {
      "main": [
        [
          {
            "node": "No Operation, do nothing",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```