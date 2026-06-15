import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { COLOR_MAP } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getColorValue(name: string): string {
  if (!name) return "#71717a"
  if (COLOR_MAP[name]) return COLOR_MAP[name]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = hash % 360
  return `hsl(${h}, 65%, 55%)`
}
