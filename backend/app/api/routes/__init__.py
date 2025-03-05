from fastapi import APIRouter

from app.api import api_router
from app.api.routes import users, leads, campaigns, interactions, auth, ai, agents

# Include the agents router
api_router.include_router(
    agents.router,
    prefix="/agents",
    tags=["agents"],
) 