'use client'

import React, { useState, useMemo } from 'react'
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Plus,
  Trash2,
  Bookmark,
  Check,
  X,
  Layers,
  ChevronDown,
  AlertCircle,
} from 'lucide-react'
import { useCoyDash } from '@/lib/coydash-store'
import type {
  SavedViewScope,
  WorkspaceSavedViewItem,
  SavedViewSortRule,
} from '@/types/coydash'

export interface DataGridColumn<T> {
  id: string
  label: string
  accessor?: (item: T) => any
  renderCell?: (item: T) => React.ReactNode
  sortable?: boolean
  defaultVisible?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface CoyDataGridProps<T extends { id: string }> {
  scope: SavedViewScope
  data: T[]
  columns: DataGridColumn<T>[]
  onRowClick?: (item: T) => void
  searchPlaceholder?: string
  emptyMessage?: string
  defaultSort?: SavedViewSortRule
}

export function CoyDataGrid<T extends { id: string }>({
  scope,
  data,
  columns,
  onRowClick,
  searchPlaceholder = 'Filtrar registros...',
  emptyMessage = 'Nenhum registro encontrado',
  defaultSort,
}: CoyDataGridProps<T>) {
  const { savedViews, saveWorkspaceView, deleteWorkspaceView } = useCoyDash()

  // 1. Estados de Visibilidade de Colunas
  const initialVisibleColumns = useMemo(() => {
    return columns.filter((c) => c.defaultVisible !== false).map((c) => c.id)
  }, [columns])

  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(initialVisibleColumns)
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false)

  // 2. Estados de Busca e Ordenação
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<SavedViewSortRule | null>(
    defaultSort || null
  )

  // 3. Estados de Visões Salvas (Saved Views)
  const [activeViewId, setActiveViewId] = useState<string>('default')
  const [saveViewModalOpen, setSaveViewModalOpen] = useState(false)
  const [newViewName, setNewViewName] = useState('')
  const [isSharedView, setIsSharedView] = useState(true)
  const [isSavingView, setIsSavingView] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  // Visões salvas do escopo atual vindas do banco
  const scopeSavedViews = useMemo(() => {
    return savedViews.filter((v) => v.view_scope === scope)
  }, [savedViews, scope])

  // Alternar Visão Selecionada
  const handleSelectView = (viewId: string) => {
    setActiveViewId(viewId)
    if (viewId === 'default') {
      setVisibleColumnIds(initialVisibleColumns)
      setSortConfig(defaultSort || null)
      setSearchQuery('')
      return
    }

    const found = scopeSavedViews.find((v) => v.id === viewId)
    if (found) {
      if (Array.isArray(found.columns_visible) && found.columns_visible.length > 0) {
        setVisibleColumnIds(found.columns_visible)
      }
      if (found.sort_config && found.sort_config.field) {
        setSortConfig(found.sort_config)
      }
    }
  }

  // Toggle de Visibilidade de Coluna
  const handleToggleColumn = (colId: string) => {
    setVisibleColumnIds((prev) => {
      if (prev.includes(colId)) {
        if (prev.length <= 1) return prev // Não permite ocultar todas as colunas
        return prev.filter((id) => id !== colId)
      } else {
        return [...prev, colId]
      }
    })
  }

  // Alternar Ordenação ao clicar no cabeçalho
  const handleSort = (colId: string) => {
    setSortConfig((prev) => {
      if (!prev || prev.field !== colId) {
        return { field: colId, direction: 'asc' }
      }
      if (prev.direction === 'asc') {
        return { field: colId, direction: 'desc' }
      }
      return null
    })
  }

  // Filtragem e Ordenação dos Dados
  const processedData = useMemo(() => {
    let list = [...data]

    // 1. Filtro por Busca Global
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((item) => {
        return columns.some((col) => {
          if (!visibleColumnIds.includes(col.id)) return false
          const val = col.accessor ? col.accessor(item) : (item as any)[col.id]
          if (val === null || val === undefined) return false
          return String(val).toLowerCase().includes(q)
        })
      })
    }

    // 2. Ordenação
    if (sortConfig) {
      const col = columns.find((c) => c.id === sortConfig.field)
      if (col) {
        list.sort((a, b) => {
          const valA = col.accessor ? col.accessor(a) : (a as any)[col.id]
          const valB = col.accessor ? col.accessor(b) : (b as any)[col.id]

          if (valA === valB) return 0
          if (valA === null || valA === undefined) return 1
          if (valB === null || valB === undefined) return -1

          let comparison = 0
          if (typeof valA === 'number' && typeof valB === 'number') {
            comparison = valA - valB
          } else {
            comparison = String(valA).localeCompare(String(valB), 'pt-BR', {
              numeric: true,
            })
          }

          return sortConfig.direction === 'asc' ? comparison : -comparison
        })
      }
    }

    return list
  }, [data, columns, visibleColumnIds, searchQuery, sortConfig])

  // Salvar Visão Atual no Banco Supabase
  const handleSaveViewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newViewName.trim()) return

    setIsSavingView(true)
    try {
      const created = await saveWorkspaceView({
        view_scope: scope,
        name: newViewName.trim(),
        icon: 'Bookmark',
        is_shared: isSharedView,
        columns_visible: visibleColumnIds,
        filters_config: [],
        sort_config: sortConfig || { field: 'created_at', direction: 'desc' },
      })

      if (created) {
        setActiveViewId(created.id)
        setSaveViewModalOpen(false)
        setNewViewName('')
        setFeedbackMsg(`Visão "${created.name}" salva com sucesso!`)
        setTimeout(() => setFeedbackMsg(null), 3000)
      }
    } catch (err) {
      console.error('Erro ao salvar visão:', err)
    } finally {
      setIsSavingView(false)
    }
  }

  // Excluir Visão Salva
  const handleDeleteView = async (viewId: string, viewName: string) => {
    if (!window.confirm(`Deseja realmente remover a visão "${viewName}"?`)) return
    try {
      await deleteWorkspaceView(viewId)
      if (activeViewId === viewId) {
        handleSelectView('default')
      }
    } catch (err) {
      console.error('Erro ao deletar visão:', err)
    }
  }

  // Exportar Tabela para CSV
  const handleExportCSV = () => {
    const activeCols = columns.filter((c) => visibleColumnIds.includes(c.id))
    const headerRow = activeCols.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(';')

    const dataRows = processedData.map((item) => {
      return activeCols
        .map((col) => {
          const val = col.accessor ? col.accessor(item) : (item as any)[col.id]
          const cleanVal = val === null || val === undefined ? '' : String(val)
          return `"${cleanVal.replace(/"/g, '""')}"`
        })
        .join(';')
    })

    const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `coydash-${scope.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderedColumns = columns.filter((c) => visibleColumnIds.includes(c.id))

  return (
    <div className="bg-[var(--surface)] border border-[var(--line2)] rounded-[16px] overflow-hidden flex flex-col shadow-sm">
      {/* 1. BARRA DE VISÕES SALVAS (SAVED VIEWS) */}
      <div className="px-[16px] pt-[12px] pb-[8px] border-b border-[var(--line2)] bg-[var(--bg)]/50 flex flex-wrap items-center justify-between gap-[10px]">
        <div className="flex items-center gap-[6px] overflow-x-auto no-scrollbar">
          {/* Visão Padrão */}
          <button
            type="button"
            onClick={() => handleSelectView('default')}
            className={`h-[32px] px-[12px] rounded-full text-[12px] font-semibold flex items-center gap-[6px] transition-colors cursor-pointer ${
              activeViewId === 'default'
                ? 'bg-[#141414] text-[#F4F4F2]'
                : 'bg-[var(--surface)] border border-[var(--line2)] text-[var(--ds-muted)] hover:text-[var(--fg)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todos os Registros</span>
          </button>

          {/* Visões Salvas pelo Usuário */}
          {scopeSavedViews.map((view) => {
            const isActive = activeViewId === view.id
            return (
              <div key={view.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleSelectView(view.id)}
                  className={`h-[32px] pl-[12px] pr-[8px] rounded-l-full text-[12px] font-semibold flex items-center gap-[6px] transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#f0521f] text-[#141414]'
                      : 'bg-[var(--surface)] border border-r-0 border-[var(--line2)] text-[var(--ds-muted)] hover:text-[var(--fg)]'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{view.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteView(view.id, view.name)}
                  className={`h-[32px] px-[8px] rounded-r-full text-[11px] grid place-items-center transition-colors cursor-pointer border-l-0 ${
                    isActive
                      ? 'bg-[#f0521f] text-[#141414] hover:bg-[#d84414]'
                      : 'bg-[var(--surface)] border border-l-0 border-[var(--line2)] text-[var(--ds-muted)] hover:text-[#ef4444]'
                  }`}
                  title="Remover esta visão salva"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )
          })}

          {/* Botão Salvar Visão Atual */}
          <button
            type="button"
            onClick={() => setSaveViewModalOpen(true)}
            className="h-[32px] px-[12px] rounded-full border border-dashed border-[var(--line2)] hover:border-[#f0521f] text-[11.5px] font-semibold text-[var(--ds-muted)] hover:text-[var(--fg)] flex items-center gap-[5px] transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3 text-[#f0521f]" />
            <span>Salvar Visão</span>
          </button>
        </div>

        {feedbackMsg && (
          <span className="text-[11.5px] font-semibold text-[#2f9e5a] bg-[#2f9e5a]/10 px-[10px] py-[4px] rounded-full border border-[#2f9e5a]/30">
            {feedbackMsg}
          </span>
        )}
      </div>

      {/* 2. BARRA DE FERRAMENTAS (BUSCA, COLUNAS, EXPORTAÇÃO) */}
      <div className="p-[14px] flex flex-wrap items-center justify-between gap-[12px] border-b border-[var(--line2)] bg-[var(--surface)]">
        {/* Campo de Busca Rápida */}
        <div className="relative flex-1 min-w-[220px] max-w-[400px]">
          <Search className="w-4 h-4 text-[var(--ds-muted)] absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-[36px] pl-[34px] pr-[12px] bg-[var(--bg)] border border-[var(--line2)] rounded-[10px] text-[12.5px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] focus:outline-none focus:border-[#f0521f]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[var(--ds-muted)] hover:text-[var(--fg)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Controles da Direita */}
        <div className="flex items-center gap-[8px]">
          {/* Seletor de Colunas (Show/Hide) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setColumnsDropdownOpen((prev) => !prev)}
              className="h-[36px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] hover:border-[var(--line)] text-[12px] font-semibold text-[var(--fg)] flex items-center gap-[6px] transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#f0521f]" />
              <span>Colunas ({renderedColumns.length}/{columns.length})</span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
            </button>

            {columnsDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setColumnsDropdownOpen(false)}
                />
                <div className="absolute right-0 top-[42px] z-50 w-[240px] bg-[var(--surface)] border border-[var(--line2)] rounded-[14px] p-[10px] shadow-2xl flex flex-col gap-[6px] animate-in fade-in zoom-in-95 duration-100">
                  <div className="text-[11px] font-bold text-[var(--ds-muted)] px-[6px] py-[2px] uppercase tracking-wider border-b border-[var(--line2)] pb-[6px]">
                    Personalizar Colunas
                  </div>
                  <div className="max-h-[260px] overflow-y-auto flex flex-col gap-[2px]">
                    {columns.map((col) => {
                      const isVisible = visibleColumnIds.includes(col.id)
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => handleToggleColumn(col.id)}
                          className="flex items-center justify-between p-[6px] rounded-[8px] hover:bg-[var(--bg)] text-[12px] text-left transition-colors cursor-pointer"
                        >
                          <span className={isVisible ? 'font-semibold text-[var(--fg)]' : 'text-[var(--ds-muted)]'}>
                            {col.label}
                          </span>
                          <span
                            className={`w-[16px] h-[16px] rounded-[4px] border grid place-items-center ${
                              isVisible
                                ? 'bg-[#f0521f] border-[#f0521f] text-white'
                                : 'border-[var(--line2)] bg-[var(--bg)]'
                            }`}
                          >
                            {isVisible && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Botão Exportar CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="h-[36px] px-[12px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] hover:border-[var(--line)] text-[12px] font-semibold text-[var(--fg)] flex items-center gap-[6px] transition-colors cursor-pointer"
            title="Exportar dados filtrados para CSV"
          >
            <Download className="w-3.5 h-3.5 text-[var(--ds-muted)]" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          {/* Contador de Registros */}
          <span className="text-[11.5px] font-semibold text-[var(--ds-muted)] px-[8px]">
            {processedData.length} {processedData.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>
      </div>

      {/* 3. CORPO DA TABELA DE DADOS */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12.5px] border-collapse">
          <thead className="bg-[var(--bg)] border-b border-[var(--line2)] text-[var(--ds-muted)] font-semibold text-[11px] uppercase tracking-wider select-none">
            <tr>
              {renderedColumns.map((col) => {
                const isSorted = sortConfig?.field === col.id
                const isSortable = col.sortable !== false

                return (
                  <th
                    key={col.id}
                    onClick={() => isSortable && handleSort(col.id)}
                    style={{ width: col.width }}
                    className={`py-[12px] px-[14px] ${
                      isSortable ? 'cursor-pointer hover:bg-[var(--line2)]/40' : ''
                    } transition-colors`}
                  >
                    <div className="flex items-center gap-[6px]">
                      <span>{col.label}</span>
                      {isSortable && (
                        <span className="text-[var(--ds-muted)]">
                          {isSorted ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-[#f0521f]" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-[#f0521f]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--line2)] bg-[var(--surface)]">
            {processedData.length === 0 ? (
              <tr>
                <td
                  colSpan={renderedColumns.length}
                  className="py-[48px] px-[20px] text-center text-[var(--ds-muted)] text-[13px]"
                >
                  <div className="flex flex-col items-center justify-center gap-[8px]">
                    <Search className="w-6 h-6 opacity-30" />
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              processedData.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`hover:bg-[var(--bg)]/60 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {renderedColumns.map((col) => {
                    const content = col.renderCell
                      ? col.renderCell(item)
                      : col.accessor
                        ? col.accessor(item)
                        : (item as any)[col.id]

                    return (
                      <td
                        key={col.id}
                        className={`py-[12px] px-[14px] text-[var(--fg)] ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                              ? 'text-center'
                              : 'text-left'
                        }`}
                      >
                        {content}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. MODAL PARA SALVAR NOVA VISÃO */}
      {saveViewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-[16px] bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-[420px] bg-[var(--surface)] border border-[var(--line2)] rounded-[18px] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-[18px] border-b border-[var(--line)] flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-[var(--fg)]">Salvar Visão da Tabela</h3>
                <p className="text-[11.5px] text-[var(--ds-muted)]">
                  Grave as colunas e ordenação atuais para acesso rápido
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSaveViewModalOpen(false)}
                className="w-[28px] h-[28px] rounded-full hover:bg-[var(--bg)] text-[var(--ds-muted)] hover:text-[var(--fg)] grid place-items-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveViewSubmit} className="p-[18px] flex flex-col gap-[14px] text-[13px]">
              <div>
                <label className="block text-[12px] font-semibold text-[var(--fg)] mb-[5px]">
                  Nome da Visão *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="Ex: Oportunidades Quentes > R$ 3k"
                  className="w-full h-[38px] px-[12px] bg-[var(--bg)] border border-[var(--line2)] rounded-[10px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] focus:outline-none focus:border-[#f0521f]"
                />
              </div>

              <label className="flex items-center gap-[10px] p-[10px] rounded-[10px] bg-[var(--bg)] border border-[var(--line2)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSharedView}
                  onChange={(e) => setIsSharedView(e.target.checked)}
                  className="w-4 h-4 rounded text-[#f0521f] focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-[12px] font-semibold text-[var(--fg)] block">
                    Compartilhar com toda a equipe
                  </span>
                  <span className="text-[11px] text-[var(--ds-muted)] block">
                    Outros membros da organização poderão ver e usar esta aba
                  </span>
                </div>
              </label>

              <div className="p-[10px] rounded-[10px] bg-[var(--bg)] text-[11.5px] text-[var(--ds-muted)] flex flex-col gap-[3px]">
                <div>• {visibleColumnIds.length} colunas visíveis serão salvas</div>
                {sortConfig && (
                  <div>
                    • Ordenação ativa: {sortConfig.field} ({sortConfig.direction.toUpperCase()})
                  </div>
                )}
              </div>

              <div className="pt-[10px] border-t border-[var(--line)] flex items-center justify-end gap-[8px]">
                <button
                  type="button"
                  onClick={() => setSaveViewModalOpen(false)}
                  className="h-[36px] px-[14px] rounded-full border border-[var(--line2)] text-[var(--fg)] font-semibold text-[12px] hover:bg-[var(--bg)] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingView}
                  className="h-[36px] px-[18px] rounded-full bg-[#141414] hover:bg-[#f0521f] text-[#F4F4F2] font-semibold text-[12px] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingView ? 'Salvando...' : 'Salvar Visão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

