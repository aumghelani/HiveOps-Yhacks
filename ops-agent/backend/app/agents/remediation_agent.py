from app.utils.lava_client import lava_client
from app.schemas.lava import RemediationPlan, RootCauseResult, TriageResult
from app.schemas.incident import IncidentRead
from app.utils.logger import get_logger

logger = get_logger("remediation_agent")

REMEDIATION_SYSTEM_PROMPT = """
You are the remediation agent for HiveOps.

Given the root cause and optional matching playbook, propose a fix.

action_type must be one of:
config_rollback | pod_restart | pool_resize | manual_intervention

Output JSON only:
{
  "proposed_fix": "one sentence description of fix",
  "action_type": "config_rollback",
  "steps": ["step 1", "step 2", "step 3"],
  "risk_level": "low|medium|high",
  "playbook_id": "PB-001 or null",
  "confidence": 0.0-1.0
}
"""


class RemediationAgent:
    """Proposes a remediation plan from root cause + playbook."""

    async def run(
        self,
        incident: IncidentRead,
        triage_result: TriageResult,
        root_cause_result: RootCauseResult,
        playbook: dict | None,
        metadata: dict | None = None,
    ) -> RemediationPlan:
        playbook_str = ""
        if playbook:
            playbook_str = (
                f"\n\nMatching playbook ({playbook.get('playbook_id','?')}):\n"
                f"Title: {playbook.get('title')}\n"
                f"Steps: {playbook.get('steps')}\n"
                f"Success rate: {playbook.get('success_rate', 0)*100:.0f}%"
            )

        messages = [{
            "role": "user",
            "content": (
                f"Incident: {incident.title}\n"
                f"Service: {incident.service}\n"
                f"Root cause: {root_cause_result.root_cause}\n"
                f"Evidence: {root_cause_result.evidence}\n"
                f"Risk context: severity={incident.severity}"
                + playbook_str
            )
        }]

        raw = await lava_client.chat_json(
            REMEDIATION_SYSTEM_PROMPT,
            messages,
            model_tier="default",
            metadata={**(metadata or {}), "agent_name": "remediation"},
        )
        logger.info(f"remediation: {raw.get('action_type')} risk={raw.get('risk_level')}")
        return RemediationPlan(**raw)
