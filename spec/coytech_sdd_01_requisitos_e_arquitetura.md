# Coytech SDD 01: Especificação de Requisitos e Arquitetura do Ecossistema (Studio, Flow & Pulse)

## 1. Visão Geral do Ecossistema e Tese de Engenharia

Este Documento de Especificação de Design de Software (SDD) traduz a estratégia de negócios da **Coytech** — fundamentada na tese *"Código sem automação é lento. Automação sem monitoramento é cega"* — em uma arquitetura de software unificada para atender empresas **B2B Mid-Market (R$ 10M a R$ 120M/ano)** e **Enterprise (> R$ 120M/ano)**.

A plataforma unifica as três unidades de negócio da Coytech em um ecossistema técnico integrado, entregue inicialmente em uma **Sprint de 30 Dias (Setup)** e sustentado por contratos de **Receita Recorrente Mensal (MRR)**:

| Pilar de Serviço | Unidade Técnica | Missão Arquitetural | Entregáveis Core no Sistema |
| :--- | :--- | :--- | :--- |
| **1. Criação de Sistemas** | **Coytech Studio** | Substituir planilhas paralelas e softwares engessados por portais operacionais e SaaS dinâmicos sob medida. | Portais Web (Next.js + Supabase) com modo claro/escuro, filas com SLA ao vivo, **aprovação em 1 clique**, RBAC (Diretoria, Gerência, Operação, Cliente Externo) e trilha de auditoria imutável. |
| **2. Implementação e Automação** | **Coytech Flow** | Conectar sistemas desconectados (ERP, CRM, SEFAZ, Gateways, WhatsApp) e automatizar decisões com IA governada. | Workflows **n8n** auditáveis, **5 classes de Agentes de IA** (orquestrados via **LiteLLM** + **Claude**), conciliação financeira, emissão fiscal em lote, automação de Onboarding em 5 min e Relatório Executivo toda segunda às 08h. |
| **3. Monitoramento e Sustentação** | **Coytech Pulse** | Blindar a operação 24/7 em 4 camadas, eliminar >75% dos alarmes falsos e traduzir falhas técnicas em impacto financeiro por minuto (BIA). | Observabilidade integrada (**Zabbix 7.0 LTS, Grafana, Datadog**), monitoramento sintético, vigilância de SEFAZ/Pix/Bancos e **2 Painéis Sincronizados** (Painel Técnico NOC/TI e Painel Executivo Mobile para CEO/COO). |

## 2. Requisitos Funcionais Detalhados (RF)

### 2.1 Módulo Coytech Studio (Criação de Sistemas Web e Portais Operacionais)

* **RF-STU-001 (Filas de Trabalho com SLA Ao Vivo e Aprovação em 1 Clique):** O portal web deve exibir filas operacionais em tempo real (pedidos, compras, liberações financeiras, cadastros/KYC) com cronômetro regressivo de SLA e botões de ação rápida (**Aprovar / Rejeitar / Solicitar Ajuste em 1 clique**), atualizando o ERP/banco em menos de 3 segundos sem recarregar a tela.
* **RF-STU-002 (Controle de Acesso Baseado em Função - RBAC Multi-Tenant):** Suporte nativo a 4 níveis de permissão por organização cliente (`DIRECTOR_CEO`, `MANAGER_COO`, `OPERATIONS`, `EXTERNAL_PARTNER`, além de `COYTECH_SRE`), isolando dados sensíveis via Row Level Security (RLS) no Supabase.
* **RF-STU-003 (Trilha de Auditoria Imutável - Audit Log):** Toda ação crítica (aprovação em 1 clique, alteração de parâmetro financeiro, exportação de dados ou acesso a credenciais) deve registrar `actor_id`, `ip_address`, `payload_before`, `payload_after` e `timestamp`.
* **RF-STU-004 (Substituição e Congelamento de Planilhas Legadas):** Ferramenta de importação estruturada (CSV/XLSX/Google Sheets) para migrar planilhas históricas para o PostgreSQL durante a Semana 4 (Go-Live), alterando automaticamente as permissões das planilhas antigas no Google Drive para *"Somente Leitura"* via API.

### 2.2 Módulo Coytech Flow (Implementação, Automação n8n e Agentes de IA)

* **RF-FLO-001 (Automação de Onboarding em 5 Minutos - Etapa 1):** Ao receber o webhook de contrato assinado (ex: Clicksign/DocuSign/CRM), o workflow no **n8n** deve executar automaticamente em até 5 minutos:
  1. Criação da estrutura de pastas padronizada do cliente no Google Drive;
  2. Criação do grupo executivo do projeto no WhatsApp;
  3. Envio da mensagem de boas-vindas com o link de agendamento da reunião de Kick-off e link do Cofre de Senhas para coleta segura de credenciais.
* **RF-FLO-002 (Validador Pré-Kickoff de Credenciais e APIs):** Painel de engenharia que testa automaticamente a conectividade das chaves fornecidas pelo cliente nos Dias 1 e 2 (ERP, CRM, Gateway Pix/Cartão, WhatsApp API e túnel VPN Zabbix/Grafana) antes da reunião de Kick-off no Dia 3.
* **RF-FLO-003 (Rotinas Críticas de Backoffice Automatizadas):**
  * **Conciliação Financeira Automática:** Cruzamento diário entre vendas registradas no sistema/ERP e liquidações no extrato bancário ou gateway (Pix/boleto/cartão), apontando divergências de taxas.
  * **Emissão e Validação de Notas Fiscais em Lote:** Fila automatizada com validação prévia de regras fiscais e contingência automática caso a SEFAZ apresente instabilidade.
* **RF-FLO-004 (Relatório Executivo Automático de Segunda-Feira às 08h - Etapa 5 LTV):** Job agendado toda segunda-feira às 08h00 que compila e envia no WhatsApp e e-mail dos sócios (Rodrigo/CEO e Camila/COO):
  * Total de processos executados automaticamente na semana;
  * Horas de trabalho manual economizadas (e equivalente financeiro em R$);
  * Incidentes evitados ou mitigados pelo monitoramento 24/7;
  * Disponibilidade (SLA) e receita protegida no período.
* **RF-FLO-005 (Orquestração das 5 Classes de Agentes de IA via LiteLLM):** Gateway centralizado (**LiteLLM**) conectando modelos LLM (como **Claude**) ao banco de dados e às ferramentas operacionais para operar os 5 agentes oficiais da Coytech (Vendas 24/7, Recuperação/Cobrança, Suporte N1, Sucesso do Cliente/LTV e Investigador SRE).

### 2.3 Módulo Coytech Pulse (Monitoramento em 4 Camadas e Motor BIA)

* **RF-PUL-001 (Monitoramento Integrado em 4 Camadas):**
  1. **Camada 1 — Infraestrutura (Zabbix 7.0 LTS):** CPU, RAM, IOPS de disco, conexões PostgreSQL, expiração de certificados SSL e túneis VPN.
  2. **Camada 2 — Aplicação e Filas (Datadog / OpenTelemetry):** Latência de rotas Next.js (p95/p99), taxa de erro HTTP 5xx e falhas/retentativas em workflows do n8n.
  3. **Camada 3 — Experiência do Usuário (Testes Sintéticos):** Robôs executando login, busca e checkout a cada 2 minutos para detectar travamentos antes do usuário final.
  4. **Camada 4 — Dependências Externas (SEFAZ, Pix e Bancos):** Monitoramento ativo da disponibilidade dos autorizadores estaduais da **SEFAZ**, APIs bancárias de Pix e gateways de pagamento.
* **RF-PUL-002 (Motor de Impacto Financeiro nos Negócios - BIA Engine):** Todo ativo ou fluxo monitorado deve ser vinculado ao seu custo de parada por minuto/hora levantado na Etapa 2 (Planejamento). Quando um incidente ocorre (ou quando a conversão de vendas cai 30% mesmo com servidores "verdes"), o alerta calcula em tempo real a perda estimada (ex: *"Checkout degradado há 12 min — Risco acumulado: R$ 16.000 | R$ 80.000/h"*).
* **RF-PUL-003 (Redução de Ruído e Correlação de Alertas > 75%):** O motor de alertas deve agrupar sintomas correlacionados (ex: queda de banco gerando 40 alertas de rotas web) em um único incidente mestre, suprimindo alarmes falsos para evitar fadiga da equipe de TI (Eduardo/CTO e Lucas/SRE).
* **RF-PUL-004 (Dupla Visão Sincronizada: Painel NOC/TI vs. Painel Executivo Mobile):**
  * **Painel Técnico (Grafana / Zabbix / NOC):** Topologia de infraestrutura, logs do n8n, consumo/custos do LiteLLM e diagnóstico do Agente SRE.
  * **Painel Executivo (Web App Mobile no Celular do CEO/COO):** Faturamento por hora, taxa de conversão ao vivo, status semafórico das dependências críticas (Checkout, SEFAZ, ERP) e indicador de receita protegida.

### 2.4 Módulo de Governança do Ciclo de Vida (Sprint 30 Dias, LTV e Offboarding)

* **RF-GOV-001 (Gestão da Sprint de 30 Dias e Regra 80/20):** Painel de acompanhamento das 4 semanas de implantação (Onboarding Dias 0-3, Planejamento Semana 1, Apresentações Semanas 1 e 3, Go-Live Semana 4), separando entregas críticas 80/20 de itens do backlog evolutivo mensal (Mês 2+).
* **RF-GOV-002 (Automação de Offboarding Seguro e Retenção - Etapa 6):** Fluxo estruturado de 15 dias para encerramento contratual que:
  1. Oferece automaticamente a proposta de *Downsell* para o **Plano Enxuto de Monitoramento Passivo + Backup** (Dias 1 a 3);
  2. Gera o pacote de exportação de ativos do cliente (repositório Git, dump criptografado do banco, JSONs dos fluxos n8n e templates Zabbix/Grafana) nos Dias 4 a 10;
  3. Revoga chaves no LiteLLM, acessos VPN e segredos no cofre interno nos Dias 11 a 15 com emissão de Termo de Encerramento LGPD;
  4. Agenda follow-up comercial automático no CRM para **60 e 120 dias após a saída**.

## 3. Requisitos Não-Funcionais e SLAs Operacionais (RNF)

| Código | Categoria | Meta / SLA Exigido | Como a Arquitetura Garante |
| :--- | :--- | :--- | :--- |
| **RNF-001** | **SLA de Resposta a Incidentes Críticos (P1)** | Detecção imediata (< 60s) e ação da engenharia em **até 15 minutos** para vendas/operação travada. | Webhook direto do Zabbix/Datadog acionando o **Agente SRE (IA)** para diagnóstico prévio + alerta prioritário para o plantão Coytech. |
| **RNF-002** | **SLA de Contingência Externa (P2 - SEFAZ/Bancos)** | Ativação automática de fila de contingência e aviso ao cliente em **até 30 minutos**. | Workflow n8n com *Dead Letter Queue* e retentativa exponencial quando a API da SEFAZ ou gateway retorna timeout/5xx. |
| **RNF-003** | **Performance de Aprovação em 1 Clique** | Execução completa (UI -> API -> ERP/Banco) em **< 3 segundos**. | Next.js Server Actions + Atualização otimista na UI + fila assíncrona para ERPs legados lentos. |
| **RNF-004** | **Redução de Fadiga de Alertas** | Redução mínima de **75% nos alarmes falsos** em relação ao cenário anterior do cliente. | Limiares dinâmicos com histerese no Zabbix 7.0 LTS e deduplicação inteligente antes do disparo. |
| **RNF-005** | **Governança de IA e Conformidade LGPD** | Controle de orçamento por token, mascaramento de PII e revogação total no Offboarding em até 15 dias. | Todas as chamadas de IA passam obrigatoriamente pelo proxy **LiteLLM** com chaves virtuais por cliente (`tenant_id`) e limite mensal de gastos. |

## 4. Diagrama da Arquitetura Integrada Coytech

```
+---------------------------------------------------------------------------------------------------+
|                             CAMADA DE EXPERIÊNCIA & PORTAIS (COYTECH STUDIO)                      |
|                                                                                                   |
|  [Portal Operacional Web (Next.js 15)]     [Painel Executivo Mobile CEO/COO]   [Painel NOC/TI]    |
|  - Filas SLA Ao Vivo & Aprovação 1-Clique  - Vendas/Hora, BIA R$/min, SLA      - Grafana & Zabbix |
|  - RBAC (Diretoria, Operação, Parceiros)   - Resumo de Valor & Saúde Fiscal    - Logs n8n/LiteLLM |
+-----------------------------------------------------+---------------------------------------------+
                                                      |
                                                      v
+---------------------------------------------------------------------------------------------------+
|                       CAMADA DE AUTOMAÇÃO, INTEGRAÇÃO E IA (COYTECH FLOW)                         |
|                                                                                                   |
|  [Orquestrador de Workflows: n8n Enterprise/Self-Hosted]     [Gateway de Governança IA: LiteLLM]  |
|  - Onboarding Automático em 5 min (Drive + WhatsApp)         - Controle de Custos, Logs e Chaves  |
|  - Conciliação Financeira & Notas Fiscais em Lote            - Roteamento p/ Claude 3.7 / 3.5     |
|  - Relatório Executivo Automático (Segunda-feira 08h00)      - 5 Agentes IA (Vendas, Cobrança,    |
|  - Conectores: ERP, CRM, Gateways Pix, SEFAZ, WhatsApp         Suporte N1, CS/LTV e SRE)          |
+-----------------------------------------------------+---------------------------------------------+
                                                      |
                                                      v
+---------------------------------------------------------------------------------------------------+
|                   CAMADA DE OBSERVABILIDADE EM 4 CAMADAS & BIA (COYTECH PULSE)                    |
|                                                                                                   |
|  [1. Infra: Zabbix 7.0 LTS]   [2. App/APM: Datadog]   [3. Sintético: Playwright]   [4. Externo]   |
|  - Servidores, DB, Rede, VPN  - Rotas Next.js, Filas  - Robôs Login & Checkout     - SEFAZ & Pix  |
|                                                                                                   |
|  ===> [MOTOR BIA (Business Impact Analysis)]: Traduz falhas técnicas e quedas de conversão        |
|       ("TI verde com vendas caindo") em impacto financeiro em R$/minuto com SLA de 15 min.        |
+-----------------------------------------------------+---------------------------------------------+
                                                      |
                                                      v
+---------------------------------------------------------------------------------------------------+
|                         CAMADA DE DADOS, MEMÓRIA E SEGURANÇA (SUPABASE)                           |
|                                                                                                   |
|  [PostgreSQL 16 + RLS Multi-Tenant]   [pgvector (Memória IA)]   [Supabase Realtime & Vault]       |
|  - Clientes, Projetos 30d, Filas,     - Base de Conhecimento,   - Atualização Ao Vivo de Filas    |
|    Catálogo BIA, Incidentes, Audit      Runbooks SRE e Contexto   e Cofre Criptografado de Chaves |
+---------------------------------------------------------------------------------------------------+
```
