# Documento 03: Fluxo Operacional Simplificado (6 Etapas) — Coytech

Este guia resume o passo a passo operacional da **Coytech** desde a entrada do cliente até a retenção recorrente e eventual encerramento, conectando os três pilares (**Criação, Implementação e Monitoramento**).

## Visão Geral da Jornada Operacional

| Etapa | Quando Acontece | Pilar Principal em Ação | Resultado Esperado da Etapa |
| :--- | :--- | :--- | :--- |
| **1. Onboarding** | Dias 0 a 3 | Preparação da **Implementação** | Pastas e grupo criados no automático, senhas testadas e Kick-off realizado. |
| **2. Planejamento** | Semana 1 (Dias 1 a 5) | Desenho da **Criação e Monitoramento** | Impacto financeiro mapeado (BIA), telas/fluxos desenhados e tarefas divididas. |
| **3. Apresentação** | Fim da Semana 1 e Fim da Semana 3 | Validação da **Criação** | Cliente aprova o plano (Semana 1) e aprova o sistema funcionando (Semana 3). |
| **4. Entrega** | Semana 4 (Dias 22 a 30) | Execução da **Implementação** | Monitoramento ligado, sistema e automações em produção e equipe treinada. |
| **5. Suporte e Continuidade (LTV)** | A partir do Mês 2 (Contínuo) | Operação do **Monitoramento Recorrente** | Vigilância 24/7, relatório toda segunda às 08h, melhorias mensais e venda de novos módulos. |
| **6. Offboarding** | Quando um contrato encerra | Retenção no **Monitoramento** ou Saída Segura | Oferta de plano enxuto de retenção ou entrega de códigos com desligamento de acessos. |

## Etapa 1: Onboarding (Recepção do Cliente — Dias 0 a 3)

**Objetivo:** Receber o cliente sem burocracia, recolher os acessos com segurança e dar início oficial ao projeto em até 3 dias úteis.

1. **Passagem de Bastão Interna (Dia 0):** O comercial passa para a engenharia o resumo do que foi vendido, qual é a dor principal do cliente, quem manda no projeto (CEO, COO, CTO) e o que precisa estar rodando em 30 dias.
2. **Automação de Boas-Vindas (Dia 0 — Em 5 Minutos):** Assim que o contrato é assinado, nossa automação no n8n cria a pasta do cliente no Google Drive, monta o grupo executivo no WhatsApp e envia a mensagem de boas-vindas com o link de agendamento do Kick-off.
3. **Coleta e Teste de Acessos (Dias 1 e 2):** Enviamos um formulário seguro (cofre de senhas) pedindo apenas o necessário:
   - *Para Criação (Studio):* Logo, subdomínio e planilhas atuais que serão substituídas.
   - *Para Implementação (Flow):* Chaves de API do ERP, CRM, gateway de pagamento e WhatsApp.
   - *Para Monitoramento (Pulse):* Acesso VPN/rede para conectar o Zabbix/Grafana/Datadog.
   - *Regra:* A engenharia testa todos os acessos antes da reunião de Kick-off.
4. **Reunião de Kick-off (Dia 3 — 45 Minutos):** Alinhamos o objetivo dos primeiros 30 dias, mostramos o cronograma das 4 semanas e deixamos agendadas as conversas de mapeamento da Semana 1.

**Checklist de Conclusão do Onboarding:**
- [ ] Pasta no Drive e grupo de comunicação criados.
- [ ] Acessos e APIs testados e conectando.
- [ ] Kick-off realizado e cronograma aprovado.

## Etapa 2: Planejamento do Projeto (Semana 1)

**Objetivo:** Entender as regras do negócio, calcular o custo das falhas e fechar o desenho exato do que será construído e monitorado.

1. **Mapear o Impacto Financeiro — BIA (Dias 1 e 2):** Fazemos 3 perguntas diretas para a direção e operação do cliente:
   - *O que não pode parar de jeito nenhum?* (Ex: checkout, emissão de nota fiscal na SEFAZ, aprovação de pedidos).
   - *Quanto custa cada hora parado?* (Ex: R$ 80.000/hora de perda).
   - *Qual trabalho manual mais rouba tempo da equipe hoje?* (Ex: alimentar 5 planilhas, conciliar pagamentos na mão, montar relatório no domingo).
2. **Desenhar a Solução nos 3 Pilares (Dias 2 e 3):**
   - *Criação (Studio):* Rascunho das telas do sistema web e definição do que cada cargo pode acessar.
   - *Implementação (Flow):* Desenho do passo a passo de cada automação no n8n e das regras dos Agentes de IA.
   - *Monitoramento (Pulse):* Definição dos alertas prioritários (limpando alarmes falsos) e desenho dos 2 painéis (técnico para a TI e executivo no celular para o CEO).
3. **Dividir as Tarefas — Regra 80/20 (Dia 4):** Tudo o que gera retorno imediato entra na construção das Semanas 2 e 3; pedidos secundários ficam anotados para evoluir no mês seguinte.
4. **Rotina Diária da Equipe Coytech (Todos os Dias):**
   - *08h30 (15 min):* Alinhamento rápido do que cada engenheiro vai fazer no dia e se há algum bloqueio do cliente.
   - *17h00 (15 min):* Conferência do que foi entregue no dia e aviso imediato ao cliente se faltar algum insumo.

**Checklist de Conclusão do Planejamento:**
- [ ] Mapa de impacto financeiro (BIA) preenchido.
- [ ] Desenho das telas, automações e painéis concluído.
- [ ] Escopo dos 30 dias fechado e pronto para aprovação.

## Etapa 3: Apresentação do Projeto (Semana 1 e Semana 3)

**Objetivo:** Apresentar o projeto falando a língua de negócios para os sócios e comprovando segurança técnica para a TI.

Fazemos **duas apresentações** no ciclo de 30 dias:
- **Apresentação 1 (Fim da Semana 1 — 30 min):** Validação do plano e do desenho das telas antes de programar.
- **Apresentação 2 (Fim da Semana 3 — 45 min):** Demonstração ao vivo do sistema, automações e monitoramento prontos antes da virada final.

**Roteiro Simples de 4 Passos na Reunião:**
1. **Relembrar o Cenário Anterior (5 min):** Mostrar em 1 tela quantas planilhas, horas manuais ou falhas sem alerta existiam antes.
2. **Mostrar a Prática para o CEO e Operação (20 min):** Sem mostrar código, clicamos ao vivo na tela do sistema web (aprovação em 1 clique), disparamos a automação em 3 segundos, mostramos o relatório chegando no WhatsApp e abrimos o painel executivo no celular.
3. **Mostrar a Segurança para a TI (10 min):** Mostramos o painel técnico do Zabbix/Grafana calibrado sem alarmes falsos, os logs de execução do n8n e o controle de custos e segurança de IA no LiteLLM.
4. **Separar Ajustes de Ideias Novas (10 min):**
   - *Ajustes rápidos do escopo atual:* Resolvidos em até 48h antes da entrega.
   - *Ideias novas que surgiram na reunião:* Anotadas para entrar no plano mensal a partir do mês 2.

**Checklist da Apresentação:**
- [ ] Fluxo testado 1 dia antes com dados reais da empresa.
- [ ] Vídeo curto gravado de reserva caso a internet oscile na hora.
- [ ] Aprovação registrada no grupo do projeto para liberar a entrega.

## Etapa 4: Entrega em Produção e Treinamento (Semana 4)

**Objetivo:** Virar a chave para produção com segurança total, treinar a equipe e acompanhar os primeiros dias de uso real.

1. **Conferência Final de Qualidade (Antes da Virada):** Testar logins por cargo e backup automático no sistema web, validar retentativas nas automações e confirmar que os alertas críticos (incluindo SEFAZ e bancos) estão funcionando sem ruído.
2. **Virada Segura em Produção (Go-Live):**
   - *Passo A:* Ligamos **primeiro o Monitoramento (Coytech Pulse)** para enxergar toda a virada ao vivo.
   - *Passo B:* Importamos os dados finais e ligamos o sistema novo (**Studio**) e as automações (**Flow**).
   - *Passo C:* Colocamos as planilhas antigas em modo "Somente Leitura" para ninguém voltar ao processo manual antigo.
3. **Treinamento Prático em Vídeos Curtos:** Realizamos o treinamento ao vivo e entregamos vídeos gravados de 3 minutos por função:
   - *Para Sócios (20 min):* Como acompanhar o painel no celular e os relatórios no WhatsApp.
   - *Para Operação (40 min):* Como operar as filas e aprovações no dia a dia.
   - *Para TI (40 min):* Como gerenciar os fluxos, painéis técnicos e documentação.
4. **Operação Assistida (10 Dias Úteis):** Acompanhamento diário próximo após o lançamento para tirar dúvidas rápidas e calibrar detalhes finos.

**Checklist de Conclusão da Entrega:**
- [ ] Sistema, automações e monitoramento rodando em produção.
- [ ] Planilhas antigas congeladas e vídeos de treinamento entregues.
- [ ] Cliente transferido oficialmente para a rotina de Monitoramento e Recorrência (LTV).

## Etapa 5: Suporte, Monitoramento e Continuidade — LTV (Mês 2 em Diante)

**Objetivo:** Garantir a receita recorrente mensal protegendo a operação 24/7, provando valor toda semana e vendendo novos módulos a cada trimestre.

1. **Atendimento por Prioridade de Negócio (Dia a Dia):**
   - *Prioridade Crítica (Vendas ou operação travada):* Nosso monitoramento e o Agente de IA detectam na hora e a engenharia age em **até 15 minutos**.
   - *Prioridade Alta (Instabilidade externa na SEFAZ ou bancos):* Fila de contingência ativada automaticamente e aviso ao cliente em **até 30 minutos**.
   - *Dúvidas e Pequenos Ajustes:* Respondidos no mesmo dia útil.
2. **Prova de Valor Semanal (Toda Segunda-Feira às 08h):** Uma automação envia no WhatsApp dos sócios o balanço da semana: quantos processos rodaram sozinhos, quantas horas manuais foram economizadas e quantas falhas foram evitadas pelo monitoramento.
3. **Manutenção Preventiva e Evolução do Mês (Mensal):** Limpeza de alertas desnecessários, revisão de custos de nuvem/IA, verificação de backups e entrega das melhorias mensais no sistema e nas automações.
4. **Reunião Trimestral de Expansão (A Cada 90 Dias):** Conversa estratégica de 30 minutos com os sócios mostrando o retorno financeiro acumulado no trimestre e oferecendo o próximo passo (novas telas no sistema, novos Agentes de IA ou expansão do monitoramento).

**Checklist Mensal de Continuidade (LTV):**
- [ ] Resumo automático de segunda-feira às 08h enviado todas as semanas.
- [ ] Uso ativo do sistema pela equipe do cliente monitorado.
- [ ] Nova oportunidade de expansão apresentada a cada trimestre.

## Etapa 6: Offboarding (Encerramento Seguro)

**Objetivo:** Quando um contrato chega ao fim, tentar reter o cliente em um plano enxuto de monitoramento ou entregar todos os seus ativos com segurança total e portas abertas para o futuro.

1. **Conversa de Diagnóstico e Tentativa de Retenção (Dias 1 a 3):** Antes de desligar, entendemos o motivo da saída em uma conversa rápida de 20 minutos. Se o motivo for redução de custos, oferecemos o **Plano Enxuto de Monitoramento Passivo + Backup**, mantendo a empresa protegida por uma mensalidade menor.
2. **Entrega Organizada do que Pertence ao Cliente (Dias 4 a 10):** Caso o encerramento seja confirmado, entregamos uma pasta completa para a TI do cliente contendo:
   - Código-fonte completo no Git e backup atualizado do banco de dados (**Studio**).
   - Arquivos exportados das automações do n8n e configurações dos Agentes de IA (**Flow**).
   - Templates de monitoramento e painéis do Zabbix/Grafana/Datadog (**Pulse**).
3. **Desligamento de Senhas e Segurança LGPD (Dias 11 a 15):** No último dia do contrato, desativamos nossas chaves de IA no LiteLLM, revogamos nossos acessos de VPN/servidores e apagamos cópias temporárias de dados e senhas do nosso cofre interno.
4. **Termo de Encerramento e Contato Futuro (60 e 120 Dias Depois):** O cliente assina a confirmação de que recebeu todos os arquivos e assumiu a manutenção interna, e agendamos um lembrete para mandar uma mensagem amigável após 2 e 4 meses (muitos clientes retornam quando precisam voltar a evoluir o sistema).

**Checklist de Conclusão do Offboarding:**
- [ ] Códigos, fluxos e backups entregues ao cliente.
- [ ] Todas as senhas e acessos da Coytech desligados.
- [ ] Termo de entrega assinado e lembrete de reconexão futura agendado.
