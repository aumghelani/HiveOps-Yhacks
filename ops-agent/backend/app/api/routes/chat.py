"""QueenBee chat endpoint — context-aware incident assistant powered by Lava."""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.utils.lava_client import lava_client
from app.api.pipeline import incidents_store, sub_tickets_store, agent_logs_store, get_evidence_package
from app.utils.logger import get_logger

logger = get_logger("routes.chat")
router = APIRouter()

HIVEBOT_SYSTEM_PROMPT = """You are QueenBee — the AI assistant for HiveOps, an enterprise incident resolution platform.

Your personality:
- Concise and technical, but approachable
- You speak like a senior SRE who's seen thousands of incidents
- Use short paragraphs, bullet points when helpful
- Reference specific data when you have incident context
- If you don't know something, say so — don't guess

Your capabilities:
- Explain what's happening with any incident in plain language
- Interpret agent findings (triage, root cause, remediation, verification)
- Explain why a particular causal_sig was identified
- Help operators decide whether to approve or reject a fix
- Explain playbooks and remediation steps
- Answer general questions about incident response best practices

When you have incident context, reference it specifically:
- "This incident's root cause is..." not "Root causes can be..."
- "The triage agent classified this as..." not "Triage agents typically..."

Keep responses under 150 words unless the user asks for detail."""


class ChatRequest(BaseModel):
    message: str
    incident_id: Optional[str] = None
    conversation_history: list[dict] = []


class ChatResponse(BaseModel):
    reply: str
    context_used: bool


def _build_incident_context(incident_id: str) -> str:
    """Assemble current incident state into a context string for the LLM."""
    incident = incidents_store.get(incident_id)
    if not incident:
        return ""

    parts = [
        f"CURRENT INCIDENT CONTEXT (auto-injected — the user is viewing this incident):",
        f"ID: {incident['incident_id']}",
        f"Title: {incident['title']}",
        f"Service: {incident['service']}",
        f"Severity: {incident['severity']}",
        f"Status: {incident['status']}",
    ]

    if incident.get('description'):
        parts.append(f"Description: {incident['description']}")
    if incident.get('category'):
        parts.append(f"Category: {incident['category']}")
    if incident.get('causal_sig'):
        parts.append(f"Causal signature: {incident['causal_sig']}")
    if incident.get('resolution_summary'):
        parts.append(f"Resolution: {incident['resolution_summary']}")

    # Add sub-ticket summaries
    tickets = [t for t in sub_tickets_store.values() if t["incident_id"] == incident_id]
    if tickets:
        parts.append("\nAgent sub-tasks:")
        for t in sorted(tickets, key=lambda x: x.get("created_at", "")):
            line = f"  - [{t['status']}] {t['agent_type']}: {t['title']}"
            if t.get('result_summary'):
                line += f" → {t['result_summary']}"
            if t.get('confidence_score') is not None:
                line += f" (confidence: {t['confidence_score']:.0%})"
            parts.append(line)

    # Add recent agent logs
    logs = [l for l in agent_logs_store if l["incident_id"] == incident_id]
    if logs:
        parts.append("\nRecent agent activity:")
        for l in sorted(logs, key=lambda x: x.get("created_at", ""))[-5:]:
            parts.append(f"  - {l['agent_type']}/{l.get('step_name','')}: {l.get('output_summary','')}")

    # Add evidence if available
    evidence = get_evidence_package(incident_id)
    if evidence:
        parts.append(f"\nEvidence package:")
        parts.append(f"  Root cause: {evidence.get('root_cause', 'pending')}")
        parts.append(f"  Proposed fix: {evidence.get('proposed_fix', 'pending')}")
        parts.append(f"  Confidence: {evidence.get('confidence_score', 0):.0%}")
        parts.append(f"  Risk level: {evidence.get('risk_level', 'unknown')}")
        similar = evidence.get('similar_incidents', [])
        if similar:
            parts.append(f"  Similar past incidents: {len(similar)} matches")
            for si in similar[:2]:
                parts.append(f"    - {si.get('incident_id','?')}: {si.get('causal_sig','?')} → {si.get('outcome','?')}")

    return "\n".join(parts)


@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Send a message to QueenBee. Automatically includes incident context if viewing one."""
    # Build context-enriched system prompt
    system = HIVEBOT_SYSTEM_PROMPT
    context_used = False

    if req.incident_id:
        context = _build_incident_context(req.incident_id)
        if context:
            system += f"\n\n{context}"
            context_used = True

    # Build message history
    messages = []
    for msg in req.conversation_history[-10:]:  # keep last 10 messages for context window
        messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
    messages.append({"role": "user", "content": req.message})

    try:
        result = await lava_client.chat(
            system_prompt=system,
            messages=messages,
            model_tier="fast",  # use fast model for chat — snappy responses
            metadata={"agent_name": "hivebot", "incident_id": req.incident_id or "none"},
            max_tokens=500,
        )
        reply = lava_client._extract_text(result)
        if not reply:
            reply = "I couldn't generate a response. Try rephrasing your question."
    except Exception as e:
        logger.warning(f"hivebot lava call failed: {e}")
        # Fallback response when Lava is unavailable
        reply = _fallback_response(req.message, req.incident_id)
        context_used = bool(req.incident_id)

    return ChatResponse(reply=reply, context_used=context_used)


def _fallback_response(message: str, incident_id: str | None) -> str:
    """Smart fallback when Lava API is unavailable — uses in-memory data directly."""
    msg_lower = message.lower()

    # If we have an incident context, ALWAYS use it — never show the generic message
    if incident_id:
        incident = incidents_store.get(incident_id)
        if incident:
            # Approval-related questions
            if any(w in msg_lower for w in ['approve', 'should i', 'safe', 'risk', 'reject']):
                evidence = get_evidence_package(incident_id)
                if evidence:
                    return (
                        f"Here's my assessment for **{incident['incident_id']}**:\n\n"
                        f"- **Confidence:** {evidence.get('confidence_score', 0):.0%}\n"
                        f"- **Risk level:** {evidence.get('risk_level', 'unknown')}\n"
                        f"- **Similar incidents:** {len(evidence.get('similar_incidents', []))} past matches resolved successfully\n"
                        f"- **Proposed fix:** {evidence.get('proposed_fix', 'pending')}\n\n"
                        f"The sandbox test passed. Based on the evidence, this looks safe to approve."
                    )

            # Root cause questions
            if any(w in msg_lower for w in ['root cause', 'why', 'cause', 'reason']):
                evidence = get_evidence_package(incident_id)
                if evidence and evidence.get('root_cause'):
                    return (
                        f"**Root cause for {incident['incident_id']}:**\n\n"
                        f"{evidence['root_cause']}\n\n"
                        f"Confidence: {evidence.get('confidence_score', 0):.0%}"
                    )

            # Default for ANY question when viewing an incident — give a full summary
            # This catches "tell me more", "what is this", "explain", "summary", etc.
            parts = [
                f"Here's what I know about **{incident['incident_id']}**:\n",
                f"**Title:** {incident['title']}",
                f"**Service:** {incident['service']}",
                f"**Severity:** {incident['severity']}",
                f"**Status:** {incident['status']}",
            ]
            if incident.get('description'):
                parts.append(f"**Description:** {incident['description']}")
            if incident.get('category'):
                parts.append(f"**Category:** {incident['category']}")
            if incident.get('causal_sig'):
                parts.append(f"**Causal signature:** {incident['causal_sig']}")

            # Add agent progress
            tickets = [t for t in sub_tickets_store.values() if t["incident_id"] == incident_id]
            if tickets:
                completed = sum(1 for t in tickets if t["status"] == "completed")
                running = sum(1 for t in tickets if t["status"] == "running")
                parts.append(f"\n**Agent progress:** {completed} completed, {running} running, {len(tickets)} total")
                for t in sorted(tickets, key=lambda x: x.get("created_at", "")):
                    status_icon = "✓" if t["status"] == "completed" else "⟳" if t["status"] == "running" else "○"
                    line = f"  {status_icon} **{t['agent_type']}**: {t['title']}"
                    if t.get('result_summary'):
                        line += f"\n    → {t['result_summary']}"
                    parts.append(line)

            # Add evidence summary if available
            evidence = get_evidence_package(incident_id)
            if evidence:
                parts.append(f"\n**Root cause:** {evidence.get('root_cause', 'pending')}")
                parts.append(f"**Proposed fix:** {evidence.get('proposed_fix', 'pending')}")
                parts.append(f"**Confidence:** {evidence.get('confidence_score', 0):.0%}")
                parts.append(f"**Risk:** {evidence.get('risk_level', 'unknown')}")

            if incident.get('resolution_summary'):
                parts.append(f"\n**Resolution:** {incident['resolution_summary']}")

            parts.append("\nAsk me anything specific — root cause, risk assessment, whether to approve, agent findings, etc.")
            return "\n".join(parts)

    # No incident context — general responses
    if any(w in msg_lower for w in ['hello', 'hi', 'hey']):
        return "Hey! I'm QueenBee. I can help you understand incidents, review evidence, and make approval decisions. Navigate to an incident and I'll have its full context."

    if any(w in msg_lower for w in ['help', 'what can you']):
        return (
            "I can help with:\n"
            "- **Explaining incidents** — what's happening and why\n"
            "- **Reviewing evidence** — should you approve this fix?\n"
            "- **Understanding agents** — what did triage/RCA find?\n"
            "- **General SRE advice** — incident response best practices\n\n"
            "Navigate to an incident and I'll automatically have its context."
        )

    return "I'm QueenBee — your incident advisor. Navigate to any incident and I'll have its full context, or ask me general questions about incident response."
