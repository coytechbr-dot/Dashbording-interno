import pg from 'pg'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

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
const dbPassword = env.SUPABASE_DB_PASSWORD
const ref = supabaseUrl?.replace('https://', '')?.split('.')[0]

function hashMcpToken(token) {
  return crypto.createHash('sha256').update(token.trim()).digest('hex')
}

async function runMcpTests() {
  console.log('--- 1. PREPARANDO TOKENS DE TESTE NO BANCO ---')
  const client = new pg.Client({
    host: `db.${ref}.supabase.co`,
    port: 5432,
    user: 'postgres',
    password: dbPassword,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  const orgId = 'bd7fedf4-097e-410a-9c22-f833641c59a1' // Coytech Brasil

  // Token 1: Master com escopo total
  const masterRawToken = 'coydash_mcp_live_teste_master_1234567890abcdef'
  const masterHash = hashMcpToken(masterRawToken)

  await client.query(`
    DELETE FROM public.mcp_api_tokens WHERE token_prefix IN ('coydash_mcp_live_teste_m...', 'coydash_mcp_live_teste_r...');
  `)

  await client.query(`
    INSERT INTO public.mcp_api_tokens (organization_id, name, token_hash, token_prefix, role, allowed_scopes)
    VALUES ($1, $2, $3, $4, $5, $6);
  `, [
    orgId,
    'Agente Master (Claude Desktop)',
    masterHash,
    'coydash_mcp_live_teste_m...',
    'ADMIN',
    JSON.stringify(['*'])
  ])

  // Token 2: Restrito (apenas comercial:read)
  const restrictedRawToken = 'coydash_mcp_live_teste_restrito_1234567890abcdef'
  const restrictedHash = hashMcpToken(restrictedRawToken)

  await client.query(`
    INSERT INTO public.mcp_api_tokens (organization_id, name, token_hash, token_prefix, role, allowed_scopes)
    VALUES ($1, $2, $3, $4, $5, $6);
  `, [
    orgId,
    'Agente Analista Comercial (Restrito)',
    restrictedHash,
    'coydash_mcp_live_teste_r...',
    'READ_ONLY',
    JSON.stringify(['comercial:read'])
  ])

  console.log('✅ Tokens provisionados no banco com sucesso!')

  console.log('\n--- 2. TESTANDO HANDSHAKE: initialize ---')
  const initRes = await fetch('http://localhost:3005/api/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${masterRawToken}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
    }),
  })
  const initData = await initRes.json()
  console.log('Status HTTP:', initRes.status)
  console.log('Initialize Result:', JSON.stringify(initData.result, null, 2))

  console.log('\n--- 3. TESTANDO CATÁLOGO: tools/list COM TOKEN RESTRITO (comercial:read) ---')
  const listRestrictedRes = await fetch('http://localhost:3005/api/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${restrictedRawToken}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
    }),
  })
  const listRestrictedData = await listRestrictedRes.json()
  console.log('Ferramentas visíveis para comercial:read:', listRestrictedData.result?.tools?.map(t => t.name))

  console.log('\n--- 4. TESTANDO EXECUÇÃO: tools/call (comercial_get_pipeline_summary) ---')
  const callRes = await fetch('http://localhost:3005/api/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${masterRawToken}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'comercial_get_pipeline_summary',
        arguments: {},
      },
    }),
  })
  const callData = await callRes.json()
  console.log('Status HTTP:', callRes.status)
  console.log('Pipeline Summary Output:', callData.result?.content?.[0]?.text)

  console.log('\n--- 5. TESTANDO TRAVA ANTI-HALUCINAÇÃO / FORBIDDEN ---')
  // Token restrito tentando alterar tarefa (não tem escopo tarefas:write)
  const forbiddenRes = await fetch('http://localhost:3005/api/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${restrictedRawToken}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'tarefas_create_task',
        arguments: { title: 'Tarefa Proibida' },
      },
    }),
  })
  const forbiddenData = await forbiddenRes.json()
  console.log('Tentativa proibida (isError):', forbiddenData.result?.isError)
  console.log('Mensagem de erro de permissão:', forbiddenData.result?.content?.[0]?.text)

  console.log('\n--- 6. VERIFICANDO TRILHA DE AUDITORIA IMUTÁVEL (mcp_audit_logs) ---')
  const auditRes = await client.query(`
    SELECT tool_name, status, execution_time_ms, error_message, created_at 
    FROM public.mcp_audit_logs 
    ORDER BY created_at DESC 
    LIMIT 5;
  `)
  console.table(auditRes.rows)

  await client.end()
  console.log('✅ TODOS OS TESTES DO MCP SERVER FORAM EXECUTADOS COM SUCESSO!')
}

runMcpTests().catch(err => console.error('Erro nos testes:', err))

