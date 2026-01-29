import os
import threading
import time
from typing import List
from fastapi import APIRouter, Depends
from app.api.deps import get_controller, get_test_state, TEST_DIR, TestState
from app.services.controller.controller import MotorController
from app.services.engine.test_engine import TestRunner
from pydantic import BaseModel
from app.core.supabase import get_supabase
import uuid

router = APIRouter(
    prefix="/tests",
    tags=["Test Engine"]
)

def _run_test_thread(filename: str, controller: MotorController, state: TestState, db_test_id: str = None, test_name: str = None):
    """Background worker to run the test."""
    state.running = True
    state.current_test = test_name or filename
    state.last_error = None
    state.current_step_index = 0
    state.total_steps = 0
    state.current_step_name = "Initializing..."
    
    runner = TestRunner(controller)
    filepath = os.path.join(TEST_DIR, filename)

    def progress_callback(index, total, name):
        state.current_step_index = index + 1
        state.total_steps = total
        state.current_step_name = name
    
    try:
        print(f"[API] Starting Test: {filename}")
        runner.run(filepath, db_test_id=db_test_id, progress_callback=progress_callback)
        print(f"[API] Test {filename} Completed Successfully")
        state.current_step_index = state.total_steps # Ensure 100% at end
        state.last_completed = {
            "status": "PASS",
            "test": test_name or filename,
            "time": time.time()
        }
    except Exception as e:
        print(f"[API] Test {filename} Failed: {e}")
        state.last_error = str(e)
        state.last_completed = {
            "status": "FAIL",
            "test": test_name or filename,
            "time": time.time(),
            "error": str(e)
        }
    finally:
        state.running = False
        state.current_test = None
        state.current_step_name = ""
        
        # Cleanup temp file
        if filename.startswith("temp_") and os.path.exists(filepath):
            try:
                os.remove(filepath)
                print(f"[API] Cleaned up temp file: {filename}")
            except Exception as e:
                print(f"[API] Failed to cleanup temp file: {e}")


@router.get("/")
def list_tests() -> List[str]:
    """List available YAML test files."""
    if not os.path.exists(TEST_DIR):
        return []
    files = [f for f in os.listdir(TEST_DIR) if f.endswith(".yaml") or f.endswith(".yml")]
    return files

@router.post("/run/{filename}")
def run_test(
    filename: str, 
    controller: MotorController = Depends(get_controller),
    state: TestState = Depends(get_test_state)
):
    """Trigger a test execution in the background."""
    if state.running:
        return {"status": "error", "message": f"Test '{state.current_test}' is already running"}
    
    filepath = os.path.join(TEST_DIR, filename)
    if not os.path.exists(filepath):
        return {"status": "error", "message": "File not found"}

    # Start background thread
    t = threading.Thread(
        target=_run_test_thread, 
        args=(filename, controller, state), 
        daemon=True
    )
    t.start()
    
    return {"status": "started", "test": filename}

@router.get("/active")
def get_active_test(state: TestState = Depends(get_test_state)):
    """Check if a test is currently running."""
    return {
        "running": state.running,
        "test": state.current_test,
        "last_error": state.last_error,
        "current_step": state.current_step_index,
        "total_steps": state.total_steps,
        "step_name": state.current_step_name,
        "last_completed": state.last_completed
    }

class TestExecutionRequest(BaseModel):
    test_id: str
    storage_path: str
    test_name: str = "Unknown Test"

@router.post("/execute")
def execute_test(
    request: TestExecutionRequest,
    controller: MotorController = Depends(get_controller),
    state: TestState = Depends(get_test_state)
):
    """Trigger a cloud-hosted test execution."""
    if state.running:
        return {"status": "error", "message": f"Test '{state.current_test}' is already running"}
    
    # Download file from Supabase
    try:
        supabase = get_supabase()
        temp_filename = f"temp_{uuid.uuid4().hex}.yaml"
        local_path = os.path.join(TEST_DIR, temp_filename)
        
        print(f"[API] Downloading test {request.storage_path} to {local_path}")
        with open(local_path, 'wb') as f:
            res = supabase.storage.from_("test-files").download(request.storage_path)
            f.write(res)
            
    except Exception as e:
        print(f"[API] Failed to download test: {e}")
        return {"status": "error", "message": f"Failed to download test: {str(e)}"}

    # Start background thread
    t = threading.Thread(
        target=_run_test_thread, 
        args=(temp_filename, controller, state, request.test_id, request.test_name), 
        daemon=True
    )
    t.start()
    
    return {"status": "started", "test": request.storage_path, "local_temp": temp_filename}
