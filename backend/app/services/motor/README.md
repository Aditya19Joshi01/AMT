# Motor Simulator Core ⚡

This project represents a **First-Principles Digital Twin** of an electric motor. It is designed to be a deterministic "plant model" for testing control software, dashboards, and safety systems.

## 🧠 The Mental Model

Think of this simulator not as a script that runs once, but as a **Video Game Engine** for a motor.
It runs in a continuous loop. In every "frame" (time step), it calculates how much the physical world changes based on the inputs.

### The Feedback Loop
1.  **Inputs**: You tell it what you *want* (Target Speed) or what is happening to it (Load).
2.  **Physics Engine**: It calculates forces (Acceleration, Heating, Cooling).
3.  **State Update**: It updates the reality (Current Speed, Current Temp) for the next frame.

---

## ⚙️ How it Works: The Math

The simulation uses **Discrete Time Integration**. This means we calculate the change for a tiny slice of time (e.g., `dt = 0.1` seconds) and add it to the current total.

### 1. Speed & Inertia
Real motors don't change speed instantly; they have **Inertia** (resistance to change in motion).

*   **Logic**: `Speed Change = (Force / Mass) * Time`
*   **Formula**:
    ```python
    speed_error = Target_Speed - Current_Speed
    acceleration = speed_error / Inertia
    Next_Speed = Current_Speed + (acceleration * dt)
    ```
    *   *Intuition*: If you have high Inertia (heavy flywheel), `acceleration` is small, so `Next_Speed` creeps up slowly.

### 2. Temperature Dynamics
The motor produces heat from working and loses heat to the air.

*   **Heating**: `Heat_Gen = (Speed * Friction) + (Load * Current)`
*   **Cooling**: `Heat_Loss = (Current_Temp - Ambient_Temp) / Thermal_Resistance`
*   **Formula**:
    ```python
    Temp_Change = (Heat_Gen - Heat_Loss) * dt
    Next_Temp = Current_Temp + Temp_Change
    ```
    *   *Intuition*: If `Heat_Gen` > `Heat_Loss`, the motor gets hotter. Eventually, they balance out (Stable Temp).

---

## 📝 Example Walkthrough

Let's look at 3 discrete steps of the simulator to see the data generate.

**Setup**:
*   `dt` = 0.1 seconds
*   `Inertia` = 10.0
*   `Target Speed` = 100 RPM (We just turned it on)

| Step | Time | Current Speed | Target | speed_error | Accel (Error/10) | New Speed (Speed + Accel*0.1) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **0** | 0.0s | **0.0 RPM** | 100 | 100 | 10.0 | **1.0 RPM** |
| **1** | 0.1s | **1.0 RPM** | 100 | 99 | 9.9 | **1.99 RPM** |
| **2** | 0.2s | **1.99 RPM** | 100 | 98.01 | 9.8 | **2.97 RPM** |

> **Notice**: The speed doesn't jump to 100. It ramps up curve-like. This is exactly how physical objects behave.

---

## 💻 Usage

The simulator is a Python class you can import and control programmatically.

```python
from motor_simulator import MotorSimulator, MotorProfile

# 1. Define the Physics
profile = MotorProfile(
    rated_speed_rpm=3000,
    inertia=10.0,          # Higher = Slower acceleration
    thermal_resistance=30  # Higher = Holds heat longer
)

# 2. Create the Twin
motor = MotorSimulator(profile)
motor.start()

# 3. Apply Inputs
motor.set_target_speed(1000)
motor.set_load(5.0)

# 4. Run the Loop
import time
while True:
    motor.update()           # Advance physics by 0.1s
    print(motor.snapshot())  # Get telemetry
    time.sleep(0.1)          # Wait for real time (optional)
```

## 🛠 Features for Validation
*   **Deterministic**: Running this script twice with the same inputs produces bit-exact identical logs.
*   **Fault Injection**: You can force failure modes to test your error handling.
    ```python
    motor.inject_fault("overheat") # Forces temp to rise rapidly
    ```
