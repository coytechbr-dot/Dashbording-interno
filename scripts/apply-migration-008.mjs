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
console.log('DB Password presente:', Boolean(dbPassword))

const hostsToTry = [
  { host: `db.${ref}.supabase.co`, port: 5432, user: 'postgres' },
  { host: `aws-0-sa-east-1.pooler.supabase.com`, port: 6543, user: `postgres.${ref}` },
  { host: `aws-0-us-east-1.pooler.supabase.com`, port: 6543, user: `postgres.${ref}` },
]

async function testConnections() {
  for (const target of hostsToTry) {
    console.log(`Tentando conectar em ${target.host}:${target.port} com user ${target.user}...`)
    const client = new pg.Client({
      host: target.host,
      port: target.port,
      user: target.user,
      password: dbPassword,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    })

    try {
      await client.connect()
      console.log(`✅ Conexão bem-sucedida com ${target.host}!`)
      
      const migrationSql = fs.readFileSync(
        path.resolve(process.cwd(), 'supabase/migrations/008_coydash_crm_twenty_reverse_engineering.sql'),
        'utf8'
      )
      
      console.log('🚀 Executando migration 008_coydash_crm_twenty_reverse_engineering.sql...')
      await client.query(migrationSql)
      console.log('🎉 Migration 008 executada com sucesso!')
      await client.end()
      return true
    } catch (err) {
      console.warn(`❌ Falha em ${target.host}:`, err.message)
      try { await client.end() } catch {}
    }
  }
  return false
}

testConnections().then(success => {
  if (success) {
    console.log('Migração 008 aplicada com êxito!')
  } else {
    console.log('Não foi possível conectar diretamente pelo host PG.')
  }
})

