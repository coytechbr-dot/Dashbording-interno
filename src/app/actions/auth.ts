'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || 'operacao'
  )
}

async function ensureUserOrganization(userId: string, email: string, fullName: string, companyName?: string, teamSize?: string) {
  const admin = createAdminClient()
  const cleanEmail = email.trim().toLowerCase()

  // 1. Reconcilia convites pendentes e associa este usuário aos workspaces aos quais foi convidado
  try {
    // Vincula membros que tinham sido convidados por este e-mail mas não tinham user_id
    await admin
      .from('organization_members')
      .update({ user_id: userId, full_name: fullName })
      .ilike('email', cleanEmail)
      .is('user_id', null)

    // Se houver convites na tabela workspace_invitations
    const { data: pendingInvites } = await admin
      .from('workspace_invitations')
      .select('*')
      .ilike('email', cleanEmail)
      .eq('status', 'PENDING')

    if (pendingInvites && pendingInvites.length > 0) {
      for (const inv of pendingInvites) {
        const { data: existing } = await admin
          .from('organization_members')
          .select('id')
          .eq('organization_id', inv.organization_id)
          .eq('user_id', userId)
          .maybeSingle()

        if (!existing) {
          await admin.from('organization_members').insert({
            organization_id: inv.organization_id,
            user_id: userId,
            full_name: inv.full_name || fullName,
            email: cleanEmail,
            role: 'CLIENT_OPERATIONS',
            access_type: inv.access_type || 'GUEST',
            sector: inv.sector || 'Geral',
            job_title: inv.job_title || 'Colaborador',
            allowed_screens: inv.allowed_screens || [],
            allowed_folder_ids: inv.allowed_folder_ids || [],
            allowed_list_ids: inv.allowed_list_ids || [],
            member_status: 'ACTIVE',
          })
        }

        await admin
          .from('workspace_invitations')
          .update({ status: 'ACCEPTED' })
          .eq('id', inv.id)
      }
    }
  } catch (reconcileErr) {
    console.warn('Erro ao reconciliar convites no auth:', reconcileErr)
  }

  // 2. Verifica se o usuário já possui alguma organização vinculada (própria ou compartilhada)
  const { data: existingMember } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (existingMember?.organization_id) {
    return existingMember.organization_id
  }

  const orgName = (companyName && companyName.trim()) || `Operação ${fullName.split(' ')[0]}`
  const slug = `${slugify(orgName)}-${Math.random().toString(36).slice(2, 6)}`
  const tier = teamSize === '200+' ? 'ENTERPRISE' : 'MID_MARKET'
  const qbrDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: newOrg, error: orgError } = await admin
    .from('organizations')
    .insert({
      name: orgName,
      slug,
      sector: 'Operações B2B',
      team_size: teamSize || '6–20',
      tier,
      current_stage: 'STAGE_1_ONBOARDING',
      litellm_virtual_key_id: `sk-coytech-${slug.slice(0, 16)}`,
      litellm_monthly_budget: 2500,
      litellm_current_spend: 0,
      monthly_mrr_value: 0,
      setup_fee_value: 0,
      hourly_revenue_avg: 0,
      hourly_revenue_live: 0,
      conversion_rate_avg: 0,
      conversion_rate_live: 0,
      next_qbr_date: qbrDate,
    })
    .select('id')
    .single()

  if (orgError || !newOrg) {
    console.error('Erro ao criar organização inicial:', orgError)
    return null
  }

  await admin.from('organization_members').insert({
    organization_id: newOrg.id,
    user_id: userId,
    full_name: fullName,
    email,
    role: 'CLIENT_CEO_DIRECTOR',
    receive_monday_8am_report: true,
    receive_critical_bia_alerts: true,
  })

  await admin.from('offboarding_processes').insert({
    organization_id: newOrg.id,
    passive_plan_offered: false,
    retained_on_passive_plan: false,
  })

  return newOrg.id
}

export async function login(prevState: { error?: string } | null, formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Por favor, preencha seu e-mail e senha.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    return { error: 'E-mail ou senha incorretos.' }
  }

  const fullName =
    (data.user.user_metadata?.full_name as string) ||
    data.user.email?.split('@')[0] ||
    'Usuário'
  const company = data.user.user_metadata?.company as string | undefined
  const teamSize = data.user.user_metadata?.team_size as string | undefined

  try {
    await ensureUserOrganization(data.user.id, email, fullName, company, teamSize)
  } catch (err) {
    console.error('Aviso ao verificar organização no login:', err)
  }

  redirect('/')
}

export async function signup(prevState: { error?: string } | null, formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const company = (formData.get('company') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const teamSize = ((formData.get('team_size') as string) || '6–20').trim()

  if (!name || !email || !password) {
    return { error: 'Por favor, preencha nome, e-mail e senha.' }
  }

  if (password.length < 6) {
    return { error: 'A senha precisa ter pelo menos 6 caracteres.' }
  }

  try {
    const admin = createAdminClient()

    const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        company: company || `Operação ${name.split(' ')[0]}`,
        team_size: teamSize,
      },
    })

    if (createError) {
      if (
        createError.message.toLowerCase().includes('already') ||
        createError.message.toLowerCase().includes('registered')
      ) {
        return { error: 'Este e-mail já está cadastrado. Faça login para continuar.' }
      }
      return { error: `Não foi possível criar a conta: ${createError.message}` }
    }

    if (createdUser.user) {
      await ensureUserOrganization(
        createdUser.user.id,
        email,
        name,
        company || `Operação ${name.split(' ')[0]}`,
        teamSize
      )
    }

    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      redirect('/login?message=Conta+criada+com+sucesso.+Faca+login+para+entrar.')
    }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'digest' in err) {
      throw err
    }
    return { error: 'Erro ao criar conta no servidor. Verifique as credenciais.' }
  }

  redirect('/')
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function resetPassword(
  prevState: { error?: string; success?: string } | null,
  formData: FormData
) {
  const email = (formData.get('email') as string)?.trim()

  if (!email) {
    return { error: 'Por favor, informe seu e-mail.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/atualizar-senha`,
  })

  if (error) {
    return { error: 'Não foi possível enviar o e-mail de recuperação.' }
  }

  return { success: 'E-mail enviado! Verifique sua caixa de entrada.' }
}

export async function updatePassword(prevState: { error?: string } | null, formData: FormData) {
  const password = formData.get('password') as string

  if (!password || password.length < 6) {
    return { error: 'A nova senha precisa ter pelo menos 6 caracteres.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: 'Falha ao atualizar senha. O link pode ter expirado.' }
  }

  redirect('/login?message=Senha+atualizada+com+sucesso')
}

