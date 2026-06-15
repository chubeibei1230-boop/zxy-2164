import { useWristbandStore } from '@/store/useWristbandStore'
import { COLOR_MAP, STATUS_COLOR_MAP, STATUS_LIST, WristbandStatus } from '@/types'
import { cn } from '@/lib/utils'
import { Filter, RotateCcw } from 'lucide-react'

export default function FilterBar() {
  const { filters, setFilters, resetFilters, records } = useWristbandStore()

  const colors = [...new Set(records.map((r) => r.color))]
  const persons = [...new Set(records.map((r) => r.responsiblePerson))]

  const selectCls = 'bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3 py-1.5 text-zinc-300 text-sm focus:outline-none focus:border-indigo-500/60 transition-colors appearance-none cursor-pointer'

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
        <Filter size={14} />
        筛选
      </div>

      <select
        value={filters.color}
        onChange={(e) => setFilters({ color: e.target.value })}
        className={selectCls}
      >
        <option value="">全部颜色</option>
        {colors.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        value={filters.responsiblePerson}
        onChange={(e) => setFilters({ responsiblePerson: e.target.value })}
        className={selectCls}
      >
        <option value="">全部责任人</option>
        {persons.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) => setFilters({ status: e.target.value as WristbandStatus | '' })}
        className={selectCls}
      >
        <option value="">全部状态</option>
        {STATUS_LIST.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select
        value={filters.priority}
        onChange={(e) => setFilters({ priority: e.target.value ? Number(e.target.value) : '' })}
        className={selectCls}
      >
        <option value="">全部优先级</option>
        {[...new Set(records.map((r) => r.priority))]
          .sort((a, b) => a - b)
          .map((p) => (
            <option key={p} value={p}>优先级 {p}</option>
          ))}
      </select>

      <button
        onClick={resetFilters}
        className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <RotateCcw size={12} />
        重置
      </button>
    </div>
  )
}
