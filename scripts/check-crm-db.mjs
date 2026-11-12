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

async function check() {
  const { data: orgs } = await admin.from('organizations').select('id, name, slug')
  console.log('=== ORGANIZAÇÕES ===')
  console.log(orgs)

  const { data: pipes } = await admin.from('pipelines').select('id, name, organization_id, is_default')
  console.log('\n=== PIPELINES ===')
  console.log(pipes)

  const { data: stages } = await admin.from('pipeline_stages').select('id, name, pipeline_id, organization_id')
  console.log('\n=== STAGES ===')
  console.log(stages?.map(s => ({ id: s.id, name: s.name, pipe: s.pipeline_id, org: s.organization_id })))

  const { data: deals } = await admin.from('deals').select('id, title, organization_id, pipeline_id, stage_id, lead_id')
  console.log(`\n=== DEALS (${deals?.length || 0}) ===`)
  console.log(deals?.map(d => ({ title: d.title, org: d.organization_id, pipe: d.pipeline_id, stage: d.stage_id, lead: d.lead_id })))
}

check()

