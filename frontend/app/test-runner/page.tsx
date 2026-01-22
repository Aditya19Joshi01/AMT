"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { mockTests, type TestDefinition, type TestExecution } from "@/lib/mock-data"
import {
  Play,
  Square,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Loader2,
} from "lucide-react"

export default function TestRunnerPage() {
  const [selectedTest, setSelectedTest] = useState<TestDefinition | null>(null)
  const [execution, setExecution] = useState<TestExecution | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  // Simulate test execution
  const runTest = (test: TestDefinition) => {
    setIsRunning(true)
    setExecution({
      id: `exec-${Date.now()}`,
      testId: test.id,
      testName: test.name,
      status: "running",
      startTime: new Date(),
      currentStep: 0,
      totalSteps: test.steps.length,
      progress: 0,
    })

    // Simulate step-by-step execution
    let step = 0
    const interval = setInterval(() => {
      step++
      if (step <= test.steps.length) {
        setExecution((prev) =>
          prev
            ? {
                ...prev,
                currentStep: step,
                progress: (step / test.steps.length) * 100,
              }
            : null
        )
      } else {
        // Test complete
        const passed = Math.random() > 0.3 // 70% pass rate for demo
        setExecution((prev) =>
          prev
            ? {
                ...prev,
                status: passed ? "passed" : "failed",
                endTime: new Date(),
                progress: 100,
              }
            : null
        )
        setIsRunning(false)
        clearInterval(interval)
      }
    }, 1500)
  }

  const stopTest = () => {
    setIsRunning(false)
    setExecution((prev) =>
      prev
        ? {
            ...prev,
            status: "failed",
            endTime: new Date(),
          }
        : null
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Test Runner</h1>
        <p className="text-sm text-muted-foreground">
          Execute motor tests and view results
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-4 lg:gap-6">
        {/* Test List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Available Tests</CardTitle>
            <CardDescription>Select a test to view details and run</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {mockTests.map((test) => (
                  <button
                    key={test.id}
                    onClick={() => setSelectedTest(test)}
                    disabled={isRunning}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border transition-colors",
                      selectedTest?.id === test.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50",
                      isRunning && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">{test.name}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {test.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{test.steps.length} steps</span>
                          <span>Updated {formatRelativeTime(test.updatedAt)}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Test Details & Execution */}
        <div className="space-y-4">
          {/* Selected Test Details */}
          {selectedTest ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedTest.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {selectedTest.description}
                    </CardDescription>
                  </div>
                  {!isRunning ? (
                    <Button onClick={() => runTest(selectedTest)} className="gap-2">
                      <Play className="w-4 h-4" />
                      Run Test
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={stopTest}
                      className="gap-2"
                    >
                      <Square className="w-4 h-4" />
                      Stop
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">
                      Test Steps
                    </h4>
                    <div className="space-y-2">
                      {selectedTest.steps.map((step, index) => {
                        const isComplete =
                          execution &&
                          execution.testId === selectedTest.id &&
                          execution.currentStep !== undefined &&
                          index < execution.currentStep
                        const isCurrent =
                          execution &&
                          execution.testId === selectedTest.id &&
                          execution.currentStep === index + 1 &&
                          execution.status === "running"
                        const isFailed =
                          execution &&
                          execution.status === "failed" &&
                          execution.currentStep === index + 1

                        return (
                          <div
                            key={step.id}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-md text-sm",
                              isCurrent && "bg-primary/10",
                              isComplete && "bg-success/10",
                              isFailed && "bg-destructive/10"
                            )}
                          >
                            <div
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                                isComplete
                                  ? "bg-success text-success-foreground"
                                  : isCurrent
                                    ? "bg-primary text-primary-foreground"
                                    : isFailed
                                      ? "bg-destructive text-destructive-foreground"
                                      : "bg-muted text-muted-foreground"
                              )}
                            >
                              {isComplete ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : isCurrent ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : isFailed ? (
                                <XCircle className="w-4 h-4" />
                              ) : (
                                index + 1
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="font-mono text-xs text-muted-foreground">
                                {step.type}
                              </span>
                              {step.description && (
                                <p className="text-foreground">{step.description}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center h-[300px]">
              <div className="text-center text-muted-foreground">
                <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Select a test to view details</p>
              </div>
            </Card>
          )}

          {/* Execution Status */}
          {execution && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Execution Status
                  <Badge
                    variant={
                      execution.status === "passed"
                        ? "default"
                        : execution.status === "failed"
                          ? "destructive"
                          : "secondary"
                    }
                    className={cn(
                      execution.status === "passed" && "bg-success text-success-foreground"
                    )}
                  >
                    {execution.status === "running" && (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    )}
                    {execution.status === "passed" && (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    )}
                    {execution.status === "failed" && (
                      <XCircle className="w-3 h-3 mr-1" />
                    )}
                    {execution.status.toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-mono">
                      {execution.currentStep ?? 0} / {execution.totalSteps} steps
                    </span>
                  </div>
                  <Progress value={execution.progress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Started</p>
                    <p className="font-mono">
                      {execution.startTime?.toLocaleTimeString() ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {execution.endTime
                        ? `${Math.round((execution.endTime.getTime() - (execution.startTime?.getTime() ?? 0)) / 1000)}s`
                        : "Running..."}
                    </p>
                  </div>
                </div>

                {/* Result Display */}
                {execution.status !== "running" && (
                  <div
                    className={cn(
                      "p-4 rounded-lg text-center",
                      execution.status === "passed"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {execution.status === "passed" ? (
                      <>
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                        <p className="font-semibold text-lg">TEST PASSED</p>
                        <p className="text-sm opacity-80">
                          All steps completed successfully
                        </p>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-8 h-8 mx-auto mb-2" />
                        <p className="font-semibold text-lg">TEST FAILED</p>
                        <p className="text-sm opacity-80">
                          Test execution encountered an error
                        </p>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return "just now"
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return "yesterday"
  return `${diffDays}d ago`
}
