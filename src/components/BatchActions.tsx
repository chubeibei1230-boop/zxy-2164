import { useWristbandStore } from '@/store/useWristbandStore'
import { STATUS_LIST, WristbandStatus } from '@/types'
import { cn } from '@/lib/utils'
import { Check, X, RefreshCw } from 'lucide-react'
import { useState } from 'react'

export default function BatchActions() {
  const { selectedIds, batchUpdateStatus, clearSelection, deleteRecords } = useWristbandStore()
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (selectedIds.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-700/50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-300">
            已选择 <span className="text-indigo-400 font-semibold">{selectedIds.length}</span> 条
          </span>
          <button
            onClick={clearSelection}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            取消选择
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 mr-1">批量设为：</span>
          {STATUS_LIST.map((s) => (
            <button
              key={s}
              onClick={() => batchUpdateStatus(selectedIds, s as WristbandStatus)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                s === '待分装' && 'bg-gray-500/10 text-gray-300 border-gray-500/30 hover:bg-gray-500/20',
                s === '待复核' && 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20',
                s === '可发放' && 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20',
                s === '暂缓' && 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20',
              )}
            >
              {s}
            </button>
          ))}

          <div className="w-px h-6 bg-zinc-700/50 mx-2" />

          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">确认删除？</span>
              <button
                onClick={() => {
                  deleteRecords(selectedIds)
                  setConfirmDelete(false)
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                <Check size={12} /> 确认
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors"
              >
                <X size={12} /> 取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-zinc-800 hover:bg-red-600/20 text-zinc-400 hover:text-red-400 border border-zinc-700/50 hover:border-red-500/30 transition-colors"
            >
              <RefreshCw size={12} /> 删除选中
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
