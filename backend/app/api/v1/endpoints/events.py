from fastapi import APIRouter, Query
from app.services.logger import logger

router = APIRouter(
    prefix="/events",
    tags=["Events"]
)

@router.get("")
def get_events(limit: int = Query(50, ge=1, le=100)):
    """Get recent system events."""
    return logger.get_logs(limit)
