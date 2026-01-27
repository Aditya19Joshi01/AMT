"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
// import { mockTests } from "@/lib/mock-data"
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
}

const API_URL = "http://localhost:8000/api/v1"

export default function TestRunnerPage() {
  const { user } = useAuth()
  const [tests, setTests] = useState<TestDefinition[]>([])
  const [selectedTest, setSelectedTest] = useState<TestDefinition | null>(null)
  const [execution, setExecution] = useState<ActiveTestState | null>(null)

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
    try {
      await fetch(`${API_URL}/tests/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test_id: test.id,
          storage_path: test.storage_path
        })
      })
    } catch (e) {
      alert("Failed to trigger test")
    }
  }

  const stopTest = () => {
    alert("Stop functionality not implemented in backend API yet")
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
                {tests.map((test) => (
                  <button
                    key={test.id}
                    onClick={() => setSelectedTest(test)}
                    disabled={execution?.running}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border transition-colors",
                      selectedTest?.id === test.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50",
                      execution?.running && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">{test.name}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {test.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>Created {new Date(test.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </button>
                ))}
                {tests.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No tests found. Save a test in the Builder first.
                  </div>
                )}
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
                  {!execution?.running ? (
                    <Button onClick={() => runTest(selectedTest)} className="gap-2">
                      <Play className="w-4 h-4" />
                      Run Test
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={stopTest}
                      className="gap-2"
                      disabled={true} // Disabled until stop implemented
                    >
                      <Square className="w-4 h-4" />
                      Stop
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Click Run to execute this test on the connected motor setup.
                  </p>
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
          {execution && (execution.running || execution.last_error) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Status
                  <Badge variant={execution.running ? "default" : "secondary"}>
                    {execution.running ? "RUNNING" : "STOPPED"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {execution.running && (
                  <div className="flex items-center gap-2 text-primary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-mono text-sm">Executing {execution.test}...</span>
                  </div>
                )}
                {execution.last_error && (
                  <div className="mt-2 text-destructive text-sm bg-destructive/10 p-2 rounded">
                    Error: {execution.last_error}
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
