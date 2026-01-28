// Mock data for Industrial Motor Test Bench MVP

export type MotorStatus = "idle" | "running" | "fault"

export interface TelemetryData {
  timestamp: number
  rpm: number
  temperature: number
  torque: number
  voltage: number
}

export interface EventLog {
  id: string
  timestamp: Date
  type: "info" | "warning" | "error" | "success"
  message: string
}

export interface TestDefinition {
  id: string
  name: string
  description: string
  steps: TestStep[]
  createdAt: Date
  updatedAt: Date
}

export interface TestStep {
  id: string
  type: "start_motor" | "set_speed" | "apply_load" | "wait" | "monitor" | "remove_load" | "stop_motor"
  params: Record<string, number | string | boolean>
  description?: string
}

export interface TestExecution {
  id: string
  testId: string
  testName: string
  status: "pending" | "running" | "passed" | "failed"
  startTime?: Date
  endTime?: Date
  currentStep?: number
  totalSteps: number
  progress: number
}

export interface TestReport {
  test_info: {
    test_id: string
    test_name: string
    description: string
    version: string
  }
  execution_info: {
    execution_id: string
    environment: string
    start_time: string
    end_time: string
    duration_seconds: number
  }
  summary: {
    overall_result: "PASS" | "FAIL"
    total_steps: number
    passed_steps: number
    failed_steps: number
  }
  steps: TestReportStep[]
  metrics: {
    temperature: { values: number[]; timestamps: string[] }
    speed: { values: number[]; timestamps: string[] }
  }
  artifacts: string[]
}

export interface TestReportStep {
  step_number: number
  step_name: string
  description: string
  status: "PASS" | "FAIL" | "SKIPPED"
  duration_ms: number
  inputs: Record<string, number | string>
  observed: {
    min?: number
    max?: number
    average?: number
    [key: string]: number | string | undefined
  }
  failure_details?: string
}

// Generate mock telemetry data
export function generateTelemetryData(count: number): TelemetryData[] {
  const data: TelemetryData[] = []
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    data.push({
      timestamp: now - (count - i) * 1000,
      rpm: 1500 + Math.sin(i * 0.1) * 200 + Math.random() * 50,
      temperature: 45 + Math.sin(i * 0.05) * 10 + Math.random() * 5,
      torque: 25 + Math.sin(i * 0.08) * 8 + Math.random() * 3,
      voltage: 380 + Math.random() * 5,
    })
  }

  return data
}

// Mock event logs
export const mockEventLogs: EventLog[] = [
  { id: "1", timestamp: new Date(Date.now() - 60000), type: "info", message: "System initialized" },
  { id: "2", timestamp: new Date(Date.now() - 45000), type: "success", message: "Motor started successfully" },
  { id: "3", timestamp: new Date(Date.now() - 30000), type: "info", message: "Speed set to 1500 RPM" },
  { id: "4", timestamp: new Date(Date.now() - 20000), type: "warning", message: "Temperature approaching threshold (52°C)" },
  { id: "5", timestamp: new Date(Date.now() - 10000), type: "info", message: "Load applied: 25 Nm" },
  { id: "6", timestamp: new Date(Date.now() - 5000), type: "success", message: "Monitoring phase complete" },
]

// Mock test definitions
export const mockTests: TestDefinition[] = [
  {
    id: "test-001",
    name: "Basic Motor Start/Stop",
    description: "Verify motor can start and stop safely",
    steps: [
      { id: "s1", type: "start_motor", params: {}, description: "Initialize motor" },
      { id: "s2", type: "set_speed", params: { target_rpm: 1000 }, description: "Set to 1000 RPM" },
      { id: "s3", type: "wait", params: { duration_seconds: 5 }, description: "Wait for stabilization" },
      { id: "s4", type: "stop_motor", params: {}, description: "Stop motor" },
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "test-002",
    name: "Load Test - 50Nm",
    description: "Test motor under 50Nm load condition",
    steps: [
      { id: "s1", type: "start_motor", params: {}, description: "Initialize motor" },
      { id: "s2", type: "set_speed", params: { target_rpm: 1500 }, description: "Set to 1500 RPM" },
      { id: "s3", type: "wait", params: { duration_seconds: 3 }, description: "Wait for stabilization" },
      { id: "s4", type: "apply_load", params: { torque_nm: 50 }, description: "Apply 50Nm load" },
      { id: "s5", type: "monitor", params: { duration_seconds: 10, check_temperature: true }, description: "Monitor for 10s" },
      { id: "s6", type: "remove_load", params: {}, description: "Remove load" },
      { id: "s7", type: "stop_motor", params: {}, description: "Stop motor" },
    ],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "test-003",
    name: "Speed Ramp Test",
    description: "Test motor speed ramping from 0 to 3000 RPM",
    steps: [
      { id: "s1", type: "start_motor", params: {}, description: "Initialize motor" },
      { id: "s2", type: "set_speed", params: { target_rpm: 1000 }, description: "Ramp to 1000 RPM" },
      { id: "s3", type: "wait", params: { duration_seconds: 2 }, description: "Hold" },
      { id: "s4", type: "set_speed", params: { target_rpm: 2000 }, description: "Ramp to 2000 RPM" },
      { id: "s5", type: "wait", params: { duration_seconds: 2 }, description: "Hold" },
      { id: "s6", type: "set_speed", params: { target_rpm: 3000 }, description: "Ramp to 3000 RPM" },
      { id: "s7", type: "monitor", params: { duration_seconds: 5 }, description: "Monitor at max speed" },
      { id: "s8", type: "stop_motor", params: {}, description: "Stop motor" },
    ],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
  {
    id: "test-004",
    name: "Thermal Endurance",
    description: "Extended run to test thermal performance",
    steps: [
      { id: "s1", type: "start_motor", params: {}, description: "Initialize motor" },
      { id: "s2", type: "set_speed", params: { target_rpm: 2000 }, description: "Set to 2000 RPM" },
      { id: "s3", type: "apply_load", params: { torque_nm: 30 }, description: "Apply moderate load" },
      { id: "s4", type: "monitor", params: { duration_seconds: 60, check_temperature: true, max_temp: 80 }, description: "Monitor temperature for 60s" },
      { id: "s5", type: "remove_load", params: {}, description: "Remove load" },
      { id: "s6", type: "stop_motor", params: {}, description: "Stop motor" },
    ],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
]

// Mock test reports
export const mockReports: TestReport[] = [
  {
    test_info: {
      test_id: "test-001",
      test_name: "Basic Motor Start/Stop",
      description: "Verify motor can start and stop safely",
      version: "1.0.0",
    },
    execution_info: {
      execution_id: "exec-001-abc123",
      environment: "SIMULATION",
      start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() - 2 * 60 * 60 * 1000 + 45000).toISOString(),
      duration_seconds: 45,
    },
    summary: {
      overall_result: "PASS",
      total_steps: 4,
      passed_steps: 4,
      failed_steps: 0,
    },
    steps: [
      { step_number: 1, step_name: "start_motor", description: "Initialize motor", status: "PASS", duration_ms: 1200, inputs: {}, observed: { startup_time_ms: 1150 } },
      { step_number: 2, step_name: "set_speed", description: "Set to 1000 RPM", status: "PASS", duration_ms: 3500, inputs: { target_rpm: 1000 }, observed: { min: 980, max: 1020, average: 1002 } },
      { step_number: 3, step_name: "wait", description: "Wait for stabilization", status: "PASS", duration_ms: 5000, inputs: { duration_seconds: 5 }, observed: { actual_duration_ms: 5001 } },
      { step_number: 4, step_name: "stop_motor", description: "Stop motor", status: "PASS", duration_ms: 2000, inputs: {}, observed: { coast_down_time_ms: 1850 } },
    ],
    metrics: {
      temperature: { values: [25, 28, 32, 35, 38, 40, 42, 41, 38], timestamps: Array(9).fill(0).map((_, i) => new Date(Date.now() - (9 - i) * 5000).toISOString()) },
      speed: { values: [0, 500, 850, 1000, 1005, 998, 1002, 500, 0], timestamps: Array(9).fill(0).map((_, i) => new Date(Date.now() - (9 - i) * 5000).toISOString()) },
    },
    artifacts: ["logs/exec-001.log", "data/exec-001-telemetry.csv"],
  },
  {
    test_info: {
      test_id: "test-002",
      test_name: "Load Test - 50Nm",
      description: "Test motor under 50Nm load condition",
      version: "1.2.0",
    },
    execution_info: {
      execution_id: "exec-002-def456",
      environment: "SIMULATION",
      start_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() - 1 * 60 * 60 * 1000 + 85000).toISOString(),
      duration_seconds: 85,
    },
    summary: {
      overall_result: "FAIL",
      total_steps: 7,
      passed_steps: 5,
      failed_steps: 2,
    },
    steps: [
      { step_number: 1, step_name: "start_motor", description: "Initialize motor", status: "PASS", duration_ms: 1100, inputs: {}, observed: { startup_time_ms: 1080 } },
      { step_number: 2, step_name: "set_speed", description: "Set to 1500 RPM", status: "PASS", duration_ms: 4200, inputs: { target_rpm: 1500 }, observed: { min: 1480, max: 1525, average: 1498 } },
      { step_number: 3, step_name: "wait", description: "Wait for stabilization", status: "PASS", duration_ms: 3000, inputs: { duration_seconds: 3 }, observed: { actual_duration_ms: 3002 } },
      { step_number: 4, step_name: "apply_load", description: "Apply 50Nm load", status: "PASS", duration_ms: 2500, inputs: { torque_nm: 50 }, observed: { applied_torque: 49.8 } },
      { step_number: 5, step_name: "monitor", description: "Monitor for 10s", status: "FAIL", duration_ms: 10000, inputs: { duration_seconds: 10, check_temperature: true }, observed: { min: 55, max: 82, average: 68 }, failure_details: "Temperature exceeded threshold: 82°C > 80°C max" },
      { step_number: 6, step_name: "remove_load", description: "Remove load", status: "PASS", duration_ms: 1500, inputs: {}, observed: { unload_time_ms: 1450 } },
      { step_number: 7, step_name: "stop_motor", description: "Stop motor", status: "FAIL", duration_ms: 3500, inputs: {}, observed: { coast_down_time_ms: 3200 }, failure_details: "Motor stop time exceeded limit: 3200ms > 3000ms max" },
    ],
    metrics: {
      temperature: { values: [30, 35, 42, 50, 58, 65, 72, 78, 82, 75, 65, 55], timestamps: Array(12).fill(0).map((_, i) => new Date(Date.now() - (12 - i) * 7000).toISOString()) },
      speed: { values: [0, 750, 1200, 1500, 1495, 1502, 1498, 1500, 1495, 1000, 400, 0], timestamps: Array(12).fill(0).map((_, i) => new Date(Date.now() - (12 - i) * 7000).toISOString()) },
    },
    artifacts: ["logs/exec-002.log", "data/exec-002-telemetry.csv", "alerts/exec-002-thermal-alert.json"],
  },
  {
    test_info: {
      test_id: "test-003",
      test_name: "Speed Ramp Test",
      description: "Test motor speed ramping from 0 to 3000 RPM",
      version: "2.0.0",
    },
    execution_info: {
      execution_id: "exec-003-ghi789",
      environment: "SIMULATION",
      start_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() - 30 * 60 * 1000 + 65000).toISOString(),
      duration_seconds: 65,
    },
    summary: {
      overall_result: "PASS",
      total_steps: 8,
      passed_steps: 8,
      failed_steps: 0,
    },
    steps: [
      { step_number: 1, step_name: "start_motor", description: "Initialize motor", status: "PASS", duration_ms: 1050, inputs: {}, observed: { startup_time_ms: 1020 } },
      { step_number: 2, step_name: "set_speed", description: "Ramp to 1000 RPM", status: "PASS", duration_ms: 3800, inputs: { target_rpm: 1000 }, observed: { min: 990, max: 1015, average: 1001 } },
      { step_number: 3, step_name: "wait", description: "Hold", status: "PASS", duration_ms: 2000, inputs: { duration_seconds: 2 }, observed: { actual_duration_ms: 2001 } },
      { step_number: 4, step_name: "set_speed", description: "Ramp to 2000 RPM", status: "PASS", duration_ms: 4500, inputs: { target_rpm: 2000 }, observed: { min: 1985, max: 2020, average: 1998 } },
      { step_number: 5, step_name: "wait", description: "Hold", status: "PASS", duration_ms: 2000, inputs: { duration_seconds: 2 }, observed: { actual_duration_ms: 2002 } },
      { step_number: 6, step_name: "set_speed", description: "Ramp to 3000 RPM", status: "PASS", duration_ms: 5200, inputs: { target_rpm: 3000 }, observed: { min: 2980, max: 3025, average: 2999 } },
      { step_number: 7, step_name: "monitor", description: "Monitor at max speed", status: "PASS", duration_ms: 5000, inputs: { duration_seconds: 5 }, observed: { average_rpm: 2998, temperature_max: 58 } },
      { step_number: 8, step_name: "stop_motor", description: "Stop motor", status: "PASS", duration_ms: 2800, inputs: {}, observed: { coast_down_time_ms: 2650 } },
    ],
    metrics: {
      temperature: { values: [28, 32, 38, 44, 48, 52, 55, 58, 55, 48, 40], timestamps: Array(11).fill(0).map((_, i) => new Date(Date.now() - (11 - i) * 6000).toISOString()) },
      speed: { values: [0, 500, 1000, 1000, 1500, 2000, 2000, 2500, 3000, 1500, 0], timestamps: Array(11).fill(0).map((_, i) => new Date(Date.now() - (11 - i) * 6000).toISOString()) },
    },
    artifacts: ["logs/exec-003.log", "data/exec-003-telemetry.csv"],
  },
]

// Step type metadata for Test Builder
export const stepTypes = [
  { type: "start_motor", label: "Start Motor", icon: "Play", color: "text-success", params: [] },
  { type: "set_speed", label: "Set Speed", icon: "Gauge", color: "text-chart-1", params: [{ name: "rpm", type: "number", label: "Target RPM", default: 1500 }] },
  { type: "apply_load", label: "Apply Load", icon: "Weight", color: "text-warning", params: [{ name: "load_nm", type: "number", label: "Torque (Nm)", default: 25 }] },
  { type: "wait", label: "Wait", icon: "Clock", color: "text-muted-foreground", params: [{ name: "duration_s", type: "number", label: "Duration (s)", default: 5 }] },
  {
    type: "monitor", label: "Monitor", icon: "Activity", color: "text-chart-2", params: [
      { name: "duration_s", type: "number", label: "Duration (s)", default: 10 },
      { name: "check_temperature", type: "boolean", label: "Check Temperature", default: true },
      { name: "max_temp", type: "number", label: "Max Temp (°C)", default: 80 },
    ]
  },
  { type: "remove_load", label: "Remove Load", icon: "Minus", color: "text-muted-foreground", params: [] },
  { type: "stop_motor", label: "Stop Motor", icon: "Square", color: "text-destructive", params: [] },
] as const

