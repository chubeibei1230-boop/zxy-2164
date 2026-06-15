import { useWristbandStore } from '@/store/useWristbandStore'
import { STATUS_COLOR_MAP } from '@/types'
import { cn, getColorValue } from '@/lib/utils'
import { Package, Users, Hash, BarChart3, Check, Square, Edit3, Trash2 } from 'lucide-react'
import { useState } from 'react'

export default function BatchOverview() {
  const {
    getFilteredRecords,
    selectedIds,
    toggleSelect,
    deleteRecord,
    setEditingRecord,
    setShowForm,
    updateRecord,
    records,
  } = useWristbandStore()

  const filtered = getFilteredRecords()

  const batchMap = new Map<string, typeof filtered>()
  for (const r of filtered) {
    if (!batchMap.has(r.batchName)) batchMap.set(r.batchName, [])
    batchMap.get(r.batchName)!.push(r)
  }

  const batches = [...batchMap.entries()].sort(([a], [b]) => a.localeCompare(b))
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((r) => selectedIds.includes(r.id))

  const getStatusCounts = (items: typeof filtered) => {
    const counts: Record<string, number> = {}
    for (const r of items) {
      counts[r.status] = (counts[r.status] || 0) + 1
    }
    return counts
  }

  const getTotalQty = (items: typeof filtered) =>
    items.reduce((sum, r) => sum + r.quantity, 0)

  const handleSelectAllInBatch = (items: typeof filtered) => {
    const allInBatchSelected = items.every((r) => selectedIds.includes(r.id))
    if (allInBatchSelected) {
      for (const r of items) {
        if (selectedIds.includes(r.id)) toggleSelect(r.id)
      }
    } else {
      for (const r of items) {
        if (!selectedIds.includes(r.id)) toggleSelect(r.id)
      }
    }
  }

  const handleEdit = (record: typeof filtered[0]) => {
    setEditingRecord(record)
    setShowForm(true)
  }

  const [statusMenuId, setStatusMenuId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {batches.length === 0 && (
        <div className="text-center py-20 text-zinc-500 text-sm">
          暂无筛选后的条目数据
        </div>
      )}

      {batches.map(([batchName, items]) => {
        const statusCounts = getStatusCounts(items)
        const totalQty = getTotalQty(items)
        const sortedItems = [...items].sort((a, b) => a.priority - b.priority)
        const allInBatchSelected = items.every((r) => selectedIds.includes(r.id))
        const someInBatchSelected = items.some((r) => selectedIds.includes(r.id))

        return (
          <div
            key={batchName}
            className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden"
          >
            <div className="px-5 py-4 bg-zinc-900/80 border-b border-zinc-800/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSelectAllInBatch(items)}
                    className="p-0.5"
                    title={allInBatchSelected ? '取消全选本批次' : '全选本批次'}
                  >
                    {allInBatchSelected ? (
                      <Check size={16} className="text-indigo-400" />
                    ) : someInBatchSelected ? (
                      <div className="w-4 h-4 border-2 border-zinc-600 rounded-sm bg-zinc-700" />
                    ) : (
                      <Square size={16} className="text-zinc-600" />
                    )}
                  </button>
                  <Package size={18} className="text-indigo-400" />
                  <h3 className="text-base font-semibold text-zinc-100">{batchName}</h3>
                  <span className="text-xs text-zinc-500">{items.length} 条</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Hash size={12} />
                    总量{' '}
                    <span className="text-zinc-200 font-medium tabular-nums">
                      {totalQty}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Users size={12} />
                    {new Set(items.map((r) => r.responsiblePerson)).size} 位责任人
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <BarChart3 size={12} />
                    {Object.entries(statusCounts).map(([s, c]) => (
                      <span
                        key={s}
                        className={cn(
                          'px-1.5 py-0.5 rounded-full border text-[10px] font-medium',
                          STATUS_COLOR_MAP[s as keyof typeof STATUS_COLOR_MAP]
                        )}
                      >
                        {s} {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-zinc-800/30">
              {sortedItems.map((r) => {
                const isSelected = selectedIds.includes(r.id)
                return (
                  <div
                    key={r.id}
                    className={cn(
                      'px-5 py-3 flex items-center gap-4 hover:bg-zinc-800/20 transition-colors',
                      isSelected ? 'bg-indigo-500/5' : ''
                    )}
                  >
                    <button onClick={() => toggleSelect(r.id)}>
                      {isSelected ? (
                        <Check size={16} className="text-indigo-400" />
                      ) : (
                        <Square size={16} className="text-zinc-600" />
                      )}
                    </button>
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-mono">
                      {r.priority}
                    </span>
                    <span
                      className="w-4 h-4 rounded-full border border-zinc-600/50 shrink-0"
                      style={{ backgroundColor: getColorValue(r.color) }}
                    />
                    <span className="text-sm text-zinc-200 w-12">{r.color}</span>
                    <span className="text-sm text-zinc-300 w-16 tabular-nums">
                      {r.quantity} 个
                    </span>
                    <span className="text-sm text-zinc-400 w-20">{r.targetGroup}</span>
                    <span className="text-sm text-zinc-400 flex-1">
                      {r.responsiblePerson}
                    </span>

                    <div className="relative">
                      <button
                        onClick={() =>
                          setStatusMenuId(statusMenuId === r.id ? null : r.id)
                        }
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium border cursor-pointer transition-colors',
                          STATUS_COLOR_MAP[r.status]
                        )}
                      >
                        {r.status}
                      </button>
                      {statusMenuId === r.id && (
                        <div className="absolute z-20 mt-1 right-0 bg-zinc-800 border border-zinc-700/60 rounded-lg shadow-xl py-1 min-w-[100px]">
                          {['待分装', '待复核', '可发放', '暂缓'].map((s) => (
                            <button
                              key={s}
                              onClick={() => {
                                updateRecord(r.id, { status: s as any })
                                setStatusMenuId(null)
                              }}
                              className={cn(
                                'block w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-700/60 transition-colors',
                                r.status === s
                                  ? 'text-indigo-400 font-medium'
                                  : 'text-zinc-300'
                              )}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {r.notes && (
                      <span
                        className="text-xs text-zinc-500 max-w-[160px] truncate"
                        title={r.notes}
                      >
                        {r.notes}
                      </span>
                    )}

                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => handleEdit(r)}
                        className="p-1.5 rounded-lg hover:bg-zinc-700/60 text-zinc-400 hover:text-indigo-400 transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => deleteRecord(r.id)}
                        className="p-1.5 rounded-lg hover:bg-zinc-700/60 text-zinc-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
