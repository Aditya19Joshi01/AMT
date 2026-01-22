"use client"

import { use } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { mockReports, type TestReport } from "@/lib/mock-data"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Copy,
  Thermometer,
  Gauge,
  Activity,
  AlertCircle,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const report = mockReports.find((r) => r.execution_info.execution_id === id)

  if (!report) {
    notFound()
  }

  const temperatureData = report.metrics.temperature.values.map((value, index) => ({
    time: new Date(report.metrics.temperature.timestamps[index]).toLocaleTimeString("en-US", {
      hour12: false,
      minute: "2-digit",
      second: "2-digit",
    }),
    value,
  }))

  const speedData = report.metrics.speed.values.map((value, index) => ({
    time: new Date(report.metrics.speed.timestamps[index]).toLocaleTimeString("en-US", {
      hour12: false,
      minute: "2-digit",
      second: "2-digit",
    }),
    value,
  }))

  const maxTemp = Math.max(...report.metrics.temperature.values)
  const avgSpeed = Math.round(
    report.metrics.speed.values.reduce((a, b) => a + b, 0) / report.metrics.speed.values.length
  )

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* Back Navigation */}
      <Link
        href="/reports"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Reports
      </Link>

      {/* Section 1: Test Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">
                  {report.test_info.test_name}
                </h1>
                <Badge
                  variant={report.summary.overall_result === "PASS" ? "default" : "destructive"}
                  className={cn(
                    "text-sm",
                    report.summary.overall_result === "PASS" &&
                      "bg-success text-success-foreground"
                  )}
                >
                  {report.summary.overall_result === "PASS" ? (
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-1" />
                  )}
                  {report.summary.overall_result}
                </Badge>
              </div>
              <p className="text-muted-foreground">{report.test_info.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <Badge variant="secondary">{report.execution_info.environment}</Badge>
                <div className="flex items-center gap-1 text-muted-foreground font-mono">
                  <span>ID:</span>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                    {report.execution_info.execution_id}
                  </code>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(report.execution_info.execution_id)
                    }
                    className="p-1 hover:bg-muted rounded"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <FileJson className="w-4 h-4" />
                Export JSON
              </Button>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <FileText className="w-4 h-4" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel
              </Button>
            </div>
          </div>

          {/* Time info */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Start Time</p>
              <p className="font-mono text-sm">
                {new Date(report.execution_info.start_time).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">End Time</p>
              <p className="font-mono text-sm">
                {new Date(report.execution_info.end_time).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-mono text-sm flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {report.execution_info.duration_seconds}s
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className={cn(
          "col-span-2",
          report.summary.overall_result === "PASS" ? "border-success/50" : "border-destructive/50"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Overall Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold flex items-center gap-2",
              report.summary.overall_result === "PASS" ? "text-success" : "text-destructive"
            )}>
              {report.summary.overall_result === "PASS" ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
              {report.summary.overall_result}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Passed Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-success">
              {report.summary.passed_steps}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Failed Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-2xl font-semibold",
              report.summary.failed_steps > 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {report.summary.failed_steps}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Thermometer className="w-3 h-3" />
              Max Temp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-2xl font-semibold",
              maxTemp > 70 && "text-warning",
              maxTemp > 80 && "text-destructive"
            )}>
              {maxTemp}°C
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Gauge className="w-3 h-3" />
              Avg Speed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{avgSpeed} RPM</p>
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Step Execution Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Step Execution Timeline</CardTitle>
          <CardDescription>
            Detailed execution results for each test step
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-2">
            {report.steps.map((step) => (
              <AccordionItem
                key={step.step_number}
                value={`step-${step.step_number}`}
                className={cn(
                  "border rounded-lg px-4",
                  step.status === "PASS" && "border-success/30 bg-success/5",
                  step.status === "FAIL" && "border-destructive/30 bg-destructive/5"
                )}
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                        step.status === "PASS" && "bg-success text-success-foreground",
                        step.status === "FAIL" && "bg-destructive text-destructive-foreground",
                        step.status === "SKIPPED" && "bg-muted text-muted-foreground"
                      )}
                    >
                      {step.status === "PASS" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : step.status === "FAIL" ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        step.step_number
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-foreground">{step.description}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {step.step_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <Badge
                        variant={step.status === "PASS" ? "default" : "destructive"}
                        className={cn(
                          step.status === "PASS" && "bg-success text-success-foreground"
                        )}
                      >
                        {step.status}
                      </Badge>
                      <span className="text-muted-foreground font-mono">
                        {step.duration_ms}ms
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="grid lg:grid-cols-2 gap-4">
                    {/* Input Parameters */}
                    {Object.keys(step.inputs).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Input Parameters</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="h-8">Parameter</TableHead>
                              <TableHead className="h-8">Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(step.inputs).map(([key, value]) => (
                              <TableRow key={key}>
                                <TableCell className="py-2 font-mono text-xs">{key}</TableCell>
                                <TableCell className="py-2 font-mono text-xs">{String(value)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Observed Values */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Observed Values</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="h-8">Metric</TableHead>
                            <TableHead className="h-8">Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(step.observed).map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell className="py-2 font-mono text-xs">{key}</TableCell>
                              <TableCell
                                className={cn(
                                  "py-2 font-mono text-xs",
                                  (key === "max" || key === "min") && "font-semibold"
                                )}
                              >
                                {String(value)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Failure Details */}
                  {step.failure_details && (
                    <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-destructive">Failure Details</p>
                          <p className="text-sm text-destructive/80 mt-1">
                            {step.failure_details}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Section 4: Metrics & Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Thermometer className="w-4 h-4" />
              Temperature Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={temperatureData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 10 }}
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
                    formatter={(value) => [`${value}°C`, "Temperature"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Speed Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={speedData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 10 }}
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
                    formatter={(value) => [`${value} RPM`, "Speed"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Artifacts */}
      {report.artifacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Artifacts</CardTitle>
            <CardDescription>Files generated during test execution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {report.artifacts.map((artifact) => (
                <Button key={artifact} variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Download className="w-4 h-4" />
                  {artifact}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
