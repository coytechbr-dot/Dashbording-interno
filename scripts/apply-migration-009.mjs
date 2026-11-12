import pg from 'pg'
import fs from 'fs'
import path from 'path'

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

console.log('Project Ref:', ref)

const target = { host: `db.${ref}.supabase.co`, port: 5432, user: 'postgres' }

async function applyMigration() {
  console.log(`Conectando a ${target.host}:${target.port}...`)
  const client = new pg.Client({
    host: target.host,
    port: target.port,
    user: target.user,
    password: dbPassword,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })

  try {
    await client.connect()
    console.log(`✅ Conectado com sucesso ao PostgreSQL remoto!`)

    const migrationSql = fs.readFileSync(
      path.resolve(process.cwd(), 'supabase/migrations/009_coydash_universal_mcp_and_api_tokens.sql'),
      'utf8'
    )

    console.log('Executando migration 009...')
    await client.query(migrationSql)
    console.log('✅ Migration 009 executada com sucesso!')

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('mcp_api_tokens', 'mcp_audit_logs');
    `)
    console.log('Tabelas verificadas:', res.rows.map(r => r.table_name))
  } catch (err) {
    console.error('❌ Erro na migração:', err)
  } finally {
    await client.end()
  }
}

applyMigration()

