# 🚀 Guia Prático: Como Instalar o n8n e Conectar os 2 Agentes ao CoyDash

Este guia passo a passo foi preparado para você subir o **n8n** no seu computador em menos de 5 minutos, importar os 2 fluxos oficiais já prontos e conectá-los ao **CoyDash** e à **Z-API**.

---

## 📦 Passo 1: Como Rodar o n8n no seu Computador

Você pode rodar o n8n de duas formas super simples (escolha uma):

### Opção A: Direto pelo Terminal com Node.js (Mais Rápido)
Abra um terminal PowerShell na sua máquina e execute:

```powershell
npx n8n start --tunnel
```

> **Por que `--tunnel`?** O parâmetro `--tunnel` cria uma URL HTTPS pública automática (ex: `https://seu-tunel.hooks.n8n.cloud`) que a Z-API consegue chamar sem você precisar configurar roteador ou portas.

---

### Opção B: Via Docker Desktop
Se você usa Docker, execute no terminal:

```powershell
docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n docker.n8n.io/n8nio/n8n
```

Abra o seu navegador em `http://localhost:5678`.

---

## 🔑 Passo 2: Configurar as 2 Credenciais no n8n

Dentro do seu n8n, vá em **Credentials** no menu esquerdo e adicione:

### 1. Credencial do Supabase (Postgres Transaction Pooler)
- Clique em **Add Credential** $\rightarrow$ selecione **Postgres**.
- Preencha com os dados da sua base no Supabase:
  - **Host:** `aws-0-us-east-1.pooler.supabase.com`
  - **Database:** `postgres`
  - **User:** `postgres.cbhunupletswkjozcjze`
  - **Password:** `Coy.tech311001#`
  - **Port:** `6543` *(Porta obrigatória do Transaction Pooler para evitar quedas)*
  - **SSL:** `require` ou `allow`

### 2. Credencial da OpenAI (ou Gemini / Groq)
- Clique em **Add Credential** $\rightarrow$ selecione **OpenAI API**.
- Insira sua API Key da OpenAI (para rodar o `gpt-4o-mini`).

---

## 📥 Passo 3: Importar os 2 Fluxos Prontos no n8n

Você tem 2 arquivos prontos dentro da pasta `n8n-workflows/` do projeto:

1. **`n8n-workflows/agente-comercial-sdr-agendamento.json`**
   - Agente de prospecção e qualificação de novos leads.
   - Atende, descobre a dor do lead e agenda reunião estratégica online.
2. **`n8n-workflows/agente-suporte-clientes.json`**
   - Agente de suporte aos clientes da agência.
   - Consulta a carteira ativa em `public.clients` e responde dúvidas de campanhas e prazos.

### Como Importar:
1. No n8n, clique em **Add Workflow** (ou abra um novo canvas em branco).
2. Pressione `Ctrl + O` e selecione o arquivo `.json` ou abra o arquivo no VS Code, copie tudo com `Ctrl + A` + `Ctrl + C` e aperte `Ctrl + V` dentro do n8n.
3. Vincule as credenciais nos nós **Postgres** e **OpenAI**.
4. No último nó (**10. Enviar WhatsApp Z-API**), coloque a URL da sua instância e o seu `Client-Token`.
5. Ative o fluxo clicando na chave **Active** (no canto superior direito do n8n).

---

## 📱 Passo 4: Conectar na Z-API

1. No nó `1. Webhook Z-API` do n8n, copie a **URL de Produção** do webhook:
   - Para o Comercial: `https://seu-n8n.../webhook/whatsapp-sdr-comercial`
   - Para os Clientes: `https://seu-n8n.../webhook/whatsapp-suporte-clientes`
2. No painel da sua instância **Z-API**, vá em **Webhooks** $\rightarrow$ **Ao receber**:
   - Cole a URL do webhook correspondente e salve.

---

## ✅ Pronto!
Agora, cada mensagem que chegar no WhatsApp:
- É processada pelo n8n;
- É registrada automaticamente em `public.leads` e `public.n8n_chat_histories` no Supabase;
- Aparece instantaneamente e em tempo real na tela **Atendimento** do seu CoyDash!

