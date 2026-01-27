"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MotorSchematic } from "@/components/dashboard/motor-schematic"
import { TelemetryCharts } from "@/components/dashboard/telemetry-charts"
import { EventLogPanel } from "@/components/dashboard/event-log"
import {
  mockEventLogs,
  type MotorStatus,
  type TelemetryData,
} from "@/lib/mock-data"
import { Activity, Gauge, Thermometer, Zap } from "lucide-react"

export default function DashboardPage() {
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([])
  const [motorStatus, setMotorStatus] = useState<MotorStatus>("running")
  const [isLoading, setIsLoading] = useState(true)

  // Poll backend for real-time data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:8000/motor/status")
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()

        const newPoint: TelemetryData = {
          timestamp: Date.now(),
          rpm: data.speed_rpm,
          temperature: data.temperature_c,
          torque: data.torque_nm,
          voltage: 380, // Static for now as backend doesn't simulate it
        }

        setTelemetryData((prev) => {
          const current = [...prev, newPoint]
          if (current.length > 30) {
            return current.slice(current.length - 30)
          }
          return current
        })

        // Update Status
        if (data.fault) setMotorStatus("fault")
        else if (data.running) setMotorStatus("running")
        else setMotorStatus("idle")

        setIsLoading(false)
      } catch (err) {
        console.error("Polling error:", err)
        // Keep loading false so UI doesn't freeze stuck on loading
        setIsLoading(false)
      }
    }

    // Initial fetch
    fetchData()

    // Poll every 500ms
    const interval = setInterval(fetchData, 500)
    return () => clearInterval(interval)
  }, [])

  const latestData = telemetryData[telemetryData.length - 1]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading telemetry data...</div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time motor telemetry and system status
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" />
              Speed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-mono font-semibold">
              {latestData?.rpm.toFixed(0) ?? "—"}
              <span className="text-sm font-normal text-muted-foreground ml-1">RPM</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5" />
              Temperature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-mono font-semibold">
              {latestData?.temperature.toFixed(1) ?? "—"}
              <span className="text-sm font-normal text-muted-foreground ml-1">°C</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Torque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-mono font-semibold">
              {latestData?.torque.toFixed(1) ?? "—"}
              <span className="text-sm font-normal text-muted-foreground ml-1">Nm</span>
            </p>
          </CardContent>
        </Card>


      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-[380px_1fr] gap-4 lg:gap-6">
        {/* Left: Motor Visualization */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Motor Status</CardTitle>
            </CardHeader>
            <CardContent>
              <MotorSchematic
                status={motorStatus}
                rpm={latestData?.rpm ?? 0}
                temperature={latestData?.temperature ?? 0}
              />
              {/* Emergency Stop Control */}
              <div className="mt-4 flex gap-2 justify-center">
                <Button
                  variant={motorStatus === "idle" ? "secondary" : "destructive"}
                  disabled={motorStatus === "idle"}
                  className={cn(
                    "w-full font-bold transition-all",
                    motorStatus === "idle" ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground" : "hover:bg-destructive/90"
                  )}
                  onClick={async () => {
                    try {
                      await fetch("http://localhost:8000/motor/stop", { method: "POST" })
                    } catch (e) {
                      console.error("Stop failed", e)
                    }
                  }}
                >
                  EMERGENCY STOP
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Event Log */}
          <EventLogPanel events={mockEventLogs} />
        </div>

        {/* Right: Telemetry Charts */}
        <div>
          <TelemetryCharts data={telemetryData} />
        </div>
      </div>
    </div>
  )
}
