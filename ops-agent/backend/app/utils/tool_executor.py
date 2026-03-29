"""Mocked tool execution layer — realistic data without real infrastructure."""
from datetime import datetime, timedelta
from app.utils.logger import get_logger

logger = get_logger("tool_executor")


async def execute_tool(tool_name: str, tool_input: dict) -> dict:
    """Dispatch tool call to mocked implementation."""
    handlers = {
        "search_logs":          _search_logs,
        "get_recent_deployments": _get_recent_deployments,
        "get_service_metrics":  _get_service_metrics,
        "get_config_diff":      _get_config_diff,
        "run_sandbox_command":  _run_sandbox_command,
        "get_hex_stage_context": _get_hex_stage_context,
    }
    handler = handlers.get(tool_name)
    if not handler:
        return {"error": f"Unknown tool: {tool_name}"}

    logger.info(f"tool_call tool={tool_name} input={tool_input}")
    return await handler(tool_input)


async def _search_logs(params: dict) -> dict:
    service = params.get("service", "unknown-service")
    return {
        "service": service,
        "window_minutes": params.get("window_minutes", 30),
        "total_lines_scanned": 48230,
        "matches": [
            f"2026-03-28 14:22:03 ERROR [{service}] ConnectionPoolExhausted: "
            f"max_pool_size=5 active=5 waiting=47",
            f"2026-03-28 14:22:07 ERROR [{service}] Timeout acquiring connection after 5000ms",
            f"2026-03-28 14:22:11 ERROR [{service}] ConnectionPoolExhausted: "
            f"checkout request failed — no available connections",
            f"2026-03-28 14:22:15 WARN  [{service}] Retry 1/3 for checkout transaction",
            f"2026-03-28 14:22:19 ERROR [{service}] All retries exhausted, returning 500",
        ],
        "error_count": 1847,
        "first_seen": "2026-03-28 14:22:03",
    }


async def _get_recent_deployments(params: dict) -> dict:
    service = params.get("service", "unknown-service")
    now = datetime.utcnow()
    return {
        "service": service,
        "deployments": [
            {
                "version": "v2.3.1",
                "deployed_at": (now - timedelta(minutes=75)).isoformat(),
                "deployed_by": "ci-bot",
                "commit": "a1b2c3d",
                "changes": ["Updated async checkout handler", "Reduced DB connection pool_size to 5"],
            },
            {
                "version": "v2.3.0",
                "deployed_at": (now - timedelta(hours=26)).isoformat(),
                "deployed_by": "ci-bot",
                "commit": "f4e5d6c",
                "changes": ["Performance improvements", "Dependency updates"],
            },
        ][:params.get("limit", 5)],
    }


async def _get_service_metrics(params: dict) -> dict:
    service = params.get("service", "unknown-service")
    metric = params.get("metric", "error_rate")
    values = {
        "error_rate":  {"current": 34.2, "baseline": 0.1, "unit": "%"},
        "latency_p95": {"current": 4820, "baseline": 180, "unit": "ms"},
        "cpu":         {"current": 72,   "baseline": 35,  "unit": "%"},
        "memory":      {"current": 68,   "baseline": 60,  "unit": "%"},
    }
    return {"service": service, "metric": metric, **values.get(metric, {})}


async def _get_config_diff(params: dict) -> dict:
    service = params.get("service", "unknown-service")
    return {
        "service": service,
        "changes_found": True,
        "diff": (
            f"--- {service}/config.yaml (v2.3.0)\n"
            f"+++ {service}/config.yaml (v2.3.1)\n"
            f" datasource:\n"
            f"-  pool.max: 20\n"
            f"+  pool.max: 5\n"
            f"-  pool.idle: 10\n"
            f"+  pool.idle: 2\n"
        ),
        "changed_at": (datetime.utcnow() - timedelta(minutes=75)).isoformat(),
        "changed_by": "ci-bot",
    }


async def _run_sandbox_command(params: dict) -> dict:
    action_type = params.get("action_type", "unknown")
    sandbox_results = {
        "config_rollback": {
            "status": "pass",
            "before": {"pool.max": 5, "pool.idle": 2},
            "after": {"pool.max": 20, "pool.idle": 10},
            "diff": "- pool.max: 5\n+ pool.max: 20\n- pool.idle: 2\n+ pool.idle: 10",
            "health_check": "pass",
            "error_rate_after": 0.0,
            "duration_seconds": 12,
        },
        "pod_restart": {
            "status": "pass",
            "pods_restarted": 3,
            "health_check": "pass",
            "duration_seconds": 28,
        },
        "pool_resize": {
            "status": "pass",
            "before": {"pool.max": 5},
            "after": {"pool.max": 20},
            "diff": "- pool.max: 5\n+ pool.max: 20",
            "health_check": "pass",
            "duration_seconds": 8,
        },
    }
    result = sandbox_results.get(action_type, {"status": "pass", "health_check": "pass"})
    return {"action_type": action_type, **result}


async def _get_hex_stage_context(params: dict) -> dict:
    return {
        "stage": params.get("stage", 1),
        "service": params.get("service"),
        "causal_sig": params.get("causal_sig"),
        "note": "Use MemoryLoader directly — this tool is for agent use only",
    }
