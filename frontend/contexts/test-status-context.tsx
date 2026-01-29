"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import Link from "next/link"
import type { ActiveTestState } from "@/lib/types"

const API_URL = "http://localhost:8000"

interface TestStatusContextType {
    execution: ActiveTestState | null
    refresh: () => void
}

const TestStatusContext = createContext<TestStatusContextType | undefined>(undefined)

export function TestStatusProvider({ children }: { children: React.ReactNode }) {
    const [execution, setExecution] = useState<ActiveTestState | null>(null)
    const lastCompletedRef = useRef<number>(0)
    const { toast } = useToast()

    const poll = async () => {
        try {
            const res = await fetch(`${API_URL}/tests/active`)
            const data: ActiveTestState = await res.json()
            setExecution(data)

            // Handle Notifications
            if (data.last_completed && data.last_completed.time > lastCompletedRef.current) {
                const now = Date.now() / 1000
                // Use 120s window so even if user switches tabs and comes back later, they see it?
                // But preventing stale on refresh is important.
                // Let's rely on ref being 0 at first.
                // If ref is 0, we trust it IF it happened recently (< 60s).
                if (now - data.last_completed.time < 60) {
                    if (lastCompletedRef.current > 0 || now - data.last_completed.time < 10) {
                        toast({
                            title: data.last_completed.status === "PASS" ? "Test Passed" : "Test Failed",
                            description: `Test "${data.last_completed.test}" completed.`,
                            variant: data.last_completed.status === "PASS" ? "default" : "destructive",
                            className: data.last_completed.status === "PASS" ? "border-success text-success" : "",
                            action: (
                                <ToastAction altText="View Report" asChild>
                                    <Link href="/reports">View Report</Link>
                                </ToastAction>
                            ),
                        })
                    }
                }
                lastCompletedRef.current = data.last_completed.time
            }
        } catch (e) {
            console.error("Status Poll Error", e)
        }
    }

    useEffect(() => {
        // Initial poll
        poll()
        const interval = setInterval(poll, 1000)
        return () => clearInterval(interval)
    }, [])

    return (
        <TestStatusContext.Provider value={{ execution, refresh: poll }}>
            {children}
        </TestStatusContext.Provider>
    )
}

export function useTestStatus() {
    const context = useContext(TestStatusContext)
    if (context === undefined) {
        throw new Error("useTestStatus must be used within a TestStatusProvider")
    }
    return context
}
