import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.database.repository import AlertRepository, SettingsRepository
from app.config import settings

class AlertService:
    def __init__(self):
        # In-memory tracking of currently active alerts to avoid redundant DB queries
        self._active_alerts: Dict[str, bool] = {}

    def get_thresholds(self, db: Session) -> Dict[str, float]:
        raw_settings = SettingsRepository.get_all_settings(db)
        return {
            "CPU": float(raw_settings.get("CPU_ALERT_THRESHOLD", settings.CPU_ALERT_THRESHOLD)),
            "RAM": float(raw_settings.get("RAM_ALERT_THRESHOLD", settings.RAM_ALERT_THRESHOLD)),
            "DISK": float(raw_settings.get("DISK_ALERT_THRESHOLD", settings.DISK_ALERT_THRESHOLD)),
            "SWAP": float(raw_settings.get("SWAP_ALERT_THRESHOLD", settings.SWAP_ALERT_THRESHOLD)),
        }

    def evaluate_metrics(self, db: Session, metrics_snapshot: Dict[str, Any]) -> List[Dict[str, Any]]:
        thresholds = self.get_thresholds(db)
        new_alerts = []

        checks = [
            ("CPU", metrics_snapshot.get("cpu_percent", 0.0), thresholds["CPU"], f"CPU utilization reached {metrics_snapshot.get('cpu_percent')}%"),
            ("RAM", metrics_snapshot.get("ram_percent", 0.0), thresholds["RAM"], f"RAM utilization reached {metrics_snapshot.get('ram_percent')}%"),
            ("DISK", metrics_snapshot.get("disk_total_used_percent", 0.0), thresholds["DISK"], f"Disk utilization reached {metrics_snapshot.get('disk_total_used_percent')}%"),
            ("SWAP", metrics_snapshot.get("swap_percent", 0.0), thresholds["SWAP"], f"Swap memory utilization reached {metrics_snapshot.get('swap_percent')}%"),
        ]

        for metric_name, actual_val, threshold_val, message in checks:
            is_breached = actual_val >= threshold_val
            existing_active = AlertRepository.get_active_alert(db, metric_name)

            if is_breached:
                severity = "CRITICAL" if actual_val >= (threshold_val + 10.0) or actual_val >= 95.0 else "WARNING"
                
                # If not already alerted, create an alert
                if not existing_active:
                    created = AlertRepository.create_alert(
                        db=db,
                        metric_name=metric_name,
                        severity=severity,
                        threshold_value=threshold_val,
                        actual_value=actual_val,
                        message=f"{severity}: {message} (Threshold: {threshold_val}%)"
                    )
                    self._active_alerts[metric_name] = True
                    new_alerts.append(created.to_dict())
            else:
                # Value returned to normal, resolve any active alert
                if existing_active:
                    AlertRepository.resolve_active_alerts_by_metric(db, metric_name)
                    self._active_alerts[metric_name] = False

        return new_alerts

alert_service = AlertService()

