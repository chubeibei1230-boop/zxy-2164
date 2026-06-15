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
  DiscrepancyRecord,
  DiscrepancyFilter,
  DiscrepancyType,
  DiscrepancyStatus,
  DiscrepancyResult,
  PlanGroupBy,
  PlanGroupItem,
  PlanItemStats,
  PlanStatus,
  PlanFilter,
} from '@/types'
import { runChecks } from '@/utils/validators'
import { generatePlanItems } from '@/utils/planGenerator'

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
  discrepancyRecords: DiscrepancyRecord[]
  discrepancyFilter: DiscrepancyFilter
  planGroupBy: PlanGroupBy
  planFilter: PlanFilter
  planStatus: PlanStatus
  planItems: PlanGroupItem[]
  planSummary: PlanItemStats
  planName: string
  planConfirmedAt: string | null
  planCompletedAt: string | null
  planLastGenerated: string | null

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
  addDiscrepancy: (data: Omit<DiscrepancyRecord, 'id' | 'createdAt' | 'resolvedAt'>) => void
  updateDiscrepancy: (id: string, data: Partial<Pick<DiscrepancyRecord, 'status' | 'result' | 'resolution'>>) => void
  deleteDiscrepancy: (id: string) => void
  setDiscrepancyFilter: (filter: Partial<DiscrepancyFilter>) => void
  resetDiscrepancyFilter: () => void
  getFilteredDiscrepancies: () => DiscrepancyRecord[]
  resolveDiscrepancy: (id: string, result: DiscrepancyResult, resolution: string) => void
  generatePlan: () => void
  setPlanGroupBy: (groupBy: PlanGroupBy) => void
  setPlanFilter: (filter: Partial<PlanFilter>) => void
  resetPlanFilter: () => void
  setPlanItemOrder: (itemId: string, newOrder: number) => void
  movePlanItem: (itemId: string, direction: 'up' | 'down') => void
  setPlanItemNotes: (itemId: string, notes: string) => void
  setPlanStatus: (status: PlanStatus) => void
  setPlanName: (name: string) => void
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

const defaultDiscrepancyFilter: DiscrepancyFilter = {
  batchName: '',
  color: '',
  responsiblePerson: '',
  handoverStatus: '',
  type: '',
  status: '',
}

const defaultPlanFilter: PlanFilter = {
  batchName: '',
  color: '',
  targetGroup: '',
  responsiblePerson: '',
  status: '',
}

const emptyPlanSummary: PlanItemStats = {
  pendingQty: 0,
  availableQty: 0,
  deferredQty: 0,
  reviewQty: 0,
  abnormalQty: 0,
  totalQty: 0,
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
      discrepancyRecords: [],
      discrepancyFilter: { ...defaultDiscrepancyFilter },
      planGroupBy: 'batchName',
      planFilter: { ...defaultPlanFilter },
      planStatus: '草稿',
      planItems: [],
      planSummary: { ...emptyPlanSummary },
      planName: '现场发放预案',
      planConfirmedAt: null,
      planCompletedAt: null,
      planLastGenerated: null,

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
        if (get().viewMode === 'plan') {
          get().generatePlan()
        }
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
        if (get().viewMode === 'plan') {
          get().generatePlan()
        }
      },

      deleteRecord: (id) => {
        set((state) => {
          const records = state.records.filter((r) => r.id !== id)
          const selectedIds = state.selectedIds.filter((sid) => sid !== id)
          const handoverRecords = state.handoverRecords.filter((h) => h.recordId !== id)
          const discrepancyRecords = state.discrepancyRecords.filter((d) => d.recordId !== id)
          const checkResults = runChecks(records)
          return { records, selectedIds, handoverRecords, discrepancyRecords, checkResults }
        })
        if (get().viewMode === 'plan') {
          get().generatePlan()
        }
      },

      deleteRecords: (ids) => {
        set((state) => {
          const idSet = new Set(ids)
          const records = state.records.filter((r) => !idSet.has(r.id))
          const selectedIds = state.selectedIds.filter((sid) => !idSet.has(sid))
          const handoverRecords = state.handoverRecords.filter((h) => !idSet.has(h.recordId))
          const discrepancyRecords = state.discrepancyRecords.filter((d) => !idSet.has(d.recordId))
          const checkResults = runChecks(records)
          return { records, selectedIds, handoverRecords, discrepancyRecords, checkResults }
        })
        if (get().viewMode === 'plan') {
          get().generatePlan()
        }
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
        if (get().viewMode === 'plan') {
          get().generatePlan()
        }
      },

      setViewMode: (mode) => {
        set({ viewMode: mode })
        get().runAutoCheck()
        if (mode === 'plan') {
          get().generatePlan()
        }
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
        const records = buildDemoData().map((record, index) =>
          index === 2 || index === 11
            ? { ...record, status: '可发放' as WristbandStatus, updatedAt: new Date().toISOString() }
            : record
        )
        const checkResults = runChecks(records)
        const now = new Date().toISOString()
        const yesterday = new Date(Date.now() - 86400000).toISOString()
        const twoHoursAgo = new Date(Date.now() - 7200000).toISOString()

        const discrepancyRecords: DiscrepancyRecord[] = [
          {
            id: generateId(),
            recordId: records[0].id,
            type: '数量差异',
            description: '现场清点发现红色A批次VIP手环缺少5个，实际到货95个，登记100个',
            affectedQty: 5,
            status: '待处理',
            result: '',
            resolution: '',
            createdAt: twoHoursAgo,
            resolvedAt: null,
          },
          {
            id: generateId(),
            recordId: records[5].id,
            type: '暂缓发放',
            description: '黄色A批次媒体人员手环因嘉宾名单调整，暂时无法发放',
            affectedQty: 40,
            status: '处理中',
            result: '',
            resolution: '',
            createdAt: yesterday,
            resolvedAt: null,
          },
          {
            id: generateId(),
            recordId: records[2].id,
            type: '退回复核',
            description: '蓝色A批次普通观众手环颜色存在轻微色差，退回仓库重新质检',
            affectedQty: 20,
            status: '已处理',
            result: '已调整',
            resolution: '已联系供应商更换，新批次已到仓并通过质检，状态已更新为可发放',
            createdAt: yesterday,
            resolvedAt: now,
          },
          {
            id: generateId(),
            recordId: records[6].id,
            type: '备注异常',
            description: '紫色D批次赞助商手环备注标注"数量偏少"，需确认最终发放数量',
            affectedQty: 0,
            status: '待处理',
            result: '',
            resolution: '',
            createdAt: twoHoursAgo,
            resolvedAt: null,
          },
          {
            id: generateId(),
            recordId: records[11].id,
            type: '数量差异',
            description: '黑色C批次安保手环多出3个，需确认是否为额外备货',
            affectedQty: 3,
            status: '已处理',
            result: '其他',
            resolution: '确认为备用手环，已登记入库留作应急使用',
            createdAt: yesterday,
            resolvedAt: twoHoursAgo,
          },
        ]

        const handoverRecords: HandoverRecord[] = records.slice(0, 4).map((r, idx) => ({
          recordId: r.id,
          status: (['已确认', '待确认', '已确认', '退回复核'] as HandoverStatus[])[idx],
          updatedAt: now,
        }))

        set({ records, checkResults, discrepancyRecords, handoverRecords })
      },

      clearAll: () => {
        set({ records: [], checkResults: [], selectedIds: [], handoverRecords: [], discrepancyRecords: [] })
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
        if (get().viewMode === 'plan') {
          get().generatePlan()
        }
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

      addDiscrepancy: (data) => {
        const now = new Date().toISOString()
        const newRecord: DiscrepancyRecord = {
          ...data,
          id: generateId(),
          createdAt: now,
          resolvedAt: null,
        }
        set((state) => ({
          discrepancyRecords: [...state.discrepancyRecords, newRecord],
        }))
        if (get().viewMode === 'plan') {
          get().generatePlan()
        }
      },

      updateDiscrepancy: (id, data) => {
        set((state) => ({
          discrepancyRecords: state.discrepancyRecords.map((d) =>
            d.id === id ? { ...d, ...data } : d
          ),
        }))
        if (get().viewMode === 'plan') {
          get().generatePlan()
        }
      },

      deleteDiscrepancy: (id) => {
        set((state) => ({
          discrepancyRecords: state.discrepancyRecords.filter((d) => d.id !== id),
        }))
        if (get().viewMode === 'plan') {
          get().generatePlan()
        }
      },

      setDiscrepancyFilter: (filter) => {
        set((state) => ({
          discrepancyFilter: { ...state.discrepancyFilter, ...filter },
        }))
      },

      resetDiscrepancyFilter: () => {
        set({ discrepancyFilter: { ...defaultDiscrepancyFilter } })
      },

      getFilteredDiscrepancies: () => {
        const { discrepancyRecords, discrepancyFilter, records } = get()
        return discrepancyRecords.filter((d) => {
          const record = records.find((r) => r.id === d.recordId)
          if (!record) return false
          if (discrepancyFilter.batchName && record.batchName !== discrepancyFilter.batchName) return false
          if (discrepancyFilter.color && record.color !== discrepancyFilter.color) return false
          if (discrepancyFilter.responsiblePerson && record.responsiblePerson !== discrepancyFilter.responsiblePerson) return false
          if (discrepancyFilter.handoverStatus) {
            const hs = get().getHandoverStatus(record.id)
            if (hs !== discrepancyFilter.handoverStatus) return false
          }
          if (discrepancyFilter.type && d.type !== discrepancyFilter.type) return false
          if (discrepancyFilter.status && d.status !== discrepancyFilter.status) return false
          return true
        })
      },

      resolveDiscrepancy: (id, result, resolution) => {
        const now = new Date().toISOString()
        set((state) => {
          const disc = state.discrepancyRecords.find((d) => d.id === id)
          if (!disc) return state

          const updated = state.discrepancyRecords.map((d) =>
            d.id === id
              ? { ...d, status: '已处理' as DiscrepancyStatus, result, resolution, resolvedAt: now }
              : d
          )

          const recordId = disc.recordId
          let handoverRecords = state.handoverRecords
          let records = state.records
          let nextHandoverStatus: HandoverStatus = '已确认'
          let nextWristbandStatus: WristbandStatus = '可发放'

          if (result === '已取消') {
            nextHandoverStatus = '暂缓'
            nextWristbandStatus = '暂缓'
          } else if (disc.type === '退回复核') {
            nextHandoverStatus = result === '已调整' || result === '已补发' ? '已确认' : '退回复核'
            nextWristbandStatus = result === '已调整' || result === '已补发' ? '可发放' : '待复核'
          }

          const existing = handoverRecords.find((h) => h.recordId === recordId)
          if (existing) {
            handoverRecords = handoverRecords.map((h) =>
              h.recordId === recordId ? { ...h, status: nextHandoverStatus, updatedAt: now } : h
            )
          } else {
            handoverRecords = [...handoverRecords, { recordId, status: nextHandoverStatus, updatedAt: now }]
          }
          records = records.map((r) =>
            r.id === recordId ? { ...r, status: nextWristbandStatus, updatedAt: now } : r
          )

          const checkResults = runChecks(records)
          return { discrepancyRecords: updated, handoverRecords, records, checkResults }
        })
        if (get().viewMode === 'plan') {
          get().generatePlan()
        }
      },

      resetHandoverStatuses: () => {
        set({ handoverRecords: [] })
      },

      generatePlan: () => {
        const { records, handoverRecords, discrepancyRecords, planGroupBy, planFilter, planItems } = get()
        const { items, summary } = generatePlanItems(
          records,
          handoverRecords,
          discrepancyRecords,
          planGroupBy,
          planFilter
        )

        const mergedItems = items.map((newItem) => {
          const existing = planItems.find(
            (e) => e.groupKey === newItem.groupKey && e.groupValue === newItem.groupValue
          )
          if (existing) {
            return {
              ...newItem,
              id: existing.id,
              displayOrder: existing.displayOrder,
              siteNotes: existing.siteNotes,
            }
          }
          return newItem
        })

        mergedItems.sort((a, b) => a.displayOrder - b.displayOrder)

        set({
          planItems: mergedItems,
          planSummary: summary,
          planLastGenerated: new Date().toISOString(),
        })
      },

      setPlanGroupBy: (groupBy) => {
        set({ planGroupBy: groupBy })
        get().generatePlan()
      },

      setPlanFilter: (filter) => {
        set((state) => ({
          planFilter: { ...state.planFilter, ...filter },
        }))
        get().generatePlan()
      },

      resetPlanFilter: () => {
        set({ planFilter: { ...defaultPlanFilter } })
        get().generatePlan()
      },

      setPlanItemOrder: (itemId, newOrder) => {
        set((state) => {
          const items = [...state.planItems]
          const itemIndex = items.findIndex((i) => i.id === itemId)
          if (itemIndex === -1) return state

          const item = items[itemIndex]
          const oldOrder = item.displayOrder

          if (newOrder < 1 || newOrder > items.length) return state

          items.forEach((i) => {
            if (i.id === itemId) {
              i.displayOrder = newOrder
            } else if (oldOrder < newOrder && i.displayOrder > oldOrder && i.displayOrder <= newOrder) {
              i.displayOrder -= 1
            } else if (oldOrder > newOrder && i.displayOrder >= newOrder && i.displayOrder < oldOrder) {
              i.displayOrder += 1
            }
          })

          items.sort((a, b) => a.displayOrder - b.displayOrder)

          return { planItems: items }
        })
      },

      movePlanItem: (itemId, direction) => {
        const item = get().planItems.find((i) => i.id === itemId)
        if (!item) return

        const newOrder = direction === 'up' ? item.displayOrder - 1 : item.displayOrder + 1
        get().setPlanItemOrder(itemId, newOrder)
      },

      setPlanItemNotes: (itemId, notes) => {
        set((state) => ({
          planItems: state.planItems.map((i) =>
            i.id === itemId ? { ...i, siteNotes: notes } : i
          ),
        }))
      },

      setPlanStatus: (status) => {
        const now = new Date().toISOString()
        set((state) => {
          const updates: Partial<WristbandStore> = { planStatus: status }
          if (status === '已确认' && !state.planConfirmedAt) {
            updates.planConfirmedAt = now
          }
          if (status === '已完成') {
            updates.planCompletedAt = now
          }
          return updates
        })
      },

      setPlanName: (name) => {
        set({ planName: name })
      },
    }),
    {
      name: 'wristband-color-group-data',
      partialize: (state) => ({
        records: state.records,
        handoverRecords: state.handoverRecords,
        discrepancyRecords: state.discrepancyRecords,
        planItems: state.planItems,
        planGroupBy: state.planGroupBy,
        planFilter: state.planFilter,
        planStatus: state.planStatus,
        planName: state.planName,
        planConfirmedAt: state.planConfirmedAt,
        planCompletedAt: state.planCompletedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.checkResults = runChecks(state.records)
        }
      },
    }
  )
)
