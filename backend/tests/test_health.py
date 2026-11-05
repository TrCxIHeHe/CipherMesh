def test_root_endpoint(client):
    """Test that the root endpoint returns 200 and expected service info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "CipherMesh API"
    assert data["status"] == "online"
    assert "version" in data
    assert "health" in data


def test_health_endpoint(client):
    """Test that GET /health returns 200 and passes all health indicators."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "CipherMesh API"
    assert data["version"] == "0.1.0"
    assert data["environment"] == "development"
    assert data["database"] == "connected"
    assert "timestamp" in data


def test_api_v1_health_endpoint(client):
    """Test that GET /api/v1/health is also routed and healthy."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"

