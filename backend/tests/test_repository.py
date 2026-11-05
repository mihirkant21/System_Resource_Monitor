import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.models import Base, ResourceMetrics
from app.database.repository import MetricsRepository, AlertRepository, SettingsRepository

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()

def test_add_and_get_metrics(test_db):
    sample = {
        "timestamp": datetime.now(timezone.utc),
        "cpu_percent": 45.5,
        "cpu_freq_current": 2400.0,
        "ram_percent": 60.2,
        "ram_total": 16000000000,
        "ram_used": 9600000000,
        "ram_available": 6400000000,
        "swap_percent": 10.0,
        "swap_used": 1000000000,
        "swap_total": 10000000000,
        "disk_read_bytes_per_sec": 102400.0,
        "disk_write_bytes_per_sec": 204800.0,
        "disk_total_used_percent": 55.0,
        "net_download_bytes_per_sec": 512000.0,
        "net_upload_bytes_per_sec": 256000.0,
    }
    metric = MetricsRepository.add_metrics(test_db, sample)
    assert metric.id is not None
    assert metric.cpu_percent == 45.5

    latest = MetricsRepository.get_latest_metrics(test_db)
    assert latest is not None
    assert latest.id == metric.id

    history = MetricsRepository.get_history(test_db)
    assert len(history) == 1

def test_summary_statistics(test_db):
    now = datetime.now(timezone.utc)
    for i in range(1, 4):
        sample = {
            "timestamp": now + timedelta(seconds=i),
            "cpu_percent": float(i * 10),
            "cpu_freq_current": 2500.0,
            "ram_percent": float(i * 20),
            "ram_total": 16000000000,
            "ram_used": 8000000000,
            "ram_available": 8000000000,
            "swap_percent": 0.0,
            "swap_used": 0,
            "swap_total": 0,
            "disk_read_bytes_per_sec": 100.0,
            "disk_write_bytes_per_sec": 200.0,
            "disk_total_used_percent": 50.0,
            "net_download_bytes_per_sec": 300.0,
            "net_upload_bytes_per_sec": 400.0,
        }
        MetricsRepository.add_metrics(test_db, sample)

    summary = MetricsRepository.get_summary_statistics(test_db)
    assert summary["total_records"] == 3
    assert summary["cpu"]["min"] == 10.0
    assert summary["cpu"]["max"] == 30.0
    assert summary["cpu"]["avg"] == 20.0
    assert summary["ram"]["avg"] == 40.0
    assert summary["cpu"]["peak_timestamp"] is not None

def test_alert_lifecycle(test_db):
    alert = AlertRepository.create_alert(
        db=test_db,
        metric_name="CPU",
        severity="CRITICAL",
        threshold_value=85.0,
        actual_value=92.5,
        message="Critical CPU alert"
    )
    assert alert.id is not None
    assert alert.is_resolved is False

    active = AlertRepository.get_active_alert(test_db, "CPU")
    assert active is not None
    assert active.id == alert.id

    resolved_count = AlertRepository.resolve_active_alerts_by_metric(test_db, "CPU")
    assert resolved_count == 1
    assert AlertRepository.get_active_alert(test_db, "CPU") is None

def test_settings_storage(test_db):
    SettingsRepository.set_setting(test_db, "CPU_ALERT_THRESHOLD", "90.0")
    val = SettingsRepository.get_setting(test_db, "CPU_ALERT_THRESHOLD")
    assert val == "90.0"

    all_settings = SettingsRepository.get_all_settings(test_db)
    assert "CPU_ALERT_THRESHOLD" in all_settings

