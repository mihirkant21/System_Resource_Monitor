from fastapi import APIRouter
from app.monitor.cpu_monitor import cpu_monitor

router = APIRouter(prefix="/api/cpu", tags=["CPU"])

@router.get("")
def read_cpu_metrics():
    """Retrieve overall CPU usage, per-core percentages, frequency, and core counts."""
    return cpu_monitor.get_cpu_metrics()

