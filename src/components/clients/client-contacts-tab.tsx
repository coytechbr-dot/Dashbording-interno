'use client'

import React, { useState } from 'react'
import {
  Users,
  Plus,
  Phone,
  Mail,
  Star,
  Trash2,
  Edit2,
  MessageSquare,
  Building,
  UserCheck,
  Check,
  X,
  AlertCircle,
} from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'
import type { ClientContactItem } from '@/types/coydash'

interface ClientContactsTabProps {
  clientId: string
  clientName: string
}

export function ClientContactsTab({ clientId, clientName }: ClientContactsTabProps) {
  const {
    clientContacts,
    createClientContact,
    updateClientContact,
    deleteClientContact,
    logActivityTimeline,
  } = useCoyDash()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<ClientContactItem | null>(null)

  // Campos do formulário
  const [name, setName] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isDecisionMaker, setIsDecisionMaker] = useState(false)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Filtrar contatos deste cliente
  const contacts = clientContacts.filter((c) => c.client_id === clientId)

  const handleOpenAdd = () => {
    setEditingContact(null)
    setName('')
    setRoleTitle('')
    setEmail('')
    setPhone('')
    setIsDecisionMaker(false)
    setNotes('')
    setErrorMsg(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (contact: ClientContactItem) => {
    setEditingContact(contact)
    setName(contact.name || '')
    setRoleTitle(contact.role_title || '')
    setEmail(contact.email || '')
    setPhone(contact.phone || '')
    setIsDecisionMaker(Boolean(contact.is_primary_decision_maker))
    setNotes(contact.notes || '')
    setErrorMsg(null)
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Informe o nome completo do contato')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const payload = {
        client_id: clientId,
        name: name.trim(),
        role_title: roleTitle.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        is_primary_decision_maker: isDecisionMaker,
        notes: notes.trim() || undefined,
      }

      if (editingContact) {
        await updateClientContact(editingContact.id, payload)
        await logActivityTimeline({
          entity_type: 'client',
          entity_id: clientId,
          event_type: 'note',
          title: `Contato atualizado: ${name.trim()}`,
          description: `Cargo: ${roleTitle.trim() || 'Não especificado'} · Tel: ${phone.trim() || 'N/A'}`,
        })
      } else {
        await createClientContact(payload)
        await logActivityTimeline({
          entity_type: 'client',
          entity_id: clientId,
          event_type: 'note',
          title: `Novo contato adicionado: ${name.trim()}`,
          description: `Cargo: ${roleTitle.trim() || 'Não especificado'} · Decisor: ${isDecisionMaker ? 'Sim' : 'Não'}`,
        })
      }

      setDialogOpen(false)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao salvar contato')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (contactId: string, contactName: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o contato "${contactName}"?`)) {
      return
    }
    try {
      await deleteClientContact(contactId)
      await logActivityTimeline({
        entity_type: 'client',
        entity_id: clientId,
        event_type: 'note',
        title: `Contato removido: ${contactName}`,
      })
    } catch (err) {
      console.error('Erro ao deletar contato:', err)
    }
  }

  const cleanPhone = (p?: string | null) => {
    if (!p) return ''
    const digits = p.replace(/\D/g, '')
    return digits.startsWith('55') ? digits : `55${digits}`
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] p-[22px] flex flex-col gap-[18px]">
      {/* Topo da Aba */}
      <div className="flex flex-wrap items-center justify-between gap-[12px] border-b border-[var(--line)] pb-[14px]">
        <div>
          <div className="flex items-center gap-[8px]">
            <Users className="w-4 h-4 text-[#F0521F]" />
            <h2 className="text-[16px] font-bold text-[var(--fg)]">
              Contatos & Pessoas Chave · {clientName}
            </h2>
            <span className="px-[8px] py-[2px] rounded-full bg-[var(--bg)] border border-[var(--line2)] text-[11px] font-semibold text-[var(--ds-muted)]">
              {contacts.length} {contacts.length === 1 ? 'pessoa' : 'pessoas'}
            </span>
          </div>
          <p className="text-[12px] text-[var(--ds-muted)] mt-[2px]">
            Tomadores de decisão, responsáveis operacionais e pontos de contato da empresa
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="h-[36px] px-[14px] rounded-full bg-[#141414] text-[#F4F4F2] text-[12px] font-semibold hover:bg-[#F0521F] flex items-center gap-[6px] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Contato</span>
        </button>
      </div>

      {/* Lista de Contatos ou Estado Vazio */}
      {contacts.length === 0 ? (
        <div className="py-[48px] px-[20px] rounded-[14px] bg-[var(--bg)] border border-dashed border-[var(--line2)] flex flex-col items-center justify-center text-center gap-[12px]">
          <div className="w-[44px] h-[44px] rounded-full bg-[var(--surface)] border border-[var(--line2)] grid place-items-center text-[var(--ds-muted)]">
            <Users className="w-5 h-5" />
          </div>
          <div className="max-w-[380px]">
            <h3 className="text-[14px] font-bold text-[var(--fg)]">
              Nenhum contato cadastrado ainda
            </h3>
            <p className="text-[12px] text-[var(--ds-muted)] mt-[4px]">
              Adicione os tomadores de decisão, sócios e gestores operacionais desta conta para facilitar a comunicação e o histórico.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="h-[34px] px-[14px] rounded-full bg-[var(--surface)] border border-[var(--line2)] hover:border-[#F0521F] text-[12px] font-semibold text-[var(--fg)] flex items-center gap-[6px] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#F0521F]" />
            <span>Adicionar Primeiro Contato</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[14px]">
          {contacts.map((contact) => {
            const raw = contact.phone || ''
            const phoneDigits = cleanPhone(raw)
            const initials = contact.name
              ? contact.name
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'CT'

            return (
              <div
                key={contact.id}
                className="p-[16px] rounded-[14px] bg-[var(--bg)] border border-[var(--line2)] flex flex-col justify-between gap-[12px] transition-all hover:border-[var(--line)]"
              >
                <div className="flex flex-col gap-[10px]">
                  <div className="flex items-start justify-between gap-[10px]">
                    <div className="flex items-center gap-[10px]">
                      <div className="w-[36px] h-[36px] rounded-full bg-[var(--surface)] border border-[var(--line2)] grid place-items-center text-[12px] font-bold text-[var(--fg)] shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-bold text-[var(--fg)] truncate">
                          {contact.name}
                        </div>
                        <div className="text-[11.5px] text-[var(--ds-muted)] truncate">
                          {contact.role_title || 'Função não informada'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-[4px]">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(contact)}
                        className="w-[28px] h-[28px] rounded-full hover:bg-[var(--surface)] text-[var(--ds-muted)] hover:text-[var(--fg)] grid place-items-center transition-colors cursor-pointer"
                        title="Editar contato"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(contact.id, contact.name)}
                        className="w-[28px] h-[28px] rounded-full hover:bg-[#ef4444]/10 text-[var(--ds-muted)] hover:text-[#ef4444] grid place-items-center transition-colors cursor-pointer"
                        title="Remover contato"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Badge de Decisor */}
                  {contact.is_primary_decision_maker && (
                    <div className="inline-flex items-center gap-[5px] px-[8px] py-[3px] rounded-full bg-[#f0521f]/10 border border-[#f0521f]/30 text-[#f0521f] text-[11px] font-semibold w-fit">
                      <Star className="w-3 h-3 fill-[#f0521f]" />
                      <span>Tomador de Decisão</span>
                    </div>
                  )}

                  {/* Informações de Contato */}
                  <div className="flex flex-col gap-[6px] text-[12px] text-[var(--fg)] mt-[2px]">
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-[6px] text-[var(--ds-muted)] hover:text-[var(--fg)] truncate transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </a>
                    )}

                    {contact.phone && (
                      <div className="flex items-center gap-[6px] text-[var(--ds-muted)]">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{contact.phone}</span>
                      </div>
                    )}

                    {contact.notes && (
                      <p className="text-[11px] text-[var(--ds-muted)] bg-[var(--surface)] p-[8px] rounded-[8px] border border-[var(--line2)] mt-[4px] line-clamp-2">
                        {contact.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Botões de Ação Rápida */}
                {phoneDigits ? (
                  <div className="flex items-center gap-[6px] pt-[8px] border-t border-[var(--line2)]">
                    <a
                      href={`https://wa.me/${phoneDigits}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-[32px] px-[10px] rounded-[8px] bg-[#2f9e5a]/10 hover:bg-[#2f9e5a] text-[#2f9e5a] hover:text-white border border-[#2f9e5a]/30 text-[11.5px] font-semibold flex items-center justify-center gap-[5px] transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    <a
                      href={`/atendimento?phone=${phoneDigits}`}
                      className="h-[32px] px-[10px] rounded-[8px] bg-[var(--surface)] hover:bg-[var(--line2)] border border-[var(--line2)] text-[11.5px] font-medium text-[var(--fg)] flex items-center gap-[4px] transition-colors"
                      title="Abrir no Chat de Atendimento CoyDash"
                    >
                      <span>Chat Interno</span>
                    </a>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Criação / Edição de Contato */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-[16px] bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-[480px] bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-[18px] border-b border-[var(--line)] flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-[var(--fg)]">
                  {editingContact ? 'Editar Contato' : 'Adicionar Novo Contato'}
                </h3>
                <p className="text-[11.5px] text-[var(--ds-muted)]">
                  Vinculado a {clientName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="w-[30px] h-[30px] rounded-full hover:bg-[var(--bg)] text-[var(--ds-muted)] hover:text-[var(--fg)] grid place-items-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-[18px] flex flex-col gap-[14px] text-[13px]">
              {errorMsg && (
                <div className="p-[10px] rounded-[10px] bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-[12px] flex items-center gap-[8px]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-[12px] font-semibold text-[var(--fg)] mb-[5px]">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  className="w-full h-[38px] px-[12px] bg-[var(--bg)] border border-[var(--line2)] rounded-[10px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] focus:outline-none focus:border-[#F0521F]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[var(--fg)] mb-[5px]">
                  Cargo / Função
                </label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="Ex: Diretor Financeiro / Co-Fundador"
                  className="w-full h-[38px] px-[12px] bg-[var(--bg)] border border-[var(--line2)] rounded-[10px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] focus:outline-none focus:border-[#F0521F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
                <div>
                  <label className="block text-[12px] font-semibold text-[var(--fg)] mb-[5px]">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="11999998888"
                    className="w-full h-[38px] px-[12px] bg-[var(--bg)] border border-[var(--line2)] rounded-[10px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] focus:outline-none focus:border-[#F0521F]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[var(--fg)] mb-[5px]">
                    E-mail Corporativo
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="carlos@empresa.com"
                    className="w-full h-[38px] px-[12px] bg-[var(--bg)] border border-[var(--line2)] rounded-[10px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] focus:outline-none focus:border-[#F0521F]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-[10px] p-[10px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] cursor-pointer hover:border-[var(--line)]">
                <input
                  type="checkbox"
                  checked={isDecisionMaker}
                  onChange={(e) => setIsDecisionMaker(e.target.checked)}
                  className="w-4 h-4 rounded text-[#F0521F] focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-[12.5px] font-semibold text-[var(--fg)] block">
                    Tomador de Decisão Principal
                  </span>
                  <span className="text-[11px] text-[var(--ds-muted)] block">
                    Marque se esta pessoa é quem aprova propostas orçamentárias e contratos
                  </span>
                </div>
              </label>

              <div>
                <label className="block text-[12px] font-semibold text-[var(--fg)] mb-[5px]">
                  Observações & Preferências
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Prefere alinhamentos matutinos pelo WhatsApp; participa do QBR trimestral."
                  className="w-full p-[10px] bg-[var(--bg)] border border-[var(--line2)] rounded-[10px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] focus:outline-none focus:border-[#F0521F] resize-none text-[12px]"
                />
              </div>

              <div className="pt-[10px] border-t border-[var(--line)] flex items-center justify-end gap-[8px]">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="h-[36px] px-[14px] rounded-full border border-[var(--line2)] text-[var(--fg)] font-semibold text-[12px] hover:bg-[var(--bg)] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-[36px] px-[18px] rounded-full bg-[#141414] hover:bg-[#F0521F] text-[#F4F4F2] font-semibold text-[12px] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : editingContact ? 'Atualizar Contato' : 'Adicionar Contato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

