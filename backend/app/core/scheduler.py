"""
Scheduler for automated tasks in the CRM system.

This module sets up scheduled tasks using APScheduler, including:
- Running the low probability lead workflow
- Sending scheduled emails
- Generating periodic reports
"""

import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.services.low_probability_lead_workflow import low_probability_workflow

# Configure logger
logger = logging.getLogger(__name__)

# Create scheduler
scheduler = AsyncIOScheduler()

async def run_low_probability_workflow():
    """
    Run the low probability lead workflow.
    This task:
    1. Identifies new low probability leads
    2. Adds them to the nurturing campaign
    3. Re-scores existing leads
    4. Transitions leads to appropriate next steps
    """
    try:
        logger.info("Running scheduled low probability lead workflow")
        result = await low_probability_workflow.run_workflow()
        logger.info(f"Workflow completed: {result}")
    except Exception as e:
        logger.error(f"Error running low probability workflow: {str(e)}")

def setup_scheduler():
    """
    Set up all scheduled tasks.
    """
    # Run low probability workflow daily at 1:00 AM
    scheduler.add_job(
        run_low_probability_workflow,
        CronTrigger(hour=1, minute=0),
        id="low_probability_workflow",
        replace_existing=True,
        misfire_grace_time=60 * 60,  # 1 hour grace time
    )
    
    # Add more scheduled tasks here as needed
    
    # Start the scheduler
    scheduler.start()
    logger.info("Scheduler started with the following jobs:")
    for job in scheduler.get_jobs():
        logger.info(f"- {job.id}: Next run at {job.next_run_time}")

def shutdown_scheduler():
    """
    Shut down the scheduler.
    """
    scheduler.shutdown()
    logger.info("Scheduler shut down") 