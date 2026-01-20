from fastapi import FastAPI
from contextlib import asynccontextmanager
from TestController.controller import MotorController

# Global instance
controller = MotorController()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start the physics loop
    controller.start_background_loop()
    yield
    # Shutdown: Stop the loop
    controller.stop_background_loop()

app = FastAPI(lifespan=lifespan)

@app.get("/")
def home():
    return {"message": "Motor Test Bench API is Online"}

@app.get("/status")
def get_status():
    return controller.get_status()

@app.post("/start")
def start_motor():
    controller.start_motor()
    return {"status": "Motor Started"}

@app.post("/stop")
def stop_motor():
    controller.stop_motor()
    return {"status": "Motor Stopped"}

@app.post("/speed/{rpm}")
def set_speed(rpm: float):
    controller.set_speed(rpm)
    return {"target_speed": rpm}

@app.post("/load/{nm}")
def set_load(nm: float):
    controller.set_load(nm)
    return {"target_load_nm": nm}
