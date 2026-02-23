"use client"

import { TABLE_SUMMARY } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export function StatsBar() {
  const total = TABLE_SUMMARY.reduce((acc, t) => acc + t.count, 0)

  return (
    <div className="flex items-center gap-4 border-t bg-card px-4 py-1.5">
      <span className="font-mono text-[10px] text-muted-foreground">
        {"Records: "}
        <span className="text-foreground">{total}</span>
      </span>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center gap-3">
        {TABLE_SUMMARY.filter((t) => t.count > 0)
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
          .map((table) => (
            <span key={table.name} className="font-mono text-[10px] text-muted-foreground">
              {table.name}:{" "}
              <span className="text-foreground">{table.count}</span>
            </span>
          ))}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="font-mono text-[10px] text-muted-foreground">
          Ready
        </span>
      </div>
    </div>
  )
}
