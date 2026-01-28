"use client"

import React from "react"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { stepTypes, type TestStep } from "@/lib/mock-data"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { LoadTestDialog } from "@/components/load-test-dialog"
import {
  Play,
  Square,
  Gauge,
  Clock,
  Activity,
  Minus,
  Plus,
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  FileCode,
  Wrench,
  AlertCircle,
} from "lucide-react"

const stepIcons: Record<string, React.ReactNode> = {
  start_motor: <Play className="w-4 h-4" />,
  set_speed: <Gauge className="w-4 h-4" />,
  apply_load: <Activity className="w-4 h-4" />,
  wait: <Clock className="w-4 h-4" />,
  monitor: <Activity className="w-4 h-4" />,
  remove_load: <Minus className="w-4 h-4" />,
  stop_motor: <Square className="w-4 h-4" />,
}

interface BuilderStep extends TestStep {
  id: string
}

function generateId() {
  return `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function stepsToYaml(testName: string, description: string, steps: BuilderStep[]): string {
  const yaml = `test_info:
  name: "${testName}"
  description: "${description}"
  author: "Test Engineer"
  version: "1.0"

global_settings:
  sample_rate_hz: 10
  max_test_time_s: 120

sequence:
${steps
      .map((step) => {
        // Build step with direct parameters (no nested params object)
        let stepYaml = `  - step: ${step.type}`
        if (step.description) {
          stepYaml += `\n    description: "${step.description}"`
        }
        // Add parameters directly at step level
        Object.entries(step.params).forEach(([key, value]) => {
          stepYaml += `\n    ${key}: ${typeof value === "string" ? `"${value}"` : value}`
        })
        return stepYaml
      })
      .join("\n\n")}`

  return yaml
}

function yamlToSteps(yaml: string): { name: string; description: string; steps: BuilderStep[] } | null {
  try {
    // Parse test_info section
    const nameMatch = yaml.match(/name:\s*"([^"]+)"/)
    const descMatch = yaml.match(/description:\s*"([^"]+)"/)

    // Parse sequence section (backend format)
    const sequenceSection = yaml.split(/sequence:\s*\n/)[1]

    if (!sequenceSection) return null

    // Split by step markers
    const stepBlocks = sequenceSection.split(/\n\s*-\s+step:\s+/).filter(Boolean)
    const steps: BuilderStep[] = stepBlocks.map((block) => {
      const lines = block.trim().split('\n')
      const stepType = lines[0].trim()

      const params: Record<string, number | string | boolean> = {}
      let description = ''

      // Parse each line for parameters or description
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line || line.startsWith('-')) break

        const match = line.match(/(\w+):\s*(.+)/)
        if (match) {
          const [, key, value] = match
          if (key === 'description') {
            description = value.replace(/"/g, '')
          } else {
            // Parse parameter value
            const cleanValue = value.trim()
            if (cleanValue === 'true') params[key] = true
            else if (cleanValue === 'false') params[key] = false
            else if (!isNaN(Number(cleanValue))) params[key] = Number(cleanValue)
            else params[key] = cleanValue.replace(/"/g, '')
          }
        }
      }

      return {
        id: generateId(),
        type: stepType as BuilderStep["type"],
        description,
        params,
      }
    })

    return {
      name: nameMatch?.[1] || "Untitled Test",
      description: descMatch?.[1] || "",
      steps,
    }
  } catch (e) {
    console.error('YAML parse error:', e)
    return null
  }
}

export default function TestBuilderPage() {
  const [testName, setTestName] = useState("New Motor Test")
  const [testDescription, setTestDescription] = useState("Test description")
  const [steps, setSteps] = useState<BuilderStep[]>([
    { id: generateId(), type: "start_motor", params: {}, description: "Initialize motor" },
    { id: generateId(), type: "set_speed", params: { rpm: 1500 }, description: "Set target speed" },
    { id: generateId(), type: "wait", params: { duration_s: 5 }, description: "Wait for stabilization" },
    { id: generateId(), type: "stop_motor", params: {}, description: "Stop motor" },
  ])
  const [selectedStep, setSelectedStep] = useState<BuilderStep | null>(null)
  const [yamlContent, setYamlContent] = useState("")
  const [yamlError, setYamlError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"visual" | "yaml">("visual")

  // Sync YAML when visual changes
  useEffect(() => {
    if (activeTab === "yaml") {
      setYamlContent(stepsToYaml(testName, testDescription, steps))
    }
  }, [steps, testName, testDescription, activeTab])

  // Sync visual when YAML changes
  const handleYamlChange = (newYaml: string) => {
    setYamlContent(newYaml)
    const parsed = yamlToSteps(newYaml)
    if (parsed) {
      setYamlError(null)
      setTestName(parsed.name)
      setTestDescription(parsed.description)
      setSteps(parsed.steps)
    } else {
      setYamlError("Invalid YAML syntax")
    }
  }

  const { user } = useAuth()
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!user) {
      alert("Please sign in to save tests")
      return
    }

    setSaving(true)
    try {
      const yaml = stepsToYaml(testName, testDescription, steps)
      const timestamp = new Date().getTime()
      const fileName = `${testName.replace(/\s+/g, "_")}_${timestamp}.yaml`

      // 1. Upload to Storage (convert string to Blob)
      const blob = new Blob([yaml], { type: 'text/yaml' })
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("test-files")
        .upload(fileName, blob)

      if (uploadError) throw uploadError

      // 2. Insert Metadata
      const { error: dbError } = await supabase
        .from("test_definitions")
        .insert({
          name: testName,
          description: testDescription,
          storage_path: fileName,
          author_id: user.id
        })

      if (dbError) throw dbError

      alert("Test saved successfully!")
    } catch (e: any) {
      console.error(e)
      alert("Failed to save: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  const addStep = (type: BuilderStep["type"]) => {
    const stepType = stepTypes.find((s) => s.type === type)
    const defaultParams: Record<string, number | string | boolean> = {}
    stepType?.params.forEach((p) => {
      defaultParams[p.name] = p.default
    })

    const newStep: BuilderStep = {
      id: generateId(),
      type,
      params: defaultParams,
      description: stepType?.label || "",
    }
    setSteps([...steps, newStep])
    setSelectedStep(newStep)
  }

  const removeStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id))
    if (selectedStep?.id === id) setSelectedStep(null)
  }

  const moveStep = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= steps.length) return
    const newSteps = [...steps]
      ;[newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]]
    setSteps(newSteps)
  }

  const updateStepParam = (stepId: string, paramName: string, value: number | string | boolean) => {
    setSteps(
      steps.map((s) =>
        s.id === stepId ? { ...s, params: { ...s.params, [paramName]: value } } : s
      )
    )
    if (selectedStep?.id === stepId) {
      setSelectedStep({ ...selectedStep, params: { ...selectedStep.params, [paramName]: value } })
    }
  }

  const updateStepDescription = (stepId: string, description: string) => {
    setSteps(steps.map((s) => (s.id === stepId ? { ...s, description } : s)))
    if (selectedStep?.id === stepId) {
      setSelectedStep({ ...selectedStep, description })
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Test Builder</h1>
          <p className="text-sm text-muted-foreground">
            Create and edit motor test definitions
          </p>
        </div>
        <div className="flex gap-2">
          <LoadTestDialog onLoad={handleYamlChange} />
          <Button className="gap-2" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Test"}
          </Button>
        </div>
      </div>

      {/* Test Metadata */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testName">Test Name</Label>
              <Input
                id="testName"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="Enter test name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testDesc">Description</Label>
              <Input
                id="testDesc"
                value={testDescription}
                onChange={(e) => setTestDescription(e.target.value)}
                placeholder="Enter description"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Builder Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "visual" | "yaml")}>
        <TabsList className="mb-4">
          <TabsTrigger value="visual" className="gap-2">
            <Wrench className="w-4 h-4" />
            Visual Builder
          </TabsTrigger>
          <TabsTrigger value="yaml" className="gap-2">
            <FileCode className="w-4 h-4" />
            YAML Editor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="mt-0">
          <div className="grid lg:grid-cols-[280px_1fr_300px] gap-4 lg:gap-6">
            {/* Step Palette */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Step Palette</CardTitle>
                <CardDescription>Click to add steps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stepTypes.map((stepType) => (
                    <button
                      key={stepType.type}
                      onClick={() => addStep(stepType.type as BuilderStep["type"])}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-md flex items-center justify-center bg-muted",
                          stepType.color
                        )}
                      >
                        {stepIcons[stepType.type]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{stepType.label}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {stepType.type}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step Sequence */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Test Sequence
                  <Badge variant="secondary">{steps.length} steps</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {steps.map((step, index) => {
                      const stepType = stepTypes.find((s) => s.type === step.type)
                      return (
                        <div
                          key={step.id}
                          onClick={() => setSelectedStep(step)}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                            selectedStep?.id === step.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                          <div
                            className={cn(
                              "w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-semibold bg-muted"
                            )}
                          >
                            {index + 1}
                          </div>
                          <div
                            className={cn(
                              "w-8 h-8 rounded-md flex items-center justify-center bg-muted",
                              stepType?.color
                            )}
                          >
                            {stepIcons[step.type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {stepType?.label}
                            </p>
                            {step.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {step.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                moveStep(index, "up")
                              }}
                              disabled={index === 0}
                              className="p-1 hover:bg-muted rounded disabled:opacity-30"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                moveStep(index, "down")
                              }}
                              disabled={index === steps.length - 1}
                              className="p-1 hover:bg-muted rounded disabled:opacity-30"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeStep(step.id)
                              }}
                              className="p-1 hover:bg-destructive/10 hover:text-destructive rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    {steps.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No steps added yet</p>
                        <p className="text-sm">
                          Click a step type to add it
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Step Parameters */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Step Parameters</CardTitle>
                <CardDescription>
                  {selectedStep
                    ? `Configure ${stepTypes.find((s) => s.type === selectedStep.type)?.label}`
                    : "Select a step to edit"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedStep ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="stepDesc">Description</Label>
                      <Input
                        id="stepDesc"
                        value={selectedStep.description || ""}
                        onChange={(e) =>
                          updateStepDescription(selectedStep.id, e.target.value)
                        }
                        placeholder="Step description"
                      />
                    </div>

                    {stepTypes
                      .find((s) => s.type === selectedStep.type)
                      ?.params.map((param) => (
                        <div key={param.name} className="space-y-2">
                          <Label htmlFor={param.name}>{param.label}</Label>
                          {param.type === "boolean" ? (
                            <div className="flex items-center gap-2">
                              <Switch
                                id={param.name}
                                checked={
                                  (selectedStep.params[param.name] as boolean) ?? param.default
                                }
                                onCheckedChange={(checked) =>
                                  updateStepParam(selectedStep.id, param.name, checked)
                                }
                              />
                              <span className="text-sm text-muted-foreground">
                                {selectedStep.params[param.name] ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                          ) : (
                            <Input
                              id={param.name}
                              type="number"
                              value={
                                (selectedStep.params[param.name] as number) ?? param.default
                              }
                              onChange={(e) =>
                                updateStepParam(
                                  selectedStep.id,
                                  param.name,
                                  Number(e.target.value)
                                )
                              }
                            />
                          )}
                        </div>
                      ))}

                    {stepTypes.find((s) => s.type === selectedStep.type)?.params
                      .length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          This step has no configurable parameters.
                        </p>
                      )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Select a step to configure</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="yaml" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                YAML Definition
                {yamlError && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {yamlError}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Edit the YAML directly - changes sync with the visual builder
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <textarea
                  value={yamlContent}
                  onChange={(e) => handleYamlChange(e.target.value)}
                  className={cn(
                    "w-full h-[500px] p-4 font-mono text-sm bg-muted rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-ring",
                    yamlError && "border-destructive focus:ring-destructive"
                  )}
                  spellCheck={false}
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    YAML
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
