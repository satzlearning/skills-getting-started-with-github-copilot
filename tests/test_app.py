import copy

import pytest
from fastapi.testclient import TestClient

from src.app import app, activities


@pytest.fixture(autouse=True)
def reset_activities():
    """Return the global state to the original snapshot after each test."""
    original = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(original)


client = TestClient(app)


def test_root_redirect():
    # disable automatic redirect following so we can inspect the original response
    response = client.get("/", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"].endswith("/static/index.html")


def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert "Chess Club" in data


def test_signup_success():
    email = "newstudent@mergington.edu"
    response = client.post(
        "/activities/Chess Club/signup", params={"email": email}
    )
    assert response.status_code == 200
    assert email in activities["Chess Club"]["participants"]


def test_signup_nonexistent_activity():
    response = client.post(
        "/activities/Nonexistent/signup", params={"email": "a@b.com"}
    )
    assert response.status_code == 404


def test_signup_already_signed_up():
    existing = activities["Chess Club"]["participants"][0]
    response = client.post(
        "/activities/Chess Club/signup", params={"email": existing}
    )
    assert response.status_code == 400


def test_remove_participant_success():
    email = activities["Chess Club"]["participants"][0]
    response = client.delete(
        "/activities/Chess Club/participants", params={"email": email}
    )
    assert response.status_code == 200
    assert email not in activities["Chess Club"]["participants"]


def test_remove_nonexistent_activity():
    response = client.delete(
        "/activities/Nonexistent/participants", params={"email": "a@b.com"}
    )
    assert response.status_code == 404


def test_remove_nonparticipant():
    response = client.delete(
        "/activities/Chess Club/participants", params={"email": "nomember@mergington.edu"}
    )
    assert response.status_code == 404
