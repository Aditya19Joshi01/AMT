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

export interface TestStep {
    id: string
    type: "start_motor" | "set_speed" | "apply_load" | "wait" | "monitor" | "remove_load" | "stop_motor"
    params: Record<string, number | string | boolean>
    description?: string
}
