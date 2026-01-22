"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { mockReports } from "@/lib/mock-data"
import { CheckCircle2, XCircle, Clock, ChevronRight, FileText } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Test Reports</h1>
        <p className="text-sm text-muted-foreground">
          View and export test execution reports
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{mockReports.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Passed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-success">
              {mockReports.filter((r) => r.summary.overall_result === "PASS").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-destructive">
              {mockReports.filter((r) => r.summary.overall_result === "FAIL").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pass Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {Math.round(
                (mockReports.filter((r) => r.summary.overall_result === "PASS").length /
                  mockReports.length) *
                  100
              )}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Test Reports</CardTitle>
          <CardDescription>
            Click a report to view detailed results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Environment</TableHead>
                <TableHead className="hidden md:table-cell">Duration</TableHead>
                <TableHead className="hidden lg:table-cell">Steps</TableHead>
                <TableHead>Executed</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockReports.map((report) => (
                <TableRow key={report.execution_info.execution_id} className="group">
                  <TableCell>
                    <div>
                      <p className="font-medium">{report.test_info.test_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {report.execution_info.execution_id}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={report.summary.overall_result === "PASS" ? "default" : "destructive"}
                      className={cn(
                        "gap-1",
                        report.summary.overall_result === "PASS" &&
                          "bg-success text-success-foreground"
                      )}
                    >
                      {report.summary.overall_result === "PASS" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {report.summary.overall_result}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary">{report.execution_info.environment}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {report.execution_info.duration_seconds}s
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm">
                      <span className="text-success">{report.summary.passed_steps}</span>
                      {" / "}
                      <span>{report.summary.total_steps}</span>
                      {report.summary.failed_steps > 0 && (
                        <span className="text-destructive ml-1">
                          ({report.summary.failed_steps} failed)
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDateTime(report.execution_info.start_time)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link href={`/reports/${report.execution_info.execution_id}`}>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {mockReports.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No test reports available</p>
              <p className="text-sm">Run a test to generate reports</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}
