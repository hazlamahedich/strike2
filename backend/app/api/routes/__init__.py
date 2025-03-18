from fastapi import APIRouter

from app.api import api_router
from app.api.routes import users, leads, campaigns, interactions, auth, ai, agents
from app.api.routes.agents import router as agents_router
from app.api.routes.leads import router as leads_router
from app.api.routes.rbac import router as rbac_router

# Include the agents router
api_router.include_router(agents_router, prefix="/agents", tags=["agents"])
api_router.include_router(leads_router, prefix="/leads", tags=["leads"])
api_router.include_router(rbac_router, prefix="/rbac", tags=["rbac"]) 