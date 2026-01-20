from fastapi import APIRouter, Depends
from ..dependencies import get_controller
from TestController.controller import MotorController

router = APIRouter(
    prefix="/motor",
    tags=["Motor Control"]
)

@router.get("/status")
def get_status(controller: MotorController = Depends(get_controller)):
    """Get real-time motor telemetry."""
    return controller.get_status()

@router.post("/start")
def start_motor(controller: MotorController = Depends(get_controller)):
    """Start the motor physics loop."""
    controller.start_motor()
    return {"status": "Motor Started"}

@router.post("/stop")
def stop_motor(controller: MotorController = Depends(get_controller)):
    """Initiate Soft Stop."""
    controller.stop_motor()
    return {"status": "Motor Stopping..."}

@router.post("/speed/{rpm}")
def set_speed(rpm: float, controller: MotorController = Depends(get_controller)):
    """Set target speed in RPM."""
    controller.set_speed(rpm)
    return {"target_speed": rpm}

@router.post("/load/{nm}")
def set_load(nm: float, controller: MotorController = Depends(get_controller)):
    """Set mechanical load in Nm."""
    controller.set_load(nm)
    return {"target_load_nm": nm}
