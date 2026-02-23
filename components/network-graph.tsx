"use client"

import { useCallback, useMemo, useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { MOCK_DOMAINS, MOCK_EDGES } from "@/lib/mock-data"
import type { DomainNode } from "@/lib/types"
import { ZoomIn, ZoomOut, Maximize, Target } from "lucide-react"

interface Point {
  x: number
  y: number
  vx: number
  vy: number
}

interface GraphNode extends DomainNode {
  x: number
  y: number
  vx: number
  vy: number
}

const NODE_COLORS: Record<DomainNode["type"], { fill: string; stroke: string; text: string }> = {
  domain: { fill: "#00e68a20", stroke: "#00e68a", text: "#00e68a" },
  host: { fill: "#3b82f620", stroke: "#3b82f6", text: "#3b82f6" },
  ip: { fill: "#f59e0b20", stroke: "#f59e0b", text: "#f59e0b" },
  netblock: { fill: "#8b5cf620", stroke: "#8b5cf6", text: "#8b5cf6" },
}

const NODE_RADII: Record<DomainNode["type"], number> = {
  domain: 32,
  host: 24,
  ip: 20,
  netblock: 28,
}

export function NetworkGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const nodesRef = useRef<GraphNode[]>([])
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const dragNode = useRef<GraphNode | null>(null)
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })

  // Initialize node positions in a radial layout
  const initNodes = useCallback(() => {
    const centerX = 400
    const centerY = 300
    const types = ["domain", "host", "ip", "netblock"] as const
    const typeGroups: Record<string, typeof MOCK_DOMAINS> = {}

    MOCK_DOMAINS.forEach((node) => {
      if (!typeGroups[node.type]) typeGroups[node.type] = []
      typeGroups[node.type].push(node)
    })

    const nodes: GraphNode[] = []
    let ringIndex = 0

    types.forEach((type) => {
      const group = typeGroups[type] || []
      const radius = 80 + ringIndex * 120
      group.forEach((node, i) => {
        const angle = (2 * Math.PI * i) / group.length - Math.PI / 2
        nodes.push({
          ...node,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          vx: 0,
          vy: 0,
        })
      })
      ringIndex++
    })

    nodesRef.current = nodes
  }, [])

  // Simple force-directed simulation
  const simulate = useCallback(() => {
    const nodes = nodesRef.current
    const alpha = 0.02

    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x
        const dy = nodes[j].y - nodes[i].y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = (300 / (dist * dist)) * alpha
        const fx = dx / dist * force * 100
        const fy = dy / dist * force * 100
        nodes[i].vx -= fx
        nodes[i].vy -= fy
        nodes[j].vx += fx
        nodes[j].vy += fy
      }
    }

    // Attraction along edges
    MOCK_EDGES.forEach((edge) => {
      const source = nodes.find((n) => n.id === edge.source)
      const target = nodes.find((n) => n.id === edge.target)
      if (source && target) {
        const dx = target.x - source.x
        const dy = target.y - source.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = (dist - 150) * alpha * 0.05
        const fx = dx / dist * force
        const fy = dy / dist * force
        source.vx += fx
        source.vy += fy
        target.vx -= fx
        target.vy -= fy
      }
    })

    // Apply velocities with damping
    nodes.forEach((node) => {
      if (dragNode.current && node.id === dragNode.current.id) return
      node.vx *= 0.9
      node.vy *= 0.9
      node.x += node.vx
      node.y += node.vy
    })
  }, [])

  // Draw on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    ctx.clearRect(0, 0, rect.width, rect.height)
    ctx.save()
    ctx.translate(offset.x + rect.width / 2, offset.y + rect.height / 2)
    ctx.scale(zoom, zoom)
    ctx.translate(-rect.width / 2, -rect.height / 2)

    const nodes = nodesRef.current

    // Draw edges
    MOCK_EDGES.forEach((edge) => {
      const source = nodes.find((n) => n.id === edge.source)
      const target = nodes.find((n) => n.id === edge.target)
      if (source && target) {
        ctx.beginPath()
        ctx.moveTo(source.x, source.y)
        ctx.lineTo(target.x, target.y)
        ctx.strokeStyle = "rgba(0, 230, 138, 0.12)"
        ctx.lineWidth = 1
        ctx.stroke()

        // Edge label
        if (edge.label) {
          const mx = (source.x + target.x) / 2
          const my = (source.y + target.y) / 2
          ctx.fillStyle = "rgba(0, 230, 138, 0.3)"
          ctx.font = "9px monospace"
          ctx.textAlign = "center"
          ctx.fillText(edge.label, mx, my - 4)
        }
      }
    })

    // Draw nodes
    nodes.forEach((node) => {
      const colors = NODE_COLORS[node.type]
      const radius = NODE_RADII[node.type]
      const isHovered = hoveredNode?.id === node.id
      const isSelected = selectedNode?.id === node.id

      // Glow effect for hovered/selected
      if (isHovered || isSelected) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius + 8, 0, 2 * Math.PI)
        ctx.fillStyle = colors.stroke + "15"
        ctx.fill()
      }

      // Node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = colors.fill
      ctx.fill()
      ctx.strokeStyle = isSelected ? "#ffffff" : colors.stroke
      ctx.lineWidth = isHovered ? 2 : 1
      ctx.stroke()

      // Node label
      ctx.fillStyle = colors.text
      ctx.font = `${isHovered ? "bold " : ""}10px monospace`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      // Truncate label if needed
      const maxWidth = radius * 2 - 8
      let label = node.label
      while (ctx.measureText(label).width > maxWidth && label.length > 3) {
        label = label.slice(0, -4) + "..."
      }
      ctx.fillText(label, node.x, node.y)

      // Type badge below
      ctx.fillStyle = colors.stroke + "80"
      ctx.font = "8px monospace"
      ctx.fillText(node.type.toUpperCase(), node.x, node.y + radius + 12)
    })

    ctx.restore()
  }, [zoom, offset, hoveredNode, selectedNode])

  // Animation loop
  useEffect(() => {
    initNodes()
    let iteration = 0
    const maxIterations = 200

    const tick = () => {
      if (iteration < maxIterations) {
        simulate()
        iteration++
      }
      draw()
      animRef.current = requestAnimationFrame(tick)
    }

    tick()
    return () => cancelAnimationFrame(animRef.current)
  }, [initNodes, simulate, draw])

  // Mouse interactions
  const getNodeAt = useCallback(
    (clientX: number, clientY: number): GraphNode | null => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()

      const cx = clientX - rect.left
      const cy = clientY - rect.top

      // Transform to graph coordinates
      const gx = (cx - offset.x - rect.width / 2) / zoom + rect.width / 2
      const gy = (cy - offset.y - rect.height / 2) / zoom + rect.height / 2

      for (const node of nodesRef.current) {
        const radius = NODE_RADII[node.type]
        const dx = gx - node.x
        const dy = gy - node.y
        if (dx * dx + dy * dy < radius * radius) {
          return node
        }
      }
      return null
    },
    [zoom, offset]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const node = getNodeAt(e.clientX, e.clientY)
      if (node) {
        dragNode.current = node
        isDragging.current = true
        dragStart.current = { x: e.clientX, y: e.clientY }
      } else {
        isPanning.current = true
        panStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }
      }
    },
    [getNodeAt, offset]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging.current && dragNode.current) {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        dragNode.current.x =
          (e.clientX - rect.left - offset.x - rect.width / 2) / zoom + rect.width / 2
        dragNode.current.y =
          (e.clientY - rect.top - offset.y - rect.height / 2) / zoom + rect.height / 2
        dragNode.current.vx = 0
        dragNode.current.vy = 0
      } else if (isPanning.current) {
        setOffset({
          x: e.clientX - panStart.current.x,
          y: e.clientY - panStart.current.y,
        })
      } else {
        const node = getNodeAt(e.clientX, e.clientY)
        setHoveredNode(node)
      }
    },
    [getNodeAt, zoom, offset]
  )

  const handleMouseUp = useCallback(() => {
    if (isDragging.current && dragNode.current) {
      setSelectedNode(dragNode.current)
    }
    isDragging.current = false
    dragNode.current = null
    isPanning.current = false
  }, [])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const node = getNodeAt(e.clientX, e.clientY)
      setSelectedNode(node)
    },
    [getNodeAt]
  )

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setZoom((z) => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001)))
  }, [])

  const resetView = useCallback(() => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  const legend = useMemo(
    () => [
      { type: "domain" as const, label: "Domain", color: NODE_COLORS.domain.stroke },
      { type: "host" as const, label: "Host", color: NODE_COLORS.host.stroke },
      { type: "ip" as const, label: "IP Address", color: NODE_COLORS.ip.stroke },
      { type: "netblock" as const, label: "Netblock", color: NODE_COLORS.netblock.stroke },
    ],
    []
  )

  return (
    <div ref={containerRef} className="flex h-full flex-col bg-terminal-bg">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="font-mono text-xs font-medium text-foreground">NETWORK MAP</span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {MOCK_DOMAINS.length} nodes / {MOCK_EDGES.length} edges
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={resetView}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Reset view"
          >
            <Maximize className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          className="h-full w-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
          onWheel={handleWheel}
        />

        {/* Legend */}
        <div className="absolute bottom-3 left-3 rounded-md border bg-card/90 px-3 py-2 backdrop-blur-sm">
          <div className="flex flex-col gap-1.5">
            {legend.map((item) => (
              <div key={item.type} className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-mono text-[10px] text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Node detail tooltip */}
        {selectedNode && (
          <div className="absolute right-3 top-3 w-56 rounded-md border bg-card/95 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: NODE_COLORS[selectedNode.type].stroke }}
              />
              <span className="font-mono text-xs font-medium text-foreground">
                {selectedNode.label}
              </span>
            </div>
            <div className="mt-2 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">Type</span>
                <span className="font-mono text-[10px] text-foreground">
                  {selectedNode.type.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">Connections</span>
                <span className="font-mono text-[10px] text-foreground">
                  {
                    MOCK_EDGES.filter(
                      (e) => e.source === selectedNode.id || e.target === selectedNode.id
                    ).length
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">ID</span>
                <span className="font-mono text-[10px] text-foreground">{selectedNode.id}</span>
              </div>
            </div>
          </div>
        )}

        {/* Zoom indicator */}
        <div className="absolute bottom-3 right-3 rounded-md border bg-card/90 px-2 py-1 backdrop-blur-sm">
          <span className="font-mono text-[10px] text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>
    </div>
  )
}
