from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.repository import AlertRepository

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("")
def read_alerts(limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    """Retrieve recent alert notifications and active threshold breach events."""
    alerts = AlertRepository.get_recent_alerts(db, limit=limit)
    return {
        "count": len(alerts),
        "alerts": [a.to_dict() for a in alerts]
    }

@router.post("/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    """Manually mark an active alert as resolved."""
    alert = AlertRepository.resolve_alert(db, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert {alert_id} not found."
        )
    return {
        "success": True,
        "alert": alert.to_dict()
    }

@router.delete("")
def clear_all_alerts(
    confirm: bool = Query(False, description="Must be set to true to clear all alerts"),
    db: Session = Depends(get_db)
):
    """Clear all alert records from history."""
    if not confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Clearing alerts requires explicit confirmation ('confirm=true')."
        )
    deleted_count = AlertRepository.clear_alerts(db)
    return {
        "success": True,
        "message": f"Successfully deleted {deleted_count} alert records."
    }

