from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.repository import MetricsRepository
from app.services.analytics import analytics_service

router = APIRouter(prefix="/api/history", tags=["Historical Analytics"])

@router.get("")
def read_history(
    start_time: Optional[datetime] = Query(None, description="Start UTC timestamp (ISO 8601)"),
    end_time: Optional[datetime] = Query(None, description="End UTC timestamp (ISO 8601)"),
    limit: int = Query(500, ge=10, le=5000),
    db: Session = Depends(get_db)
):
    """Retrieve historical time-series resource utilization data."""
    records = MetricsRepository.get_history(db, start_time=start_time, end_time=end_time, limit=limit)
    return {
        "count": len(records),
        "data": [r.to_dict() for r in records]
    }

@router.get("/summary")
def read_history_summary(
    start_time: Optional[datetime] = Query(None, description="Start UTC timestamp (ISO 8601)"),
    end_time: Optional[datetime] = Query(None, description="End UTC timestamp (ISO 8601)"),
    db: Session = Depends(get_db)
):
    """Retrieve summary performance statistics (avg, min, max, peak timestamp)."""
    return analytics_service.get_performance_summary(db, start_time, end_time)

@router.get("/export")
def export_history_csv(
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """Export historical metrics as a downloadable CSV spreadsheet."""
    csv_content = analytics_service.export_csv(db, start_time, end_time)
    filename = f"system_metrics_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.delete("")
def clear_history_data(
    confirm: bool = Query(False, description="Must be set to true to clear all historical metrics"),
    db: Session = Depends(get_db)
):
    """Clear all historical system metrics records from the SQLite database."""
    if not confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Clearing history requires explicit confirmation ('confirm=true')."
        )
    deleted_count = MetricsRepository.clear_all_history(db)
    return {
        "success": True,
        "message": f"Successfully cleared {deleted_count} historical metric records."
    }
