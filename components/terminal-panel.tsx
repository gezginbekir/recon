"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { INITIAL_TERMINAL_LINES, COMMAND_RESPONSES } from "@/lib/mock-data"
import type { TerminalLine } from "@/lib/types"
import { Terminal, Maximize2, Minimize2, Trash2 } from "lucide-react"

interface TerminalPanelProps {
  externalLines?: TerminalLine[]
}

const LINE_COLORS: Record<TerminalLine["type"], string> = {
  command: "text-foreground",
  output: "text-terminal-text",
  error: "text-terminal-error",
  success: "text-terminal-success",
  info: "text-terminal-info",
  system: "text-terminal-text",
}

let lineCounter = 100

function createLine(type: TerminalLine["type"], content: string): TerminalLine {
  lineCounter++
  return {
    id: String(lineCounter),
    type,
    content,
    timestamp: new Date(),
  }
}

export function TerminalPanel({ externalLines }: TerminalPanelProps) {
  const [lines, setLines] = useState<TerminalLine[]>(INITIAL_TERMINAL_LINES)
  const [input, setInput] = useState("")
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [expanded, setExpanded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (externalLines && externalLines.length > 0) {
      setLines((prev) => [...prev, ...externalLines])
    }
  }, [externalLines])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines])

  const handleCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim().toLowerCase()
      const newLines: TerminalLine[] = [createLine("command", `[default] > ${cmd}`)]

      if (trimmed === "clear") {
        setLines([])
        return
      }

      const response = COMMAND_RESPONSES[trimmed]
      if (response) {
        response.lines.forEach((line) => {
          newLines.push(createLine(response.type, line))
        })
      } else if (trimmed.startsWith("modules load ")) {
        const modulePath = cmd.trim().substring(13)
        newLines.push(createLine("success", `[*] Module loaded: ${modulePath}`))
        newLines.push(createLine("output", `[${modulePath}] > `))
      } else if (trimmed === "exit") {
        newLines.push(createLine("info", "Returning to base context..."))
        newLines.push(createLine("output", "[default] > "))
      } else if (trimmed.startsWith("use ")) {
        const modulePath = cmd.trim().substring(4)
        newLines.push(createLine("success", `[*] Module loaded: ${modulePath}`))
      } else if (trimmed === "run") {
        newLines.push(createLine("info", "[*] Running module..."))
        newLines.push(createLine("success", "[*] 3 total (2 new) hosts found."))
        newLines.push(createLine("output", ""))
      } else if (trimmed) {
        newLines.push(createLine("error", `[!] Invalid command: ${cmd}`))
      }

      setLines((prev) => [...prev, ...newLines])
      setCommandHistory((prev) => [cmd, ...prev])
      setHistoryIndex(-1)
    },
    []
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCommand(input)
      setInput("")
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[newIndex])
      } else {
        setHistoryIndex(-1)
        setInput("")
      }
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-terminal-bg",
        expanded ? "fixed inset-0 z-50" : "h-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="font-mono text-xs font-medium text-foreground">TERMINAL</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLines([])}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Clear terminal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={expanded ? "Minimize" : "Maximize"}
          >
            {expanded ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        className="flex-1 cursor-text overflow-y-auto p-4"
      >
        {lines.map((line) => (
          <div key={line.id} className="flex">
            <pre
              className={cn(
                "font-mono text-xs leading-relaxed whitespace-pre-wrap break-all",
                LINE_COLORS[line.type]
              )}
            >
              {line.content}
            </pre>
          </div>
        ))}

        {/* Input Line */}
        <div className="flex items-center">
          <span className="font-mono text-xs text-terminal-prompt">
            {"[default] > "}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent font-mono text-xs text-foreground caret-primary focus:outline-none"
            spellCheck={false}
            autoComplete="off"
          />
          <span className="cursor-blink font-mono text-xs text-primary">{"_"}</span>
        </div>
      </div>
    </div>
  )
}
