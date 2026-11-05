import pytest
from app.monitor.system_info import get_system_information
from app.monitor.cpu_monitor import cpu_monitor
from app.monitor.memory_monitor import get_memory_metrics
from app.monitor.disk_monitor import disk_monitor
from app.monitor.network_monitor import network_monitor
from app.monitor.process_monitor import process_monitor

def test_system_info():
    info = get_system_information()
    assert "os_name" in info
    assert "hostname" in info
    assert "uptime_seconds" in info
    assert info["uptime_seconds"] >= 0
    assert "architecture" in info

def test_cpu_metrics():
    metrics = cpu_monitor.get_cpu_metrics()
    assert "overall_percent" in metrics
    assert isinstance(metrics["overall_percent"], (int, float))
    assert 0.0 <= metrics["overall_percent"] <= 100.0
    assert "per_core_percent" in metrics
    assert len(metrics["per_core_percent"]) == metrics["logical_cores"]
    assert metrics["logical_cores"] >= 1
    assert metrics["physical_cores"] >= 1

def test_memory_metrics():
    mem = get_memory_metrics()
    assert "virtual_memory" in mem
    assert "swap_memory" in mem
    vmem = mem["virtual_memory"]
    assert vmem["total_bytes"] > 0
    assert vmem["used_bytes"] > 0
    assert 0.0 <= vmem["percent"] <= 100.0
    assert vmem["available_bytes"] <= vmem["total_bytes"]

def test_disk_metrics():
    disk = disk_monitor.get_disk_metrics()
    assert "partitions" in disk
    assert "io" in disk
    assert "aggregated" in disk
    agg = disk["aggregated"]
    assert agg["total_bytes"] > 0
    assert 0.0 <= agg["percent"] <= 100.0
    assert "read_bytes_per_sec" in disk["io"]
    assert "write_bytes_per_sec" in disk["io"]

def test_network_metrics():
    net = network_monitor.get_network_metrics()
    assert "aggregated" in net
    assert "interfaces" in net
    agg = net["aggregated"]
    assert "download_bytes_per_sec" in agg
    assert "upload_bytes_per_sec" in agg
    assert agg["total_bytes_recv"] >= 0
    assert agg["total_bytes_sent"] >= 0

def test_process_monitor():
    procs = process_monitor.get_process_list(limit=20)
    assert len(procs) > 0
    sample = procs[0]
    assert "pid" in sample
    assert "name" in sample
    assert "cpu_percent" in sample
    assert "memory_bytes" in sample

    top = process_monitor.get_top_processes(limit=3)
    assert "top_cpu" in top
    assert "top_memory" in top
    assert len(top["top_cpu"]) <= 3

