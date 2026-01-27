import yaml
import time
import sys
import os
from datetime import datetime
from typing import Dict, Any, List

# Ensure we can import modules
from app.services.controller.controller import MotorController
from app.services.reporting.generator import ReportBuilder
from app.services.reporting.models import StepResult

class TestRunner:
    def __init__(self, controller: MotorController):
        self.controller = controller
        self.aborted = False
        self.builder = ReportBuilder()
        # Global stat trackers
        self.max_temp = 0.0
        self.speed_samples = []

    def load_sequence(self, yaml_path: str) -> Dict[str, Any]:
        """Loads and validates the test sequence from YAML."""
        with open(yaml_path, 'r') as f:
            data = yaml.safe_load(f)
        return data

    def run(self, yaml_path: str, db_test_id: str = None):
        """Main entry point to execute a test."""
        print(f"--- Loading Test: {yaml_path} ---")
        config = self.load_sequence(yaml_path)
        
        test_info = config.get("test_info", {})
        name = test_info.get("name", "Unnamed Test")
        desc = test_info.get("description", "")
        author = test_info.get("author", "Unknown")
        
        # Start Report
        self.builder.start_test(name, desc, author, db_test_id=db_test_id)
        
        sequence = config.get("sequence", [])
        
        failure_reason = None
        status = "PASS"
        
        try:
            for i, step in enumerate(sequence):
                if self.aborted:
                    print("Test execution aborted.")
                    status = "ABORTED"
                    failure_reason = "User aborted"
                    break
                
                step_type = step.get("step")
                description = step.get("description", f"Step {i+1}")
                print(f"\n[Step {i+1}] {step_type}: {description}")
                
                # Step Timing
                step_start_iso = datetime.utcnow().isoformat()
                
                # Execute
                obs_data = {} # To hold any observed metrics
                fail_details = None
                step_status = "PASS"
                
                try:
                    obs_data = self._execute_step(step) or {}
                except Exception as e:
                    step_status = "FAIL"
                    fail_details = {"error": str(e)}
                    # Re-raise to stop the whole test
                    raise e
                finally:
                    # Record Step Result
                    res = StepResult(
                        step=step_type,
                        description=description,
                        status=step_status,
                        started_at=step_start_iso,
                        ended_at=datetime.utcnow().isoformat(),
                        input_params=step,
                        observed=obs_data,
                        failure_details=fail_details
                    )
                    self.builder.add_step_result(res)
                
            print("\n" + "="*30)
            print("TEST COMPLETE: SUCCESS")
            print("="*30)
            
        except Exception as e:
            print(f"\n[ERROR] Test Failed at step '{step_type}': {e}")
            self.controller.stop_motor()
            status = "FAIL"
            failure_reason = str(e)
            
        finally:
            # Calculate final stats
            avg_speed = sum(self.speed_samples) / len(self.speed_samples) if self.speed_samples else 0.0
            stats = {
                "max_temp": self.max_temp,
                "avg_speed": avg_speed
            }
            self.builder.finish_test(status, failure_reason, stats)

    def _execute_step(self, step: Dict[str, Any]) -> Dict[str, Any]:
        """Returns observed data if applicable."""
        step_type = step.get("step")
        observed = {}
        
        if step_type == "start_motor":
            self.controller.start_motor()
            
        elif step_type == "set_speed":
            rpm = float(step.get("rpm", 0))
            self.controller.set_speed(rpm)
            
        elif step_type == "apply_load":
            load = float(step.get("load_nm", 0))
            self.controller.set_load(load)
            
        elif step_type == "remove_load":
            self.controller.set_load(0.0)
            
        elif step_type == "stop_motor":
            self.controller.stop_motor()
            
        elif step_type == "wait":
            duration = float(step.get("duration_s", 1.0))
            print(f"  -> Waiting {duration}s...")
            time.sleep(duration)
            
        elif step_type == "monitor":
            observed = self._monitor_step(step)
            
        elif step_type == "end_test":
            print("  -> End of Sequence.")
            
        else:
            print(f"  [WARNING] Unknown step type: {step_type}")
            
        return observed

    def _monitor_step(self, step: Dict[str, Any]) -> Dict[str, Any]:
        duration = float(step.get("duration_s", 5.0))
        criteria = step.get("criteria", {})
        
        print(f"  -> Monitoring for {duration}s... Criteria: {criteria}")
        
        start_time = time.time()
        
        # Local stats for this specific step
        min_speed = float('inf')
        max_speed_local = float('-inf')
        max_temp_local = float('-inf')
        
        while time.time() - start_time < duration:
            status = self.controller.get_status()
            speed = status["speed_rpm"]
            temp = status["temperature_c"]
            
            # Global tracking
            self.speed_samples.append(speed)
            self.max_temp = max(self.max_temp, temp)
            
            # Local tracking
            min_speed = min(min_speed, speed)
            max_speed_local = max(max_speed_local, speed)
            max_temp_local = max(max_temp_local, temp)
            
            # Check Criteria
            if "speed_rpm" in criteria:
                limits = criteria["speed_rpm"]
                if "min" in limits and speed < limits["min"]:
                    raise RuntimeError(f"Speed Violation: {speed:.2f} < {limits['min']}")
                if "max" in limits and speed > limits["max"]:
                    raise RuntimeError(f"Speed Violation: {speed:.2f} > {limits['max']}")
            
            if "temperature_c" in criteria:
                limits = criteria["temperature_c"]
                if "max" in limits and temp > limits["max"]:
                    raise RuntimeError(f"Temp Violation: {temp:.2f} > {limits['max']}")
            
            time.sleep(0.1)
        
        print("  -> Validation PASSED.")
        
        return {
            "speed_rpm": {"min": min_speed, "max": max_speed_local},
            "temperature_c": {"max": max_temp_local}
        }
