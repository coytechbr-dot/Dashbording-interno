'use client'

import React, { useState, useMemo } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  RotateCcw,
} from 'lucide-react'
import {
  format,
  addDays,
  isSameDay,
  isToday,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isValid,
  parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface CoyDatePickerProps {
  value?: string | null
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  className?: string
  includeTime?: boolean
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  align?: 'start' | 'center' | 'end'
}

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function CoyDatePicker({
  value,
  onChange,
  placeholder = 'Selecionar data',
  label,
  className = '',
  includeTime = false,
  disabled = false,
  minDate,
  maxDate,
  align = 'start',
}: CoyDatePickerProps) {
  const [open, setOpen] = useState(false)

  // Parse da data selecionada
  const selectedDate = useMemo(() => {
    if (!value) return null
    try {
      const parsed = parseISO(value)
      return isValid(parsed) ? parsed : null
    } catch {
      return null
    }
  }, [value])

  // Mês em exibição no calendário
  const [viewDate, setViewDate] = useState<Date>(() => selectedDate || new Date())

  // Estado local para hora e minuto se includeTime for true
  const initialTime = useMemo(() => {
    if (selectedDate && includeTime) {
      const hours = String(selectedDate.getHours()).padStart(2, '0')
      const mins = String(selectedDate.getMinutes()).padStart(2, '0')
      return `${hours}:${mins}`
    }
    return '09:00'
  }, [selectedDate, includeTime])

  const [timeValue, setTimeValue] = useState(initialTime)

  // Sincroniza viewDate quando abrir ou mudar selectedDate
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && selectedDate) {
      setViewDate(selectedDate)
      if (includeTime) {
        const hours = String(selectedDate.getHours()).padStart(2, '0')
        const mins = String(selectedDate.getMinutes()).padStart(2, '0')
        setTimeValue(`${hours}:${mins}`)
      }
    }
    setOpen(nextOpen)
  }

  // Gera a matriz de dias do mês em exibição
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [viewDate])

  const currentMonthYearLabel = useMemo(() => {
    const str = format(viewDate, 'MMMM yyyy', { locale: ptBR })
    return str.charAt(0).toUpperCase() + str.slice(1)
  }, [viewDate])

  // Formatação do texto visível no trigger
  const displayLabel = useMemo(() => {
    if (!selectedDate) return null
    if (includeTime) {
      return format(selectedDate, "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR })
    }
    return format(selectedDate, "dd 'de' MMM, yyyy", { locale: ptBR })
  }, [selectedDate, includeTime])

  // Ação ao selecionar um dia
  const handleDaySelect = (day: Date) => {
    let resultDate = day
    if (includeTime) {
      const [hours, minutes] = timeValue.split(':').map(Number)
      resultDate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours || 0, minutes || 0)
    }

    const isoString = includeTime
      ? format(resultDate, "yyyy-MM-dd'T'HH:mm")
      : format(resultDate, 'yyyy-MM-dd')

    onChange(isoString)
    if (!includeTime) {
      setOpen(false)
    }
  }

  // Ação ao alterar o horário
  const handleTimeChange = (newTime: string) => {
    setTimeValue(newTime)
    if (selectedDate) {
      const [hours, minutes] = newTime.split(':').map(Number)
      const updated = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        hours || 0,
        minutes || 0
      )
      onChange(format(updated, "yyyy-MM-dd'T'HH:mm"))
    }
  }

  // Atalhos rápidos
  const handlePresetSelect = (daysFromToday: number) => {
    const target = addDays(new Date(), daysFromToday)
    handleDaySelect(target)
    setViewDate(target)
  }

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    onChange('')
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        disabled={disabled}
        className={`h-[38px] px-3.5 rounded-xl bg-[var(--surface)] border border-[var(--line2)] text-[12.5px] text-[var(--fg)] outline-none cursor-pointer flex items-center justify-between gap-2.5 hover:border-[#0066FF]/60 hover:bg-[var(--ds-hover)] transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed ${
          open ? 'border-[#0066FF] ring-2 ring-[#0066FF]/15' : ''
        } ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          <CalendarIcon className="w-4 h-4 text-[#0066FF] shrink-0" />
          <span className={`truncate font-medium ${!displayLabel ? 'text-[var(--ds-muted)]' : 'text-[var(--fg)]'}`}>
            {displayLabel || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedDate && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear()}
              className="p-1 rounded-md text-[var(--ds-muted)] hover:text-red-500 hover:bg-[var(--line2)]/50 transition-colors"
              title="Limpar data"
            >
              <X className="w-3 h-3" />
            </span>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        className="w-[304px] p-3 rounded-2xl bg-[var(--surface)] border border-[var(--line2)] shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-100"
      >
        {/* Cabeçalho do Mês */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--line)]">
          <button
            type="button"
            onClick={() => setViewDate((prev) => subMonths(prev, 1))}
            className="w-7 h-7 rounded-lg hover:bg-[var(--ds-hover)] text-[var(--ds-muted)] hover:text-[var(--fg)] grid place-items-center cursor-pointer transition-colors"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-[13px] font-bold text-[var(--fg)]">
            {currentMonthYearLabel}
          </span>

          <button
            type="button"
            onClick={() => setViewDate((prev) => addMonths(prev, 1))}
            className="w-7 h-7 rounded-lg hover:bg-[var(--ds-hover)] text-[var(--ds-muted)] hover:text-[var(--fg)] grid place-items-center cursor-pointer transition-colors"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Atalhos Rápidos */}
        <div className="flex items-center gap-1 mb-2.5 pb-2 border-b border-[var(--line)] overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => handlePresetSelect(0)}
            className="px-2 py-1 rounded-md bg-[var(--bg)] hover:bg-[#0066FF]/15 hover:text-[#0066FF] border border-[var(--line2)] text-[11px] font-semibold text-[var(--fg)] transition-colors cursor-pointer shrink-0"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect(1)}
            className="px-2 py-1 rounded-md bg-[var(--bg)] hover:bg-[#0066FF]/15 hover:text-[#0066FF] border border-[var(--line2)] text-[11px] font-semibold text-[var(--fg)] transition-colors cursor-pointer shrink-0"
          >
            Amanhã
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect(3)}
            className="px-2 py-1 rounded-md bg-[var(--bg)] hover:bg-[#0066FF]/15 hover:text-[#0066FF] border border-[var(--line2)] text-[11px] font-semibold text-[var(--fg)] transition-colors cursor-pointer shrink-0"
          >
            +3 dias
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect(7)}
            className="px-2 py-1 rounded-md bg-[var(--bg)] hover:bg-[#0066FF]/15 hover:text-[#0066FF] border border-[var(--line2)] text-[11px] font-semibold text-[var(--fg)] transition-colors cursor-pointer shrink-0"
          >
            +1 semana
          </button>
        </div>

        {/* Dias da Semana */}
        <div className="grid grid-cols-7 gap-1 mb-1 text-center">
          {WEEKDAY_NAMES.map((name) => (
            <span key={name} className="text-[10.5px] font-bold text-[var(--ds-muted)] py-1">
              {name}
            </span>
          ))}
        </div>

        {/* Grade de Dias */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            const isCurrentMonth = day.getMonth() === viewDate.getMonth()
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
            const isDayToday = isToday(day)

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleDaySelect(day)}
                className={`h-8 rounded-lg text-[12px] font-medium grid place-items-center transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#0066FF] text-white font-bold shadow-md shadow-[#0066FF]/25 scale-105'
                    : isCurrentMonth
                      ? 'text-[var(--fg)] hover:bg-[var(--ds-hover)] hover:text-[#0066FF]'
                      : 'text-[var(--ds-muted)]/35 hover:bg-[var(--ds-hover)] hover:text-[var(--ds-muted)]'
                } ${isDayToday && !isSelected ? 'border border-[#0066FF]/50 text-[#0066FF] font-semibold' : ''}`}
              >
                <span>{format(day, 'd')}</span>
              </button>
            )
          })}
        </div>

        {/* Seletor de Horário se includeTime for true */}
        {includeTime && (
          <div className="mt-3 pt-2.5 border-t border-[var(--line)] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--ds-muted)] font-medium">
              <Clock className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>Horário:</span>
            </div>
            <input
              type="time"
              value={timeValue}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="h-7 px-2 rounded-lg bg-[var(--bg)] border border-[var(--line2)] text-[12px] font-bold text-[var(--fg)] outline-none focus:border-[#0066FF] cursor-pointer"
            />
          </div>
        )}

        {/* Rodapé com botão Concluir/Limpar */}
        <div className="mt-3 pt-2.5 border-t border-[var(--line)] flex items-center justify-between">
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-semibold text-[var(--ds-muted)] hover:text-red-500 cursor-pointer flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpar</span>
          </button>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-7 px-3 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white text-[11.5px] font-bold cursor-pointer transition-colors shadow-sm"
          >
            Confirmar
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
