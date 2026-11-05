import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

from app.config import settings
from app.database.connection import SessionLocal
from app.database.repository import MetricsRepository, SettingsRepository
from app.monitor.cpu_monitor import cpu_monitor
from app.monitor.memory_monitor import get_memory_metrics
from app.monitor.disk_monitor import disk_monitor
from app.monitor.network_monitor import network_monitor
from app.monitor.process_monitor import process_monitor
from app.services.alert_service import alert_service
from app.websocket.manager import ws_manager

logger = logging.getLogger("collector")

class MetricsCollector:
    def __init__(self):
        self._is_running = False
        self._task: Optional[asyncio.Task] = None
        self._iteration_count = 0

    async def start(self):
        if self._is_running:
            return
        self._is_running = True
        self._task = asyncio.create_task(self._collection_loop())
        logger.info("MetricsCollector background worker started.")

    async def stop(self):
        self._is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("MetricsCollector background worker stopped.")

    async def _collection_loop(self):
        while self._is_running:
            try:
                start_tick = asyncio.get_event_loop().time()
                
                # 1. Collect live hardware metrics
                cpu_data = cpu_monitor.get_cpu_metrics()
                mem_data = get_memory_metrics()
                disk_data = disk_monitor.get_disk_metrics()
                net_data = network_monitor.get_network_metrics()

                now_utc = datetime.now(timezone.utc)
                timestamp_iso = now_utc.isoformat()

                db_metric_entry = {
                    "timestamp": now_utc,
                    "cpu_percent": cpu_data["overall_percent"],
                    "cpu_freq_current": cpu_data["frequency_mhz"]["current"],
                    "ram_percent": mem_data["virtual_memory"]["percent"],
                    "ram_total": mem_data["virtual_memory"]["total_bytes"],
                    "ram_used": mem_data["virtual_memory"]["used_bytes"],
                    "ram_available": mem_data["virtual_memory"]["available_bytes"],
                    "swap_percent": mem_data["swap_memory"]["percent"],
                    "swap_used": mem_data["swap_memory"]["used_bytes"],
                    "swap_total": mem_data["swap_memory"]["total_bytes"],
                    "disk_read_bytes_per_sec": disk_data["io"]["read_bytes_per_sec"],
                    "disk_write_bytes_per_sec": disk_data["io"]["write_bytes_per_sec"],
                    "disk_total_used_percent": disk_data["aggregated"]["percent"],
                    "net_download_bytes_per_sec": net_data["aggregated"]["download_bytes_per_sec"],
                    "net_upload_bytes_per_sec": net_data["aggregated"]["upload_bytes_per_sec"],
                }

                # 2. Database persistence & alert evaluation
                db = SessionLocal()
                new_alerts = []
                try:
                    # Save metric record
                    MetricsRepository.add_metrics(db, db_metric_entry)

                    # Evaluate health alerts
                    new_alerts = alert_service.evaluate_metrics(db, db_metric_entry)

                    # Periodic retention cleanup (every 300 iterations ~ 5 minutes)
                    self._iteration_count += 1
                    if self._iteration_count % 300 == 0:
                        retention_days = int(SettingsRepository.get_setting(db, "MAX_HISTORY_DAYS", str(settings.MAX_HISTORY_DAYS)))
                        MetricsRepository.cleanup_old_metrics(db, retention_days)
                except Exception as db_err:
                    logger.error(f"Error persisting metrics or evaluating alerts: {db_err}")
                finally:
                    db.close()

                # 3. Top processes for live overview
                top_procs = process_monitor.get_top_processes(limit=5)

                # 4. Construct live broadcast payload
                broadcast_payload = {
                    "type": "METRICS_UPDATE",
                    "timestamp": timestamp_iso,
                    "cpu": cpu_data,
                    "memory": mem_data,
                    "disk": disk_data,
                    "network": net_data,
                    "top_processes": top_procs,
                    "new_alerts": new_alerts,
                }

                # 5. Broadcast to all active WebSocket clients
                await ws_manager.broadcast_json(broadcast_payload)

                # 6. Sleep for remaining duration of configured interval
                elapsed = asyncio.get_event_loop().time() - start_tick
                sleep_time = max(0.1, settings.DEFAULT_COLLECTION_INTERVAL - elapsed)
                await asyncio.sleep(sleep_time)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Unexpected error in metrics collector loop: {e}", exc_info=True)
                await asyncio.sleep(1.0)

metrics_collector = MetricsCollector()

