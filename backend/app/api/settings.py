from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.repository import SettingsRepository
from app.config import settings

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class SettingsUpdateModel(BaseModel):
    CPU_ALERT_THRESHOLD: Optional[float] = Field(None, ge=10.0, le=100.0)
    RAM_ALERT_THRESHOLD: Optional[float] = Field(None, ge=10.0, le=100.0)
    DISK_ALERT_THRESHOLD: Optional[float] = Field(None, ge=10.0, le=100.0)
    SWAP_ALERT_THRESHOLD: Optional[float] = Field(None, ge=10.0, le=100.0)
    MAX_HISTORY_DAYS: Optional[int] = Field(None, ge=1, le=90)
    DEFAULT_COLLECTION_INTERVAL: Optional[float] = Field(None, ge=0.5, le=10.0)

@router.get("")
def read_settings(db: Session = Depends(get_db)):
    """Retrieve runtime settings and alert thresholds."""
    stored = SettingsRepository.get_all_settings(db)
    return {
        "CPU_ALERT_THRESHOLD": float(stored.get("CPU_ALERT_THRESHOLD", settings.CPU_ALERT_THRESHOLD)),
        "RAM_ALERT_THRESHOLD": float(stored.get("RAM_ALERT_THRESHOLD", settings.RAM_ALERT_THRESHOLD)),
        "DISK_ALERT_THRESHOLD": float(stored.get("DISK_ALERT_THRESHOLD", settings.DISK_ALERT_THRESHOLD)),
        "SWAP_ALERT_THRESHOLD": float(stored.get("SWAP_ALERT_THRESHOLD", settings.SWAP_ALERT_THRESHOLD)),
        "MAX_HISTORY_DAYS": int(stored.get("MAX_HISTORY_DAYS", settings.MAX_HISTORY_DAYS)),
        "DEFAULT_COLLECTION_INTERVAL": float(stored.get("DEFAULT_COLLECTION_INTERVAL", settings.DEFAULT_COLLECTION_INTERVAL)),
    }

@router.put("")
def update_settings(payload: SettingsUpdateModel, db: Session = Depends(get_db)):
    """Update system monitor settings and thresholds."""
    updated = {}
    data_dict = payload.model_dump(exclude_unset=True)
    
    for k, v in data_dict.items():
        if v is not None:
            SettingsRepository.set_setting(db, k, str(v))
            updated[k] = v

    return {
        "success": True,
        "message": "Settings updated successfully.",
        "updated": updated
    }

