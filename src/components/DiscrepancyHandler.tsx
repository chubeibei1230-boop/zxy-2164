import { useMemo, useState, useCallback } from 'react'
import { useWristbandStore } from '@/store/useWristbandStore'
import {
  DiscrepancyRecord,
  DiscrepancyType,
  DiscrepancyStatus,
  DiscrepancyResult,
  DiscrepancyFilter,
  HANDOVER_STATUS_LIST,
  HANDOVER_STATUS_COLOR,
  HandoverStatus,
} from '@/types'
import { cn, getColorValue } from '@/lib/utils'
import {
  AlertTriangle,
  Package,
  Clock,
  CheckCircle2,
  PauseCircle,
  RotateCcw,
  AlertCircle,
  FileWarning,
  Plus,
  X,
  Filter,
  ChevronDown,
  Trash2,
  FileCheck,
  FileX,
  MessageSquare,
} from 'lucide-react'

const DISCREPANCY_TYPE_LIST: DiscrepancyType[] = ['数量差异', '暂缓发放', '退回复核', '备注异常']
const DISCREPANCY_STATUS_LIST: DiscrepancyStatus[] = ['待处理', '处理中', '已处理']
const DISCREPANCY_RESULT_LIST: DiscrepancyResult[] = ['已补发', '已调整', '已取消', '其他']

const TYPE_STYLE: Record<DiscrepancyType, string> = {
  '数量差异': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  '暂缓发放': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  '退回复核': 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  '备注异常': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
}

const TYPE_ICON: Record<DiscrepancyType, typeof AlertTriangle> = {
  '数量差异': Package,
  '暂缓发放': PauseCircle,
  '退回复核': RotateCcw,
  '备注异常': MessageSquare,
}

const STATUS_STYLE: Record<DiscrepancyStatus, string> = {
  '待处理': 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  '处理中': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  '已处理': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

function DiscrepancyOverview({
  discrepancies,
  records,
}: {
  discrepancies: DiscrepancyRecord[]
  records: ReturnType<typeof useWristbandStore.getState>['records']
}) {
  const totalCount = discrepancies.length
  const affectedQty = discrepancies.reduce((s, d) => s + d.affectedQty, 0)
  const pendingCount = discrepancies.filter((d) => d.status === '待处理').length
  const processingCount = discrepancies.filter((d) => d.status === '处理中').length
  const resolvedCount = discrepancies.filter((d) => d.status === '已处理').length

  const pendingPct = totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0
  const processingPct = totalCount > 0 ? Math.round((processingCount / totalCount) * 100) : 0
  const resolvedPct = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
      <div className="flex items-center gap-2.5 mb-4">
        <FileWarning size={18} className="text-orange-400" />
        <h2 className="text-base font-semibold text-zinc-100">差异概览</h2>
        {totalCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-orange-500/15 text-[10px] text-orange-400 border border-orange-500/30 font-medium">
            {totalCount} 条记录
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/40 p-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1.5">
            <AlertTriangle size={12} />
            差异总数
          </div>
          <div className="text-2xl font-bold text-zinc-100 tabular-nums">{totalCount}</div>
          <div className="text-[10px] text-zinc-500 mt-1">
            影响 {affectedQty} 个
          </div>
        </div>
        <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 p-3">
          <div className="flex items-center gap-2 text-xs text-orange-400 mb-1.5">
            <Package size={12} />
            影响数量
          </div>
          <div className="text-2xl font-bold text-orange-300 tabular-nums">{affectedQty}</div>
        </div>
        <div className="rounded-lg bg-sky-500/10 border border-sky-500/30 p-3">
          <div className="flex items-center gap-2 text-xs text-sky-400 mb-1.5">
            <Clock size={12} />
            待处理
          </div>
          <div className="text-2xl font-bold text-sky-300 tabular-nums">{pendingCount}</div>
          <div className="text-[10px] text-sky-500/80 mt-1">
            {pendingPct}% 待处理
          </div>
        </div>
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3">
          <div className="flex items-center gap-2 text-xs text-emerald-400 mb-1.5">
            <CheckCircle2 size={12} />
            已处理
          </div>
          <div className="text-2xl font-bold text-emerald-300 tabular-nums">{resolvedCount}</div>
          <div className="text-[10px] text-emerald-500/80 mt-1">
            {resolvedPct}% 完成
          </div>
        </div>
      </div>

      {totalCount > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
            <span>处理进度</span>
            <span className="tabular-nums font-medium text-zinc-300">
              {resolvedCount} / {totalCount}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-zinc-800/80 overflow-hidden flex">
            {resolvedPct > 0 && (
              <div
                className="h-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${resolvedPct}%` }}
              />
            )}
            {processingPct > 0 && (
              <div
                className="h-full bg-amber-500 transition-all duration-700"
                style={{ width: `${processingPct}%` }}
              />
            )}
            {pendingPct > 0 && (
              <div
                className="h-full bg-sky-500 transition-all duration-700"
                style={{ width: `${pendingPct}%` }}
              />
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              已处理
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              处理中
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              待处理
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function AddDiscrepancyForm({
  records,
  onSubmit,
  onCancel,
}: {
  records: ReturnType<typeof useWristbandStore.getState>['records']
  onSubmit: (data: Omit<DiscrepancyRecord, 'id' | 'createdAt' | 'resolvedAt'>) => void
  onCancel: () => void
}) {
  const [recordId, setRecordId] = useState(records.length > 0 ? records[0].id : '')
  const [type, setType] = useState<DiscrepancyType>('数量差异')
  const [description, setDescription] = useState('')
  const [affectedQty, setAffectedQty] = useState(0)
  const [status, setStatus] = useState<DiscrepancyStatus>('待处理')

  const selectedRecord = records.find((r) => r.id === recordId)
  const canSubmit = Boolean(recordId && description.trim() && affectedQty >= 0)

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      recordId,
      type,
      description: description.trim(),
      affectedQty: Math.floor(affectedQty),
      status,
      result: '',
      resolution: '',
    })
  }

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-100">登记差异记录</h3>
        <button
          onClick={onCancel}
          className="p-1 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">关联手环条目</label>
          <select
            value={recordId}
            onChange={(e) => setRecordId(e.target.value)}
            className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/60"
          >
            {records.map((r) => (
              <option key={r.id} value={r.id}>
                {r.batchName} - {r.color} - {r.quantity}个 - {r.responsiblePerson}
              </option>
            ))}
          </select>
          {selectedRecord && (
            <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-500">
              <span
                className="w-2.5 h-2.5 rounded-full border border-zinc-600/50"
                style={{ backgroundColor: getColorValue(selectedRecord.color) }}
              />
              {selectedRecord.targetGroup} · 优先级 {selectedRecord.priority}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">差异类型</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DiscrepancyType)}
              className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/60"
            >
              {DISCREPANCY_TYPE_LIST.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">影响数量</label>
            <input
              type="number"
              min={0}
              step={1}
              value={affectedQty}
              onChange={(e) => setAffectedQty(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
              className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 tabular-nums focus:outline-none focus:border-indigo-500/60"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">差异描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="请描述差异情况..."
            className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">初始状态</label>
          <div className="flex items-center gap-2">
            {DISCREPANCY_STATUS_LIST.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                  status === s
                    ? STATUS_STYLE[s]
                    : 'bg-zinc-800/50 text-zinc-500 border-zinc-700/30 hover:text-zinc-300'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors border border-zinc-700/50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'px-4 py-2 rounded-lg text-white text-xs font-medium transition-colors',
              canSubmit
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
                : 'bg-zinc-700 cursor-not-allowed opacity-50'
            )}
          >
            确认登记
          </button>
        </div>
      </div>
    </div>
  )
}

function ResolveDiscrepancyForm({
  discrepancy,
  onResolve,
  onCancel,
}: {
  discrepancy: DiscrepancyRecord
  onResolve: (id: string, result: DiscrepancyResult, resolution: string) => void
  onCancel: () => void
}) {
  const [result, setResult] = useState<DiscrepancyResult>('已调整')
  const [resolution, setResolution] = useState('')

  const handleSubmit = () => {
    if (!resolution.trim()) return
    onResolve(discrepancy.id, result, resolution.trim())
  }

  return (
    <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-4 mt-2">
      <div className="flex items-center gap-2 mb-3">
        <FileCheck size={14} className="text-indigo-400" />
        <span className="text-xs font-semibold text-indigo-300">处理差异</span>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">处理结果</label>
          <div className="flex items-center gap-2">
            {DISCREPANCY_RESULT_LIST.map((r) => (
              <button
                key={r}
                onClick={() => setResult(r)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                  result === r
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-zinc-800/50 text-zinc-500 border-zinc-700/30 hover:text-zinc-300'
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">处理说明</label>
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            rows={2}
            placeholder="请补充处理说明..."
            className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 resize-none"
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors border border-zinc-700/50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!resolution.trim()}
            className={cn(
              'px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-colors',
              resolution.trim()
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20'
                : 'bg-zinc-700 cursor-not-allowed opacity-50'
            )}
          >
            确认处理
          </button>
        </div>
      </div>
    </div>
  )
}

function DiscrepancyCard({
  discrepancy,
  record,
  handoverStatus,
  onResolve,
  onDelete,
  onMarkProcessing,
}: {
  discrepancy: DiscrepancyRecord
  record: ReturnType<typeof useWristbandStore.getState>['records'][0] | undefined
  handoverStatus: HandoverStatus
  onResolve: (id: string, result: DiscrepancyResult, resolution: string) => void
  onDelete: (id: string) => void
  onMarkProcessing: (id: string) => void
}) {
  const [showResolveForm, setShowResolveForm] = useState(false)
  const isResolved = discrepancy.status === '已处理'
  const TypeIcon = TYPE_ICON[discrepancy.type]

  return (
    <div
      className={cn(
        'rounded-lg border bg-zinc-900/60 p-4 transition-all',
        isResolved
          ? 'border-zinc-800/40 opacity-70'
          : 'border-zinc-800/60'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
          TYPE_STYLE[discrepancy.type].split(' ').filter(c => c.startsWith('bg-'))[0]
        )}>
          <TypeIcon size={16} className={TYPE_STYLE[discrepancy.type].split(' ').filter(c => c.startsWith('text-'))[0]} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border', TYPE_STYLE[discrepancy.type])}>
              <TypeIcon size={10} />
              {discrepancy.type}
            </span>
            <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border', STATUS_STYLE[discrepancy.status])}>
              {discrepancy.status === '待处理' && <Clock size={9} />}
              {discrepancy.status === '处理中' && <AlertCircle size={9} />}
              {discrepancy.status === '已处理' && <CheckCircle2 size={9} />}
              {discrepancy.status}
            </span>
            {discrepancy.affectedQty > 0 && (
              <span className="text-[10px] text-orange-400 tabular-nums">
                影响 {discrepancy.affectedQty} 个
              </span>
            )}
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed mb-2">
            {discrepancy.description}
          </p>

          {record && (
            <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-zinc-600/50"
                  style={{ backgroundColor: getColorValue(record.color) }}
                />
                {record.color}
              </span>
              <span>{record.batchName}</span>
              <span>{record.responsiblePerson}</span>
              <span>{record.quantity}个</span>
              <span className={cn('px-1.5 py-0.5 rounded-full text-[10px] font-medium border', HANDOVER_STATUS_COLOR[handoverStatus])}>
                {handoverStatus}
              </span>
            </div>
          )}

          {isResolved && discrepancy.resolution && (
            <div className="mt-2 px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 mb-0.5">
                <CheckCircle2 size={10} />
                已处理 - {discrepancy.result}
              </div>
              <p className="text-xs text-emerald-300/80">{discrepancy.resolution}</p>
              {discrepancy.resolvedAt && (
                <p className="text-[10px] text-zinc-500 mt-1">
                  {new Date(discrepancy.resolvedAt).toLocaleString('zh-CN')}
                </p>
              )}
            </div>
          )}

          {!isResolved && (
            <div className="mt-2 flex items-center gap-2">
              {discrepancy.status === '待处理' && (
                <button
                  onClick={() => onMarkProcessing(discrepancy.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                >
                  <AlertCircle size={10} />
                  标记处理中
                </button>
              )}
              <button
                onClick={() => setShowResolveForm(!showResolveForm)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
              >
                <FileCheck size={10} />
                处理完成
              </button>
              <button
                onClick={() => onDelete(discrepancy.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
              >
                <Trash2 size={10} />
                删除
              </button>
            </div>
          )}

          {showResolveForm && !isResolved && (
            <ResolveDiscrepancyForm
              discrepancy={discrepancy}
              onResolve={(id, result, resolution) => {
                onResolve(id, result, resolution)
                setShowResolveForm(false)
              }}
              onCancel={() => setShowResolveForm(false)}
            />
          )}
        </div>

        <div className="text-[10px] text-zinc-600 shrink-0">
          {new Date(discrepancy.createdAt).toLocaleString('zh-CN')}
        </div>
      </div>
    </div>
  )
}

export default function DiscrepancyHandler() {
  const {
    records,
    getHandoverStatus,
    discrepancyRecords,
    discrepancyFilter,
    addDiscrepancy,
    resolveDiscrepancy,
    deleteDiscrepancy,
    updateDiscrepancy,
    setDiscrepancyFilter,
    resetDiscrepancyFilter,
    getFilteredDiscrepancies,
  } = useWristbandStore()

  const [showAddForm, setShowAddForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [groupBy, setGroupBy] = useState<'type' | 'batch' | 'status'>('type')

  const filtered = getFilteredDiscrepancies()

  const batchNames = useMemo(() => [...new Set(records.map((r) => r.batchName))].sort(), [records])
  const colors = useMemo(() => [...new Set(records.map((r) => r.color))].sort(), [records])
  const persons = useMemo(() => [...new Set(records.map((r) => r.responsiblePerson))].sort(), [records])

  const groupedDiscrepancies = useMemo(() => {
    const groups = new Map<string, DiscrepancyRecord[]>()
    for (const d of filtered) {
      const record = records.find((r) => r.id === d.recordId)
      let key: string
      if (groupBy === 'type') {
        key = d.type
      } else if (groupBy === 'batch') {
        key = record?.batchName ?? '未知批次'
      } else {
        key = d.status
      }
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(d)
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [filtered, groupBy, records])

  const handleAdd = useCallback((data: Omit<DiscrepancyRecord, 'id' | 'createdAt' | 'resolvedAt'>) => {
    addDiscrepancy(data)
    setShowAddForm(false)
  }, [addDiscrepancy])

  const handleMarkProcessing = useCallback((id: string) => {
    updateDiscrepancy(id, { status: '处理中' })
  }, [updateDiscrepancy])

  const hasActiveFilters = Object.values(discrepancyFilter).some((v) => v !== '')

  return (
    <div className="space-y-5">
      <DiscrepancyOverview discrepancies={filtered} records={records} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={records.length === 0}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-medium transition-colors shadow-lg shadow-indigo-600/20',
              records.length === 0
                ? 'bg-zinc-700 cursor-not-allowed opacity-60 shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-500'
            )}
            title={records.length === 0 ? '请先新增手环条目' : '登记差异'}
          >
            <Plus size={14} />
            登记差异
          </button>
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
                {Object.values(discrepancyFilter).filter((v) => v !== '').length}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={resetDiscrepancyFilter}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X size={10} />
              重置筛选
            </button>
          )}
        </div>

        <div className="flex items-center bg-zinc-900/80 border border-zinc-800/60 rounded-lg p-0.5">
          {([
            { key: 'type' as const, label: '按类型' },
            { key: 'batch' as const, label: '按批次' },
            { key: 'status' as const, label: '按状态' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setGroupBy(key)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                groupBy === key
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {showFilters && (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">批次</label>
              <select
                value={discrepancyFilter.batchName}
                onChange={(e) => setDiscrepancyFilter({ batchName: e.target.value })}
                className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/60"
              >
                <option value="">全部批次</option>
                {batchNames.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">颜色</label>
              <select
                value={discrepancyFilter.color}
                onChange={(e) => setDiscrepancyFilter({ color: e.target.value })}
                className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/60"
              >
                <option value="">全部颜色</option>
                {colors.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">责任人</label>
              <select
                value={discrepancyFilter.responsiblePerson}
                onChange={(e) => setDiscrepancyFilter({ responsiblePerson: e.target.value })}
                className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/60"
              >
                <option value="">全部责任人</option>
                {persons.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">交接状态</label>
              <select
                value={discrepancyFilter.handoverStatus}
                onChange={(e) => setDiscrepancyFilter({ handoverStatus: e.target.value as HandoverStatus | '' })}
                className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/60"
              >
                <option value="">全部交接状态</option>
                {HANDOVER_STATUS_LIST.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">差异类型</label>
              <select
                value={discrepancyFilter.type}
                onChange={(e) => setDiscrepancyFilter({ type: e.target.value as DiscrepancyType | '' })}
                className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/60"
              >
                <option value="">全部类型</option>
                {DISCREPANCY_TYPE_LIST.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">处理状态</label>
              <select
                value={discrepancyFilter.status}
                onChange={(e) => setDiscrepancyFilter({ status: e.target.value as DiscrepancyStatus | '' })}
                className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/60"
              >
                <option value="">全部状态</option>
                {DISCREPANCY_STATUS_LIST.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <AddDiscrepancyForm
          records={records}
          onSubmit={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {discrepancyRecords.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700/60 bg-zinc-900/20 py-20 text-center">
          <FileWarning size={36} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500">暂无差异记录</p>
          <p className="text-xs text-zinc-600 mt-1">
            {records.length === 0 ? '请先新增手环条目，再登记现场发放差异' : '点击「登记差异」添加现场发放差异'}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700/60 bg-zinc-900/20 py-20 text-center">
          <FileX size={36} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500">当前筛选条件下无匹配差异记录</p>
          <button
            onClick={resetDiscrepancyFilter}
            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            重置筛选条件
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedDiscrepancies.map(([groupKey, items]) => {
            const groupAffected = items.reduce((s, d) => s + d.affectedQty, 0)
            const groupUnresolved = items.filter((d) => d.status !== '已处理').length
            return (
              <div key={groupKey} className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
                <div className="px-5 py-3.5 bg-zinc-900/80 border-b border-zinc-800/40">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-zinc-100">{groupKey}</span>
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-400">
                        {items.length} 条
                      </span>
                      {groupUnresolved > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-[10px] text-sky-400 border border-sky-500/20">
                          {groupUnresolved} 未处理
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">
                      影响数量 <span className="text-orange-400 font-medium tabular-nums">{groupAffected}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {items.map((d) => {
                    const record = records.find((r) => r.id === d.recordId)
                    const hs = record ? getHandoverStatus(record.id) : '待确认' as HandoverStatus
                    return (
                      <DiscrepancyCard
                        key={d.id}
                        discrepancy={d}
                        record={record}
                        handoverStatus={hs}
                        onResolve={resolveDiscrepancy}
                        onDelete={deleteDiscrepancy}
                        onMarkProcessing={handleMarkProcessing}
                      />
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
