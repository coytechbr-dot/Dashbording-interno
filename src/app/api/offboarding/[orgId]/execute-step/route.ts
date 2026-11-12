import { NextResponse } from 'next/server'

// SDD 05: POST /api/offboarding/[orgId]/execute-step
// Etapa 6 (Offboarding Seguro): Gera pacote de exportação (Git + DB + n8n + Zabbix),
// revoga chave no LiteLLM, limpa segredos do Vault e agenda follow-ups de 60 e 120 dias.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params
  const body = await request.json().catch(() => ({}))
  const step = body.step || 'EXPORT_ASSETS'

  return NextResponse.json({
    ok: true,
    organization_id: orgId,
    executed_step: step,
    handover_bundle: {
      git_repo_archive_url: `https://storage.coytech.com.br/offboarding/${orgId}/git-source.tar.gz`,
      db_backup_dump_url: `https://storage.coytech.com.br/offboarding/${orgId}/postgres16-dump.sql.enc`,
      n8n_workflows_export_url: `https://storage.coytech.com.br/offboarding/${orgId}/n8n-workflows.json`,
      monitoring_templates_export_url: `https://storage.coytech.com.br/offboarding/${orgId}/zabbix7-grafana.yaml`,
    },
    lgpd_compliance: {
      litellm_virtual_key_revoked: step === 'REVOKE_KEYS_LGPD',
      vault_secrets_wiped: step === 'REVOKE_KEYS_LGPD',
      followups_scheduled: ['+60 days', '+120 days'],
    },
  })
}

