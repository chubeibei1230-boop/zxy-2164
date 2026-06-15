export type WristbandStatus = '待分装' | '待复核' | '可发放' | '暂缓'

export interface WristbandRecord {
  id: string
  color: string
  batchName: string
  quantity: number
  targetGroup: string
  priority: number
  notes: string
  responsiblePerson: string
  status: WristbandStatus
  createdAt: string
  updatedAt: string
}

export interface FilterState {
  color: string
  responsiblePerson: string
  status: WristbandStatus | ''
  priority: number | ''
}

export type CheckLevel = '严重' | '警告' | '提示'

export interface CheckResult {
  level: CheckLevel
  type: string
  message: string
  recordIds: string[]
}

export type ViewMode = 'table' | 'batch' | 'handover'

export type HandoverStatus = '待确认' | '已确认' | '暂缓' | '退回复核'

export interface HandoverRecord {
  recordId: string
  status: HandoverStatus
  updatedAt: string
}

export type HandoverQuickFilter = 'all' | 'pending' | 'abnormal' | 'byPerson'

export const STATUS_LIST: WristbandStatus[] = ['待分装', '待复核', '可发放', '暂缓']

export const COLOR_MAP: Record<string, string> = {
  '红色': '#ef4444',
  '蓝色': '#3b82f6',
  '绿色': '#22c55e',
  '黄色': '#eab308',
  '紫色': '#a855f7',
  '橙色': '#f97316',
  '粉色': '#ec4899',
  '白色': '#f5f5f5',
  '黑色': '#1f2937',
  '青色': '#06b6d4',
}

export const STATUS_COLOR_MAP: Record<WristbandStatus, string> = {
  '待分装': 'bg-gray-500/20 text-gray-300 border-gray-500/40',
  '待复核': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  '可发放': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  '暂缓': 'bg-rose-500/20 text-rose-300 border-rose-500/40',
}

export const CHECK_LEVEL_COLOR: Record<CheckLevel, string> = {
  '严重': 'text-red-400',
  '警告': 'text-amber-400',
  '提示': 'text-sky-400',
}

export const CHECK_LEVEL_BG: Record<CheckLevel, string> = {
  '严重': 'bg-red-500/10 border-red-500/30',
  '警告': 'bg-amber-500/10 border-amber-500/30',
  '提示': 'bg-sky-500/10 border-sky-500/30',
}

export const HANDOVER_STATUS_LIST: HandoverStatus[] = ['待确认', '已确认', '暂缓', '退回复核']

export const HANDOVER_STATUS_COLOR: Record<HandoverStatus, string> = {
  '待确认': 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  '已确认': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  '暂缓': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  '退回复核': 'bg-rose-500/20 text-rose-300 border-rose-500/40',
}
