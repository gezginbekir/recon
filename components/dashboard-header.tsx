"use client"

import { cn } from "@/lib/utils"
import {
  Shield,
  Wifi,
  Database,
  Activity,
} from "lucide-react"

interface DashboardHeaderProps {
  workspace: string
  stats: { domains: number; hosts: number; ports: number; contacts: number }
  connected: boolean
}

export function DashboardHeader({ workspace, stats, connected }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="font-mono text-sm font-bold tracking-wider text-foreground">
            RECON-NG
          </h1>
        </div>
        <div className="h-4 w-px bg-border" />
        <span className="font-mono text-xs text-muted-foreground">
          {"workspace: "}
          <span className="text-primary">{workspace}</span>
        </span>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-4">
          {[
            { label: "Domains", value: stats.domains, icon: Database },
            { label: "Hosts", value: stats.hosts, icon: Activity },
            { label: "Ports", value: stats.ports, icon: Wifi },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-1.5">
              <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono text-xs text-muted-foreground">{stat.label}</span>
              <span className="font-mono text-xs font-semibold text-foreground">{stat.value}</span>
            </div>
          ))}
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              connected ? "bg-primary" : "bg-destructive"
            )}
          />
          <span className="font-mono text-xs text-muted-foreground">
            {connected ? "Backend Connected" : "Disconnected"}
          </span>
        </div>
      </div>
    </header>
  )
}
