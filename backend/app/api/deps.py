import os
from app.services.controller.controller import MotorController

# 1. Motor Controller Singleton
# This must be shared across all request
controller = MotorController()

# 2. Test Engine State
class TestState:
    running = False
    current_test = None
    last_error = None
    # Progress tracking
    total_steps = 0
    current_step_index = 0
    current_step_name = ""
    last_completed = None # Stores result of last run: {status, test, time, error?}

test_state = TestState()

# 3. Directories
# Assuming run from root: /AMT/TestConfigs
# Adjust path if needed.
# Since we run `python -m backend.main` from root, root is CWD.
TEST_DIR = os.path.join(os.getcwd(), "configs")
if not os.path.exists(TEST_DIR):
    os.makedirs(TEST_DIR)

def get_controller() -> MotorController:
    return controller

def get_test_state() -> TestState:
    return test_state
