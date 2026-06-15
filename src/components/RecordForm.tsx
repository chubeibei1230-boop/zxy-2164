import { useState, useEffect } from 'react'
import { useWristbandStore } from '@/store/useWristbandStore'
import { WristbandStatus, STATUS_LIST, COLOR_MAP } from '@/types'
import { X, Save } from 'lucide-react'

const emptyForm = {
  color: '红色',
  batchName: '',
  quantity: 0,
  targetGroup: '',
  priority: 1,
  notes: '',
  responsiblePerson: '',
  status: '待分装' as WristbandStatus,
}

export default function RecordForm() {
  const { showForm, editingRecord, setShowForm, addRecord, updateRecord } = useWristbandStore()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEdit = !!editingRecord

  useEffect(() => {
    if (showForm) {
      setForm(editingRecord ? { ...editingRecord } : { ...emptyForm })
      setErrors({})
    }
  }, [showForm, editingRecord])

  if (!showForm) return null

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.batchName.trim()) errs.batchName = '批次名不能为空'
    if (form.quantity < 0) errs.quantity = '数量不能为负'
    if (!form.targetGroup.trim()) errs.targetGroup = '适用人群不能为空'
    if (form.priority < 1) errs.priority = '优先级须 ≥ 1'
    if (!form.responsiblePerson.trim()) errs.responsiblePerson = '责任人不能为空'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    if (isEdit && editingRecord) {
      updateRecord(editingRecord.id, form)
    } else {
      addRecord(form)
    }
    setShowForm(false)
  }

  const handleClose = () => {
    setShowForm(false)
  }

  const inputCls = 'w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors'
  const labelCls = 'block text-xs font-medium text-zinc-400 mb-1.5'
  const errCls = 'text-xs text-red-400 mt-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700/50 rounded-2xl shadow-2xl p-6 mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-100">
            {isEdit ? '编辑手环条目' : '新增手环条目'}
          </h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>手环颜色</label>
            <div className="relative">
              <select
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className={inputCls}
              >
                {Object.keys(COLOR_MAP).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span
                className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-zinc-600"
                style={{ backgroundColor: COLOR_MAP[form.color] || '#888' }}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>批次名称</label>
            <input
              value={form.batchName}
              onChange={(e) => setForm({ ...form, batchName: e.target.value })}
              className={inputCls}
              placeholder="如：A批次"
            />
            {errors.batchName && <p className={errCls}>{errors.batchName}</p>}
          </div>

          <div>
            <label className={labelCls}>数量</label>
            <input
              type="number"
              min={0}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              className={inputCls}
            />
            {errors.quantity && <p className={errCls}>{errors.quantity}</p>}
          </div>

          <div>
            <label className={labelCls}>适用人群</label>
            <input
              value={form.targetGroup}
              onChange={(e) => setForm({ ...form, targetGroup: e.target.value })}
              className={inputCls}
              placeholder="如：嘉宾"
            />
            {errors.targetGroup && <p className={errCls}>{errors.targetGroup}</p>}
          </div>

          <div>
            <label className={labelCls}>优先发放顺序</label>
            <input
              type="number"
              min={1}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
              className={inputCls}
            />
            {errors.priority && <p className={errCls}>{errors.priority}</p>}
          </div>

          <div>
            <label className={labelCls}>责任人</label>
            <input
              value={form.responsiblePerson}
              onChange={(e) => setForm({ ...form, responsiblePerson: e.target.value })}
              className={inputCls}
              placeholder="姓名"
            />
            {errors.responsiblePerson && <p className={errCls}>{errors.responsiblePerson}</p>}
          </div>

          <div>
            <label className={labelCls}>状态</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as WristbandStatus })}
              className={inputCls}
            >
              {STATUS_LIST.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className={labelCls}>异常备注</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={`${inputCls} resize-none`}
              rows={2}
              placeholder="如有特殊情况请备注"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm rounded-lg text-zinc-400 hover:bg-zinc-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Save size={14} />
            {isEdit ? '保存修改' : '添加条目'}
          </button>
        </div>
      </div>
    </div>
  )
}
