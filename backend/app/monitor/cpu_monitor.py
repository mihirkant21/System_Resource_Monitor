import os
import psutil
from typing import Dict, Any, List, Optional

class CPUMonitor:
    def __init__(self):
        # Initial call to cpu_percent to initialize internal counters
        psutil.cpu_percent(interval=None)
        psutil.cpu_percent(percpu=True, interval=None)

    def get_cpu_metrics(self) -> Dict[str, Any]:
        overall_percent = psutil.cpu_percent(interval=None)
        per_core_percent: List[float] = psutil.cpu_percent(percpu=True, interval=None)

        logical_cores = psutil.cpu_count(logical=True) or 1
        physical_cores = psutil.cpu_count(logical=False) or logical_cores

        # Frequency
        freq_info = psutil.cpu_freq()
        current_freq = round(freq_info.current, 1) if freq_info and freq_info.current else None
        min_freq = round(freq_info.min, 1) if freq_info and freq_info.min else None
        max_freq = round(freq_info.max, 1) if freq_info and freq_info.max else None

        # Load average (Unix has 1, 5, 15 min; Windows psutil provides getloadavg on modern versions or None)
        load_avg = None
        try:
            if hasattr(psutil, "getloadavg"):
                raw_load = psutil.getloadavg()
                load_avg = {
                    "1min": round(raw_load[0], 2),
                    "5min": round(raw_load[1], 2),
                    "15min": round(raw_load[2], 2)
                }
            elif hasattr(os, "getloadavg"):
                raw_load = os.getloadavg()
                load_avg = {
                    "1min": round(raw_load[0], 2),
                    "5min": round(raw_load[1], 2),
                    "15min": round(raw_load[2], 2)
                }
        except Exception:
            load_avg = None

        # CPU Stats (context switches, interrupts)
        ctx_switches = None
        interrupts = None
        try:
            cpu_stats = psutil.cpu_stats()
            ctx_switches = cpu_stats.ctx_switches
            interrupts = cpu_stats.interrupts
        except Exception:
            pass

        return {
            "overall_percent": round(overall_percent, 1),
            "per_core_percent": [round(p, 1) for p in per_core_percent],
            "physical_cores": physical_cores,
            "logical_cores": logical_cores,
            "frequency_mhz": {
                "current": current_freq,
                "min": min_freq,
                "max": max_freq
            },
            "load_average": load_avg,
            "context_switches": ctx_switches,
            "interrupts": interrupts
        }

cpu_monitor = CPUMonitor()

