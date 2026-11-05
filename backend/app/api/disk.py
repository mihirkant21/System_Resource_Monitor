from fastapi import APIRouter
from app.monitor.disk_monitor import disk_monitor

router = APIRouter(prefix="/api/disk", tags=["Disk"])

@router.get("")
def read_disk_metrics():
    """Retrieve partitions, storage usage, and instantaneous I/O speeds."""
    return disk_monitor.get_disk_metrics()

@router.get("/partitions")
def read_disk_partitions():
    """Retrieve only disk partitions and filesystem storage capacity."""
    return disk_monitor.get_partitions()

@router.get("/io")
def read_disk_io():
    """Retrieve disk I/O rates and read/write speeds."""
    return disk_monitor.get_io_stats()

