'use client'

import React, { useState, useMemo } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Check, ChevronDown } from 'lucide-react'

interface TaskQuickStatusPopoverProps {
  currentStatus: string
  availableStatuses?: { id?: string; name: string; color: string }[]
  onSelectStatus: (statusName: string) => Promise<void> | void
  children?: React.ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
}

const DEFAULT_STATUS_LIST = [
  { id: 'todo', name: 'A Fazer', color: '#6B7280' },
  { id: 'doing', name: 'Em Progresso', color: '#0066FF' },
  { id: 'review', name: 'Em Revisão', color: '#E8C14A' },
  { id: 'done', name: 'Concluído', color: '#2F9E5A' },
]

export function TaskQuickStatusPopover({
  currentStatus,
  availableStatuses,
  onSelectStatus,
  children,
  className = '',
  align = 'start',
}: TaskQuickStatusPopoverProps) {
  const [open, setOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Deduplicação e normalização rigorosa dos status por nome canônico
  const list = useMemo(() => {
    const rawList =
      availableStatuses && availableStatuses.length > 0
        ? availableStatuses
        : DEFAULT_STATUS_LIST

    const map = new Map<string, { id?: string; name: string; color: string }>()
    for (const item of rawList) {
      if (!item || !item.name) continue
      const rawName = item.name.trim()
      const key = rawName.toUpperCase()
      if (!map.has(key)) {
        map.set(key, {
          id: item.id || `st-${key.toLowerCase().replace(/\s+/g, '-')}`,
          name: rawName,
          color: item.color || '#0066FF',
        })
      }
    }

    if (map.size === 0) return DEFAULT_STATUS_LIST
    return Array.from(map.values())
  }, [availableStatuses])

  const currentObj = useMemo(() => {
    return (
      list.find((s) => s.name.toUpperCase() === (currentStatus || '').toUpperCase()) || {
        name: currentStatus || 'A Fazer',
        color: '#0066FF',
      }
    )
  }, [list, currentStatus])

  const handleSelect = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setIsUpdating(true)
    try {
      await onSelectStatus(name)
    } finally {
      setIsUpdating(false)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        onClick={(e) => e.stopPropagation()}
        className={`outline-none transition-all cursor-pointer ${className}`}
      >
        {children ? (
          children
        ) : (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[10.5px] font-bold uppercase tracking-wider text-white hover:brightness-110 shadow-xs transition-transform active:scale-95"
            style={{ backgroundColor: currentObj.color || '#0066FF' }}
            title={`Status atual: ${currentObj.name}. Clique para alterar rapidamente.`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
            <span>{currentObj.name}</span>
            <ChevronDown className="w-2.5 h-2.5 opacity-80" />
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        align={align}
        onClick={(e) => e.stopPropagation()}
        className="w-52 p-1.5 bg-[var(--surface)] border-[var(--line2)] rounded-xl shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-100"
      >
        <div className="flex flex-col gap-1">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ds-muted)] border-b border-[var(--line)]">
            Alterar Status
          </div>
          <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto pr-0.5 no-scrollbar">
            {list.map((st) => {
              const active =
                (currentStatus || '').toLowerCase().trim() ===
                st.name.toLowerCase().trim()
              return (
                <button
                  key={st.id || st.name}
                  type="button"
                  disabled={isUpdating}
                  onClick={(e) => handleSelect(st.name, e)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0066FF]/15 text-[#0066FF]'
                      : 'hover:bg-[var(--line2)] text-[var(--fg)]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: st.color }}
                    />
                    <span>{st.name}</span>
                  </span>
                  {active && <Check className="w-3.5 h-3.5 text-[#0066FF]" />}
                </button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
