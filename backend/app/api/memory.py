from fastapi import APIRouter
from app.monitor.memory_monitor import get_memory_metrics

router = APIRouter(prefix="/api/memory", tags=["Memory"])

@router.get("")
def read_memory_metrics():
    """Retrieve virtual memory and swap statistics."""
    return get_memory_metrics()

