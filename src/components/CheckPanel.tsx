import { useWristbandStore } from '@/store/useWristbandStore'
import { CHECK_LEVEL_COLOR, CHECK_LEVEL_BG, COLOR_MAP } from '@/types'
import { cn } from '@/lib/utils'
import { AlertTriangle, ShieldAlert, Info, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useState } from 'react'

const levelIcon = {
  '严重': ShieldAlert,
  '警告': AlertTriangle,
  '提示': Info,
}

export default function CheckPanel() {
  const { checkResults, setEditingRecord, setShowForm, records } = useWristbandStore()
  const [expanded, setExpanded] = useState(true)

  if (checkResults.length === 0) return null

  return (
    <div className="rounded-xl border border-zinc-800/60 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/80 hover:bg-zinc-800/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-400" />
          <span className="text-sm font-medium text-zinc-200">
            检查结果
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
            {checkResults.length}
          </span>
        </div>
        {expanded ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
      </button>

      {expanded && (
        <div className="divide-y divide-zinc-800/40">
          {checkResults.map((result, idx) => {
            const Icon = levelIcon[result.level]
            return (
              <div
                key={idx}
                className={cn('px-4 py-3 border-l-2', CHECK_LEVEL_BG[result.level])}
              >
                <div className="flex items-start gap-2">
                  <Icon size={14} className={cn('mt-0.5 shrink-0', CHECK_LEVEL_COLOR[result.level])} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('text-xs font-semibold', CHECK_LEVEL_COLOR[result.level])}>
                        {result.level}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {result.type}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300">{result.message}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {result.recordIds.slice(0, 5).map((id) => {
                        const record = records.find((r) => r.id === id)
                        if (!record) return null
                        return (
                          <button
                            key={id}
                            onClick={() => {
                              setEditingRecord(record)
                              setShowForm(true)
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/60 text-xs text-zinc-400 hover:text-indigo-400 hover:bg-zinc-700/60 transition-colors"
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: COLOR_MAP[record.color] || '#888' }}
                            />
                            {record.batchName}-{record.color}
                          </button>
                        )
                      })}
                      {result.recordIds.length > 5 && (
                        <span className="text-xs text-zinc-500">
                          +{result.recordIds.length - 5} 更多
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
