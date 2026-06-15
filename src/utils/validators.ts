import { WristbandRecord, CheckResult } from '@/types'

export function runChecks(records: WristbandRecord[]): CheckResult[] {
  const results: CheckResult[] = []

  checkDuplicateColorMapping(records, results)
  checkZeroQuantityReleasable(records, results)
  checkResponsibleOverload(records, results)
  checkPriorityGaps(records, results)

  return results
}

function checkDuplicateColorMapping(records: WristbandRecord[], results: CheckResult[]) {
  const colorMap = new Map<string, WristbandRecord[]>()
  for (const r of records) {
    const key = r.color
    if (!colorMap.has(key)) colorMap.set(key, [])
    colorMap.get(key)!.push(r)
  }

  for (const [color, items] of colorMap) {
    const batches = new Set(items.map((r) => r.batchName))
    const groups = new Set(items.map((r) => r.targetGroup))
    if (batches.size > 1 || groups.size > 1) {
      results.push({
        level: '警告',
        type: '颜色重复映射',
        message: `颜色「${color}」出现在 ${batches.size} 个批次、${groups.size} 个不同人群中，可能存在映射冲突`,
        recordIds: items.map((r) => r.id),
      })
    }
  }
}

function checkZeroQuantityReleasable(records: WristbandRecord[], results: CheckResult[]) {
  const items = records.filter((r) => r.quantity === 0 && r.status === '可发放')
  if (items.length > 0) {
    results.push({
      level: '严重',
      type: '数量为零可发放',
      message: `${items.length} 条记录数量为 0 但状态为「可发放」，请核实`,
      recordIds: items.map((r) => r.id),
    })
  }
}

function checkResponsibleOverload(records: WristbandRecord[], results: CheckResult[]) {
  const personMap = new Map<string, WristbandRecord[]>()
  for (const r of records) {
    if (r.priority <= 3 && r.status !== '暂缓') {
      const key = r.responsiblePerson
      if (!personMap.has(key)) personMap.set(key, [])
      personMap.get(key)!.push(r)
    }
  }

  for (const [person, items] of personMap) {
    if (items.length > 5) {
      results.push({
        level: '警告',
        type: '责任人堆积',
        message: `「${person}」负责 ${items.length} 条高优先级条目，超过 5 条阈值，建议分散`,
        recordIds: items.map((r) => r.id),
      })
    }
  }
}

function checkPriorityGaps(records: WristbandRecord[], results: CheckResult[]) {
  const priorities = [...new Set(records.map((r) => r.priority))].sort((a, b) => a - b)
  if (priorities.length <= 1) return

  const gaps: number[] = []
  for (let i = priorities[0]; i <= priorities[priorities.length - 1]; i++) {
    if (!priorities.includes(i)) {
      gaps.push(i)
    }
  }

  if (gaps.length > 0) {
    const gapIds = records
      .filter((r) => priorities.includes(r.priority))
      .map((r) => r.id)
    results.push({
      level: '提示',
      type: '优先级断档',
      message: `优先级序列存在断档，缺少：${gaps.join('、')}`,
      recordIds: gapIds,
    })
  }
}
