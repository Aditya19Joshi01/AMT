from fastapi import FastAPI
from contextlib import asynccontextmanager
from .dependencies import controller
from .routers import motor, tests, reports

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[System] Starting Motor Controller Loop...")
    controller.start_background_loop()
    yield
    # Shutdown
    print("[System] Stopping Motor Controller Loop...")
    controller.stop_background_loop()

app = FastAPI(
    title="Industrial Motor Test Bench",
    version="1.0.0",
    lifespan=lifespan
)

# Include Routers
app.include_router(motor.router)
app.include_router(tests.router)
app.include_router(reports.router)

@app.get("/")
def home():
    return {"system": "Motor Test Bench", "status": "ONLINE", "version": "1.0.0"}
