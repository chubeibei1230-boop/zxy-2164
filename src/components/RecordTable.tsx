import { useWristbandStore } from '@/store/useWristbandStore'
import { COLOR_MAP, STATUS_COLOR_MAP, WristbandStatus, STATUS_LIST } from '@/types'
import { cn } from '@/lib/utils'
import { Edit3, Trash2, Check, Square } from 'lucide-react'
import { useState } from 'react'

export default function RecordTable() {
  const {
    getFilteredRecords,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    deleteRecord,
    setEditingRecord,
    setShowForm,
    updateRecord,
  } = useWristbandStore()

  const records = getFilteredRecords()
  const allSelected = records.length > 0 && records.every((r) => selectedIds.includes(r.id))

  const handleEdit = (record: typeof records[0]) => {
    setEditingRecord(record)
    setShowForm(true)
  }

  const [statusMenuId, setStatusMenuId] = useState<string | null>(null)

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-900/80 text-zinc-400 text-xs uppercase tracking-wider">
            <th className="px-4 py-3 w-10">
              <button onClick={() => allSelected ? clearSelection() : selectAll(records.map((r) => r.id))}>
                {allSelected ? <Check size={16} className="text-indigo-400" /> : <Square size={16} />}
              </button>
            </th>
            <th className="px-4 py-3 text-left">颜色</th>
            <th className="px-4 py-3 text-left">批次</th>
            <th className="px-4 py-3 text-right">数量</th>
            <th className="px-4 py-3 text-left">适用人群</th>
            <th className="px-4 py-3 text-center">优先级</th>
            <th className="px-4 py-3 text-left">责任人</th>
            <th className="px-4 py-3 text-center">状态</th>
            <th className="px-4 py-3 text-left">备注</th>
            <th className="px-4 py-3 text-center">操作</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => {
            const isSelected = selectedIds.includes(r.id)
            return (
              <tr
                key={r.id}
                className={cn(
                  'border-t border-zinc-800/40 transition-colors',
                  isSelected ? 'bg-indigo-500/5' : 'hover:bg-zinc-800/30'
                )}
              >
                <td className="px-4 py-3">
                  <button onClick={() => toggleSelect(r.id)}>
                    {isSelected
                      ? <Check size={16} className="text-indigo-400" />
                      : <Square size={16} className="text-zinc-600" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-zinc-600/50 shrink-0"
                      style={{ backgroundColor: COLOR_MAP[r.color] || '#888' }}
                    />
                    <span className="text-zinc-200">{r.color}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-200 font-medium">{r.batchName}</td>
                <td className="px-4 py-3 text-right text-zinc-300 tabular-nums">{r.quantity}</td>
                <td className="px-4 py-3 text-zinc-300">{r.targetGroup}</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-800 text-zinc-200 font-mono text-xs">
                    {r.priority}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-300">{r.responsiblePerson}</td>
                <td className="px-4 py-3 text-center relative">
                  <button
                    onClick={() => setStatusMenuId(statusMenuId === r.id ? null : r.id)}
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer transition-colors',
                      STATUS_COLOR_MAP[r.status]
                    )}
                  >
                    {r.status}
                  </button>
                  {statusMenuId === r.id && (
                    <div className="absolute z-20 mt-1 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700/60 rounded-lg shadow-xl py-1 min-w-[100px]">
                      {STATUS_LIST.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            updateRecord(r.id, { status: s as WristbandStatus })
                            setStatusMenuId(null)
                          }}
                          className={cn(
                            'block w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-700/60 transition-colors',
                            r.status === s ? 'text-indigo-400 font-medium' : 'text-zinc-300'
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs max-w-[160px] truncate">{r.notes || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
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
                </td>
              </tr>
            )
          })}
          {records.length === 0 && (
            <tr>
              <td colSpan={10} className="px-4 py-16 text-center text-zinc-500 text-sm">
                暂无手环条目，点击「新增条目」开始添加
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
