from app.utils.lava_client import lava_client
from app.schemas.lava import TriageResult
from app.schemas.incident import IncidentRead
from app.utils.logger import get_logger

logger = get_logger("triage_agent")

TRIAGE_SYSTEM_PROMPT = """
You are the triage agent for HiveOps.

Given an incident and optional similar past incidents from memory,
classify the incident precisely.

Use this causal_sig vocabulary ONLY:
db_pool_exhausted | bad_config_push | pod_oom_kill | downstream_timeout |
cert_expiry | rate_limit_hit | deploy_regression | disk_full |
race_condition_in_async_flow | cache_invalidation_bug | memory_leak |
missing_index | gateway_misconfiguration | unknown

Output JSON only:
{
  "category": "api_error.5xx | latency_spike | db_connection | config_push | ...",
  "causal_sig": "<from vocabulary above>",
  "confidence": 0.0-1.0,
  "reasoning": "one sentence explaining the classification",
  "severity": "P1|P2|P3"
}
"""


class TriageAgent:
    """Classifies incident severity, category, and causal signature."""

    async def run(
        self,
        incident: IncidentRead,
        similar_incidents: list[dict],
        metadata: dict | None = None,
    ) -> TriageResult:
        memory_context = ""
        if similar_incidents:
            memory_context = "\n\nSimilar past incidents from memory:\n"
            for si in similar_incidents[:4]:
                memory_context += (
                    f"- {si.get('original_id','?')}: "
                    f"{si.get('causal_sig','?')} → {si.get('outcome','?')} "
                    f"({si.get('resolved_in_min','?')} min)\n"
                )

        messages = [{
            "role": "user",
            "content": (
                f"Incident: {incident.title}\n"
                f"Service: {incident.service}\n"
                f"Severity: {incident.severity}\n"
                f"Description: {incident.description or ''}"
                + memory_context
            )
        }]

        raw = await lava_client.chat_json(
            TRIAGE_SYSTEM_PROMPT,
            messages,
            model_tier="fast",
            metadata={**(metadata or {}), "agent_name": "triage"},
        )
        logger.info(f"triage result: {raw.get('causal_sig')} conf={raw.get('confidence')}")
        return TriageResult(**raw)
