"""
Low Probability Lead Workflow Service

This service implements an automated workflow for low probability leads, including:
1. Identification of low probability leads based on lead scoring
2. Automated nurturing sequences with personalized content
3. Periodic re-scoring and workflow transitions
4. Analytics and monitoring of conversion improvements
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import asyncio

from app.core.database import fetch_all, fetch_one, insert_row, update_row
from app.models.lead import Lead, LeadStatus, LeadUpdate
from app.models.campaign import Campaign, CampaignCreate, CampaignUpdate
from app.models.campaign_lead import CampaignLead, CampaignLeadCreate, LeadCampaignStatus
from app.models.ai import AdvancedLeadScoringResponse
from app.services import lead as lead_service
from app.services import campaign as campaign_service
from app.services import ai as ai_service
from app.services import communication as communication_service
from app.agents.lead_scoring_agent import LeadScoringAgent
from app.agents.communication_assistant import CommunicationAssistant
from app.agents.task_orchestrator import TaskOrchestratorAgent

# Configure logger
logger = logging.getLogger(__name__)

# Constants
LOW_PROBABILITY_THRESHOLD = 30.0  # Leads with score below this are considered low probability
MEDIUM_PROBABILITY_THRESHOLD = 60.0  # Leads with score above this are considered medium probability
HIGH_PROBABILITY_THRESHOLD = 80.0  # Leads with score above this are considered high probability
RESCORING_INTERVAL_DAYS = 14  # Re-score leads every 14 days
MAX_NURTURING_CYCLES = 3  # Maximum number of nurturing cycles before human review

# Communication templates for different stages
EMAIL_TEMPLATES = {
    "educational": "Providing valuable industry insights and educational content",
    "social_proof": "Sharing success stories and testimonials",
    "pain_point": "Addressing specific pain points with helpful resources",
    "re_engagement": "Checking in after a period of no engagement"
}

class LowProbabilityWorkflow:
    """
    Manages the workflow for low probability leads
    """
    
    def __init__(self):
        self.lead_scoring_agent = LeadScoringAgent()
        self.communication_assistant = CommunicationAssistant()
        self.task_orchestrator = TaskOrchestratorAgent()
    
    async def setup_campaign(self, name: str = "Low Probability Lead Nurturing", 
                           description: str = "Automated nurturing campaign for low probability leads") -> int:
        """
        Set up or get the campaign for low probability leads
        
        Returns:
            int: Campaign ID
        """
        # Check if campaign already exists
        query = """
        SELECT id FROM campaigns WHERE name = :name AND status = 'active'
        """
        existing_campaign = await fetch_one(query, {"name": name})
        
        if existing_campaign:
            return existing_campaign["id"]
        
        # Create new campaign
        campaign_data = CampaignCreate(
            name=name,
            description=description,
            status="active",
            type="nurturing",
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=365),  # 1 year duration
            metadata={
                "workflow_type": "low_probability",
                "created_by": "system",
                "max_nurturing_cycles": MAX_NURTURING_CYCLES,
                "rescoring_interval_days": RESCORING_INTERVAL_DAYS
            }
        )
        
        campaign = await campaign_service.create_campaign(campaign_data)
        logger.info(f"Created low probability lead campaign with ID: {campaign.id}")
        
        return campaign.id
    
    async def identify_low_probability_leads(self, min_days_since_last_contact: int = 7, 
                                           exclude_campaign_ids: Optional[List[int]] = None) -> List[int]:
        """
        Identify low probability leads that should be added to the workflow
        
        Args:
            min_days_since_last_contact: Minimum days since last contact to consider
            exclude_campaign_ids: Campaign IDs to exclude from consideration
            
        Returns:
            List[int]: List of lead IDs
        """
        # Build query to find low probability leads
        query = """
        SELECT l.id 
        FROM leads l
        LEFT JOIN (
            SELECT lead_id, MAX(occurred_at) as last_contact
            FROM (
                SELECT lead_id, sent_at as occurred_at FROM emails
                UNION ALL
                SELECT lead_id, occurred_at FROM calls
                UNION ALL
                SELECT lead_id, sent_at as occurred_at FROM sms
                UNION ALL
                SELECT lead_id, scheduled_at as occurred_at FROM meetings
            ) all_contacts
            GROUP BY lead_id
        ) contacts ON l.id = contacts.lead_id
        WHERE l.lead_score <= :score_threshold
        AND l.status NOT IN ('won', 'lost')
        AND (
            contacts.last_contact IS NULL 
            OR contacts.last_contact <= :cutoff_date
        )
        """
        
        params = {
            "score_threshold": LOW_PROBABILITY_THRESHOLD,
            "cutoff_date": datetime.now() - timedelta(days=min_days_since_last_contact)
        }
        
        # Execute query
        results = await fetch_all(query, params)
        lead_ids = [row["id"] for row in results]
        
        # If we need to exclude leads in certain campaigns
        if exclude_campaign_ids and lead_ids:
            exclude_query = """
            SELECT DISTINCT lead_id
            FROM campaign_leads
            WHERE campaign_id IN :campaign_ids AND lead_id IN :lead_ids
            """
            exclude_params = {
                "campaign_ids": tuple(exclude_campaign_ids),
                "lead_ids": tuple(lead_ids)
            }
            exclude_results = await fetch_all(exclude_query, exclude_params)
            exclude_lead_ids = [row["lead_id"] for row in exclude_results]
            
            # Filter out excluded leads
            lead_ids = [lead_id for lead_id in lead_ids if lead_id not in exclude_lead_ids]
        
        logger.info(f"Identified {len(lead_ids)} low probability leads for nurturing")
        return lead_ids
    
    async def add_leads_to_workflow(self, lead_ids: List[int], campaign_id: int) -> List[int]:
        """
        Add leads to the low probability workflow campaign
        
        Args:
            lead_ids: List of lead IDs to add
            campaign_id: Campaign ID to add leads to
            
        Returns:
            List[int]: List of successfully added lead IDs
        """
        added_lead_ids = []
        
        for lead_id in lead_ids:
            try:
                # Add lead to campaign
                campaign_lead_data = CampaignLeadCreate(
                    campaign_id=campaign_id,
                    status=LeadCampaignStatus.ADDED,
                    notes="Automatically added to low probability nurturing workflow",
                    metadata={
                        "nurturing_cycle": 0,
                        "last_scored_at": datetime.now().isoformat(),
                        "next_scoring_date": (datetime.now() + timedelta(days=RESCORING_INTERVAL_DAYS)).isoformat(),
                        "workflow_stage": "initial"
                    }
                )
                
                await lead_service.add_lead_to_campaign(lead_id, campaign_lead_data)
                added_lead_ids.append(lead_id)
                
                # Schedule initial nurturing sequence
                await self.schedule_nurturing_sequence(lead_id, campaign_id, 0)
                
            except Exception as e:
                logger.error(f"Error adding lead {lead_id} to workflow: {str(e)}")
        
        logger.info(f"Added {len(added_lead_ids)} leads to low probability workflow")
        return added_lead_ids
    
    async def schedule_nurturing_sequence(self, lead_id: int, campaign_id: int, cycle: int) -> None:
        """
        Schedule a nurturing sequence for a lead
        
        Args:
            lead_id: Lead ID
            campaign_id: Campaign ID
            cycle: Current nurturing cycle (0-based)
        """
        if cycle >= MAX_NURTURING_CYCLES:
            logger.info(f"Lead {lead_id} has reached maximum nurturing cycles, flagging for human review")
            
            # Update campaign lead status
            await lead_service.update_lead_campaign_status(
                lead_id=lead_id,
                campaign_id=campaign_id,
                status=LeadCampaignStatus.QUALIFIED,
                notes="Completed maximum nurturing cycles, needs human review",
                metadata={
                    "nurturing_cycle": cycle,
                    "workflow_stage": "human_review",
                    "completed_at": datetime.now().isoformat()
                }
            )
            
            # Create task for human review
            task_data = {
                "title": f"Review lead after {MAX_NURTURING_CYCLES} nurturing cycles",
                "description": f"This lead has completed {MAX_NURTURING_CYCLES} nurturing cycles in the low probability workflow. Please review and determine next steps.",
                "due_date": datetime.now() + timedelta(days=2),
                "priority": "medium",
                "status": "pending"
            }
            
            await lead_service.add_lead_task(lead_id, task_data)
            return
        
        # Get lead details for personalization
        lead = await lead_service.get_lead(lead_id)
        
        # Define sequence based on cycle
        sequence = []
        
        if cycle == 0:
            # Initial cycle - educational content
            sequence = [
                {"type": "email", "template": "educational", "delay_days": 0},
                {"type": "email", "template": "social_proof", "delay_days": 4},
                {"type": "task", "action": "review_engagement", "delay_days": 7}
            ]
        elif cycle == 1:
            # Second cycle - pain point focus
            sequence = [
                {"type": "email", "template": "pain_point", "delay_days": 0},
                {"type": "email", "template": "educational", "delay_days": 5},
                {"type": "task", "action": "review_engagement", "delay_days": 10}
            ]
        else:
            # Final cycle - re-engagement attempt
            sequence = [
                {"type": "email", "template": "re_engagement", "delay_days": 0},
                {"type": "email", "template": "pain_point", "delay_days": 6},
                {"type": "task", "action": "final_review", "delay_days": 12}
            ]
        
        # Schedule each step in the sequence
        for step in sequence:
            scheduled_date = datetime.now() + timedelta(days=step["delay_days"])
            
            if step["type"] == "email":
                # Generate personalized content
                content_request = {
                    "content_type": "email",
                    "lead_id": lead_id,
                    "purpose": step["template"],
                    "tone": "helpful",
                    "key_points": [
                        f"Nurturing cycle {cycle+1} of {MAX_NURTURING_CYCLES}",
                        "Provide value without being pushy",
                        "Encourage engagement with a simple call to action"
                    ]
                }
                
                content = await self.communication_assistant.generate_content(content_request)
                
                # Schedule email
                email_data = {
                    "subject": content.get("subject", f"Information that might help you - {lead.company}"),
                    "body": content.get("content", ""),
                    "scheduled_at": scheduled_date,
                    "campaign_id": campaign_id,
                    "metadata": {
                        "workflow": "low_probability",
                        "nurturing_cycle": cycle,
                        "step": step["template"]
                    }
                }
                
                await communication_service.schedule_email(lead_id, email_data)
                
            elif step["type"] == "task":
                # Create task for review
                task_data = {
                    "title": f"Review engagement for low probability lead",
                    "description": f"Review engagement metrics for lead in nurturing cycle {cycle+1}. Determine if manual outreach is needed.",
                    "due_date": scheduled_date,
                    "priority": "medium",
                    "status": "pending"
                }
                
                await lead_service.add_lead_task(lead_id, task_data)
        
        # Update campaign lead metadata
        await lead_service.update_lead_campaign_status(
            lead_id=lead_id,
            campaign_id=campaign_id,
            status=LeadCampaignStatus.CONTACTED,
            notes=f"Started nurturing cycle {cycle+1}",
            metadata={
                "nurturing_cycle": cycle,
                "workflow_stage": "nurturing",
                "sequence_started_at": datetime.now().isoformat(),
                "next_scoring_date": (datetime.now() + timedelta(days=RESCORING_INTERVAL_DAYS)).isoformat()
            }
        )
    
    async def rescore_leads(self, campaign_id: int) -> Dict[str, List[int]]:
        """
        Re-score leads in the workflow and transition them if needed
        
        Args:
            campaign_id: Campaign ID
            
        Returns:
            Dict with lists of lead IDs that were upgraded, remained, or completed
        """
        # Find leads due for rescoring
        query = """
        SELECT cl.lead_id, cl.metadata
        FROM campaign_leads cl
        WHERE cl.campaign_id = :campaign_id
        AND cl.status IN ('added', 'contacted', 'responded')
        """
        
        results = await fetch_all(query, {"campaign_id": campaign_id})
        
        leads_to_rescore = []
        for row in results:
            metadata = row.get("metadata", {})
            next_scoring_date_str = metadata.get("next_scoring_date")
            
            if next_scoring_date_str:
                next_scoring_date = datetime.fromisoformat(next_scoring_date_str)
                if datetime.now() >= next_scoring_date:
                    leads_to_rescore.append(row["lead_id"])
        
        # Track results
        result = {
            "upgraded": [],
            "remained": [],
            "completed": []
        }
        
        # Re-score each lead
        for lead_id in leads_to_rescore:
            try:
                # Get current campaign lead data
                campaign_lead = await lead_service.get_lead_campaign(lead_id, campaign_id)
                metadata = campaign_lead.get("metadata", {})
                current_cycle = metadata.get("nurturing_cycle", 0)
                
                # Score the lead
                score_response = await self.lead_scoring_agent.score_lead(
                    lead_id=lead_id,
                    timeframe_days=RESCORING_INTERVAL_DAYS
                )
                
                # Update lead score in database
                await lead_service.update_lead(
                    lead_id=lead_id,
                    lead_update=LeadUpdate(lead_score=score_response.get("lead_score", 0))
                )
                
                # Determine next steps based on new score
                new_score = score_response.get("lead_score", 0)
                
                if new_score > MEDIUM_PROBABILITY_THRESHOLD:
                    # Lead has improved to medium/high probability - transition out of this workflow
                    await lead_service.update_lead_campaign_status(
                        lead_id=lead_id,
                        campaign_id=campaign_id,
                        status=LeadCampaignStatus.QUALIFIED,
                        notes=f"Lead score improved to {new_score}, transitioning to standard workflow",
                        metadata={
                            "nurturing_cycle": current_cycle,
                            "workflow_stage": "graduated",
                            "final_score": new_score,
                            "completed_at": datetime.now().isoformat()
                        }
                    )
                    
                    # Create task for follow-up
                    task_data = {
                        "title": "Follow up with improved lead",
                        "description": f"This lead's score has improved to {new_score} after nurturing. Consider direct outreach.",
                        "due_date": datetime.now() + timedelta(days=1),
                        "priority": "high",
                        "status": "pending"
                    }
                    
                    await lead_service.add_lead_task(lead_id, task_data)
                    result["upgraded"].append(lead_id)
                    
                else:
                    # Lead remains low probability
                    # Update next scoring date
                    await lead_service.update_lead_campaign_status(
                        lead_id=lead_id,
                        campaign_id=campaign_id,
                        status=campaign_lead.get("status", LeadCampaignStatus.CONTACTED),
                        metadata={
                            **metadata,
                            "last_scored_at": datetime.now().isoformat(),
                            "next_scoring_date": (datetime.now() + timedelta(days=RESCORING_INTERVAL_DAYS)).isoformat(),
                            "previous_score": metadata.get("current_score"),
                            "current_score": new_score
                        }
                    )
                    
                    # Check if we should start a new nurturing cycle
                    if current_cycle < MAX_NURTURING_CYCLES - 1:
                        await self.schedule_nurturing_sequence(lead_id, campaign_id, current_cycle + 1)
                        result["remained"].append(lead_id)
                    else:
                        # Lead has completed all cycles but score hasn't improved
                        await lead_service.update_lead_campaign_status(
                            lead_id=lead_id,
                            campaign_id=campaign_id,
                            status=LeadCampaignStatus.REJECTED,
                            notes=f"Completed all nurturing cycles with final score of {new_score}",
                            metadata={
                                **metadata,
                                "workflow_stage": "lost",
                                "final_score": new_score,
                                "completed_at": datetime.now().isoformat()
                            }
                        )
                        
                        # ADDITION: Also update the lead status to LOST in the main leads table
                        await lead_service.update_lead(
                            lead_id=lead_id,
                            lead_update=LeadUpdate(
                                status=LeadStatus.LOST,
                                custom_fields={
                                    "lost_reason": "No engagement after nurturing attempts",
                                    "nurturing_cycles_completed": MAX_NURTURING_CYCLES,
                                    "final_lead_score": new_score
                                }
                            )
                        )
                        
                        result["completed"].append(lead_id)
                
            except Exception as e:
                logger.error(f"Error rescoring lead {lead_id}: {str(e)}")
        
        logger.info(f"Rescored {len(leads_to_rescore)} leads: {len(result['upgraded'])} upgraded, "
                   f"{len(result['remained'])} remained, {len(result['completed'])} completed")
        
        return result
    
    async def run_workflow(self) -> Dict[str, Any]:
        """
        Run the complete workflow process:
        1. Set up campaign if needed
        2. Identify new low probability leads
        3. Add leads to workflow
        4. Re-score existing leads
        
        Returns:
            Dict with workflow statistics
        """
        # Set up campaign
        campaign_id = await self.setup_campaign()
        
        # Identify new low probability leads
        new_leads = await self.identify_low_probability_leads(
            min_days_since_last_contact=7,
            exclude_campaign_ids=[campaign_id]
        )
        
        # Add new leads to workflow
        added_leads = await self.add_leads_to_workflow(new_leads, campaign_id)
        
        # Re-score existing leads
        rescore_results = await self.rescore_leads(campaign_id)
        
        # Return statistics
        return {
            "campaign_id": campaign_id,
            "new_leads_identified": len(new_leads),
            "new_leads_added": len(added_leads),
            "leads_rescored": sum(len(v) for v in rescore_results.values()),
            "leads_upgraded": len(rescore_results["upgraded"]),
            "leads_remained": len(rescore_results["remained"]),
            "leads_completed": len(rescore_results["completed"]),
            "timestamp": datetime.now().isoformat()
        }

# Singleton instance
low_probability_workflow = LowProbabilityWorkflow() 