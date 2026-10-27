import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["data_integrity"] == "REAL_DATA_FIRST"

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert "PacketPulse" in response.json()["message"]

def test_probability_calculation_api():
    payload = {
        "n": 50,
        "p": 0.04,
        "x": 2,
        "threshold": 5,
        "mode": "measured"
    }
    response = client.post("/api/v1/probability/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["n"] == 50
    assert data["x"] == 2
    assert "expected_losses" in data
    assert abs(data["expected_losses"] - 2.0) < 1e-4
    assert len(data["pmf_distribution"]) > 0

def test_provenance_endpoint():
    response = client.get("/api/v1/provenance")
    assert response.status_code == 200
    data = response.json()
    assert "sources" in data
    assert any("RIPE Atlas" in s["name"] for s in data["sources"])

def test_local_diagnostic_validation():
    # Attempt command injection target
    bad_payload = {"target": "1.1.1.1; rm -rf /", "count": 5}
    response = client.post("/api/v1/measurements/local", json=bad_payload)
    assert response.status_code == 400
