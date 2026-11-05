import io
import csv
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.database.repository import MetricsRepository
from app.database.models import ResourceMetrics

class AnalyticsService:
    @staticmethod
    def get_performance_summary(
        db: Session,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> Dict[str, Any]:
        return MetricsRepository.get_summary_statistics(db, start_time, end_time)

    @staticmethod
    def export_csv(
        db: Session,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> str:
        records: List[ResourceMetrics] = MetricsRepository.get_history(db, start_time, end_time, limit=50000)
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "ID",
            "Timestamp (UTC)",
            "CPU Utilization (%)",
            "CPU Frequency (MHz)",
            "RAM Utilization (%)",
            "RAM Total (Bytes)",
            "RAM Used (Bytes)",
            "RAM Available (Bytes)",
            "Swap Utilization (%)",
            "Swap Used (Bytes)",
            "Swap Total (Bytes)",
            "Disk Read Speed (Bytes/s)",
            "Disk Write Speed (Bytes/s)",
            "Disk Storage Used (%)",
            "Network Download Speed (Bytes/s)",
            "Network Upload Speed (Bytes/s)"
        ])

        for r in records:
            writer.writerow([
                r.id,
                r.timestamp.isoformat() if r.timestamp else "",
                r.cpu_percent,
                r.cpu_freq_current or "",
                r.ram_percent,
                r.ram_total,
                r.ram_used,
                r.ram_available,
                r.swap_percent,
                r.swap_used,
                r.swap_total,
                r.disk_read_bytes_per_sec,
                r.disk_write_bytes_per_sec,
                r.disk_total_used_percent,
                r.net_download_bytes_per_sec,
                r.net_upload_bytes_per_sec
            ])

        return output.getvalue()

analytics_service = AnalyticsService()

