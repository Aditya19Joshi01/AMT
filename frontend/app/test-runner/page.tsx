"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import {
  Play,
  Square,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Loader2,
  FileText,
  Calendar,
  PlayCircle,
  AlertCircle,
  LayoutDashboard,
} from "lucide-react"

interface TestDefinition {
  id: string
  name: string
  description: string
  storage_path: string
  created_at: string
}

interface ActiveTestState {
  running: boolean
  test: string | null
  last_error: string | null
  current_step: number
  total_steps: number
  step_name: string
}

const API_URL = "http://localhost:8000"

export default function TestRunnerPage() {
  const { user } = useAuth()
  const [tests, setTests] = useState<TestDefinition[]>([])
  const [selectedTest, setSelectedTest] = useState<TestDefinition | null>(null)
  const [execution, setExecution] = useState<ActiveTestState | null>(null)
  const [progress, setProgress] = useState(0)

  // Fetch tests
  useEffect(() => {
    if (user) {
      supabase
        .from("test_definitions")
        .select("*")
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) setTests(data)
        })
    }
  }, [user])

  // Poll status
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/tests/active`)
        const data: ActiveTestState = await res.json()
        setExecution(data)

        // Calculate real progress
        if (data.running && data.total_steps > 0) {
          const percent = (data.current_step / data.total_steps) * 100
          setProgress(percent)
        } else if (!data.running) {
          setProgress(0)
        }
      } catch (e) {
        console.error("Polling error", e)
      }
    }

    const interval = setInterval(poll, 1000)
    poll() // Initial call
    return () => clearInterval(interval)
  }, [])

  const runTest = async (test: TestDefinition) => {
    if (!test) return
    setProgress(0)
    try {
      await fetch(`${API_URL}/tests/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test_id: test.id,
          storage_path: test.storage_path,
          test_name: test.name
        })
      })
    } catch (e) {
      alert("Failed to trigger test execution")
    }
  }

  const isTestRunning = execution?.running

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Test Runner</h1>
          <p className="text-muted-foreground mt-1">
            Execute motor tests and monitor real-time progress
          </p>
        </div>
        {isTestRunning && (
          <Badge variant="default" className="gap-2 px-4 py-2 bg-primary animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            Test in Progress
          </Badge>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Test List */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Available Tests
            </CardTitle>
            <CardDescription>
              Select a test configuration to execute
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {tests.map((test) => (
                  <button
                    key={test.id}
                    onClick={() => setSelectedTest(test)}
                    disabled={isTestRunning && selectedTest?.id !== test.id}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border transition-all duration-200 group",
                      selectedTest?.id === test.id
                        ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20"
                        : "border-border hover:border-primary/60 hover:bg-accent/50 hover:shadow-sm",
                      isTestRunning && selectedTest?.id !== test.id && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {test.name}
                          </h3>
                          {selectedTest?.id === test.id && (
                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {test.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(test.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={cn(
                        "w-5 h-5 text-muted-foreground transition-transform flex-shrink-0",
                        selectedTest?.id === test.id && "transform translate-x-1 text-primary"
                      )} />
                    </div>
                  </button>
                ))}
                {tests.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
                    <p className="text-muted-foreground font-medium mb-1">No tests available</p>
                    <p className="text-sm text-muted-foreground">
                      Create a test in the Test Builder to get started
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Test Details & Execution */}
        <div className="space-y-6">
          {selectedTest ? (
            <>
              {/* Test Details Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{selectedTest.name}</CardTitle>
                      <CardDescription className="text-base">
                        {selectedTest.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Created</p>
                      <p className="text-sm font-medium">
                        {new Date(selectedTest.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Storage</p>
                      <p className="text-sm font-mono text-xs truncate">
                        {selectedTest.storage_path}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {!isTestRunning ? (
                    <Button
                      onClick={() => runTest(selectedTest)}
                      className="w-full gap-2 h-12 text-base font-semibold"
                      size="lg"
                    >
                      <PlayCircle className="w-5 h-5" />
                      Execute Test
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full gap-2 h-12 cursor-not-allowed"
                      size="lg"
                      disabled
                    >
                      <Square className="w-5 h-5" />
                      Stop Test
                      <span className="text-xs ml-2">(Coming Soon)</span>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Execution Status Card */}
              {execution && (execution.running || execution.last_error) && (
                <Card className={cn(
                  "border-2 transition-colors",
                  execution.running && "border-primary bg-primary/5",
                  execution.last_error && "border-destructive bg-destructive/5"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {execution.running ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span>Test Executing</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-destructive" />
                            <span>Last Execution</span>
                          </>
                        )}
                      </CardTitle>
                      <Badge
                        variant={execution.running ? "default" : "destructive"}
                        className={cn(
                          "font-semibold",
                          execution.running && "bg-primary"
                        )}
                      >
                        {execution.running ? "RUNNING" : "FAILED"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {execution.running && (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Step {execution.current_step} of {execution.total_steps}
                            </span>
                            <span className="font-mono text-xs">{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <p className="text-sm font-medium text-primary mb-1">Current Step</p>
                          <p className="font-mono text-xs text-muted-foreground break-all">
                            {execution.step_name || "Initializing..."}
                          </p>
                        </div>

                        <div className="pt-2">
                          <Link href="/">
                            <Button variant="outline" size="sm" className="w-full gap-2">
                              <LayoutDashboard className="w-4 h-4" />
                              Monitor in Dashboard
                            </Button>
                          </Link>
                        </div>
                      </>
                    )}
                    {execution.last_error && !execution.running && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm font-medium text-destructive mb-1 flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          Error Details
                        </p>
                        <p className="text-sm text-destructive/90">
                          {execution.last_error}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="flex items-center justify-center h-[500px] border-dashed">
              <div className="text-center max-w-sm mx-auto px-4">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <PlayCircle className="w-10 h-10 text-muted-foreground/60" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Test Selected</h3>
                <p className="text-muted-foreground text-sm">
                  Choose a test from the list to view details and execute
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
