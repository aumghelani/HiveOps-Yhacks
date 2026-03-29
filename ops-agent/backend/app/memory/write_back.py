"""Write-back — persists resolved incidents to memory for future matching."""
from app.utils.logger import get_logger

logger = get_logger("write_back")


async def write_resolved_incident(
    incident_id: str,
    resolution_data: dict,
) -> None:
    """Write a resolved incident to the resolved_incidents table."""
    # In production this writes to Supabase resolved_incidents table
    # For MVP/demo, we log it — real write happens in Ch 4 routes
    logger.info(
        f"write_back incident={incident_id} "
        f"outcome={resolution_data.get('outcome')} "
        f"causal_sig={resolution_data.get('causal_sig')}"
    )
