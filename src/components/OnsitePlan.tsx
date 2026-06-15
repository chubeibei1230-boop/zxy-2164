import { useMemo, useState } from 'react'
import { useWristbandStore } from '@/store/useWristbandStore'
import {
  PlanGroupItem,
  PlanItemStats,
  PlanStatus,
  PLAN_STATUS_LIST,
  PLAN_STATUS_COLOR,
  PLAN_GROUP_BY_OPTIONS,
  STATUS_COLOR_MAP,
  HANDOVER_STATUS_COLOR,
} from '@/types'
import { cn, getColorValue } from '@/lib/utils'
import { getFilterOptions, getGroupLabel } from '@/utils/planGenerator'
import {
  ClipboardList,
  RefreshCw,
  Filter,
  X,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  Users,
  Edit3,
  Check,
  ChevronDown,
  FileText,
  AlertCircle,
  PauseCircle,
  RotateCcw,
  Zap,
  BarChart3,
} from 'lucide-react'

function StatsCard({
  icon: Icon,
  label,
  value,
  className,
  subValue,
}: {
  icon: any
  label: string
  value: number
  className: string
  subValue?: string
}) {
  return (
    <div className={cn('rounded-lg border p-3', className)}>
      <div className="flex items-center gap-2 text-xs mb-1.5">
        <Icon size={12} />
        {label}
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {subValue && <div className="text-[10px] mt-0.5 opacity-70">{subValue}</div>}
    </div>
  )
}

function PlanSummary({ summary }: { summary: PlanItemStats }) {
  const readyRate =
    summary.totalQty > 0 ? Math.round((summary.availableQty / summary.totalQty) * 100) : 0

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
      <div className="flex items-center gap-2.5 mb-4">
        <BarChart3 size={18} className="text-indigo-400" />
        <h2 className="text-base font-semibold text-zinc-100">预案概览</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <StatsCard
          icon={Package}
          label="总计数量"
          value={summary.totalQty}
          className="bg-zinc-800/50 border-zinc-700/40 text-zinc-300"
        />
        <StatsCard
          icon={CheckCircle2}
          label="可发放"
          value={summary.availableQty}
          className="bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          subValue={`${readyRate}% 就绪`}
        />
        <StatsCard
          icon={Clock}
          label="待发放"
          value={summary.pendingQty}
          className="bg-sky-500/10 border-sky-500/30 text-sky-300"
        />
        <StatsCard
          icon={PauseCircle}
          label="暂缓"
          value={summary.deferredQty}
          className="bg-amber-500/10 border-amber-500/30 text-amber-300"
        />
        <StatsCard
          icon={RotateCcw}
          label="退回复核"
          value={summary.reviewQty}
          className="bg-rose-500/10 border-rose-500/30 text-rose-300"
        />
      </div>

      {summary.abnormalQty > 0 && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
          <div className="flex items-center gap-2 text-xs text-red-400 mb-1">
            <AlertTriangle size={12} />
            <span className="font-medium">存在异常</span>
          </div>
          <p className="text-sm text-red-300">
            共 <span className="font-bold tabular-nums">{summary.abnormalQty}</span> 个手环关联未处理差异，请优先处理后再发放
          </p>
        </div>
      )}

      {summary.totalQty > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
            <span>发放就绪进度</span>
            <span className="tabular-nums font-medium text-zinc-300">
              {summary.availableQty} / {summary.totalQty}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-zinc-800/80 overflow-hidden flex">
            {readyRate > 0 && (
              <div
                className="h-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${readyRate}%` }}
              />
            )}
            {summary.pendingQty > 0 && (
              <div
                className="h-full bg-sky-500 transition-all duration-700"
                style={{
                  width: `${Math.round((summary.pendingQty / summary.totalQty) * 100)}%`,
                }}
              />
            )}
            {summary.deferredQty > 0 && (
              <div
                className="h-full bg-amber-500 transition-all duration-700"
                style={{
                  width: `${Math.round((summary.deferredQty / summary.totalQty) * 100)}%`,
                }}
              />
            )}
            {summary.reviewQty > 0 && (
              <div
                className="h-full bg-rose-500 transition-all duration-700"
                style={{
                  width: `${Math.round((summary.reviewQty / summary.totalQty) * 100)}%`,
                }}
              />
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              可发放
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              待发放
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
      )}
    </div>
  )
}

function PlanItemCard({
  item,
  records,
  handoverStatuses,
  isFirst,
  isLast,
  isEditingNotes,
  setIsEditingNotes,
}: {
  item: PlanGroupItem
  records: ReturnType<typeof useWristbandStore.getState>['records']
  handoverStatuses: Map<string, string>
  isFirst: boolean
  isLast: boolean
  isEditingNotes: boolean
  setIsEditingNotes: (v: boolean) => void
}) {
  const {
    movePlanItem,
    setPlanItemNotes,
    getHandoverStatus,
  } = useWristbandStore()

  const [localNotes, setLocalNotes] = useState(item.siteNotes)
  const [expanded, setExpanded] = useState(false)

  const itemRecords = records.filter((r) => item.recordIds.includes(r.id))

  const readyRate =
    item.stats.totalQty > 0
      ? Math.round((item.stats.availableQty / item.stats.totalQty) * 100)
      : 0

  const hasAbnormal = item.stats.abnormalQty > 0
  const hasWarnings = item.warnings.length > 0

  const groupLabel = getGroupLabel(item.groupKey)

  const handleSaveNotes = () => {
    setPlanItemNotes(item.id, localNotes)
    setIsEditingNotes(false)
  }

  const getGroupIcon = () => {
    switch (item.groupKey) {
      case 'batchName':
        return <Package size={16} className="text-indigo-400" />
      case 'color':
        return (
          <span
            className="w-4 h-4 rounded-full border border-zinc-600/50"
            style={{ backgroundColor: getColorValue(item.groupValue) }}
          />
        )
      case 'targetGroup':
        return <Users size={16} className="text-purple-400" />
      case 'responsiblePerson':
        return <Users size={16} className="text-teal-400" />
      case 'status':
        return <Zap size={16} className="text-amber-400" />
      default:
        return <Package size={16} className="text-zinc-400" />
    }
  }

  return (
    <div
      className={cn(
        'rounded-xl border bg-zinc-900/60 overflow-hidden transition-all',
        hasAbnormal
          ? 'border-red-500/40'
          : item.stats.availableQty > 0
          ? 'border-emerald-500/30'
          : 'border-zinc-800/60'
      )}
    >
      <div className="px-4 py-3 bg-zinc-900/80 border-b border-zinc-800/40">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-0.5">
            <button
              onClick={() => movePlanItem(item.id, 'up')}
              disabled={isFirst}
              className={cn(
                'p-0.5 rounded transition-colors',
                isFirst
                  ? 'text-zinc-700 cursor-not-allowed'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <ArrowUp size={12} />
            </button>
            <span className="text-xs font-bold text-zinc-400 tabular-nums w-4 text-center">
              {item.displayOrder}
            </span>
            <button
              onClick={() => movePlanItem(item.id, 'down')}
              disabled={isLast}
              className={cn(
                'p-0.5 rounded transition-colors',
                isLast
                  ? 'text-zinc-700 cursor-not-allowed'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <ArrowDown size={12} />
            </button>
          </div>

          {getGroupIcon()}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-zinc-500">{groupLabel}</span>
              <h3 className="text-sm font-semibold text-zinc-100">{item.groupValue}</h3>
              {hasAbnormal && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-500/15 text-red-400 border border-red-500/30">
                  <AlertCircle size={9} />
                  异常
                </span>
              )}
              {item.stats.availableQty > 0 && !hasAbnormal && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 size={9} />
                  就绪
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-500 flex-wrap">
              <span>共 {item.stats.totalQty} 个</span>
              <span>就绪率 {readyRate}%</span>
              <span>关联 {item.recordIds.length} 条记录</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <div className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 size={10} />
                <span className="tabular-nums font-medium">{item.stats.availableQty}</span>
              </div>
              <div className="text-[10px] text-zinc-500">可发放</div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sky-400">
                <Clock size={10} />
                <span className="tabular-nums font-medium">{item.stats.pendingQty}</span>
              </div>
              <div className="text-[10px] text-zinc-500">待发放</div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-amber-400">
                <PauseCircle size={10} />
                <span className="tabular-nums font-medium">{item.stats.deferredQty}</span>
              </div>
              <div className="text-[10px] text-zinc-500">暂缓</div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-rose-400">
                <RotateCcw size={10} />
                <span className="tabular-nums font-medium">{item.stats.reviewQty}</span>
              </div>
              <div className="text-[10px] text-zinc-500">退回复核</div>
            </div>
            {hasAbnormal && (
              <div className="text-right">
                <div className="flex items-center gap-1 text-red-400">
                  <AlertTriangle size={10} />
                  <span className="tabular-nums font-medium">{item.stats.abnormalQty}</span>
                </div>
                <div className="text-[10px] text-zinc-500">异常</div>
              </div>
            )}
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ChevronDown
              size={16}
              className={cn('transition-transform', expanded && 'rotate-180')}
            />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {hasWarnings && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-2">
                <AlertTriangle size={12} />
                <span className="font-medium">风险提示</span>
              </div>
              <ul className="space-y-1">
                {item.warnings.map((warning, idx) => (
                  <li key={idx} className="text-xs text-amber-300/80 flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-zinc-400 flex items-center gap-1.5">
                <FileText size={12} />
                现场备注
              </label>
              {!isEditingNotes ? (
                <button
                  onClick={() => {
                    setLocalNotes(item.siteNotes)
                    setIsEditingNotes(true)
                  }}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <Edit3 size={10} />
                  编辑
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleSaveNotes}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                  >
                    <Check size={10} />
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setLocalNotes(item.siteNotes)
                      setIsEditingNotes(false)
                    }}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
                  >
                    <X size={10} />
                    取消
                  </button>
                </div>
              )}
            </div>
            {isEditingNotes ? (
              <textarea
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                rows={2}
                placeholder="请输入现场发放备注..."
                className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 resize-none"
              />
            ) : (
              <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/30 px-3 py-2 min-h-[42px]">
                {item.siteNotes ? (
                  <p className="text-sm text-zinc-300">{item.siteNotes}</p>
                ) : (
                  <p className="text-sm text-zinc-600 italic">暂无备注，点击「编辑」添加</p>
                )}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs text-zinc-400 mb-2">关联手环条目</h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
              {itemRecords.map((r) => {
                const hs = getHandoverStatus(r.id)
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-zinc-800/40 text-xs"
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-zinc-600/50 shrink-0"
                      style={{ backgroundColor: getColorValue(r.color) }}
                    />
                    <span className="text-zinc-300 w-14 truncate">{r.color}</span>
                    <span className="text-zinc-400 w-16 truncate">{r.batchName}</span>
                    <span className="text-zinc-400 flex-1 truncate">{r.targetGroup}</span>
                    <span className="text-zinc-300 tabular-nums">{r.quantity}个</span>
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] font-medium border',
                        STATUS_COLOR_MAP[r.status]
                      )}
                    >
                      {r.status}
                    </span>
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] font-medium border',
                        HANDOVER_STATUS_COLOR[hs as keyof typeof HANDOVER_STATUS_COLOR]
                      )}
                    >
                      {hs}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OnsitePlan() {
  const {
    records,
    planItems,
    planSummary,
    planGroupBy,
    planFilter,
    planStatus,
    planName,
    planLastGenerated,
    planConfirmedAt,
    planCompletedAt,
    setPlanGroupBy,
    setPlanFilter,
    resetPlanFilter,
    generatePlan,
    setPlanStatus,
    setPlanName,
    getHandoverStatus,
  } = useWristbandStore()

  const [showFilters, setShowFilters] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [localName, setLocalName] = useState(planName)
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null)

  const filterOptions = useMemo(() => getFilterOptions(records), [records])

  const hasActiveFilters = Object.values(planFilter).some((v) => v !== '')

  const handoverStatuses = useMemo(() => {
    const map = new Map<string, string>()
    records.forEach((r) => {
      map.set(r.id, getHandoverStatus(r.id))
    })
    return map
  }, [records, getHandoverStatus])

  const handleSaveName = () => {
    setPlanName(localName.trim() || '现场发放预案')
    setIsEditingName(false)
  }

  const handleStatusChange = (status: PlanStatus) => {
    if (status === '已完成' && planStatus !== '已完成') {
      if (!confirm('确认将预案标记为「已完成」？此操作将记录完成时间。')) {
        return
      }
    }
    setPlanStatus(status)
  }

  const totalRecords = records.length
  const filteredRecords = planItems.reduce((s, i) => s + i.recordIds.length, 0)

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <ClipboardList size={18} className="text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={localName}
                      onChange={(e) => setLocalName(e.target.value)}
                      className="bg-transparent border border-zinc-700 rounded px-2 py-1 text-base font-semibold text-zinc-100 focus:outline-none focus:border-indigo-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1 text-emerald-400 hover:text-emerald-300"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setLocalName(planName)
                        setIsEditingName(false)
                      }}
                      className="p-1 text-zinc-500 hover:text-zinc-300"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <h2
                    className="text-base font-semibold text-zinc-100 cursor-pointer hover:text-indigo-400 transition-colors flex items-center gap-2"
                    onClick={() => {
                      setLocalName(planName)
                      setIsEditingName(true)
                    }}
                  >
                    {planName}
                    <Edit3 size={12} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h2>
                )}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border',
                    PLAN_STATUS_COLOR[planStatus]
                  )}
                >
                  {planStatus}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-500 flex-wrap">
                {planLastGenerated && (
                  <span>
                    生成时间：{new Date(planLastGenerated).toLocaleString('zh-CN')}
                  </span>
                )}
                {planConfirmedAt && (
                  <span>
                    确认时间：{new Date(planConfirmedAt).toLocaleString('zh-CN')}
                  </span>
                )}
                {planCompletedAt && (
                  <span>
                    完成时间：{new Date(planCompletedAt).toLocaleString('zh-CN')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-zinc-900/80 border border-zinc-800/60 rounded-lg p-0.5">
              {PLAN_STATUS_LIST.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    planStatus === s
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-zinc-400 hover:text-zinc-200'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={generatePlan}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors border border-zinc-700/50"
            >
              <RefreshCw size={12} />
              重新生成
            </button>
          </div>
        </div>
      </div>

      <PlanSummary summary={planSummary} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-zinc-900/80 border border-zinc-800/60 rounded-lg p-0.5">
            {PLAN_GROUP_BY_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPlanGroupBy(key)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  planGroupBy === key
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border',
              showFilters || hasActiveFilters
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50 hover:text-zinc-200'
            )}
          >
            <Filter size={13} />
            筛选
            {hasActiveFilters && (
              <span className="ml-0.5 px-1.5 py-0 rounded-full bg-indigo-500/20 text-[10px]">
                {Object.values(planFilter).filter((v) => v !== '').length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={resetPlanFilter}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X size={10} />
              重置筛选
            </button>
          )}
        </div>

        <div className="text-xs text-zinc-500">
          显示 {filteredRecords} / {totalRecords} 条记录 · {planItems.length} 个分组
        </div>
      </div>

      {showFilters && (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">批次</label>
              <select
                value={planFilter.batchName}
                onChange={(e) => setPlanFilter({ batchName: e.target.value })}
                className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/60"
              >
                <option value="">全部批次</option>
                {filterOptions.batchNames.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">颜色</label>
              <select
                value={planFilter.color}
                onChange={(e) => setPlanFilter({ color: e.target.value })}
                className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/60"
              >
                <option value="">全部颜色</option>
                {filterOptions.colors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">人群</label>
              <select
                value={planFilter.targetGroup}
                onChange={(e) => setPlanFilter({ targetGroup: e.target.value })}
                className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/60"
              >
                <option value="">全部人群</option>
                {filterOptions.targetGroups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">责任人</label>
              <select
                value={planFilter.responsiblePerson}
                onChange={(e) => setPlanFilter({ responsiblePerson: e.target.value })}
                className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/60"
              >
                <option value="">全部责任人</option>
                {filterOptions.responsiblePersons.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">状态</label>
              <select
                value={planFilter.status}
                onChange={(e) => setPlanFilter({ status: e.target.value })}
                className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/60"
              >
                <option value="">全部状态</option>
                {['待分装', '待复核', '可发放', '暂缓'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700/60 bg-zinc-900/20 py-20 text-center">
          <ClipboardList size={36} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500">暂无手环数据</p>
          <p className="text-xs text-zinc-600 mt-1">
            请先新增手环条目，再生成现场发放预案
          </p>
        </div>
      ) : planItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700/60 bg-zinc-900/20 py-20 text-center">
          <Filter size={36} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500">当前筛选条件下无匹配数据</p>
          <button
            onClick={resetPlanFilter}
            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            重置筛选条件
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {planItems.map((item, idx) => (
            <PlanItemCard
              key={item.id}
              item={item}
              records={records}
              handoverStatuses={handoverStatuses}
              isFirst={idx === 0}
              isLast={idx === planItems.length - 1}
              isEditingNotes={editingNotesId === item.id}
              setIsEditingNotes={(v) => setEditingNotesId(v ? item.id : null)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
