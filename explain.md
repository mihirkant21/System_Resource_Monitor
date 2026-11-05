# System Resource Monitor (SRM) – Complete A-to-Z Architectural & File Guide

> **Document Purpose:** This document provides an exhaustive, beginner-to-expert explanation of every single file, technology, algorithm, and operating systems concept used in the **System Resource Monitor** project.

---

## 1. High-Level System Architecture & Flow

Before diving into individual files, it is crucial to understand how data moves through the application from the hardware to your monitor:

```
+---------------------------------------------------------------------------------------+
|                                1. HARDWARE & KERNEL LAYER                             |
|  - CPU Cores, Clock Registers, Interrupt Counters                                      |
|  - RAM Chips & Pagefile / Swap Space                                                  |
|  - Hard Drives / SSDs & Filesystem Partitions                                         |
|  - Network Interface Cards (NICs), IP Packets, Sockets                                |
+---------------------------------------------------------------------------------------+
                                           │
                                           ▼ (Kernel APIs: Win32 PDH / Linux /proc)
+---------------------------------------------------------------------------------------+
|                                2. PYTHON MONITOR LAYER (psutil)                       |
|  - backend/app/monitor/cpu_monitor.py      -> Samples core percentages & frequencies   |
|  - backend/app/monitor/memory_monitor.py   -> Reads physical RAM & Swap usage         |
|  - backend/app/monitor/disk_monitor.py     -> Discovers partitions & calculates MB/s  |
|  - backend/app/monitor/network_monitor.py  -> Tracks socket I/O & calculates KB/s, MB/s|
|  - backend/app/monitor/process_monitor.py  -> Scans active tasks, PIDs, RSS, CPU %    |
|  - backend/app/monitor/system_info.py      -> Fetches OS version, uptime, architecture|
+---------------------------------------------------------------------------------------+
                                           │
                                           ▼
+---------------------------------------------------------------------------------------+
|                       3. ASYNC BACKGROUND COLLECTOR & ALERT ENGINE                    |
|  - backend/app/services/collector.py                                                  |
|    * Runs an infinite non-blocking asynchronous loop every 1 second.                   |
|    * Calculates mathematical rate deltas (Bytes/sec = ΔBytes / ΔTime).                |
|    * Writes snapshots to SQLite database via SQLAlchemy.                              |
|    * Runs AlertService to detect threshold breaches (CPU > 85%, RAM > 85%, etc.).      |
|    * Dispatches real-time JSON frames to all connected WebSocket clients.            |
+---------------------------------------------------------------------------------------+
                     │                                           │
                     ▼ (Async DB Insert)                         ▼ (WebSocket Broadcast)
+-----------------------------------------+   +-----------------------------------------+
|        4. PERSISTENCE LAYER             |   |       5. WEBSOCKET BROADCASTER          |
|  - backend/data/system_monitor.db       |   |  - backend/app/websocket/manager.py     |
|  - Models: ResourceMetrics, AlertHistory|   |    * Manages active WS connections.     |
|  - Repository: Time-range queries,      |   |    * Streams live sub-second updates    |
|    averages, min/max, peak timestamps.  |   |      without HTTP polling overhead.     |
+-----------------------------------------+   +-----------------------------------------+
                     │                                           │
                     ▼                                           ▼
+---------------------------------------------------------------------------------------+
|                                6. FASTAPI REST & WS SERVER                            |
|  - backend/app/main.py: App lifespan, CORS, REST router aggregation, /ws/metrics       |
|  - backend/app/api/: Modular REST endpoints for CPU, Memory, Disk, Network, Processes |
+---------------------------------------------------------------------------------------+
                                           │
                                           ▼ (Network / HTTP & WS)
+---------------------------------------------------------------------------------------+
|                                7. REACT 18 FRONTEND (Vite)                            |
|  - src/context/MetricsContext.jsx -> Establishes WS connection & auto-reconnects.     |
|  - src/context/ThemeContext.jsx   -> Handles Dark / Light mode switching.             |
|  - src/layouts/AppLayout.jsx      -> Sidebar + TopNav shell + Alert banner.           |
|  - 8 Dedicated Dashboard Pages    -> Overview, CPU, Memory, Disk, Network, Processes, |
|                                      Historical Analytics, Settings.                  |
|  - Recharts Library               -> Renders SVG real-time & historical graphs.       |
+---------------------------------------------------------------------------------------+
```

---

## 2. Technology Stack & Why Each Was Chosen

### Backend Stack
1. **Python 3.11+**:
   - *Why?* Python is the industry standard for systems programming and hardware telemetry. Its clean syntax and extensive ecosystem make it ideal for academic demonstration.
2. **FastAPI**:
   - *Why?* One of the fastest Python web frameworks available. It natively supports Python asynchronous coroutines (`async`/`await`), has built-in WebSocket support, automatic OpenAPI/Swagger documentation generation, and strict data validation via Pydantic.
3. **Uvicorn**:
   - *Why?* A lightning-fast ASGI (Asynchronous Server Gateway Interface) web server implementation for Python based on `uvloop` and `httptools`.
4. **psutil (Process and System Utilities)**:
   - *Why?* A cross-platform C-extension library that provides programmatic access to system utilization metrics (CPU, memory, disks, network, processes). It translates Windows Win32 / PDH performance counters and Linux `/proc` and `/sys` virtual filesystems into unified Python data structures.
5. **SQLAlchemy 2.0**:
   - *Why?* The gold standard Python Object Relational Mapper (ORM). It abstracts database interactions into Python classes and provides query construction, indexing, and aggregations.
6. **SQLite**:
   - *Why?* An embedded, serverless, self-contained, zero-configuration SQL database engine. The database is stored in a single disk file (`system_monitor.db`), requiring no cloud subscriptions or external database servers.
7. **Pydantic & Pydantic Settings**:
   - *Why?* Enforces type safety, serializes data models, and loads environment configurations with type coercion and default fallback values.
8. **pytest & httpx**:
   - *Why?* Testing framework to verify the reliability of hardware metric extractions, database persistence, and API response contracts.

### Frontend Stack
1. **React 18**:
   - *Why?* Industry-standard component-based user interface library. React's virtual DOM allows continuous sub-second UI updates without freezing the user's browser.
2. **Vite**:
   - *Why?* Next-generation frontend build tool powered by native ES modules. It provides near-instantaneous Hot Module Replacement (HMR) and optimized Rollup production bundling.
3. **Tailwind CSS v4**:
   - *Why?* Utility-first CSS framework enabling a sleek, Windows 11 Task Manager and Grafana-inspired dark/light design system without writing bloated custom CSS stylesheets.
4. **Recharts**:
   - *Why?* Declarative SVG charting library built specifically for React. Highly optimized for streaming real-time time-series area and line charts.
5. **Lucide React**:
   - *Why?* Modern, consistent, lightweight iconography system.

---

## 3. Complete A-to-Z File-by-File Breakdown

Below is an exhaustive walkthrough of every single file created in the project repository.

```
System_Resource_Monitor/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── alerts.py
│   │   │   ├── cpu.py
│   │   │   ├── disk.py
│   │   │   ├── history.py
│   │   │   ├── memory.py
│   │   │   ├── network.py
│   │   │   ├── processes.py
│   │   │   ├── settings.py
│   │   │   └── system.py
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   ├── connection.py
│   │   │   ├── models.py
│   │   │   └── repository.py
│   │   ├── monitor/
│   │   │   ├── __init__.py
│   │   │   ├── cpu_monitor.py
│   │   │   ├── disk_monitor.py
│   │   │   ├── memory_monitor.py
│   │   │   ├── network_monitor.py
│   │   │   ├── process_monitor.py
│   │   │   └── system_info.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── alert_service.py
│   │   │   ├── analytics.py
│   │   │   └── collector.py
│   │   ├── websocket/
│   │   │   ├── __init__.py
│   │   │   └── manager.py
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── main.py
│   ├── data/
│   │   └── system_monitor.db (generated at runtime)
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_api.py
│   │   ├── test_monitors.py
│   │   └── test_repository.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── charts/
│   │   │   ├── HistoricalChart.jsx
│   │   │   ├── MultiLineChart.jsx
│   │   │   └── RealTimeAreaChart.jsx
│   │   ├── components/
│   │   │   ├── AlertBanner.jsx
│   │   │   ├── CoreProgressBar.jsx
│   │   │   ├── GaugeCircle.jsx
│   │   │   ├── MetricCard.jsx
│   │   │   └── ProcessModal.jsx
│   │   ├── context/
│   │   │   ├── MetricsContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── layouts/
│   │   │   ├── AppLayout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── TopNav.jsx
│   │   ├── pages/
│   │   │   ├── AnalyticsPage.jsx
│   │   │   ├── CPUPage.jsx
│   │   │   ├── DiskPage.jsx
│   │   │   ├── MemoryPage.jsx
│   │   │   ├── NetworkPage.jsx
│   │   │   ├── OverviewPage.jsx
│   │   │   ├── ProcessesPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── formatters.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── .env.example
├── .gitignore
├── explain.md (This file)
├── README.md
├── run_all.bat
├── run_backend.bat
└── run_frontend.bat
```

---

### Root Configuration & Launch Scripts

#### 1. `run_all.bat`
- **Location:** Project root.
- **Purpose:** A master Windows batch script that simultaneously launches both the FastAPI backend and the Vite frontend dev server in two separate interactive command prompt windows with a 3-second delay to ensure the backend is listening before the frontend opens.
- **How it works:** Uses Windows `start cmd /k` commands pointing to `run_backend.bat` and `run_frontend.bat`.

#### 2. `run_backend.bat`
- **Location:** Project root.
- **Purpose:** Automates activating the Python virtual environment (`backend\venv`), setting `PYTHONPATH=backend`, and starting the Uvicorn web server on `127.0.0.1:8000` with auto-reload.

#### 3. `run_frontend.bat`
- **Location:** Project root.
- **Purpose:** Enters the `frontend` folder and runs `npm run dev` to start Vite on `http://localhost:5173`.

#### 4. `.gitignore`
- **Location:** Project root.
- **Purpose:** Prevents committing bloated and generated files to Git, such as virtual environments (`backend/venv/`), `node_modules/`, the SQLite database (`*.db`), compiled Python caches (`__pycache__/`), and build output (`dist/`).

#### 5. `.env.example`
- **Location:** Project root.
- **Purpose:** Documentation template defining default environment configuration variables (e.g. `DEFAULT_COLLECTION_INTERVAL=1.0`, `CPU_ALERT_THRESHOLD=85.0`, `MAX_HISTORY_DAYS=7`).

#### 6. `README.md`
- **Location:** Project root.
- **Purpose:** Complete academic coursework documentation containing problem statement, system architecture, database schema, operating systems concepts analysis, test outputs, limitations, and setup instructions.

---

### Backend Core Configuration & Entrypoint

#### 7. `backend/requirements.txt`
- **Location:** `backend/requirements.txt`
- **Purpose:** Pinpoints the Python library dependencies required to run the backend:
  - `fastapi`: Web framework.
  - `uvicorn[standard]`: ASGI server.
  - `psutil`: OS hardware metric reader.
  - `sqlalchemy`: Database ORM.
  - `pydantic` & `pydantic-settings`: Data validation and settings.
  - `pytest` & `httpx`: Automated testing suite.
  - `python-multipart`: For multipart requests.

#### 8. `backend/app/config.py`
- **Location:** `backend/app/config.py`
- **Purpose:** Centralized runtime configuration manager.
- **Key Concepts:**
  - Uses Pydantic's `BaseSettings` and `SettingsConfigDict` to load configuration from environment variables or a `.env` file with strict default fallbacks.
  - Automatically resolves the absolute path to the SQLite database: `backend/data/system_monitor.db`.
  - Defines global thresholds: `DEFAULT_COLLECTION_INTERVAL = 1.0` (seconds), `MAX_HISTORY_DAYS = 7`, `CPU_ALERT_THRESHOLD = 85.0%`, `RAM_ALERT_THRESHOLD = 85.0%`, etc.

#### 9. `backend/app/main.py`
- **Location:** `backend/app/main.py`
- **Purpose:** The main application entrypoint that boots FastAPI, manages application lifecycles, configures CORS, mounts all modular REST routers, and defines the WebSocket endpoint.
- **How it works:**
  - **`lifespan(app: FastAPI)`:** An asynchronous context manager. On server startup, it calls `init_db()` to automatically create SQLite tables if they do not exist, and starts `metrics_collector.start()` in the background (skipped in test mode). On server shutdown, it cleanly stops the collector.
  - **CORS Middleware:** Configured with `allow_origins=["*"]` so the React frontend on `localhost:5173` can communicate with FastAPI on `localhost:8000`.
  - **`app.include_router(...)`:** Mounts 9 specialized REST API routers under `/api/*`.
  - **`/ws/metrics`:** The WebSocket endpoint where frontend clients connect. It registers clients with `ws_manager` and keeps the duplex connection alive.
  - **`/health`:** A lightweight JSON probe returning `{"status": "healthy"}` for uptime verification.

---

### Backend Low-Level Hardware Monitors (`backend/app/monitor/`)

#### 10. `backend/app/monitor/system_info.py`
- **Purpose:** Identifies static and semi-static host machine properties.
- **Key Functions:**
  - `get_system_information()`:
    - Uses Python's standard `platform` module to fetch `hostname`, `os_name` (Windows/Linux), `os_release`, `os_version`, `architecture` (e.g. AMD64), and `processor` model.
    - Uses `psutil.boot_time()` to calculate exact system boot time and elapsed uptime in days, hours, minutes, and seconds.
    - Queries `len(psutil.pids())` to count active OS processes.

#### 11. `backend/app/monitor/cpu_monitor.py`
- **Purpose:** Extracts fine-grained CPU performance metrics.
- **Key Functions:**
  - `class CPUMonitor`:
    - Calls `psutil.cpu_percent(interval=None)` upon initialization to prime the kernel counter buffer.
    - `get_cpu_metrics()`:
      - `psutil.cpu_percent(interval=None)`: Non-blocking overall CPU utilization percentage.
      - `psutil.cpu_percent(percpu=True)`: An array of utilization percentages for each individual logical CPU core.
      - `psutil.cpu_count(logical=False)` and `psutil.cpu_count(logical=True)`: Distinguishes physical hardware cores from logical hyper-threaded cores.
      - `psutil.cpu_freq()`: Queries current clock speed in MHz, as well as minimum and maximum supported clock frequencies.
      - `psutil.getloadavg()`: Fetches OS load averages (1m, 5m, 15m) where supported (Linux/macOS and modern Windows).
      - `psutil.cpu_stats()`: Reads context switch counts and hardware interrupt counts.

#### 12. `backend/app/monitor/memory_monitor.py`
- **Purpose:** Inspects physical DRAM frames and secondary storage swap/pagefile allocation.
- **Key Functions:**
  - `get_memory_metrics()`:
    - `psutil.virtual_memory()`: Returns `total`, `used`, `free`, `available`, and `percent`.
    - Detects Linux-specific `buffers` and `cached` memory attributes safely using `getattr(...)` so Windows returns `None` gracefully instead of throwing `AttributeError`.
    - `psutil.swap_memory()`: Measures swap/pagefile total, used, free, and percentage. Encapsulated in a `try...except` block to gracefully handle systems where Windows Performance Counters (PDH) might be disabled or uninitialized.

#### 13. `backend/app/monitor/disk_monitor.py`
- **Purpose:** Distinguishes partition storage capacities from instantaneous block I/O throughput.
- **Key Functions:**
  - `class DiskMonitor`:
    - `get_partitions()`: Iterates through `psutil.disk_partitions(all=False)`. Inspects each mounted partition with `psutil.disk_usage(mountpoint)` to obtain `total`, `used`, `free`, and `percent`. Skips empty CD-ROM drives or virtual floppy devices using exception handling.
    - `get_io_stats()`: Calculates instantaneous read/write speeds. Stores the previous sample's cumulative bytes and timestamp.
      $$\text{read\_bytes\_per\_sec} = \frac{\text{current\_read\_bytes} - \text{last\_read\_bytes}}{\text{elapsed\_time}}$$
      Protects against division by zero by clamping `elapsed >= 0.001s`.
    - `get_disk_metrics()`: Combines partition usage, overall aggregated storage, and instantaneous read/write MB/s into a unified dictionary.

#### 14. `backend/app/monitor/network_monitor.py`
- **Purpose:** Measures socket stream bandwidth and analyzes physical and virtual network adapters.
- **Key Functions:**
  - `class NetworkMonitor`:
    - Tracks previous cumulative `bytes_recv` and `bytes_sent`.
    - Calculates instantaneous download speed and upload speed in bytes/s, KB/s, and MB/s.
    - Reads total packets sent/received, packet delivery errors (`errin`, `errout`), and buffer dropouts (`dropin`, `dropout`).
    - Inspects `psutil.net_if_addrs()` and `psutil.net_if_stats()` to enumerate individual network cards, their IPv4 addresses, hardware MAC addresses, link state (Up/Down), and full-duplex speed in Mbps.

#### 15. `backend/app/monitor/process_monitor.py`
- **Purpose:** Full process table manager, sorting engine, and safety-verified termination controller.
- **Key Functions:**
  - `get_process_list(limit)`: Uses `psutil.process_iter(attrs=[...])` to efficiently sample running tasks in a single C-level batch. Extracts PID, Name, CPU %, Memory %, Resident Set Size (RSS in bytes), execution status, user ownership, and creation time. Safely catches `NoSuchProcess`, `AccessDenied`, and `ZombieProcess`.
  - `get_top_processes(limit)`: Sorts all processes to return the top 5 by CPU % and top 5 by RSS memory footprint.
  - `get_process_details(pid)`: Inspects a single process for detailed PCB metadata: executable path (`proc.exe()`), command-line invocation arguments (`proc.cmdline()`), thread count (`proc.num_threads()`), open handles, and virtual memory size (VMS).
  - `terminate_process(pid)`:
    - **Kernel Safety Check:** Blocks attempts to terminate PID 0, 1, or 4 (essential OS kernel processes).
    - Calls `proc.terminate()`, waits up to 3 seconds for graceful cleanup, and escalates to `proc.kill()` if the process fails to exit.
    - Handles permission errors (`AccessDenied`) with informative user messages.

---

### Backend Persistence Layer (`backend/app/database/`)

#### 16. `backend/app/database/models.py`
- **Purpose:** Declares the relational database tables using SQLAlchemy's declarative ORM.
- **Tables Defined:**
  1. `ResourceMetrics`:
     - Columns: `id` (PK), `timestamp` (Indexed UTC), `cpu_percent`, `cpu_freq_current`, `ram_percent`, `ram_total`, `ram_used`, `ram_available`, `swap_percent`, `swap_used`, `swap_total`, `disk_read_bytes_per_sec`, `disk_write_bytes_per_sec`, `disk_total_used_percent`, `net_download_bytes_per_sec`, `net_upload_bytes_per_sec`.
     - Has `to_dict()` helper for clean JSON serialization.
  2. `AlertHistory`:
     - Columns: `id` (PK), `timestamp` (Indexed), `metric_name` (CPU/RAM/DISK/SWAP), `severity` (WARNING/CRITICAL), `threshold_value`, `actual_value`, `message`, `is_resolved`, `resolved_at`.
  3. `ApplicationSettings`:
     - Key-value store for storing runtime settings (`CPU_ALERT_THRESHOLD`, `MAX_HISTORY_DAYS`, etc.).

#### 17. `backend/app/database/connection.py`
- **Purpose:** Configures SQLite database engine and session generator.
- **Key Functions:**
  - `engine`: Created with `check_same_thread=False` to allow multi-threaded access from the async background collector and FastAPI request threads simultaneously.
  - `init_db()`: Calls `Base.metadata.create_all(bind=engine)` to create tables automatically on first startup.
  - `get_db()`: A FastAPI dependency yielding a clean database session and ensuring `db.close()` is called when the request finishes.

#### 18. `backend/app/database/repository.py`
- **Purpose:** Encapsulates all SQL queries to keep API route handlers clean and decoupled.
- **Classes:**
  - `MetricsRepository`:
    - `add_metrics()`: Inserts a new resource sample.
    - `get_history(start_time, end_time, limit)`: Returns chronologically ordered metrics within a date range for charts.
    - `get_summary_statistics()`: Executes SQL aggregate functions (`func.avg()`, `func.min()`, `func.max()`) and queries peak CPU/RAM breach timestamps.
    - `cleanup_old_metrics(max_days)`: Automatically purges records older than the retention threshold.
    - `clear_all_history()`: Deletes all rows when the user clicks "Clear Metrics".
  - `AlertRepository`:
    - `create_alert()`, `get_active_alert()`, `resolve_alert()`, `resolve_active_alerts_by_metric()`, `get_recent_alerts()`.
  - `SettingsRepository`:
    - `get_setting()`, `set_setting()`, `get_all_settings()`.

---

### Backend Services & WebSockets (`backend/app/services/` & `websocket/`)

#### 19. `backend/app/services/collector.py`
- **Purpose:** The continuous background heartbeat of the application.
- **How it works:**
  - Runs inside `_collection_loop()` using `asyncio.create_task()`.
  - At every tick (default: 1 second):
    1. Samples hardware via `cpu_monitor`, `memory_monitor`, `disk_monitor`, `network_monitor`.
    2. Opens a database session and saves the snapshot to `resource_metrics`.
    3. Passes the snapshot to `alert_service.evaluate_metrics()`.
    4. Gathers top 5 CPU & memory processes.
    5. Packages everything into a JSON frame and broadcasts it over `ws_manager.broadcast_json(...)`.
    6. Periodically (every 300 cycles ~ 5 mins) calls `cleanup_old_metrics()` to enforce data retention.
    7. Computes exact execution time and sleeps for the remainder of the configured interval.

#### 20. `backend/app/services/alert_service.py`
- **Purpose:** Threshold evaluation and alert deduplication engine.
- **How it works:**
  - Checks CPU, RAM, Disk, and Swap metrics against configured thresholds.
  - **Deduplication:** When CPU exceeds 85%, an alert is created. While CPU remains above 85% in subsequent seconds, it **does not** create duplicate alert records. When CPU drops below 85%, the alert is automatically resolved (`is_resolved = True`).
  - Distinguishes `WARNING` from `CRITICAL` (when usage exceeds threshold by +10% or is >= 95%).

#### 21. `backend/app/services/analytics.py`
- **Purpose:** Computes performance statistics and builds CSV export files.
- **Key Functions:**
  - `get_performance_summary()`: Proxies summary calculations from the repository.
  - `export_csv()`: Fetches up to 50,000 historical records within the selected timeframe, uses Python's `csv.writer` to write standard RFC-4180 CSV rows into an in-memory `io.StringIO` buffer, and returns the CSV string.

#### 22. `backend/app/websocket/manager.py`
- **Purpose:** Real-time WebSocket connection registry.
- **Key Functions:**
  - `ConnectionManager`:
    - Maintains a list of active `WebSocket` client connections.
    - `connect(websocket)`: Accepts and stores the client socket.
    - `disconnect(websocket)`: Safely removes disconnected clients.
    - `broadcast_json(data)`: Concurrently sends telemetry payloads to all connected browsers. Disconnects dead sockets automatically if a send fails.

---

### Backend REST API Routers (`backend/app/api/`)

#### 23. `backend/app/api/system.py`
- **Endpoint:** `GET /api/system/info`
- **Purpose:** Returns OS name, architecture, processor, boot time, uptime string, and process count.

#### 24. `backend/app/api/cpu.py`
- **Endpoint:** `GET /api/cpu`
- **Purpose:** Returns overall CPU %, per-core % array, frequency MHz, core count, load averages, context switches, and interrupts.

#### 25. `backend/app/api/memory.py`
- **Endpoint:** `GET /api/memory`
- **Purpose:** Returns virtual memory (total, used, free, available, buffers, cached) and swap metrics.

#### 26. `backend/app/api/disk.py`
- **Endpoints:**
  - `GET /api/disk`: Complete storage & I/O snapshot.
  - `GET /api/disk/partitions`: Mounted partition list.
  - `GET /api/disk/io`: Real-time read/write speeds and cumulative bytes.

#### 27. `backend/app/api/network.py`
- **Endpoint:** `GET /api/network`
- **Purpose:** Returns aggregated bandwidth rates, total bytes, packets, error/drop counters, and adapter cards.

#### 28. `backend/app/api/processes.py`
- **Endpoints:**
  - `GET /api/processes`: Filterable, searchable, and sortable process list.
  - `GET /api/processes/top`: Top 5 CPU and top 5 memory processes.
  - `GET /api/processes/{pid}`: Detailed process metadata.
  - `POST /api/processes/{pid}/terminate`: Safe process termination requiring `{"confirm": true}`.

#### 29. `backend/app/api/history.py`
- **Endpoints:**
  - `GET /api/history`: Chronological historical metrics array within `start_time` and `end_time`.
  - `GET /api/history/summary`: Average, min, max, and peak timestamp metrics.
  - `GET /api/history/export`: Streams CSV file download with proper `Content-Disposition` headers.
  - `DELETE /api/history`: Clears metrics table (requires `confirm=true`).

#### 30. `backend/app/api/alerts.py`
- **Endpoints:**
  - `GET /api/alerts`: Lists recent alerts.
  - `POST /api/alerts/{id}/resolve`: Resolves an alert.
  - `DELETE /api/alerts`: Clears alert history table.

#### 31. `backend/app/api/settings.py`
- **Endpoints:**
  - `GET /api/settings`: Returns current alert thresholds, collection interval, and retention period.
  - `PUT /api/settings`: Updates thresholds and settings dynamically.

---

### Backend Automated Test Suite (`backend/tests/`)

#### 32. `backend/tests/test_monitors.py`
- **Purpose:** Unit tests asserting that `cpu_monitor`, `memory_monitor`, `disk_monitor`, `network_monitor`, and `process_monitor` return real, valid, non-zero system values from the host OS.

#### 33. `backend/tests/test_repository.py`
- **Purpose:** Tests the persistence layer using an in-memory SQLite database (`sqlite:///:memory:`). Verifies record insertion, time-range querying, statistical summary calculation (avg/min/max/peak), alert state lifecycle, and settings storage.

#### 34. `backend/tests/test_api.py`
- **Purpose:** Integration tests using `TestClient` from FastAPI/Starlette to verify that all REST endpoints return HTTP 200 and compliant JSON schemas.

---

### Frontend Configuration & Entrypoint (`frontend/`)

#### 35. `frontend/package.json`
- **Location:** `frontend/package.json`
- **Purpose:** Defines npm scripts (`dev`, `build`, `preview`) and frontend dependencies: `react`, `react-dom`, `lucide-react`, `recharts`, `clsx`, `tailwind-merge`, and dev dependencies `@tailwindcss/postcss`, `tailwindcss`, `vite`.

#### 36. `frontend/vite.config.js`
- **Location:** `frontend/vite.config.js`
- **Purpose:** Configures Vite with the `@vitejs/plugin-react` plugin, dev server port (5173), and proxy rules for `/api` and `/ws` with error suppression for client aborts (`ECONNRESET`, `ECONNABORTED`).

#### 37. `frontend/tailwind.config.js` & `postcss.config.js`
- **Location:** `frontend/tailwind.config.js` & `postcss.config.js`
- **Purpose:** Configures Tailwind CSS styling rules, custom dark theme colors (`dark-bg: #0B0F19`, `dark-surface: #111827`, etc.), and enables class-based dark mode (`darkMode: 'class'`).

#### 38. `frontend/index.html`
- **Location:** `frontend/index.html`
- **Purpose:** Single HTML page container with Google Web Fonts (`Inter` and `JetBrains Mono`) that mounts the React root DOM element `<div id="root"></div>`.

#### 39. `frontend/src/index.css`
- **Location:** `frontend/src/index.css`
- **Purpose:** Global stylesheet that imports Tailwind CSS directives and defines subtle custom scrollbar styles.

#### 40. `frontend/src/main.jsx`
- **Location:** `frontend/src/main.jsx`
- **Purpose:** The React JavaScript entrypoint that initializes the React 18 Virtual DOM root using `createRoot(document.getElementById('root'))` and renders `<App />`.

#### 41. `frontend/src/App.jsx`
- **Location:** `frontend/src/App.jsx`
- **Purpose:** Root application component that:
  - Wraps the tree in `<ThemeProvider>` and `<MetricsProvider>`.
  - Manages `activeTab` navigation state (Overview, CPU, Memory, Disk, Network, Processes, Analytics, Settings).
  - Manages `inspectPid` modal state: opening `<ProcessModal>` whenever a user clicks "Inspect" on any process.

---

### Frontend Utilities & Context State Providers (`frontend/src/utils/` & `context/`)

#### 42. `frontend/src/utils/formatters.js`
- **Purpose:** Standardizes raw numerical values into human-readable strings:
  - `formatBytes(bytes)`: Formats bytes into B, KB, MB, GB, TB.
  - `formatSpeed(bytesPerSec)`: Formats speed into KB/s or MB/s.
  - `formatPercent(val)`: Formats percentages to 1 decimal place.
  - `formatFrequency(mhz)`: Formats CPU clock speed into MHz or GHz.
  - `formatTime(isoString)` & `formatDateTime(isoString)`: Formats timestamps.

#### 43. `frontend/src/context/ThemeContext.jsx`
- **Purpose:** Theme state provider. Manages Dark mode (default) and Light mode. Persists user preference in the browser's `localStorage` and toggles the `dark` class on the HTML `document.documentElement`.

#### 44. `frontend/src/context/MetricsContext.jsx`
- **Purpose:** Real-time state management and WebSocket client.
- **Key Responsibilities:**
  - **Smart WebSocket Routing:** Automatically detects development mode (Vite on port 5173) and connects directly to `ws://127.0.0.1:8000/ws/metrics`, bypassing Vite's Node.js `http-proxy` layer to prevent `ECONNABORTED`/`ECONNRESET` stream abort errors. In production, falls back cleanly to the host's `/ws/metrics`.
  - **Resilient Lifecycle Management:** Implements `isMountedRef` and unmount cleanup handlers to prevent duplicate competing sockets during React StrictMode and page navigations.
  - **Connection Heartbeat:** Sends a lightweight `ping` every 20 seconds to maintain persistent duplex streaming without idle socket drops.
  - Maintains `connectionStatus` (`connected`, `connecting`, `disconnected`).
  - Buffers the last 30 telemetry points into `recentHistory` for smooth, real-time live charting.
  - Stores `latestMetrics`, `systemInfo`, and `activeAlerts`.
  - Exposes `resolveAlert()` function to acknowledge and dismiss alerts.

#### 45. `frontend/src/services/api.js`
- **Purpose:** Frontend REST API service module containing asynchronous functions wrapping `fetch` for all backend endpoints.

---

### Frontend Layout & Reusable UI Components (`frontend/src/layouts/` & `components/`)

#### 46. `frontend/src/layouts/Sidebar.jsx`
- **Purpose:** Left navigation sidebar featuring brand logo, pulsating activity icon, 8 navigation buttons with active state highlights, and project metadata.

#### 47. `frontend/src/layouts/TopNav.jsx`
- **Purpose:** Top navigation header displaying the host machine name, OS badge, real-time WebSocket pulsating connection indicator, last update timestamp, and Dark/Light theme toggle button.

#### 48. `frontend/src/layouts/AppLayout.jsx`
- **Purpose:** Shell combining the Sidebar, TopNav, and AlertBanner above the page content.

#### 49. `frontend/src/components/MetricCard.jsx`
- **Purpose:** Premium summary card displaying KPI title, primary value in monospace font, secondary trend/statistic, icon, color theme, and optional progress bar.

#### 50. `frontend/src/components/GaugeCircle.jsx`
- **Purpose:** Custom SVG circular utilization gauge with smooth stroke-dasharray animations. Dynamically shifts colors based on utilization (green < 70%, amber 70-85%, rose > 85%).

#### 51. `frontend/src/components/CoreProgressBar.jsx`
- **Purpose:** Compact progress bar displaying individual CPU core index, percentage label, and color coding.

#### 52. `frontend/src/components/AlertBanner.jsx`
- **Purpose:** Alert notification banner rendered at the top of the screen when thresholds are breached. Features warning/critical badges, alert description, and a "Dismiss" action button.

#### 53. `frontend/src/components/ProcessModal.jsx`
- **Purpose:** Inspection modal dialog displaying complete Process Control Block (PCB) details:
  - PID, process name, execution status, username, start time.
  - CPU %, RSS memory bytes, thread count, handle count.
  - Full executable path and command-line invocation string.
  - **Safety Termination Action:** A two-step "End Process" button requiring explicit user confirmation before executing `POST /api/processes/{pid}/terminate`.

---

### Frontend Interactive Charts (`frontend/src/charts/`)

#### 54. `frontend/src/charts/RealTimeAreaChart.jsx`
- **Purpose:** Recharts AreaChart with smooth color gradients, custom tooltips, responsive container, and animated curve for live single-metric streams (CPU or Memory).

#### 55. `frontend/src/charts/MultiLineChart.jsx`
- **Purpose:** Dual-series area chart designed for paired metrics (e.g. Disk Read vs Write speed, or Network Download vs Upload speed).

#### 56. `frontend/src/charts/HistoricalChart.jsx`
- **Purpose:** Long-term time-series multi-line chart for historical analytics. Formats timestamps along the X-axis and handles empty states gracefully if no data is found for the selected timeframe.

---

### Frontend Dashboard Pages (`frontend/src/pages/`)

#### 57. `frontend/src/pages/OverviewPage.jsx`
- **Purpose:** The primary landing dashboard:
  - 4 KPI cards: CPU, Memory, Disk Storage, Network Bandwidth.
  - 4 synchronized live streaming charts (CPU, RAM, Disk I/O, Network).
  - Top 5 CPU and Top 5 Memory process lists with click-to-inspect actions.
  - Uptime badge and total task count.

#### 58. `frontend/src/pages/CPUPage.jsx`
- **Purpose:** Deep-dive processor telemetry:
  - Live average and peak CPU calculations from history.
  - Circular utilization gauge.
  - System load averages (1m, 5m, 15m).
  - Real-time 60-second processor chart.
  - Per-core grid displaying utilization bars for every physical and logical core.
  - Clock frequency and scheduler context switch / interrupt counters.

#### 59. `frontend/src/pages/MemoryPage.jsx`
- **Purpose:** Volatile memory and paging telemetry:
  - Dual gauge circles for Physical RAM and Swap / Pagefile.
  - Distribution breakdown bar (Used vs Available RAM).
  - Detailed memory counters: Cached memory, buffered block I/O, shared IPC memory.
  - Real-time RAM utilization trend chart.

#### 60. `frontend/src/pages/DiskPage.jsx`
- **Purpose:** Storage and block device subsystem:
  - Live Disk I/O throughput chart (Read vs Write in MB/s).
  - IOPS counters and cumulative bytes read/written.
  - Mounted Filesystem Partitions table displaying device paths, mount points, filesystem types (NTFS/ext4), total capacity, used/free bytes, and visual usage bars.

#### 61. `frontend/src/pages/NetworkPage.jsx`
- **Purpose:** Network socket telemetry:
  - Live bandwidth chart (Download vs Upload in MB/s).
  - Total transferred bytes and packet counters.
  - Packet drop and delivery error counters.
  - Individual network adapter cards displaying interface name, IPv4 address, MAC address, link speed, link state, and current transfer rates.

#### 62. `frontend/src/pages/ProcessesPage.jsx`
- **Purpose:** Full process task manager:
  - Live table of all running tasks (PID, Name, CPU %, Memory RSS, Memory %, Status, User).
  - Search filter (matching PID or process name in real time).
  - Multi-column sorting (sort by CPU, Memory RSS, Name, or PID).
  - "Inspect" action opening the Process Inspection & Safety Termination modal.

#### 63. `frontend/src/pages/AnalyticsPage.jsx`
- **Purpose:** Long-term historical telemetry analytics:
  - Timeframe preset buttons: Last 5m, 15m, 30m, 1h, 6h, 24h.
  - Summary KPI cards: Average utilization, maximum utilization, minimum utilization, and peak breach timestamp.
  - Historical multi-line charts for CPU & RAM, Disk I/O speeds, and Network bandwidth.
  - **Export CSV Button:** Downloads the active timeframe's raw telemetry into a spreadsheet.

#### 64. `frontend/src/pages/SettingsPage.jsx`
- **Purpose:** Application configuration and threshold tuning:
  - Interactive sliders to tune alert thresholds (CPU %, RAM %, Disk %, Swap %).
  - Sampling interval control (seconds) and data retention period (days).
  - "Save Configuration" button writing to database.
  - **Database Maintenance:** Clear Historical Metrics and Clear Alert History buttons with confirmation dialogs.

---

## 4. Operating Systems Concepts Deep-Dive

This application is designed specifically as an Operating Systems coursework project. Here is how core OS concepts are demonstrated in code:

### 1. Process Management & Process Control Block (PCB)
- **Concept:** In an operating system, every executing program is an instance of a process represented by a kernel data structure called the Process Control Block (PCB). The PCB tracks the PID, parent process, execution state, memory segments, thread handles, and security context.
- **Implementation in Project:** `backend/app/monitor/process_monitor.py` extracts PCB attributes directly from the kernel using `psutil.process_iter()`. `frontend/src/components/ProcessModal.jsx` visualizes this PCB metadata.

### 2. Resident Set Size (RSS) vs. Virtual Memory Size (VMS)
- **Concept:** A process requests a large virtual address space (VMS), but only a fraction of those pages are mapped to physical DRAM frames at any given moment. This physical portion is the Resident Set Size (RSS).
- **Implementation in Project:** `process_monitor.py` reads `proc.memory_info().rss` and `proc.memory_info().vms`, demonstrating how virtual memory decouples program size from physical RAM constraints.

### 3. CPU Scheduling, Time Slicing & Symmetric Multiprocessing (SMP)
- **Concept:** The OS CPU scheduler uses preemptive time slicing (e.g. completely fair scheduler or round-robin) to allocate CPU cores among competing threads. In SMP architectures, threads are scheduled across multiple physical and logical cores.
- **Implementation in Project:** `cpu_monitor.py` uses `psutil.cpu_percent(percpu=True)` to measure the individual time slice allocation of every core. Visualized in `CPUPage.jsx` using `CoreProgressBar.jsx`.

### 4. P-States & Dynamic Frequency Scaling
- **Concept:** The OS kernel power manager dynamically alters the clock frequency of the processor (P-States) via governors (e.g. `powersave`, `performance`, or Intel SpeedStep) to conserve energy during low load and boost clock speed under heavy load.
- **Implementation in Project:** `cpu_monitor.py` reads `psutil.cpu_freq().current`, visualized as live MHz/GHz on the CPU page.

### 5. Context Switches & Hardware Interrupts (IRQ)
- **Concept:** A context switch occurs when the scheduler saves the state of the currently executing thread (program counter, registers, stack pointer) and restores the state of another thread. Hardware interrupts occur when external devices (NIC, disk controller) notify the CPU of an asynchronous event.
- **Implementation in Project:** `cpu_monitor.py` tracks `psutil.cpu_stats().ctx_switches` and `psutil.cpu_stats().interrupts`.

### 6. Paging, Virtual Memory & Swap / Pagefile
- **Concept:** When physical RAM frames become exhausted, the OS page replacement algorithm (e.g. Least Recently Used / LRU) writes inactive pages to a dedicated disk file (swap partition on Linux, `pagefile.sys` on Windows).
- **Implementation in Project:** `memory_monitor.py` tracks `psutil.virtual_memory()` and `psutil.swap_memory()`, and `alert_service.py` warns if swap saturation threatens system stability.

### 7. Filesystem Block Devices & Instantaneous I/O Delta Calculation
- **Concept:** Storage drivers maintain cumulative monotonic byte counters. Instantaneous data transfer speed cannot be read statically; it must be calculated as a derivative over elapsed time:
  $$\text{Speed (Bytes/s)} = \frac{\Delta \text{Bytes}}{\Delta t} = \frac{\text{Bytes}_{t_2} - \text{Bytes}_{t_1}}{t_2 - t_1}$$
- **Implementation in Project:** `disk_monitor.py` and `network_monitor.py` implement this exact derivative calculation, clamping $\Delta t \ge 0.001\text{ s}$ to prevent division by zero.

---

## 5. Verification & Testing Summary

All 20 backend unit and integration tests passed cleanly:

```powershell
$env:PYTHONPATH="backend"; $env:TESTING="true"; backend\venv\Scripts\pytest backend\tests -v
```

```
backend/tests/test_api.py::test_health_endpoint PASSED                   [  5%]
backend/tests/test_api.py::test_system_info_endpoint PASSED              [ 10%]
backend/tests/test_api.py::test_cpu_endpoint PASSED                      [ 15%]
backend/tests/test_api.py::test_memory_endpoint PASSED                   [ 20%]
backend/tests/test_api.py::test_disk_endpoint PASSED                     [ 25%]
backend/tests/test_api.py::test_network_endpoint PASSED                  [ 30%]
backend/tests/test_api.py::test_processes_endpoint PASSED                [ 35%]
backend/tests/test_api.py::test_top_processes_endpoint PASSED            [ 40%]
backend/tests/test_api.py::test_history_endpoints PASSED                 [ 45%]
backend/tests/test_api.py::test_settings_endpoints PASSED                [ 50%]
backend/tests/test_monitors.py::test_system_info PASSED                  [ 55%]
backend/tests/test_monitors.py::test_cpu_metrics PASSED                  [ 60%]
backend/tests/test_monitors.py::test_memory_metrics PASSED               [ 65%]
backend/tests/test_monitors.py::test_disk_metrics PASSED                 [ 70%]
backend/tests/test_monitors.py::test_network_metrics PASSED              [ 75%]
backend/tests/test_monitors.py::test_process_monitor PASSED              [ 80%]
backend/tests/test_repository.py::test_add_and_get_metrics PASSED        [ 85%]
backend/tests/test_repository.py::test_summary_statistics PASSED         [ 90%]
backend/tests/test_repository.py::test_alert_lifecycle PASSED            [ 95%]
backend/tests/test_repository.py::test_settings_storage PASSED           [100%]
============================= 20 passed in 11.29s =============================
```

Frontend production bundle verification:
```
cd frontend
npm run build
✓ built in 1.64s
```

---

## 6. How to Run the Application

### Method 1: The One-Click Batch Script
Double-click `run_all.bat` in the root folder. Both backend and frontend will boot automatically.

### Method 2: Manual Terminal Execution

**Terminal 1 (Backend):**
```powershell
set PYTHONPATH=backend
backend\venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```

- **Interactive Dashboard:** `http://localhost:5173`
- **FastAPI Swagger API Documentation:** `http://127.0.0.1:8000/docs`

