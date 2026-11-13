'use client'

import React, { useState, useMemo } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronDown, Check, Search } from 'lucide-react'

export interface CoyDropdownOption {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
  badge?: string | number
  colorDot?: string
  disabled?: boolean
}

export interface CoyDropdownProps {
  value: string
  onChange: (value: string) => void
  options: CoyDropdownOption[]
  placeholder?: string
  icon?: React.ReactNode
  className?: string
  contentClassName?: string
  searchable?: boolean
  searchPlaceholder?: string
  disabled?: boolean
  align?: 'start' | 'center' | 'end'
  title?: string
}

export function CoyDropdown({
  value,
  onChange,
  options,
  placeholder = 'Selecione uma opção',
  icon,
  className = '',
  contentClassName = '',
  searchable,
  searchPlaceholder = 'Buscar...',
  disabled = false,
  align = 'start',
  title,
}: CoyDropdownProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value)
  }, [options, value])

  const showSearch = searchable ?? options.length > 7

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options
    const q = searchQuery.toLowerCase()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    )
  }, [options, searchQuery])

  const handleSelect = (val: string) => {
    onChange(val)
    setOpen(false)
    setSearchQuery('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        title={title}
        className={`h-[34px] px-[12px] rounded-full bg-[var(--surface)] border border-[var(--line2)] text-[12px] text-[var(--fg)] outline-none cursor-pointer flex items-center justify-between gap-[8px] hover:border-[var(--color-brand-blue)]/50 hover:bg-[var(--ds-hover)] transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed ${
          open ? 'border-[var(--color-brand-blue)] ring-2 ring-[var(--color-brand-blue)]/15' : ''
        } ${className}`}
      >
        <div className="flex items-center gap-[7px] min-w-0 truncate">
          {selectedOption?.icon ? (
            <span className="shrink-0 flex items-center">{selectedOption.icon}</span>
          ) : selectedOption?.colorDot ? (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: selectedOption.colorDot }}
            />
          ) : icon ? (
            <span className="shrink-0 flex items-center text-[var(--ds-muted)]">{icon}</span>
          ) : null}
          <span className="truncate font-medium">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge !== undefined && (
            <span className="ml-1 px-[6px] py-[1px] rounded-full bg-[var(--bg)] border border-[var(--line2)] text-[10px] font-semibold text-[var(--ds-muted)] shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[var(--ds-muted)] shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180 text-[var(--color-brand-blue)]' : ''
          }`}
        />
      </PopoverTrigger>

      <PopoverContent
        align={align}
        sideOffset={6}
        className={`z-50 w-auto min-w-[220px] max-w-[360px] p-[6px] rounded-xl bg-[var(--surface)] text-[var(--fg)] border border-[var(--line2)] shadow-2xl backdrop-blur-md flex flex-col gap-[3px] select-none ${contentClassName}`}
      >
        {showSearch && (
          <div className="px-[6px] pt-[2px] pb-[6px] border-b border-[var(--line)] mb-[4px]">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[var(--ds-muted)] absolute left-[9px] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                autoFocus
                className="w-full h-[30px] pl-[30px] pr-[10px] rounded-lg bg-[var(--bg)] border border-[var(--line2)] text-[12px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] outline-none focus:border-[var(--color-brand-blue)]"
              />
            </div>
          </div>
        )}

        <div className="max-h-[280px] overflow-y-auto space-y-[2px] pr-[2px]">
          {filteredOptions.length === 0 ? (
            <div className="py-[14px] text-center text-[12px] text-[var(--ds-muted)]">
              Nenhuma opção encontrada
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between gap-[10px] px-[10px] py-[7px] rounded-lg text-left text-[12px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isSelected
                      ? 'bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] font-semibold'
                      : 'text-[var(--fg)] hover:bg-[var(--ds-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-[8px] min-w-0 truncate">
                    {opt.icon ? (
                      <span className={`shrink-0 flex items-center ${isSelected ? 'text-[var(--color-brand-blue)]' : 'text-[var(--ds-muted)]'}`}>
                        {opt.icon}
                      </span>
                    ) : opt.colorDot ? (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: opt.colorDot }}
                      />
                    ) : null}
                    <div className="truncate flex flex-col">
                      <span className="truncate leading-tight">{opt.label}</span>
                      {opt.description && (
                        <span className="text-[10px] text-[var(--ds-muted)] font-normal truncate leading-tight">
                          {opt.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-[6px] shrink-0 ml-[8px]">
                    {opt.badge !== undefined && (
                      <span className="px-[5px] py-[1px] rounded-full bg-[var(--bg)] border border-[var(--line2)] text-[10px] font-semibold text-[var(--ds-muted)]">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[var(--color-brand-blue)] shrink-0" />
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
