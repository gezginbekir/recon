export interface ReconModule {
  path: string
  name: string
  author: string
  version: string
  description: string
  required_keys?: string[]
  options?: ModuleOption[]
}

export interface ModuleOption {
  name: string
  value: string | number | boolean | null
  required: boolean
  description: string
}

export interface TableRecord {
  name: string
  count: number
}

export interface DashboardData {
  workspace: string
  records: TableRecord[]
  activity: { module: string; runs: number }[]
}

export interface TerminalLine {
  id: string
  type: "command" | "output" | "error" | "success" | "info" | "system"
  content: string
  timestamp: Date
}

export interface DomainNode {
  id: string
  label: string
  type: "domain" | "host" | "ip" | "netblock"
  data?: Record<string, unknown>
}

export interface DomainEdge {
  source: string
  target: string
  label?: string
}

export type ModuleCategory = "recon" | "discovery" | "import" | "reporting" | "exploitation"

export interface TableData {
  workspace: string
  table: string
  columns: string[]
  rows: Record<string, unknown>[]
}
