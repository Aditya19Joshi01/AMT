"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Loader2, Download } from "lucide-react"

interface LoadTestDialogProps {
    onLoad: (yaml: string) => void
}

interface TestDefinition {
    id: string
    name: string
    description: string
    storage_path: string
    created_at: string
}

export function LoadTestDialog({ onLoad }: LoadTestDialogProps) {
    const [open, setOpen] = useState(false)
    const [tests, setTests] = useState<TestDefinition[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingId, setLoadingId] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            fetchTests()
        }
    }, [open])

    const fetchTests = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from("test_definitions")
            .select("*")
            .order("created_at", { ascending: false })

        if (!error && data) {
            setTests(data)
        }
        setLoading(false)
    }

    const handleLoad = async (test: TestDefinition) => {
        setLoadingId(test.id)
        try {
            const { data, error } = await supabase.storage
                .from("test-files")
                .download(test.storage_path)

            if (error) throw error

            const text = await data.text()
            onLoad(text)
            setOpen(false)
        } catch (e) {
            console.error("Failed to load test", e)
            alert("Failed to load test file")
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Load Test
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Load Test</DialogTitle>
                    <DialogDescription>
                        Select a test definition to load into the builder.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[300px] mt-4 pr-4">
                    {loading && !tests.length ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {tests.map((test) => (
                                <div
                                    key={test.id}
                                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                >
                                    <div className="min-w-0 flex-1 mr-4">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-primary" />
                                            <p className="font-medium text-sm truncate">{test.name}</p>
                                        </div>
                                        {test.description && (
                                            <p className="text-xs text-muted-foreground truncate mt-1">
                                                {test.description}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            {new Date(test.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleLoad(test)}
                                        disabled={!!loadingId}
                                    >
                                        {loadingId === test.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            "Load"
                                        )}
                                    </Button>
                                </div>
                            ))}
                            {!loading && tests.length === 0 && (
                                <p className="text-center text-sm text-muted-foreground py-8">
                                    No saved tests found.
                                </p>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
