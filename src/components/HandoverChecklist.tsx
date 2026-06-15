import { useMemo, useState } from 'react'
import { useWristbandStore } from '@/store/useWristbandStore'
import {
  HANDOVER_STATUS_COLOR,
  HANDOVER_STATUS_LIST,
  HandoverStatus,
  STATUS_COLOR_MAP,
} from '@/types'
import { cn, getColorValue } from '@/lib/utils'
import {
  ClipboardList,
  Users,
  AlertCircle,
  Clock,
  CheckCircle2,
  PauseCircle,
  RotateCcw,
  Package,
  Filter,
  ChevronDown,
  User,
  RefreshCw,
} from 'lucide-react'

export default function HandoverChecklist() {
  const {
    getFilteredRecords,
    records,
    getHandoverStatus,
    setHandoverStatus,
    handoverQuickFilter,
    setHandoverQuickFilter,
    handoverPersonFilter,
    setHandoverPersonFilter,
    resetHandoverStatuses,
  } = useWristbandStore()

  const [statusMenuId, setStatusMenuId] = useState<string | null>(null)
  const [showPersonDropdown, setShowPersonDropdown] = useState(false)

  const filtered = getFilteredRecords()

  const persons = useMemo(
    () => [...new Set(filtered.map((r) => r.responsiblePerson))].sort(),
    [filtered]
  )

  const abnormalRecordIds = useMemo(() => {
    const abnormalNoteIds = new Set(
      filtered.filter((r) => r.notes && r.notes.trim() !== '').map((r) => r.id)
    )
    const abnormalStatusIds = new Set(
      filtered.filter((r) => r.status === '暂缓').map((r) => r.id)
    )
    return new Set([...abnormalNoteIds, ...abnormalStatusIds])
  }, [filtered])

  const displayRecords = useMemo(() => {
    let result = filtered

    if (handoverQuickFilter === 'pending') {
      result = result.filter((r) => {
        const hs = getHandoverStatus(r.id)
        return hs === '待确认'
      })
    } else if (handoverQuickFilter === 'abnormal') {
      result = result.filter((r) => abnormalRecordIds.has(r.id))
    } else if (handoverQuickFilter === 'byPerson') {
      if (handoverPersonFilter) {
        result = result.filter((r) => r.responsiblePerson === handoverPersonFilter)
      }
    }

    return result
  }, [filtered, handoverQuickFilter, handoverPersonFilter, abnormalRecordIds, getHandoverStatus])

  const stats = useMemo(() => {
    let totalQty = 0
    let pendingQty = 0
    let suspendedQty = 0
    let abnormalCount = 0

    for (const r of displayRecords) {
      totalQty += r.quantity
      const hs = getHandoverStatus(r.id)
      if (hs === '待确认') pendingQty += r.quantity
      if (hs === '暂缓') suspendedQty += r.quantity
      if (abnormalRecordIds.has(r.id)) abnormalCount += 1
    }

    return { totalQty, pendingQty, suspendedQty, abnormalCount, recordCount: displayRecords.length }
  }, [displayRecords, getHandoverStatus, abnormalRecordIds])

  const batchMap = useMemo(() => {
    const map = new Map<string, typeof displayRecords>()
    for (const r of displayRecords) {
      if (!map.has(r.batchName)) map.set(r.batchName, [])
      map.get(r.batchName)!.push(r)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [displayRecords])

  const quickFilters: Array<{
    key: typeof handoverQuickFilter
    label: string
    icon: typeof Filter
  }> = [
    { key: 'all', label: '全部', icon: Package },
    { key: 'pending', label: '仅看待处理', icon: Clock },
    { key: 'abnormal', label: '仅看异常备注', icon: AlertCircle },
    { key: 'byPerson', label: '按责任人查看', icon: User },
  ]

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <ClipboardList size={18} className="text-indigo-400" />
            <h2 className="text-base font-semibold text-zinc-100">交接清单统计</h2>
          </div>
          <button
            onClick={resetHandoverStatuses}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/60 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors border border-zinc-700/50"
            title="重置全部交接状态为待确认"
          >
            <RefreshCw size={12} />
            重置交接状态
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/40 p-3">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1.5">
              <Package size={12} />
              总数量
            </div>
            <div className="text-2xl font-bold text-zinc-100 tabular-nums">
              {stats.totalQty}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              {stats.recordCount} 条记录
            </div>
          </div>

          <div className="rounded-lg bg-sky-500/10 border border-sky-500/30 p-3">
            <div className="flex items-center gap-2 text-xs text-sky-400 mb-1.5">
              <Clock size={12} />
              待确认数量
            </div>
            <div className="text-2xl font-bold text-sky-300 tabular-nums">
              {stats.pendingQty}
            </div>
            <div className="text-[10px] text-sky-500/80 mt-1">
              {stats.totalQty > 0
                ? `${((stats.pendingQty / stats.totalQty) * 100).toFixed(0)}%`
                : '0%'}
            </div>
          </div>

          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
            <div className="flex items-center gap-2 text-xs text-amber-400 mb-1.5">
              <PauseCircle size={12} />
              暂缓数量
            </div>
            <div className="text-2xl font-bold text-amber-300 tabular-nums">
              {stats.suspendedQty}
            </div>
            <div className="text-[10px] text-amber-500/80 mt-1">
              需现场特别关注
            </div>
          </div>

          <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3">
            <div className="flex items-center gap-2 text-xs text-rose-400 mb-1.5">
              <AlertCircle size={12} />
              异常备注数
            </div>
            <div className="text-2xl font-bold text-rose-300 tabular-nums">
              {stats.abnormalCount}
            </div>
            <div className="text-[10px] text-rose-500/80 mt-1">
              含异常备注或暂缓状态
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center bg-zinc-900/80 border border-zinc-800/60 rounded-lg p-0.5 flex-wrap">
          {quickFilters.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                setHandoverQuickFilter(key)
                if (key !== 'byPerson') {
                  setHandoverPersonFilter('')
                  setShowPersonDropdown(false)
                }
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                handoverQuickFilter === key
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}

          {handoverQuickFilter === 'byPerson' && (
            <div className="relative ml-1">
              <button
                onClick={() => setShowPersonDropdown(!showPersonDropdown)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 transition-colors"
              >
                <Users size={12} />
                {handoverPersonFilter || '选择责任人'}
                <ChevronDown size={12} />
              </button>
              {showPersonDropdown && (
                <div className="absolute z-20 mt-1 left-0 bg-zinc-800 border border-zinc-700/60 rounded-lg shadow-xl py-1 min-w-[140px] max-h-60 overflow-y-auto">
                  <button
                    onClick={() => {
                      setHandoverPersonFilter('')
                      setShowPersonDropdown(false)
                    }}
                    className={cn(
                      'block w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-700/60 transition-colors',
                      !handoverPersonFilter
                        ? 'text-indigo-400 font-medium'
                        : 'text-zinc-300'
                    )}
                  >
                    全部责任人
                  </button>
                  {persons.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setHandoverPersonFilter(p)
                        setShowPersonDropdown(false)
                      }}
                      className={cn(
                        'block w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-700/60 transition-colors',
                        handoverPersonFilter === p
                          ? 'text-indigo-400 font-medium'
                          : 'text-zinc-300'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-xs text-zinc-500">
          当前筛选：{displayRecords.length} / {filtered.length} 条
          {records.length !== filtered.length && (
            <span className="text-zinc-600"> (全部 {records.length})</span>
          )}
        </div>
      </div>

      {batchMap.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700/60 bg-zinc-900/20 py-20 text-center">
          <ClipboardList size={36} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500">
            {handoverQuickFilter !== 'all'
              ? '当前筛选条件下没有符合条件的记录'
              : '暂无手环条目数据，先添加条目后再进行交接'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {batchMap.map(([batchName, items]) => {
            const sortedItems = [...items].sort((a, b) => a.priority - b.priority)
            const batchTotalQty = sortedItems.reduce((s, r) => s + r.quantity, 0)
            const batchPendingQty = sortedItems.reduce((s, r) => {
              const hs = getHandoverStatus(r.id)
              return s + (hs === '待确认' ? r.quantity : 0)
            }, 0)
            const batchPersons = new Set(sortedItems.map((r) => r.responsiblePerson))

            return (
              <div
                key={batchName}
                className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden"
              >
                <div className="px-5 py-3.5 bg-zinc-900/80 border-b border-zinc-800/40">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <Package size={16} className="text-indigo-400" />
                      <h3 className="text-sm font-semibold text-zinc-100">{batchName}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-400">
                        {sortedItems.length} 条
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Package size={11} />
                        总数{' '}
                        <span className="text-zinc-200 font-medium tabular-nums">
                          {batchTotalQty}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sky-400">
                        <Clock size={11} />
                        待确认{' '}
                        <span className="font-medium tabular-nums">{batchPendingQty}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Users size={11} />
                        {batchPersons.size} 位责任人
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-zinc-800/30">
                  {sortedItems.map((r) => {
                    const hs = getHandoverStatus(r.id)
                    const isAbnormal = abnormalRecordIds.has(r.id)

                    return (
                      <div
                        key={r.id}
                        className={cn(
                          'px-5 py-3 transition-colors hover:bg-zinc-800/20',
                          isAbnormal && hs === '待确认' && 'bg-rose-500/5'
                        )}
                      >
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-zinc-800 text-zinc-300 font-mono text-xs shrink-0">
                            {r.priority}
                          </span>

                          <div className="flex items-center gap-2 min-w-[100px]">
                            <span
                              className="w-4 h-4 rounded-full border border-zinc-600/50 shrink-0"
                              style={{ backgroundColor: getColorValue(r.color) }}
                            />
                            <span className="text-sm text-zinc-200 font-medium">
                              {r.color}
                            </span>
                          </div>

                          <div className="text-sm text-zinc-300 min-w-[80px] tabular-nums">
                            {r.quantity}{' '}
                            <span className="text-zinc-500 text-xs">个</span>
                          </div>

                          <div className="text-sm text-zinc-400 min-w-[90px]">
                            {r.targetGroup}
                          </div>

                          <div className="flex items-center gap-1.5 text-sm text-zinc-400 min-w-[90px]">
                            <User size={12} className="text-zinc-500" />
                            {r.responsiblePerson}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-[10px] font-medium border',
                                STATUS_COLOR_MAP[r.status]
                              )}
                            >
                              {r.status}
                            </span>
                          </div>

                          {r.notes ? (
                            <div
                              className={cn(
                                'text-xs px-2 py-0.5 rounded-md max-w-[180px] truncate',
                                isAbnormal
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-zinc-800/60 text-zinc-400'
                              )}
                              title={r.notes}
                            >
                              {isAbnormal && <AlertCircle size={10} className="inline mr-1 -mt-0.5" />}
                              {r.notes}
                            </div>
                          ) : (
                            <div className="text-xs text-zinc-600 max-w-[180px]">
                              —
                            </div>
                          )}

                          <div className="ml-auto relative">
                            <button
                              onClick={() =>
                                setStatusMenuId(statusMenuId === r.id ? null : r.id)
                              }
                              className={cn(
                                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer transition-colors hover:brightness-110',
                                HANDOVER_STATUS_COLOR[hs]
                              )}
                            >
                              {hs === '待确认' && <Clock size={11} />}
                              {hs === '已确认' && <CheckCircle2 size={11} />}
                              {hs === '暂缓' && <PauseCircle size={11} />}
                              {hs === '退回复核' && <RotateCcw size={11} />}
                              {hs}
                            </button>
                            {statusMenuId === r.id && (
                              <div className="absolute z-20 mt-1 right-0 bg-zinc-800 border border-zinc-700/60 rounded-lg shadow-xl py-1 min-w-[120px]">
                                {HANDOVER_STATUS_LIST.map((s) => {
                                  const Icon =
                                    s === '待确认'
                                      ? Clock
                                      : s === '已确认'
                                      ? CheckCircle2
                                      : s === '暂缓'
                                      ? PauseCircle
                                      : RotateCcw
                                  return (
                                    <button
                                      key={s}
                                      onClick={() => {
                                        setHandoverStatus(r.id, s as HandoverStatus)
                                        setStatusMenuId(null)
                                      }}
                                      className={cn(
                                        'flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-700/60 transition-colors',
                                        hs === s
                                          ? 'text-indigo-400 font-medium'
                                          : 'text-zinc-300'
                                      )}
                                    >
                                      <Icon size={12} />
                                      {s}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
