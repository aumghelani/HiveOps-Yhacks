import time
import json
import httpx
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("lava_client")

MODEL_TIERS = {
    "fast":    settings.lava_fast_model,
    "default": settings.lava_default_model,
    "strong":  settings.lava_strong_model,
}

TOOL_DEFINITIONS = [
    {
        "name": "search_logs",
        "description": "Search service logs for error patterns in a time window",
        "input_schema": {
            "type": "object",
            "properties": {
                "service": {"type": "string"},
                "window_minutes": {"type": "integer", "default": 30},
                "error_pattern": {"type": "string"}
            },
            "required": ["service"]
        }
    },
    {
        "name": "get_recent_deployments",
        "description": "Get recent deployments for a service",
        "input_schema": {
            "type": "object",
            "properties": {
                "service": {"type": "string"},
                "limit": {"type": "integer", "default": 5}
            },
            "required": ["service"]
        }
    },
    {
        "name": "get_service_metrics",
        "description": "Get current error rate and latency metrics",
        "input_schema": {
            "type": "object",
            "properties": {
                "service": {"type": "string"},
                "metric": {"type": "string", "enum": ["error_rate","latency_p95","cpu","memory"]}
            },
            "required": ["service", "metric"]
        }
    },
    {
        "name": "get_config_diff",
        "description": "Get config changes applied to a service in the last N hours",
        "input_schema": {
            "type": "object",
            "properties": {
                "service": {"type": "string"},
                "hours": {"type": "integer", "default": 2}
            },
            "required": ["service"]
        }
    },
    {
        "name": "run_sandbox_command",
        "description": "Run a remediation action in the mocked sandbox environment",
        "input_schema": {
            "type": "object",
            "properties": {
                "action_type": {"type": "string"},
                "params": {"type": "object"}
            },
            "required": ["action_type"]
        }
    },
    {
        "name": "get_hex_stage_context",
        "description": "Query the Hex memory layer for similar past incidents",
        "input_schema": {
            "type": "object",
            "properties": {
                "service": {"type": "string"},
                "causal_sig": {"type": "string"},
                "stage": {"type": "integer", "enum": [1, 2, 3]}
            },
            "required": ["service", "stage"]
        }
    },
]


class LavaClient:
    """Singleton LLM gateway — all agent calls route through here."""

    def __init__(self) -> None:
        self.base_url = settings.lava_base_url.rstrip("/")
        self.api_key  = settings.lava_api_key
        self.headers  = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type":  "application/json",
        }

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_fixed(2),
        retry=retry_if_exception_type(httpx.HTTPStatusError),
    )
    async def chat(
        self,
        system_prompt: str,
        messages: list[dict],
        model_tier: str = "default",
        tools: list[dict] | None = None,
        metadata: dict | None = None,
        max_tokens: int = 2000,
    ) -> dict:
        """Core LLM call through Lava. Returns full response dict."""
        model = MODEL_TIERS.get(model_tier, MODEL_TIERS["default"])
        start = time.monotonic()

        payload: dict = {
            "model":      model,
            "max_tokens": max_tokens,
            "system":     system_prompt,
            "messages":   messages,
        }
        if tools:
            payload["tools"] = tools

        headers = dict(self.headers)
        if metadata:
            headers["X-HiveOps-Incident"] = metadata.get("incident_id", "")
            headers["X-HiveOps-Agent"]    = metadata.get("agent_name", "")

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{self.base_url}/messages",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            result = resp.json()

        latency_ms = int((time.monotonic() - start) * 1000)
        tokens = result.get("usage", {}).get("input_tokens", 0) + \
                 result.get("usage", {}).get("output_tokens", 0)

        logger.info(
            f"lava_call model={model} "
            f"agent={metadata.get('agent_name','?') if metadata else '?'} "
            f"tokens={tokens} latency_ms={latency_ms}"
        )
        return result

    async def chat_json(
        self,
        system_prompt: str,
        messages: list[dict],
        model_tier: str = "default",
        metadata: dict | None = None,
        max_tokens: int = 1500,
    ) -> dict:
        """Call Lava and parse response as strict JSON."""
        json_instruction = (
            "\n\nIMPORTANT: Respond with valid JSON only. "
            "No markdown fences, no preamble, no explanation."
        )
        resp = await self.chat(
            system_prompt + json_instruction,
            messages,
            model_tier=model_tier,
            metadata=metadata,
            max_tokens=max_tokens,
        )

        raw = self._extract_text(resp)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("JSON parse failed, escalating to strong model")
            resp2 = await self.chat(
                system_prompt + json_instruction,
                messages,
                model_tier="strong",
                metadata=metadata,
                max_tokens=max_tokens,
            )
            return json.loads(self._extract_text(resp2))

    async def chat_with_tools(
        self,
        system_prompt: str,
        messages: list[dict],
        model_tier: str = "default",
        metadata: dict | None = None,
    ) -> tuple[str | None, list[dict]]:
        """Call Lava with tool definitions. Returns (text, tool_use_blocks)."""
        resp = await self.chat(
            system_prompt,
            messages,
            model_tier=model_tier,
            tools=TOOL_DEFINITIONS,
            metadata=metadata,
        )
        content = resp.get("content", [])
        text_blocks = [b["text"] for b in content if b.get("type") == "text"]
        tool_blocks = [b for b in content if b.get("type") == "tool_use"]
        return (text_blocks[0] if text_blocks else None, tool_blocks)

    def _extract_text(self, resp: dict) -> str:
        """Pull text content from a Lava/Anthropic-style response."""
        content = resp.get("content", [])
        for block in content:
            if block.get("type") == "text":
                return block["text"].strip()
        return ""


# Singleton — import lava_client everywhere, never re-instantiate
lava_client = LavaClient()
