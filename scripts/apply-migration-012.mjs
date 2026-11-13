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
      path.resolve(process.cwd(), 'supabase/migrations/012_coydash_rbac_levels_and_task_archive.sql'),
      'utf8'
    )
    await client.query(sql)
    console.log('Migration 012 executada com sucesso!')

    const omCols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'organization_members'
        AND column_name IN ('access_type', 'custom_permissions')
      ORDER BY ordinal_position
    `)
    const taskCols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tasks'
        AND column_name IN ('created_by_user_id', 'created_by_name', 'is_archived', 'archived_at', 'archived_by_user_id')
      ORDER BY ordinal_position
    `)
    console.log('Colunas organization_members:', omCols.rows.map(r => r.column_name))
    console.log('Colunas tasks:', taskCols.rows.map(r => r.column_name))
  } catch (err) {
    console.error('Erro na Migration 012:', err)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

applyMigration()
