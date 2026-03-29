"""Progressive disclosure memory loader — 4 stages of increasing detail."""
from app.memory.hex_client import HexClient
from app.utils.logger import get_logger

logger = get_logger("memory_loader")

hex_client = HexClient()


class MemoryLoader:
    """Loads past incident matches in progressive stages (0-3)."""

    # Stage 0: just the count
    async def load_stage_0(self, incident_data: dict) -> dict:
        """Return only the count of matching past incidents."""
        matches = await hex_client.run_query({
            "service": incident_data.get("service", ""),
            "category": incident_data.get("category", ""),
            "causal_sig": incident_data.get("causal_sig", ""),
        })
        return {"match_count": len(matches), "stage": 0}

    # Stage 1: headline fields — title, severity, service, date
    async def load_stage_1(self, incident_data: dict) -> list[dict]:
        """Return headline-level fields for matching incidents."""
        matches = await hex_client.run_query({
            "service": incident_data.get("service", ""),
            "category": incident_data.get("category", ""),
            "causal_sig": incident_data.get("causal_sig", ""),
        })
        # Stage 1 returns ONLY headline fields — never full resolution paths
        return [
            {
                "original_id": m.get("original_id"),
                "service": m.get("service"),
                "category": m.get("category"),
                "causal_sig": m.get("causal_sig"),
                "severity": m.get("severity"),
                "outcome": m.get("outcome"),
                "resolved_in_min": m.get("resolved_in_min"),
                "match_score": m.get("match_score"),
            }
            for m in matches
        ]

    # Stage 2: causal signature and resolution summary
    async def load_stage_2(self, incident_id: str) -> dict:
        """Return causal signature and resolution summary for a specific match."""
        # In production, query resolved_incidents by original_id
        # For now, return mock detailed context
        return {
            "incident_id": incident_id,
            "causal_sig": "db_pool_exhausted",
            "timeline": [
                "Deploy v2.3.1 reduced pool.max from 20→5",
                "ConnectionPoolExhausted errors began 17min post-deploy",
                "Error rate climbed from 0.1% to 34% in 8 minutes",
                "Downstream order-service and checkout-api began cascading",
            ],
            "resolution_summary": "Reverted pool.max to 20 via config rollback, then rolling restart",
            "confidence_score": 0.94,
        }

    # Stage 3: full resolution path with step-by-step actions
    async def load_stage_3(self, incident_id: str) -> dict:
        """Return the complete resolution path with detailed steps."""
        return {
            "incident_id": incident_id,
            "resolution_path": [
                {"step": 1, "action": "Identified pool.max change in config diff", "duration_min": 3},
                {"step": 2, "action": "Confirmed ConnectionPoolExhausted in logs", "duration_min": 2},
                {"step": 3, "action": "Rolled back config to v2.3.0 values", "duration_min": 5},
                {"step": 4, "action": "Rolling restart of 3 payment-service pods", "duration_min": 8},
                {"step": 5, "action": "Error rate returned to baseline (0.1%)", "duration_min": 4},
            ],
            "total_resolution_min": 22,
            "playbook_used": "PB-001",
            "human_review_note": "Approved by oncall SRE — added pool.max CI check",
        }

    # Find the best matching playbook for automated remediation
    async def get_matching_playbook(self, incident_data: dict) -> dict | None:
        """Return the highest-confidence playbook match, or None."""
        causal_sig = incident_data.get("causal_sig", "")
        # Mock playbook lookup
        playbooks = {
            "db_pool_exhausted": {
                "playbook_id": "PB-001",
                "causal_sig": "db_pool_exhausted",
                "category": "api_error.5xx",
                "title": "DB Connection Pool Resize",
                "steps": [
                    {"step": 1, "action": "Check current pool config", "command": "kubectl get configmap db-config -o yaml"},
                    {"step": 2, "action": "Increase pool_size to 20", "command": "kubectl edit configmap db-config"},
                    {"step": 3, "action": "Rolling restart", "command": "kubectl rollout restart deployment/payment-service"},
                    {"step": 4, "action": "Monitor error rate 5min", "command": None},
                ],
                "success_rate": 0.96,
                "used_count": 47,
            },
            "bad_config_push": {
                "playbook_id": "PB-002",
                "causal_sig": "bad_config_push",
                "category": "config_push",
                "title": "Config Rollback",
                "steps": [
                    {"step": 1, "action": "Identify last good config", "command": "kubectl get configmap --show-labels"},
                    {"step": 2, "action": "Apply rollback", "command": "kubectl apply -f config-previous.yaml"},
                    {"step": 3, "action": "Verify health", "command": "curl -s https://service/health"},
                    {"step": 4, "action": "Monitor 5min", "command": None},
                ],
                "success_rate": 0.99,
                "used_count": 23,
            },
            "pod_oom_kill": {
                "playbook_id": "PB-003",
                "causal_sig": "pod_oom_kill",
                "category": "pod_oom_kill",
                "title": "Pod Memory Limit Increase",
                "steps": [
                    {"step": 1, "action": "Confirm OOM in events", "command": "kubectl describe pod <pod>"},
                    {"step": 2, "action": "Increase memory limit", "command": "kubectl set resources deployment/<name> --limits=memory=1Gi"},
                    {"step": 3, "action": "Watch rollout", "command": "kubectl rollout status deployment/<name>"},
                ],
                "success_rate": 0.94,
                "used_count": 31,
            },
        }
        return playbooks.get(causal_sig)


# Module-level instance
memory_loader = MemoryLoader()
