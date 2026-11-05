from fastapi import APIRouter
from app.monitor.network_monitor import network_monitor

router = APIRouter(prefix="/api/network", tags=["Network"])

@router.get("")
def read_network_metrics():
    """Retrieve aggregate bandwidth rates and per-interface metrics."""
    return network_monitor.get_network_metrics()

