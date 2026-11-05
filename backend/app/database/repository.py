from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from app.database.models import ResourceMetrics, AlertHistory, ApplicationSettings, utc_now

class MetricsRepository:
    @staticmethod
    def add_metrics(db: Session, metrics_data: dict) -> ResourceMetrics:
        metric = ResourceMetrics(**metrics_data)
        db.add(metric)
        db.commit()
        db.refresh(metric)
        return metric

    @staticmethod
    def get_latest_metrics(db: Session) -> Optional[ResourceMetrics]:
        return db.query(ResourceMetrics).order_by(desc(ResourceMetrics.timestamp)).first()

    @staticmethod
    def get_history(
        db: Session,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 1000
    ) -> List[ResourceMetrics]:
        query = db.query(ResourceMetrics)
        if start_time:
            query = query.filter(ResourceMetrics.timestamp >= start_time)
        if end_time:
            query = query.filter(ResourceMetrics.timestamp <= end_time)
        
        # Order by ascending time for charting
        return query.order_by(ResourceMetrics.timestamp.asc()).limit(limit).all()

    @staticmethod
    def get_summary_statistics(
        db: Session,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> Dict[str, Any]:
        query = db.query(ResourceMetrics)
        if start_time:
            query = query.filter(ResourceMetrics.timestamp >= start_time)
        if end_time:
            query = query.filter(ResourceMetrics.timestamp <= end_time)

        total_records = query.count()
        if total_records == 0:
            return {
                "total_records": 0,
                "cpu": {"avg": 0.0, "min": 0.0, "max": 0.0, "peak_timestamp": None},
                "ram": {"avg": 0.0, "min": 0.0, "max": 0.0, "peak_timestamp": None},
                "disk_read": {"avg": 0.0, "min": 0.0, "max": 0.0},
                "disk_write": {"avg": 0.0, "min": 0.0, "max": 0.0},
                "net_download": {"avg": 0.0, "min": 0.0, "max": 0.0},
                "net_upload": {"avg": 0.0, "min": 0.0, "max": 0.0},
            }

        # Calculate averages, min, max
        stats = query.with_entities(
            func.avg(ResourceMetrics.cpu_percent).label("cpu_avg"),
            func.min(ResourceMetrics.cpu_percent).label("cpu_min"),
            func.max(ResourceMetrics.cpu_percent).label("cpu_max"),
            func.avg(ResourceMetrics.ram_percent).label("ram_avg"),
            func.min(ResourceMetrics.ram_percent).label("ram_min"),
            func.max(ResourceMetrics.ram_percent).label("ram_max"),
            func.avg(ResourceMetrics.disk_read_bytes_per_sec).label("disk_read_avg"),
            func.max(ResourceMetrics.disk_read_bytes_per_sec).label("disk_read_max"),
            func.avg(ResourceMetrics.disk_write_bytes_per_sec).label("disk_write_avg"),
            func.max(ResourceMetrics.disk_write_bytes_per_sec).label("disk_write_max"),
            func.avg(ResourceMetrics.net_download_bytes_per_sec).label("net_down_avg"),
            func.max(ResourceMetrics.net_download_bytes_per_sec).label("net_down_max"),
            func.avg(ResourceMetrics.net_upload_bytes_per_sec).label("net_up_avg"),
            func.max(ResourceMetrics.net_upload_bytes_per_sec).label("net_up_max"),
        ).first()

        # Find peak CPU timestamp
        peak_cpu_row = query.order_by(desc(ResourceMetrics.cpu_percent)).first()
        peak_cpu_time = peak_cpu_row.timestamp.isoformat() if peak_cpu_row else None

        # Find peak RAM timestamp
        peak_ram_row = query.order_by(desc(ResourceMetrics.ram_percent)).first()
        peak_ram_time = peak_ram_row.timestamp.isoformat() if peak_ram_row else None

        return {
            "total_records": total_records,
            "cpu": {
                "avg": round(float(stats.cpu_avg or 0), 2),
                "min": round(float(stats.cpu_min or 0), 2),
                "max": round(float(stats.cpu_max or 0), 2),
                "peak_timestamp": peak_cpu_time,
            },
            "ram": {
                "avg": round(float(stats.ram_avg or 0), 2),
                "min": round(float(stats.ram_min or 0), 2),
                "max": round(float(stats.ram_max or 0), 2),
                "peak_timestamp": peak_ram_time,
            },
            "disk_read": {
                "avg": round(float(stats.disk_read_avg or 0), 2),
                "max": round(float(stats.disk_read_max or 0), 2),
            },
            "disk_write": {
                "avg": round(float(stats.disk_write_avg or 0), 2),
                "max": round(float(stats.disk_write_max or 0), 2),
            },
            "net_download": {
                "avg": round(float(stats.net_down_avg or 0), 2),
                "max": round(float(stats.net_down_max or 0), 2),
            },
            "net_upload": {
                "avg": round(float(stats.net_up_avg or 0), 2),
                "max": round(float(stats.net_up_max or 0), 2),
            },
        }

    @staticmethod
    def cleanup_old_metrics(db: Session, max_days: int) -> int:
        cutoff = utc_now() - timedelta(days=max_days)
        deleted = db.query(ResourceMetrics).filter(ResourceMetrics.timestamp < cutoff).delete()
        db.commit()
        return deleted

    @staticmethod
    def clear_all_history(db: Session) -> int:
        deleted = db.query(ResourceMetrics).delete()
        db.commit()
        return deleted


class AlertRepository:
    @staticmethod
    def create_alert(
        db: Session,
        metric_name: str,
        severity: str,
        threshold_value: float,
        actual_value: float,
        message: str
    ) -> AlertHistory:
        alert = AlertHistory(
            metric_name=metric_name,
            severity=severity,
            threshold_value=threshold_value,
            actual_value=actual_value,
            message=message,
            is_resolved=False
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def get_active_alert(db: Session, metric_name: str) -> Optional[AlertHistory]:
        return db.query(AlertHistory).filter(
            and_(AlertHistory.metric_name == metric_name, AlertHistory.is_resolved == False)
        ).first()

    @staticmethod
    def resolve_alert(db: Session, alert_id: int) -> Optional[AlertHistory]:
        alert = db.query(AlertHistory).filter(AlertHistory.id == alert_id).first()
        if alert and not alert.is_resolved:
            alert.is_resolved = True
            alert.resolved_at = utc_now()
            db.commit()
            db.refresh(alert)
        return alert

    @staticmethod
    def resolve_active_alerts_by_metric(db: Session, metric_name: str) -> int:
        active_alerts = db.query(AlertHistory).filter(
            and_(AlertHistory.metric_name == metric_name, AlertHistory.is_resolved == False)
        ).all()
        now = utc_now()
        for alert in active_alerts:
            alert.is_resolved = True
            alert.resolved_at = now
        db.commit()
        return len(active_alerts)

    @staticmethod
    def get_recent_alerts(db: Session, limit: int = 50) -> List[AlertHistory]:
        return db.query(AlertHistory).order_by(desc(AlertHistory.timestamp)).limit(limit).all()

    @staticmethod
    def clear_alerts(db: Session) -> int:
        deleted = db.query(AlertHistory).delete()
        db.commit()
        return deleted


class SettingsRepository:
    @staticmethod
    def get_setting(db: Session, key: str, default: Optional[str] = None) -> Optional[str]:
        setting = db.query(ApplicationSettings).filter(ApplicationSettings.key == key).first()
        return setting.value if setting else default

    @staticmethod
    def set_setting(db: Session, key: str, value: str) -> ApplicationSettings:
        setting = db.query(ApplicationSettings).filter(ApplicationSettings.key == key).first()
        if setting:
            setting.value = value
            setting.updated_at = utc_now()
        else:
            setting = ApplicationSettings(key=key, value=value, updated_at=utc_now())
            db.add(setting)
        db.commit()
        db.refresh(setting)
        return setting

    @staticmethod
    def get_all_settings(db: Session) -> Dict[str, str]:
        rows = db.query(ApplicationSettings).all()
        return {r.key: r.value for r in rows}

