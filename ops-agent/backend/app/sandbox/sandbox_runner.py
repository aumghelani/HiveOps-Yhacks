"""Sandbox runner — fully mocked infrastructure simulation. Never touches real infra."""
from typing import Any
from datetime import datetime
from app.utils.logger import get_logger

logger = get_logger("sandbox_runner")

# Predefined sandbox results by action type
SANDBOX_SCENARIOS: dict[str, dict[str, Any]] = {
    "pool_resize": {
        "before_state": {"config_version": "v2.3.1", "pool.max": 5, "pool.idle": 2},
        "after_state":  {"config_version": "v2.3.1-patched", "pool.max": 20, "pool.idle": 10},
        "diff_output": (
            "- pool.max: 5\n+ pool.max: 20\n"
            "- pool.idle: 2\n+ pool.idle: 10"
        ),
        "health_check": "pass",
        "error_message": None,
    },
    "config_rollback": {
        "before_state": {"config_version": "v1.4.3", "jwt_secret": None},
        "after_state":  {"config_version": "v1.4.2", "jwt_secret": "SET"},
        "diff_output": (
            "- config_version: v1.4.3\n+ config_version: v1.4.2\n"
            "- jwt_secret: null\n+ jwt_secret: <redacted>"
        ),
        "health_check": "pass",
        "error_message": None,
    },
    "pod_restart": {
        "before_state": {"pods_running": 3, "pods_oom": 3, "memory_limit": "512Mi"},
        "after_state":  {"pods_running": 3, "pods_oom": 0, "memory_limit": "1Gi"},
        "diff_output": (
            "- memory_limit: 512Mi\n+ memory_limit: 1Gi\n"
            "- pods_oom: 3\n+ pods_oom: 0"
        ),
        "health_check": "pass",
        "error_message": None,
    },
    "manual_intervention": {
        "before_state": {"status": "degraded"},
        "after_state":  {"status": "healthy"},
        "diff_output": "Manual investigation completed",
        "health_check": "pass",
        "error_message": None,
    },
}


class SandboxRunner:
    """Simulates remediation actions in a safe mock environment."""

    async def run_action(self, action: dict[str, Any]) -> dict[str, Any]:
        """Execute a remediation action in the sandbox and return before/after state."""
        action_type = action.get("action_type", "manual_intervention")
        incident_id = action.get("incident_id", "unknown")

        logger.info(f"sandbox_run incident={incident_id} action={action_type}")

        scenario = SANDBOX_SCENARIOS.get(action_type, SANDBOX_SCENARIOS["manual_intervention"])

        return {
            "incident_id": incident_id,
            "action_type":  action_type,
            "before_state": scenario["before_state"],
            "after_state":  scenario["after_state"],
            "diff_output":  scenario["diff_output"],
            "health_check": scenario["health_check"],
            "error_message": scenario["error_message"],
            "created_at":   datetime.utcnow().isoformat(),
        }


# Singleton
sandbox_runner = SandboxRunner()
