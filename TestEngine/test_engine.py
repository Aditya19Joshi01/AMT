import yaml
import time
import sys
import os
from typing import Dict, Any, List

# Ensure we can import the controller
# Structure:
# /AMT
#   /TestEngine/test_engine.py
#   /TestController/controller.py
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, ".."))
if project_root not in sys.path:
    sys.path.append(project_root)

from TestController.controller import MotorController

class TestRunner:
    def __init__(self, controller: MotorController):
        self.controller = controller
        self.aborted = False

    def load_sequence(self, yaml_path: str) -> Dict[str, Any]:
        """Loads and validates the test sequence from YAML."""
        with open(yaml_path, 'r') as f:
            data = yaml.safe_load(f)
        return data

    def run(self, yaml_path: str):
        """Main entry point to execute a test."""
        print(f"--- Loading Test: {yaml_path} ---")
        config = self.load_sequence(yaml_path)
        
        test_info = config.get("test_info", {})
        print(f"Test Name: {test_info.get('name')}")
        print(f"Description: {test_info.get('description')}")
        print("-" * 30)

        sequence = config.get("sequence", [])
        
        try:
            for i, step in enumerate(sequence):
                if self.aborted:
                    print("Test execution aborted.")
                    break
                
                step_type = step.get("step")
                description = step.get("description", f"Step {i+1}")
                print(f"\n[Step {i+1}] {step_type}: {description}")
                
                self._execute_step(step)
                
            print("\n" + "="*30)
            print("TEST COMPLETE: SUCCESS")
            print("="*30)
            
        except Exception as e:
            print(f"\n[ERROR] Test Failed at step '{step_type}': {e}")
            self.controller.stop_motor()
            raise e

    def _execute_step(self, step: Dict[str, Any]):
        step_type = step.get("step")
        
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
            self._monitor_step(step)
            
        elif step_type == "end_test":
            print("  -> End of Sequence.")
            
        else:
            print(f"  [WARNING] Unknown step type: {step_type}")

    def _monitor_step(self, step: Dict[str, Any]):
        duration = float(step.get("duration_s", 5.0))
        criteria = step.get("criteria", {})
        
        print(f"  -> Monitoring for {duration}s... Criteria: {criteria}")
        
        start_time = time.time()
        while time.time() - start_time < duration:
            status = self.controller.get_status()
            
            # Check Criteria
            # Speed
            if "speed_rpm" in criteria:
                limits = criteria["speed_rpm"]
                val = status["speed_rpm"]
                if "min" in limits and val < limits["min"]:
                    raise RuntimeError(f"Speed Violation: {val} < {limits['min']}")
                if "max" in limits and val > limits["max"]:
                    raise RuntimeError(f"Speed Violation: {val} > {limits['max']}")
            
            # Temp
            if "temperature_c" in criteria:
                limits = criteria["temperature_c"]
                val = status["temperature_c"]
                if "max" in limits and val > limits["max"]:
                    raise RuntimeError(f"Temp Violation: {val} > {limits['max']}")
            
            time.sleep(0.1)
        
        print("  -> Validation PASSED.")
