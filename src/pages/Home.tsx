import { useState } from 'react'
import { useWristbandStore } from '@/store/useWristbandStore'
import RecordForm from '@/components/RecordForm'
import RecordTable from '@/components/RecordTable'
import FilterBar from '@/components/FilterBar'
import BatchActions from '@/components/BatchActions'
import CheckPanel from '@/components/CheckPanel'
import BatchOverview from '@/components/BatchOverview'
import HandoverChecklist from '@/components/HandoverChecklist'
import DiscrepancyHandler from '@/components/DiscrepancyHandler'
import OnsitePlan from '@/components/OnsitePlan'
import ConfirmDialog from '@/components/ConfirmDialog'
import {
  Plus,
  LayoutList,
  Package,
  AlertTriangle,
  Sparkles,
  Trash2,
  ClipboardList,
  FileWarning,
  ClipboardCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Home() {
  const {
    viewMode,
    setViewMode,
    showForm,
    setShowForm,
    setEditingRecord,
    checkResults,
    getFilteredRecords,
    getFilteredCheckResults,
    seedDemoData,
    clearAll,
    records,
    checkScope,
  } = useWristbandStore()

  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const filteredRecords = getFilteredRecords()
  const visibleCheckResults = getFilteredCheckResults()
  const isEmpty = records.length === 0

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Package size={16} className="text-white" />
              </div>
              <h1 className="text-lg font-bold tracking-tight">活动手环颜色分组</h1>
            </div>

            {visibleCheckResults.length > 0 && (
              <button
                onClick={() => {
                  const el = document.getElementById('check-panel')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <AlertTriangle size={12} />
                {visibleCheckResults.length} 项异常
                {checkScope === 'filtered' && checkResults.length > visibleCheckResults.length && (
                  <span className="text-zinc-500">/ {checkResults.length}</span>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-zinc-900 border border-zinc-800/60 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                <LayoutList size={13} />
                列表视图
              </button>
              <button
                onClick={() => setViewMode('batch')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  viewMode === 'batch'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                <Package size={13} />
                批次速览
              </button>
              <button
                onClick={() => setViewMode('handover')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  viewMode === 'handover'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                <ClipboardList size={13} />
                发放交接
              </button>
              <button
                onClick={() => setViewMode('discrepancy')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  viewMode === 'discrepancy'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                <FileWarning size={13} />
                差异处理
              </button>
              <button
                onClick={() => setViewMode('plan')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  viewMode === 'plan'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                <ClipboardCheck size={13} />
                发放预案
              </button>
            </div>

            {!isEmpty && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 text-xs font-medium transition-colors border border-zinc-700/50"
              >
                <Trash2 size={13} />
                清空
              </button>
            )}

            <button
              onClick={() => {
                setEditingRecord(null)
                setShowForm(true)
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
            >
              <Plus size={15} />
              新增条目
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {isEmpty && (
          <div className="rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/5 p-5 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={16} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-200 mb-1">快速体验</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  当前没有数据。点击「加载演示数据」可快速生成 12
                  条示例条目，覆盖各类自动检查场景（颜色重复映射、数量为零可发放、责任人堆积、优先级断档）。
                </p>
              </div>
            </div>
            <button
              onClick={seedDemoData}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20 shrink-0"
            >
              <Sparkles size={14} />
              加载演示数据
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <FilterBar />
          <span className="text-xs text-zinc-500">
            共 {filteredRecords.length} / {records.length} 条记录
          </span>
        </div>

        <div id="check-panel">
          <CheckPanel />
        </div>

        {viewMode === 'table' ? (
          <RecordTable />
        ) : viewMode === 'batch' ? (
          <BatchOverview />
        ) : viewMode === 'handover' ? (
          <HandoverChecklist />
        ) : viewMode === 'discrepancy' ? (
          <DiscrepancyHandler />
        ) : (
          <OnsitePlan />
        )}
      </main>

      {showForm && <RecordForm />}
      <BatchActions />

      <ConfirmDialog
        open={showClearConfirm}
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={() => {
          clearAll()
          setShowClearConfirm(false)
        }}
        title="确认清空全部数据？"
        message="此操作将删除全部本地手环记录，且无法恢复。请确认后再操作。"
        confirmText="确认清空"
        cancelText="取消"
        variant="danger"
      />
    </div>
  )
}
