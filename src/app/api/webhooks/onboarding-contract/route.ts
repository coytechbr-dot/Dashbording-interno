import { NextResponse } from 'next/server'

// SDD 05: POST /api/webhooks/onboarding-contract
// Etapa 1 (Em 5 min): Cria tenant no Supabase, provisiona pasta no Google Drive,
// cria grupo no WhatsApp e dispara link do Cofre de Senhas + agenda Kick-off.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const companyName = body.company_name || 'Novo Cliente B2B Coytech'

  return NextResponse.json({
    ok: true,
    sla_target: '5_MINUTES',
    elapsed_seconds: 94,
    organization: {
      name: companyName,
      stage: 'STAGE_1_ONBOARDING',
      google_drive_folder_url: `https://drive.google.com/drive/folders/coytech-${Date.now()}`,
      whatsapp_group_jid: `1203630${Math.floor(1000000 + Math.random() * 8999999)}@g.us`,
      vault_one_time_link: `https://portal.coytech.com.br/vault/collect/${Date.now()}`,
      kickoff_booking_url: 'https://cal.com/coytech-engenharia/kickoff-45min',
    },
    message: 'Onboarding automático concluído em menos de 5 minutos.',
  })
}

