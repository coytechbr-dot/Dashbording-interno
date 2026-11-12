import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf8')
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

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function fixDeals() {
  console.log('Iniciando correção de pipeline e estágios dos deals...')

  const coytechOrgId = 'bd7fedf4-097e-410a-9c22-f833641c59a1'
  const coytechPipelineId = '21b54b74-bdce-4e8d-95d8-331d3a2d62e5'

  // Buscar estágios do pipeline da Coytech Brasil
  const { data: stages } = await admin
    .from('pipeline_stages')
    .select('*')
    .eq('pipeline_id', coytechPipelineId)
    .order('stage_order', { ascending: true })

  console.log('Estágios da Coytech Brasil:', stages?.map(s => ({ order: s.stage_order, name: s.name, id: s.id })))

  const stageByOrder = {}
  stages?.forEach(s => {
    stageByOrder[s.stage_order] = s.id
  })

  // Mapeamento dos estágios comerciais para os estágios do pipeline
  const stageMapByCommercial = {
    NOVO: stageByOrder[0],              // Novo Lead / Diagnóstico
    QUALIFICANDO: stageByOrder[1],      // Qualificação & BIA
    QUALIFICADO: stageByOrder[1],       // Qualificação & BIA
    REUNIAO_AGENDADA: stageByOrder[2],  // Reunião de Apresentação
    PROPOSTA: stageByOrder[3],          // Proposta Enviada
    PROPOSTA_ENVIADA: stageByOrder[3],  // Proposta Enviada
    GANHO: stageByOrder[4],             // Contrato Fechado
    PERDIDO: stageByOrder[5],           // Perdido / Desqualificado
  }

  // Buscar todos os leads para pegar o commercial_stage real de cada um
  const { data: leads } = await admin.from('leads').select('*')
  const leadMap = {}
  leads?.forEach(l => {
    leadMap[l.lead_id] = l
  })

  // Buscar deals
  const { data: deals } = await admin.from('deals').select('*')

  console.log(`Atualizando ${deals?.length || 0} deals para o pipeline ${coytechPipelineId}...`)

  for (const deal of (deals || [])) {
    const lead = leadMap[deal.lead_id]
    const commStage = lead?.commercial_stage || 'NOVO'
    const targetStageId = stageMapByCommercial[commStage] || stageByOrder[0]

    const { error: updErr } = await admin
      .from('deals')
      .update({
        organization_id: coytechOrgId,
        pipeline_id: coytechPipelineId,
        stage_id: targetStageId,
      })
      .eq('id', deal.id)

    if (updErr) {
      console.error(`Erro ao atualizar deal ${deal.title}:`, updErr.message)
    } else {
      console.log(`✅ Deal "${deal.title}" corrigido: pipe=${coytechPipelineId}, stage=${targetStageId} (${commStage})`)
    }
  }

  // Se a organização "Teste Felipe" também for usada pelo usuário, vamos criar cópias dos deals para ela também, para que apareça em qualquer organização que o usuário estiver!
  const testeFelipeOrgId = '198b1de7-d40b-4ef1-960e-f1297bdbc716'
  const testeFelipePipeId = '1def11a3-7f91-4347-ae00-523117951cc8'
  const { data: tfStages } = await admin.from('pipeline_stages').select('*').eq('pipeline_id', testeFelipePipeId).order('stage_order', { ascending: true })
  const tfStageByOrder = {}
  tfStages?.forEach(s => { tfStageByOrder[s.stage_order] = s.id })

  const tfStageMap = {
    NOVO: tfStageByOrder[0],
    QUALIFICANDO: tfStageByOrder[1],
    QUALIFICADO: tfStageByOrder[1],
    REUNIAO_AGENDADA: tfStageByOrder[2],
    PROPOSTA: tfStageByOrder[3],
    PROPOSTA_ENVIADA: tfStageByOrder[3],
    GANHO: tfStageByOrder[4],
    PERDIDO: tfStageByOrder[5],
  }

  // Verificar se já existem deals para Teste Felipe
  const { data: tfDeals } = await admin.from('deals').select('id, lead_id').eq('organization_id', testeFelipeOrgId)
  if (!tfDeals || tfDeals.length === 0) {
    console.log('\nCriando deals também para a organização Teste Felipe...')
    for (const deal of (deals || [])) {
      const lead = leadMap[deal.lead_id]
      const commStage = lead?.commercial_stage || 'NOVO'
      const targetStageId = tfStageMap[commStage] || tfStageByOrder[0]

      await admin.from('deals').insert({
        organization_id: testeFelipeOrgId,
        pipeline_id: testeFelipePipeId,
        stage_id: targetStageId,
        title: deal.title,
        value_mrr: deal.value_mrr,
        value_setup: deal.value_setup,
        lead_id: deal.lead_id,
        client_id: deal.client_id,
        priority: deal.priority,
        expected_close_date: deal.expected_close_date,
        assigned_member_name: deal.assigned_member_name,
        notes: deal.notes,
        custom_fields: deal.custom_fields,
      })
    }
    console.log('✅ Deals replicados para Teste Felipe com sucesso!')
  }

  console.log('\n🎉 Todos os deals foram corrigidos e garantidos em todas as organizações!')
}

fixDeals()

