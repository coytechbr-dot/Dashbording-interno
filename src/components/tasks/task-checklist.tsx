'use client'

import React, { useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { TaskSubtaskItem } from '@/types/coydash'

interface TaskChecklistProps {
  subtasks: TaskSubtaskItem[]
  onChange: (subtasks: TaskSubtaskItem[]) => void
}

export function TaskChecklist({ subtasks, onChange }: TaskChecklistProps) {
  const [newItemTitle, setNewItemTitle] = useState('')

  const completedCount = subtasks.filter((st) => st.is_completed).length
  const totalCount = subtasks.length
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemTitle.trim()) return

    const newSub: TaskSubtaskItem = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: newItemTitle.trim(),
      is_completed: false,
    }

    onChange([...subtasks, newSub])
    setNewItemTitle('')
  }

  const handleToggle = (subtaskId: string) => {
    onChange(
      subtasks.map((st) =>
        st.id === subtaskId ? { ...st, is_completed: !st.is_completed } : st
      )
    )
  }

  const handleDelete = (subtaskId: string) => {
    onChange(subtasks.filter((st) => st.id !== subtaskId))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-[13px] font-medium text-[var(--fg)]">
        <span>Checklist de Etapas</span>
        <span className="text-[12px] font-semibold text-[var(--ds-muted)]">{progressPercent}%</span>
      </div>

      {totalCount > 0 && (
        <div className="h-1.5 w-full bg-[var(--line2)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-brand-orange)] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1">
        {subtasks.map((st) => (
          <div
            key={st.id}
            className={`flex items-center gap-3 group px-2 py-1.5 rounded-lg transition-colors hover:bg-[var(--line)]/40 ${
              st.is_completed ? 'opacity-65' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => handleToggle(st.id)}
              className={`shrink-0 w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors cursor-pointer ${
                st.is_completed
                  ? 'bg-[var(--color-brand-orange)] border-[var(--color-brand-orange)] text-[#141414]'
                  : 'bg-[var(--surface)] border-[var(--line2)] hover:border-[var(--color-brand-orange)]'
              }`}
            >
              {st.is_completed && <Check className="w-3 h-3 stroke-[2.8]" />}
            </button>

            <span
              className={`flex-1 text-[13px] break-words transition-all ${
                st.is_completed ? 'line-through text-[var(--ds-muted)]' : 'text-[var(--fg)]'
              }`}
            >
              {st.title}
            </span>

            <button
              type="button"
              onClick={() => handleDelete(st.id)}
              className="text-[var(--ds-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
              title="Excluir item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-1">
        <Input
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd(e)
            }
          }}
          placeholder="Adicionar etapa ao checklist..."
          className="h-[36px] text-[13px] bg-[var(--surface)] border-[var(--line2)] px-3 rounded-lg"
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={!newItemTitle.trim()}
          variant="outline"
          className="h-[36px] w-[36px] p-0 shrink-0 text-[var(--color-brand-orange)] border-[var(--line2)] hover:bg-[var(--color-brand-orange)]/10 cursor-pointer rounded-lg"
          title="Adicionar"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
