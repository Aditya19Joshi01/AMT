# AMT - Industrial Motor Test Bench

**Automated Motor Testing (AMT)** is a comprehensive platform designed to simulate, control, and validate industrial motor performance. It combines a first-principles physics digital twin with a modern web dashboard, enabling engineers to test control logic and safety systems without needing physical hardware.

## 🚀 What Problem Does This Solve?
Developing control software for industrial motors requires rigourous testing. However:
- **Hardware is expensive**: Blowing up an inverter or overheating a motor during testing is costly.
- **Testing is slow**: Setting up physical test benches takes time.
- **Edge cases are dangerous**: pushing a motor to thermal failure in the real world is risky.

**AMT** solves this by providing a determinstic, physics-based simulation of a motor (Digital Twin) that behaves exactly like the real thing—inertia, thermal dynamics, friction, and all. You can write tests, inject faults (e.g., "overheat"), and verify your system's response safely.

## ✨ Key Features

### 🧠 First-Principles Digital Twin
A deterministic "Video Game Engine" for motors. It simulates:
- **Physics**: Inertia, torque, and acceleration logic `(F = ma)`.
- **Thermals**: Heating from current/friction and cooling dynamics.
- **Time**: Discrete time integration for frame-perfect simulation.

### 🖥️ Modern Command Dashboard
A full-featured web interface optimized for control:
- **Real-time Telemetry**: Live graphs of speed, temperature, and current.
- **Interactive Control**: Set target speeds, load profiles, and safety limits.
- **Event Logging**: System-wide event tracking for debugging.

### 📊 Automated Reports
- Run automated test sequences.
- Generate detailed PDF reports with `WeasyPrint`.
- Track pass/fail history over time.

## 🛠️ Tech Stack

- **Backend**: Python, FastAPI, Supabase (Postgres/Auth), WeasyPrint.
- **Frontend**: Next.js 16, React 19, Tailwind CSS, Radix UI, Recharts.
- **Infrastructure**: Docker & Docker Compose for one-command startup.

## 🏁 Getting Started

### Prerequisites
- Docker & Docker Compose installed on your machine.

### Installation
1. Clone the repository.
   ```bash
   git clone <your-repo-url>
   cd AMT
   ```

2. Start the system.
   ```bash
   docker-compose up --build
   ```

3. Access the dashboard.
   - **Frontend**: `http://localhost:3000`
   - **API Docs**: `http://localhost:8000/docs`

## 📂 Project Structure

- `backend/`: FastAPI application.
    - `app/services/motor/`: The core physics engine (Digital Twin).
    - `app/api/`: REST endpoints.
- `frontend/`: Next.js web application.
    - `components/`: Reusable UI components.
    - `app/`: Application pages and routing.
