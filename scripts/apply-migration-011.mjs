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

const ref = env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '')?.split('.')[0]

async function applyMigration() {
  const client = new pg.Client({
    host: `db.${ref}.supabase.co`,
    port: 5432,
    user: 'postgres',
    password: env.SUPABASE_DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  })

  try {
    await client.connect()
    const sql = fs.readFileSync(
      path.resolve(process.cwd(), 'supabase/migrations/011_coydash_custom_fields_studio_and_groups.sql'),
      'utf8'
    )
    await client.query(sql)
    console.log('Migration 011 executada com sucesso!')

    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'custom_field_definitions'
      ORDER BY ordinal_position
    `)
    const tbls = await client.query(`
      SELECT tablename FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename IN ('tasks', 'custom_field_definitions', 'custom_field_groups')
    `)
    console.log('Colunas custom_field_definitions:', cols.rows.map(r => r.column_name))
    console.log('Tabelas em supabase_realtime:', tbls.rows.map(r => r.tablename))
  } catch (err) {
    console.error('Erro na Migration 011:', err)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

applyMigration()
