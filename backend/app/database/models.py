from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, BigInteger, String, Boolean, DateTime, Text, Index
from sqlalchemy.orm import declarative_base

Base = declarative_base()

def utc_now():
    return datetime.now(timezone.utc)

class ResourceMetrics(Base):
    __tablename__ = "resource_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=utc_now, index=True, nullable=False)
    
    # CPU
    cpu_percent = Column(Float, nullable=False)
    cpu_freq_current = Column(Float, nullable=True)
    
    # Memory
    ram_percent = Column(Float, nullable=False)
    ram_total = Column(BigInteger, nullable=False)
    ram_used = Column(BigInteger, nullable=False)
    ram_available = Column(BigInteger, nullable=False)
    swap_percent = Column(Float, nullable=False)
    swap_used = Column(BigInteger, nullable=False)
    swap_total = Column(BigInteger, nullable=False)
    
    # Disk I/O & Storage
    disk_read_bytes_per_sec = Column(Float, nullable=False, default=0.0)
    disk_write_bytes_per_sec = Column(Float, nullable=False, default=0.0)
    disk_total_used_percent = Column(Float, nullable=False, default=0.0)
    
    # Network I/O
    net_download_bytes_per_sec = Column(Float, nullable=False, default=0.0)
    net_upload_bytes_per_sec = Column(Float, nullable=False, default=0.0)

    __table_args__ = (
        Index("idx_resource_metrics_timestamp", "timestamp"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "cpu_percent": self.cpu_percent,
            "cpu_freq_current": self.cpu_freq_current,
            "ram_percent": self.ram_percent,
            "ram_total": self.ram_total,
            "ram_used": self.ram_used,
            "ram_available": self.ram_available,
            "swap_percent": self.swap_percent,
            "swap_used": self.swap_used,
            "swap_total": self.swap_total,
            "disk_read_bytes_per_sec": self.disk_read_bytes_per_sec,
            "disk_write_bytes_per_sec": self.disk_write_bytes_per_sec,
            "disk_total_used_percent": self.disk_total_used_percent,
            "net_download_bytes_per_sec": self.net_download_bytes_per_sec,
            "net_upload_bytes_per_sec": self.net_upload_bytes_per_sec,
        }


class AlertHistory(Base):
    __tablename__ = "alert_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=utc_now, index=True, nullable=False)
    metric_name = Column(String(50), nullable=False)  # CPU, RAM, DISK, SWAP
    severity = Column(String(20), nullable=False)    # WARNING, CRITICAL
    threshold_value = Column(Float, nullable=False)
    actual_value = Column(Float, nullable=False)
    message = Column(String(255), nullable=False)
    is_resolved = Column(Boolean, default=False, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("idx_alert_history_timestamp", "timestamp"),
        Index("idx_alert_active", "metric_name", "is_resolved"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "metric_name": self.metric_name,
            "severity": self.severity,
            "threshold_value": self.threshold_value,
            "actual_value": self.actual_value,
            "message": self.message,
            "is_resolved": self.is_resolved,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
        }


class ApplicationSettings(Base):
    __tablename__ = "application_settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    def to_dict(self):
        return {
            "key": self.key,
            "value": self.value,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

