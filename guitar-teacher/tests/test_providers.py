import sys
import pytest
from unittest.mock import patch, MagicMock
from guitar_teacher.llm.providers import LLMConfig, call_llm, get_llm_config


class TestGetLLMConfig:
    def test_defaults(self):
        config = get_llm_config({})
        assert config.provider == "claude"
        assert config.model == "claude-sonnet-4-6"

    def test_overrides(self):
        config = get_llm_config({}, provider_override="ollama", model_override="llama3.1")
        assert config.provider == "ollama"
        assert config.model == "llama3.1"
        assert config.base_url == "http://localhost:11434"

    def test_reads_from_config_dict(self):
        config = get_llm_config({"llm": {"provider": "openai", "model": "gpt-4o"}})
        assert config.provider == "openai"
        assert config.model == "gpt-4o"


class TestCallLLM:
    def test_claude_provider(self):
        mock_anthropic = MagicMock()
        mock_client = MagicMock()
        mock_anthropic.Anthropic.return_value = mock_client
        mock_client.messages.create.return_value.content = [MagicMock(text="improved lesson")]

        with patch.dict(sys.modules, {"anthropic": mock_anthropic}):
            config = LLMConfig(provider="claude", model="test", api_key="key", base_url=None)
            result = call_llm(config, "system", "user prompt")
            assert result == "improved lesson"

    def test_unknown_provider_raises(self):
        config = LLMConfig(provider="unknown", model="test", api_key=None, base_url=None)
        with pytest.raises(ValueError, match="Unknown LLM provider"):
            call_llm(config, "system", "prompt")
