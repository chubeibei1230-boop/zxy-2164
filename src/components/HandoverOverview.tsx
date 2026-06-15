import { useMemo, useState } from 'react'
import { useWristbandStore } from '@/store/useWristbandStore'
import { HANDOVER_STATUS_COLOR, HandoverStatus } from '@/types'
import { cn, getColorValue } from '@/lib/utils'
import {
  BarChart3,
  Package,
  Users,
  Palette,
  CheckCircle2,
  Clock,
  PauseCircle,
  RotateCcw,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CircleDot,
  Locate,
} from 'lucide-react'

type Dimension = 'batch' | 'person' | 'color'

type GroupStatus = 'completed' | 'in_progress' | 'at_risk' | 'not_started'

interface GroupSummary {
  key: string
  label: string
  colorDot?: string
  totalQty: number
  confirmedQty: number
  pendingQty: number
  suspendedQty: number
  returnReviewQty: number
  recordCount: number
  recordIds: string[]
  hasRisk: boolean
  risks: string[]
  groupStatus: GroupStatus
  confirmedPct: number
  abnormalPct: number
}

function computeSummaries(
  records: ReturnType<typeof useWristbandStore.getState>['records'],
  getHandoverStatus: (id: string) => HandoverStatus,
  dimension: Dimension
): GroupSummary[] {
  const groupMap = new Map<string, { records: typeof records; ids: string[] }>()

  for (const r of records) {
    const groupKey =
      dimension === 'batch'
        ? r.batchName
        : dimension === 'person'
          ? r.responsiblePerson
          : r.color

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, { records: [], ids: [] })
    }
    const group = groupMap.get(groupKey)!
    group.records.push(r)
    group.ids.push(r.id)
  }

  const summaries: GroupSummary[] = []

  for (const [key, { records: recs, ids }] of groupMap) {
    let totalQty = 0
    let confirmedQty = 0
    let pendingQty = 0
    let suspendedQty = 0
    let returnReviewQty = 0
    const risks: string[] = []

    for (const r of recs) {
      const hs = getHandoverStatus(r.id)
      totalQty += r.quantity
      if (hs === '已确认') confirmedQty += r.quantity
      if (hs === '待确认' && r.status !== '暂缓') pendingQty += r.quantity
      if (hs === '暂缓' || (hs === '待确认' && r.status === '暂缓')) suspendedQty += r.quantity
      if (hs === '退回复核') returnReviewQty += r.quantity
    }

    const accountedSum = confirmedQty + pendingQty + suspendedQty + returnReviewQty
    if (totalQty > 0 && accountedSum !== totalQty) {
      risks.push(`数量异常：各状态之和${accountedSum}≠总数${totalQty}`)
    }

    if (returnReviewQty > 0) {
      risks.push(`${returnReviewQty}个退回复核`)
    }
    const hasWristbandSuspended = recs.some((r) => getHandoverStatus(r.id) === '待确认' && r.status === '暂缓')
    if (suspendedQty > 0) {
      risks.push(`${suspendedQty}个暂缓`)
    }
    if (hasWristbandSuspended) {
      risks.push('存在手环暂缓未决策')
    }
    if (totalQty === 0) {
      risks.push('总数量为0')
    } else if (confirmedQty === 0 && pendingQty > 0) {
      risks.push('尚无已确认')
    }

    const abnormalQty = suspendedQty + returnReviewQty
    const abnormalPct = totalQty > 0 ? (abnormalQty / totalQty) * 100 : 0
    if (totalQty > 0 && abnormalPct > 30) {
      risks.push(`异常占比${abnormalPct.toFixed(0)}%过高`)
    }

    const hasRisk = returnReviewQty > 0 || suspendedQty > 0 || pendingQty > 0 || totalQty === 0 || accountedSum !== totalQty
    const confirmedPct = totalQty > 0 ? Math.round((confirmedQty / totalQty) * 100) : 0

    let groupStatus: GroupStatus
    if (returnReviewQty > 0 || totalQty === 0 || (totalQty > 0 && accountedSum !== totalQty)) {
      groupStatus = 'at_risk'
    } else if (suspendedQty > 0) {
      groupStatus = 'at_risk'
    } else if (confirmedPct === 100 && totalQty > 0) {
      groupStatus = 'completed'
    } else if (confirmedPct === 0) {
      groupStatus = 'not_started'
    } else {
      groupStatus = 'in_progress'
    }

    summaries.push({
      key,
      label: key,
      colorDot: dimension === 'color' ? getColorValue(key) : undefined,
      totalQty,
      confirmedQty,
      pendingQty,
      suspendedQty,
      returnReviewQty,
      recordCount: recs.length,
      recordIds: ids,
      hasRisk,
      risks,
      groupStatus,
      confirmedPct,
      abnormalPct,
    })
  }

  return summaries.sort((a, b) => {
    const statusOrder: Record<GroupStatus, number> = {
      at_risk: 0,
      not_started: 1,
      in_progress: 2,
      completed: 3,
    }
    const sa = statusOrder[a.groupStatus]
    const sb = statusOrder[b.groupStatus]
    if (sa !== sb) return sa - sb
    return b.totalQty - a.totalQty
  })
}

function StackedProgressBar({
  confirmed,
  pending,
  suspended,
  returnReview,
  total,
}: {
  confirmed: number
  pending: number
  suspended: number
  returnReview: number
  total: number
}) {
  if (total === 0) {
    return (
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 h-2.5 rounded-full bg-zinc-800/80 overflow-hidden">
          <div className="h-full w-full bg-zinc-700/50 rounded-full" />
        </div>
        <span className="text-xs text-zinc-500 tabular-nums min-w-[36px] text-right">—</span>
      </div>
    )
  }

  const cPct = (confirmed / total) * 100
  const pPct = (pending / total) * 100
  const sPct = (suspended / total) * 100
  const rPct = (returnReview / total) * 100
  const overallPct = Math.round((confirmed / total) * 100)

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2.5 rounded-full bg-zinc-800/80 overflow-hidden flex">
        {cPct > 0 && (
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${cPct}%` }}
          />
        )}
        {pPct > 0 && (
          <div
            className="h-full bg-sky-500 transition-all duration-500"
            style={{ width: `${pPct}%` }}
          />
        )}
        {sPct > 0 && (
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${sPct}%` }}
          />
        )}
        {rPct > 0 && (
          <div
            className="h-full bg-rose-500 transition-all duration-500"
            style={{ width: `${rPct}%` }}
          />
        )}
      </div>
      <span
        className={cn(
          'text-xs font-medium tabular-nums min-w-[36px] text-right',
          overallPct === 100
            ? 'text-emerald-400'
            : overallPct >= 50
              ? 'text-indigo-400'
              : 'text-zinc-400'
        )}
      >
        {overallPct}%
      </span>
    </div>
  )
}

function GroupStatusTag({ status }: { status: GroupStatus }) {
  const config: Record<GroupStatus, { label: string; icon: typeof ShieldCheck; className: string }> = {
    completed: {
      label: '已完成',
      icon: ShieldCheck,
      className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    in_progress: {
      label: '进行中',
      icon: CircleDot,
      className: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    },
    at_risk: {
      label: '有风险',
      icon: ShieldAlert,
      className: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    },
    not_started: {
      label: '未开始',
      icon: ShieldX,
      className: 'bg-zinc-700/30 text-zinc-400 border-zinc-600/40',
    },
  }
  const { label, icon: Icon, className } = config[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border',
        className,
        status === 'at_risk' && 'animate-[risk-pulse_2s_ease-in-out_infinite]'
      )}
    >
      <Icon size={10} />
      {label}
    </span>
  )
}

function RiskBadge({ risks }: { risks: string[] }) {
  if (risks.length === 0) return null
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {risks.map((r) => (
        <span
          key={r}
          className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border',
            r.includes('退回复核')
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : r.includes('数量异常') || r.includes('总数量')
                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
          )}
        >
          <AlertCircle size={9} />
          {r}
        </span>
      ))}
    </div>
  )
}

function ReadinessBanner({
  totalQty,
  confirmedQty,
  pendingQty,
  suspendedQty,
  returnReviewQty,
  zeroQtyGroups,
}: {
  totalQty: number
  confirmedQty: number
  pendingQty: number
  suspendedQty: number
  returnReviewQty: number
  zeroQtyGroups: number
}) {
  const pct = totalQty > 0 ? Math.round((confirmedQty / totalQty) * 100) : 0
  const unresolvedRisk = returnReviewQty > 0
  const unresolvedSuspended = suspendedQty > 0
  const quantityRisk = zeroQtyGroups > 0
  const hasPending = pendingQty > 0

  let level: 'ready' | 'almost' | 'not_ready'
  let icon: typeof ShieldCheck
  let message: string
  let bannerClass: string

  if (pct === 100 && !unresolvedRisk && !unresolvedSuspended && !quantityRisk) {
    level = 'ready'
    icon = ShieldCheck
    message = '所有手环已确认发放，可以开始活动！'
    bannerClass = 'bg-emerald-500/10 border-emerald-500/30'
  } else if (!unresolvedRisk && !unresolvedSuspended && !quantityRisk && pct >= 80) {
    level = 'almost'
    icon = ShieldAlert
    message = `发放进度良好（${pct}%），仍有 ${pendingQty} 个待确认，建议尽快完成确认。`
    bannerClass = 'bg-sky-500/10 border-sky-500/30'
  } else if (unresolvedRisk || unresolvedSuspended || quantityRisk) {
    level = 'not_ready'
    icon = ShieldX
    const parts: string[] = []
    if (unresolvedRisk) parts.push(`${returnReviewQty}个退回复核待处理`)
    if (unresolvedSuspended) parts.push(`${suspendedQty}个暂缓待决策`)
    if (quantityRisk) parts.push(`${zeroQtyGroups}组数量异常`)
    if (hasPending) parts.push(`${pendingQty}个待确认`)
    message = `存在未闭环问题：${parts.join('、')}。请在活动前完成处理！`
    bannerClass = 'bg-rose-500/10 border-rose-500/30'
  } else {
    level = 'almost'
    icon = ShieldAlert
    message = `当前确认率 ${pct}%，仍有 ${pendingQty} 个待确认，建议加快发放确认。`
    bannerClass = 'bg-sky-500/10 border-sky-500/30'
  }

  const Icon = icon

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 px-4 py-3 rounded-lg border',
        bannerClass,
        level === 'not_ready' && 'animate-[risk-glow_2s_ease-in-out_infinite]'
      )}
    >
      <Icon
        size={16}
        className={cn(
          'shrink-0 mt-0.5',
          level === 'ready' && 'text-emerald-400',
          level === 'almost' && 'text-sky-400',
          level === 'not_ready' && 'text-rose-400'
        )}
      />
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'text-xs font-semibold mb-0.5',
            level === 'ready' && 'text-emerald-300',
            level === 'almost' && 'text-sky-300',
            level === 'not_ready' && 'text-rose-300'
          )}
        >
          {level === 'ready' ? '✅ 发放就绪' : level === 'almost' ? '⏳ 接近就绪' : '🚫 尚未就绪'}
        </div>
        <div
          className={cn(
            'text-xs leading-relaxed',
            level === 'ready' && 'text-emerald-400/80',
            level === 'almost' && 'text-sky-400/80',
            level === 'not_ready' && 'text-rose-400/80'
          )}
        >
          {message}
        </div>
      </div>
      <div
        className={cn(
          'text-2xl font-bold tabular-nums shrink-0',
          level === 'ready' && 'text-emerald-400',
          level === 'almost' && 'text-sky-400',
          level === 'not_ready' && 'text-rose-400'
        )}
      >
        {pct}%
      </div>
    </div>
  )
}

export default function HandoverOverview({
  onNavigateToRecord,
  records,
}: {
  onNavigateToRecord: (recordId: string) => void
  records: ReturnType<typeof useWristbandStore.getState>['records']
}) {
  const { getHandoverStatus } = useWristbandStore()

  const [dimension, setDimension] = useState<Dimension>('batch')
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  const summaries = useMemo(
    () => computeSummaries(records, getHandoverStatus, dimension),
    [records, getHandoverStatus, dimension]
  )

  const overallStats = useMemo(() => {
    let totalQty = 0
    let confirmedQty = 0
    let pendingQty = 0
    let suspendedQty = 0
    let returnReviewQty = 0
    let zeroQtyGroups = 0
    for (const s of summaries) {
      totalQty += s.totalQty
      confirmedQty += s.confirmedQty
      pendingQty += s.pendingQty
      suspendedQty += s.suspendedQty
      returnReviewQty += s.returnReviewQty
      if (s.totalQty === 0) zeroQtyGroups += 1
    }
    const globalPct = totalQty > 0 ? Math.round((confirmedQty / totalQty) * 100) : 0
    return { totalQty, confirmedQty, pendingQty, suspendedQty, returnReviewQty, zeroQtyGroups, globalPct }
  }, [summaries])

  const hasGlobalRisk = overallStats.returnReviewQty > 0 || overallStats.suspendedQty > 0 || overallStats.zeroQtyGroups > 0

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const dimensionOptions: Array<{ key: Dimension; label: string; icon: typeof BarChart3 }> = [
    { key: 'batch', label: '按批次', icon: Package },
    { key: 'person', label: '按责任人', icon: Users },
    { key: 'color', label: '按颜色', icon: Palette },
  ]

  const getRecordsForGroup = (groupKey: string) => {
    return records.filter((r) => {
      if (dimension === 'batch') return r.batchName === groupKey
      if (dimension === 'person') return r.responsiblePerson === groupKey
      return r.color === groupKey
    })
  }

  const handleLocateAll = (recordIds: string[], e: React.MouseEvent) => {
    e.stopPropagation()
    if (recordIds.length > 0) {
      onNavigateToRecord(recordIds[0])
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
      <div className="px-5 py-4 bg-zinc-900/80 border-b border-zinc-800/40">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <BarChart3 size={18} className="text-indigo-400" />
            <h2 className="text-base font-semibold text-zinc-100">发放进度总览</h2>
            <span className="text-[10px] text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-800/60">
              跟随筛选条件实时更新
            </span>
          </div>

          <div className="flex items-center bg-zinc-800/80 border border-zinc-700/50 rounded-lg p-0.5">
            {dimensionOptions.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  setDimension(key)
                  setExpandedKeys(new Set())
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  dimension === key
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-zinc-800/30">
        <ReadinessBanner
          totalQty={overallStats.totalQty}
          confirmedQty={overallStats.confirmedQty}
          pendingQty={overallStats.pendingQty}
          suspendedQty={overallStats.suspendedQty}
          returnReviewQty={overallStats.returnReviewQty}
          zeroQtyGroups={overallStats.zeroQtyGroups}
        />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/40 p-3">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1.5">
              <Package size={12} />
              总数量
            </div>
            <div className="text-2xl font-bold text-zinc-100 tabular-nums">
              {overallStats.totalQty}
            </div>
          </div>
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3">
            <div className="flex items-center gap-2 text-xs text-emerald-400 mb-1.5">
              <CheckCircle2 size={12} />
              已确认
            </div>
            <div className="text-2xl font-bold text-emerald-300 tabular-nums">
              {overallStats.confirmedQty}
            </div>
            <div className="text-[10px] text-emerald-500/80 mt-1">
              {overallStats.globalPct}% 完成
            </div>
          </div>
          <div className="rounded-lg bg-sky-500/10 border border-sky-500/30 p-3">
            <div className="flex items-center gap-2 text-xs text-sky-400 mb-1.5">
              <Clock size={12} />
              待确认
            </div>
            <div className="text-2xl font-bold text-sky-300 tabular-nums">
              {overallStats.pendingQty}
            </div>
          </div>
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
            <div className="flex items-center gap-2 text-xs text-amber-400 mb-1.5">
              <PauseCircle size={12} />
              暂缓
            </div>
            <div className="text-2xl font-bold text-amber-300 tabular-nums">
              {overallStats.suspendedQty}
            </div>
          </div>
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3">
            <div className="flex items-center gap-2 text-xs text-rose-400 mb-1.5">
              <RotateCcw size={12} />
              退回复核
            </div>
            <div className="text-2xl font-bold text-rose-300 tabular-nums">
              {overallStats.returnReviewQty}
            </div>
          </div>
        </div>

        {hasGlobalRisk && (
          <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 animate-[risk-glow_2s_ease-in-out_infinite]">
            <XCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-300 leading-relaxed">
              <span className="font-semibold">风险提示：</span>
              当前筛选范围内
              {overallStats.returnReviewQty > 0 && (
                <span> 有 <strong>{overallStats.returnReviewQty}</strong> 个退回复核待处理</span>
              )}
              {overallStats.returnReviewQty > 0 && overallStats.suspendedQty > 0 && <span>，</span>}
              {overallStats.suspendedQty > 0 && (
                <span>有 <strong>{overallStats.suspendedQty}</strong> 个暂缓待决策</span>
              )}
              {overallStats.zeroQtyGroups > 0 && (
                <span>
                  {overallStats.returnReviewQty > 0 || overallStats.suspendedQty > 0 ? '，' : ' '}
                  <strong>{overallStats.zeroQtyGroups}</strong> 组数量异常
                </span>
              )}
              ，请尽快处理以确保活动前发放闭环。
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
            <span>总体发放进度</span>
            <span className="tabular-nums font-medium text-zinc-300">
              {overallStats.confirmedQty} / {overallStats.totalQty}
            </span>
          </div>
          <div className="h-3 rounded-full bg-zinc-800/80 overflow-hidden flex">
            {overallStats.totalQty > 0 && (
              <>
                <div
                  className="h-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${(overallStats.confirmedQty / overallStats.totalQty) * 100}%` }}
                />
                <div
                  className="h-full bg-sky-500 transition-all duration-700"
                  style={{ width: `${(overallStats.pendingQty / overallStats.totalQty) * 100}%` }}
                />
                <div
                  className="h-full bg-amber-500 transition-all duration-700"
                  style={{ width: `${(overallStats.suspendedQty / overallStats.totalQty) * 100}%` }}
                />
                <div
                  className="h-full bg-rose-500 transition-all duration-700"
                  style={{ width: `${(overallStats.returnReviewQty / overallStats.totalQty) * 100}%` }}
                />
              </>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              已确认
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              待确认
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              暂缓
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              退回复核
            </span>
          </div>
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="py-16 text-center">
          <BarChart3 size={32} className="mx-auto text-zinc-700 mb-2" />
          <p className="text-sm text-zinc-500">当前筛选条件下暂无数据</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/30">
          {summaries.map((s) => {
            const isExpanded = expandedKeys.has(s.key)
            const groupRecords = isExpanded ? getRecordsForGroup(s.key) : []
            const hasReturnReview = s.returnReviewQty > 0

            return (
              <div
                key={s.key}
                className={cn(
                  s.groupStatus === 'at_risk' && 'bg-rose-500/[0.03]',
                  hasReturnReview && 'animate-[risk-glow_3s_ease-in-out_infinite]'
                )}
              >
                <div
                  className="px-5 py-3.5 cursor-pointer hover:bg-zinc-800/20 transition-colors"
                  onClick={() => toggleExpand(s.key)}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      {isExpanded ? (
                        <ChevronDown size={14} className="text-zinc-500" />
                      ) : (
                        <ChevronRight size={14} className="text-zinc-500" />
                      )}
                      {s.colorDot && (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-zinc-600/50 shrink-0"
                          style={{ backgroundColor: s.colorDot }}
                        />
                      )}
                      <span className="text-sm font-medium text-zinc-200">{s.label}</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-400">
                        {s.recordCount}条
                      </span>
                    </div>

                    <GroupStatusTag status={s.groupStatus} />

                    <div className="flex-1 min-w-[160px] max-w-[280px]">
                      <StackedProgressBar
                        confirmed={s.confirmedQty}
                        pending={s.pendingQty}
                        suspended={s.suspendedQty}
                        returnReview={s.returnReviewQty}
                        total={s.totalQty}
                      />
                    </div>

                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      <div className="flex items-center gap-1 text-zinc-400">
                        <Package size={10} />
                        总<span className="text-zinc-200 font-medium tabular-nums">{s.totalQty}</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 size={10} />
                        <span className="tabular-nums">{s.confirmedQty}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sky-400">
                        <Clock size={10} />
                        <span className="tabular-nums">{s.pendingQty}</span>
                      </div>
                      {s.suspendedQty > 0 && (
                        <div className="flex items-center gap-1 text-amber-400">
                          <PauseCircle size={10} />
                          <span className="tabular-nums">{s.suspendedQty}</span>
                        </div>
                      )}
                      {s.returnReviewQty > 0 && (
                        <div className="flex items-center gap-1 text-rose-400">
                          <RotateCcw size={10} />
                          <span className="tabular-nums">{s.returnReviewQty}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => handleLocateAll(s.recordIds, e)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                      title="定位到该组全部明细记录"
                    >
                      <Locate size={10} />
                      定位首条
                    </button>

                    {s.risks.length > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle
                          size={12}
                          className={cn(
                            'text-rose-400',
                            hasReturnReview && 'animate-[risk-pulse_1.5s_ease-in-out_infinite]'
                          )}
                        />
                      </div>
                    )}
                  </div>

                  {s.risks.length > 0 && (
                    <div className="mt-2 ml-8">
                      <RiskBadge risks={s.risks} />
                    </div>
                  )}
                </div>

                {isExpanded && groupRecords.length > 0 && (
                  <div className="px-5 pb-3 ml-6">
                    <div className="rounded-lg border border-zinc-800/50 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-zinc-900/80 text-zinc-500">
                            <th className="text-left px-3 py-2 font-medium">颜色</th>
                            <th className="text-left px-3 py-2 font-medium">批次</th>
                            <th className="text-left px-3 py-2 font-medium">数量</th>
                            <th className="text-left px-3 py-2 font-medium">责任人</th>
                            <th className="text-left px-3 py-2 font-medium">交接状态</th>
                            <th className="text-right px-3 py-2 font-medium">定位</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                          {groupRecords.map((r) => {
                            const hs = getHandoverStatus(r.id)
                            return (
                              <tr
                                key={r.id}
                                className="hover:bg-zinc-800/30 transition-colors"
                              >
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full border border-zinc-600/50"
                                      style={{ backgroundColor: getColorValue(r.color) }}
                                    />
                                    <span className="text-zinc-300">{r.color}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-zinc-300">{r.batchName}</td>
                                <td className="px-3 py-2 text-zinc-300 tabular-nums">{r.quantity}</td>
                                <td className="px-3 py-2 text-zinc-400">{r.responsiblePerson}</td>
                                <td className="px-3 py-2">
                                  <span
                                    className={cn(
                                      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border',
                                      HANDOVER_STATUS_COLOR[hs]
                                    )}
                                  >
                                    {hs === '退回复核' && <RotateCcw size={9} />}
                                    {hs === '暂缓' && <PauseCircle size={9} />}
                                    {hs === '已确认' && <CheckCircle2 size={9} />}
                                    {hs === '待确认' && <Clock size={9} />}
                                    {hs}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onNavigateToRecord(r.id)
                                    }}
                                    className="px-2 py-0.5 rounded text-[10px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                                  >
                                    定位
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
