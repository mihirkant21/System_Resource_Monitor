import platform
import time
import os
from datetime import datetime, timezone
import psutil

def get_system_information() -> dict:
    boot_time_ts = psutil.boot_time()
    boot_time = datetime.fromtimestamp(boot_time_ts, tz=timezone.utc).isoformat()
    uptime_seconds = int(time.time() - boot_time_ts)
    
    days = uptime_seconds // 86400
    hours = (uptime_seconds % 86400) // 3600
    minutes = (uptime_seconds % 3600) // 60
    seconds = uptime_seconds % 60
    uptime_str = f"{days}d {hours}h {minutes}m {seconds}s" if days > 0 else f"{hours}h {minutes}m {seconds}s"

    try:
        total_processes = len(psutil.pids())
    except Exception:
        total_processes = 0

    return {
        "hostname": platform.node(),
        "os_name": platform.system(),
        "os_release": platform.release(),
        "os_version": platform.version(),
        "architecture": platform.machine(),
        "processor": platform.processor(),
        "python_version": platform.python_version(),
        "boot_time": boot_time,
        "uptime_seconds": uptime_seconds,
        "uptime_formatted": uptime_str,
        "process_count": total_processes,
    }

