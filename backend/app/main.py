import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database.connection import init_db
from app.services.collector import metrics_collector
from app.websocket.manager import ws_manager

from app.api import (
    system_router,
    cpu_router,
    memory_router,
    disk_router,
    network_router,
    processes_router,
    history_router,
    alerts_router,
    settings_router,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database & start async metrics collector
    logger.info("Initializing SQLite database tables...")
    init_db()
    
    is_testing = os.environ.get("TESTING", "").lower() in ("true", "1")
    if not is_testing:
        logger.info("Starting background metrics collection worker...")
        await metrics_collector.start()

    yield

    # Shutdown: Stop collector safely
    if not is_testing:
        logger.info("Shutting down background worker...")
        await metrics_collector.stop()
    logger.info("Shutdown complete.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Real-Time OS Performance Monitoring & Historical Analytics API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API Routers
app.include_router(system_router)
app.include_router(cpu_router)
app.include_router(memory_router)
app.include_router(disk_router)
app.include_router(network_router)
app.include_router(processes_router)
app.include_router(history_router)
app.include_router(alerts_router)
app.include_router(settings_router)

@app.get("/health", tags=["Health"])
def health_check():
    """Application health status probe."""
    return {"status": "healthy", "version": settings.APP_VERSION}

@app.websocket("/ws/metrics")
async def websocket_endpoint(websocket: WebSocket):
    """Real-time streaming WebSocket endpoint for sub-second system metric broadcasts."""
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection open and accept ping/pong or client messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client connection error: {e}")
        ws_manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
