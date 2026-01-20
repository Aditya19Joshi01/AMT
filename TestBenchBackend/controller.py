import threading
import time
import sys
import os


current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, ".."))
simulator_path = os.path.join(project_root, "MotorSimulator")

if simulator_path not in sys.path:
    sys.path.append(simulator_path)

try:
    from motor_simulator import MotorSimulator, MotorProfile
except ImportError as e:
    print(f"CRITICAL: Could not import MotorSimulator. Checked path: {simulator_path}")
    raise e

class MotorController:
    """
    A simple controller that manages the MotorSimulator in a background thread.
    Use this to start/stop the motor and get its status.
    """
    def __init__(self):
        # 1. Setup the Motor Physics
        self.profile = MotorProfile(
            rated_speed_rpm=3000,
            max_temp_c=120,
            inertia=10.0,
            thermal_resistance=30.0
        )
        self.motor = MotorSimulator(self.profile, update_dt=0.1)
        
        # 2. Threading Control
        self.running = False
        self.thread = None
        self.stop_event = threading.Event()

    def start_background_loop(self):
        """Starts the background thread that simulates physics."""
        if self.running:
            return
        
        self.running = True
        self.stop_event.clear()
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()
        print("[Controller] Background physics loop started.")

    def stop_background_loop(self):
        """Stops the background physics thread."""
        self.running = False
        self.stop_event.set()
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1.0)
        print("[Controller] Background physics loop stopped.")

    def _loop(self):
        """The actual loop running at 10Hz (0.1s)."""
        while not self.stop_event.is_set():
            # Tick the physics engine
            self.motor.update()
            
            # TODO: Here we will later add 'Test Sequence' logic
            
            # Sleep to maintain roughly 10Hz
            time.sleep(self.motor.dt)

    # --- Public API ---

    def start_motor(self):
        self.motor.start()

    def stop_motor(self):
        self.motor.stop()

    def set_speed(self, rpm: float):
        self.motor.set_target_speed(rpm)

    def get_status(self):
        return self.motor.snapshot()
