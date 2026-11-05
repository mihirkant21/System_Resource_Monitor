from fastapi import APIRouter
from app.monitor.system_info import get_system_information

router = APIRouter(prefix="/api/system", tags=["System"])

@router.get("/info")
def read_system_info():
    """Retrieve host operating system, architecture, uptime, and kernel info."""
    return get_system_information()

