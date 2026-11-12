import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Ler .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let val = match[2] || ''
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)
    env[match[1]] = val
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERRO: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados em .env.local')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function run() {
  console.log('🔄 Conectando ao Supabase para sincronizar leads em atendimento com o Comercial...')

  // 1. Buscar organizações
  const { data: orgs } = await admin.from('organizations').select('id, name').limit(1)
  const defaultOrgId = orgs?.[0]?.id || 'bd7fedf4-097e-410a-9c22-f833641c59a1'

  // 2. Garantir Pipeline Padrão
  let { data: pipelines } = await admin.from('pipelines').select('*').limit(1)
  let pipeline = pipelines?.[0]

  if (!pipeline) {
    console.log('Criando pipeline padrão no banco...')
    const { data: createdPipe, error: pipeErr } = await admin
      .from('pipelines')
      .insert({
        organization_id: defaultOrgId,
        name: '🚀 Novos Clientes Coytech',
        is_default: true,
        color: '#F0521F',
      })
      .select('*')
      .single()

    if (pipeErr) {
      console.error('Erro ao criar pipeline:', pipeErr.message)
      process.exit(1)
    }
    pipeline = createdPipe
  }

  // 3. Garantir Estágios do Pipeline
  let { data: stages } = await admin
    .from('pipeline_stages')
    .select('*')
    .eq('pipeline_id', pipeline.id)
    .order('stage_order', { ascending: true })

  if (!stages || stages.length === 0) {
    console.log('Criando estágios do pipeline no banco...')
    const defaultStages = [
      { organization_id: defaultOrgId, pipeline_id: pipeline.id, name: 'Novo Lead / Diagnóstico', stage_order: 0, probability_percent: 10, color: '#38bdf8', is_won: false, is_lost: false },
      { organization_id: defaultOrgId, pipeline_id: pipeline.id, name: 'Qualificação & BIA', stage_order: 1, probability_percent: 25, color: '#e8c14a', is_won: false, is_lost: false },
      { organization_id: defaultOrgId, pipeline_id: pipeline.id, name: 'Reunião de Apresentação', stage_order: 2, probability_percent: 50, color: '#8f7dff', is_won: false, is_lost: false },
      { organization_id: defaultOrgId, pipeline_id: pipeline.id, name: 'Proposta Enviada', stage_order: 3, probability_percent: 75, color: '#f0521f', is_won: false, is_lost: false },
      { organization_id: defaultOrgId, pipeline_id: pipeline.id, name: 'Contrato Fechado', stage_order: 4, probability_percent: 100, color: '#2f9e5a', is_won: true, is_lost: false },
      { organization_id: defaultOrgId, pipeline_id: pipeline.id, name: 'Perdido / Desqualificado', stage_order: 5, probability_percent: 0, color: '#ef4444', is_won: false, is_lost: true },
    ]
    const { data: createdStages, error: stErr } = await admin
      .from('pipeline_stages')
      .insert(defaultStages)
      .select('*')

    if (stErr) {
      console.error('Erro ao criar estágios:', stErr.message)
      process.exit(1)
    }
    stages = createdStages || []
  }

  const stageMap = {
    NOVO: stages[0]?.id,
    EM_QUALIFICACAO: stages[1]?.id,
    QUALIFICADO: stages[1]?.id,
    REUNIAO_AGENDADA: stages[2]?.id,
    PROPOSTA_ENVIADA: stages[3]?.id,
    GANHO: stages[4]?.id,
    PERDIDO: stages[5]?.id,
  }

  // 4. Buscar leads
  const { data: leads, error: leadsErr } = await admin
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (leadsErr) {
    console.error('Erro ao buscar leads:', leadsErr.message)
    process.exit(1)
  }

  console.log(`📋 Total de leads encontrados em public.leads: ${leads?.length || 0}`)

  // 5. Buscar deals existentes para evitar duplicidade
  const { data: existingDeals } = await admin.from('deals').select('id, lead_id, title')
  const existingLeadIds = new Set((existingDeals || []).map(d => d.lead_id).filter(Boolean))

  let createdCount = 0
  for (const lead of (leads || [])) {
    const leadPhone = String(lead.lead_id || '').trim()
    if (!leadPhone) continue

    if (existingLeadIds.has(leadPhone)) {
      console.log(`⏭️ Lead ${lead.lead_nome || leadPhone} já possui oportunidade cadastrada. Pulando.`)
      continue
    }

    const stageId = stageMap[lead.commercial_stage] || stages[0]?.id

    // Valores estimados
    const mrr = lead.orders_count && lead.orders_count > 0 ? 4500 : 3500
    const setup = 2500

    const dealTitle = lead.lead_nome
      ? `Oportunidade · ${lead.lead_nome}`
      : `Lead WhatsApp · ${leadPhone}`

    const { data: deal, error: dealErr } = await admin
      .from('deals')
      .insert({
        organization_id: lead.organization_id || defaultOrgId,
        pipeline_id: pipeline.id,
        stage_id: stageId,
        client_id: lead.client_id || null,
        lead_id: leadPhone,
        title: dealTitle,
        value_mrr: mrr,
        value_setup: setup,
        priority: lead.qualification_score && lead.qualification_score > 70 ? 'high' : 'medium',
        expected_close_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assigned_member_name: 'Coytech SDR',
        notes: `Importado automaticamente da fila de Atendimento. Estágio original: ${lead.commercial_stage || 'NOVO'}. Pontuação: ${lead.qualification_score || 0}/100.`,
        custom_fields: {
          contact_name: lead.lead_nome || '',
          contact_phone: leadPhone,
          origin: 'WhatsApp Atendimento',
        },
      })
      .select('*')
      .single()

    if (dealErr) {
      console.error(`❌ Erro ao criar deal para lead ${leadPhone}:`, dealErr.message)
    } else {
      createdCount++
      console.log(`✅ Deal criado com sucesso: "${deal.title}" (MRR: R$ ${mrr}, Setup: R$ ${setup})`)

      // Gravar na timeline
      await admin.from('activity_timeline').insert({
        organization_id: lead.organization_id || defaultOrgId,
        deal_id: deal.id,
        entity_type: 'deal',
        entity_id: deal.id,
        event_type: 'created',
        title: `Oportunidade importada do Atendimento`,
        description: `Lead do WhatsApp (${leadPhone}) registrado no funil comercial.`,
        metadata: { lead_id: leadPhone, stage_id: stageId },
      })
    }
  }

  console.log(`\n🎉 Sincronização concluída! ${createdCount} oportunidades criadas no Comercial.`)
}

run().catch(console.error)

