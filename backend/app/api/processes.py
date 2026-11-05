from typing import Optional, Literal
from fastapi import APIRouter, Query, HTTPException, status
from pydantic import BaseModel
from app.monitor.process_monitor import process_monitor

router = APIRouter(prefix="/api/processes", tags=["Processes"])

class TerminateRequest(BaseModel):
    confirm: bool = False

@router.get("")
def read_processes(
    search: Optional[str] = Query(None, description="Search term matching PID or process name"),
    sort_by: Optional[str] = Query("cpu", description="Sort by cpu, memory, name, or pid"),
    order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
    limit: int = Query(100, ge=1, le=500)
):
    """Retrieve running system processes with optional search and sorting."""
    procs = process_monitor.get_process_list(limit=500)

    # Filter
    if search:
        search_lower = search.strip().lower()
        procs = [
            p for p in procs
            if search_lower in p["name"].lower() or search_lower in str(p["pid"])
        ]

    # Sort
    reverse = (order.lower() == "desc" if order else True)
    if sort_by == "cpu":
        procs.sort(key=lambda p: p["cpu_percent"], reverse=reverse)
    elif sort_by == "memory":
        procs.sort(key=lambda p: p["memory_bytes"], reverse=reverse)
    elif sort_by == "name":
        procs.sort(key=lambda p: p["name"].lower(), reverse=reverse)
    elif sort_by == "pid":
        procs.sort(key=lambda p: p["pid"], reverse=reverse)

    return {
        "total_returned": len(procs[:limit]),
        "processes": procs[:limit]
    }

@router.get("/top")
def read_top_processes(limit: int = Query(5, ge=1, le=20)):
    """Retrieve top CPU and top memory consuming processes."""
    return process_monitor.get_top_processes(limit=limit)

@router.get("/{pid}")
def read_process_details(pid: int):
    """Retrieve in-depth process execution details."""
    details = process_monitor.get_process_details(pid)
    if not details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Process with PID {pid} was not found."
        )
    return details

@router.post("/{pid}/terminate")
def terminate_process_endpoint(pid: int, body: TerminateRequest):
    """Explicitly terminate a running process with safety confirmation."""
    if not body.confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Process termination requires explicit confirmation ('confirm': true)."
        )

    result = process_monitor.terminate_process(pid)
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN if "denied" in result["message"].lower() else status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    return result
