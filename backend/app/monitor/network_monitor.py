import time
import psutil
from typing import Dict, Any, List

class NetworkMonitor:
    def __init__(self):
        self.last_time = time.time()
        try:
            self.last_io = psutil.net_io_counters(pernic=False)
            self.last_pernic_io = psutil.net_io_counters(pernic=True)
        except Exception:
            self.last_io = None
            self.last_pernic_io = {}

    def get_network_metrics(self) -> Dict[str, Any]:
        current_time = time.time()
        try:
            current_io = psutil.net_io_counters(pernic=False)
        except Exception:
            current_io = None

        try:
            current_pernic = psutil.net_io_counters(pernic=True)
        except Exception:
            current_pernic = {}

        try:
            addrs = psutil.net_if_addrs()
        except Exception:
            addrs = {}

        try:
            stats = psutil.net_if_stats()
        except Exception:
            stats = {}

        elapsed = current_time - self.last_time
        if elapsed <= 0.001:
            elapsed = 0.001

        # Calculate instantaneous aggregate bandwidth
        download_bytes_per_sec = 0.0
        upload_bytes_per_sec = 0.0

        if current_io and self.last_io:
            recv_delta = max(0, current_io.bytes_recv - self.last_io.bytes_recv)
            sent_delta = max(0, current_io.bytes_sent - self.last_io.bytes_sent)
            download_bytes_per_sec = recv_delta / elapsed
            upload_bytes_per_sec = sent_delta / elapsed

        # Per-interface details
        interfaces = []
        for iface_name, io_stat in current_pernic.items():
            last_nic = self.last_pernic_io.get(iface_name) if self.last_pernic_io else None
            
            nic_down_speed = 0.0
            nic_up_speed = 0.0
            if last_nic:
                nic_down_delta = max(0, io_stat.bytes_recv - last_nic.bytes_recv)
                nic_up_delta = max(0, io_stat.bytes_sent - last_nic.bytes_sent)
                nic_down_speed = nic_down_delta / elapsed
                nic_up_speed = nic_up_delta / elapsed

            # Address information (IPv4, MAC)
            ip_address = None
            mac_address = None
            if iface_name in addrs:
                for addr in addrs[iface_name]:
                    try:
                        family_name = getattr(addr.family, "name", str(addr.family))
                        if family_name == "AF_INET":
                            ip_address = addr.address
                        elif family_name in ("AF_LINK", "AF_PACKET") or getattr(addr.family, "value", None) == -1:
                            mac_address = addr.address
                    except Exception:
                        pass

            # Interface link status
            is_up = False
            speed_mbps = 0
            if iface_name in stats:
                try:
                    is_up = stats[iface_name].isup
                    speed_mbps = stats[iface_name].speed
                except Exception:
                    pass

            interfaces.append({
                "interface": iface_name,
                "is_up": is_up,
                "speed_mbps": speed_mbps,
                "ip_address": ip_address,
                "mac_address": mac_address,
                "download_bytes_per_sec": round(nic_down_speed, 2),
                "upload_bytes_per_sec": round(nic_up_speed, 2),
                "download_kb_per_sec": round(nic_down_speed / 1024, 2),
                "upload_kb_per_sec": round(nic_up_speed / 1024, 2),
                "download_mb_per_sec": round(nic_down_speed / (1024 * 1024), 3),
                "upload_mb_per_sec": round(nic_up_speed / (1024 * 1024), 3),
                "bytes_recv": io_stat.bytes_recv,
                "bytes_sent": io_stat.bytes_sent,
                "packets_recv": io_stat.packets_recv,
                "packets_sent": io_stat.packets_sent,
                "errin": io_stat.errin,
                "errout": io_stat.errout,
                "dropin": io_stat.dropin,
                "dropout": io_stat.dropout,
            })

        self.last_time = current_time
        self.last_io = current_io
        self.last_pernic_io = current_pernic

        return {
            "aggregated": {
                "download_bytes_per_sec": round(download_bytes_per_sec, 2),
                "upload_bytes_per_sec": round(upload_bytes_per_sec, 2),
                "download_kb_per_sec": round(download_bytes_per_sec / 1024, 2),
                "upload_kb_per_sec": round(upload_bytes_per_sec / 1024, 2),
                "download_mb_per_sec": round(download_bytes_per_sec / (1024 * 1024), 3),
                "upload_mb_per_sec": round(upload_bytes_per_sec / (1024 * 1024), 3),
                "total_bytes_recv": current_io.bytes_recv if current_io else 0,
                "total_bytes_sent": current_io.bytes_sent if current_io else 0,
                "packets_recv": current_io.packets_recv if current_io else 0,
                "packets_sent": current_io.packets_sent if current_io else 0,
                "errin": current_io.errin if current_io else 0,
                "errout": current_io.errout if current_io else 0,
                "dropin": current_io.dropin if current_io else 0,
                "dropout": current_io.dropout if current_io else 0,
            },
            "interfaces": interfaces
        }

network_monitor = NetworkMonitor()
