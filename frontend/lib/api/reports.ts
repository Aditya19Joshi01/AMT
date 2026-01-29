const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ReportListItem {
    id: string
    test_id: string
    test_name: string
    status: string
    executed_at: string
    duration_s: number
    report_path: string
}

export interface TestReport {
    test_info: {
        name: string
        version: string
        author: string
        description: string
    }
    execution_info: {
        test_id: string
        started_at: string
        ended_at: string
        duration_s: number
        status: string
        environment: string
    }
    summary: {
        overall_result: 'PASS' | 'FAIL'
        passed_steps: number
        failed_steps: number
        failure_reason: string | null
    }
    steps: {
        step: string
        description: string
        status: 'PASS' | 'FAIL'
        started_at: string
        ended_at: string
        input_params: Record<string, any>
        observed: Record<string, any>
        failure_details: any
    }[]
    metrics: {
        max_temperature_c: number
        avg_speed_rpm: number
        test_duration_s: number
    }
    artifacts: Record<string, any>
}

export async function fetchReportList(): Promise<ReportListItem[]> {
    const response = await fetch(`${API_URL}/reports/list`)
    if (!response.ok) {
        throw new Error('Failed to fetch reports')
    }
    return response.json()
}

export async function fetchReport(reportPath: string): Promise<TestReport> {
    const response = await fetch(`${API_URL}/reports/download/${encodeURIComponent(reportPath)}`)
    if (!response.ok) {
        throw new Error('Failed to fetch report')
    }
    return response.json()
}
