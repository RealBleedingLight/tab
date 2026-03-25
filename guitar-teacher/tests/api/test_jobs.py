import pytest
from guitar_teacher.api.jobs import JobTracker


@pytest.fixture
def tracker():
    return JobTracker()


def test_create_job(tracker):
    job_id = tracker.create("test-job")
    assert job_id is not None
    status = tracker.get(job_id)
    assert status["status"] == "pending"
    assert status["description"] == "test-job"


def test_update_progress(tracker):
    job_id = tracker.create("test-job")
    tracker.update(job_id, status="running", progress="Step 3 of 10")
    status = tracker.get(job_id)
    assert status["status"] == "running"
    assert status["progress"] == "Step 3 of 10"


def test_complete_job(tracker):
    job_id = tracker.create("test-job")
    tracker.update(job_id, status="completed", result={"lessons": 22})
    status = tracker.get(job_id)
    assert status["status"] == "completed"
    assert status["result"]["lessons"] == 22


def test_fail_job(tracker):
    job_id = tracker.create("test-job")
    tracker.update(job_id, status="failed", error="Something went wrong")
    status = tracker.get(job_id)
    assert status["status"] == "failed"
    assert status["error"] == "Something went wrong"


def test_get_nonexistent(tracker):
    assert tracker.get("nonexistent") is None
