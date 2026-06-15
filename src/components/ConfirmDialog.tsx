import { X, AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/50 rounded-2xl shadow-2xl p-6 mx-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div
              className={
                variant === 'danger'
                  ? 'w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0'
                  : 'w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0'
              }
            >
              <AlertTriangle
                size={18}
                className={variant === 'danger' ? 'text-red-400' : 'text-amber-400'}
              />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
              <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{message}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg text-zinc-400 hover:bg-zinc-800 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={
              variant === 'danger'
                ? 'px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors shadow-lg shadow-red-600/20'
                : 'px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/20'
            }
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
