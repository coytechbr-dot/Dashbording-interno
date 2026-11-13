'use client'

import React, { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Palette, Check } from 'lucide-react'

export interface CoyColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
  className?: string
  disabled?: boolean
}

const PRESET_COLORS = [
  { hex: '#0066FF', label: 'Azul Elétrico' },
  { hex: '#0052CC', label: 'Azul Marinho' },
  { hex: '#06B6D4', label: 'Ciano' },
  { hex: '#2F9E5A', label: 'Verde Sucesso' },
  { hex: '#10B981', label: 'Verde Menta' },
  { hex: '#E8C14A', label: 'Âmbar Atenção' },
  { hex: '#F59E0B', label: 'Laranja Alerta' },
  { hex: '#EF4444', label: 'Vermelho Crítico' },
  { hex: '#8F7DFF', label: 'Lilás IA' },
  { hex: '#6366F1', label: 'Índigo' },
  { hex: '#EC4899', label: 'Rosa' },
  { hex: '#64748B', label: 'Slate Neutro' },
]

export function CoyColorPicker({
  value,
  onChange,
  label,
  className = '',
  disabled = false,
}: CoyColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [customHex, setCustomHex] = useState(value)

  const handleSelectColor = (color: string) => {
    onChange(color)
    setCustomHex(color)
    setOpen(false)
  }

  const handleCustomHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setCustomHex(val)
    if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
      onChange(val)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={`h-[38px] px-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line2)] outline-none cursor-pointer flex items-center gap-2 hover:border-[#0066FF]/60 hover:bg-[var(--ds-hover)] transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed ${
          open ? 'border-[#0066FF] ring-2 ring-[#0066FF]/15' : ''
        } ${className}`}
        title="Selecionar cor"
      >
        <span
          className="w-5 h-5 rounded-full shrink-0 border border-white/20 shadow-sm"
          style={{ backgroundColor: value || '#0066FF' }}
        />
        {label && <span className="text-[12px] font-medium text-[var(--fg)]">{label}</span>}
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[240px] p-3 rounded-2xl bg-[var(--surface)] border border-[var(--line2)] shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-100"
      >
        <div className="flex items-center gap-2 pb-2 mb-2.5 border-b border-[var(--line)] text-[12px] font-bold text-[var(--fg)]">
          <Palette className="w-4 h-4 text-[#0066FF]" />
          <span>Cores de Status</span>
        </div>

        {/* Paleta de Cores em Grade */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {PRESET_COLORS.map((c) => {
            const isSelected = value.toLowerCase() === c.hex.toLowerCase()
            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => handleSelectColor(c.hex)}
                className={`w-10 h-10 rounded-xl grid place-items-center transition-all cursor-pointer relative hover:scale-110 ${
                  isSelected ? 'ring-2 ring-[#0066FF] ring-offset-2 ring-offset-[var(--surface)]' : ''
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.label}
              >
                {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
              </button>
            )
          })}
        </div>

        {/* Input Hexadecimal Customizado */}
        <div className="pt-2 border-t border-[var(--line)] flex items-center gap-2">
          <span className="text-[11px] font-bold text-[var(--ds-muted)] uppercase">HEX</span>
          <input
            type="text"
            value={customHex}
            onChange={handleCustomHexChange}
            placeholder="#0066FF"
            maxLength={7}
            className="flex-1 h-7 px-2 rounded-lg bg-[var(--bg)] border border-[var(--line2)] text-[12px] font-mono font-semibold text-[var(--fg)] outline-none focus:border-[#0066FF]"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
