import psutil
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

class ProcessMonitor:
    @staticmethod
    def get_process_list(limit: int = 150) -> List[Dict[str, Any]]:
        processes = []
        # Specify attributes to fetch efficiently in a single batch
        attrs = ["pid", "name", "cpu_percent", "memory_percent", "memory_info", "status", "username", "create_time"]
        
        for proc in psutil.process_iter(attrs=attrs):
            try:
                info = proc.info
                # calculate memory RSS (Resident Set Size) in bytes
                rss_bytes = info["memory_info"].rss if info.get("memory_info") else 0
                
                # Format create time
                created_dt = None
                if info.get("create_time"):
                    try:
                        created_dt = datetime.fromtimestamp(info["create_time"], tz=timezone.utc).isoformat()
                    except Exception:
                        created_dt = None

                processes.append({
                    "pid": info["pid"],
                    "name": info.get("name") or "Unknown",
                    "cpu_percent": round(info.get("cpu_percent") or 0.0, 1),
                    "memory_percent": round(info.get("memory_percent") or 0.0, 1),
                    "memory_bytes": rss_bytes,
                    "status": info.get("status") or "unknown",
                    "username": info.get("username") or "N/A",
                    "create_time": created_dt,
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
            except Exception:
                continue

        return processes

    @staticmethod
    def get_top_processes(limit: int = 5) -> Dict[str, List[Dict[str, Any]]]:
        all_procs = ProcessMonitor.get_process_list()
        
        # Top CPU
        top_cpu = sorted(all_procs, key=lambda p: p["cpu_percent"], reverse=True)[:limit]
        # Top Memory
        top_mem = sorted(all_procs, key=lambda p: p["memory_bytes"], reverse=True)[:limit]

        return {
            "top_cpu": top_cpu,
            "top_memory": top_mem
        }

    @staticmethod
    def get_process_details(pid: int) -> Optional[Dict[str, Any]]:
        try:
            proc = psutil.Process(pid)
            with proc.oneshot():
                name = proc.name()
                status = proc.status()
                cpu_pct = round(proc.cpu_percent(interval=None), 1)
                mem_pct = round(proc.memory_percent(), 1)
                mem_info = proc.memory_info()
                num_threads = proc.num_threads()
                create_time = datetime.fromtimestamp(proc.create_time(), tz=timezone.utc).isoformat()

                # These may raise AccessDenied on protected system processes
                try:
                    exe_path = proc.exe()
                except (psutil.AccessDenied, psutil.NoSuchProcess):
                    exe_path = "Access Denied"

                try:
                    cmdline = " ".join(proc.cmdline())
                except (psutil.AccessDenied, psutil.NoSuchProcess):
                    cmdline = "Access Denied"

                try:
                    username = proc.username()
                except (psutil.AccessDenied, psutil.NoSuchProcess):
                    username = "Access Denied"

                try:
                    num_handles = proc.num_handles() if hasattr(proc, "num_handles") else None
                except (psutil.AccessDenied, psutil.NoSuchProcess):
                    num_handles = None

            return {
                "pid": pid,
                "name": name,
                "status": status,
                "cpu_percent": cpu_pct,
                "memory_percent": mem_pct,
                "memory_rss_bytes": mem_info.rss,
                "memory_vms_bytes": mem_info.vms,
                "num_threads": num_threads,
                "num_handles": num_handles,
                "create_time": create_time,
                "exe": exe_path,
                "cmdline": cmdline,
                "username": username,
            }
        except psutil.NoSuchProcess:
            return None
        except psutil.AccessDenied:
            return {
                "pid": pid,
                "name": "Protected Process",
                "status": "access_denied",
                "error": "Access Denied by OS Kernel"
            }
        except Exception as e:
            return {
                "pid": pid,
                "error": str(e)
            }

    @staticmethod
    def terminate_process(pid: int) -> Dict[str, Any]:
        # Never terminate system critical PIDs (0, 4 on Windows, 1 on Linux)
        if pid in (0, 1, 4):
            return {
                "success": False,
                "message": f"PID {pid} is an essential OS kernel process and cannot be terminated."
            }

        try:
            proc = psutil.Process(pid)
            proc_name = proc.name()
            proc.terminate()
            # Wait up to 3 seconds for graceful shutdown
            try:
                proc.wait(timeout=3)
            except psutil.TimeoutExpired:
                # Force kill if not stopped gracefully
                proc.kill()
                proc.wait(timeout=1)

            return {
                "success": True,
                "message": f"Successfully terminated process '{proc_name}' (PID: {pid})."
            }
        except psutil.NoSuchProcess:
            return {
                "success": False,
                "message": f"Process PID {pid} was not found (it may have already exited)."
            }
        except psutil.AccessDenied:
            return {
                "success": False,
                "message": f"Access denied when attempting to terminate PID {pid}. Elevated administrator permissions required."
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to terminate PID {pid}: {str(e)}"
            }

process_monitor = ProcessMonitor()

