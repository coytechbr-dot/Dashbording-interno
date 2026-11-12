# 📋 COYDASH — Plano Mestre de Tasks e Execução (SDD End-to-End)

> **Projeto:** **CoyDash** — Plataforma Unificada de Gerenciamento e Operação do Ecossistema Coytech (**Coytech Studio**, **Coytech Flow** & **Coytech Pulse**)  
> **Tese Central:** *"Código sem automação é lento. Automação sem monitoramento é cega."*  
> **Público-Alvo:** Empresas B2B Mid-Market (R$ 10M–R$ 120M/ano) e Enterprise (> R$ 120M/ano) + Console Interno de Engenharia/SRE da Coytech.  
> **Documentos Base (Fonte da Verdade):**
> - [`coytech_sdd_01_requisitos_e_arquitetura.md`](./spec/coytech_sdd_01_requisitos_e_arquitetura.md)
> - [`coytech_sdd_02_historias_de_usuarios.md`](./spec/coytech_sdd_02_historias_de_usuarios.md)
> - [`coytech_sdd_03_stack_tecnologica_e_infraestrutura.md`](./spec/coytech_sdd_03_stack_tecnologica_e_infraestrutura.md)
> - [`coytech_sdd_04_arquitetura_memoria_e_agentes_ia.md`](./spec/coytech_sdd_04_arquitetura_memoria_e_agentes_ia.md)
> - [`coytech_sdd_05_modelagem_banco_de_dados_e_apis.md`](./spec/coytech_sdd_05_modelagem_banco_de_dados_e_apis.md)
> - [`coytech_01_publico_alvo_e_personas.md`](./spec/sobre/coytech_01_publico_alvo_e_personas.md)
> - [`coytech_02_produto_e_tres_pilares_receita_recorrente.md`](./spec/sobre/coytech_02_produto_e_tres_pilares_receita_recorrente.md)
> - [`coytech_03_fluxo_operacional_simplificado.md`](./spec/sobre/coytech_03_fluxo_operacional_simplificado.md)
> - **[`DESIGN.md`](./spec/DESIGN.md) — Design System Oficial (100% Idêntico ao `ROOMIE OFFICE AI`, sem mudar absolutamente nada)**

---

## 📌 Legenda de Status e Regra para Agentes
- `[ ]` Pendente
- `[~]` Em andamento
- `[x]` Concluído

> **⚠️ REGRAS OBRIGATÓRIAS PARA AGENTES:**
> 1. Ao iniciar ou concluir qualquer task abaixo, o agente **DEVE** atualizar o status neste arquivo (`TASKS.md`) e registrar o que foi feito, arquivos criados/alterados e decisões técnicas no arquivo [`MEMORY.md`](./MEMORY.md).
> 2. **FIDELIDADE 100% AO DESIGN SYSTEM DO `ROOMIE OFFICE AI` ([`spec/DESIGN.md`](./spec/DESIGN.md)):** É terminantemente proibido alterar qualquer token, fonte, raio, cor ou regra do Design System. Usar **exatamente**:
>    - Fonte única: **Schibsted Grotesk** (`400/500/600/700`) via `next/font/google` em `--font-sans`.
>    - Único acento: Laranja `#F0521F` (`--color-brand-orange`, hover `#FF6A36`), Tinta `#141414` (`--color-brand-ink`), Papel `#F4F4F2` (`--color-brand-paper`).
>    - Variáveis de tema idênticas ao `globals.css` do Roomie (`--bg`, `--fg`, `--fg2`, `--ds-muted`, `--surface`, `--ds-hover`, `--line`, `--line2`, `--hero`, `--hero-sub`) controladas por `data-theme="dark" | "light"` + `.dark` + `localStorage['dash-theme']`.
>    - Status apenas em pontos de `5–8px` (`#2F9E5A` verde, `#F0521F` laranja, `#E8C14A` amarelo, `#8F7DFF` lilás) — nunca como fundo.
>    - Botões primários em pílula laranja (`rounded-full`, `50px` ou compacto `42px`) com texto tinta `#141414` e seta `↗` (`ArrowUpRight`) à direita (`justify-between`), máximo 1 botão primário por área.
>    - Layout Desktop com Sidebar `220px` (com Card Plus laranja e mascote NPC saindo pelo topo), Header com busca + selo de presença em pílula + botão circular `38px` de tema + avatar, Bloco de destaque `--hero` (`270px`, `rounded-l-[18px]`) com cards ilustrados SVG (`#F4F4F2` e `#F0521F`, traço `2px #141414` cortados na base) e grade inferior `1fr / 330px`.
>    - Proibido usar emojis na interface, proibido usar outra cor de acento ou gradiente decorativo, proibido texto em inglês e proibido texto menor que `10.5px`.

---

## 🏗️ FASE 0: Fundação, Setup do Projeto & Design System (`coydash-core`)
**Objetivo:** Inicializar a base tecnológica oficial do `coytech-studio-starter` (SDD 03) aplicando **exatamente** o Design System do projeto `ROOMIE OFFICE AI` (`spec/DESIGN.md`) sem mudar nada.

- [x] **TASK-0.1:** Absorver e mapear toda a documentação de SDD (SDDs 01 a 05, Documentos de Negócio 01 a 03 e o Design System exato do `ROOMIE OFFICE AI` em `spec/DESIGN.md`) e estruturar o plano de execução (`TASKS.md`) e a memória persistente (`MEMORY.md`).
- [x] **TASK-0.2:** Inicializar o projeto **Next.js (App Router)** com **React 19**, **TypeScript 5+**, **Tailwind CSS v4**, `@base-ui/react` e `shadcn` (`style: "base-nova"`) na raiz do workspace, espelhando a configuração exata do `ROOMIE OFFICE AI`.
- [x] **TASK-0.3:** Copiar e configurar os componentes base de UI (`src/components/ui/*`: `button.tsx`, `dialog.tsx`, `input.tsx`, `password-input.tsx`, `popover.tsx`, `select.tsx`, `tabs.tsx`, `textarea.tsx`, `calendar.tsx`), `components.json` e `src/lib/utils.ts` idênticos ao `ROOMIE OFFICE AI`.
- [x] **TASK-0.4:** Configurar o **`src/app/globals.css` e `src/app/layout.tsx` idênticos ao `ROOMIE OFFICE AI`**:
  - Carregamento da fonte **Schibsted Grotesk** (`400`, `500`, `600`, `700`) em `--font-sans`.
  - Script de inicialização de tema (`localStorage.getItem('dash-theme')`, `data-theme="dark" | "light"` e classe `.dark`).
  - Tokens CSS exatos (`--color-brand-orange: #F0521F`, `--color-brand-orange-hover: #FF6A36`, `--color-brand-ink: #141414`, `--color-brand-paper: #F4F4F2`, `--bg`, `--fg`, `--fg2`, `--ds-muted`, `--surface`, `--ds-hover`, `--line`, `--line2`, `--hero`, `--hero-sub`).
  - Ilustrações SVG oficiais de traço `2px #141414` sobre Papel `#F4F4F2` e Laranja `#F0521F` (`src/components/layout/roomie-illustrations.tsx`) + barra inferior flutuante mobile (`64px`, `rounded-[22px]`, item ativo quadrado laranja `46px` `rounded-[15px]`).
- [x] **TASK-0.5:** Estruturar a arquitetura de diretórios do projeto:
  - `src/app/` (Rotas App Router: Dashboard Principal `/`, Studio `/studio`, Flow `/flow`, Pulse `/pulse`, Governança 6 Etapas `/governanca`, Rota Mobile `/executivo`, Login `/login` e Rotas de API `/api/...`).
  - `src/components/` (`ui/`, `layout/`).
  - `src/lib/` (`supabase/client.ts`, `coydash-store.tsx`, `utils.ts`).
  - `src/types/` (`coydash.ts` espelhando 100% do schema SQL do SDD 05 e SDD 04).
  - `supabase/migrations/` (`001_coydash_schema_and_rls.sql`).

---

## 🗄️ FASE 1: Banco de Dados (Supabase SQL), Memória Vetorial & Segurança RLS Multi-Tenant
**Objetivo:** Implementar integralmente a modelagem de dados relacional e vetorial especificada nos **SDD 04** e **SDD 05**, garantindo isolamento por cliente (`tenant_id` / `organization_id`) e trilha de auditoria imutável.

- [x] **TASK-1.1:** Criar migration SQL de extensões e tipos enumerados (`ENUMs`) em `supabase/migrations/001_coydash_schema_and_rls.sql`:
  - Extensões: `uuid-ossp`, `vector` (`pgvector`), `pg_cron`.
  - ENUMs: `company_tier` (`MID_MARKET`, `ENTERPRISE`), `lifecycle_stage` (6 etapas + `PASSIVE_RETENTION_PLAN`, `CHURNED_ARCHIVED`), `org_role` (`COYTECH_ADMIN`, `COYTECH_SRE`, `CLIENT_CEO_DIRECTOR`, `CLIENT_COO_MANAGER`, `CLIENT_CTO_IT`, `CLIENT_OPERATIONS`, `EXTERNAL_PARTNER`), `monitoring_layer` (4 camadas), `incident_priority` (`P1_CRITICAL_15MIN`, `P2_HIGH_30MIN`, `P3_NORMAL_SAMEDAY`), `incident_status`, `approval_status`, `agent_class` (5 classes de agentes).
- [x] **TASK-1.2:** Criar tabelas de **Clientes B2B (Tenants), RBAC e Governança (Ciclo de 6 Etapas)**:
  - `organizations` (dados da empresa, tier, etapa atual das 6 etapas, links Drive/WhatsApp, `litellm_virtual_key_id`, MRR, Setup Fee, datas de Kick-off, Go-Live e próxima QBR de 90 dias).
  - `organization_members` (vínculo `user_id`, `role`, telefone WhatsApp, flags `receive_monday_8am_report` e `receive_critical_bia_alerts`).
  - `offboarding_processes` (checklist de 15 dias: tentativa de retenção no plano passivo Dias 1-3, URLs de exportação Git/DB/n8n/Zabbix Dias 4-10, revogação LiteLLM/VPN/Vault Dias 11-15, termo assinado e follow-ups de 60 e 120 dias).
- [x] **TASK-1.3:** Criar tabelas do **Coytech Pulse (Matriz BIA & Monitoramento 4 Camadas)**:
  - `bia_critical_processes` (processo crítico, camada 1 a 4, `cost_per_hour_stopped`, coluna calculada `cost_per_minute_stopped`, `external_monitor_id`, `current_status`).
  - `pulse_incidents` (vínculo BIA, prioridade P1/P2/P3, flag `is_silent_business_drop` para *"TI verde com vendas caindo"*, contador `suppressed_duplicate_alerts_count` para comprovar redução >75% de ruído, campos de diagnóstico do Agente 05 SRE IA e cálculo de perda evitada).
- [x] **TASK-1.4:** Criar tabelas do **Coytech Studio (Filas SLA Ao Vivo, Políticas de Alçada e Auditoria)**:
  - `studio_approval_queues` (`queue_type`, `title`, `reference_code`, `amount_value`, `payload_summary` JSONB, `status`, `sla_due_at`, `decided_by`, `decided_at`).
  - `approval_policies` (limites determinísticos de alçada financeira por cargo e regras Human-in-the-Loop para os Agentes de IA - SDD 04).
  - `studio_audit_logs` (trilha imutável registrando `actor_user_id`, `action_type`, `entity_table`, `entity_id`, `ip_address`, `metadata` com `payload_before` e `payload_after`).
- [x] **TASK-1.5:** Criar tabelas do **Coytech Flow (Automações n8n, 5 Agentes de IA, Memória 4 Camadas & LTV)**:
  - `flow_automation_runs` (execuções n8n/Agentes, status incluindo `CONTINGENCY_QUEUED`, `manual_minutes_saved`, `financial_value_processed`, `tokens_consumed`).
  - `agent_sessions` (Camada 1 de Memória Operacional de Sessão em JSONB - SDD 04).
  - `knowledge_and_runbooks` (Camada 3 de Memória Semântica Vetorial `vector(1536)` categorizada em `COMPANY_SOP`, `COMMERCIAL_POLICY`, `SRE_RUNBOOK`, `ERP_API_DOC`).
  - `customer_health_scores` (Camada 4 / métricas de uso ativo, risco de churn e oportunidades de upsell trimestral - SDD 04).
  - `ltv_weekly_reports` (histórico consolidado do Relatório Executivo de Segunda-Feira às 08h00).
- [x] **TASK-1.6:** Implementar **Row Level Security (RLS Multi-Tenant)**:
  - Função `public.has_org_access(target_org_id UUID)` liberando acesso aos membros da organização ou aos papéis globais `COYTECH_ADMIN` e `COYTECH_SRE`.
  - Políticas RLS aplicadas em todas as tabelas operacionais.
- [x] **TASK-1.7:** Criar pacote de **Seeds e Dados Realistas de Demonstração** (`src/lib/coydash-store.tsx` cobrindo empresas Mid-Market e Enterprise em diferentes etapas das 6 etapas, com as personas Rodrigo CEO, Camila COO, Eduardo CTO, Lucas SRE e Rafael Engenheiro Líder Coytech) + Camada de Serviço Híbrida (`src/lib/supabase/client.ts`).

---

## 🔐 FASE 2: Autenticação, RBAC Multi-Tenant, App Shell & Simulador de Personas
**Objetivo:** Construir a estrutura de navegação principal do **CoyDash**, permitindo tanto o uso real em produção por múltiplos clientes quanto a demonstração fluida nas **Apresentações da Semana 1 e Semana 3** para cada membro do Comitê de Decisão B2B.

- [x] **TASK-2.1:** Configurar cliente Supabase (`src/lib/supabase/client.ts`) e página de Login (`src/app/login/page.tsx`) em 2 colunas com os cards ilustrados rotacionados (`-6deg`, `3deg`, `9deg`) do Design System do `ROOMIE OFFICE AI` e seleção de persona B2B.
- [x] **TASK-2.2:** Criar o **Contexto Global Multi-Tenant e RBAC (`CoyDashProvider` em `src/lib/coydash-store.tsx`)**:
  - Seletor de Cliente B2B ativo (*Tenant Switcher* na sidebar para alternar entre Grupo Varejo Prime S.A., LogiBrasil Transportes e Indústria MetalSul).
  - **Seletor/Simulador Rápido de Persona (Role View Switcher no Header):** Permite visualizar o sistema instantaneamente sob a ótica de:
    1. **Rodrigo (CEO / Fundador)** — Foco em ROI, BIA R$/min, Painel Executivo Mobile e Aprovações de Alçada;
    2. **Camila (COO / Diretora de Operações)** — Foco em Filas 1-Clique, SLA ao vivo, Conciliação e Fim de Planilhas;
    3. **Eduardo (CTO / Head de TI)** — Foco em Observabilidade 4 Camadas, Redução de >75% de Ruído, Governança LiteLLM e Offboarding;
    4. **Lucas (Engenheiro DevOps / SRE)** — Foco em Painel NOC, Zabbix/Grafana/Datadog, Sonda SEFAZ e Agente Investigativo SRE;
    5. **Rafael (Engenheiro Líder Coytech)** — Foco no Console de Entrega da Sprint de 30 Dias (6 Etapas), Validador de Credenciais e Expansão LTV.
- [x] **TASK-2.3:** Construir o **App Shell Principal do CoyDash (`src/components/layout/coydash-shell.tsx`)**:
  - Sidebar `220px` fiel ao `ROOMIE OFFICE AI` com Card NPC Plus no rodapé (`#F0521F`), Drawer lateral de conversa com agente (`380px`) e Barra Inferior Flutuante Mobile (`64px`, `rounded-[22px]`).
  - Header global com: Busca global, Selo de Presença em pílula (`5 agentes ativos | 4 camadas online`), Alerta de Incidentes Críticos P1, Alternador de Persona e Botão circular `38px` de tema Claro/Escuro.
- [x] **TASK-2.4:** Construir a **Visão Geral Executiva do Ecossistema (Home Dashboard `/` em `src/app/page.tsx`)**:
  - Bloco de destaque `--hero` (`270px`, `rounded-l-[18px]`) com os 3 cards ilustrados (**01 Coytech Studio**, **02 Coytech Flow**, **03 Coytech Pulse**) e grade inferior `1fr / 330px` com os 5 Agentes de IA, Fila de Aprovação em 1 Clique e Rotina/Governança.

---

## 🚀 FASE 3: Módulo de Governança do Ciclo de Vida — As 6 Etapas Operacionais (`RF-GOV-001`, `RF-GOV-002`, `RF-FLO-001`, `RF-FLO-002`)
**Objetivo:** Construir o Console de Entrega e Governança que garante a implantação sem bloqueios na **Sprint de 30 Dias**, a retenção recorrente (LTV) e o Offboarding seguro em 15 dias (US-COY-01, US-COY-02, US-COY-04, US-COY-10).

- [x] **TASK-3.1:** Criar o **Painel da Jornada Operacional de 6 Etapas** (`src/app/governanca/page.tsx`):
  - Linha do tempo interativa das 6 etapas (1. Onboarding Dias 0-3, 2. Planejamento BIA Semana 1, 3. Apresentações Semanas 1 e 3, 4. Entrega/Go-Live Semana 4, 5. LTV Mês 2+, 6. Offboarding 15 dias).
- [x] **TASK-3.2:** Implementar a **Etapa 1 — Automação de Onboarding em 5 Minutos & Validador Pré-Kickoff (`US-COY-01`)**:
  - Endpoint `POST /api/webhooks/onboarding-contract` (`src/app/api/webhooks/onboarding-contract/route.ts`).
  - **Painel Validador Pré-Kickoff de Credenciais e APIs (`RF-FLO-002`):** Teste em 1 clique da conectividade ERP TOTVS, Gateway Pagar.me/Pix, WhatsApp Cloud API, Túnel VPN Zabbix e Certificados A1 SEFAZ.
- [x] **TASK-3.3:** Implementar a **Etapa 2 & 3 — Gestão da Sprint de 30 Dias, Regra 80/20 e Roteiro de Apresentação (`RF-GOV-001`)**:
  - Quadro de divisão de escopo **Regra 80/20** + Roteiro interativo de Apresentação Guiada em 4 Passos (Semana 1 e Semana 3).
- [x] **TASK-3.4:** Implementar a **Etapa 4 — Virada Segura de Go-Live (Sequência A -> B -> C) & Treinamento (`US-COY-04`)**:
  - Painel de controle de Go-Live com trava sequencial obrigatória: **Passo A (Coytech Pulse)** -> **Passo B (Studio + Flow)** -> **Passo C (Congelar Planilhas Legadas em Somente Leitura + Vídeos de 3 min)**.
- [x] **TASK-3.5:** Implementar a **Etapa 6 — Automação de Offboarding Seguro e Retenção em 15 Dias (`RF-GOV-002`, `US-COY-10`)**:
  - Endpoint `POST /api/offboarding/[orgId]/execute-step` (`src/app/api/offboarding/[orgId]/execute-step/route.ts`) e painel de 4 fases (Retenção Passiva Dias 1-3, Pacote de Soberania Git/DB/n8n/Zabbix Dias 4-10, Kill-Switch LiteLLM/LGPD Dias 11-15 e Termo Final + Follow-ups 60/120 dias).

---

## ⚡ FASE 4: Módulo Coytech Studio — Portais Operacionais, Filas SLA Ao Vivo & Aprovação em 1 Clique (`RF-STU-001` a `004`)
**Objetivo:** Substituir planilhas paralelas e aprovações perdidas no WhatsApp por filas operacionais em tempo real com execução abaixo de 3 segundos e auditoria total (`US-COY-03`, `US-COY-04`).

- [x] **TASK-4.1:** Construir a **Central de Filas Operacionais com SLA Ao Vivo** (`src/app/studio/page.tsx`):
  - Visualização em tempo real ordenada por SLA, com categorias de Pedido de Compra, Liberação Financeira, Exceção de Desconto (Agente 02) e Cadastro/KYC.
- [x] **TASK-4.2:** Implementar o **Motor de Aprovação em 1 Clique (< 3 Segundos — `RNF-003`)**:
  - Endpoint `POST /api/studio/queues/[id]/one-click-approve` (`src/app/api/studio/queues/[id]/one-click-approve/route.ts`) + medição de latência em milissegundos e validação RBAC.
- [x] **TASK-4.3:** Construir o **Explorador da Trilha de Auditoria Imutável (`RF-STU-003`)** na aba de Auditoria de `/studio` com inspeção de payload `before/after` e IP.
- [x] **TASK-4.4:** Construir a **Ferramenta de Substituição e Congelamento de Planilhas Legadas (`RF-STU-004`)** na aba de Planilhas Legadas de `/studio` (migração e bloqueio em Somente Leitura via Drive API).

---

## 🛡️ FASE 5: Módulo Coytech Pulse — Monitoramento 4 Camadas, Motor BIA & Painel NOC/TI (`RF-PUL-001` a `004`)
**Objetivo:** Blindar a operação 24/7, eliminar >75% dos alarmes falsos, vigiar dependências externas brasileiras (SEFAZ/Pix/Bancos) e traduzir qualquer falha técnica ou queda silenciosa de conversão em impacto financeiro por minuto (`US-COY-02`, `US-COY-07`, `US-COY-08`).

- [x] **TASK-5.1:** Construir o **Catálogo e Configurador da Matriz BIA (`RF-PUL-002`, `US-COY-02`)** em `src/app/pulse/page.tsx` com adição ao vivo de novos processos críticos e cálculo automático de R$/hora e R$/minuto.
- [x] **TASK-5.2:** Construir o **Painel Técnico NOC/TI em 4 Camadas (`RF-PUL-001`, `RF-PUL-004`)** em `src/app/pulse/page.tsx` (Camada 1 Zabbix 7.0 LTS, Camada 2 APM Datadog/n8n, Camada 3 Testes Sintéticos Playwright 2m, Camada 4 Sonda SEFAZ/Pix/Gateways 60s).
- [x] **TASK-5.3:** Implementar o **Motor de Correlação de Alertas, Redução de Ruído (>75%) e Detecção de "TI Verde com Vendas Caindo"** (`src/app/api/webhooks/pulse-alert/route.ts` + simulador interativo em `/pulse`).
- [x] **TASK-5.4:** Construir a **Central de Incidentes e Resposta Rápida (SLA 15 min P1 / 30 min P2 SEFAZ)** com diagnóstico de causa raiz do Agente 05 SRE (< 60s) e contabilização de Receita Protegida ao mitigar incidentes.

---

## 📱 FASE 6: Painel Executivo Mobile (PWA CEO/COO — `/executivo`) (`RF-PUL-004`, `US-COY-07`)
**Objetivo:** Entregar a visão limpa, rápida e focada em dinheiro no celular do CEO (Rodrigo) e da COO (Camila), conectada à mesma fonte de verdade do Painel Técnico NOC.

- [x] **TASK-6.1:** Criar a rota dedicada Mobile-First **`/executivo`** (`src/app/executivo/page.tsx` + `public/manifest.json`) com moldura mobile `390×844` fiel ao Design System do `ROOMIE OFFICE AI`, Faturamento/Hora ao vivo, Receita Protegida, Semáforo de Negócio com perda BIA R$/min, Aprovação Expressa em 1 Clique e Resumo de Segunda-Feira às 08h00.

---

## 🤖 FASE 7: Módulo Coytech Flow — Automações n8n, Os 5 Agentes de IA, Memória 4 Camadas & Governança LiteLLM (`RF-FLO-003` a `005`, `SDD 04`)
**Objetivo:** Orquestrar as automações críticas de backoffice, operar os 5 Agentes de IA com memória corporativa em 4 camadas (`pgvector`), garantir controle absoluto de custos/LGPD via **LiteLLM** e automatizar o **Relatório de Segunda-Feira às 08h00** (`US-COY-05`, `US-COY-06`, `US-COY-09`).

- [x] **TASK-7.1:** Construir o **Painel de Automações Críticas de Backoffice (n8n Queue Mode)** em `src/app/flow/page.tsx` com simulador de Contingência Fiscal SEFAZ (`SVC-AN`, SLA 30 min) e Conciliação Financeira Automática.
- [x] **TASK-7.2:** Construir o **Centro de Comando das 5 Classes de Agentes de IA (`RF-FLO-005`, `SDD 04`)** em `src/app/flow/page.tsx` + Drawer interativo de conversa e disparo de exceção de desconto do Agente 02 para a fila 1-Clique do Studio.
- [x] **TASK-7.3:** Construir o **Gerenciador da Arquitetura de Memória em 4 Camadas (`SDD 04`)** em `src/app/flow/page.tsx` com busca e indexação de novos documentos e runbooks no `pgvector`.
- [x] **TASK-7.4:** Construir o **Gateway de Governança de IA — LiteLLM Control Center (`RNF-005`, `US-COY-06`)** com monitoramento de `virtual_key`, orçamento mensal, Guardrail LGPD e roteamento Haiku/Sonnet + fallback Bedrock.
- [x] **TASK-7.5:** Implementar o **Motor e Pré-Visualizador do Relatório Executivo de Segunda-Feira às 08h00 (`RF-FLO-004`, `US-COY-09`)** (`src/app/api/cron/monday-8am-report/route.ts` + aba em `/flow`).

---

## ✅ FASE 8: Validação Gherkin (US-COY-01 a 10), Testes de Performance & Acabamento Final
**Objetivo:** Garantir que todos os critérios de aceite especificados no `SDD 02` e todos os SLAs do `SDD 01` funcionem de ponta a ponta sem erros de compilação ou quebras de layout.

- [x] **TASK-8.1:** Validar os fluxos interativos ponta a ponta das **10 Histórias de Usuário (`US-COY-01` a `US-COY-10`)**.
- [x] **TASK-8.2:** Verificar tipagem TypeScript (`npx tsc --noEmit` — 0 erros) e build de produção do Next.js (`npm run build`).
- [x] **TASK-8.3:** Revisar responsividade em 3 formatos críticos (Mobile `390×844` `/executivo`, Desktop `1440×900` e Widescreen NOC `/pulse`).
- [x] **TASK-8.4:** Atualizar `MEMORY.md` e `TASKS.md` com o fechamento de 100% da entrega.

---

## 🔗 FASE 9: Integração Real com Supabase, Cadastro (`/cadastro`) & Telas 100% Limpas e Funcionais
**Objetivo:** Conectar o **CoyDash** ao projeto real no Supabase (`cbhunupletswkjozcjze`), criar a tela de Cadastro (`/cadastro`) fiel ao `ROOMIE OFFICE AI`, proteger todas as rotas com Middleware SSR, remover todos os dados fictícios pré-populados (estado inicial limpo) e persistir todas as ações das telas no PostgreSQL 16.

- [x] **TASK-9.1:** Configurar variáveis de ambiente seguras em `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD`, `NEXT_PUBLIC_SITE_URL`) e blindar `.gitignore`.
- [x] **TASK-9.2:** Criar camada completa de clientes Supabase SSR e Admin (`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`, `src/lib/supabase/middleware.ts`, `src/middleware.ts`) e rota OAuth Callback (`src/app/auth/callback/route.ts`).
- [x] **TASK-9.3:** Implementar Server Actions reais (`src/app/actions/auth.ts`: `login`, `signup` com provisionamento automático de `organizations` e `organization_members` limpos, `signOutAction`, `resetPassword`, `updatePassword`).
- [x] **TASK-9.4:** Criar a tela de **Cadastro (`/cadastro` em `src/app/cadastro/page.tsx`)**, atualizar **Login (`/login` em `src/app/login/page.tsx`)** sem chips fictícios e criar **Recuperar/Atualizar Senha (`/recuperar-senha`, `/atualizar-senha`)**, mantendo 100% do Design System do `ROOMIE OFFICE AI`.
- [x] **TASK-9.5:** Criar API unificada de sincronização e mutação com o banco (`src/app/api/coydash/sync/route.ts`) e refatorar `src/lib/coydash-store.tsx` para iniciar **100% limpo** (sem seeds fictícios) e gravar todas as operações das 7 telas no Supabase.
- [x] **TASK-9.6:** Atualizar todas as telas (`/`, `/studio`, `/flow`, `/pulse`, `/governanca`, `/executivo` e `coydash-shell.tsx`) com estados vazios limpos, formulários/modais reais de criação e persistência completa.

---

## 🚀 FASE 10: Central de Clientes 360º, Sistema de Setores & Tarefas (`ROOMIE OFFICE AI`) e Módulos Operacionais (`Rangolivre`)

- [x] **TASK-10.1:** Criar e aplicar a migration `supabase/migrations/002_coydash_clients_tasks_and_modules.sql` no Supabase (`cbhunupletswkjozcjze`) com 12 novas tabelas (`clients`, `client_history_events`, `client_team_notes`, `task_folders`, `task_lists`, `task_statuses`, `tasks`, `whatsapp_conversations`, `paid_traffic_campaigns`, `marketing_blasts`, `financial_entries`, `organization_settings`) e RLS.
- [x] **TASK-10.2:** Simplificar a navegação da Sidebar (`src/components/layout/coydash-shell.tsx`) para linguagem direta (`Início`, `Clientes`, `Atendimento`, `Tarefas`, `Agentes IA`, `Marketing`, `Tráfego Pago`, `Financeiro`, `Configurações`) e adicionar a árvore expansível **"SETORES & PROJETOS"** idêntica ao `ROOMIE OFFICE AI`.
- [x] **TASK-10.3:** Implementar a **Central de Clientes 360º (`/clientes` em `src/app/clientes/page.tsx`)** fiel às imagens de referência (Quadro de 3 colunas `• ONBOARDING`, `• ATIVO`, `• AVISO DE CHURN`, cards com 6 ícones de conexão na base e Ficha 360º com 12 abas horizontais e visão dividida `Histórico` + `Anotações do time`).
- [x] **TASK-10.4:** Implementar o sistema de **Tarefas & Setores (`/tarefas` e `/listas/[listId]`)** em `src/components/tasks/tasks-workspace-view.tsx` com Kanban Drag-and-Drop (`@hello-pangea/dnd`), alternador Kanban/Lista, modal de gerenciar colunas de status e modal de tarefa com checklist de subtarefas e comentários.
- [x] **TASK-10.5:** Implementar os 5 módulos operacionais inspirados no `Rangolivre` com 100% do Design System do `ROOMIE OFFICE AI`: **Atendimento WhatsApp (`/atendimento`)**, **Tráfego Pago (`/trafego-pago`)**, **Marketing (`/marketing`)**, **Financeiro (`/financeiro`)** e **Configurações (`/configuracoes`)**, além da página de **Agentes IA (`/agentes`)**.
- [x] **TASK-10.6:** Atualizar o Store Reativo (`src/lib/coydash-store.tsx`), a API de sincronização (`src/app/api/coydash/sync/route.ts`) e a Home (`src/app/page.tsx`) e validar todas as rotas em `http://localhost:3005`.

---

## 🚀 FASE 11 — Atendimento WhatsApp Formato Mobile, Integração Real Z-API + n8n, Sincronização CRM (`leads` + `n8n_chat_histories`) e Criador de Agentes IA

**Referências Técnicas:**  
* [spec/coytech_sdd_06_whatsapp_n8n_agent_architecture.md](./spec/coytech_sdd_06_whatsapp_n8n_agent_architecture.md)  
* [spec/coytech_sdd_07_atendimento_mobile_chat_crm_and_agent_builder.md](./spec/coytech_sdd_07_atendimento_mobile_chat_crm_and_agent_builder.md)  
* [spec/DESIGN.md](./spec/DESIGN.md)

### 11.1. Banco de Dados e Migração SQL (`003_coydash_whatsapp_n8n_crm_sync.sql`)
- [x] **TASK-11.1 — Criar e aplicar a Migration `003` no Supabase (`cbhunupletswkjozcjze`):**
  - Criar a tabela `public.leads` com as colunas exatas exigidas pelo fluxo n8n (`id`, `created_at`, `lead_nome`, `lead_id` como `TEXT UNIQUE`) acrescidas dos metadados do CoyDash (`organization_id`, `human_takeover`, `orders_count`, `total_spent`, `cashback_balance`, `crm_status`, `client_id`).
  - Criar/ajustar a tabela `public.n8n_chat_histories` com `id`, `session_id` (cruzando com `leads.lead_id`), `message` (`JSONB` no padrão LangChain/n8n `{"type": "human"|"ai"|"operator", "data": {"content": "..."}}`) e a coluna obrigatória `hora_data_mensagem TIMESTAMPTZ NOT NULL DEFAULT now()`.
  - Criar a tabela `public.client_ai_memories` (`id`, `organization_id`, `lead_id`, `memory_text`, `embedding vector(1536)`, `created_at`) para persistir os itens de *"Memória da IA (pgvector)"* exibidos na coluna direita da tela de Atendimento.
  - Habilitar `supabase_realtime` para `leads`, `n8n_chat_histories` e `client_ai_memories` e configurar políticas RLS compatíveis com `service_role` (para o n8n) e `authenticated` (para o painel CoyDash).

### 11.2. Rotas de API de Integração WhatsApp, Z-API e n8n
- [x] **TASK-11.2 — Implementar Route Handlers de Mensageria e Transbordo (`/api/whatsapp/*` e `/api/agents/export-n8n`):**
  - Criar `src/app/api/whatsapp/conversations/route.ts` (`GET`, `POST`, `DELETE`): busca os leads de `public.leads`, cruza com a última mensagem de `public.n8n_chat_histories` (`lead_id = session_id`) e memórias de `public.client_ai_memories`, e permite iniciar ou excluir uma conversa.
  - Criar `src/app/api/whatsapp/messages/route.ts` (`GET`): retorna todas as mensagens de `public.n8n_chat_histories` de um `session_id` ordenadas por `hora_data_mensagem ASC`.
  - Criar `src/app/api/whatsapp/send/route.ts` (`POST`): permite enviar mensagem como **Atendente Humano** (`Responder como atendente...`) ou disparar o botão **`Simular Áudio Cliente`**, grava em `public.n8n_chat_histories` com `hora_data_mensagem = now()` e dispara `POST /send-text` na Z-API quando configurada.
  - Criar `src/app/api/whatsapp/takeover/route.ts` (`PATCH`): alterna o estado do estado do botão **`Assumir conversa`** (`human_takeover = true/false`), atualiza estágio CRM ou adiciona memória em `client_ai_memories`.
  - Criar `src/app/api/agents/export-n8n/route.ts` (`POST`): gera o JSON completo dos 8 nodes do workflow do n8n parametrizado.

### 11.3. Refatoração da Tela `/atendimento` (Chat Mobile Estilo WhatsApp + Realtime + CRM Lateral)
- [x] **TASK-11.3 — Implementar o Viewport de Chat Mobile Estilo WhatsApp no Painel Central de `/atendimento` (`src/app/atendimento/page.tsx`):**
  - Preservar a estrutura de 3 colunas (Coluna 1: Inbox `280px` com busca e filtro `Todas | Com IA | Com Humano`; Coluna 2: Painel central com viewport Mobile `412px` e toggle para modo expandido; Coluna 3: Painel direito `310px` de Cliente + CRM + `pgvector`).
  - Agrupamento por datas estilo WhatsApp (`Hoje`, `Ontem` ou `DD/MM/AAAA`), ordem cronológica com mensagens mais recentes embaixo e auto-scroll automático.
  - Balões do Lead (`type: "human"`) à esquerda com horário `HH:mm` e balões da IA/Atendente (`type: "ai"` / `"operator"`) à direita com indicador `IA` ou `Atendente`, horário `HH:mm` e ícone SVG de duplo check (`✓✓`).
  - Conectar **Supabase Realtime** (`postgres_changes` em `n8n_chat_histories`, `leads` e `client_ai_memories`).
- [x] **TASK-11.4 — Conectar Ações do Cabeçalho e Painel Direito (`Cliente` + `pgvector`) em `/atendimento`:**
  - Conectar botões **`Simular Áudio Cliente`** e **`Assumir conversa` / `Devolver para IA`** (`human_takeover`), além dos contadores (`pedidos`, `gasto`, `cashback`) e lista de `Memória da IA (pgvector)` às tabelas `public.leads` e `public.client_ai_memories`.

### 11.4. Sincronização Automática com o CRM (`/clientes`)
- [x] **TASK-11.5 — Integrar Leads do WhatsApp (`public.leads`) com a Central de Clientes 360º (`src/app/clientes/page.tsx`):**
  - Exibir na coluna direita de `/atendimento` o seletor rápido de estágio no CRM (`Onboarding`, `Ativo`, `Aviso de Churn`) e o botão **"Abrir Ficha 360º"**.
  - Garantir que os contatos de `public.leads` apareçam sincronizados em `/clientes`, acendendo os indicadores `WhatsApp` e `IA` em verde (`#2F9E5A`) e exibindo o histórico de `n8n_chat_histories` na aba **Comunicação** da Ficha 360º.

### 11.5. Criador de Agentes IA, Guia Passo a Passo n8n e Exportador de Workflow (`/agentes` e `/configuracoes`)
- [x] **TASK-11.6 — Construir o Construtor de Agentes em 4 Abas e Gerador de Template JSON n8n em `/agentes` (`src/app/agentes/page.tsx`):**
  - Aba 1: Identidade, Modelo LLM (`OpenAI`, `Gemini`, `Groq`), `System Message` com 3 templates comerciais prontos e toggles de comportamento.
  - Aba 2: Conexão WhatsApp (Z-API `API da Instância`, `Client-Token`, `URL do Webhook n8n`) + teste de conexão e modal QR Code.
  - Aba 3: Diagnóstico de Banco de Dados (`leads`, `n8n_chat_histories`, `client_ai_memories`) + botão **"Copiar Parâmetros do Pooler (Porta 6543)"** + Guia Passo a Passo do n8n.
  - Aba 4: Gerador de Workflow `.json` dos 8 nodes do n8n (**"Baixar Fluxo Pronto para n8n (.json)"** e **"Copiar JSON para Colar no n8n (`Ctrl+V`)"**).

### 11.6. Validação de Qualidade, Tipagem e Memória Persistente
- [x] **TASK-11.7 — Verificação de Design System, TypeScript e Build:**
  - Auditar `/atendimento`, `/agentes` e `/clientes` contra `spec/DESIGN.md` (zero emojis na UI, 100% Português, acento único `#F0521F`, fontes >= `10.5px`).
  - Executar `npx tsc --noEmit` (0 erros) e `npm run build`.
- [x] **TASK-11.8 — Atualizar `MEMORY.md` (Seções 2 e 5):**
  - Marcar `[x]` nas tasks da Fase 11 em `TASKS.md` e registrar o changelog completo no `MEMORY.md`.

---

## 🚀 FASE 12 — Atendimento Duplo (Clientes vs. Comercial SDR) e Integração Real n8n Externa
**Objetivo:** Segregar o atendimento em 2 frentes distintas (**Atendimento a Clientes Contratados** e **Atendimento Comercial / SDR com Agendamento de Reuniões**), simplificar a tela `/agentes` para monitoramento e entregar os fluxos `.json` e guia prático para rodar no n8n.

- [x] **TASK-12.1 — Schema SQL & Modelagem Comercial em `public.leads`:**
  - Criar e aplicar migration `004_coydash_leads_commercial_and_meetings.sql` com `inbox_type`, `commercial_stage`, `meeting_scheduled_at`, `meeting_link` e `qualification_score`.
- [x] **TASK-12.2 — Rotas de API Atualizadas (`/api/whatsapp/conversations` e `/api/whatsapp/takeover`):**
  - Suporte ao filtro `inboxType=CLIENT` e `inboxType=COMMERCIAL`, ações `UPDATE_COMMERCIAL_DETAILS` e `CONVERT_LEAD_TO_CLIENT` (1 clique para criar cliente no status `ONBOARDING` em `public.clients`).
  - Seed demo aprimorado com dados realistas para ambas as caixas.
- [x] **TASK-12.3 — Tela `/atendimento` com Seletor Duplo e Painel de Oportunidades:**
  - Alternador de topo em pílulas com contadores ao vivo (`🏢 Atendimento a Clientes` vs `💼 Atendimento Comercial & SDR`).
  - Painel Comercial com estágio da oportunidade, agendamento de reunião executiva, link do Google Meet e botão primário em destaque **"Converter Lead em Cliente (Onboarding)"**.
- [x] **TASK-12.4 — Limpeza da Tela `/agentes` e Entrega dos Fluxos `.json` n8n:**
  - Remoção do construtor de nós complexo da tela; criação dos arquivos `n8n-workflows/agente-comercial-sdr-agendamento.json`, `n8n-workflows/agente-suporte-clientes.json` e `n8n-workflows/GUIA-INSTALACAO-E-CONFIGURACAO.md`.
  - Botões para baixar fluxos `.json`, copiar webhooks e copiar dados do Supabase Transaction Pooler (porta 6543).
- [x] **TASK-12.5 — Validação de TypeScript e Servidor Local:**
  - Execução de `npx tsc --noEmit` (0 erros) e verificação das rotas `/atendimento` e `/agentes` (HTTP 200).

---

## 🚀 FASE 13 — Engenharia Reversa do Twenty CRM: Pipelines Multi-Funil, Contatos 1:N, Data Grid com Visões Salvas, Timeline Unificada e Servidor MCP
**Documento de Especificação Técnica:** [`spec/coytech_sdd_08_crm_twenty_reverse_engineering.md`](./spec/coytech_sdd_08_crm_twenty_reverse_engineering.md)  
**Tese:** Recriar os superpoderes do Twenty CRM de forma 100% nativa na stack do CoyDash (Next.js 16 + React 19 + Tailwind CSS v4 + Supabase + Design System Roomie Office AI), preservando 100% de todas as funcionalidades e telas existentes sem nenhuma exclusão.

### 13.1. Modelagem de Dados & Migration SQL
- [x] **TASK-13.1 — Migration `008_coydash_crm_twenty_reverse_engineering.sql`:**
  - Aplicar as tabelas `public.pipelines`, `public.pipeline_stages`, `public.deals`, `public.client_contacts`, `public.activity_timeline` e `public.workspace_saved_views`.
  - Expandir o `CHECK (scope IN ('task', 'list', 'template', 'client', 'deal'))` em `custom_field_definitions`.
  - Ativar RLS Multi-Tenant por organização e publicação no `supabase_realtime` para sincronização instantânea em rede.

### 13.2. Tipagens TypeScript Unificadas (`src/types/coydash.ts`)
- [x] **TASK-13.2 — Declarar Tipos e Interfaces do CoyCRM:**
  - Tipos: `PipelineItem`, `PipelineStageItem`, `DealItem`, `ClientContactItem`, `ActivityTimelineItem`, `WorkspaceSavedViewItem`.
  - Atualizar `CustomFieldDefinition` para suportar os novos escopos `client` e `deal`.
  - Manter compatibilidade reversa total com todos os tipos existentes de Clientes, Tarefas e Módulos.

### 13.3. Store Reativo & API de Sincronização (`coydash-store.tsx` e `/api/coydash/sync`)
- [x] **TASK-13.3 — Atualizar `coydash-store.tsx` e Route Handlers de Sincronização:**
  - Adicionar estados: `pipelines`, `pipelineStages`, `deals`, `clientContacts`, `timelineActivities`, `savedViews`.
  - Ações no store: `addPipeline`, `addDeal`, `updateDealStage`, `convertDealToClient`, `addClientContact`, `deleteClientContact`, `logTimelineActivity`, `saveTableViewConfig`.
  - Atualizar `src/app/api/coydash/sync/route.ts` para carregar e salvar as novas entidades no Supabase mantendo o isolamento multi-tenant (`organization_id`).

### 13.4. Nova Tela: Comercial & Funil de Oportunidades (`/comercial`)
- [x] **TASK-13.4 — Construir a Tela de Gestão de Vendas (`src/app/comercial/page.tsx`):**
  - **Seletor de Pipelines Multi-Funil:** Alternar fluidamente entre funis (ex: "Novos Clientes Coytech", "Expansão & Upsell", "Parcerias Estratégicas").
  - **Métricas no Topo (KPIs):** Pipeline Total em MRR, Total em Setup Fee, Forecast Ponderado por probabilidade dos estágios e taxa média de conversão.
  - **Quadro Kanban Drag-and-Drop:** Estágios customizados com cor, probabilidade e soma de valores monetários no topo de cada coluna usando `@hello-pangea/dnd`.
  - **Cards de Oportunidade:** Exibem título do negócio, cliente vinculado, valor MRR e Setup, responsável com avatar, prioridade e data limite prevista.
  - **Ação 1-Clique de Sucesso:** Botão no card ou modal de deal ganho para **"Converter em Cliente 360º"**, provisionando o cliente em `public.clients`, cadastrando o contato principal e abrindo automaticamente o processo de onboarding.

### 13.5. Aprimoramento da Central de Clientes 360º (`/clientes`)
- [x] **TASK-13.5 — Enriquecer o Drawer e a Listagem de Clientes:**
  - **Nova Aba "Contatos (Pessoas)":** Lista 1:N de contatos daquela empresa com cargo, e-mail, telefone, selo de tomador de decisão e botão para abrir conversa direta no WhatsApp.
  - **Nova Aba "Oportunidades":** Histórico de propostas e negócios em andamento ou ganhos vinculados àquela conta.
  - **Aba "Histórico" Atualizada com a Timeline Unificada:** Visualização rica de atividades cronológicas (mudanças de status, anotações de equipe, reuniões e propostas geradas).
  - Preservar integralmente todas as outras 12 abas existentes (Metodologia 7 Etapas, Tráfego, Demandas, Agenda, Comunicação, Resultado, CS, Perfil Comercial, Briefing, Backups, Informações, Configuração).

### 13.6. Componente Reutilizável de Tabela Avançada (`CoyDataGrid`) e Visões Salvas
- [x] **TASK-13.6 — Implementar o Motor de Grid Estilo Twenty CRM:**
  - Componente com seleção de colunas visíveis (Show/Hide), ordenação por múltiplas colunas e filtros dinâmicos por campo e operador.
  - Seletor de **Visões Salvas ("Saved Views")** persistidas no banco (`workspace_saved_views`), permitindo criar visões compartilhadas com o time ou privadas para o operador.
  - Exportação direta para CSV com 1 clique e integração no modo Tabela de `/comercial` (`src/components/crm/coy-data-grid.tsx`).

### 13.7. Servidor MCP Nativo para Agentes de IA (`/api/mcp`) & Governança de Tokens
- [x] **TASK-13.7 — Implementar o Route Handler do Model Context Protocol e Governança de Tokens:**
  - Criar `supabase/migrations/009_coydash_universal_mcp_and_api_tokens.sql` com tabelas `mcp_api_tokens` (hash SHA-256) e `mcp_audit_logs` (auditoria imutável) e aplicar no Supabase PostgreSQL.
  - Implementar validador de autenticação Bearer token, hash SHA-256 e RBAC granular (`src/lib/mcp-auth.ts`).
  - Implementar Route Handler oficial MCP JSON-RPC 2.0 (`src/app/api/mcp/route.ts`) com 16 ferramentas em Atendimento, Comercial, Tarefas, Clientes 360º e Agentes com trava anti-destruição.
  - Criar API de Tokens (`src/app/api/mcp/tokens/route.ts`) e componente de UI de Governança de Chaves de IA (`src/components/colaboradores/mcp-tokens-tab.tsx`) integrado na tela `/colaboradores`.
  - Validar com testes end-to-end automatizados (`scripts/test-mcp.mjs`).

### 13.8. Shell, Menu de Navegação e Validação Rigorosa
- [x] **TASK-13.8 — Adicionar o Módulo no Shell e Validar Build:**
  - Incluir item **"Comercial & Vendas"** (`/comercial`) no menu principal da Sidebar (`src/components/layout/coydash-shell.tsx`) com ícone `Briefcase`, contador dinâmico de oportunidades (`deals.length`) e indicador de notificação na sidebar minimizada.
  - Atualizar controle granular de telas do sistema (`SYSTEM_SCREENS`) e presets de cargos do setor Comercial & Vendas em `src/app/colaboradores/page.tsx` para suporte automático de permissões.
  - Executar verificação estrita de TypeScript (`npx tsc --noEmit` — 0 erros com código de saída 0).
  - Executar build de produção do Next.js Turbopack (`npm run build` — 34/34 rotas compiladas com sucesso).
  - Validar fidelidade estética absoluta ao Design System Roomie Office AI (`spec/DESIGN.md`).



---

## ⚡ FASE 15 — Sistema de Tarefas Estilo ClickUp, Campos Personalizados, Modo Eu ("Me Mode"), Auto-atribuição e Pop-up Amplo de Tarefas (88vw / 75% Detalhes)
**Tese:** Transformar o ecossistema de gestão de tarefas do CoyDash em uma experiência de padrão mundial idêntica ao ClickUp, com auto-atribuição imediata de criadores, campos personalizados com modelos reutilizáveis, filtro "Modo Eu" ativado por padrão e pop-up em 3 colunas com espaço confortável e sem sobreposições.

- [x] **TASK-15.1 — Pop-up Amplo em 3 Colunas (`TaskDialog` a 88vw):**
  - Expansão da largura global de `70vw` para `88vw` (`max-w-[1600px]`, `h-[92vh] max-h-[960px]`).
  - Coluna de Detalhes ocupando ~75% (`flex-1 min-w-0 px-8 py-6`), barra divisória fina de 44px com contadores de links/conexões e chat de comentários de 300px (~22%).
  - Remoção de botão `X` duplicado com `showCloseButton={false}` e correção de hydration mismatch via `suppressHydrationWarning`.
- [x] **TASK-15.2 — Sistema de Campos Personalizados (`task-custom-fields.tsx`):**
  - Implementação de 9 tipos de campos, biblioteca de modelos com 1 clique e 3 escopos (`task`, `list`, `template`).
  - Aplicação remota da migration `007_coydash_clickup_custom_fields.sql`.
- [x] **TASK-15.3 — Sincronização em Tempo Real (Supabase Realtime):**
  - Publicação de `tasks`, `task_lists`, `task_folders` e `custom_field_definitions` no Realtime com `REPLICA IDENTITY FULL`.
  - Endpoint atômico `ADD_TASK_COMMENT` para gravação de áudio Base64 e mensagens instantâneas.
- [x] **TASK-15.4 — Regras de Visibilidade e Modo Eu ("Me Mode"):**
  - Auto-atribuição automática: toda tarefa criada inclui o usuário logado como responsável.
  - Tela `/tarefas` restrita exclusivamente às tarefas do usuário logado.
  - Filtro "Modo Eu" na barra de ferramentas de listas/projetos ativado por padrão (`true`) e expansível com 1 clique para ver todas as tarefas.
  - Utilitário `isTaskAssignedToUser` em `src/lib/task-utils.ts`.
- [x] **TASK-15.5 — Atualização do Planejamento Estratégico COYTECH:**
  - Atualização no Supabase de todas as 27 tarefas das 5 fases vinculando `Coytech` e `coytechbr@gmail.com` como responsáveis para visibilidade imediata.
