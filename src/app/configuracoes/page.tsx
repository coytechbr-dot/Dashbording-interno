'use client'

import React, { useState } from 'react'
import {
  Check,
  QrCode,
  ShieldCheck,
  UserPlus,
  X,
  Building2,
  Wallet,
  Bot,
  Plug,
} from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'
import type { OrganizationSettings } from '@/types/coydash'

const GATEWAY_TABS: {
  id: OrganizationSettings['selected_gateway']
  label: string
  fee: string
  desc: string
}[] = [
  {
    id: 'MERCADO_PAGO',
    label: 'Mercado Pago',
    fee: 'Pix 0,99% · Liquidação na hora',
    desc: 'Conecta via Access Token para gerar QR Code Pix dinâmico e conciliar webhooks em 2 segundos.',
  },
  {
    id: 'ASAAS',
    label: 'Asaas',
    fee: 'Boleto + Pix + Recorrência B2B',
    desc: 'Ideal para cobrança recorrente de mensalidades (MRR), régua de cobrança e emissão automática de NF-e.',
  },
  {
    id: 'BANCO_INTER',
    label: 'Banco Inter',
    fee: 'Pix 0,00% PJ · API Direta',
    desc: 'Integração direta com conta PJ Banco Inter sem taxa de emissão de Pix e conciliação via webhook.',
  },
  {
    id: 'EFI_BANK',
    label: 'Efí Bank',
    fee: 'Pix API + Split de Pagamento',
    desc: 'Especialista em API Pix de alta velocidade e divisão automática de comissões entre parceiros.',
  },
]

export default function ConfiguracoesPage() {
  const {
    currentOrg,
    updateOrganizationMetrics,
    orgSettings,
    updateOrgSettings,
    orgMembers,
    inviteTeamMember,
  } = useCoyDash()

  const [savedBanner, setSavedBanner] = useState(false)
  const [orgName, setOrgName] = useState(currentOrg.name)
  const [orgCnpj, setOrgCnpj] = useState(currentOrg.cnpj || '12.345.678/0001-90')
  const [whatsappNum, setWhatsappNum] = useState(orgSettings.whatsapp_number)

  // Modal Gateway Pix (4 Abas)
  const [showGatewayModal, setShowGatewayModal] = useState(false)
  const [selectedGatewayTab, setSelectedGatewayTab] = useState<
    OrganizationSettings['selected_gateway']
  >(orgSettings.selected_gateway || 'MERCADO_PAGO')
  const [pixKeyInput, setPixKeyInput] = useState(orgSettings.pix_key || '')
  const [apiTokenInput, setApiTokenInput] = useState('')

  // Modal QR Code / Meta Cloud API
  const [showQrModal, setShowQrModal] = useState(false)

  // Modal Convidar Membro
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [memberName, setMemberName] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState('CLIENT_COO_MANAGER')

  const handleSaveAll = async () => {
    await updateOrganizationMetrics({ name: orgName, cnpj: orgCnpj })
    await updateOrgSettings({ whatsapp_number: whatsappNum })
    setSavedBanner(true)
    setTimeout(() => setSavedBanner(false), 3000)
  }

  const handleConnectGateway = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateOrgSettings({
      selected_gateway: selectedGatewayTab,
      gateway_status: 'CONNECTED',
      pix_key: pixKeyInput || currentOrg.cnpj || 'pix@coytech.com.br',
    })
    setShowGatewayModal(false)
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memberName.trim() || !memberEmail.trim()) return
    await inviteTeamMember({
      full_name: memberName.trim(),
      email: memberEmail.trim(),
      role: memberRole,
    })
    setMemberName('')
    setMemberEmail('')
    setShowInviteModal(false)
  }

  const activeGatewayInfo =
    GATEWAY_TABS.find((g) => g.id === orgSettings.selected_gateway) || GATEWAY_TABS[0]

  return (
    <div className="px-[26px] pt-[18px] pb-[40px] flex flex-col gap-[16px]">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.5px]">Configurações</h1>
          <p className="text-[13px] text-[var(--ds-muted)]">
            Dados da operação, Conta Bancária Pix, WhatsApp Oficial, regras da IA e equipe
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="h-[38px] px-[20px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-[13px] flex items-center gap-[6px] cursor-pointer transition-colors"
        >
          {savedBanner ? (
            <>
              <Check className="w-4 h-4" />
              <span>Configurações salvas!</span>
            </>
          ) : (
            <span>Salvar alterações</span>
          )}
        </button>
      </div>

      {/* CARD DESTACADO: CONTA BANCÁRIA & GATEWAY PIX AUTOMÁTICO (IGUAL AO RANGOLIVRE) */}
      <div className="bg-[var(--surface)] border-[1.5px] border-[#0066FF] rounded-[16px] p-[20px] flex flex-wrap items-center justify-between gap-[14px]">
        <div className="flex items-start gap-[14px]">
          <div className="w-[44px] h-[44px] rounded-[12px] bg-[#0066FF]/15 text-[#0066FF] grid place-items-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-[8px]">
              <h2 className="text-[16px] font-bold">
                Conta Bancária & Gateway Pix Automático
              </h2>
              <span
                className={`px-[8px] py-[2px] rounded-full text-[10.5px] font-semibold ${
                  orgSettings.gateway_status === 'CONNECTED'
                    ? 'bg-[#2f9e5a]/15 text-[#2f9e5a]'
                    : 'bg-[#e8c14a]/15 text-[#e8c14a]'
                }`}
              >
                {orgSettings.gateway_status === 'CONNECTED'
                  ? `Conectado · ${activeGatewayInfo.label}`
                  : 'Pronto para conectar'}
              </span>
            </div>
            <p className="text-[12.5px] text-[var(--ds-muted)] mt-[2px]">
              Receba pagamentos Pix e Boletos direto na sua conta e deixe a IA liberar pedidos/contratos em 2 segundos após o pagamento.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowGatewayModal(true)}
          className="h-[40px] px-[18px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-[12.5px] cursor-pointer transition-colors shrink-0"
        >
          {orgSettings.gateway_status === 'CONNECTED'
            ? 'Gerenciar Gateway Pix'
            : 'Conectar Gateway Pix'}
        </button>
      </div>

      {/* GRID 2X2 DE CONFIGURAÇÕES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[14px]">
        {/* CARD 1: DADOS DA OPERAÇÃO & WHATSAPP OFICIAL */}
        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[20px] flex flex-col gap-[14px]">
          <div className="flex items-center gap-[8px]">
            <Building2 className="w-4 h-4 text-[#0066FF]" />
            <h2 className="text-[15px] font-bold">Dados da Operação & WhatsApp Oficial</h2>
          </div>

          <label className="flex flex-col gap-[5px] text-[12px] text-[var(--ds-muted)]">
            Nome da empresa / operação
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="h-[40px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
            />
          </label>

          <label className="flex flex-col gap-[5px] text-[12px] text-[var(--ds-muted)]">
            CNPJ
            <input
              value={orgCnpj}
              onChange={(e) => setOrgCnpj(e.target.value)}
              className="h-[40px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
            />
          </label>

          <label className="flex flex-col gap-[5px] text-[12px] text-[var(--ds-muted)]">
            WhatsApp Oficial conectado (Meta Cloud API)
            <div className="flex items-center gap-[8px]">
              <input
                value={whatsappNum}
                onChange={(e) => setWhatsappNum(e.target.value)}
                className="flex-1 h-[40px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
              />
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="h-[40px] px-[14px] rounded-[10px] bg-[var(--bg)] hover:bg-[#0066FF] hover:text-white border border-[var(--line2)] text-[12px] font-semibold flex items-center gap-[6px] cursor-pointer transition-colors shrink-0"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Re-escanear QR</span>
              </button>
            </div>
          </label>
        </div>

        {/* CARD 2: REGRAS DE ATENDIMENTO DA IA */}
        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[20px] flex flex-col gap-[14px]">
          <div className="flex items-center gap-[8px]">
            <Bot className="w-4 h-4 text-[#0066FF]" />
            <h2 className="text-[15px] font-bold">Regras de Atendimento dos Agentes IA</h2>
          </div>

          <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[12px] p-[14px] flex items-center justify-between gap-[12px]">
            <div>
              <div className="text-[13px] font-bold">
                Aceitar pedidos / propostas automaticamente pela IA
              </div>
              <div className="text-[11.5px] text-[var(--ds-muted)] mt-[2px]">
                Quando o Pix é confirmado via webhook, a IA já envia confirmação e aciona a equipe
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                updateOrgSettings({ ai_auto_accept: !orgSettings.ai_auto_accept })
              }
              className={`h-[34px] px-[14px] rounded-full text-[11.5px] font-semibold cursor-pointer shrink-0 ${
                orgSettings.ai_auto_accept
                  ? 'bg-[#0066FF] text-white'
                  : 'bg-[var(--surface)] border border-[var(--line2)] text-[var(--ds-muted)]'
              }`}
            >
              {orgSettings.ai_auto_accept ? 'Automático' : 'Manual'}
            </button>
          </div>

          <div className="bg-[var(--bg)] border border-[var(--line2)] rounded-[12px] p-[14px] flex items-center justify-between gap-[12px]">
            <div>
              <div className="text-[13px] font-bold">
                Passar para humano apenas quando o cliente insistir
              </div>
              <div className="text-[11.5px] text-[var(--ds-muted)] mt-[2px]">
                Tenta resolver 1x com empatia e base RAG antes de pausar a IA
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                updateOrgSettings({
                  handoff_only_on_insistence: !orgSettings.handoff_only_on_insistence,
                })
              }
              className={`h-[34px] px-[14px] rounded-full text-[11.5px] font-semibold cursor-pointer shrink-0 ${
                orgSettings.handoff_only_on_insistence
                  ? 'bg-[#0066FF] text-white'
                  : 'bg-[var(--surface)] border border-[var(--line2)] text-[var(--ds-muted)]'
              }`}
            >
              {orgSettings.handoff_only_on_insistence ? 'Ativo' : 'Imediato'}
            </button>
          </div>
        </div>

        {/* CARD 3: INTEGRAÇÕES EXTERNAS */}
        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[20px] flex flex-col gap-[12px]">
          <div className="flex items-center gap-[8px]">
            <Plug className="w-4 h-4 text-[#0066FF]" />
            <h2 className="text-[15px] font-bold">Integrações Externas</h2>
          </div>

          {[
            { key: 'whatsapp_cloud', name: 'WhatsApp Cloud API (Meta Oficial)' },
            { key: 'meta_ads', name: 'Meta Ads Business Manager' },
            { key: 'google_ads', name: 'Google Ads & Tag Manager' },
            { key: 'erp_webhook', name: 'Webhook CRM / n8n / Supabase Realtime' },
          ].map((item) => {
            const isConnected = orgSettings.integrations_state?.[item.key] ?? true
            return (
              <div
                key={item.key}
                className="flex items-center justify-between py-[8px] border-b border-[var(--line)] last:border-b-0"
              >
                <span className="text-[13px] font-semibold">{item.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    updateOrgSettings({
                      integrations_state: {
                        ...orgSettings.integrations_state,
                        [item.key]: !isConnected,
                      },
                    })
                  }
                  className={`px-[10px] py-[4px] rounded-full text-[11px] font-semibold cursor-pointer ${
                    isConnected
                      ? 'bg-[#2f9e5a]/15 text-[#2f9e5a]'
                      : 'bg-[var(--bg)] border border-[var(--line2)] text-[var(--ds-muted)]'
                  }`}
                >
                  {isConnected ? 'Conectado' : 'Conectar'}
                </button>
              </div>
            )
          })}
        </div>

        {/* CARD 4: EQUIPE & PERMISSÕES */}
        <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[20px] flex flex-col gap-[12px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[8px]">
              <ShieldCheck className="w-4 h-4 text-[#0066FF]" />
              <h2 className="text-[15px] font-bold">Equipe & Permissões</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="h-[32px] px-[12px] rounded-full bg-[var(--bg)] hover:bg-[#0066FF] hover:text-white border border-[var(--line2)] text-[11.5px] font-semibold flex items-center gap-[5px] cursor-pointer transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Convidar membro</span>
            </button>
          </div>

          <div className="flex flex-col gap-[8px]">
            {orgMembers.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between py-[8px] border-b border-[var(--line)] last:border-b-0"
              >
                <div>
                  <div className="text-[13px] font-bold">{m.full_name}</div>
                  <div className="text-[11px] text-[var(--ds-muted)]">
                    {m.email} · {m.role}
                  </div>
                </div>
                <span className="px-[8px] py-[2px] rounded-full bg-[#2f9e5a]/15 text-[#2f9e5a] text-[10.5px] font-semibold">
                  Ativo
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL GATEWAY PIX (4 ABAS: MERCADO PAGO, ASAAS, BANCO INTER, EFÍ BANK) */}
      {showGatewayModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-[18px]">
          <form
            onSubmit={handleConnectGateway}
            className="w-full max-w-[520px] bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] p-[24px] flex flex-col gap-[16px]"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[19px] font-bold">Conectar Conta Bancária & Pix</h2>
              <button
                type="button"
                onClick={() => setShowGatewayModal(false)}
                className="w-[30px] h-[30px] rounded-full bg-[var(--bg)] grid place-items-center text-[var(--ds-muted)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 4 Abas de Bancos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-[6px]">
              {GATEWAY_TABS.map((gt) => (
                <button
                  key={gt.id}
                  type="button"
                  onClick={() => setSelectedGatewayTab(gt.id)}
                  className={`py-[8px] px-[8px] rounded-[10px] border text-[11.5px] font-semibold cursor-pointer transition-colors ${
                    selectedGatewayTab === gt.id
                      ? 'bg-[#0066FF] text-white border-[#0066FF]'
                      : 'bg-[var(--bg)] text-[var(--ds-muted)] border-[var(--line2)]'
                  }`}
                >
                  {gt.label}
                </button>
              ))}
            </div>

            {GATEWAY_TABS.filter((g) => g.id === selectedGatewayTab).map((gt) => (
              <div
                key={gt.id}
                className="bg-[var(--bg)] border border-[var(--line2)] rounded-[12px] p-[14px] flex flex-col gap-[4px]"
              >
                <div className="text-[13px] font-bold text-[#0066FF]">
                  {gt.label} · {gt.fee}
                </div>
                <p className="text-[11.5px] text-[var(--ds-muted)]">{gt.desc}</p>
              </div>
            ))}

            <label className="flex flex-col gap-[5px] text-[12px] text-[var(--ds-muted)]">
              Chave Pix Recebedora (CNPJ, E-mail ou Aleatória) *
              <input
                value={pixKeyInput}
                onChange={(e) => setPixKeyInput(e.target.value)}
                required
                placeholder="Ex: 12.345.678/0001-90 ou financeiro@suaempresa.com.br"
                className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
              />
            </label>

            <label className="flex flex-col gap-[5px] text-[12px] text-[var(--ds-muted)]">
              Access Token / API Key de Produção
              <input
                type="password"
                value={apiTokenInput}
                onChange={(e) => setApiTokenInput(e.target.value)}
                placeholder="APP_USR-89237489237498..."
                className="h-[42px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
              />
            </label>

            <button
              type="submit"
              className="h-[44px] rounded-full bg-[#0066FF] text-white font-semibold text-[13px] cursor-pointer"
            >
              Validar e ativar recebimento Pix
            </button>
          </form>
        </div>
      )}

      {/* MODAL QR CODE WHATSAPP OFICIAL */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-[18px]">
          <div className="w-full max-w-[400px] bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] p-[24px] flex flex-col items-center text-center gap-[14px]">
            <div className="w-[64px] h-[64px] rounded-[16px] bg-[#0066FF]/15 text-[#0066FF] grid place-items-center">
              <QrCode className="w-9 h-9" />
            </div>
            <h2 className="text-[18px] font-bold">Pareamento WhatsApp Cloud API</h2>
            <p className="text-[12.5px] text-[var(--ds-muted)]">
              O número <strong>{whatsappNum}</strong> está autenticado via Embedded Signup Oficial da Meta com webhook ativo para os 5 Agentes IA.
            </p>
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full h-[42px] rounded-full bg-[#0066FF] text-white font-semibold text-[13px] cursor-pointer"
            >
              Concluído
            </button>
          </div>
        </div>
      )}

      {/* MODAL CONVIDAR MEMBRO */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-[18px]">
          <form
            onSubmit={handleInviteMember}
            className="w-full max-w-[420px] bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] p-[22px] flex flex-col gap-[12px]"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold">Convidar membro para a equipe</h2>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="w-[30px] h-[30px] rounded-full bg-[var(--bg)] grid place-items-center text-[var(--ds-muted)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="flex flex-col gap-[4px] text-[12px] text-[var(--ds-muted)]">
              Nome completo *
              <input
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                required
                placeholder="Ex: Gabrielly Maia"
                className="h-[40px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
              />
            </label>

            <label className="flex flex-col gap-[4px] text-[12px] text-[var(--ds-muted)]">
              E-mail corporativo *
              <input
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                required
                placeholder="gabrielly@coytech.com.br"
                className="h-[40px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
              />
            </label>

            <label className="flex flex-col gap-[4px] text-[12px] text-[var(--ds-muted)]">
              Função / Permissão
              <select
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
                className="h-[40px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] text-[13px] text-[var(--fg)]"
              >
                <option value="CLIENT_CEO_DIRECTOR">Sócio / Diretor (Acesso Total)</option>
                <option value="CLIENT_COO_MANAGER">Gestor de Operações / Tráfego / CS</option>
                <option value="CLIENT_CTO_IT">Tecnologia & Automações</option>
              </select>
            </label>

            <button
              type="submit"
              className="h-[44px] rounded-full bg-[#0066FF] text-white font-semibold text-[13px] cursor-pointer mt-[4px]"
            >
              Adicionar à equipe
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

