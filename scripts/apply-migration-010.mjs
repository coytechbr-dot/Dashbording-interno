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

async function applyMigration() {
  const client = new pg.Client({
    host: `db.${ref}.supabase.co`,
    port: 5432,
    user: 'postgres',
    password: dbPassword,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  })

  try {
    await client.connect()
    console.log('Conectado ao PostgreSQL remoto.')

    const migrationSql = fs.readFileSync(
      path.resolve(process.cwd(), 'supabase/migrations/010_coydash_real_subtasks_and_clean_fields.sql'),
      'utf8'
    )

    await client.query(migrationSql)
    console.log('Migration 010 executada com sucesso!')

    const cfRes = await client.query('SELECT COUNT(*)::int AS total FROM public.custom_field_definitions')
    const subRes = await client.query('SELECT COUNT(*)::int AS total_subtasks FROM public.tasks WHERE parent_task_id IS NOT NULL')
    const legacyRes = await client.query("SELECT COUNT(*)::int AS remaining_legacy FROM public.tasks WHERE jsonb_array_length(COALESCE(subtasks, '[]'::jsonb)) > 0")
    console.log('Verificação pós-migration:', {
      custom_field_definitions: cfRes.rows[0].total,
      real_subtasks_rows: subRes.rows[0].total_subtasks,
      remaining_legacy_json_subtasks: legacyRes.rows[0].remaining_legacy,
    })
  } catch (err) {
    console.error('Erro na migração 010:', err)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

applyMigration()
