"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TelemetryData } from "@/lib/types"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface TelemetryChartsProps {
  data: TelemetryData[]
}

export function TelemetryCharts({ data }: TelemetryChartsProps) {
  const formattedData = data.map((d) => ({
    ...d,
    time: new Date(d.timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      minute: "2-digit",
      second: "2-digit",
    }),
  }))

  const latestData = data[data.length - 1]

  return (
    <div className="grid gap-4">
      {/* RPM Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Speed (RPM)</CardTitle>
            <span className="font-mono text-lg font-semibold text-chart-1">
              {latestData?.rpm.toFixed(0) ?? "—"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Line
                  type="monotone"
                  dataKey="rpm"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Temperature Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Temperature (°C)</CardTitle>
            <span className="font-mono text-lg font-semibold text-chart-3">
              {latestData?.temperature.toFixed(1) ?? "—"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="var(--chart-3)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Torque Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Torque (Nm)</CardTitle>
            <span className="font-mono text-lg font-semibold text-chart-2">
              {latestData?.torque.toFixed(1) ?? "—"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Line
                  type="monotone"
                  dataKey="torque"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
