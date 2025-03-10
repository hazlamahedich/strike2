# Router package initialization
from .auth import router as auth_router
from .leads import router as leads_router
from .campaigns import router as campaigns_router
from .tasks import router as tasks_router
from .communications import router as communications_router
from .meetings import router as meetings_router
from .analytics import router as analytics_router
from .notifications import router as notifications_router
from .agents import router as agents_router
from .low_probability_workflow import router as low_probability_workflow_router
from .chatbot import router as chatbot_router
from .company_analysis import router as company_analysis_router

__all__ = [
    "auth",
    "leads",
    "tasks",
    "communications",
    "meetings",
    "analytics",
    "campaigns",
    "notifications",
    "agents",
    "chatbot",
    "company_analysis",
] 