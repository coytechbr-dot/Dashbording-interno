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

async function inspect() {
  const client = new pg.Client({
    host: `db.${ref}.supabase.co`,
    port: 5432,
    user: 'postgres',
    password: dbPassword,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  const res = await client.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name IN ('leads', 'tasks', 'task_comments', 'clients', 'custom_agents', 'whatsapp_messages')
    ORDER BY table_name, ordinal_position;
  `)

  const grouped = {}
  res.rows.forEach(r => {
    grouped[r.table_name] = grouped[r.table_name] || []
    grouped[r.table_name].push(`${r.column_name} (${r.data_type})`)
  })

  console.log(JSON.stringify(grouped, null, 2))
  await client.end()
}

inspect()

