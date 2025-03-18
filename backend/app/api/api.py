from fastapi import APIRouter

from app.api.endpoints import users, auth, leads, tasks, campaigns, ai, communications, analytics, chatbot, llm

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(leads.router, prefix="/leads", tags=["leads"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(llm.router, prefix="/llm", tags=["llm"])
api_router.include_router(communications.router, prefix="/communications", tags=["communications"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["chatbot"]) 