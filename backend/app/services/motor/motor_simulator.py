import time
from dataclasses import dataclass
from typing import Optional

@dataclass
class MotorProfile:
    rated_speed_rpm: float
    max_temp_c: float
    inertia: float
    thermal_resistance: float


@dataclass
class MotorInputs:
    target_speed_rpm: float = 0.0
    load_nm: float = 0.0
    ambient_temp_c: float = 25.0


@dataclass
class MotorState:
    speed_rpm: float = 0.0
    torque_nm: float = 0.0
    temperature_c: float = 25.0
    running: bool = False


class MotorSimulator:
    def __init__(self, profile: MotorProfile, update_dt: float = 0.1):
        self.profile = profile
        self.inputs = MotorInputs()
        self.state = MotorState(temperature_c=25.0)
        self.dt = update_dt
        self.fault: Optional[str] = None

    def start(self):
        self.state.running = True

    def stop(self):
        self.state.running = False
        self.inputs.target_speed_rpm = 0.0

    def set_target_speed(self, rpm: float):
        self.inputs.target_speed_rpm = rpm

    def set_load(self, load_nm: float):
        self.inputs.load_nm = load_nm

    def inject_fault(self, fault_name: str):
        self.fault = fault_name

    def clear_fault(self):
        self.fault = None

    def update(self):
        if not self.state.running:
            return

        # Speed dynamics
        speed_error = self.inputs.target_speed_rpm - self.state.speed_rpm
        accel = speed_error / self.profile.inertia
        accel -= self.inputs.load_nm * 0.1
        self.state.speed_rpm += accel * self.dt

        # Clamp speed
        self.state.speed_rpm = max(0.0, self.state.speed_rpm)

        # Torque approximation
        self.state.torque_nm = self.inputs.load_nm

        # Temperature dynamics
        heat_generated = abs(self.state.speed_rpm) * 0.002 + self.inputs.load_nm * 0.05
        heat_dissipated = (
            (self.state.temperature_c - self.inputs.ambient_temp_c)
            / self.profile.thermal_resistance
        )

        self.state.temperature_c += (heat_generated - heat_dissipated) * self.dt

        # Fault behavior
        if self.fault == "overheat":
            self.state.temperature_c += 2.0 * self.dt

        if self.state.temperature_c > self.profile.max_temp_c:
            self.stop()

    def snapshot(self) -> dict:
        return {
            "speed_rpm": round(self.state.speed_rpm, 2),
            "torque_nm": round(self.state.torque_nm, 2),
            "temperature_c": round(self.state.temperature_c, 2),
            "running": self.state.running,
            "fault": self.fault,
        }


if __name__ == "__main__":
    profile = MotorProfile(
        rated_speed_rpm=3000,
        max_temp_c=120,
        inertia=10.0,
        thermal_resistance=30.0,
    )

    motor = MotorSimulator(profile)
    motor.start()
    motor.set_target_speed(2000)
    motor.set_load(5.0)

    for _ in range(100):
        motor.update()
        print(motor.snapshot())
        time.sleep(motor.dt)

