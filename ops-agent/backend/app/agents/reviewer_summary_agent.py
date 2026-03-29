from app.utils.lava_client import lava_client
from app.schemas.lava import (
    ReviewerSummary, TriageResult, RootCauseResult,
    RemediationPlan, VerificationResult
)
from app.schemas.incident import IncidentRead
from app.utils.logger import get_logger

logger = get_logger("reviewer_summary_agent")

REVIEWER_SUMMARY_PROMPT = """
You are the reviewer summary agent for HiveOps.
Assemble all agent findings into a concise evidence dossier for the human reviewer.

Output JSON only:
{
  "executive_summary": "2-3 sentences max",
  "root_cause": "precise root cause",
  "proposed_fix": "what will be done",
  "confidence_score": 0.0-1.0,
  "risk_level": "low|medium|high",
  "key_evidence": ["evidence item 1", "evidence item 2", "evidence item 3"],
  "similar_incidents": ["INC-XXX (94% match)", "INC-YYY (78% match)"],
  "approval_recommendation": "recommend_approve|needs_review|escalate"
}
"""


class ReviewerSummaryAgent:
    """Assembles the final evidence dossier for human review."""

    async def run(
        self,
        incident: IncidentRead,
        triage: TriageResult,
        root_cause: RootCauseResult,
        remediation: RemediationPlan,
        verification: VerificationResult,
        similar_incidents: list[dict],
        metadata: dict | None = None,
    ) -> ReviewerSummary:
        similar_str = "\n".join(
            f"- {si.get('original_id')}: {si.get('causal_sig')} → "
            f"{si.get('outcome')} in {si.get('resolved_in_min')} min "
            f"(score: {si.get('match_score', '?')})"
            for si in similar_incidents[:3]
        )

        messages = [{
            "role": "user",
            "content": (
                f"Incident: {incident.title} ({incident.service}, {incident.severity})\n\n"
                f"Triage: {triage.category} / {triage.causal_sig} (conf: {triage.confidence})\n"
                f"Root cause: {root_cause.root_cause} (conf: {root_cause.confidence})\n"
                f"Evidence: {root_cause.evidence}\n\n"
                f"Remediation: {remediation.proposed_fix}\n"
                f"Action: {remediation.action_type}\n"
                f"Steps: {remediation.steps}\n"
                f"Risk: {remediation.risk_level}\n\n"
                f"Verification: {verification.verdict}\n"
                f"Summary: {verification.summary}\n"
                f"Risk factors: {verification.risk_factors}\n\n"
                f"Similar incidents:\n{similar_str}"
            )
        }]

        raw = await lava_client.chat_json(
            REVIEWER_SUMMARY_PROMPT,
            messages,
            model_tier="default",
            metadata={**(metadata or {}), "agent_name": "reviewer_summary"},
        )
        logger.info(f"reviewer_summary: rec={raw.get('approval_recommendation')}")
        return ReviewerSummary(**raw)
