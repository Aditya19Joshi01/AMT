"use client"

import { cn } from "@/lib/utils"
import type { MotorStatus } from "@/lib/types"

interface MotorSchematicProps {
  status: MotorStatus
  rpm: number
  temperature: number
  className?: string
}

export function MotorSchematic({ status, rpm, temperature, className }: MotorSchematicProps) {
  const statusColors = {
    idle: "text-muted-foreground",
    running: "text-success",
    fault: "text-destructive",
  }

  const statusLabels = {
    idle: "IDLE",
    running: "RUNNING",
    fault: "FAULT",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center p-6", className)}>
      {/* Motor SVG Schematic */}
      <svg
        viewBox="0 0 200 160"
        className="w-full max-w-[280px] h-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Motor Housing */}
        <rect
          x="30"
          y="40"
          width="100"
          height="80"
          rx="4"
          className="fill-muted stroke-border"
          strokeWidth="2"
        />

        {/* Cooling Fins */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect
            key={i}
            x="30"
            y={48 + i * 12}
            width="100"
            height="2"
            className="fill-border"
          />
        ))}

        {/* Motor End Bell */}
        <ellipse
          cx="130"
          cy="80"
          rx="8"
          ry="30"
          className="fill-secondary stroke-border"
          strokeWidth="2"
        />

        {/* Shaft */}
        <rect
          x="138"
          y="75"
          width="50"
          height="10"
          className="fill-muted-foreground"
        />

        {/* Shaft bearing */}
        <circle
          cx="138"
          cy="80"
          r="8"
          className="fill-secondary stroke-border"
          strokeWidth="2"
        />

        {/* Terminal Box */}
        <rect
          x="55"
          y="25"
          width="30"
          height="15"
          rx="2"
          className="fill-secondary stroke-border"
          strokeWidth="1.5"
        />

        {/* Terminal connectors */}
        <circle cx="62" cy="32" r="3" className="fill-muted-foreground" />
        <circle cx="70" cy="32" r="3" className="fill-muted-foreground" />
        <circle cx="78" cy="32" r="3" className="fill-muted-foreground" />

        {/* Mounting feet */}
        <rect x="35" y="120" width="20" height="8" rx="1" className="fill-muted-foreground" />
        <rect x="105" y="120" width="20" height="8" rx="1" className="fill-muted-foreground" />

        {/* Status indicator light */}
        <circle
          cx="45"
          cy="55"
          r="6"
          className={cn(
            "transition-colors duration-300",
            status === "running" && "fill-success animate-pulse",
            status === "idle" && "fill-muted-foreground",
            status === "fault" && "fill-destructive animate-pulse"
          )}
        />

        {/* Rotation indicator (only when running) */}
        {status === "running" && (
          <g className="origin-center animate-spin" style={{ transformOrigin: "163px 80px", animationDuration: "2s" }}>
            <path
              d="M163 70 L168 80 L163 90 L158 80 Z"
              className="fill-primary"
            />
          </g>
        )}
      </svg>

      {/* Status Badge */}
      <div className="mt-4 flex items-center gap-2">
        <div
          className={cn(
            "w-3 h-3 rounded-full",
            status === "running" && "bg-success animate-pulse",
            status === "idle" && "bg-muted-foreground",
            status === "fault" && "bg-destructive animate-pulse"
          )}
        />
        <span className={cn("font-mono text-sm font-semibold", statusColors[status])}>
          {statusLabels[status]}
        </span>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-center w-full max-w-[200px]">
        <div>
          <p className="text-xs text-muted-foreground">Speed</p>
          <p className="font-mono text-lg font-semibold">{rpm.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">RPM</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Temp</p>
          <p className={cn(
            "font-mono text-lg font-semibold",
            temperature > 70 && "text-warning",
            temperature > 80 && "text-destructive"
          )}>
            {temperature.toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground">°C</p>
        </div>
      </div>
    </div>
  )
}
