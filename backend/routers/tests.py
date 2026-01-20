import os
import threading
from typing import List
from fastapi import APIRouter, Depends
from ..dependencies import get_controller, get_test_state, TEST_DIR, TestState
from TestController.controller import MotorController
from TestEngine.test_engine import TestRunner

router = APIRouter(
    prefix="/tests",
    tags=["Test Engine"]
)

def _run_test_thread(filename: str, controller: MotorController, state: TestState):
    """Background worker to run the test."""
    state.running = True
    state.current_test = filename
    state.last_error = None
    
    runner = TestRunner(controller)
    filepath = os.path.join(TEST_DIR, filename)
    
    try:
        print(f"[API] Starting Test: {filename}")
        runner.run(filepath)
        print(f"[API] Test {filename} Completed Successfully")
    except Exception as e:
        print(f"[API] Test {filename} Failed: {e}")
        state.last_error = str(e)
    finally:
        state.running = False
        state.current_test = None

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
        "last_error": state.last_error
    }
