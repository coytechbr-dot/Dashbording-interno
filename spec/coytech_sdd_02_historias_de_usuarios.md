# Coytech SDD 02: Histórias de Usuários, Personas e Critérios de Aceite (Gherkin)

## 1. Mapa de Personas no Ecossistema Coytech

As histórias de usuário deste documento foram modeladas diretamente sobre o **Comitê de Decisão B2B** e a equipe técnica definidos nos documentos estratégicos da **Coytech**:

| Persona | Papel na Empresa Cliente / Coytech | Foco Principal | Módulo Principal que Utiliza |
| :--- | :--- | :--- | :--- |
| **Rodrigo (CEO / Fundador)** | Decisor Final do Cliente (Mid-Market / Enterprise) | Margem de lucro, ROI, visão de faturamento em tempo real e proteção contra paradas silenciosas. | **Painel Executivo Mobile (Pulse)**, Relatório de Segunda às 08h e Aprovações de Alçada (**Studio**). |
| **Camila (COO / Diretora de Operações)** | Dona dos Processos e Backoffice | Fim da redigitação em múltiplas planilhas, cumprimento de SLAs, conciliação financeira e aprovação rápida. | **Portal Operacional 1-Clique (Studio)** e Automações de Backoffice (**Flow**). |
| **Eduardo (CTO / Head de TI)** | Decisor Técnico do Cliente | Estabilidade, fim da fadiga de alarmes falsos, visibilidade de SEFAZ/bancos, governança de IA e redução de MTTR. | **Painel de Observabilidade & BIA (Pulse)** e Governança **LiteLLM / n8n (Flow)**. |
| **Lucas (Engenheiro DevOps / SRE)** | Usuário Técnico / Analista de Monitoramento | Ferramentas calibradas (Zabbix 7.0 LTS, Grafana, Datadog), fim de acionamentos falsos de madrugada e causa raiz rápida. | **Painel NOC/TI (Pulse)** e **Agente Investigativo SRE (Flow)**. |
| **Engenheiro Líder Coytech** | Responsável pela Entrega da Sprint de 30 Dias e LTV | Executar as 6 etapas operacionais sem bloqueios, cumprir SLAs de 15 min (P1) e expandir contas a cada 90 dias. | **Console Interno de Entrega & Governança Coytech**. |

## 2. Épico 1: Onboarding Automatizado e Planejamento BIA (Etapas 1 e 2 — Semana 1)

### US-COY-01: Provisionamento de Boas-Vindas em 5 Minutos (Etapa 1 — Dia 0)
* **Como** Engenheiro Líder da Coytech,
* **Eu quero** que a assinatura do contrato dispare automaticamente a criação do ambiente do cliente e o envio do cofre de acessos em até 5 minutos,
* **Para que** o cliente perceba velocidade imediata e tenhamos todos os acessos testados antes do Kick-off no Dia 3.

**Critérios de Aceite (Gherkin):**
* **Cenário 1: Disparo automático pós-assinatura no Dia 0**
  * **Dado** que o comercial marca o contrato como assinado no CRM (Dia 0) com os dados do patrocinador (Rodrigo/CEO, Camila/COO ou Eduardo/CTO),
  * **Quando** o webhook aciona o workflow de Onboarding no **n8n**,
  * **Então** em até 5 minutos o sistema cria a estrutura de pastas do cliente no Google Drive, monta o grupo executivo no WhatsApp e envia a mensagem de boas-vindas com o link de agendamento do Kick-off e o link do Cofre de Senhas.
* **Cenário 2: Validação técnica obrigatória antes do Kick-off (Dias 1 e 2)**
  * **Dado** que o cliente preencheu o formulário seguro de credenciais (chaves de API do ERP/CRM/Gateway para o **Flow**, subdomínio/planilhas para o **Studio** e acesso VPN para o **Pulse**),
  * **Quando** o sistema executa o teste de conectividade automatizado antes da reunião do Dia 3,
  * **Então** o painel marca cada integração como *"Conectada e Validada"* ou alerta a engenharia imediatamente para corrigir antes do Kick-off.

### US-COY-02: Mapeamento de Impacto Financeiro nos Negócios — BIA (Etapa 2 — Semana 1)
* **Como** Rodrigo (CEO) e Eduardo (CTO),
* **Nós queremos** cadastrar o custo por hora de parada de cada processo crítico (checkout, emissão de nota na SEFAZ, aprovação de pedidos),
* **Para que** todo alerta técnico do monitoramento mostre exatamente quantos reais por minuto estão em risco.

**Critérios de Aceite (Gherkin):**
* **Cenário 1: Configuração da matriz BIA na Semana 1**
  * **Dado** que durante o mapeamento dos Dias 1 e 2 foi identificado que a parada do checkout custa R$ 80.000/hora (R$ 1.333,33/minuto),
  * **Quando** o engenheiro registra essa regra no catálogo BIA do **Coytech Pulse**,
  * **Então** qualquer incidente futuro vinculado ao fluxo de checkout passa a exibir automaticamente o cronômetro de perda financeira acumulada em tempo real nos painéis Técnico e Executivo.

## 3. Épico 2: Criação de Sistemas Sob Medida e Aprovação em 1 Clique (Coytech Studio)

### US-COY-03: Fila Operacional com SLA Ao Vivo e Aprovação em 1 Clique
* **Como** Camila (COO / Diretora de Operações),
* **Eu quero** aprovar pedidos, compras ou liberações financeiras em 1 clique dentro de um portal web único conectado ao nosso ERP,
* **Para que** minha equipe pare de digitar a mesma informação em 3 planilhas diferentes e nenhuma aprovação se perca no WhatsApp.

**Critérios de Aceite (Gherkin):**
* **Cenário 1: Aprovação em 1 clique com sincronização imediata**
  * **Dado** que Camila acessa a fila de aprovações pendentes no portal **Coytech Studio** (no computador ou celular), ordenada pelo prazo de SLA mais crítico,
  * **Quando** ela clica no botão **"Aprovar em 1 Clique"** em uma solicitação validada,
  * **Então** o sistema registra a assinatura de auditoria (`actor_id`, horário e IP), dispara o workflow no **n8n** para atualizar o ERP/financeiro em até 3 segundos e remove o item da fila pendente em tempo real.

### US-COY-04: Virada Segura de Go-Live e Congelamento de Planilhas Antigas (Etapa 4 — Semana 4)
* **Como** Camila (COO),
* **Eu quero** que na virada para produção as planilhas antigas sejam importadas para o sistema novo e travadas em modo *"Somente Leitura"*,
* **Para que** nenhum colaborador continue alimentando controles paralelos por hábito após o treinamento.

**Critérios de Aceite (Gherkin):**
* **Cenário 1: Sequência segura de Go-Live na Semana 4**
  * **Dado** que o **Coytech Pulse** (Monitoramento) já foi ligado no Passo A da virada e os dados finais foram migrados no Passo B,
  * **Quando** o engenheiro aciona o Passo C de Go-Live,
  * **Então** a automação altera as permissões das planilhas legadas mapeadas para *"Somente Leitura"*, exibe um banner com o link do novo portal **Coytech Studio** e libera o acesso aos vídeos de treinamento de 3 minutos por perfil (Sócios, Operação e TI).

## 4. Épico 3: Automação de Backoffice e Os 5 Agentes de IA (Coytech Flow)

### US-COY-05: Conciliação Financeira e Emissão Fiscal em Lote com Contingência
* **Como** Camila (COO),
* **Eu quero** que o sistema concilie automaticamente os pagamentos recebidos (Pix/cartão/boleto) com o ERP e emita as notas fiscais em lote,
* **Para que** o fechamento financeiro aconteça em segundos, sem trabalho manual nos finais de semana.

**Critérios de Aceite (Gherkin):**
* **Cenário 1: Instabilidade na SEFAZ durante emissão em lote (Prioridade Alta)**
  * **Dado** que um lote de notas fiscais está sendo emitido pelo **Coytech Flow** e o monitoramento detecta instabilidade na SEFAZ estadual,
  * **Quando** a API da SEFAZ retorna erro ou timeout,
  * **Então** o sistema ativa automaticamente a fila de contingência com retentativa inteligente e notifica o cliente em **até 30 minutos**, garantindo zero perda de faturamento.

### US-COY-06: Atuação dos 5 Agentes de IA com Governança LiteLLM
* **Como** Eduardo (CTO),
* **Eu quero** que todos os 5 Agentes de IA (Vendas, Cobrança, Suporte N1, Sucesso do Cliente e SRE) operem através de um gateway governado (**LiteLLM**),
* **Para que** eu tenha controle total de custos por token, logs de auditoria de prompts e proteção de dados sensíveis (LGPD).

**Critérios de Aceite (Gherkin):**
* **Cenário 1: Agente Investigativo de Incidentes Técnicos (SRE) em ação**
  * **Dado** que um alerta crítico P1 é aberto no **Coytech Pulse**,
  * **Quando** o webhook aciona o **Agente Investigativo SRE**,
  * **Então** o agente consulta automaticamente as últimas mudanças de código, logs de erro do n8n, métricas do Zabbix/Datadog e histórico de incidentes similares no `pgvector`, anexando em menos de 60 segundos um resumo de causa raiz provável para a engenharia agir dentro do SLA de 15 minutos.

## 5. Épico 4: Monitoramento 4 Camadas, Painel Executivo e Retenção LTV (Coytech Pulse)

### US-COY-07: Detecção de "TI Verde com Vendas Caindo" e Painel Executivo no Celular
* **Como** Rodrigo (CEO),
* **Eu quero** acompanhar no celular as vendas por hora e receber alertas imediatos caso a conversão despencasse mesmo com os servidores funcionando,
* **Para que** eu nunca mais descubra pelo cliente que a operação de vendas travou.

**Critérios de Aceite (Gherkin):**
* **Cenário 1: Alerta de anomalia de negócio (Queda de 30% nas vendas)**
  * **Dado** que a infraestrutura (CPU, memória e banco no Zabbix) está 100% verde, mas o fluxo de pedidos cai 30% abaixo da média histórica daquela faixa horária,
  * **Quando** o motor de correlação do **Coytech Pulse** detecta a anomalia e executa o robô de teste sintético de checkout,
  * **Então** o sistema identifica a falha silenciosa (ex: erro na API do gateway de pagamento), calcula o impacto financeiro em R$/hora e aciona a engenharia em **até 15 minutos**.

### US-COY-08: Eliminação de >75% dos Alarmes Falsos para a Equipe de TI
* **Como** Eduardo (CTO) e Lucas (SRE),
* **Nós queremos** que o monitoramento filtre oscilações momentâneas e agrupe alertas repetidos,
* **Para que** nossa equipe pare de ser acordada de madrugada por alarmes falsos e foque apenas no que realmente afeta o negócio.

**Critérios de Aceite (Gherkin):**
* **Cenário 1: Correlação e supressão de ruído duranteApresentação da Semana 3**
  * **Dado** que os templates do Zabbix 7.0 LTS, Grafana e Datadog foram calibrados pela Coytech,
  * **Quando** ocorre uma falha em um serviço base que afeta 20 microserviços dependentes,
  * **Então** o **Coytech Pulse** suprime os 20 alertas secundários, dispara apenas 1 alerta mestre com a causa raiz e comprova no painel técnico uma redução superior a 75% no volume de notificações.

### US-COY-09: Relatório de Prova de Valor Toda Segunda-Feira às 08h (Etapa 5 — LTV)
* **Como** Rodrigo (CEO) e Camila (COO),
* **Nós queremos** receber toda segunda-feira às 08h00 no WhatsApp o resumo executivo da semana anterior,
* **Para que** vejamos claramente quantas horas manuais foram economizadas, quantos processos rodaram sozinhos e qual foi o retorno financeiro da assinatura mensal da Coytech.

**Critérios de Aceite (Gherkin):**
* **Cenário 1: Disparo pontual de segunda-feira às 08h00**
  * **Dado** que é segunda-feira às 08h00 (`America/Sao_Paulo`),
  * **Quando** o cron job de LTV no **Coytech Flow** consolida as métricas da semana anterior,
  * **Então** os sócios recebem no WhatsApp e e-mail o card executivo contendo: total de execuções automáticas, horas humanas poupadas, incidentes neutralizados, SLA de disponibilidade e receita protegida em reais.

### US-COY-10: Offboarding Seguro com Retenção ou Entrega Total de Ativos (Etapa 6)
* **Como** Eduardo (CTO),
* **Eu quero** ter a garantia contratual e técnica de que, caso o contrato seja encerrado, posso optar por um plano passivo enxuto ou receber 100% dos códigos, fluxos n8n, backups e templates com revogação total das senhas da Coytech,
* **Para que** minha empresa tenha soberania sobre seus ativos e conformidade com a LGPD.

**Critérios de Aceite (Gherkin):**
* **Cenário 1: Execução do checklist de Offboarding em 15 dias**
  * **Dado** que o cliente optou pelo encerramento definitivo após a conversa de retenção dos Dias 1 a 3,
  * **Quando** o fluxo de Offboarding avança pelos Dias 4 a 15,
  * **Então** o sistema gera o pacote completo de entrega (repositório Git, dump do banco, JSONs do n8n e templates Zabbix/Grafana), revoga todas as chaves no LiteLLM e VPN no último dia, coleta a assinatura no Termo de Encerramento e agenda os lembretes de reconexão para **60 e 120 dias depois**.
