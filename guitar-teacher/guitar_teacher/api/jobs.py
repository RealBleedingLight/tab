"""Simple in-memory job tracker for long-running tasks."""
import uuid
from typing import Optional, Dict, Any


class JobTracker:
    """Track background job progress. Single-process, in-memory."""

    def __init__(self):
        self._jobs: Dict[str, Dict[str, Any]] = {}

    def create(self, description: str) -> str:
        """Create a new job. Returns job ID."""
        job_id = str(uuid.uuid4())[:8]
        self._jobs[job_id] = {
            "id": job_id,
            "description": description,
            "status": "pending",
            "progress": None,
            "result": None,
            "error": None,
        }
        return job_id

    def update(self, job_id: str, **kwargs) -> None:
        """Update job fields (status, progress, result, error)."""
        if job_id in self._jobs:
            self._jobs[job_id].update(kwargs)

    def get(self, job_id: str) -> Optional[Dict]:
        """Get job status. Returns None if not found."""
        return self._jobs.get(job_id)


# Global instance (single process on Railway)
job_tracker = JobTracker()
