from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from src.app import app, activities as activities_data


@pytest.fixture(autouse=True)
def reset_activities():
    """Backup and restore the in-memory activities dict for test isolation."""
    original = deepcopy(activities_data)
    try:
        yield
    finally:
        activities_data.clear()
        activities_data.update(original)


def test_get_activities():
    client = TestClient(app)
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Basic shape checks
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]


def test_signup_and_duplicate_prevention():
    client = TestClient(app)
    activity = "Chess Club"
    email = "testuser@example.com"

    # Sign up should succeed
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert email in client.get("/activities").json()[activity]["participants"]

    # Signing up again should fail with 400
    resp2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp2.status_code == 400


def test_remove_participant():
    client = TestClient(app)
    activity = "Chess Club"
    # pick an existing participant from the initial dataset
    existing = deepcopy(activities_data[activity]["participants"])[0]

    # Remove them
    resp = client.delete(f"/activities/{activity}/participants?email={existing}")
    assert resp.status_code == 200
    # should no longer be in the participants list
    assert existing not in client.get("/activities").json()[activity]["participants"]
