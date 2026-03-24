"""LLM provider abstraction."""
import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class LLMConfig:
    provider: str
    model: str
    api_key: Optional[str]
    base_url: Optional[str]


def get_llm_config(config, provider_override=None, model_override=None):
    """Build LLMConfig from config dict and CLI overrides."""
    llm = config.get("llm", {})
    provider = provider_override or llm.get("provider", "claude")
    model = model_override or llm.get("model", "claude-sonnet-4-6")
    api_key_env = llm.get("api_key_env", "ANTHROPIC_API_KEY")
    api_key = os.environ.get(api_key_env) if provider != "ollama" else None
    base_url = llm.get("base_url")
    if provider == "ollama" and not base_url:
        base_url = "http://localhost:11434"
    return LLMConfig(provider=provider, model=model, api_key=api_key, base_url=base_url)


def call_llm(config, system_prompt, user_prompt):
    """Send a prompt to the configured LLM and return the response text."""
    if config.provider == "claude":
        import anthropic
        client = anthropic.Anthropic(api_key=config.api_key)
        response = client.messages.create(
            model=config.model,
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return response.content[0].text

    elif config.provider == "openai":
        import openai
        client = openai.OpenAI(api_key=config.api_key)
        response = client.chat.completions.create(
            model=config.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        return response.choices[0].message.content

    elif config.provider == "ollama":
        import httpx
        resp = httpx.post(
            f"{config.base_url}/api/generate",
            json={
                "model": config.model,
                "prompt": user_prompt,
                "system": system_prompt,
                "stream": False,
            },
            timeout=120.0,
        )
        resp.raise_for_status()
        return resp.json()["response"]

    else:
        raise ValueError(f"Unknown LLM provider: {config.provider}")
