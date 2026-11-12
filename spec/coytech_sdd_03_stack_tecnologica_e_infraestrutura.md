# Coytech SDD 03: Stack Tecnológica, Infraestrutura e Integrações (Studio, Flow & Pulse)

## 1. Matriz da Stack Tecnológica Oficial da Coytech

A stack da **Coytech** foi definida para permitir **entrega em produção em 30 dias** no primeiro mês (Setup) e **custo operacional previsível e escalável** nos meses seguintes (MRR / LTV), combinando desenvolvimento web moderno, orquestração de workflows e observabilidade corporativa:

| Unidade Coytech | Camada Técnica | Tecnologias Padronizadas | Papel na Arquitetura |
| :--- | :--- | :--- | :--- |
| **Coytech Studio** *(Criação de Sistemas)* | **Frontend & Fullstack Web** | **Next.js 15+ (App Router)**, React 19, TypeScript 5+, Tailwind CSS v4, shadcn/ui | Construção rápida de portais operacionais sob medida (modo claro/escuro responsivo), filas de aprovação em 1 clique e Painel Executivo Mobile para o CEO/COO. |
| **Coytech Studio** *(Banco, Auth & Realtime)* | **BaaS & Persistência Relacional/Vetorial** | **Supabase** (PostgreSQL 16, Supabase Auth, Row Level Security, Realtime WebSockets, `pgvector`, Storage, Vault) | Banco de dados principal dos sistemas criados, controle de acesso por cargo (RBAC), atualização instantânea de filas/SLAs e cofre criptografado de credenciais (`pgsodium` / Vault). |
| **Coytech Flow** *(Implementação & Automação)* | **Orquestração de Processos & Integrações** | **n8n** (Self-Hosted em cluster Docker/Kubernetes com Queue Mode + Redis + Workers) | Motor de automação visual e código para conciliação financeira, lotes fiscais, onboarding em 5 minutos e disparo do relatório de segunda-feira às 08h. |
| **Coytech Flow** *(Inteligência Artificial)* | **Gateway de IA & Modelos LLM** | **LiteLLM Proxy** + **Anthropic Claude** (Claude 3.7 Sonnet / 3.5 Haiku) + OpenAI/Voyage Embeddings | Governança centralizada de IA: controle de gastos por cliente, fallback automático entre provedores, auditoria de prompts, mascaramento de PII e execução dos 5 Agentes de IA. |
| **Coytech Pulse** *(Monitoramento 4 Camadas)* | **Observabilidade, Infra, APM & Sintético** | **Zabbix 7.0 LTS** + **Grafana Enterprise/OSS** + **Datadog** + **Playwright (Testes Sintéticos)** | Monitoramento 24/7 das 4 camadas (Infraestrutura, Aplicação, Experiência do Usuário e Dependências Externas como SEFAZ/Bancos) + Motor de Impacto Financeiro (BIA). |

## 2. Arquitetura de Referência por Pilar Técnico

### 2.1 Arquitetura do Coytech Studio (Next.js + Supabase)
Projetada para substituir dezenas de planilhas em menos de 4 semanas com segurança corporativa:
* **Template Base Acelerador (`coytech-studio-starter`):** Repositório base em Next.js 15 já pré-configurado com:
  * Autenticação Multi-Tenant integrada ao Supabase Auth com suporte a SSO corporativo (Google Workspace / Microsoft Entra ID / SAML para clientes Enterprise);
  * Componentes prontos de **Fila Operacional com Cronômetro de SLA** e **Botão de Aprovação em 1 Clique** com confirmação auditada;
  * Importador universal de planilhas (`.xlsx`, `.csv`, Google Sheets API) com validação de schema via `Zod` para acelerar a migração da Semana 4;
  * **PWA Executivo Mobile:** Rota dedicada `/executivo` otimizada para iOS e Android (instalável na tela inicial do celular do CEO Rodrigo e da COO Camila) exibindo vendas por hora, SLA e alertas de impacto financeiro.

### 2.2 Arquitetura do Coytech Flow (n8n em Alta Disponibilidade + LiteLLM)
Diferente de automações amadoras que falham silenciosamente, o **Coytech Flow** roda em arquitetura resiliente e monitorada pelo **Coytech Pulse**:
* **n8n em Queue Mode (Alta Confiabilidade):**
  * **Main Instance / Webhook Receivers:** Recebem eventos em tempo real de ERPs, gateways de pagamento, WhatsApp e Zabbix.
  * **Redis Broker + Worker Nodes:** Distribuem a execução de lotes pesados (como conciliação bancária de milhares de transações ou emissão de notas fiscais em lote).
  * **Tratamento Nativo de Erros (Error Workflows):** Todo workflow de produção possui um *Error Trigger* conectado diretamente ao **Coytech Pulse**. Se uma automação falhar, ela executa retentativa exponencial e, se persistir, abre incidente automático para a engenharia.
* **Governança de IA com LiteLLM:**
  * Nenhum workflow do n8n ou aplicação Next.js chama a API da Anthropic/OpenAI diretamente com uma chave mestre solta.
  * Todas as chamadas passam pelo endpoint interno `https://llm.coytech.internal/v1`:
    * Cada cliente possui uma `virtual_key` exclusiva no LiteLLM com orçamento máximo mensal (`max_budget`) e rate limit;
    * No **Offboarding (Etapa 6)**, basta revogar a `virtual_key` do cliente no LiteLLM para desligar 100% do consumo de IA instantaneamente.

### 2.3 Arquitetura do Coytech Pulse (Zabbix 7.0 LTS + Grafana + Datadog + BIA)
Estrutura as **4 Camadas de Monitoramento** prometidas ao CTO (Eduardo) e ao SRE (Lucas):

| Camada | Ferramenta Principal | O Que Coleta e Como Opera |
| :--- | :--- | :--- |
| **Camada 1: Infraestrutura** | **Zabbix 7.0 LTS** (Server + Zabbix Proxies na rede do cliente via VPN WireGuard/IPsec) | Coleta métricas de servidores Linux/Windows, containers Docker/K8s, bancos PostgreSQL/Oracle/SQL Server, links de rede e equipamentos de pátio/pedágio/fábrica sem expor portas públicas. |
| **Camada 2: Aplicação & Filas** | **Datadog APM** / OpenTelemetry + Logs n8n | Rastreia tempo de resposta das APIs, queries lentas no banco de dados, consumo de memória da aplicação e status das filas do n8n/Redis. |
| **Camada 3: Experiência do Usuário** | **Zabbix Browser Items (7.0 LTS)** + **Playwright** | Executa jornadas reais a cada 2 a 5 minutos (abre o navegador headless, faz login no portal/e-commerce do cliente, simula busca e testa o checkout). |
| **Camada 4: Dependências Externas** | **Monitores HTTP/API Customizados no Zabbix + n8n** | Consulta continuamente os webservices estaduais da **SEFAZ** (NFe/NFCe/CTe), APIs de Pix do Banco Central/bancos liquidantes e gateways de pagamento. |

## 3. Especificação dos Conectores Críticos (Brasil B2B)

### 3.1 Monitoramento e Contingência SEFAZ (Notas Fiscais)
Para empresas de Varejo, E-commerce, Indústria e Logística, a queda da SEFAZ trava o faturamento e a expedição de caminhões:
* **Sonda de Disponibilidade SEFAZ:** Verifica a cada 60 segundos o serviço `NfeStatusServico4` do estado do cliente e dos autorizadores de contingência (`SVC-AN` e `SVC-RS`), medindo não apenas se está online, mas a **latência de autorização em milissegundos**.
* **Gatilho de Contingência Automática (SLA 30 min):** Quando a latência da SEFAZ ultrapassa o limiar crítico ou retorna rejeição de servidor, o **Coytech Pulse** aciona o workflow de contingência no **n8n**, enfileirando as notas para reenvio automático ou chaveando para emissão em contingência, avisando a operação em até 30 minutos.

### 3.2 Conectores de ERPs, CRMs e Gateways Financeiros
O **Coytech Flow** mantém templates padronizados no n8n para os principais sistemas usados pelo Mid-Market e Enterprise no Brasil:
* **ERPs:** TOTVS (Protheus / WinThor / Datasul), SAP Business One / S/4HANA, Sankhya, Senior, Omie, Bling e Tiny.
* **Gateways e Bancos (Conciliação Pix/Boleto/Cartão):** Pagar.me, Asaas, Vindi, Adyen, Stripe, Itaú API, Bradesco, Santander e BTG Pactual.
* **Comunicação e Alertas:** WhatsApp Business Cloud API (Meta Oficial), Slack, Microsoft Teams, Telegram e PagerDuty/Opsgenie.

### 3.3 Segurança, Cofre de Senhas e Conformidade LGPD
* **Coleta Segura no Onboarding (Dias 1 e 2):** As credenciais do cliente nunca trafegam em texto aberto no WhatsApp ou e-mail; são coletadas via link temporário de visualização única conectado ao **Supabase Vault** (ou Bitwarden/HashiCorp Vault).
* **Isolamento e Soberania de Dados:** Todo o código desenvolvido no **Coytech Studio**, os JSONs do **n8n** e os templates do **Zabbix/Grafana** ficam versionados em repositório Git dedicado da conta do cliente, garantindo entrega limpa em caso de **Offboarding (Etapa 6)**.
