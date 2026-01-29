"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
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
import { fetchReport, type TestReport } from "@/lib/api/reports"
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
  AlertCircle,
  Loader2,
} from "lucide-react"


export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [report, setReport] = useState<TestReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    loadReport()
  }, [id])

  const handleDownloadPDF = async () => {
    if (!id) return

    try {
      setDownloading(true)
      const API_URL = "http://localhost:8000"
      const response = await fetch(`${API_URL}/reports/export/${decodeURIComponent(id)}/pdf`)

      if (!response.ok) {
        throw new Error("PDF generation failed")
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${id.replace('.json', '')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert("Failed to download PDF: " + (err instanceof Error ? err.message : "Unknown error"))
    } finally {
      setDownloading(false)
    }
  }

  const loadReport = async () => {
    try {
      setLoading(true)
      const data = await fetchReport(decodeURIComponent(id))
      setReport(data)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-destructive">{error || "Report not found"}</p>
        <Link href="/reports">
          <Button>Back to Reports</Button>
        </Link>
      </div>
    )
  }
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
                  {report.test_info.name}
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
                    {report.execution_info.test_id}
                  </code>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(report.execution_info.test_id)
                    }
                    className="p-1 hover:bg-muted rounded"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
                onClick={handleDownloadPDF}
                disabled={downloading}
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Time info */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Start Time</p>
              <p className="font-mono text-sm">
                {new Date(report.execution_info.started_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">End Time</p>
              <p className="font-mono text-sm">
                {new Date(report.execution_info.ended_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-mono text-sm flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {report.execution_info.duration_s.toFixed(2)}s
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
              report.metrics.max_temperature_c > 70 && "text-warning",
              report.metrics.max_temperature_c > 80 && "text-destructive"
            )}>
              {report.metrics.max_temperature_c.toFixed(1)}°C
            </p>
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
            {report.steps.map((step, index) => (
              <AccordionItem
                key={index}
                value={`step-${index}`}
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
                        step.status === "FAIL" && "bg-destructive text-destructive-foreground"
                      )}
                    >
                      {step.status === "PASS" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-foreground">{step.description}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {step.step}
                      </p>
                    </div>
                    <Badge
                      variant={step.status === "PASS" ? "default" : "destructive"}
                      className={cn(
                        step.status === "PASS" && "bg-success text-success-foreground"
                      )}
                    >
                      {step.status}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="grid lg:grid-cols-2 gap-4">
                    {/* Input Parameters */}
                    {Object.keys(step.input_params).length > 0 && (
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
                            {Object.entries(step.input_params).map(([key, value]) => (
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
                    {Object.keys(step.observed).length > 0 && (
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
                                <TableCell className="py-2 font-mono text-xs">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  {/* Failure Details */}
                  {step.failure_details && (
                    <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-destructive">Failure Details</p>
                          <p className="text-sm text-destructive/80 mt-1">
                            {JSON.stringify(step.failure_details)}
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

      {/* Section 4: Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Test Metrics</CardTitle>
          <CardDescription>Performance metrics captured during execution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Max Temperature</p>
              <p className="text-xl font-semibold">{report.metrics.max_temperature_c.toFixed(2)}°C</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Avg Speed</p>
              <p className="text-xl font-semibold">{report.metrics.avg_speed_rpm.toFixed(2)} RPM</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Duration</p>
              <p className="text-xl font-semibold">{report.metrics.test_duration_s.toFixed(2)}s</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
