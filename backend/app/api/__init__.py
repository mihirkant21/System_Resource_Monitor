from app.api.system import router as system_router
from app.api.cpu import router as cpu_router
from app.api.memory import router as memory_router
from app.api.disk import router as disk_router
from app.api.network import router as network_router
from app.api.processes import router as processes_router
from app.api.history import router as history_router
from app.api.alerts import router as alerts_router
from app.api.settings import router as settings_router

__all__ = [
    "system_router",
    "cpu_router",
    "memory_router",
    "disk_router",
    "network_router",
    "processes_router",
    "history_router",
    "alerts_router",
    "settings_router",
]

