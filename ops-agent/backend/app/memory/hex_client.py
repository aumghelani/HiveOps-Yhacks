"""Hex API client — runs structured queries or falls back to mock data."""
import httpx
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("hex_client")


class HexClient:
    """Query Hex API for memory bank matches, with mock fallback."""

    def __init__(self) -> None:
        self.api_token = settings.hex_api_token
        self.project_id = settings.hex_project_id
        self.base_url = settings.hex_base_url.rstrip("/")

    @property
    def is_configured(self) -> bool:
        return bool(self.api_token and self.project_id)

    async def run_query(self, query_params: dict) -> list[dict]:
        """Run a Hex project with input params, return results."""
        if not self.is_configured:
            logger.info("hex not configured, using mock data")
            return self._get_mock_incidents(query_params)

        try:
            headers = {
                "Authorization": f"Bearer {self.api_token}",
                "Content-Type": "application/json",
            }
            # Trigger Hex project run
            async with httpx.AsyncClient(timeout=30.0) as client:
                run_resp = await client.post(
                    f"{self.base_url}/project/{self.project_id}/run",
                    json={"inputParams": query_params},
                    headers=headers,
                )
                run_resp.raise_for_status()
                run_data = run_resp.json()
                run_id = run_data.get("runId")

                # Poll for completion
                status_url = f"{self.base_url}/project/{self.project_id}/run/{run_id}"
                for _ in range(20):
                    import asyncio
                    await asyncio.sleep(1)
                    status_resp = await client.get(status_url, headers=headers)
                    status_data = status_resp.json()
                    if status_data.get("status") in ("COMPLETED", "ERRORED"):
                        break

                if status_data.get("status") != "COMPLETED":
                    logger.warning("hex run did not complete, falling back to mock")
                    return self._get_mock_incidents(query_params)

                # Get results
                results_resp = await client.get(
                    f"{status_url}/results",
                    headers=headers,
                )
                results_data = results_resp.json()
                return results_data.get("results", [])

        except Exception as e:
            logger.warning(f"hex query failed: {e}, falling back to mock")
            return self._get_mock_incidents(query_params)

    def _get_mock_incidents(self, query_params: dict | None = None) -> list[dict]:
        """Return mock incidents for dev/demo when Hex is unavailable."""
        service = (query_params or {}).get("service", "payment-service")
        causal_sig = (query_params or {}).get("causal_sig", "db_pool_exhausted")

        return [
            {
                "original_id": "INC-2847",
                "service": service,
                "category": "api_error.5xx",
                "causal_sig": causal_sig,
                "severity": "P1",
                "outcome": "pool_resize",
                "resolved_in_min": 22,
                "confidence_score": 0.94,
                "playbook_summary": "Increased DB pool from 5→20, rolling restart",
                "match_score": 95,
            },
            {
                "original_id": "INC-2201",
                "service": service,
                "category": "api_error.5xx",
                "causal_sig": causal_sig,
                "severity": "P2",
                "outcome": "config_rollback",
                "resolved_in_min": 15,
                "confidence_score": 0.91,
                "playbook_summary": "Rolled back config change that reduced pool size",
                "match_score": 70,
            },
            {
                "original_id": "INC-1803",
                "service": "order-service",
                "category": "api_error.5xx",
                "causal_sig": "db_pool_exhausted",
                "severity": "P1",
                "outcome": "pool_resize",
                "resolved_in_min": 18,
                "confidence_score": 0.89,
                "playbook_summary": "Same root cause on order-service, identical fix",
                "match_score": 55,
            },
            {
                "original_id": "INC-1502",
                "service": service,
                "category": "latency_spike",
                "causal_sig": "downstream_timeout",
                "severity": "P2",
                "outcome": "manual_investigation",
                "resolved_in_min": 45,
                "confidence_score": 0.72,
                "playbook_summary": "Downstream dependency caused cascading timeouts",
                "match_score": 35,
            },
        ]
