import os
from typing import List
from fastapi import APIRouter, HTTPException, Response
from app.services.reporting.generator import REPORT_DIR
from app.core.supabase import get_supabase
import json
from datetime import datetime
from jinja2 import Template
from weasyprint import HTML

router = APIRouter(
    prefix="/reports",
    tags=["Reporting"]
)

@router.get("/")
def list_reports():
    """List all generated test reports (local files - legacy)."""
    if not os.path.exists(REPORT_DIR):
        return []
    
    # Sort by modification time (newest first)
    files = [f for f in os.listdir(REPORT_DIR) if f.endswith(".json")]
    files.sort(key=lambda x: os.path.getmtime(os.path.join(REPORT_DIR, x)), reverse=True)
    return files

@router.get("/local/{filename}")
def get_local_report(filename: str):
    """Retrieve a specific report JSON from local storage."""
    filepath = os.path.join(REPORT_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Report not found")
        
    with open(filepath, 'r') as f:
        content = f.read()
        
    return Response(content=content, media_type="application/json")

@router.get("/list")
def list_reports_from_db():
    """Fetch all test runs from Supabase test_runs table."""
    try:
        client = get_supabase()
        
        # Fetch test runs with test definition info
        response = client.table("test_runs") \
            .select("*, test_definitions(name, description)") \
            .order("executed_at", desc=True) \
            .execute()
        
        # Transform data for frontend
        reports = []
        for run in response.data:
            test_def = run.get("test_definitions", {})
            reports.append({
                "id": run["id"],
                "test_id": run["test_id"],
                "test_name": test_def.get("name", "Unknown Test") if test_def else "Unknown Test",
                "status": run["status"],
                "executed_at": run["executed_at"],
                "duration_s": run.get("duration_s", 0),
                "report_path": run["report_path"]
            })
        
        return reports
    except Exception as e:
        print(f"[API] Failed to fetch reports: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{report_path}")
def download_report(report_path: str):
    """Download a specific report JSON from Supabase Storage."""
    try:
        client = get_supabase()
        
        # Download from storage
        data = client.storage.from_("test-reports").download(report_path)
        
        # Convert bytes to string
        content = data.decode('utf-8')
        
        return Response(content=content, media_type="application/json")
    except Exception as e:
        print(f"[API] Failed to download report: {e}")
        raise HTTPException(status_code=404, detail="Report not found")

@router.get("/export/{report_path}/pdf")
def export_report_pdf(report_path: str):
    """Generate and download PDF report from JSON stored in Supabase."""
    try:
        client = get_supabase()
        
        # 1. Download JSON from storage
        print(f"[PDF Export] Fetching report: {report_path}")
        data = client.storage.from_("test-reports").download(report_path)
        report_json = json.loads(data.decode('utf-8'))
        
        # 2. Load HTML template
        template_path = os.path.join(os.path.dirname(__file__), "../../../../templates/report_template.html")
        with open(template_path, 'r', encoding='utf-8') as f:
            template_str = f.read()
        
        # 3. Render template with report data
        template = Template(template_str)
        html_content = template.render(
            report=report_json,
            generation_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        
        # 4. Generate PDF
        print(f"[PDF Export] Generating PDF...")
        pdf_bytes = HTML(string=html_content).write_pdf()
        
        # 5. Return PDF as download
        filename = report_path.replace('.json', '.pdf')
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        print(f"[PDF Export] Failed: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

