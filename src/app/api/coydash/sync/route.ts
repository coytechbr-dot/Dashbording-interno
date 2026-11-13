import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  isCoytechMasterEmail,
  normalizeAccessType,
  hasFeaturePermission,
  canUserDeleteTask,
  canUserArchiveTask,
  type UserPermissionContext,
} from '@/lib/access-control'

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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const admin = createAdminClient()
    const fullName =
      (user.user_metadata?.full_name as string) ||
      user.email?.split('@')[0] ||
      'Usuário'
    const companyMeta = user.user_metadata?.company as string | undefined
    const teamSizeMeta = (user.user_metadata?.team_size as string) || '6–20'

    // Reconcilia convites pendentes por e-mail automaticamente
    const cleanUserEmail = user.email?.trim().toLowerCase()
    if (cleanUserEmail) {
      try {
        const userPhone =
          (user.user_metadata?.whatsapp_phone as string) ||
          (user.user_metadata?.whatsapp as string) ||
          (user.user_metadata?.phone as string) ||
          user.phone ||
          ''

        const updateObj: Record<string, unknown> = {
          user_id: user.id,
          full_name: fullName,
        }
        if (userPhone) {
          updateObj.whatsapp_phone = userPhone
        }

        await admin
          .from('organization_members')
          .update(updateObj)
          .ilike('email', cleanUserEmail)

        const { data: pendingInvites } = await admin
          .from('workspace_invitations')
          .select('*')
          .ilike('email', cleanUserEmail)
          .eq('status', 'PENDING')

        if (pendingInvites && pendingInvites.length > 0) {
          for (const inv of pendingInvites) {
            const { data: existing } = await admin
              .from('organization_members')
              .select('id')
              .eq('organization_id', inv.organization_id)
              .eq('user_id', user.id)
              .maybeSingle()

            if (!existing) {
              await admin.from('organization_members').insert({
                organization_id: inv.organization_id,
                user_id: user.id,
                full_name: fullName,
                email: cleanUserEmail,
                whatsapp_phone: userPhone,
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
      } catch (e) {
        console.warn('Aviso na reconciliação de convites em GET /api/coydash/sync:', e)
      }
    }

    // Busca organizações vinculadas ao usuário
    const { data: memberships } = await admin
      .from('organization_members')
      .select('*')
      .eq('user_id', user.id)

    let orgIds = (memberships || []).map((m) => m.organization_id)

    // Se o usuário ainda não tem organização, só cria automaticamente se for e-mail oficial Coytech
    if (orgIds.length === 0) {
      if (!isCoytechMasterEmail(user.email)) {
        return NextResponse.json(
          {
            authenticated: false,
            error: 'Acesso restrito: este e-mail não possui permissão de membro interno.',
          },
          { status: 403 }
        )
      }
      const orgName = (companyMeta && companyMeta.trim()) || `Operação ${fullName.split(' ')[0]}`
      const slug = `${slugify(orgName)}-${Math.random().toString(36).slice(2, 6)}`
      const qbrDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const { data: createdOrg } = await admin
        .from('organizations')
        .insert({
          name: orgName,
          slug,
          sector: 'Operações B2B',
          team_size: teamSizeMeta,
          tier: teamSizeMeta === '200+' ? 'ENTERPRISE' : 'MID_MARKET',
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
        .select('*')
        .single()

      if (createdOrg) {
        await admin.from('organization_members').insert({
          organization_id: createdOrg.id,
          user_id: user.id,
          full_name: fullName,
          email: user.email,
          role: 'CLIENT_CEO_DIRECTOR',
          receive_monday_8am_report: true,
          receive_critical_bia_alerts: true,
        })

        await admin.from('offboarding_processes').insert({
          organization_id: createdOrg.id,
          passive_plan_offered: false,
          retained_on_passive_plan: false,
        })

        orgIds = [createdOrg.id]
      }
    }

    const { data: organizations } = await admin
      .from('organizations')
      .select('*')
      .in('id', orgIds)
      .order('created_at', { ascending: true })

    const requestedOrgId = request.nextUrl.searchParams.get('orgId')
    const activeOrg =
      (organizations || []).find((o) => o.id === requestedOrgId) ||
      (organizations || [])[0]

    if (!activeOrg) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email || '',
          name: fullName,
          role: 'CLIENT_CEO_DIRECTOR',
        },
        organizations: [],
      })
    }

    const orgId = activeOrg.id

    const [
      { data: biaProcesses },
      { data: incidents },
      { data: approvalQueues },
      { data: auditLogs },
      { data: spreadsheets },
      { data: flowRuns },
      { data: knowledgeChunks },
      { data: weeklyReports },
      { data: credentials },
      { data: offboarding },
      { data: clients },
      { data: clientHistoryEvents },
      { data: clientTeamNotes },
      { data: taskFolders },
      { data: taskLists },
      { data: taskStatuses },
      { data: tasks },
      { data: whatsappConversations },
      { data: paidCampaigns },
      { data: marketingBlasts },
      { data: financialEntries },
      { data: orgSettings },
      { data: orgMembers },
      { data: hrNotes },
      { data: customFieldDefs },
      { data: customFieldGroups },
      { data: pipelines },
      { data: pipelineStages },
      { data: deals },
      { data: clientContacts },
      { data: activityTimeline },
      { data: workspaceSavedViews },
    ] = await Promise.all([
      admin
        .from('bia_critical_processes')
        .select('*')
        .eq('organization_id', orgId)
        .order('last_checked_at', { ascending: false }),
      admin
        .from('pulse_incidents')
        .select('*')
        .eq('organization_id', orgId)
        .order('detected_at', { ascending: false }),
      admin
        .from('studio_approval_queues')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),
      admin
        .from('studio_audit_logs')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50),
      admin
        .from('studio_legacy_spreadsheets')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),
      admin
        .from('flow_automation_runs')
        .select('*')
        .eq('organization_id', orgId)
        .order('executed_at', { ascending: false }),
      admin
        .from('knowledge_and_runbooks')
        .select('id, organization_id, doc_category, title, content_chunk, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),
      admin
        .from('ltv_weekly_reports')
        .select('*')
        .eq('organization_id', orgId)
        .order('week_start', { ascending: false }),
      admin
        .from('governance_credentials')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),
      admin
        .from('offboarding_processes')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle(),
      admin
        .from('clients')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),
      admin
        .from('client_history_events')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),
      admin
        .from('client_team_notes')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),
      admin
        .from('task_folders')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true }),
      admin
        .from('task_lists')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true }),
      admin
        .from('task_statuses')
        .select('*')
        .eq('organization_id', orgId)
        .order('order_index', { ascending: true }),
      admin
        .from('tasks')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),
      admin
        .from('whatsapp_conversations')
        .select('*')
        .eq('organization_id', orgId)
        .order('updated_at', { ascending: false }),
      admin
        .from('paid_traffic_campaigns')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),
      admin
        .from('marketing_blasts')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),
      admin
        .from('financial_entries')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),
      admin
        .from('organization_settings')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle(),
      admin
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true }),
      admin
        .from('member_hr_notes')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true }),
      admin
        .from('custom_field_definitions')
        .select('*')
        .eq('organization_id', orgId)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true }),
      admin
        .from('custom_field_groups')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true }),
      admin
        .from('pipelines')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true }),
      admin
        .from('pipeline_stages')
        .select('*')
        .eq('organization_id', orgId)
        .order('stage_order', { ascending: true }),
      admin
        .from('deals')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),
      admin
        .from('client_contacts')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true }),
      admin
        .from('activity_timeline')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(100),
      admin
        .from('workspace_saved_views')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true }),
    ])

    const activeMembership = (memberships || []).find((m) => m.organization_id === orgId)

    // Auto-provisionamento de Pipeline e Estágios Padrão se ainda não existirem
    let finalPipelines = pipelines || []
    let finalStages = pipelineStages || []

    if (finalPipelines.length === 0) {
      try {
        const { data: createdPipe } = await admin
          .from('pipelines')
          .insert({
            organization_id: orgId,
            name: '🚀 Novos Clientes Coytech',
            is_default: true,
            color: '#0066FF',
          })
          .select('*')
          .single()

        if (createdPipe) {
          finalPipelines = [createdPipe]
          const defaultStages = [
            { organization_id: orgId, pipeline_id: createdPipe.id, name: 'Novo Lead / Diagnóstico', stage_order: 0, probability_percent: 10, color: '#38bdf8', is_won: false, is_lost: false },
            { organization_id: orgId, pipeline_id: createdPipe.id, name: 'Qualificação & BIA', stage_order: 1, probability_percent: 25, color: '#e8c14a', is_won: false, is_lost: false },
            { organization_id: orgId, pipeline_id: createdPipe.id, name: 'Reunião de Apresentação', stage_order: 2, probability_percent: 50, color: '#8f7dff', is_won: false, is_lost: false },
            { organization_id: orgId, pipeline_id: createdPipe.id, name: 'Proposta Enviada', stage_order: 3, probability_percent: 75, color: '#0066FF', is_won: false, is_lost: false },
            { organization_id: orgId, pipeline_id: createdPipe.id, name: 'Contrato Fechado', stage_order: 4, probability_percent: 100, color: '#2f9e5a', is_won: true, is_lost: false },
            { organization_id: orgId, pipeline_id: createdPipe.id, name: 'Perdido / Desqualificado', stage_order: 5, probability_percent: 0, color: '#ef4444', is_won: false, is_lost: true },
          ]
          const { data: stData } = await admin.from('pipeline_stages').insert(defaultStages).select('*')
          finalStages = stData || []
        }
      } catch (err) {
        console.warn('[coydash-sync] Auto-provisionamento de pipeline inicial:', err)
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email || '',
        name: fullName,
        role: activeMembership?.role || 'CLIENT_CEO_DIRECTOR',
      },
      currentMemberPermissions: {
        role: activeMembership?.role || 'CLIENT_CEO_DIRECTOR',
        access_type: normalizeAccessType(
          activeMembership?.access_type,
          activeMembership?.role,
          user.email
        ),
        sector: activeMembership?.sector || 'Geral',
        job_title: activeMembership?.job_title || 'Colaborador',
        allowed_screens: activeMembership?.allowed_screens || [],
        allowed_folder_ids: activeMembership?.allowed_folder_ids || [],
        allowed_list_ids: activeMembership?.allowed_list_ids || [],
        custom_permissions:
          activeMembership?.custom_permissions &&
          typeof activeMembership.custom_permissions === 'object'
            ? activeMembership.custom_permissions
            : {},
      },
      organizations: organizations || [],
      activeOrgId: orgId,
      biaProcesses: biaProcesses || [],
      incidents: incidents || [],
      approvalQueues: approvalQueues || [],
      auditLogs: auditLogs || [],
      spreadsheets: spreadsheets || [],
      flowRuns: flowRuns || [],
      knowledgeChunks: knowledgeChunks || [],
      weeklyReports: weeklyReports || [],
      credentials: credentials || [],
      offboarding: offboarding || null,
      clients: clients || [],
      clientHistoryEvents: clientHistoryEvents || [],
      clientTeamNotes: clientTeamNotes || [],
      taskFolders: taskFolders || [],
      taskLists: taskLists || [],
      taskStatuses: taskStatuses || [],
      tasks: tasks || [],
      whatsappConversations: whatsappConversations || [],
      paidCampaigns: paidCampaigns || [],
      marketingBlasts: marketingBlasts || [],
      financialEntries: financialEntries || [],
      orgSettings: orgSettings || null,
      orgMembers: orgMembers || [],
      hrNotes: hrNotes || [],
      customFieldDefs: customFieldDefs || [],
      customFieldGroups: customFieldGroups || [],
      pipelines: finalPipelines,
      pipelineStages: finalStages,
      deals: deals || [],
      clientContacts: clientContacts || [],
      activityTimeline: activityTimeline || [],
      savedViews: workspaceSavedViews || [],
    })
  } catch (error) {
    console.error('Erro em GET /api/coydash/sync:', error)
    return NextResponse.json({ error: 'Falha ao sincronizar com o banco' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const admin = createAdminClient()
    const body = await request.json()
    const { action, orgId, payload } = body
    const actorName =
      (user.user_metadata?.full_name as string) ||
      user.email?.split('@')[0] ||
      'Usuário'

    let actorMemberRow: Record<string, unknown> | null = null
    if (orgId) {
      const { data: mRow } = await admin
        .from('organization_members')
        .select('role, access_type, custom_permissions')
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .maybeSingle()
      actorMemberRow = (mRow as Record<string, unknown>) || null
    }

    const actorCtx: UserPermissionContext = {
      userId: user.id,
      email: user.email,
      name: actorName,
      role: (actorMemberRow?.role as string) || null,
      access_type: (actorMemberRow?.access_type as string) || null,
      custom_permissions:
        actorMemberRow?.custom_permissions &&
        typeof actorMemberRow.custom_permissions === 'object'
          ? (actorMemberRow.custom_permissions as Record<string, boolean>)
          : {},
    }

    const denyPerm = (msg: string) =>
      NextResponse.json({ error: msg }, { status: 403 })

    switch (action) {
      case 'CREATE_ORG': {
        const name = (payload?.name as string)?.trim() || 'Nova Operação'
        const sector = (payload?.sector as string)?.trim() || 'Operações B2B'
        const tier = payload?.tier === 'ENTERPRISE' ? 'ENTERPRISE' : 'MID_MARKET'
        const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`
        const qbrDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        const { data: createdOrg, error } = await admin
          .from('organizations')
          .insert({
            name,
            slug,
            sector,
            tier,
            current_stage: 'STAGE_1_ONBOARDING',
            litellm_virtual_key_id: `sk-coytech-${slug.slice(0, 16)}`,
            litellm_monthly_budget: 2500,
            litellm_current_spend: 0,
            monthly_mrr_value: Number(payload?.mrr) || 0,
            setup_fee_value: Number(payload?.setupFee) || 0,
            hourly_revenue_avg: Number(payload?.hourlyRevenue) || 0,
            hourly_revenue_live: Number(payload?.hourlyRevenue) || 0,
            conversion_rate_avg: 3.2,
            conversion_rate_live: 3.2,
            next_qbr_date: qbrDate,
          })
          .select('*')
          .single()

        if (error || !createdOrg) {
          return NextResponse.json({ error: error?.message || 'Erro ao criar organização' }, { status: 400 })
        }

        await admin.from('organization_members').insert({
          organization_id: createdOrg.id,
          user_id: user.id,
          full_name: actorName,
          email: user.email,
          role: 'CLIENT_CEO_DIRECTOR',
          receive_monday_8am_report: true,
          receive_critical_bia_alerts: true,
        })

        await admin.from('offboarding_processes').insert({
          organization_id: createdOrg.id,
          passive_plan_offered: false,
          retained_on_passive_plan: false,
        })

        return NextResponse.json({ ok: true, organization: createdOrg })
      }

      case 'UPDATE_ORG': {
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (payload.current_stage !== undefined) updates.current_stage = payload.current_stage
        if (payload.litellm_monthly_budget !== undefined)
          updates.litellm_monthly_budget = Number(payload.litellm_monthly_budget)
        if (payload.monthly_mrr_value !== undefined)
          updates.monthly_mrr_value = Number(payload.monthly_mrr_value)
        if (payload.hourly_revenue_live !== undefined)
          updates.hourly_revenue_live = Number(payload.hourly_revenue_live)
        if (payload.hourly_revenue_avg !== undefined)
          updates.hourly_revenue_avg = Number(payload.hourly_revenue_avg)
        if (payload.conversion_rate_live !== undefined)
          updates.conversion_rate_live = Number(payload.conversion_rate_live)
        if (payload.google_drive_folder_url !== undefined)
          updates.google_drive_folder_url = payload.google_drive_folder_url
        if (payload.whatsapp_group_jid !== undefined)
          updates.whatsapp_group_jid = payload.whatsapp_group_jid

        const { data, error } = await admin
          .from('organizations')
          .update(updates)
          .eq('id', orgId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      // =====================================================================
      // CENTRAL DE CLIENTES 360º
      // =====================================================================
      case 'CREATE_CLIENT': {
        const todayLabel = new Date().toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
        const { data: created, error } = await admin
          .from('clients')
          .insert({
            organization_id: orgId,
            name: payload.name,
            cnpj: payload.cnpj || '',
            sector: payload.sector || 'Advocacia / Serviços',
            team_squad: payload.team_squad || 'Sparta',
            priority: payload.priority || 'medium',
            status: payload.status || 'ONBOARDING',
            ad_platform: payload.ad_platform || 'BOTH',
            service_type: payload.service_type || 'Tráfego + IA',
            is_mc: payload.is_mc !== undefined ? Boolean(payload.is_mc) : true,
            nps_score: payload.nps_score !== undefined ? Number(payload.nps_score) : 9,
            last_optimization_date: payload.last_optimization_date || todayLabel,
            ad_spend: Number(payload.ad_spend) || 0,
            ad_results: Number(payload.ad_results) || 0,
            ad_cpr: Number(payload.ad_cpr) || 0,
            ad_balance: Number(payload.ad_balance) || 0,
            mrr_value: Number(payload.mrr_value) || 0,
            setup_fee: Number(payload.setup_fee) || 0,
            traffic_manager_name: payload.traffic_manager_name || actorName,
            designer_name: payload.designer_name || '',
            cs_manager_name: payload.cs_manager_name || actorName,
            contact_name: payload.contact_name || '',
            contact_phone: payload.contact_phone || '',
            contact_email: payload.contact_email || '',
            whatsapp_group_link: payload.whatsapp_group_link || '',
            drive_folder_link: payload.drive_folder_link || '',
            connections: payload.connections || {
              meta: 'connected',
              google: 'connected',
              whatsapp: 'connected',
              ai: 'connected',
              crm: 'connected',
              finance: 'connected',
            },
            briefing_data: payload.briefing_data || {},
            commercial_data: payload.commercial_data || {},
            backups_data: payload.backups_data || {},
            agenda_items: payload.agenda_items || [],
          })
          .select('*')
          .single()

        if (error || !created) {
          return NextResponse.json({ error: error?.message || 'Erro ao criar cliente' }, { status: 400 })
        }

        // Registra eventos iniciais no Histórico do Cliente
        const initialEvents = [
          {
            organization_id: orgId,
            client_id: created.id,
            event_type: 'CREATION',
            title: `Cliente cadastrado no painel (${created.status === 'ONBOARDING' ? 'Onboarding' : created.status === 'ACTIVE' ? 'Ativo' : 'Aviso de Churn'})`,
            description: `Time atribuído: ${created.team_squad}`,
            actor_name: actorName,
          },
        ]

        if (created.traffic_manager_name) {
          initialEvents.push({
            organization_id: orgId,
            client_id: created.id,
            event_type: 'ASSIGNEE_CHANGE',
            title: `Responsável (Gestor de Tráfego): ${created.traffic_manager_name}`,
            description: '',
            actor_name: actorName,
          })
        }

        if (created.cs_manager_name) {
          initialEvents.push({
            organization_id: orgId,
            client_id: created.id,
            event_type: 'ASSIGNEE_CHANGE',
            title: `Responsável (Customer Success): ${created.cs_manager_name}`,
            description: '',
            actor_name: actorName,
          })
        }

        await admin.from('client_history_events').insert(initialEvents)

        return NextResponse.json({ ok: true, data: created })
      }

      case 'UPDATE_CLIENT': {
        const { clientId, updates, historyEventTitle, historyEventDesc } = payload
        const { data: updated, error } = await admin
          .from('clients')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', clientId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })

        if (historyEventTitle) {
          await admin.from('client_history_events').insert({
            organization_id: orgId,
            client_id: clientId,
            event_type: 'UPDATE',
            title: historyEventTitle,
            description: historyEventDesc || '',
            actor_name: actorName,
          })
        }

        return NextResponse.json({ ok: true, data: updated })
      }

      case 'DELETE_CLIENT': {
        await admin.from('clients').delete().eq('id', payload.clientId)
        return NextResponse.json({ ok: true })
      }

      case 'ADD_CLIENT_NOTE': {
        const { data, error } = await admin
          .from('client_team_notes')
          .insert({
            organization_id: orgId,
            client_id: payload.client_id || payload.clientId,
            note_type: payload.note_type || 'GERAL',
            content: payload.content,
            author_name: actorName,
          })
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'DELETE_CLIENT_NOTE': {
        await admin.from('client_team_notes').delete().eq('id', payload.noteId)
        return NextResponse.json({ ok: true })
      }

      // =====================================================================
      // SETORES, PROJETOS E TAREFAS (SISTEMA DO ROOMIE OFFICE AI)
      // =====================================================================
      case 'CREATE_TASK_FOLDER': {
        if (!hasFeaturePermission(actorCtx, 'tasks.manage_structure')) {
          return denyPerm('Seu nível de acesso não permite criar pastas de setor.')
        }
        const folderName = String(payload.name || '').trim()
        if (!folderName) {
          return NextResponse.json({ error: 'Nome da pasta obrigatório' }, { status: 400 })
        }

        // Previne duplicação concorrente/duplo clique
        const { data: existingFolder } = await admin
          .from('task_folders')
          .select('*')
          .eq('organization_id', orgId)
          .ilike('name', folderName)
          .maybeSingle()

        if (existingFolder) {
          return NextResponse.json({ ok: true, data: existingFolder, folder: existingFolder })
        }

        const { data: folder, error } = await admin
          .from('task_folders')
          .insert({
            organization_id: orgId,
            name: folderName,
            icon: payload.icon || 'Folder',
          })
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data: folder, folder })
      }

      case 'UPDATE_TASK_FOLDER': {
        const { data, error } = await admin
          .from('task_folders')
          .update({ name: payload.name, ...(payload.icon ? { icon: payload.icon } : {}) })
          .eq('id', payload.folderId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'DELETE_TASK_FOLDER': {
        if (!hasFeaturePermission(actorCtx, 'tasks.manage_structure')) {
          return denyPerm('Seu nível de acesso não permite excluir pastas de setor.')
        }
        await admin.from('task_folders').delete().eq('id', payload.folderId)
        return NextResponse.json({ ok: true })
      }

      case 'CREATE_TASK_LIST': {
        if (!hasFeaturePermission(actorCtx, 'tasks.manage_structure')) {
          return denyPerm('Seu nível de acesso não permite criar listas de projetos.')
        }
        const listName = String(payload.name || '').trim()
        const folderId = String(payload.folder_id || '')
        if (!listName || !folderId) {
          return NextResponse.json({ error: 'Nome e pasta obrigatórios' }, { status: 400 })
        }

        // Previne duplicação concorrente/duplo clique na mesma pasta
        const { data: existingList } = await admin
          .from('task_lists')
          .select('*')
          .eq('organization_id', orgId)
          .eq('folder_id', folderId)
          .ilike('name', listName)
          .maybeSingle()

        if (existingList) {
          return NextResponse.json({ ok: true, data: existingList, list: existingList })
        }

        const { data: listData, error } = await admin
          .from('task_lists')
          .insert({
            organization_id: orgId,
            folder_id: folderId,
            name: listName,
            icon: payload.icon || 'ListTodo',
          })
          .select('*')
          .single()

        if (error || !listData) {
          return NextResponse.json({ error: error?.message || 'Erro ao criar lista' }, { status: 400 })
        }

        // Cria as 3 colunas padrão do Kanban para esta lista
        await admin.from('task_statuses').insert([
          {
            organization_id: orgId,
            list_id: listData.id,
            name: 'A Fazer',
            color: '#6B7280',
            order_index: 0,
          },
          {
            organization_id: orgId,
            list_id: listData.id,
            name: 'Em Progresso',
            color: '#0066FF',
            order_index: 1,
          },
          {
            organization_id: orgId,
            list_id: listData.id,
            name: 'Concluído',
            color: '#2F9E5A',
            order_index: 2,
          },
        ])

        return NextResponse.json({ ok: true, data: listData, list: listData })
      }

      case 'UPDATE_TASK_LIST': {
        const { data, error } = await admin
          .from('task_lists')
          .update({ name: payload.name })
          .eq('id', payload.listId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'DELETE_TASK_LIST': {
        if (!hasFeaturePermission(actorCtx, 'tasks.manage_structure')) {
          return denyPerm('Seu nível de acesso não permite excluir listas de projetos.')
        }
        await admin.from('task_lists').delete().eq('id', payload.listId)
        return NextResponse.json({ ok: true })
      }

      case 'CREATE_TASK_STATUS': {
        if (!hasFeaturePermission(actorCtx, 'tasks.manage_columns')) {
          return denyPerm('Seu nível de acesso não permite gerenciar colunas Kanban.')
        }
        const { data, error } = await admin
          .from('task_statuses')
          .insert({
            organization_id: orgId,
            list_id: payload.list_id,
            name: payload.name,
            color: payload.color || '#0066FF',
            order_index: Number(payload.order_index) || 0,
          })
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'UPDATE_TASK_STATUS_COLUMN': {
        const { data, error } = await admin
          .from('task_statuses')
          .update({
            name: payload.name,
            color: payload.color,
            ...(payload.order_index !== undefined ? { order_index: Number(payload.order_index) } : {}),
          })
          .eq('id', payload.statusId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'DELETE_TASK_STATUS_COLUMN': {
        if (!hasFeaturePermission(actorCtx, 'tasks.manage_columns')) {
          return denyPerm('Seu nível de acesso não permite excluir colunas Kanban.')
        }
        await admin.from('task_statuses').delete().eq('id', payload.statusId)
        return NextResponse.json({ ok: true })
      }

      case 'CREATE_TASK': {
        if (!hasFeaturePermission(actorCtx, 'tasks.create')) {
          return denyPerm('Seu nível de permissão atual é somente leitura/comentário e não cria tarefas.')
        }
        const creator = actorName || user.email || 'Usuário'
        let initialAssignees: string[] = []
        if (Array.isArray(payload.assignees)) {
          initialAssignees = (payload.assignees as unknown[]).map((a) => String(a).trim()).filter(Boolean)
        } else if (payload.assignee_name) {
          initialAssignees = String(payload.assignee_name).split(',').map((s) => s.trim()).filter(Boolean)
        }

        // Em tarefas novas sem responsáveis informados, atribui automaticamente ao criador
        if (initialAssignees.length === 0 && !payload.allow_empty_assignees) {
          initialAssignees = [creator]
        }

        const finalAssigneeName = initialAssignees.join(', ')

        const { data, error } = await admin
          .from('tasks')
          .insert({
            organization_id: orgId,
            list_id: payload.list_id || null,
            client_id: payload.client_id || null,
            client_name_snapshot: payload.client_name_snapshot || '',
            status_id: payload.status_id || null,
            status_key: payload.status_key || 'A Fazer',
            title: payload.title,
            description: payload.description || '',
            priority: payload.priority || 'medium',
            assignee_name: finalAssigneeName,
            assignees: initialAssignees,
            start_date: payload.start_date || null,
            due_date: payload.due_date || null,
            time_estimate: payload.time_estimate || null,
            time_spent_seconds: Number(payload.time_spent_seconds || 0),
            is_tracking_time: Boolean(payload.is_tracking_time),
            tags: Array.isArray(payload.tags) ? payload.tags : [],
            custom_fields: Array.isArray(payload.custom_fields) ? payload.custom_fields : [],
            subtasks: [],
            comments: Array.isArray(payload.comments) ? payload.comments : [],
            attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
            links: Array.isArray(payload.links) ? payload.links : [],
            linked_task_ids: Array.isArray(payload.linked_task_ids) ? payload.linked_task_ids : [],
            parent_task_id: payload.parent_task_id || null,
            origin_reference: payload.origin_reference || '',
            created_by_user_id: user.id,
            created_by_name: creator,
            is_archived: false,
          })
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'UPDATE_TASK': {
        const { taskId, updates } = payload
        const allowedKeys = new Set([
          'title',
          'description',
          'priority',
          'status_key',
          'status_id',
          'list_id',
          'client_id',
          'client_name_snapshot',
          'assignee_name',
          'assignees',
          'start_date',
          'due_date',
          'time_estimate',
          'time_spent_seconds',
          'is_tracking_time',
          'tags',
          'custom_fields',
          'subtasks',
          'comments',
          'attachments',
          'links',
          'linked_task_ids',
          'parent_task_id',
          'origin_reference',
          'is_archived',
        ])
        const cleanUpdates: Record<string, unknown> = {}
        if (updates && typeof updates === 'object') {
          for (const [k, v] of Object.entries(updates as Record<string, unknown>)) {
            if (allowedKeys.has(k) && v !== undefined) {
              cleanUpdates[k] = v
            }
          }
        }
        if (cleanUpdates.is_archived !== undefined) {
          const { data: targetTask } = await admin
            .from('tasks')
            .select('created_by_user_id, created_by_name')
            .eq('id', taskId)
            .maybeSingle()
          if (!canUserArchiveTask(actorCtx, targetTask)) {
            return denyPerm(
              'Apenas quem criou a tarefa, um Convidado Gerente ou Membro pode arquivar/restaurar esta tarefa.'
            )
          }
          const archiveFlag = Boolean(cleanUpdates.is_archived)
          cleanUpdates.is_archived = archiveFlag
          cleanUpdates.archived_at = archiveFlag ? new Date().toISOString() : null
          cleanUpdates.archived_by_user_id = archiveFlag ? user.id : null
        }
        if (Array.isArray(cleanUpdates.assignees) && cleanUpdates.assignee_name === undefined) {
          cleanUpdates.assignee_name = (cleanUpdates.assignees as string[]).join(', ')
        }

        const { data, error } = await admin
          .from('tasks')
          .update(cleanUpdates)
          .eq('id', taskId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'ARCHIVE_TASK': {
        const taskId = String(payload.taskId || '')
        const archived = Boolean(payload.archived)
        const { data: targetTask } = await admin
          .from('tasks')
          .select('id, created_by_user_id, created_by_name')
          .eq('id', taskId)
          .maybeSingle()

        if (!targetTask) {
          return NextResponse.json({ error: 'Tarefa não encontrada.' }, { status: 404 })
        }
        if (!canUserArchiveTask(actorCtx, targetTask)) {
          return denyPerm(
            'Apenas quem criou a tarefa, um Convidado Gerente ou Membro pode arquivar esta tarefa.'
          )
        }

        const { data, error } = await admin
          .from('tasks')
          .update({
            is_archived: archived,
            archived_at: archived ? new Date().toISOString() : null,
            archived_by_user_id: archived ? user.id : null,
          })
          .eq('id', taskId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'ADD_TASK_COMMENT': {
        const { taskId, comment } = payload
        const { data: currentTask, error: fetchErr } = await admin
          .from('tasks')
          .select('comments')
          .eq('id', taskId)
          .single()

        if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 400 })

        const currentComments = Array.isArray(currentTask?.comments) ? currentTask.comments : []
        const updatedComments = [...currentComments, comment]

        const { data, error } = await admin
          .from('tasks')
          .update({ comments: updatedComments })
          .eq('id', taskId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'DELETE_TASK': {
        const { data: targetTask } = await admin
          .from('tasks')
          .select('id, created_by_user_id, created_by_name')
          .eq('id', payload.taskId)
          .maybeSingle()

        if (!canUserDeleteTask(actorCtx, targetTask)) {
          return denyPerm(
            'Apenas quem criou a tarefa, um Convidado Gerente ou Membro autorizado pode excluir esta tarefa.'
          )
        }

        const { error } = await admin.from('tasks').delete().eq('id', payload.taskId)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true })
      }

      case 'CREATE_CUSTOM_FIELD_DEF': {
        if (!hasFeaturePermission(actorCtx, 'custom_fields.manage')) {
          return denyPerm('Seu nível de acesso não permite criar campos personalizados.')
        }
        const scope = payload.scope || 'list'
        const targetTaskIds = Array.isArray(payload.target_task_ids)
          ? (payload.target_task_ids as unknown[]).map((id) => String(id)).filter(Boolean)
          : []
        const rawGroupId = payload.group_id ? String(payload.group_id) : ''
        const safeGroupId = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(rawGroupId) ? rawGroupId : null
        const { data, error } = await admin
          .from('custom_field_definitions')
          .insert({
            organization_id: orgId,
            list_id: scope === 'list' ? (payload.list_id || null) : null,
            target_task_ids: scope === 'task' ? targetTaskIds : [],
            name: String(payload.name || '').trim(),
            type: payload.type || 'text',
            options: Array.isArray(payload.options) ? payload.options : [],
            scope,
            description: String(payload.description || ''),
            default_value: String(payload.default_value || ''),
            group_id: safeGroupId,
            order_index: Number(payload.order_index || 0),
            cover_image: String(payload.cover_image || ''),
            is_required: Boolean(payload.is_required),
          })
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'UPDATE_CUSTOM_FIELD_DEF': {
        if (!hasFeaturePermission(actorCtx, 'custom_fields.manage')) {
          return denyPerm('Seu nível de acesso não permite editar definições de campos.')
        }
        const { defId, updates } = payload
        const allowed = new Set([
          'name',
          'type',
          'options',
          'scope',
          'list_id',
          'target_task_ids',
          'is_required',
          'description',
          'default_value',
          'group_id',
          'order_index',
          'cover_image',
        ])
        const cleanUpdates: Record<string, unknown> = {}
        if (updates && typeof updates === 'object') {
          for (const [k, v] of Object.entries(updates as Record<string, unknown>)) {
            if (allowed.has(k) && v !== undefined) {
              cleanUpdates[k] = v
            }
          }
        }
        if (cleanUpdates.scope === 'template') {
          cleanUpdates.list_id = null
          cleanUpdates.target_task_ids = []
        } else if (cleanUpdates.scope === 'list') {
          cleanUpdates.target_task_ids = []
        } else if (cleanUpdates.scope === 'task') {
          cleanUpdates.list_id = null
        }

        const { data, error } = await admin
          .from('custom_field_definitions')
          .update(cleanUpdates)
          .eq('id', defId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'CREATE_CUSTOM_FIELD_GROUP': {
        if (!hasFeaturePermission(actorCtx, 'custom_fields.manage')) {
          return denyPerm('Seu nível de acesso não permite criar grupos modelos.')
        }
        const { data, error } = await admin
          .from('custom_field_groups')
          .insert({
            organization_id: orgId,
            name: String(payload.name || '').trim(),
            description: String(payload.description || ''),
            cover_image: String(payload.cover_image || '/images/custom-field-banner.jpg'),
            fields: Array.isArray(payload.fields) ? payload.fields : [],
            is_system_template: false,
          })
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'UPDATE_CUSTOM_FIELD_GROUP': {
        const { groupId, updates } = payload
        const cleanUpdates: Record<string, unknown> = {}
        if (updates?.name !== undefined) cleanUpdates.name = String(updates.name).trim()
        if (updates?.description !== undefined) cleanUpdates.description = String(updates.description)
        if (updates?.cover_image !== undefined) cleanUpdates.cover_image = String(updates.cover_image)
        if (Array.isArray(updates?.fields)) cleanUpdates.fields = updates.fields

        const { data, error } = await admin
          .from('custom_field_groups')
          .update(cleanUpdates)
          .eq('id', groupId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'DELETE_CUSTOM_FIELD_GROUP': {
        const { error } = await admin
          .from('custom_field_groups')
          .delete()
          .eq('id', payload.groupId)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true })
      }

      case 'APPLY_CUSTOM_FIELD_GROUP': {
        if (!hasFeaturePermission(actorCtx, 'custom_fields.manage')) {
          return denyPerm('Seu nível de acesso não permite aplicar grupos modelos.')
        }
        const scope = payload.scope || 'list'
        const listId = scope === 'list' ? (payload.list_id || null) : null
        const targetTaskIds =
          scope === 'task' && Array.isArray(payload.target_task_ids)
            ? (payload.target_task_ids as unknown[]).map((id) => String(id)).filter(Boolean)
            : []
        const rawGroupId = payload.groupId ? String(payload.groupId) : ''
        const safeGroupId = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(rawGroupId) ? rawGroupId : null
        const groupFields = Array.isArray(payload.fields) ? payload.fields : []
        const createdDefs: unknown[] = []

        for (let idx = 0; idx < groupFields.length; idx++) {
          const gf = groupFields[idx] as Record<string, unknown>
          const fieldName = String(gf.name || '').trim()
          if (!fieldName) continue

          const { data: created, error } = await admin
            .from('custom_field_definitions')
            .insert({
              organization_id: orgId,
              list_id: listId,
              target_task_ids: targetTaskIds,
              name: fieldName,
              type: String(gf.type || 'text'),
              options: Array.isArray(gf.options) ? gf.options : [],
              scope,
              description: String(gf.description || ''),
              default_value: String(gf.default_value || ''),
              group_id: safeGroupId,
              order_index: idx,
              cover_image: String(payload.cover_image || ''),
              is_required: Boolean(gf.is_required),
            })
            .select('*')
            .single()

          if (!error && created) {
            createdDefs.push(created)
          }
        }

        return NextResponse.json({ ok: true, data: createdDefs })
      }

      case 'DELETE_CUSTOM_FIELD_DEF': {
        if (!hasFeaturePermission(actorCtx, 'custom_fields.manage')) {
          return denyPerm('Seu nível de acesso não permite excluir campos personalizados.')
        }
        const defId = payload.defId ? String(payload.defId) : ''
        let targetName = payload.fieldName ? String(payload.fieldName) : ''
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(defId)

        if (isUuid) {
          const { data: defRow } = await admin
            .from('custom_field_definitions')
            .select('name')
            .eq('id', defId)
            .maybeSingle()
          if (defRow?.name && !targetName) targetName = String(defRow.name)
          await admin.from('custom_field_definitions').delete().eq('id', defId)
        }

        // Remove valores desse campo das tarefas para evitar reaparecimento como campo órfão
        if (defId || targetName) {
          const { data: orgTasks } = await admin
            .from('tasks')
            .select('id, custom_fields')
            .eq('organization_id', orgId)

          for (const t of orgTasks || []) {
            if (!Array.isArray(t.custom_fields) || t.custom_fields.length === 0) continue
            const filtered = t.custom_fields.filter((cf: Record<string, unknown>) => {
              const matchId = defId && cf.field_id === defId
              const matchName =
                targetName &&
                typeof cf.field_name === 'string' &&
                cf.field_name.toLowerCase() === targetName.toLowerCase()
              return !matchId && !matchName
            })
            if (filtered.length !== t.custom_fields.length) {
              await admin.from('tasks').update({ custom_fields: filtered }).eq('id', t.id)
            }
          }
        }

        return NextResponse.json({ ok: true, deletedId: defId })
      }

      // =====================================================================
      // MÓDULOS OPERACIONAIS DO RANGOLIVRE:
      // ATENDIMENTO WHATSAPP, TRÁFEGO PAGO, MARKETING, FINANCEIRO E CONFIG
      // =====================================================================
      case 'CREATE_WHATSAPP_CONV': {
        const { data, error } = await admin
          .from('whatsapp_conversations')
          .insert({
            organization_id: orgId,
            client_id: payload.client_id || null,
            contact_name: payload.contact_name,
            contact_phone: payload.contact_phone,
            handoff_to_human: Boolean(payload.handoff_to_human),
            orders_count: Number(payload.orders_count) || 1,
            total_spent: Number(payload.total_spent) || 0,
            cashback_balance: Number(payload.cashback_balance) || 0,
            ai_memory: payload.ai_memory || [],
            draft_order: payload.draft_order || null,
            draft_accepted: false,
            messages: payload.messages || [],
            last_message_at:
              new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          })
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'UPDATE_WHATSAPP_CONV': {
        const { convId, updates } = payload
        const { data, error } = await admin
          .from('whatsapp_conversations')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', convId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'DELETE_WHATSAPP_CONV': {
        await admin.from('whatsapp_conversations').delete().eq('id', payload.convId)
        return NextResponse.json({ ok: true })
      }

      case 'CREATE_PAID_CAMPAIGN': {
        const { data, error } = await admin
          .from('paid_traffic_campaigns')
          .insert({
            organization_id: orgId,
            client_id: payload.client_id || null,
            campaign_name: payload.campaign_name,
            platform: payload.platform || 'Meta Ads',
            note: payload.note || 'Campanha ativa em otimização',
            daily_budget: Number(payload.daily_budget) || 50,
            spent_week: Number(payload.spent_week) || 350,
            ctr_percent: Number(payload.ctr_percent) || 2.6,
            conversions_count: Number(payload.conversions_count) || 18,
            revenue_attributed: Number(payload.revenue_attributed) || 2400,
            roas: Number(payload.roas) || 6.8,
            is_champion_offer:
              payload.is_champion_offer !== undefined ? Boolean(payload.is_champion_offer) : true,
            status: payload.status || 'Ativa',
          })
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'UPDATE_PAID_CAMPAIGN': {
        const { data, error } = await admin
          .from('paid_traffic_campaigns')
          .update(payload.updates)
          .eq('id', payload.campaignId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'DELETE_PAID_CAMPAIGN': {
        await admin.from('paid_traffic_campaigns').delete().eq('id', payload.campaignId)
        return NextResponse.json({ ok: true })
      }

      case 'CREATE_MARKETING_BLAST': {
        const { data, error } = await admin
          .from('marketing_blasts')
          .insert({
            organization_id: orgId,
            campaign_name: payload.campaign_name,
            segment_label: payload.segment_label,
            scheduled_for: payload.scheduled_for || 'Hoje 18h30',
            delivered_count: Number(payload.delivered_count) || 0,
            read_count: Number(payload.read_count) || 0,
            conversions_count: Number(payload.conversions_count) || 0,
          })
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'DELETE_MARKETING_BLAST': {
        await admin.from('marketing_blasts').delete().eq('id', payload.blastId)
        return NextResponse.json({ ok: true })
      }

      case 'CREATE_FINANCIAL_ENTRY': {
        const { data, error } = await admin
          .from('financial_entries')
          .insert({
            organization_id: orgId,
            item_name: payload.item_name,
            category: payload.category || 'RECEITA_SERVICO',
            channel: payload.channel || 'WhatsApp IA',
            quantity_sold: Number(payload.quantity_sold) || 1,
            margin_percent: Number(payload.margin_percent) || 65,
            amount_value: Number(payload.amount_value) || 0,
            health_tag: payload.health_tag || 'Estrela',
          })
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'DELETE_FINANCIAL_ENTRY': {
        await admin.from('financial_entries').delete().eq('id', payload.entryId)
        return NextResponse.json({ ok: true })
      }

      case 'UPSERT_ORG_SETTINGS': {
        const { data, error } = await admin
          .from('organization_settings')
          .upsert(
            {
              organization_id: orgId,
              ...payload.settings,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'organization_id' }
          )
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'INVITE_TEAM_MEMBER': {
        if (!hasFeaturePermission(actorCtx, 'team.manage_members')) {
          return denyPerm('Apenas administradores ou perfis autorizados podem conceder acessos.')
        }
        const cleanEmail = String(payload.email || '').trim().toLowerCase()
        const rawPassword = typeof payload.password === 'string' ? payload.password : ''
        if (!cleanEmail) {
          return NextResponse.json({ error: 'E-mail do colaborador é obrigatório' }, { status: 400 })
        }
        if (rawPassword && rawPassword.length < 6) {
          return NextResponse.json({ error: 'A senha precisa ter pelo menos 6 caracteres' }, { status: 400 })
        }

        let targetUserId: string | null = null
        let targetUserName = String(payload.full_name || '').trim() || cleanEmail.split('@')[0]
        let targetUserPhone = ''
        let passwordCreatedOrUpdated = false

        try {
          const { data: userList } = await admin.auth.admin.listUsers()
          const matchedUser = userList?.users?.find(
            (u) => u.email?.toLowerCase() === cleanEmail
          )
          if (matchedUser) {
            targetUserId = matchedUser.id
            targetUserName =
              String(payload.full_name || '').trim() ||
              (matchedUser.user_metadata?.full_name as string) ||
              (matchedUser.user_metadata?.name as string) ||
              targetUserName
            targetUserPhone =
              (matchedUser.user_metadata?.whatsapp_phone as string) ||
              (matchedUser.user_metadata?.whatsapp as string) ||
              (matchedUser.user_metadata?.phone as string) ||
              matchedUser.phone ||
              ''

            if (rawPassword && rawPassword.length >= 6) {
              const { error: updErr } = await admin.auth.admin.updateUserById(matchedUser.id, {
                password: rawPassword,
                email_confirm: true,
                ...(payload.full_name ? { user_metadata: { ...matchedUser.user_metadata, full_name: payload.full_name } } : {}),
              })
              if (!updErr) passwordCreatedOrUpdated = true
            }
          } else if (rawPassword && rawPassword.length >= 6) {
            // Cria a conta imediatamente no Supabase Auth com e-mail e senha definidos
            const { data: createdAuth, error: createAuthErr } = await admin.auth.admin.createUser({
              email: cleanEmail,
              password: rawPassword,
              email_confirm: true,
              user_metadata: {
                full_name: targetUserName,
                organization_id: orgId,
              },
            })
            if (createAuthErr) {
              return NextResponse.json(
                { error: `Erro ao criar login do colaborador: ${createAuthErr.message}` },
                { status: 400 }
              )
            }
            if (createdAuth?.user) {
              targetUserId = createdAuth.user.id
              passwordCreatedOrUpdated = true
            }
          }
        } catch (e) {
          console.warn('Aviso ao consultar/criar usuário no auth:', e)
        }

        const token = crypto.randomUUID()
        const validAccessLevels = new Set(['ADMIN', 'MEMBER', 'GUEST_MANAGER', 'GUEST_COLLABORATOR', 'GUEST'])
        const rawAccess = String(payload.access_type || 'GUEST').trim().toUpperCase()
        const accessType = validAccessLevels.has(rawAccess) ? rawAccess : 'GUEST'
        const allowedScreens = Array.isArray(payload.allowed_screens) ? payload.allowed_screens : []
        const allowedFolderIds = Array.isArray(payload.allowed_folder_ids) ? payload.allowed_folder_ids : []
        const allowedListIds = Array.isArray(payload.allowed_list_ids) ? payload.allowed_list_ids : []
        const customPermissions =
          payload.custom_permissions && typeof payload.custom_permissions === 'object'
            ? payload.custom_permissions
            : {}

        const memberPayload: Record<string, unknown> = {
          organization_id: orgId,
          full_name: payload.full_name || targetUserName,
          email: cleanEmail,
          whatsapp_phone: payload.whatsapp_phone || payload.whatsapp || targetUserPhone,
          role: payload.role || 'CLIENT_OPERATIONS',
          access_type: accessType,
          sector: payload.sector || 'Geral',
          job_title: payload.job_title || 'Colaborador',
          birth_date: payload.birth_date || null,
          contract_type: payload.contract_type || 'PJ',
          hiring_date: payload.hiring_date || new Date().toISOString().split('T')[0],
          salary_amount: Number(payload.salary_amount) || 0,
          payment_info: payload.payment_info || '',
          work_regime: payload.work_regime || 'REMOTO',
          member_status: payload.member_status || (targetUserId ? 'ACTIVE' : 'INVITED'),
          emergency_contact: payload.emergency_contact || '',
          contract_document_url: payload.contract_document_url || '',
          allowed_screens: allowedScreens,
          allowed_folder_ids: allowedFolderIds,
          allowed_list_ids: allowedListIds,
          custom_permissions: customPermissions,
          invitation_token: token,
        }

        if (targetUserId) {
          memberPayload.user_id = targetUserId
        }

        // Tenta inserir na tabela organization_members
        let memberData = null
        const { data: inserted, error: insertErr } = await admin
          .from('organization_members')
          .insert(memberPayload)
          .select('*')
          .single()

        if (insertErr) {
          // Se falhou por já existir ou falta de colunas da migration, tenta atualizar ou fallback
          const { data: updated, error: updateErr } = await admin
            .from('organization_members')
            .update(memberPayload)
            .eq('organization_id', orgId)
            .eq('email', cleanEmail)
            .select('*')
            .maybeSingle()

          if (updateErr || !updated) {
            const { data: fallback, error: fallbackErr } = await admin
              .from('organization_members')
              .insert({
                organization_id: orgId,
                user_id: targetUserId || user.id,
                full_name: payload.full_name,
                email: cleanEmail,
                whatsapp_phone: payload.whatsapp_phone || payload.whatsapp || '',
                role: payload.role || 'CLIENT_OPERATIONS',
              })
              .select('*')
              .single()

            if (fallbackErr) {
              return NextResponse.json({ error: fallbackErr.message }, { status: 400 })
            }
            memberData = fallback
          } else {
            memberData = updated
          }
        } else {
          memberData = inserted
        }

        // Registra convite na tabela workspace_invitations
        try {
          await admin.from('workspace_invitations').insert({
            organization_id: orgId,
            email: cleanEmail,
            full_name: payload.full_name || cleanEmail.split('@')[0],
            sector: payload.sector || 'Geral',
            job_title: payload.job_title || 'Colaborador',
            access_type: accessType,
            allowed_screens: allowedScreens,
            allowed_folder_ids: allowedFolderIds,
            allowed_list_ids: allowedListIds,
            token,
            invited_by: user.id,
            status: targetUserId ? 'ACCEPTED' : 'PENDING',
          })
        } catch (invErr) {
          console.warn('Aviso ao registrar workspace_invitations:', invErr)
        }

        // Disparo oficial de convite por e-mail via Supabase Auth
        let emailSent = false
        let actionLink: string | null = null
        const directLoginUrl = `${request.nextUrl.origin}/login?invited=true&email=${encodeURIComponent(cleanEmail)}`

        try {
          if (!targetUserId) {
            // Usuário ainda não tem conta no Supabase: dispara e-mail de convite
            const { data: inviteRes, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(cleanEmail, {
              data: {
                full_name: payload.full_name || '',
                organization_id: orgId,
              },
              redirectTo: directLoginUrl,
            })
            if (!inviteErr && inviteRes?.user) {
              emailSent = true
            } else if (inviteErr) {
              console.warn('Supabase inviteUserByEmail retorno:', inviteErr.message)
            }
          } else {
            // Usuário já possui conta: gera magic link para login direto em 1 clique
            const { data: linkRes } = await admin.auth.admin.generateLink({
              type: 'magiclink',
              email: cleanEmail,
              options: {
                redirectTo: directLoginUrl,
              },
            })
            if (linkRes?.properties?.action_link) {
              actionLink = linkRes.properties.action_link
            }
          }
        } catch (mailErr) {
          console.warn('Erro ao processar convite por e-mail no auth:', mailErr)
        }

        // Disparo de notificação via n8n (se webhook configurado)
        try {
          const { data: orgSettings } = await admin
            .from('organization_settings')
            .select('n8n_webhook_url')
            .eq('organization_id', orgId)
            .maybeSingle()

          const webhookUrl = orgSettings?.n8n_webhook_url
          if (webhookUrl) {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'WORKSPACE_INVITE',
                invitation_token: token,
                organization_id: orgId,
                email: cleanEmail,
                full_name: payload.full_name,
                sector: payload.sector,
                job_title: payload.job_title,
                access_type: accessType,
                invited_by: actorName,
                login_url: directLoginUrl,
                action_link: actionLink,
                created_at: new Date().toISOString(),
              }),
            }).catch(() => {})
          }
        } catch (e) {
          console.warn('Aviso no envio de webhook n8n:', e)
        }

        return NextResponse.json({
          ok: true,
          data: memberData,
          emailSent,
          passwordSet: passwordCreatedOrUpdated,
          alreadyRegistered: Boolean(targetUserId),
          inviteLink: actionLink || directLoginUrl,
          directLoginUrl,
          token,
        })
      }

      case 'ADMIN_UPDATE_MEMBER_CREDENTIALS': {
        if (!hasFeaturePermission(actorCtx, 'team.manage_members')) {
          return denyPerm('Apenas administradores autorizados podem alterar e-mail ou senha de membros.')
        }
        const memberId = String(payload.memberId || '').trim()
        const newEmail = typeof payload.newEmail === 'string' ? payload.newEmail.trim().toLowerCase() : ''
        const newPassword = typeof payload.newPassword === 'string' ? payload.newPassword : ''

        if (!memberId) {
          return NextResponse.json({ error: 'ID do membro é obrigatório.' }, { status: 400 })
        }
        if (!newEmail && !newPassword) {
          return NextResponse.json({ error: 'Informe um novo e-mail ou uma nova senha.' }, { status: 400 })
        }
        if (newPassword && newPassword.length < 6) {
          return NextResponse.json({ error: 'A nova senha precisa ter pelo menos 6 caracteres.' }, { status: 400 })
        }

        const { data: targetMember, error: fetchErr } = await admin
          .from('organization_members')
          .select('*')
          .eq('id', memberId)
          .single()

        if (fetchErr || !targetMember) {
          return NextResponse.json({ error: 'Colaborador não encontrado.' }, { status: 404 })
        }

        let authUserId: string | null = targetMember.user_id || null
        if (!authUserId && targetMember.email) {
          const { data: userList } = await admin.auth.admin.listUsers()
          const matched = userList?.users?.find(
            (u) => u.email?.toLowerCase() === String(targetMember.email).toLowerCase()
          )
          if (matched) authUserId = matched.id
        }

        const finalEmail = newEmail || String(targetMember.email || '').trim().toLowerCase()

        if (authUserId) {
          const authUpdates: { email?: string; password?: string; email_confirm?: boolean } = {}
          if (newEmail && newEmail !== String(targetMember.email || '').toLowerCase()) {
            authUpdates.email = newEmail
            authUpdates.email_confirm = true
          }
          if (newPassword) {
            authUpdates.password = newPassword
          }

          if (Object.keys(authUpdates).length > 0) {
            const { error: authUpdErr } = await admin.auth.admin.updateUserById(authUserId, authUpdates)
            if (authUpdErr) {
              return NextResponse.json(
                { error: `Falha ao atualizar credenciais no Auth: ${authUpdErr.message}` },
                { status: 400 }
              )
            }
          }
        } else if (newPassword && finalEmail) {
          // Cria o usuário no Auth se ainda não existia
          const { data: createdAuth, error: createAuthErr } = await admin.auth.admin.createUser({
            email: finalEmail,
            password: newPassword,
            email_confirm: true,
            user_metadata: {
              full_name: targetMember.full_name || finalEmail.split('@')[0],
              organization_id: targetMember.organization_id,
            },
          })
          if (createAuthErr) {
            return NextResponse.json(
              { error: `Erro ao criar conta no Auth: ${createAuthErr.message}` },
              { status: 400 }
            )
          }
          authUserId = createdAuth?.user?.id || null
        } else {
          return NextResponse.json(
            { error: 'Este colaborador ainda não possui conta ativa. Defina uma senha para ativar.' },
            { status: 400 }
          )
        }

        const memberDbUpdates: Record<string, unknown> = {}
        if (finalEmail && finalEmail !== targetMember.email) {
          memberDbUpdates.email = finalEmail
        }
        if (authUserId && !targetMember.user_id) {
          memberDbUpdates.user_id = authUserId
          memberDbUpdates.member_status = 'ACTIVE'
        }

        let updatedMember = targetMember
        if (Object.keys(memberDbUpdates).length > 0) {
          const { data: updData } = await admin
            .from('organization_members')
            .update(memberDbUpdates)
            .eq('id', memberId)
            .select('*')
            .single()
          if (updData) updatedMember = updData
        }

        return NextResponse.json({
          ok: true,
          data: updatedMember,
          email: finalEmail,
          passwordUpdated: Boolean(newPassword),
        })
      }

      case 'UPDATE_TEAM_MEMBER': {
        if (!hasFeaturePermission(actorCtx, 'team.manage_members')) {
          return denyPerm('Seu nível de acesso não permite alterar permissões ou dados de colaboradores.')
        }
        const memberId = payload.memberId as string
        const updates = payload.updates as Record<string, unknown>
        if (!memberId || !updates) {
          return NextResponse.json({ error: 'Dados insuficientes para atualizar' }, { status: 400 })
        }

        const { data, error } = await admin
          .from('organization_members')
          .update(updates)
          .eq('id', memberId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'DELETE_TEAM_MEMBER': {
        if (!hasFeaturePermission(actorCtx, 'team.manage_members')) {
          return denyPerm('Seu nível de acesso não permite remover membros da organização.')
        }
        const memberId = payload.memberId as string
        if (!memberId) {
          return NextResponse.json({ error: 'ID do colaborador não informado' }, { status: 400 })
        }

        const { error } = await admin
          .from('organization_members')
          .delete()
          .eq('id', memberId)

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true })
      }

      case 'CREATE_HR_NOTE': {
        const memberId = payload.memberId as string
        const content = payload.content as string
        if (!memberId || !content) {
          return NextResponse.json({ error: 'Dados da anotação incompletos' }, { status: 400 })
        }

        const { data, error } = await admin
          .from('member_hr_notes')
          .insert({
            organization_id: orgId,
            member_id: memberId,
            author_id: user.id,
            author_name: actorName,
            category: payload.category || 'Geral',
            content,
          })
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'DELETE_HR_NOTE': {
        const noteId = payload.noteId as string
        if (!noteId) {
          return NextResponse.json({ error: 'ID da anotação não informado' }, { status: 400 })
        }

        const { error } = await admin
          .from('member_hr_notes')
          .delete()
          .eq('id', noteId)

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true })
      }

      // =====================================================================
      // ACTIONS EXISTENTES (STUDIO / FLOW / PULSE / GOVERNANÇA)
      // =====================================================================
      case 'CREATE_QUEUE_ITEM': {
        const slaMinutes = Number(payload.sla_minutes) || 30
        const slaDue = new Date(Date.now() + slaMinutes * 60 * 1000).toISOString()

        const { data: item, error } = await admin
          .from('studio_approval_queues')
          .insert({
            organization_id: orgId,
            queue_type: payload.queue_type || 'PURCHASE_ORDER',
            title: payload.title,
            reference_code:
              payload.reference_code || `#ERP-${Math.floor(1000 + Math.random() * 9000)}`,
            requester_name: payload.requester_name || actorName,
            amount_value: Number(payload.amount_value) || 0,
            payload_summary: payload.payload_summary || {},
            status: 'PENDING',
            sla_due_at: slaDue,
          })
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })

        await admin.from('studio_audit_logs').insert({
          organization_id: orgId,
          actor_user_id: user.id,
          actor_name: actorName,
          action_type: 'QUEUE_ITEM_CREATED',
          entity_table: 'studio_approval_queues',
          entity_id: item.id,
          ip_address: '127.0.0.1',
          metadata: {
            payload_before: {},
            payload_after: {
              title: item.title,
              amount_value: item.amount_value,
              status: 'PENDING',
            },
          },
        })

        return NextResponse.json({ ok: true, data: item })
      }

      case 'DECIDE_QUEUE_ITEM': {
        const { queueId, decision } = payload
        const { data: beforeItem } = await admin
          .from('studio_approval_queues')
          .select('*')
          .eq('id', queueId)
          .single()

        const nowIso = new Date().toISOString()
        const { data: updated, error } = await admin
          .from('studio_approval_queues')
          .update({
            status: decision,
            decided_by: user.id,
            decided_by_name: actorName,
            decided_at: nowIso,
          })
          .eq('id', queueId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })

        await admin.from('studio_audit_logs').insert({
          organization_id: orgId,
          actor_user_id: user.id,
          actor_name: actorName,
          action_type:
            decision === 'APPROVED_1CLICK'
              ? 'ONE_CLICK_APPROVE'
              : decision === 'REJECTED'
                ? 'ONE_CLICK_REJECT'
                : 'REQUEST_REVISION',
          entity_table: 'studio_approval_queues',
          entity_id: queueId,
          ip_address: '127.0.0.1',
          metadata: {
            payload_before: {
              status: beforeItem?.status || 'PENDING',
              reference_code: beforeItem?.reference_code,
            },
            payload_after: {
              status: decision,
              decided_by: actorName,
              synced_erp_in_ms: 340,
            },
          },
        })

        return NextResponse.json({ ok: true, data: updated })
      }

      case 'DELETE_QUEUE_ITEM': {
        await admin.from('studio_approval_queues').delete().eq('id', payload.queueId)
        return NextResponse.json({ ok: true })
      }

      case 'ADD_SPREADSHEET': {
        const { data, error } = await admin
          .from('studio_legacy_spreadsheets')
          .insert({
            organization_id: orgId,
            sheet_name: payload.sheet_name,
            department: payload.department || 'Operações',
            rows_count: Number(payload.rows_count) || 0,
            status: payload.status || 'PARALLEL_ACTIVE',
            replaced_by_module: payload.replaced_by_module || 'Coytech Studio',
          })
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'UPDATE_SPREADSHEET': {
        const { data, error } = await admin
          .from('studio_legacy_spreadsheets')
          .update({ status: payload.status })
          .eq('id', payload.sheetId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'LOCK_ALL_SPREADSHEETS': {
        await admin
          .from('studio_legacy_spreadsheets')
          .update({ status: 'READ_ONLY_LOCKED' })
          .eq('organization_id', orgId)
        return NextResponse.json({ ok: true })
      }

      case 'ADD_BIA_PROCESS': {
        const { data, error } = await admin
          .from('bia_critical_processes')
          .insert({
            organization_id: orgId,
            process_name: payload.process_name,
            layer: payload.layer,
            cost_per_hour_stopped: Number(payload.cost_per_hour_stopped) || 60000,
            external_monitor_id:
              payload.external_monitor_id || `MON-${Math.floor(100 + Math.random() * 900)}`,
            current_status: 'HEALTHY',
            latency_ms: Number(payload.latency_ms) || 95,
          })
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'UPDATE_BIA_STATUS': {
        const { data, error } = await admin
          .from('bia_critical_processes')
          .update({
            current_status: payload.current_status,
            last_checked_at: new Date().toISOString(),
          })
          .eq('id', payload.processId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'DELETE_BIA_PROCESS': {
        await admin.from('bia_critical_processes').delete().eq('id', payload.processId)
        return NextResponse.json({ ok: true })
      }

      case 'CREATE_INCIDENT': {
        const costPerMin = Number(payload.cost_per_minute) || 1000
        const { data, error } = await admin
          .from('pulse_incidents')
          .insert({
            organization_id: orgId,
            bia_process_id: payload.bia_process_id || null,
            process_name_snapshot: payload.process_name || 'Operação Crítica',
            cost_per_minute_snapshot: costPerMin,
            priority: payload.priority || 'P1_CRITICAL_15MIN',
            status: 'INVESTIGATING',
            title: payload.title,
            is_silent_business_drop: Boolean(payload.is_silent_business_drop),
            suppressed_duplicate_alerts_count: Number(payload.suppressed_alerts) || 18,
            ai_sre_root_cause_summary:
              payload.ai_sre_root_cause_summary ||
              'Agente 05 SRE correlacionou telemetria das 4 camadas em 34s e isolou o gargalo no serviço externo.',
            ai_sre_recommended_action:
              payload.ai_sre_recommended_action ||
              'Ativar chaveamento automático de contingência via n8n e revalidar fila.',
            estimated_financial_loss_avoided: 0,
          })
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'RESOLVE_INCIDENT': {
        const { data: inc } = await admin
          .from('pulse_incidents')
          .select('*')
          .eq('id', payload.incidentId)
          .single()

        const costPerMin = Number(inc?.cost_per_minute_snapshot) || 1000
        const savedValue = Math.round(costPerMin * 45)

        const { data, error } = await admin
          .from('pulse_incidents')
          .update({
            status: 'RESOLVED',
            resolved_at: new Date().toISOString(),
            estimated_financial_loss_avoided: savedValue,
          })
          .eq('id', payload.incidentId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'CREATE_FLOW_RUN': {
        const tokens = Number(payload.tokens_consumed) || 650
        const { data, error } = await admin
          .from('flow_automation_runs')
          .insert({
            organization_id: orgId,
            workflow_name: payload.workflow_name,
            agent_used: payload.agent_used || 'AGENT_1_SALES_QUALIFIER',
            n8n_execution_id: `n8n-${Math.floor(10000 + Math.random() * 90000)}`,
            status: payload.status || 'SUCCESS',
            manual_minutes_saved: Number(payload.manual_minutes_saved) || 15,
            financial_value_processed: Number(payload.financial_value_processed) || 0,
            tokens_consumed: tokens,
            summary_result: payload.summary_result || 'Execução concluída com sucesso.',
          })
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'ADD_KNOWLEDGE_DOC': {
        const { data, error } = await admin
          .from('knowledge_and_runbooks')
          .insert({
            organization_id: orgId,
            doc_category: payload.doc_category || 'COMPANY_SOP',
            title: payload.title,
            content_chunk: payload.content_chunk,
          })
          .select('id, organization_id, doc_category, title, content_chunk, created_at')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'DELETE_KNOWLEDGE_DOC': {
        await admin.from('knowledge_and_runbooks').delete().eq('id', payload.docId)
        return NextResponse.json({ ok: true })
      }

      case 'GENERATE_WEEKLY_REPORT': {
        const [{ data: runs }, { data: resolvedIncs }] = await Promise.all([
          admin.from('flow_automation_runs').select('*').eq('organization_id', orgId),
          admin
            .from('pulse_incidents')
            .select('*')
            .eq('organization_id', orgId)
            .eq('status', 'RESOLVED'),
        ])

        const totalRuns = (runs || []).length
        const totalMinutes = (runs || []).reduce(
          (acc, r) => acc + Number(r.manual_minutes_saved || 0),
          0
        )
        const totalHours = Number((totalMinutes / 60).toFixed(1))
        const totalIncs = (resolvedIncs || []).length
        const totalProtected = (resolvedIncs || []).reduce(
          (acc, i) => acc + Number(i.estimated_financial_loss_avoided || 0),
          0
        )

        const today = new Date()
        const weekEnd = today.toISOString().split('T')[0]
        const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]

        const { data, error } = await admin
          .from('ltv_weekly_reports')
          .insert({
            organization_id: orgId,
            week_start: weekStart,
            week_end: weekEnd,
            total_automated_runs: totalRuns,
            total_hours_saved: totalHours,
            incidents_prevented_count: totalIncs,
            revenue_protected_value: totalProtected,
            sla_uptime_percentage: 99.98,
            sent_via_whatsapp_at: new Date().toISOString(),
          })
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'ADD_CREDENTIAL': {
        const { data, error } = await admin
          .from('governance_credentials')
          .insert({
            organization_id: orgId,
            service_name: payload.service_name,
            pilar: payload.pilar || 'FLOW',
            endpoint_or_host: payload.endpoint_or_host,
            status: 'CONNECTED_VALIDATED',
            latency_ms: Math.floor(25 + Math.random() * 80),
            last_tested_at: new Date().toISOString(),
          })
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'VALIDATE_CREDENTIALS': {
        await admin
          .from('governance_credentials')
          .update({
            status: 'CONNECTED_VALIDATED',
            last_tested_at: new Date().toISOString(),
          })
          .eq('organization_id', orgId)

        return NextResponse.json({ ok: true })
      }

      case 'DELETE_CREDENTIAL': {
        await admin.from('governance_credentials').delete().eq('id', payload.credentialId)
        return NextResponse.json({ ok: true })
      }

      case 'EXECUTE_GOLIVE_STEP': {
        const step = payload.step as 'A' | 'B' | 'C'
        const updates: Record<string, unknown> = {}
        if (step === 'A') updates.golive_step_a_pulse = true
        if (step === 'B') updates.golive_step_b_studio_flow = true
        if (step === 'C') {
          updates.golive_step_c_lock_sheets = true
          updates.golive_completed_at = new Date().toISOString()
          updates.current_stage = 'STAGE_5_LTV_RECURRING'
          await admin
            .from('studio_legacy_spreadsheets')
            .update({ status: 'READ_ONLY_LOCKED' })
            .eq('organization_id', orgId)
        }

        const { data, error } = await admin
          .from('organizations')
          .update(updates)
          .eq('id', orgId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, data })
      }

      case 'EXECUTE_OFFBOARDING_STEP': {
        const subAction = payload.subAction as
          | 'ACCEPT_PASSIVE'
          | 'EXPORT_ASSETS'
          | 'REVOKE_KEYS_LGPD'
          | 'SIGN_TERM'

        const nowIso = new Date().toISOString()
        const updates: Record<string, unknown> = {}

        if (subAction === 'ACCEPT_PASSIVE') {
          updates.passive_plan_offered = true
          updates.retained_on_passive_plan = true
          await admin
            .from('organizations')
            .update({ current_stage: 'PASSIVE_RETENTION_PLAN' })
            .eq('id', orgId)
        } else if (subAction === 'EXPORT_ASSETS') {
          updates.git_repo_archive_url = `https://vault.coytech.com.br/export/${orgId}/git.tar.gz`
          updates.db_backup_dump_url = `https://vault.coytech.com.br/export/${orgId}/db.sql.gpg`
          updates.n8n_workflows_export_url = `https://vault.coytech.com.br/export/${orgId}/n8n.json`
          updates.monitoring_templates_export_url = `https://vault.coytech.com.br/export/${orgId}/zabbix.xml`
        } else if (subAction === 'REVOKE_KEYS_LGPD') {
          updates.litellm_key_revoked_at = nowIso
          updates.vpn_and_vault_wiped_at = nowIso
        } else if (subAction === 'SIGN_TERM') {
          updates.signed_handover_term_url = `https://vault.coytech.com.br/export/${orgId}/termo-encerramento.pdf`
          updates.followup_60d_scheduled_for = new Date(
            Date.now() + 60 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split('T')[0]
          updates.followup_120d_scheduled_for = new Date(
            Date.now() + 120 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split('T')[0]
        }

        const { data: existing } = await admin
          .from('offboarding_processes')
          .select('id')
          .eq('organization_id', orgId)
          .maybeSingle()

        let result
        if (existing?.id) {
          const { data } = await admin
            .from('offboarding_processes')
            .update(updates)
            .eq('id', existing.id)
            .select('*')
            .single()
          result = data
        } else {
          const { data } = await admin
            .from('offboarding_processes')
            .insert({ organization_id: orgId, ...updates })
            .select('*')
            .single()
          result = data
        }

        return NextResponse.json({ ok: true, data: result })
      }

      // ======================================================================
      // COYCRM — ENGENHARIA REVERSA TWENTY CRM: PIPELINES, DEALS, CONTATOS & TIMELINE
      // ======================================================================

      case 'CREATE_PIPELINE': {
        const { name, color, is_default, stages } = payload
        const { data: pipeline, error } = await admin
          .from('pipelines')
          .insert({
            organization_id: orgId,
            name: name || 'Novo Funil',
            color: color || '#0066FF',
            is_default: Boolean(is_default),
          })
          .select('*')
          .single()

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        let createdStages: Record<string, unknown>[] = []
        if (Array.isArray(stages) && stages.length > 0) {
          const stagesToInsert = stages.map((s, idx) => ({
            organization_id: orgId,
            pipeline_id: pipeline.id,
            name: s.name,
            stage_order: typeof s.stage_order === 'number' ? s.stage_order : idx,
            probability_percent: s.probability_percent || 10,
            color: s.color || '#38bdf8',
            is_won: Boolean(s.is_won),
            is_lost: Boolean(s.is_lost),
          }))
          const { data: stData } = await admin
            .from('pipeline_stages')
            .insert(stagesToInsert)
            .select('*')
          createdStages = stData || []
        }

        return NextResponse.json({ ok: true, pipeline, stages: createdStages })
      }

      case 'UPDATE_PIPELINE': {
        const { pipelineId, updates } = payload
        const { data, error } = await admin
          .from('pipelines')
          .update(updates)
          .eq('id', pipelineId)
          .eq('organization_id', orgId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ ok: true, pipeline: data })
      }

      case 'DELETE_PIPELINE': {
        const { pipelineId } = payload
        await admin.from('pipelines').delete().eq('id', pipelineId).eq('organization_id', orgId)
        return NextResponse.json({ ok: true })
      }

      case 'CREATE_DEAL': {
        const {
          pipeline_id,
          stage_id,
          client_id,
          lead_id,
          title,
          value_mrr,
          value_setup,
          expected_close_date,
          priority,
          assigned_member_id,
          assigned_member_name,
          notes,
          custom_fields,
        } = payload

        let targetLeadId = lead_id || null
        const rawPhone = String(
          payload.contact_phone ||
          payload.lead_id ||
          payload.phone ||
          payload.whatsapp ||
          payload.lead_phone ||
          payload?.custom_fields?.contact_phone ||
          ''
        ).replace(/\D/g, '')

        if (rawPhone && rawPhone.length >= 8) {
          const cleanPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`
          targetLeadId = cleanPhone

          // Verificar se já existe em public.leads
          const { data: existingLead } = await admin
            .from('leads')
            .select('id, lead_id')
            .eq('lead_id', cleanPhone)
            .maybeSingle()

          if (!existingLead) {
            // Criar lead automaticamente no Atendimento Comercial
            await admin.from('leads').insert({
              organization_id: orgId,
              lead_id: cleanPhone,
              lead_nome: payload.contact_name || title || 'Novo Lead Comercial',
              inbox_type: 'COMMERCIAL',
              commercial_stage: 'NOVO',
              client_id: client_id || null,
            })
          }
        }

        const { data: deal, error } = await admin
          .from('deals')
          .insert({
            organization_id: orgId,
            pipeline_id,
            stage_id,
            client_id: client_id || null,
            lead_id: targetLeadId || null,
            title: title || 'Nova Oportunidade',
            value_mrr: Number(value_mrr) || 0,
            value_setup: Number(value_setup) || 0,
            expected_close_date: expected_close_date || null,
            priority: priority || 'medium',
            assigned_member_id: assigned_member_id || null,
            assigned_member_name: assigned_member_name || '',
            notes: notes || '',
            custom_fields: custom_fields || {},
          })
          .select('*')
          .single()

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Registrar atividade na timeline
        await admin.from('activity_timeline').insert({
          organization_id: orgId,
          entity_type: 'DEAL',
          entity_id: deal.id,
          actor_name: actorName,
          event_type: 'STAGE_MOVED',
          title: `Oportunidade criada: ${deal.title}`,
          description: `Valor MRR: R$ ${deal.value_mrr} | Setup: R$ ${deal.value_setup}`,
          metadata: { deal_id: deal.id, stage_id: deal.stage_id },
        })

        return NextResponse.json({ ok: true, deal })
      }

      case 'UPDATE_DEAL': {
        const { dealId, updates } = payload
        const { data: deal, error } = await admin
          .from('deals')
          .update(updates)
          .eq('id', dealId)
          .eq('organization_id', orgId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ ok: true, deal })
      }

      case 'UPDATE_DEAL_STAGE': {
        const { dealId, stageId, stageName, isWon, isLost, leadId } = payload
        const { data: deal, error } = await admin
          .from('deals')
          .update({ stage_id: stageId, updated_at: new Date().toISOString() })
          .eq('id', dealId)
          .eq('organization_id', orgId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Sincronização bidirecional com a tabela `public.leads` se tiver `lead_id`
        const targetLeadId = leadId || deal.lead_id
        if (targetLeadId) {
          let mappedCommercialStage = 'QUALIFICANDO'
          if (isWon) mappedCommercialStage = 'GANHO'
          else if (isLost) mappedCommercialStage = 'PERDIDO'
          else if (stageName?.toUpperCase().includes('PROPOSTA')) mappedCommercialStage = 'PROPOSTA'
          else if (stageName?.toUpperCase().includes('REUNI')) mappedCommercialStage = 'REUNIAO_AGENDADA'
          else if (stageName?.toUpperCase().includes('NOVO')) mappedCommercialStage = 'NOVO'

          await admin
            .from('leads')
            .update({ commercial_stage: mappedCommercialStage })
            .eq('lead_id', String(targetLeadId))
        }

        // Log na timeline unificada
        await admin.from('activity_timeline').insert({
          organization_id: orgId,
          entity_type: 'DEAL',
          entity_id: dealId,
          actor_name: actorName,
          event_type: isWon ? 'DEAL_WON' : isLost ? 'DEAL_LOST' : 'STAGE_MOVED',
          title: `Estágio alterado para: ${stageName || 'Novo Estágio'}`,
          description: `Oportunidade movimentada por ${actorName}`,
          metadata: { deal_id: dealId, stage_id: stageId },
        })

        return NextResponse.json({ ok: true, deal })
      }

      case 'DELETE_DEAL': {
        const { dealId } = payload
        await admin.from('deals').delete().eq('id', dealId).eq('organization_id', orgId)
        return NextResponse.json({ ok: true })
      }

      case 'CONVERT_DEAL_TO_CLIENT': {
        const { dealId, clientName, cnpj, sector, contactName, contactPhone, contactEmail } = payload

        const { data: deal } = await admin
          .from('deals')
          .select('*')
          .eq('id', dealId)
          .eq('organization_id', orgId)
          .single()

        if (!deal) {
          return NextResponse.json({ error: 'Oportunidade não encontrada' }, { status: 404 })
        }

        const nameToUse = clientName || deal.title.replace(/^Projeto\s*-\s*/i, '').trim()

        // 1. Criar cliente na Central de Clientes 360º
        const { data: newClient, error: clientErr } = await admin
          .from('clients')
          .insert({
            organization_id: orgId,
            name: nameToUse,
            cnpj: cnpj || '',
            sector: sector || 'Serviços / Consultoria B2B',
            status: 'ONBOARDING',
            priority: deal.priority || 'high',
            mrr_value: deal.value_mrr || 0,
            setup_fee: deal.value_setup || 0,
            contact_name: contactName || '',
            contact_phone: contactPhone || '',
            contact_email: contactEmail || '',
          })
          .select('*')
          .single()

        if (clientErr) {
          return NextResponse.json({ error: clientErr.message }, { status: 500 })
        }

        // 2. Vincular o cliente ao deal
        await admin
          .from('deals')
          .update({ client_id: newClient.id, updated_at: new Date().toISOString() })
          .eq('id', dealId)

        // 3. Cadastrar contato principal em `client_contacts`
        if (contactName) {
          await admin.from('client_contacts').insert({
            organization_id: orgId,
            client_id: newClient.id,
            lead_id: deal.lead_id || null,
            name: contactName,
            job_title: 'Decisor Principal',
            phone: contactPhone || '',
            whatsapp: contactPhone || '',
            email: contactEmail || '',
            is_decision_maker: true,
          })
        }

        // 4. Log na timeline do cliente e da oportunidade
        await admin.from('activity_timeline').insert([
          {
            organization_id: orgId,
            entity_type: 'CLIENT',
            entity_id: newClient.id,
            actor_name: actorName,
            event_type: 'STATUS_CHANGED',
            title: `Cliente criado a partir do funil comercial`,
            description: `Contrato fechado: MRR R$ ${deal.value_mrr} | Setup R$ ${deal.value_setup}`,
            metadata: { deal_id: deal.id, client_id: newClient.id },
          },
          {
            organization_id: orgId,
            entity_type: 'DEAL',
            entity_id: deal.id,
            actor_name: actorName,
            event_type: 'DEAL_WON',
            title: `Negócio Fechado e Convertido em Cliente 360º`,
            description: `Cliente criado com ID ${newClient.id}`,
            metadata: { deal_id: deal.id, client_id: newClient.id },
          },
        ])

        return NextResponse.json({ ok: true, client: newClient, dealId })
      }

      case 'CREATE_CLIENT_CONTACT': {
        const {
          client_id,
          lead_id,
          name,
          job_title,
          department,
          email,
          phone,
          whatsapp,
          is_decision_maker,
          notes,
        } = payload

        const { data: contact, error } = await admin
          .from('client_contacts')
          .insert({
            organization_id: orgId,
            client_id,
            lead_id: lead_id || null,
            name: name || 'Novo Contato',
            job_title: job_title || 'Contato Comercial',
            department: department || 'Operações',
            email: email || '',
            phone: phone || '',
            whatsapp: whatsapp || '',
            is_decision_maker: Boolean(is_decision_maker),
            notes: notes || '',
          })
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Log na timeline do cliente
        await admin.from('activity_timeline').insert({
          organization_id: orgId,
          entity_type: 'CLIENT',
          entity_id: client_id,
          actor_name: actorName,
          event_type: 'NOTE_ADDED',
          title: `Novo contato adicionado: ${contact.name} (${contact.job_title})`,
          description: `Registrado por ${actorName}`,
          metadata: { contact_id: contact.id },
        })

        return NextResponse.json({ ok: true, contact })
      }

      case 'UPDATE_CLIENT_CONTACT': {
        const { contactId, updates } = payload
        const { data: contact, error } = await admin
          .from('client_contacts')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', contactId)
          .eq('organization_id', orgId)
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ ok: true, contact })
      }

      case 'DELETE_CLIENT_CONTACT': {
        const { contactId } = payload
        await admin
          .from('client_contacts')
          .delete()
          .eq('id', contactId)
          .eq('organization_id', orgId)
        return NextResponse.json({ ok: true })
      }

      case 'LOG_ACTIVITY_TIMELINE': {
        const { entity_type, entity_id, event_type, title, description, metadata } = payload
        const { data: activity, error } = await admin
          .from('activity_timeline')
          .insert({
            organization_id: orgId,
            entity_type,
            entity_id,
            actor_name: actorName,
            event_type,
            title,
            description: description || '',
            metadata: metadata || {},
          })
          .select('*')
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ ok: true, activity })
      }

      case 'SAVE_WORKSPACE_VIEW': {
        const { view_scope, name, icon, is_shared, columns_visible, filters_config, sort_config, viewId } =
          payload

        let result
        if (viewId) {
          const { data } = await admin
            .from('workspace_saved_views')
            .update({
              name,
              icon: icon || 'LayoutGrid',
              is_shared: Boolean(is_shared),
              columns_visible: columns_visible || [],
              filters_config: filters_config || [],
              sort_config: sort_config || { field: 'created_at', direction: 'desc' },
            })
            .eq('id', viewId)
            .eq('organization_id', orgId)
            .select('*')
            .single()
          result = data
        } else {
          const { data } = await admin
            .from('workspace_saved_views')
            .insert({
              organization_id: orgId,
              user_id: user.id,
              view_scope,
              name: name || 'Nova Visualização',
              icon: icon || 'LayoutGrid',
              is_shared: Boolean(is_shared),
              columns_visible: columns_visible || [],
              filters_config: filters_config || [],
              sort_config: sort_config || { field: 'created_at', direction: 'desc' },
            })
            .select('*')
            .single()
          result = data
        }

        return NextResponse.json({ ok: true, view: result })
      }

      case 'DELETE_WORKSPACE_VIEW': {
        const { viewId } = payload
        await admin
          .from('workspace_saved_views')
          .delete()
          .eq('id', viewId)
          .eq('organization_id', orgId)
        return NextResponse.json({ ok: true })
      }

      default:
        return NextResponse.json({ error: `Ação desconhecida: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro em POST /api/coydash/sync:', error)
    return NextResponse.json({ error: 'Erro interno na operação' }, { status: 500 })
  }
}
