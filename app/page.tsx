"use client"

import { useState, useCallback } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { ModuleSidebar } from "@/components/module-sidebar"
import { TerminalPanel } from "@/components/terminal-panel"
import { NetworkGraph } from "@/components/network-graph"
import { StatsBar } from "@/components/stats-bar"
import type { TerminalLine } from "@/lib/types"

let lineId = 500

function createTerminalLine(
  type: TerminalLine["type"],
  content: string
): TerminalLine {
  lineId++
  return {
    id: String(lineId),
    type,
    content,
    timestamp: new Date(),
  }
}

export default function DashboardPage() {
  const [externalLines, setExternalLines] = useState<TerminalLine[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [backendConnected] = useState(false)

  const handleRunModule = useCallback((modulePath: string) => {
    const lines: TerminalLine[] = [
      createTerminalLine("command", `[default] > use ${modulePath}`),
      createTerminalLine("success", `[*] Module loaded: ${modulePath}`),
      createTerminalLine("command", `[${modulePath}] > run`),
      createTerminalLine("info", "[*] Running module..."),
    ]

    // Simulate async module output
    setExternalLines(lines)

    setTimeout(() => {
      const resultLines: TerminalLine[] = [
        createTerminalLine("output", "[*] Querying target..."),
        createTerminalLine("success", "[*] 3 total (2 new) hosts found."),
        createTerminalLine("output", ""),
        createTerminalLine("output", `[default] > `),
      ]
      setExternalLines((prev) => [...prev, ...resultLines])
    }, 1200)
  }, [])

  const handleSelectTable = useCallback((tableName: string) => {
    setSelectedTable(tableName)
    const lines: TerminalLine[] = [
      createTerminalLine("command", `[default] > db query SELECT * FROM ${tableName} LIMIT 10`),
      createTerminalLine("info", `[*] Querying table: ${tableName}`),
      createTerminalLine("output", `[*] Results from '${tableName}':`),
      createTerminalLine("output", ""),
    ]
    setExternalLines(lines)
  }, [])

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top Header */}
      <DashboardHeader
        workspace="default"
        stats={{ domains: 3, hosts: 7, ports: 24, contacts: 12 }}
        connected={backendConnected}
      />

      {/* Main Content Area: Sidebar | Terminal | Network Graph */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Module Sidebar */}
        <ModuleSidebar
          onRunModule={handleRunModule}
          onSelectTable={handleSelectTable}
          selectedTable={selectedTable}
        />

        {/* Center: Terminal Panel */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            <div className="w-1/2 min-w-0 overflow-hidden border-r">
              <TerminalPanel externalLines={externalLines} />
            </div>

            {/* Right: Network Graph */}
            <div className="w-1/2 min-w-0 overflow-hidden">
              <NetworkGraph />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <StatsBar />
    </div>
  )
}
