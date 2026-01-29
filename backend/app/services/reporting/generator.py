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
        self.db_test_id = None

    def start_test(self, name: str, description: str, author="Test Engineer", db_test_id: str = None):
        """Initialize a new test report."""
        self.start_time = datetime.utcnow()
        self.db_test_id = db_test_id
        
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

            # Save to Disk and Upload
        return self._save_to_disk()

    def _save_to_disk(self) -> str:
        # Use simple timestamp: YYYYMMDD_HHMMSS
        timestamp = self.start_time.strftime("%Y%m%d_%H%M%S")
        safe_name = self.report.test_info.name.replace(' ', '_')
        filename = f"report_{safe_name}_{timestamp}.json"
        
        filepath = os.path.join(REPORT_DIR, filename)
        
        json_content = self.report.model_dump_json(indent=2)
        with open(filepath, 'w') as f:
            f.write(json_content)
            
        print(f"[Report] Saved to {filepath}")
        
        # Upload to Supabase and cleanup on success
        upload_success = self._upload_to_supabase(filename, json_content)
        
        # Delete local file after successful upload
        if upload_success:
            try:
                os.remove(filepath)
                print(f"[Report] Cleaned up local file: {filename}")
            except Exception as e:
                print(f"[Report] Failed to delete local file: {e}")
        
        return filename

    def _upload_to_supabase(self, filename: str, content: str) -> bool:
        """Upload report to Supabase Storage and insert record in test_runs table.
        Returns True if successful, False otherwise."""
        try:
            from app.core.supabase import get_supabase
            client = get_supabase()
            
            # 1. Upload JSON as Blob
            blob = content.encode('utf-8')
            client.storage.from_("test-reports").upload(filename, blob)
            print(f"[Report] Uploaded {filename} to Supabase Storage")
            
            # 2. Insert Run Record
            if self.db_test_id:
                run_data = {
                    "test_id": self.db_test_id,
                    "status": self.report.summary.overall_result,
                    "report_path": filename,
                    "duration_s": self.report.execution_info.duration_s,
                    "executed_at": self.report.execution_info.ended_at
                }
                client.table("test_runs").insert(run_data).execute()
                print(f"[Report] Inserted run record for test {self.db_test_id}")
            else:
                print("[Report] Skipping DB insert (no db_test_id provided)")
            
            return True
            
        except Exception as e:
            print(f"[Report] Failed to upload to Supabase: {e}")
            return False

