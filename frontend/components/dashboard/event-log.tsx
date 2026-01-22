"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { EventLog } from "@/lib/mock-data"
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react"

interface EventLogPanelProps {
  events: EventLog[]
  className?: string
}

const eventIcons = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle2,
}

const eventColors = {
  info: "text-chart-1",
  warning: "text-warning",
  error: "text-destructive",
  success: "text-success",
}

export function EventLogPanel({ events, className }: EventLogPanelProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Event Log
          <span className="text-xs font-normal text-muted-foreground">
            ({events.length} events)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <ScrollArea className="h-[200px] lg:h-[300px]">
          <div className="space-y-2">
            {events.map((event) => {
              const Icon = eventIcons[event.type]
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-sm"
                >
                  <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", eventColors[event.type])} />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground">{event.message}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {event.timestamp.toLocaleTimeString("en-US", {
                        hour12: false,
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
