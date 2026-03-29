from app.utils.lava_client import lava_client
from app.utils.tool_executor import execute_tool
from app.schemas.lava import VerificationResult, RemediationPlan
from app.utils.logger import get_logger

logger = get_logger("verification_agent")

VERIFICATION_SYSTEM_PROMPT = """
You are the verification agent for HiveOps.
You receive sandbox execution results and assess if the fix is safe to deploy.

Output JSON only:
{
  "verdict": "safe|risky|failed",
  "summary": "one sentence",
  "risk_factors": ["list any risks or empty array"],
  "ready_for_human_review": true
}
"""


class VerificationAgent:
    """Runs sandbox and verifies the remediation plan is safe."""

    async def run(
        self,
        remediation_plan: RemediationPlan,
        incident_id: str,
        metadata: dict | None = None,
    ) -> tuple[VerificationResult, dict]:
        sandbox_result = await execute_tool("run_sandbox_command", {
            "action_type": remediation_plan.action_type,
            "params": {"service": metadata.get("service", "") if metadata else ""}
        })

        messages = [{
            "role": "user",
            "content": (
                f"Proposed fix: {remediation_plan.proposed_fix}\n"
                f"Action type: {remediation_plan.action_type}\n"
                f"Risk level from remediation agent: {remediation_plan.risk_level}\n\n"
                f"Sandbox result:\n"
                f"Status: {sandbox_result.get('status')}\n"
                f"Health check: {sandbox_result.get('health_check')}\n"
                f"Diff: {sandbox_result.get('diff', 'N/A')}\n"
                f"Error rate after: {sandbox_result.get('error_rate_after', 'N/A')}"
            )
        }]

        raw = await lava_client.chat_json(
            VERIFICATION_SYSTEM_PROMPT,
            messages,
            model_tier="fast",
            metadata={**(metadata or {}), "agent_name": "verification"},
        )
        logger.info(f"verification verdict={raw.get('verdict')}")
        return VerificationResult(**raw), sandbox_result
