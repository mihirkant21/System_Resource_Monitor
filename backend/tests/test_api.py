import os
os.environ["TESTING"] = "true"

import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_system_info_endpoint(client):
    response = client.get("/api/system/info")
    assert response.status_code == 200
    data = response.json()
    assert "hostname" in data
    assert "os_name" in data

def test_cpu_endpoint(client):
    response = client.get("/api/cpu")
    assert response.status_code == 200
    data = response.json()
    assert "overall_percent" in data
    assert "logical_cores" in data

def test_memory_endpoint(client):
    response = client.get("/api/memory")
    assert response.status_code == 200
    data = response.json()
    assert "virtual_memory" in data

def test_disk_endpoint(client):
    response = client.get("/api/disk")
    assert response.status_code == 200
    data = response.json()
    assert "partitions" in data
    assert "io" in data

def test_network_endpoint(client):
    response = client.get("/api/network")
    assert response.status_code == 200
    data = response.json()
    assert "aggregated" in data
    assert "interfaces" in data

def test_processes_endpoint(client):
    response = client.get("/api/processes?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "processes" in data
    assert len(data["processes"]) > 0

def test_top_processes_endpoint(client):
    response = client.get("/api/processes/top?limit=3")
    assert response.status_code == 200
    data = response.json()
    assert "top_cpu" in data
    assert "top_memory" in data

def test_history_endpoints(client):
    response = client.get("/api/history?limit=10")
    assert response.status_code == 200
    assert "data" in response.json()

    summary_resp = client.get("/api/history/summary")
    assert summary_resp.status_code == 200
    assert "cpu" in summary_resp.json()

    export_resp = client.get("/api/history/export")
    assert export_resp.status_code == 200
    assert "text/csv" in export_resp.headers["content-type"]

def test_settings_endpoints(client):
    get_resp = client.get("/api/settings")
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert "CPU_ALERT_THRESHOLD" in data

    put_resp = client.put("/api/settings", json={"CPU_ALERT_THRESHOLD": 88.0})
    assert put_resp.status_code == 200
    assert put_resp.json()["updated"]["CPU_ALERT_THRESHOLD"] == 88.0
