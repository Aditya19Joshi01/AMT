import os
import json
import uuid
from datetime import datetime
from .models import TestReport, TestInfo, ExecutionInfo, AppSummary, AppMetrics, StepResult

REPORT_DIR = os.path.join(os.getcwd(), "reports")
if not os.path.exists(REPORT_DIR):
    os.makedirs(REPORT_DIR)

class ReportBuilder:
    def __init__(self):
        self.report: TestReport = None
        self.start_time = None

    def start_test(self, name: str, description: str, author="Test Engineer"):
        """Initialize a new test report."""
        self.start_time = datetime.utcnow()
        
        info = TestInfo(
            name=name,
            description=description,
            author=author
        )
        
        exec_info = ExecutionInfo(
            test_id=f"test_{uuid.uuid4().hex[:8]}",
            started_at=self.start_time.isoformat(),
            status="RUNNING"
        )
        
        self.report = TestReport(
            test_info=info,
            execution_info=exec_info,
            summary=AppSummary(),
            steps=[],
            metrics=AppMetrics()
        )
        return self.report.execution_info.test_id

    def add_step_result(self, result: StepResult):
        """Add a completed step result."""
        self.report.steps.append(result)
        
        # Update running summary
        if result.status == "PASS":
            self.report.summary.passed_steps += 1
        else:
            self.report.summary.failed_steps += 1

    def finish_test(self, overall_status: str, failure_reason: str = None, global_stats: dict = None):
        """Finalize the report and save it."""
        end_time = datetime.utcnow()
        duration = (end_time - self.start_time).total_seconds()
        
        # Update Exec Info
        self.report.execution_info.ended_at = end_time.isoformat()
        self.report.execution_info.duration_s = duration
        self.report.execution_info.status = overall_status
        
        # Update Summary
        self.report.summary.overall_result = overall_status
        self.report.summary.failure_reason = failure_reason
        
        # Update Metrics (if provided)
        if global_stats:
            self.report.metrics.max_temperature_c = global_stats.get("max_temp", 0.0)
            self.report.metrics.avg_speed_rpm = global_stats.get("avg_speed", 0.0)
            self.report.metrics.test_duration_s = duration

        # Save to Disk
        return self._save_to_disk()

    def _save_to_disk(self) -> str:
        # Use simple timestamp: YYYYMMDD_HHMMSS
        timestamp = self.start_time.strftime("%Y%m%d_%H%M%S")
        safe_name = self.report.test_info.name.replace(' ', '_')
        filename = f"report_{safe_name}_{timestamp}.json"
        
        filepath = os.path.join(REPORT_DIR, filename)
        
        with open(filepath, 'w') as f:
            f.write(self.report.model_dump_json(indent=2))
            
        print(f"[Report] Saved to {filepath}")
        return filename
