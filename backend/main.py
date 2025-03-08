from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Import our routers
from app.routers import auth, leads, tasks, communications, meetings, analytics, campaigns, notifications, agents, chatbot
from app.routers.low_probability_workflow import router as low_probability_workflow_router
from app.core.config import settings
from app.core.security import get_current_active_user
from app.core.scheduler import setup_scheduler, shutdown_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic: connect to database, initialize AI models, etc.
    print("Starting up CRM API...")
    
    # Set up the scheduler for automated tasks
    setup_scheduler()
    
    yield
    
    # Shutdown logic: close connections, etc.
    print("Shutting down CRM API...")
    
    # Shut down the scheduler
    shutdown_scheduler()

# Create the FastAPI app with lifespan
app = FastAPI(
    title="AI-Powered CRM API",
    description="Backend API for an AI-driven CRM system",
    version="0.1.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(
    leads.router, 
    prefix="/api/leads", 
    tags=["Leads"], 
    dependencies=[Depends(get_current_active_user)]
)
app.include_router(
    campaigns.router, 
    prefix="/api/campaigns", 
    tags=["Campaigns"], 
    dependencies=[Depends(get_current_active_user)]
)
app.include_router(
    tasks.router, 
    prefix="/api/tasks", 
    tags=["Tasks"], 
    dependencies=[Depends(get_current_active_user)]
)
app.include_router(
    communications.router, 
    prefix="/api/communications", 
    tags=["Communications"], 
    dependencies=[Depends(get_current_active_user)]
)
app.include_router(
    meetings.router, 
    prefix="/api/meetings", 
    tags=["Meetings"], 
    dependencies=[Depends(get_current_active_user)]
)
app.include_router(
    analytics.router, 
    prefix="/api/analytics", 
    tags=["Analytics"], 
    dependencies=[Depends(get_current_active_user)]
)
app.include_router(
    notifications.router, 
    prefix="/api/notifications", 
    tags=["Notifications"], 
    dependencies=[Depends(get_current_active_user)]
)
app.include_router(
    agents.router, 
    prefix="/api/agents", 
    tags=["AI Agents"], 
    dependencies=[Depends(get_current_active_user)]
)
app.include_router(
    low_probability_workflow_router, 
    prefix="/api/workflows/low-probability", 
    tags=["Low Probability Workflow"], 
    dependencies=[Depends(get_current_active_user)]
)
app.include_router(
    chatbot.router, 
    prefix="/api/chatbot", 
    tags=["Chatbot"]
)

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 