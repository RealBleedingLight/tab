import pytest
import os

os.environ.setdefault("AUTH_PIN", "1234")
os.environ.setdefault("AUTH_SECRET", "test-secret-key")
os.environ.setdefault("GITHUB_TOKEN", "fake-token")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:3000")
