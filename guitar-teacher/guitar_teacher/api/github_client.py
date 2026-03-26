"""GitHub Contents API client for reading/writing repo files."""
import asyncio
import base64
import logging
import os
from typing import Optional, Tuple, List, Dict

import httpx

logger = logging.getLogger(__name__)

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
        _headers = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/vnd.github.v3+json",
        }
        self._client = httpx.AsyncClient(
            base_url=f"{_API_BASE}/repos/{self.repo}/contents",
            headers=_headers,
            timeout=30.0,
        )
        self._git_client = httpx.AsyncClient(
            base_url=f"{_API_BASE}/repos/{self.repo}/git",
            headers=_headers,
            timeout=60.0,
        )

    async def read_file(self, path: str) -> Optional[Tuple[str, str]]:
        """Read a file. Returns (content, sha) or None if not found."""
        resp = await self._client.get(f"/{path}")
        if resp.status_code == 404:
            return None
        if not resp.is_success:
            raise RuntimeError(f"GitHub API error {resp.status_code} reading {path}: {resp.json().get('message', resp.text)}")
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
        # 422 means file already exists but no SHA was provided — fetch SHA and retry
        if resp.status_code == 422 and sha is None:
            existing = await self.read_file(path)
            if existing:
                body["sha"] = existing[1]
                resp = await self._client.put(f"/{path}", json=body)
        if not resp.is_success:
            raise RuntimeError(f"GitHub API error {resp.status_code} writing {path}: {resp.json().get('message', resp.text)}")
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
        if not resp.is_success:
            raise RuntimeError(f"GitHub API error {resp.status_code} listing {path}: {resp.json().get('message', resp.text)}")
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
            logger.error("GitHub API error on upload (status %s): %s", resp.status_code, data_json)
            raise RuntimeError(f"GitHub API error on upload: {data_json}")
        return data_json["content"]["sha"]

    async def read_binary(self, path: str) -> Optional[Tuple[bytes, str]]:
        """Read a binary file. Returns (bytes, sha) or None if not found."""
        resp = await self._client.get(f"/{path}")
        if resp.status_code == 404:
            return None
        if not resp.is_success:
            raise RuntimeError(f"GitHub API error {resp.status_code} reading {path}: {resp.json().get('message', resp.text)}")
        data = resp.json()
        content = base64.b64decode(data["content"])
        return content, data["sha"]

    async def delete_file(self, path: str, sha: str, message: str) -> None:
        """Delete a file from the repo."""
        await self._client.delete(f"/{path}", json={"message": message, "sha": sha})

    async def delete_directory(self, path: str, message: str) -> None:
        """Recursively delete all files in a directory."""
        items = await self.list_directory(path)
        for item in items:
            if item["type"] == "file":
                await self.delete_file(item["path"], item["sha"], message)
            elif item["type"] == "dir":
                await self.delete_directory(item["path"], message)

    async def commit_files_batch(
        self, files: Dict[str, str], message: str, branch: str = "main"
    ) -> None:
        """Commit multiple text files in a single Git commit (Git Trees API)."""
        git = self._git_client

        # Get current HEAD SHA
        ref_resp = await git.get(f"/refs/heads/{branch}")
        if not ref_resp.is_success:
            raise RuntimeError(f"Failed to get ref: {ref_resp.status_code} {ref_resp.text}")
        head_sha = ref_resp.json()["object"]["sha"]

        # Get base tree SHA from HEAD commit
        commit_resp = await git.get(f"/commits/{head_sha}")
        commit_resp.raise_for_status()
        base_tree_sha = commit_resp.json()["tree"]["sha"]

        # Create blobs for all files in parallel
        async def _create_blob(content: str) -> str:
            resp = await git.post("/blobs", json={
                "content": base64.b64encode(content.encode("utf-8")).decode("ascii"),
                "encoding": "base64",
            })
            resp.raise_for_status()
            return resp.json()["sha"]

        paths = list(files.keys())
        blob_shas = await asyncio.gather(*[_create_blob(c) for c in files.values()])

        # Create a new tree with all file entries
        tree_resp = await git.post("/trees", json={
            "base_tree": base_tree_sha,
            "tree": [
                {"path": path, "mode": "100644", "type": "blob", "sha": sha}
                for path, sha in zip(paths, blob_shas)
            ],
        })
        tree_resp.raise_for_status()
        new_tree_sha = tree_resp.json()["sha"]

        # Create the commit
        new_commit_resp = await git.post("/commits", json={
            "message": message,
            "tree": new_tree_sha,
            "parents": [head_sha],
        })
        new_commit_resp.raise_for_status()
        new_commit_sha = new_commit_resp.json()["sha"]

        # Advance the branch ref
        update_resp = await git.patch(f"/refs/heads/{branch}", json={
            "sha": new_commit_sha,
            "force": False,
        })
        update_resp.raise_for_status()

    async def close(self):
        await self._client.aclose()
        await self._git_client.aclose()
