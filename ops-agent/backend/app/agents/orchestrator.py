from app.utils.lava_client import lava_client
from app.schemas.lava import OrchestratorPlan
from app.schemas.incident import IncidentRead
from app.utils.logger import get_logger

logger = get_logger("orchestrator")

ORCHESTRATOR_SYSTEM_PROMPT = """
You are the orchestrator agent for HiveOps — an enterprise incident resolution system.

You receive an incident ticket and must:
1. Analyze the incident title, description, service, and severity.
2. Make an initial causal_sig guess from this vocabulary:
   db_pool_exhausted | bad_config_push | pod_oom_kill | downstream_timeout |
   cert_expiry | rate_limit_hit | deploy_regression | disk_full |
   race_condition_in_async_flow | cache_invalidation_bug | memory_leak |
   missing_index | gateway_misconfiguration | unknown
3. Decide the optimal agent sequence (always starts with triage):
   Options: triage → root_cause → remediation → verification → reviewer_summary
4. Output a JSON plan.

Always output valid JSON only. No markdown, no explanation outside JSON.

Output schema:
{
  "incident_summary": "one sentence",
  "priority_service": "service name",
  "causal_sig_guess": "one of the vocabulary above",
  "severity_confirmed": "P1|P2|P3",
  "agent_sequence": ["triage","root_cause","remediation","verification","reviewer_summary"],
  "initial_hypothesis": "your best guess",
  "memory_query": {"service": "...", "category": "...", "causal_sig": "..."}
}
"""


class OrchestratorAgent:
    """Plans the full agent pipeline for a given incident."""

    async def run(
        self,
        incident: IncidentRead,
        metadata: dict | None = None,
    ) -> OrchestratorPlan:
        messages = [{
            "role": "user",
            "content": (
                f"Incident: {incident.title}\n"
                f"Service: {incident.service}\n"
                f"Severity: {incident.severity}\n"
                f"Description: {incident.description or 'No description provided'}"
            )
        }]
        raw = await lava_client.chat_json(
            ORCHESTRATOR_SYSTEM_PROMPT,
            messages,
            model_tier="default",
            metadata={**(metadata or {}), "agent_name": "orchestrator"},
        )
        logger.info(f"orchestrator plan: {raw.get('causal_sig_guess')} "
                    f"sequence={raw.get('agent_sequence')}")
        return OrchestratorPlan(**raw)
