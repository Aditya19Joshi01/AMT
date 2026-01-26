import os
from typing import List
from fastapi import APIRouter, HTTPException, Response
from app.services.reporting.generator import REPORT_DIR

router = APIRouter(
    prefix="/reports",
    tags=["Reporting"]
)

@router.get("/", response_model=List[str])
def list_reports():
    """List all generated test reports."""
    if not os.path.exists(REPORT_DIR):
        return []
    
    # Sort by modification time (newest first)
    files = [f for f in os.listdir(REPORT_DIR) if f.endswith(".json")]
    files.sort(key=lambda x: os.path.getmtime(os.path.join(REPORT_DIR, x)), reverse=True)
    return files

@router.get("/{filename}")
def get_report(filename: str):
    """Retrieve a specific report JSON."""
    filepath = os.path.join(REPORT_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Report not found")
        
    with open(filepath, 'r') as f:
        content = f.read()
        
    return Response(content=content, media_type="application/json")
