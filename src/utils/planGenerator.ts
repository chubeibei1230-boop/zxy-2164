import {
  WristbandRecord,
  HandoverRecord,
  DiscrepancyRecord,
  PlanGroupBy,
  PlanGroupItem,
  PlanItemStats,
  PlanFilter,
} from '@/types'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

function createEmptyStats(): PlanItemStats {
  return {
    pendingQty: 0,
    availableQty: 0,
    deferredQty: 0,
    reviewQty: 0,
    abnormalQty: 0,
    totalQty: 0,
  }
}

function aggregateStats(statsList: PlanItemStats[]): PlanItemStats {
  return statsList.reduce(
    (acc, s) => ({
      pendingQty: acc.pendingQty + s.pendingQty,
      availableQty: acc.availableQty + s.availableQty,
      deferredQty: acc.deferredQty + s.deferredQty,
      reviewQty: acc.reviewQty + s.reviewQty,
      abnormalQty: acc.abnormalQty + s.abnormalQty,
      totalQty: acc.totalQty + s.totalQty,
    }),
    createEmptyStats()
  )
}

function calculateItemStats(
  records: WristbandRecord[],
  handoverRecords: HandoverRecord[],
  discrepancyRecords: DiscrepancyRecord[]
): { stats: PlanItemStats; warnings: string[] } {
  const stats = createEmptyStats()
  const warnings: string[] = []

  const recordIdSet = new Set(records.map((r) => r.id))

  const activeDiscrepancies = discrepancyRecords.filter(
    (d) => recordIdSet.has(d.recordId) && d.status !== '已处理'
  )
  const unresolvedDiscrepanciesByRecord = new Map<string, DiscrepancyRecord[]>()
  for (const d of activeDiscrepancies) {
    if (!unresolvedDiscrepanciesByRecord.has(d.recordId)) {
      unresolvedDiscrepanciesByRecord.set(d.recordId, [])
    }
    unresolvedDiscrepanciesByRecord.get(d.recordId)!.push(d)
  }

  for (const record of records) {
    stats.totalQty += record.quantity

    const handover = handoverRecords.find((h) => h.recordId === record.id)
    const handoverStatus = handover?.status ?? '待确认'
    const discrepancies = unresolvedDiscrepanciesByRecord.get(record.id) ?? []

    if (discrepancies.length > 0) {
      const discQty = discrepancies.reduce((s, d) => s + d.affectedQty, 0)
      stats.abnormalQty += Math.min(discQty || record.quantity, record.quantity)

      for (const d of discrepancies) {
        warnings.push(`${d.type}：${d.description}`)
      }
    }

    if (handoverStatus === '退回复核') {
      stats.reviewQty += record.quantity
    } else if (handoverStatus === '暂缓') {
      stats.deferredQty += record.quantity
    } else if (record.status === '可发放' && handoverStatus === '已确认') {
      stats.availableQty += record.quantity
    } else {
      stats.pendingQty += record.quantity
    }
  }

  const uniqueWarnings = [...new Set(warnings)]

  if (stats.abnormalQty > 0) {
    uniqueWarnings.unshift(`存在 ${activeDiscrepancies.length} 项未处理差异`)
  }

  if (stats.reviewQty > 0) {
    uniqueWarnings.unshift(`${stats.reviewQty} 个手环待复核`)
  }

  if (stats.deferredQty > 0) {
    uniqueWarnings.unshift(`${stats.deferredQty} 个手环暂缓发放`)
  }

  return { stats, warnings: uniqueWarnings.slice(0, 5) }
}

function filterRecords(
  records: WristbandRecord[],
  filter: PlanFilter
): WristbandRecord[] {
  return records.filter((r) => {
    if (filter.batchName && r.batchName !== filter.batchName) return false
    if (filter.color && r.color !== filter.color) return false
    if (filter.targetGroup && r.targetGroup !== filter.targetGroup) return false
    if (filter.responsiblePerson && r.responsiblePerson !== filter.responsiblePerson) return false
    if (filter.status && r.status !== filter.status) return false
    return true
  })
}

export function generatePlanItems(
  records: WristbandRecord[],
  handoverRecords: HandoverRecord[],
  discrepancyRecords: DiscrepancyRecord[],
  groupBy: PlanGroupBy,
  filter: PlanFilter
): { items: PlanGroupItem[]; summary: PlanItemStats } {
  const filteredRecords = filterRecords(records, filter)

  const groups = new Map<string, WristbandRecord[]>()
  for (const r of filteredRecords) {
    const key = String(r[groupBy])
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }

  const items: PlanGroupItem[] = []
  const allStats: PlanItemStats[] = []

  for (const [groupValue, groupRecords] of groups.entries()) {
    const { stats, warnings } = calculateItemStats(
      groupRecords,
      handoverRecords,
      discrepancyRecords
    )
    allStats.push(stats)

    const minPriority = Math.min(...groupRecords.map((r) => r.priority))

    items.push({
      id: generateId(),
      groupKey: groupBy,
      groupValue,
      displayOrder: minPriority,
      siteNotes: '',
      stats,
      recordIds: groupRecords.map((r) => r.id),
      warnings,
    })
  }

  items.sort((a, b) => {
    if (a.stats.abnormalQty > 0 && b.stats.abnormalQty === 0) return -1
    if (a.stats.abnormalQty === 0 && b.stats.abnormalQty > 0) return 1
    if (a.stats.availableQty > 0 && b.stats.availableQty === 0) return -1
    if (a.stats.availableQty === 0 && b.stats.availableQty > 0) return 1
    return a.displayOrder - b.displayOrder
  })

  items.forEach((item, idx) => {
    item.displayOrder = idx + 1
  })

  const summary = aggregateStats(allStats)

  return { items, summary }
}

export function getFilterOptions(records: WristbandRecord[]) {
  return {
    batchNames: [...new Set(records.map((r) => r.batchName))].sort(),
    colors: [...new Set(records.map((r) => r.color))].sort(),
    targetGroups: [...new Set(records.map((r) => r.targetGroup))].sort(),
    responsiblePersons: [...new Set(records.map((r) => r.responsiblePerson))].sort(),
  }
}

export function getGroupLabel(groupBy: string): string {
  const labels: Record<string, string> = {
    batchName: '批次',
    color: '颜色',
    targetGroup: '人群',
    responsiblePerson: '责任人',
    status: '状态',
  }
  return labels[groupBy] || '分组'
}
