# Coytech SDD 04: Arquitetura de Memória, Governança LiteLLM e Os 5 Agentes de IA

## 1. Filosofia dos Agentes de IA na Coytech Flow

Conforme definido na especificação de produto da **Coytech**, nossos Agentes de IA não são chatbots passivos que apenas tiram dúvidas: **eles consultam o banco de dados do cliente, avaliam regras de negócio, tomam decisões operacionais e executam ações auditáveis** através do **n8n** e do portal **Coytech Studio**, sob governança estrita do **LiteLLM**.

## 2. Arquitetura de Memória Corporativa em 4 Camadas (Supabase + `pgvector`)

Para que os 5 Agentes de IA operem com precisão empresarial sem alucinar políticas comerciais ou diagnósticos técnicos, a memória é estruturada em **4 camadas isoladas por cliente (`tenant_id`)**:

| Camada de Memória | Escopo e Retenção | Tecnologia no Supabase | Conteúdo Armazenado por Cliente B2B | Agentes Consumidores |
| :--- | :--- | :--- | :--- | :--- |
| **1. Memória Operacional de Sessão (Working Memory)** | Curto Prazo (Sessão ativa de atendimento, negociação ou incidente aberto) | Tabelas `agent_sessions` (JSONB) + Redis (n8n) | Estado atual da conversa no WhatsApp/Direct, itens em negociação, etapa do funil de qualificação, boletos/Pix gerados ou checklist de investigação do incidente P1 em andamento. | Todos os 5 Agentes |
| **2. Memória Episódica e de Auditoria (Episodic Memory)** | Médio/Longo Prazo (Histórico cronológico imutável) | Tabelas `agent_execution_logs`, `incident_timelines` e logs do **LiteLLM** | Histórico de interações com cada cliente/fornecedor, promessas de pagamento anteriores, chamados resolvidos no N1 e histórico de incidentes passados (o que causou a falha e como foi resolvida). | Agentes 02, 03, 04 e 05 (SRE) |
| **3. Memória Semântica e Base de Conhecimento (Vector RAG)** | Longo Prazo (Conhecimento vivo da operação e da TI do cliente) | PostgreSQL + extensão `pgvector` (`vector(1536)`) nas tabelas `knowledge_chunks` e `sre_runbooks` | Manuais operacionais da empresa, políticas de desconto/crédito, FAQs técnicas, documentação de APIs do ERP e *Runbooks* de resolução de falhas de infraestrutura/SEFAZ. | Agentes 01, 03 e 05 (SRE) |
| **4. Memória Procedural e Matriz de Impacto (Business Rules & BIA)** | Permanente (Regras determinísticas de alçada e impacto financeiro) | Tabelas `bia_processes`, `approval_policies` e `customer_health_scores` | Limites financeiros que exigem aprovação humana em 1 clique no **Coytech Studio**, custo por minuto de cada sistema parado (BIA) e indicadores de uso ativo da plataforma. | Todos os 5 Agentes |

## 3. Especificação Técnica das 5 Classes de Agentes de IA (Coytech Flow)

### 3.1 Agente 01: Agente de Vendas e Qualificação (WhatsApp / Direct 24/7)
* **Objetivo de Negócio:** Atender leads B2B ou B2C em menos de 5 segundos, 24/7, qualificar o perfil, consultar estoque/agenda/tabela de preços no ERP e fechar o pedido ou agendar reunião para o executivo de contas.
* **Gatilho de Entrada:** Webhook da API Oficial do WhatsApp ou Instagram Direct no **n8n**.
* **Tools Conectadas (Function Calling):**
  * `query_erp_catalog_and_stock(sku_or_term)`: Consulta disponibilidade e preço em tempo real no ERP/banco do cliente.
  * `qualify_lead_and_update_crm(lead_data, score)`: Atualiza o card no CRM e classifica o potencial de compra.
  * `book_calendar_or_create_order(payload)`: Agenda horário (ex: redes de clínicas/serviços) ou cria o pedido direto no portal **Coytech Studio**.
  * `escalate_to_human_closer(summary)`: Transfere para o vendedor humano com resumo executivo pronto quando a negociação exige condição especial fora da alçada.

### 3.2 Agente 02: Agente de Recuperação de Vendas e Cobrança Inteligente
* **Objetivo de Negócio:** Recuperar carrinhos/propostas abandonadas e realizar cobrança preventiva e reativa de inadimplentes (Pix/boleto/cartão) preservando o relacionamento comercial.
* **Gatilho de Entrada:** Evento de checkout/proposta expirada ou webhook de fatura vencida no ERP/Gateway financeiro.
* **Tools Conectadas (Function Calling):**
  * `get_customer_payment_history(customer_id)`: Verifica histórico do cliente para calibrar o tom da abordagem (lembrete amigável para bom pagador vs. negociação estruturada).
  * `reissue_pix_or_boleto(invoice_id)`: Gera segunda via atualizada ou código Pix Copia e Cola instantâneo no gateway.
  * `submit_discount_for_1click_approval(invoice_id, proposed_discount)`: Caso o cliente peça desconto de juros/multa acima da alçada automática, envia para a fila de **Aprovação em 1 Clique** da COO (Camila) no portal **Coytech Studio**.

### 3.3 Agente 03: Agente de Suporte Nível 1 Autônomo
* **Objetivo de Negócio:** Resolver autonomamente mais de 70% dos chamados operacionais repetitivos (status de pedido/entrega, segunda via de nota fiscal/XML, dúvidas de uso ou cadastro) sem ocupar a equipe humana.
* **Gatilho de Entrada:** Mensagem no WhatsApp de suporte, portal do cliente ou abertura de ticket.
* **Tools Conectadas (Function Calling):**
  * `search_company_knowledge_rag(query)`: Busca nos manuais e procedimentos da empresa via `pgvector`.
  * `fetch_order_or_invoice_status(document_number)`: Consulta status de entrega na transportadora ou baixa o PDF/XML da Nota Fiscal autorizada na SEFAZ.
  * `open_tier2_ticket_with_context(issue_summary)`: Escala chamados complexos para a fila operacional do **Coytech Studio** já categorizados e com SLA definido.

### 3.4 Agente 04: Agente de Sucesso do Cliente e Retenção (LTV / CS)
* **Objetivo de Negócio:** Monitorar a saúde e o engajamento da carteira de clientes, prevenir cancelamentos (*churn*) e compilar os insumos da **Prova de Valor Semanal (Relatório de Segunda-Feira às 08h)** e da **Reunião Trimestral de Expansão (90 dias)**.
* **Gatilho de Entrada:** Cron diário de análise de uso + Cron de segunda-feira às 07h45.
* **Tools Conectadas (Function Calling):**
  * `calculate_tenant_health_score(tenant_id)`: Avalia frequência de login da equipe no sistema, volume de automações rodadas e chamados abertos.
  * `generate_monday_8am_value_report(tenant_id, week_range)`: Consolida quantos processos rodaram sozinhos, quantas horas manuais foram poupadas e quantas falhas o **Coytech Pulse** evitou, formatando o resumo executivo para o WhatsApp dos sócios.
  * `identify_quarterly_upsell_opportunities(tenant_id)`: Aponta gargalos ainda manuais ou filas com alto volume para sugerir novos módulos na reunião trimestral.

### 3.5 Agente 05: Agente Investigativo de Incidentes Técnicos (SRE Copilot)
* **Objetivo de Negócio:** Garantir que a engenharia da Coytech cumpra o **SLA de 15 minutos em incidentes críticos (P1)** e elimine o tempo gasto procurando logs em múltiplos painéis.
* **Gatilho de Entrada:** Abertura de incidente crítico ou alerta de anomalia BIA (*"TI verde com vendas caindo"*) no **Coytech Pulse** (Zabbix / Datadog).
* **Tools Conectadas (Function Calling):**
  * `fetch_correlated_telemetry(service_id, time_window)`: Busca em paralelo métricas do Zabbix 7.0 LTS, traces de erro do Datadog, logs de falha do n8n e status da SEFAZ/Gateways.
  * `search_past_incidents_and_runbooks(error_signature)`: Consulta na memória vetorial (`sre_runbooks` no `pgvector`) como incidentes idênticos foram resolvidos anteriormente.
  * `calculate_live_bia_exposure(process_id, downtime_minutes)`: Calcula a perda financeira em reais por minuto baseada na matriz BIA do cliente.
  * `post_root_cause_briefing(incident_id, diagnosis, suggested_fix)`: Publica em menos de 60 segundos no grupo de plantão da engenharia e no Painel NOC a causa raiz provável e o comando/ação recomendada para mitigação imediata.

## 4. Governança Centralizada, Controle de Custos e Segurança LGPD (LiteLLM)

Para atender às exigências de segurança do CTO (Eduardo) em clientes Mid-Market e Enterprise:

```
[Agentes n8n / Next.js] 
       │
       ▼ (Chave Virtual do Tenant: sk-coytech-tenant-xyz)
+-----------------------------------------------------------------------+
|                       LITELLM PROXY GATEWAY                           |
|  1. Autenticação & Isolamento de Custos por Cliente (Tenant Budget)   |
|  2. Guardrail LGPD: Mascaramento de CPF/CNPJ/Senhas antes do LLM      |
|  3. Roteamento Inteligente:                                           |
|     - Tarefas rápidas/triagem -> Claude 3.5 Haiku                     |
|     - Raciocínio complexo/SRE/BIA -> Claude 3.7 Sonnet                |
|  4. Fallback Automático: Se Anthropic oscilar -> Roteia p/ AWS Bedrock|
|  5. Kill-Switch de Offboarding: Revogação em 1 clique no Dia 15       |
+-----------------------------------------------------------------------+
```

1. **Trava Determinística de Alçada (Human-in-the-Loop):** Nenhum agente pode aprovar estornos, descontos ou pagamentos acima do limite parametrizado na tabela `approval_policies`. Sempre que uma decisão ultrapassa o limite, o agente cria um card na fila de **Aprovação em 1 Clique** do portal **Coytech Studio**.
2. **Desligamento Limpo no Offboarding (Etapa 6):** No último dia do contrato (Dia 15 do Offboarding), a revogação da chave virtual no LiteLLM e a limpeza dos embeddings na tabela `knowledge_chunks` garantem conformidade total com a LGPD, com emissão automática de log de expurgo.
