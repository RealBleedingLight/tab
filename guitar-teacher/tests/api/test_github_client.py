import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from guitar_teacher.api.github_client import GitHubClient


@pytest.fixture
def client():
    return GitHubClient(token="fake-token", repo="user/repo")


async def test_read_file(client):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "content": "SGVsbG8gd29ybGQ=",  # base64 "Hello world"
        "sha": "abc123",
    }
    with patch.object(client._client, "get", new_callable=AsyncMock, return_value=mock_response):
        content, sha = await client.read_file("test.md")
    assert content == "Hello world"
    assert sha == "abc123"


async def test_read_file_not_found(client):
    mock_response = MagicMock()
    mock_response.status_code = 404
    with patch.object(client._client, "get", new_callable=AsyncMock, return_value=mock_response):
        result = await client.read_file("missing.md")
    assert result is None


async def test_write_file(client):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"content": {"sha": "new-sha"}}
    with patch.object(client._client, "put", new_callable=AsyncMock, return_value=mock_response):
        sha = await client.write_file("test.md", "new content", message="update", sha="old-sha")
    assert sha == "new-sha"


async def test_write_file_create_new(client):
    mock_response = MagicMock()
    mock_response.status_code = 201
    mock_response.json.return_value = {"content": {"sha": "created-sha"}}
    with patch.object(client._client, "put", new_callable=AsyncMock, return_value=mock_response):
        sha = await client.write_file("new.md", "content", message="create")
    assert sha == "created-sha"


async def test_list_directory(client):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [
        {"name": "file1.md", "type": "file", "path": "dir/file1.md"},
        {"name": "subdir", "type": "dir", "path": "dir/subdir"},
    ]
    with patch.object(client._client, "get", new_callable=AsyncMock, return_value=mock_response):
        items = await client.list_directory("dir")
    assert len(items) == 2
    assert items[0]["name"] == "file1.md"


async def test_read_binary(client):
    mock_response = MagicMock()
    mock_response.status_code = 200
    import base64
    mock_response.json.return_value = {
        "content": base64.b64encode(b"\x00\x01\x02binary").decode(),
        "sha": "bin-sha",
    }
    with patch.object(client._client, "get", new_callable=AsyncMock, return_value=mock_response):
        data, sha = await client.read_binary("file.gp")
    assert data == b"\x00\x01\x02binary"
    assert sha == "bin-sha"


async def test_append_to_file(client):
    """Append should read-modify-write."""
    read_response = MagicMock()
    read_response.status_code = 200
    read_response.json.return_value = {
        "content": "ZXhpc3Rpbmc=",  # base64 "existing"
        "sha": "old-sha",
    }
    write_response = MagicMock()
    write_response.status_code = 200
    write_response.json.return_value = {"content": {"sha": "new-sha"}}

    with patch.object(client._client, "get", new_callable=AsyncMock, return_value=read_response), \
         patch.object(client._client, "put", new_callable=AsyncMock, return_value=write_response) as mock_put:
        sha = await client.append_to_file("log.md", "\nnew entry", message="append")

    assert sha == "new-sha"
    # Verify the written content is "existing" + "\nnew entry"
    call_args = mock_put.call_args
    import base64
    written = base64.b64decode(call_args[1]["json"]["content"]).decode()
    assert written == "existing\nnew entry"
