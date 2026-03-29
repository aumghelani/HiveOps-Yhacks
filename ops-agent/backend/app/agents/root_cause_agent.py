from app.utils.lava_client import lava_client
from app.utils.tool_executor import execute_tool
from app.schemas.lava import RootCauseResult, TriageResult
from app.schemas.incident import IncidentRead
from app.utils.logger import get_logger

logger = get_logger("root_cause_agent")

ROOT_CAUSE_SYSTEM_PROMPT = """
You are the root cause analysis agent for HiveOps.

You receive:
- The incident details
- Triage classification
- Mock log lines from search_logs
- Recent deployments
- Config diff
- Optional Stage 2 memory context

Your job:
1. Identify the most likely root cause
2. Cite specific log lines or deployment facts as evidence
3. State confidence (0-1)
4. If confidence < 0.6, set needs_more_context: true

Output JSON only:
{
  "root_cause": "precise one-sentence root cause",
  "evidence": ["log line or fact 1", "deployment fact 2"],
  "confidence": 0.0-1.0,
  "needs_more_context": false,
  "context_request": null
}
"""


class RootCauseAgent:
    """Analyzes logs and deployments to identify root cause."""

    async def run(
        self,
        incident: IncidentRead,
        triage_result: TriageResult,
        stage2_context: dict | None,
        metadata: dict | None = None,
    ) -> RootCauseResult:
        # Gather evidence via tool calls
        logs = await execute_tool("search_logs", {
            "service": incident.service, "window_minutes": 30
        })
        deploys = await execute_tool("get_recent_deployments", {
            "service": incident.service
        })
        config_diff = await execute_tool("get_config_diff", {
            "service": incident.service
        })

        stage2_str = ""
        if stage2_context:
            stage2_str = f"\n\nStage 2 memory (matched past incident):\n{stage2_context}"

        messages = [{
            "role": "user",
            "content": (
                f"Incident: {incident.title}\n"
                f"Triage: category={triage_result.category} "
                f"causal_sig={triage_result.causal_sig}\n\n"
                f"Log evidence:\n" +
                "\n".join(logs.get("matches", [])) +
                f"\n\nRecent deployments:\n" +
                "\n".join(
                    f"- {d['version']} at {d['deployed_at']}: "
                    f"{', '.join(d.get('changes', []))}"
                    for d in deploys.get("deployments", [])
                ) +
                f"\n\nConfig diff:\n{config_diff.get('diff', 'none')}"
                + stage2_str
            )
        }]

        raw = await lava_client.chat_json(
            ROOT_CAUSE_SYSTEM_PROMPT,
            messages,
            model_tier="default",
            metadata={**(metadata or {}), "agent_name": "root_cause"},
        )
        result = RootCauseResult(**raw)

        # Confidence escalation
        if result.confidence < 0.60:
            logger.warning(f"root_cause low confidence={result.confidence}, escalating")
            raw2 = await lava_client.chat_json(
                ROOT_CAUSE_SYSTEM_PROMPT,
                messages,
                model_tier="strong",
                metadata={**(metadata or {}), "agent_name": "root_cause_escalated"},
            )
            result = RootCauseResult(**raw2)

        logger.info(f"root_cause: {result.root_cause[:60]} conf={result.confidence}")
        return result
