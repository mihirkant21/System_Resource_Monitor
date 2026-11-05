import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "System Resource Monitor"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = f"sqlite:///{DATA_DIR / 'system_monitor.db'}"
    
    # Metrics collection
    DEFAULT_COLLECTION_INTERVAL: float = 1.0  # seconds
    MAX_HISTORY_DAYS: int = 7  # retention period
    
    # Default alert thresholds (in percent)
    CPU_ALERT_THRESHOLD: float = 85.0
    RAM_ALERT_THRESHOLD: float = 85.0
    DISK_ALERT_THRESHOLD: float = 90.0
    SWAP_ALERT_THRESHOLD: float = 80.0
    
    # Process monitoring
    MAX_PROCESSES_RETURNED: int = 150

settings = Settings()
