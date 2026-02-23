"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { RECON_MODULES, TABLE_SUMMARY } from "@/lib/mock-data"
import {
  Search,
  ChevronDown,
  ChevronRight,
  Play,
  Globe,
  Radar,
  FileInput,
  FileText,
  Database,
} from "lucide-react"

const CATEGORY_ICONS: Record<string, typeof Globe> = {
  recon: Radar,
  discovery: Search,
  import: FileInput,
  reporting: FileText,
}

interface ModuleSidebarProps {
  onRunModule: (modulePath: string) => void
  onSelectTable: (tableName: string) => void
  selectedTable: string | null
}

export function ModuleSidebar({ onRunModule, onSelectTable, selectedTable }: ModuleSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["recon"]))
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"modules" | "tables">("modules")

  const toggleCategory = (category: string) => {
    const next = new Set(expandedCategories)
    if (next.has(category)) {
      next.delete(category)
    } else {
      next.add(category)
    }
    setExpandedCategories(next)
  }

  const filteredModules = RECON_MODULES.map((cat) => ({
    ...cat,
    modules: cat.modules.filter(
      (m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.path.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.modules.length > 0)

  return (
    <aside className="flex h-full w-72 flex-col border-r bg-card">
      {/* Tab Switcher */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("modules")}
          className={cn(
            "flex-1 py-2.5 font-mono text-xs font-medium transition-colors",
            activeTab === "modules"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          MODULES
        </button>
        <button
          onClick={() => setActiveTab("tables")}
          className={cn(
            "flex-1 py-2.5 font-mono text-xs font-medium transition-colors",
            activeTab === "tables"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          TABLES
        </button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder={activeTab === "modules" ? "Search modules..." : "Search tables..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-1 pb-3">
        {activeTab === "modules" ? (
          <div className="flex flex-col gap-0.5">
            {filteredModules.map((category) => {
              const Icon = CATEGORY_ICONS[category.category] || Globe
              const isExpanded = expandedCategories.has(category.category)

              return (
                <div key={category.category}>
                  <button
                    onClick={() => toggleCategory(category.category)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    <span className="font-mono text-xs font-medium uppercase text-foreground">
                      {category.category}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                      {category.modules.length}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="ml-4 flex flex-col gap-px pb-1 pl-3 pt-0.5">
                      {category.modules.map((mod) => (
                        <div
                          key={mod.path}
                          className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-mono text-xs text-foreground">
                              {mod.name}
                            </p>
                            <p className="truncate font-mono text-[10px] text-muted-foreground">
                              {mod.path}
                            </p>
                          </div>
                          <button
                            onClick={() => onRunModule(mod.path)}
                            className="hidden shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground group-hover:block"
                            title="Run module"
                          >
                            <Play className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {TABLE_SUMMARY.filter((t) =>
              t.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((table) => (
              <button
                key={table.name}
                onClick={() => onSelectTable(table.name)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-left transition-colors",
                  selectedTable === table.name
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                )}
              >
                <Database className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="flex-1 font-mono text-xs text-foreground">
                  {table.name}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-mono text-[10px] font-medium",
                    table.count > 0
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {table.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
