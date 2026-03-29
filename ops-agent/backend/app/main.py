import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import incidents, agents, approvals
from app.api.pipeline import incidents_store, sub_tickets_store
from app.utils.logger import get_logger

logger = get_logger("main")

app = FastAPI(title="HiveOps API", version="0.1.0")

# Allow Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(incidents.router, prefix="/api/incidents", tags=["incidents"])
app.include_router(agents.router,    prefix="/api/agents",    tags=["agents"])
app.include_router(approvals.router, prefix="/api/approvals", tags=["approvals"])


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.websocket("/ws/incidents/{incident_id}")
async def incident_ws(websocket: WebSocket, incident_id: str):
    """WebSocket for live incident status updates.
    Pushes incident + sub-tickets state every second while connected."""
    await websocket.accept()
    logger.info(f"ws connected: {incident_id}")
    try:
        while True:
            incident = incidents_store.get(incident_id)
            if not incident:
                await websocket.send_json({"error": "not_found"})
                break

            tickets = sorted(
                [t for t in sub_tickets_store.values() if t["incident_id"] == incident_id],
                key=lambda x: x.get("created_at", ""),
            )
            await websocket.send_json({
                "type": "incident_update",
                "incident": incident,
                "sub_tickets": tickets,
            })

            # Stop polling once resolved or rejected
            if incident.get("status") in ("resolved", "rejected"):
                await asyncio.sleep(0.5)
                await websocket.send_json({
                    "type": "incident_final",
                    "incident": incident,
                    "sub_tickets": tickets,
                })
                break

            await asyncio.sleep(1)
    except WebSocketDisconnect:
        logger.info(f"ws disconnected: {incident_id}")
