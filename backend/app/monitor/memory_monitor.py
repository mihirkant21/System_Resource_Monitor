import psutil
from typing import Dict, Any

def get_memory_metrics() -> Dict[str, Any]:
    vmem = psutil.virtual_memory()
    
    # Gracefully handle Windows PDH / counter issues for swap
    try:
        swap = psutil.swap_memory()
        swap_total = swap.total
        swap_used = swap.used
        swap_free = swap.free
        swap_percent = round(swap.percent, 1)
        sin_bytes = getattr(swap, "sin", 0)
        sout_bytes = getattr(swap, "sout", 0)
    except Exception:
        # Fallback if Windows Performance Counters (PDH) are disabled or swap unavailable
        swap_total = 0
        swap_used = 0
        swap_free = 0
        swap_percent = 0.0
        sin_bytes = 0
        sout_bytes = 0

    # Buffers and cached might not be available on Windows
    buffers = getattr(vmem, "buffers", None)
    cached = getattr(vmem, "cached", None)
    shared = getattr(vmem, "shared", None)

    return {
        "virtual_memory": {
            "total_bytes": vmem.total,
            "used_bytes": vmem.used,
            "available_bytes": vmem.available,
            "free_bytes": vmem.free,
            "percent": round(vmem.percent, 1),
            "buffers_bytes": buffers,
            "cached_bytes": cached,
            "shared_bytes": shared,
        },
        "swap_memory": {
            "total_bytes": swap_total,
            "used_bytes": swap_used,
            "free_bytes": swap_free,
            "percent": swap_percent,
            "sin_bytes": sin_bytes,
            "sout_bytes": sout_bytes,
        }
    }
