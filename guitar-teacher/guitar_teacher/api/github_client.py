"""GitHub Contents API client for reading/writing repo files."""
import base64
import os
from typing import Optional, Tuple, List, Dict

import httpx

_API_BASE = "https://api.github.com"


class GitHubClient:
    """Async client for GitHub Contents API operations."""

    def __init__(
        self,
        token: Optional[str] = None,
        repo: Optional[str] = None,
    ):
        self.token = token or os.environ.get("GITHUB_TOKEN", "")
        self.repo = repo or os.environ.get("GITHUB_REPO", "")
        self._client = httpx.AsyncClient(
            base_url=f"{_API_BASE}/repos/{self.repo}/contents",
            headers={
                "Authorization": f"Bearer {self.token}",
                "Accept": "application/vnd.github.v3+json",
            },
            timeout=30.0,
        )

    async def read_file(self, path: str) -> Optional[Tuple[str, str]]:
        """Read a file. Returns (content, sha) or None if not found."""
        resp = await self._client.get(f"/{path}")
        if resp.status_code == 404:
            return None
        data = resp.json()
        content = base64.b64decode(data["content"]).decode("utf-8")
        return content, data["sha"]

    async def write_file(
        self, path: str, content: str, message: str, sha: Optional[str] = None,
    ) -> str:
        """Create or update a file. Returns new SHA."""
        body = {
            "message": message,
            "content": base64.b64encode(content.encode("utf-8")).decode("ascii"),
        }
        if sha:
            body["sha"] = sha
        resp = await self._client.put(f"/{path}", json=body)
        return resp.json()["content"]["sha"]

    async def append_to_file(self, path: str, text: str, message: str) -> str:
        """Append text to an existing file (read-modify-write). Returns new SHA."""
        result = await self.read_file(path)
        if result is None:
            return await self.write_file(path, text, message=message)
        existing, sha = result
        return await self.write_file(path, existing + text, message=message, sha=sha)

    async def list_directory(self, path: str) -> List[Dict]:
        """List directory contents. Returns list of {name, type, path}."""
        resp = await self._client.get(f"/{path}")
        if resp.status_code == 404:
            return []
        return resp.json()

    async def upload_binary(self, path: str, data: bytes, message: str) -> str:
        """Upload a binary file (e.g., GP file). Returns SHA."""
        # Check if file already exists (need SHA to update)
        existing = await self.read_binary(path)
        body: dict = {
            "message": message,
            "content": base64.b64encode(data).decode("ascii"),
        }
        if existing:
            _, sha = existing
            body["sha"] = sha
        resp = await self._client.put(f"/{path}", json=body)
        data_json = resp.json()
        if "content" not in data_json:
            raise RuntimeError(f"GitHub API error on upload: {data_json}")
        return data_json["content"]["sha"]

    async def read_binary(self, path: str) -> Optional[Tuple[bytes, str]]:
        """Read a binary file. Returns (bytes, sha) or None if not found."""
        resp = await self._client.get(f"/{path}")
        if resp.status_code == 404:
            return None
        data = resp.json()
        content = base64.b64decode(data["content"])
        return content, data["sha"]

    async def delete_file(self, path: str, sha: str, message: str) -> None:
        """Delete a file from the repo."""
        await self._client.delete(f"/{path}", json={"message": message, "sha": sha})

    async def close(self):
        await self._client.aclose()
