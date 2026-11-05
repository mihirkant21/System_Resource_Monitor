import time
import psutil
from typing import Dict, Any, List

class DiskMonitor:
    def __init__(self):
        self.last_time = time.time()
        try:
            self.last_io = psutil.disk_io_counters()
        except Exception:
            self.last_io = None

    def get_partitions(self) -> List[Dict[str, Any]]:
        partitions = []
        try:
            parts = psutil.disk_partitions(all=False)
        except Exception:
            parts = []

        for part in parts:
            # Skip empty or inaccessible drives (e.g. CD-ROM on Windows)
            try:
                usage = psutil.disk_usage(part.mountpoint)
                partitions.append({
                    "device": part.device,
                    "mountpoint": part.mountpoint,
                    "fstype": part.fstype,
                    "opts": part.opts,
                    "total_bytes": usage.total,
                    "used_bytes": usage.used,
                    "free_bytes": usage.free,
                    "percent": round(usage.percent, 1),
                })
            except (PermissionError, FileNotFoundError, OSError):
                continue
        return partitions

    def get_io_stats(self) -> Dict[str, Any]:
        current_time = time.time()
        try:
            current_io = psutil.disk_io_counters()
        except Exception:
            current_io = None
        
        elapsed = current_time - self.last_time
        if elapsed <= 0.001:
            elapsed = 0.001

        read_bytes_per_sec = 0.0
        write_bytes_per_sec = 0.0
        read_ops_per_sec = 0.0
        write_ops_per_sec = 0.0

        if current_io and self.last_io:
            read_bytes_delta = max(0, current_io.read_bytes - self.last_io.read_bytes)
            write_bytes_delta = max(0, current_io.write_bytes - self.last_io.write_bytes)
            read_ops_delta = max(0, current_io.read_count - self.last_io.read_count)
            write_ops_delta = max(0, current_io.write_count - self.last_io.write_count)

            read_bytes_per_sec = read_bytes_delta / elapsed
            write_bytes_per_sec = write_bytes_delta / elapsed
            read_ops_per_sec = read_ops_delta / elapsed
            write_ops_per_sec = write_ops_delta / elapsed

        self.last_time = current_time
        self.last_io = current_io

        return {
            "read_bytes_per_sec": round(read_bytes_per_sec, 2),
            "write_bytes_per_sec": round(write_bytes_per_sec, 2),
            "read_mb_per_sec": round(read_bytes_per_sec / (1024 * 1024), 3),
            "write_mb_per_sec": round(write_bytes_per_sec / (1024 * 1024), 3),
            "read_ops_per_sec": round(read_ops_per_sec, 1),
            "write_ops_per_sec": round(write_ops_per_sec, 1),
            "cumulative": {
                "read_bytes": current_io.read_bytes if current_io else 0,
                "write_bytes": current_io.write_bytes if current_io else 0,
                "read_count": current_io.read_count if current_io else 0,
                "write_count": current_io.write_count if current_io else 0,
                "read_time_ms": getattr(current_io, "read_time", 0) if current_io else 0,
                "write_time_ms": getattr(current_io, "write_time", 0) if current_io else 0,
            }
        }

    def get_disk_metrics(self) -> Dict[str, Any]:
        partitions = self.get_partitions()
        io_stats = self.get_io_stats()
        
        total_storage = sum(p["total_bytes"] for p in partitions)
        total_used = sum(p["used_bytes"] for p in partitions)
        overall_percent = round((total_used / total_storage * 100), 1) if total_storage > 0 else 0.0

        return {
            "partitions": partitions,
            "io": io_stats,
            "aggregated": {
                "total_bytes": total_storage,
                "used_bytes": total_used,
                "free_bytes": total_storage - total_used,
                "percent": overall_percent
            }
        }

disk_monitor = DiskMonitor()
