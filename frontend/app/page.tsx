"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MotorSchematic } from "@/components/dashboard/motor-schematic"
import { TelemetryCharts } from "@/components/dashboard/telemetry-charts"
import { EventLogPanel } from "@/components/dashboard/event-log"
import {
  generateTelemetryData,
  mockEventLogs,
  type MotorStatus,
  type TelemetryData,
} from "@/lib/mock-data"
import { Activity, Gauge, Thermometer, Zap } from "lucide-react"

export default function DashboardPage() {
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([])
  const [motorStatus, setMotorStatus] = useState<MotorStatus>("running")
  const [isLoading, setIsLoading] = useState(true)

  // Simulate real-time data updates
  useEffect(() => {
    // Initial data
    setTelemetryData(generateTelemetryData(30))
    setIsLoading(false)

    // Update data every second
    const interval = setInterval(() => {
      setTelemetryData((prev) => {
        const newPoint: TelemetryData = {
          timestamp: Date.now(),
          rpm: 1500 + Math.sin(Date.now() * 0.001) * 200 + Math.random() * 50,
          temperature: 45 + Math.sin(Date.now() * 0.0005) * 10 + Math.random() * 5,
          torque: 25 + Math.sin(Date.now() * 0.0008) * 8 + Math.random() * 3,
          current: 12 + Math.sin(Date.now() * 0.0007) * 3 + Math.random() * 1,
          voltage: 380 + Math.random() * 5,
        }
        return [...prev.slice(-29), newPoint]
      })
    }, 1000)

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Current
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-mono font-semibold">
              {latestData?.current.toFixed(1) ?? "—"}
              <span className="text-sm font-normal text-muted-foreground ml-1">A</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-[320px_1fr] gap-4 lg:gap-6">
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
              {/* Status Toggle for Demo */}
              <div className="mt-4 flex gap-2 justify-center">
                {(["idle", "running", "fault"] as MotorStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setMotorStatus(s)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      motorStatus === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
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
