# Documento 02: Definição do Produto e Modelo de Negócio (Os Três Pilares) — Coytech

## 1. Tese Central do Produto

> **"Código sem automação é lento. Automação sem monitoramento é cega."**

O modelo de negócio da **Coytech** baseia-se em **três frentes principais de serviços — Criação, Implementação e Monitoramento de Sistemas — desenhadas para resolver gargalos operacionais rapidamente e gerar Receita Recorrente Mensal (MRR)**.

Enquanto fábricas de software apenas entregam código e vão embora (sem receita recorrente e deixando o cliente sem suporte proativo) e consultorias comuns apenas monitoram ferramentas de terceiros (sem poder criar ou alterar o sistema do cliente), a **Coytech** une todo o ciclo em um único ecossistema.

## 2. Os Três Pilares de Serviços da Coytech

| Pilar do Modelo de Negócio | Unidade do Ecossistema | O Que Entregamos na Prática | Como Gera Receita para a Coytech |
| :--- | :--- | :--- | :--- |
| **Pilar 1: Criação de Sistemas** | **Coytech Studio** & **Coytech Flow** | Construção sob medida de aplicativos web (SaaS dinâmicos), portais operacionais, fluxos de automação e Agentes de IA personalizados para a regra de negócio do cliente. | **Receita de Setup / Projeto Inicial** (Sprint de 30 Dias com alto valor percebido) + **Expansão de Novos Módulos**. |
| **Pilar 2: Implementação** | **Coytech Flow** & Engenharia de Implantação | Integração do sistema com ERP, CRM, bancos, WhatsApp e APIs; implantação de ferramentas (n8n, Zabbix, Grafana, Datadog, LiteLLM); migração de planilhas e treinamento da equipe. | **Receita de Implantação / Ativação** + **Retenção (Lock-in Saudável)**, pois o sistema passa a ser o coração da operação diária. |
| **Pilar 3: Monitoramento de Sistemas** | **Coytech Pulse** & Sustentação Contínua | Vigilância 24/7 da infraestrutura, do sistema web, das automações e de dependências externas (SEFAZ e gateways), com cálculo de impacto financeiro (BIA), manutenção preventiva e evolução mensal. | **Motor Principal de Receita Recorrente (MRR)** através de contratos mensais contínuos de monitoramento, sustentação e evolução. |

## 3. Especificação Simples de Cada Pilar

### 3.1 Pilar 1 — Criação de Sistemas (Construir Sob Medida)
Focado em substituir planilhas paralelas, controles manuais e softwares de prateleira que não atendem à realidade da empresa:
- **Aplicativos Web e SaaS Dinâmicos (Coytech Studio):**
  - Portais operacionais modernos (modo escuro/claro responsivo), rápidos e fáceis de usar no computador ou celular.
  - Filas de trabalho com indicadores de prazo (SLA) ao vivo e **aprovação em 1 clique** (pedidos, compras, financeiro, cadastro).
  - Controle de acesso por perfil (Diretoria, Gerência, Operação, Cliente Externo) e registro de auditoria de todas as ações.
- **Desenho de Automações e Agentes Inteligentes (Coytech Flow):**
  - Construção de fluxos automáticos no **n8n** para eliminar tarefas repetitivas.
  - Criação de **5 classes de Agentes de IA** (usando modelos como Claude com controle via LiteLLM) que não apenas respondem dúvidas, mas consultam o banco de dados, tomam decisões e executam ações:
    1. *Agente de Vendas e Qualificação (WhatsApp/Direct 24/7)*
    2. *Agente de Recuperação de Vendas e Cobrança*
    3. *Agente de Suporte Nível 1 Autônomo*
    4. *Agente de Sucesso do Cliente (Retenção)*
    5. *Agente Investigativo de Incidentes Técnicos (SRE)*

### 3.2 Pilar 2 — Implementação (Colocar para Rodar na Operação)
Focado em conectar as pontas e garantir que a tecnologia funcione de verdade dentro da empresa:
- **Conexão entre Sistemas:** Integração automática entre o Web App criado, o ERP, o CRM, os gateways de pagamento (Pix/boleto/cartão) e os sistemas de emissão de nota fiscal.
- **Rotinas Críticas Automatizadas:**
  - Conciliação financeira automática entre vendas e extrato/gateway.
  - Validação e emissão de notas fiscais em lote.
  - Onboarding e provisionamento automático de novos clientes ou colaboradores.
  - Geração e envio automático do **Relatório Executivo toda segunda-feira às 08h** no WhatsApp e e-mail dos sócios.
- **Implantação e Migração:** Importação limpa dos dados que estavam em planilhas, configuração de servidores/bancos (Next.js, PostgreSQL/Supabase, n8n, Zabbix 7.0 LTS, Grafana, Datadog) e treinamento prático da equipe.

### 3.3 Pilar 3 — Monitoramento de Sistemas (Proteger e Gerar Recorrência)
Focado em manter a operação blindada 24/7 e justificar a mensalidade recorrente mês após mês:
- **Monitoramento em 4 Camadas Integrado:**
  1. *Infraestrutura:* Servidores, nuvem, banco de dados, memória, disco e rede.
  2. *Aplicação:* Código do sistema web, velocidade de resposta das telas e execução das filas de automação.
  3. *Experiência do Usuário:* Testes robóticos simulando login, busca e fechamento de compra para detectar falhas antes do cliente final.
  4. *Dependências Externas:* Monitoramento em tempo real da **SEFAZ** (autorização e status de nota fiscal eletrônica), sistemas bancários (Pix) e gateways de pagamento.
- **Monitoramento de Negócio com Impacto Financeiro (BIA):**
  - Detecta quando as vendas ou conversões caem (ex: queda de 30% nas vendas) mesmo quando os servidores parecem normais ("TI verde com vendas caindo").
  - Todo alerta crítico informa o custo por minuto da falha (ex: *"Checkout lento — Perda estimada: R$ 80.000/hora"*).
- **Dois Painéis com a Mesma Fonte de Verdade:**
  - **Painel Técnico (NOC/TI):** Visão detalhada para os engenheiros resolverem a causa raiz rapidamente.
  - **Painel Executivo (Celular do CEO/COO):** Visão limpa mostrando vendas por hora, conversão, disponibilidade (SLA) e receita protegida.

## 4. Engrenagem de Receita Recorrente (Como Vendemos e Cobramos)

```
ETAPA 1: Diagnóstico Gratuito (45 min)
   └── Identifica onde o cliente perde dinheiro (planilhas, trabalho manual ou quedas sem alerta)
         │
ETAPA 2: Criação + Implementação (Sprint de 30 Dias — Taxa de Setup)
   └── Entrega o sistema web, as automações e os painéis funcionando em produção no 1º mês
         │
ETAPA 3: Monitoramento + Sustentação + Evolução (Mensalidade Recorrente — MRR)
   └── Mantém o monitoramento 24/7 ativo, envia o relatório de valor toda segunda às 08h
       e entrega melhorias contínuas todos os meses
```

### Comparativo Direto: Por que o Cliente Escolhe a Coytech

| Critério | Software de Prateleira | Fábrica de Software Comum | Consultoria Só de Monitoramento | Ecossistema Coytech (Criação + Implementação + Monitoramento) |
| :--- | :--- | :--- | :--- | :--- |
| **Adaptação ao Negócio** | Baixa (sistema engessado) | Alta, mas demora de 6 a 12 meses | Não cria sistemas nem telas | **100% sob medida com 1ª entrega em 30 dias** |
| **Custo por Usuário** | Cobra caro a cada novo usuário | Não cobra por usuário, mas cobra caro por qualquer ajuste | Cobra apenas suporte técnico | **Sem cobrança abusiva por usuário e com evolução mensal inclusa** |
| **Segurança Pós-Entrega** | Suporte genérico por ticket | Entrega o código sem monitoramento | Monitora o servidor, mas não arruma o sistema | **Monitoramento 24/7 nativo com alerta financeiro e correção rápida** |
