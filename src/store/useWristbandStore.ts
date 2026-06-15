import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  WristbandRecord,
  WristbandStatus,
  FilterState,
  ViewMode,
  CheckResult,
  HandoverRecord,
  HandoverStatus,
  HandoverQuickFilter,
} from '@/types'
import { runChecks } from '@/utils/validators'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

interface WristbandStore {
  records: WristbandRecord[]
  filters: FilterState
  selectedIds: string[]
  viewMode: ViewMode
  checkResults: CheckResult[]
  checkScope: 'all' | 'filtered'
  editingRecord: WristbandRecord | null
  showForm: boolean
  handoverRecords: HandoverRecord[]
  handoverQuickFilter: HandoverQuickFilter
  handoverPersonFilter: string

  addRecord: (record: Omit<WristbandRecord, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateRecord: (id: string, data: Partial<WristbandRecord>) => void
  deleteRecord: (id: string) => void
  deleteRecords: (ids: string[]) => void
  setFilters: (filters: Partial<FilterState>) => void
  resetFilters: () => void
  toggleSelect: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  batchUpdateStatus: (ids: string[], status: WristbandStatus) => void
  setViewMode: (mode: ViewMode) => void
  setCheckScope: (scope: 'all' | 'filtered') => void
  setEditingRecord: (record: WristbandRecord | null) => void
  setShowForm: (show: boolean) => void
  getFilteredRecords: () => WristbandRecord[]
  getFilteredCheckResults: () => CheckResult[]
  runAutoCheck: () => void
  seedDemoData: () => void
  clearAll: () => void
  setHandoverStatus: (recordId: string, status: HandoverStatus) => void
  getHandoverStatus: (recordId: string) => HandoverStatus
  setHandoverQuickFilter: (filter: HandoverQuickFilter) => void
  setHandoverPersonFilter: (person: string) => void
  resetHandoverStatuses: () => void
}

function buildDemoData(): WristbandRecord[] {
  const now = new Date().toISOString()
  const mk = (
    color: string, batchName: string, quantity: number, targetGroup: string,
    priority: number, notes: string, responsiblePerson: string, status: WristbandStatus
  ): WristbandRecord => ({
    id: generateId(),
    color, batchName, quantity, targetGroup, priority, notes, responsiblePerson, status,
    createdAt: now, updatedAt: now,
  })
  return [
    mk('红色', 'A批次', 100, 'VIP嘉宾', 1, '', '张经理', '可发放'),
    mk('红色', 'B批次', 80, '工作人员', 2, '', '张经理', '待复核'),
    mk('蓝色', 'A批次', 150, '普通观众', 3, '', '李主管', '待分装'),
    mk('蓝色', 'C批次', 0, '替补观众', 4, '', '李主管', '可发放'),
    mk('绿色', 'B批次', 60, '志愿者', 5, '', '王组长', '待复核'),
    mk('黄色', 'A批次', 40, '媒体人员', 6, '', '赵专员', '暂缓'),
    mk('紫色', 'D批次', 70, '赞助商', 7, '数量偏少', '张经理', '待分装'),
    mk('橙色', 'C批次', 90, 'VIP嘉宾', 8, '', '张经理', '可发放'),
    mk('粉色', 'B批次', 55, 'VIP嘉宾', 9, '', '张经理', '待复核'),
    mk('青色', 'A批次', 45, '工作人员', 1, '', '张经理', '可发放'),
    mk('白色', 'D批次', 30, '工作人员', 2, '', '张经理', '待复核'),
    mk('黑色', 'C批次', 25, '安保人员', 11, '', '李主管', '暂缓'),
  ]
}

const defaultFilters: FilterState = {
  color: '',
  responsiblePerson: '',
  status: '',
  priority: '',
}

function matchesFilters(record: WristbandRecord, filters: FilterState) {
  if (filters.color && record.color !== filters.color) return false
  if (filters.responsiblePerson && record.responsiblePerson !== filters.responsiblePerson) return false
  if (filters.status && record.status !== filters.status) return false
  if (filters.priority !== '' && record.priority !== filters.priority) return false
  return true
}

export const useWristbandStore = create<WristbandStore>()(
  persist(
    (set, get) => ({
      records: [],
      filters: { ...defaultFilters },
      selectedIds: [],
      viewMode: 'table',
      checkResults: [],
      checkScope: 'filtered',
      editingRecord: null,
      showForm: false,
      handoverRecords: [],
      handoverQuickFilter: 'all',
      handoverPersonFilter: '',

      addRecord: (record) => {
        const now = new Date().toISOString()
        const newRecord: WristbandRecord = {
          ...record,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        }
        set((state) => {
          const records = [...state.records, newRecord]
          const checkResults = runChecks(records)
          return { records, checkResults }
        })
      },

      updateRecord: (id, data) => {
        set((state) => {
          const records = state.records.map((r) =>
            r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
          )
          const visibleIdSet = new Set(
            records.filter((r) => matchesFilters(r, state.filters)).map((r) => r.id)
          )
          const selectedIds = state.selectedIds.filter((sid) => visibleIdSet.has(sid))
          const checkResults = runChecks(records)
          return { records, selectedIds, checkResults }
        })
      },

      deleteRecord: (id) => {
        set((state) => {
          const records = state.records.filter((r) => r.id !== id)
          const selectedIds = state.selectedIds.filter((sid) => sid !== id)
          const checkResults = runChecks(records)
          return { records, selectedIds, checkResults }
        })
      },

      deleteRecords: (ids) => {
        set((state) => {
          const idSet = new Set(ids)
          const records = state.records.filter((r) => !idSet.has(r.id))
          const selectedIds = state.selectedIds.filter((sid) => !idSet.has(sid))
          const checkResults = runChecks(records)
          return { records, selectedIds, checkResults }
        })
      },

      setFilters: (newFilters) => {
        set((state) => {
          const nextFilters = { ...state.filters, ...newFilters }
          const visibleIds = state.records.filter((r) => matchesFilters(r, nextFilters)).map((r) => r.id)
          const visibleIdSet = new Set(visibleIds)
          const nextSelected = state.selectedIds.filter((id) => visibleIdSet.has(id))
          return { filters: nextFilters, selectedIds: nextSelected }
        })
      },

      resetFilters: () => {
        set({ filters: { ...defaultFilters } })
      },

      toggleSelect: (id) => {
        set((state) => {
          const selectedIds = state.selectedIds.includes(id)
            ? state.selectedIds.filter((sid) => sid !== id)
            : [...state.selectedIds, id]
          return { selectedIds }
        })
      },

      selectAll: (ids) => {
        set({ selectedIds: ids })
      },

      clearSelection: () => {
        set({ selectedIds: [] })
      },

      batchUpdateStatus: (ids, status) => {
        set((state) => {
          const idSet = new Set(ids)
          const records = state.records.map((r) =>
            idSet.has(r.id) ? { ...r, status, updatedAt: new Date().toISOString() } : r
          )
          const checkResults = runChecks(records)
          return { records, checkResults, selectedIds: [] }
        })
      },

      setViewMode: (mode) => {
        set({ viewMode: mode })
        get().runAutoCheck()
      },

      setCheckScope: (scope) => {
        set({ checkScope: scope })
      },

      setEditingRecord: (record) => {
        set({ editingRecord: record, showForm: !!record })
      },

      setShowForm: (show) => {
        set({ showForm: show, editingRecord: show ? get().editingRecord : null })
      },

      getFilteredRecords: () => {
        const { records, filters } = get()
        return records.filter((r) => matchesFilters(r, filters))
      },

      getFilteredCheckResults: () => {
        const { checkResults, checkScope, records, filters } = get()
        if (checkScope === 'all') return checkResults
        return runChecks(records.filter((r) => matchesFilters(r, filters)))
      },

      runAutoCheck: () => {
        const { records } = get()
        const checkResults = runChecks(records)
        set({ checkResults })
      },

      seedDemoData: () => {
        const records = buildDemoData()
        const checkResults = runChecks(records)
        set({ records, checkResults })
      },

      clearAll: () => {
        set({ records: [], checkResults: [], selectedIds: [], handoverRecords: [] })
      },

      setHandoverStatus: (recordId, status) => {
        set((state) => {
          const now = new Date().toISOString()
          const wristbandStatusByHandover: Partial<Record<HandoverStatus, WristbandStatus>> = {
            '已确认': '可发放',
            '暂缓': '暂缓',
            '退回复核': '待复核',
          }
          const existing = state.handoverRecords.find((h) => h.recordId === recordId)
          let handoverRecords: HandoverRecord[]
          if (existing) {
            handoverRecords = state.handoverRecords.map((h) =>
              h.recordId === recordId ? { ...h, status, updatedAt: now } : h
            )
          } else {
            handoverRecords = [...state.handoverRecords, { recordId, status, updatedAt: now }]
          }
          const wristbandStatus = wristbandStatusByHandover[status]
          if (!wristbandStatus) return { handoverRecords }

          const records = state.records.map((r) =>
            r.id === recordId ? { ...r, status: wristbandStatus, updatedAt: now } : r
          )
          const checkResults = runChecks(records)
          return { handoverRecords, records, checkResults }
        })
      },

      getHandoverStatus: (recordId) => {
        const h = get().handoverRecords.find((r) => r.recordId === recordId)
        return h?.status ?? '待确认'
      },

      setHandoverQuickFilter: (filter) => {
        set({ handoverQuickFilter: filter })
      },

      setHandoverPersonFilter: (person) => {
        set({ handoverPersonFilter: person })
      },

      resetHandoverStatuses: () => {
        set({ handoverRecords: [] })
      },
    }),
    {
      name: 'wristband-color-group-data',
      partialize: (state) => ({
        records: state.records,
        handoverRecords: state.handoverRecords,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.checkResults = runChecks(state.records)
        }
      },
    }
  )
)
