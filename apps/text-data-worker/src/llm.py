from abc import ABC, abstractmethod
from typing import Any

from openai import AsyncOpenAI


class LLMAdapter(ABC):
    @abstractmethod
    async def chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Returns the first choice message as a dict."""
        ...


class OpenAICompatibleAdapter(LLMAdapter):
    def __init__(self, api_key: str, base_url: str, model: str):
        self._client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self._model = model

    async def chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
    ) -> dict[str, Any]:
        response = await self._client.chat.completions.create(
            model=self._model,
            messages=messages,
            tools=tools,
            tool_choice="auto",
        )
        msg = response.choices[0].message
        return {
            "content": msg.content,
            "tool_calls": [
                {
                    "id": tc.id,
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments,
                    },
                }
                for tc in (msg.tool_calls or [])
            ],
        }


def make_llm_adapter(provider: str, **kwargs) -> LLMAdapter:
    if provider == "deepseek":
        return OpenAICompatibleAdapter(
            api_key=kwargs["deepseek_api_key"],
            base_url=kwargs["deepseek_base_url"],
            model=kwargs["deepseek_model"],
        )
    if provider == "openai":
        return OpenAICompatibleAdapter(
            api_key=kwargs["openai_api_key"],
            base_url=kwargs["openai_base_url"],
            model=kwargs["openai_model"],
        )
    if provider == "ollama":
        return OpenAICompatibleAdapter(
            api_key="ollama",
            base_url=kwargs["ollama_base_url"],
            model=kwargs["ollama_model"],
        )
    raise ValueError(f"unknown LLM provider: {provider!r}")
