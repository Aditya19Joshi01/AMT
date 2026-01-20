from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class TestInfo(BaseModel):
    name: str
    version: str = "1.0"
    author: str = "Unknown"
    description: Optional[str] = None

class ExecutionInfo(BaseModel):
    test_id: str
    started_at: str
    ended_at: Optional[str] = None
    duration_s: float = 0.0
    status: str = "PENDING"  # PENDING, RUNNING, PASS, FAIL, ABORTED
    environment: str = "SIMULATION"

class StepResult(BaseModel):
    step: str
    description: str
    status: str = "PENDING"
    started_at: str
    ended_at: Optional[str] = None
    input_params: Dict[str, Any] = Field(default_factory=dict)
    observed: Optional[Dict[str, Any]] = None
    failure_details: Optional[Dict[str, Any]] = None

class AppSummary(BaseModel):
    overall_result: str = "PENDING"
    passed_steps: int = 0
    failed_steps: int = 0
    failure_reason: Optional[str] = None

class AppMetrics(BaseModel):
    max_temperature_c: float = 0.0
    avg_speed_rpm: float = 0.0
    test_duration_s: float = 0.0

class TestReport(BaseModel):
    test_info: TestInfo
    execution_info: ExecutionInfo
    summary: AppSummary
    steps: List[StepResult] = Field(default_factory=list)
    metrics: AppMetrics = Field(default_factory=AppMetrics)
    artifacts: Dict[str, Any] = Field(default_factory=dict)
