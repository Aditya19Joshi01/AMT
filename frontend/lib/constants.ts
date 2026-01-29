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
