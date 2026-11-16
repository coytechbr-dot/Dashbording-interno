'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertTriangle, Trash2, X } from 'lucide-react'

interface ConfirmDeleteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemType: 'projeto' | 'lista'
  itemName: string
  subItemsCount?: number
  onConfirm: () => Promise<void> | void
}

export function ConfirmDeleteModal({
  open,
  onOpenChange,
  itemType,
  itemName,
  subItemsCount = 0,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const [typedName, setTypedName] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  React.useEffect(() => {
    if (open) {
      setTypedName('')
      setError('')
      setIsDeleting(false)
    }
  }, [open])

  const isMatch = typedName.trim().toLowerCase() === itemName.trim().toLowerCase()

  const handleConfirm = async () => {
    if (!isMatch || isDeleting) return
    setIsDeleting(true)
    setError('')
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir item.')
      setIsDeleting(false)
    }
  }

  const typeLabel = itemType === 'projeto' ? 'Projeto' : 'Lista'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-[var(--surface)] text-[var(--fg)] border border-red-500/30 rounded-2xl shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <DialogTitle className="text-[17px] font-bold text-red-500">
              Confirmar exclusão de {typeLabel}
            </DialogTitle>
            <p className="text-[12px] text-[var(--ds-muted)] mt-1 leading-relaxed">
              Esta é uma ação destrutiva irreversível restrita a administradores.
              {subItemsCount > 0 && (
                <span className="block mt-1 font-semibold text-red-400">
                  Atenção: todas as {subItemsCount} tarefas e dados vinculados serão excluídos permanentemente.
                </span>
              )}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-500 text-[11.5px] font-medium mt-3">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2 mt-4 p-3 rounded-xl bg-[var(--bg)] border border-[var(--line2)]">
          <label className="text-[11.5px] text-[var(--ds-muted)]">
            Para confirmar, digite exatamente o nome{' '}
            <strong className="text-[var(--fg)] select-all">{itemName}</strong> no campo abaixo:
          </label>
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder={`Digite "${itemName}" para confirmar`}
            className="w-full h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--line2)] text-[12.5px] text-[var(--fg)] outline-none focus:border-red-500"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl border border-[var(--line2)] hover:bg-[var(--ds-hover)] text-[12px] font-semibold text-[var(--ds-muted)] hover:text-[var(--fg)] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!isMatch || isDeleting}
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12px] font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Excluindo...' : `Excluir ${typeLabel} Permanentemente`}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
