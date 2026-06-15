import { useWristbandStore } from '@/store/useWristbandStore'
import { COLOR_MAP, STATUS_COLOR_MAP } from '@/types'
import { cn } from '@/lib/utils'
import { Package, Users, Hash, BarChart3 } from 'lucide-react'

export default function BatchOverview() {
  const { getFilteredRecords, records } = useWristbandStore()
  const filtered = getFilteredRecords()

  const batchMap = new Map<string, typeof filtered>()
  for (const r of filtered) {
    if (!batchMap.has(r.batchName)) batchMap.set(r.batchName, [])
    batchMap.get(r.batchName)!.push(r)
  }

  const batches = [...batchMap.entries()].sort(([a], [b]) => a.localeCompare(b))

  const getStatusCounts = (items: typeof filtered) => {
    const counts: Record<string, number> = {}
    for (const r of items) {
      counts[r.status] = (counts[r.status] || 0) + 1
    }
    return counts
  }

  const getTotalQty = (items: typeof filtered) =>
    items.reduce((sum, r) => sum + r.quantity, 0)

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

        return (
          <div
            key={batchName}
            className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden"
          >
            <div className="px-5 py-4 bg-zinc-900/80 border-b border-zinc-800/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package size={18} className="text-indigo-400" />
                  <h3 className="text-base font-semibold text-zinc-100">{batchName}</h3>
                  <span className="text-xs text-zinc-500">{items.length} 条</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Hash size={12} />
                    总量 <span className="text-zinc-200 font-medium tabular-nums">{totalQty}</span>
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
              {sortedItems.map((r) => (
                <div
                  key={r.id}
                  className="px-5 py-3 flex items-center gap-4 hover:bg-zinc-800/20 transition-colors"
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-mono">
                    {r.priority}
                  </span>
                  <span
                    className="w-4 h-4 rounded-full border border-zinc-600/50 shrink-0"
                    style={{ backgroundColor: COLOR_MAP[r.color] || '#888' }}
                  />
                  <span className="text-sm text-zinc-200 w-12">{r.color}</span>
                  <span className="text-sm text-zinc-300 w-16 tabular-nums">{r.quantity} 个</span>
                  <span className="text-sm text-zinc-400 w-20">{r.targetGroup}</span>
                  <span className="text-sm text-zinc-400 flex-1">{r.responsiblePerson}</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium border',
                      STATUS_COLOR_MAP[r.status]
                    )}
                  >
                    {r.status}
                  </span>
                  {r.notes && (
                    <span className="text-xs text-zinc-500 max-w-[200px] truncate" title={r.notes}>
                      {r.notes}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
