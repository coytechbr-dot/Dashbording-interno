# Documento 01: Público-Alvo, ICP e Personas — Coytech

## 1. Posicionamento e Público-Alvo da Coytech

A **Coytech** atende empresas **B2B de Médio e Grande Porte (Mid-Market e Enterprise)** que já possuem operação validada e faturamento recorrente, mas enfrentam travas de crescimento causadas por:
- **Planilhas paralelas e sistemas desconectados** que geram retrabalho, divergência de números e risco fiscal.
- **Processos manuais lentos no backoffice** que exigem contratar mais pessoas para conseguir crescer.
- **Cegueira operacional e falhas silenciosas**, onde a empresa só descobre que o sistema, o checkout ou a emissão fiscal parou quando o cliente reclama.

### 1.1 Perfil de Cliente Ideal (ICP) por Faixa de Empresa

| Critério | Perfil 1: Médio Porte em Escala (Mid-Market) | Perfil 2: Grande Porte e Operações Críticas (Enterprise) |
| :--- | :--- | :--- |
| **Faturamento Anual** | R$ 10 milhões a R$ 120 milhões/ano | Acima de R$ 120 milhões/ano |
| **Tamanho da Equipe** | 30 a 250 colaboradores (TI enxuta de 2 a 10 pessoas ou terceirizada) | Acima de 250 colaboradores (time próprio de TI, DevOps ou NOC) |
| **Cenário Atual** | Usa ERP/CRM padrão cercado por dezenas de planilhas e tarefas manuais no WhatsApp | Possui múltiplos sistemas, nuvem e ferramentas de monitoramento com excesso de alarmes falsos |
| **Principal Dor** | Falta de um sistema próprio sob medida e automação para escalar sem inchar a equipe | Quedas silenciosas de faturamento, alto tempo de resposta a incidentes (MTTR) e falta de visão executiva |
| **Porta de Entrada** | **Criação + Implementação** (Sprint de 30 Dias: Sistema Web + Automação) | **Implementação + Monitoramento** (Diagnóstico de Impacto Financeiro BIA + Redução de Ruído) |

### 1.2 Setores Prioritários (Verticais de Maior Retorno)

1. **Varejo, E-commerce e Atacado Distribuidor:** Precisam monitorar funil de vendas em tempo real, disponibilidade de SEFAZ/meios de pagamento e automatizar conciliação financeira e recuperação de vendas.
2. **Logística, Transporte, Pedágios e Concessões:** Precisam monitorar ativos distribuídos em tempo real e controlar pátio, frota e ocorrências em um painel único.
3. **Serviços Financeiros, Fintechs e Securitizadoras:** Precisam de portais próprios de originação/crédito, automação de cadastro (onboarding/KYC) com IA e monitoramento de APIs bancárias e Pix.
4. **Indústria e Manufatura:** Precisam conectar o chão de fábrica à gestão corporativa sem pagar licenças abusivas por usuário.
5. **Saúde, Redes de Clínicas e Diagnósticos:** Precisam de agendamento e pré-triagem inteligente 24/7 no WhatsApp, portal de parceiros e auditoria automática de faturamento.
6. **Empresas de Serviços B2B, Agências e Franquias:** Precisam de portais operacionais com filas de aprovação em 1 clique e relatórios executivos automáticos.

### 1.3 Quem a Coytech NÃO Atende (Anti-ICP)
- Negócios em fase de ideia sem operação rodando ou sem orçamento corporativo.
- Empresas que buscam apenas sites institucionais simples ou suporte básico de informática (formatação/helpdesk N1).
- Projetos de "tecnologia por modismo" sem objetivo claro de gerar receita, reduzir custos ou proteger a operação.

## 2. Mapa de Personas (Comitê de Decisão B2B)

Em nossos clientes, a compra e o uso do ecossistema passam por quatro perfis principais:

### 2.1 Rodrigo — O CEO / Fundador (Decisor Final)
- **Foco principal:** Margem de lucro, crescimento em escala, retorno sobre investimento (ROI) e visão do negócio em tempo real.
- **Principais dores:**
  - Chega na reunião de diretoria e vê 5 planilhas com números diferentes.
  - Paga caro em softwares de prateleira engessados ou já perdeu tempo e dinheiro com fábricas de software que demoram 1 ano para entregar.
  - Descobre pelo cliente que o sistema de vendas ou faturamento travou.
- **O que ele compra na Coytech:** Um sistema próprio entregue em 30 dias (**Criação e Implementação**) e um painel executivo no celular que mostra o faturamento ao vivo e protege a receita 24/7 (**Monitoramento**).

### 2.2 Camila — A COO / Diretora de Operações (Dona dos Processos)
- **Foco principal:** Eficiência da equipe, cumprimento de prazos (SLAs), organização do backoffice e fim do retrabalho.
- **Principais dores:**
  - A equipe digita a mesma informação em 3 lugares diferentes todos os dias.
  - Perde horas na conciliação financeira, emissão de notas fiscais em lote, triagem no WhatsApp e montagem manual de relatórios no fim de semana.
  - Aprovações se perdem em conversas de WhatsApp e e-mails.
- **O que ela compra na Coytech:** Portal operacional sob medida com aprovação em 1 clique, automações que resolvem tarefas em 3 segundos e relatório executivo pronto toda segunda-feira às 08h no WhatsApp.

### 2.3 Eduardo — O CTO / Head de TI (Decisor Técnico)
- **Foco principal:** Estabilidade, segurança, arquitetura escalável, governança de dados/IA e redução do tempo de resolução de falhas (MTTR).
- **Principais dores:**
  - Fadiga de alertas: a equipe recebe centenas de alertas técnicos por dia (mais de 90% são alarmes falsos) e acaba ignorando o que é crítico.
  - Quando uma API externa (SEFAZ ou gateway de pagamento) falha, a culpa cai sobre a TI.
  - Dificuldade para provar o valor financeiro da TI para a diretoria.
- **O que ele compra na Coytech:** Observabilidade inteligente em 4 camadas que traduz alertas técnicos em impacto financeiro por minuto (BIA), automações seguras com logs (sem scripts improvisados) e governança centralizada de IA.

### 2.4 Lucas — Engenheiro DevOps / SRE / Analista de Monitoramento (Usuário Técnico)
- **Foco principal:** Ferramentas bem configuradas, fim dos acionamentos de madrugada por alarme falso e documentação clara.
- **Principais dores:** Banco de dados de monitoramento lento, falta de correlação entre servidor e aplicação, e manutenção de scripts manuais frágeis.
- **O que ele ganha com a Coytech:** Ambiente Zabbix 7.0 LTS, Grafana, Datadog e n8n estruturados com boas práticas, triagem automática de incidentes com IA e documentação completa.

## 3. Resumo de Objeções e Respostas Práticas

| Persona | Objeção Comum | Resposta Direta da Coytech |
| :--- | :--- | :--- |
| **Rodrigo (CEO)** | "Criar sistema próprio demora muitos meses e fica caro manter." | Entregamos o primeiro módulo funcionando em **30 dias** usando arquitetura modular, eliminando mensalidades por usuário e garantindo que o código seja ativo da sua empresa. |
| **Camila (COO)** | "Já tentamos automatizar antes, mas quando dava erro ninguém sabia arrumar." | Nossas automações não são scripts soltos: elas já nascem conectadas ao nosso **Monitoramento 24/7**, com histórico de execução e retentativa automática. |
| **Eduardo (CTO)** | "Já temos Zabbix e Grafana instalados internamente." | Nós não apenas instalamos a ferramenta: limpamos mais de 75% dos alarmes falsos, monitoramos serviços externos (SEFAZ/bancos) e conectamos cada alerta ao impacto em reais por minuto para a diretoria. |
