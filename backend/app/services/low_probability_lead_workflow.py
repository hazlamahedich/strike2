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
import json
import aiohttp

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
from app.agents.communication_assistant import CommunicationAssistantAgent
from app.agents.task_orchestrator import TaskOrchestratorAgent
from app.services.litellm_service import LiteLLMService
from app.core.config import settings

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
        self.communication_assistant = CommunicationAssistantAgent()
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
                # Generate personalized content using LLM
                content = await self.generate_personalized_content(
                    lead_id=lead_id, 
                    template_type=step["template"],
                    cycle=cycle
                )
                
                # Schedule email
                email_data = {
                    "subject": content["subject"],
                    "body": content["content"],
                    "scheduled_at": scheduled_date,
                    "campaign_id": campaign_id,
                    "metadata": {
                        "workflow": "low_probability",
                        "nurturing_cycle": cycle,
                        "step": step["template"],
                        "ai_generated": True
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

    async def generate_personalized_content(self, lead_id: int, template_type: str, cycle: int) -> Dict[str, str]:
        """
        Generate highly personalized content for a lead using the centralized LLM service
        
        Args:
            lead_id: Lead ID to generate content for
            template_type: Type of template (educational, social_proof, etc.)
            cycle: Current nurturing cycle (0-based)
            
        Returns:
            Dict with subject and content fields
        """
        try:
            # Get lead details for personalization
            lead = await lead_service.get_lead(lead_id)
            
            # Get lead's interaction history
            interactions = await lead_service.get_lead_interactions(lead_id, limit=10)
            
            # Get lead's company details if available
            company_info = {}
            if lead.company:
                company_info = await lead_service.get_company_details(lead.company)
            
            # Get lead's industry information if available
            industry_info = company_info.get("industry", "")
            
            # Basic context about the lead for personalization
            lead_context = {
                "name": lead.name,
                "company": lead.company,
                "position": lead.custom_fields.get("position", ""),
                "industry": industry_info,
                "lead_score": lead.lead_score,
                "days_in_pipeline": (datetime.now() - lead.created_at).days,
                "last_interaction": interactions[0] if interactions else None,
                "interests": lead.custom_fields.get("interests", []),
                "pain_points": lead.custom_fields.get("pain_points", []),
                "nurturing_cycle": cycle + 1,
                "total_cycles": MAX_NURTURING_CYCLES
            }
            
            # Determine prompt based on template type
            template_description = EMAIL_TEMPLATES.get(template_type, "")
            
            # Build the prompt for the LLM
            prompt = f"""
            You are an expert sales and marketing assistant. Create highly personalized email content for a lead in our low conversion nurturing pipeline.
            
            LEAD INFORMATION:
            - Name: {lead.name}
            - Company: {lead.company or 'Unknown'}
            - Position: {lead_context['position'] or 'Unknown'}
            - Industry: {industry_info or 'Unknown'}
            - Current lead score: {lead.lead_score}/100
            - Days in pipeline: {lead_context['days_in_pipeline']}
            - Nurturing cycle: {cycle + 1} of {MAX_NURTURING_CYCLES}
            
            EMAIL TYPE: {template_type.capitalize()} - {template_description}
            
            GUIDELINES:
            - Be genuinely helpful and provide value
            - Don't be pushy or overly sales-focused
            - Personalize based on company, industry, and any known pain points
            - Keep tone conversational yet professional
            - Include a subtle call to action that encourages engagement
            - Craft a compelling subject line
            - Keep it concise (150-250 words)
            
            RESPONSE FORMAT:
            Return a JSON object with "subject" and "content" fields representing the email subject line and body.
            """
            
            # Use centralized LLM service
            llm_response = await LiteLLMService.get_json_completion(
                prompt=prompt,
                system_prompt="You are an expert marketing content creator for nurturing low-probability leads.",
                temperature=0.7,
                request_type="email_generation",
                metadata={
                    "lead_id": lead_id,
                    "template": template_type,
                    "cycle": cycle
                }
            )
            
            # Extract subject and content
            subject = llm_response.get("subject", f"Information that might help you - {lead.company}")
            content = llm_response.get("content", "")
            
            # Log successful content generation
            logger.info(f"Generated personalized {template_type} content for lead {lead_id}")
            
            return {
                "subject": subject,
                "content": content
            }
            
        except Exception as e:
            logger.error(f"Error generating personalized content for lead {lead_id}: {str(e)}")
            
            # Fallback to basic template content
            subject = f"Information that might help you - {lead.company if hasattr(lead, 'company') else ''}"
            content = f"Hello {lead.name if hasattr(lead, 'name') else ''},\n\nWe thought you might find this information helpful...\n\nBest regards,\nThe Team"
            
            return {
                "subject": subject,
                "content": content
            }

    async def analyze_workflow_performance(self, campaign_id: int, days: int = 30) -> Dict[str, Any]:
        """
        Analyze the performance of the low probability workflow and generate insights
        using the LLM to identify patterns and opportunities for improvement.
        
        Args:
            campaign_id: Campaign ID to analyze
            days: Number of days of data to analyze
            
        Returns:
            Dict with analysis results and recommendations
        """
        try:
            # Get campaign data
            campaign = await campaign_service.get_campaign(campaign_id)
            
            # Query for workflow statistics over the time period
            cutoff_date = datetime.now() - timedelta(days=days)
            
            query = """
            SELECT 
                cl.status, 
                COUNT(cl.lead_id) as count,
                AVG(l.lead_score) as avg_score
            FROM campaign_leads cl
            JOIN leads l ON cl.lead_id = l.id
            WHERE cl.campaign_id = :campaign_id
            AND cl.updated_at >= :cutoff_date
            GROUP BY cl.status
            """
            
            status_results = await fetch_all(query, {
                "campaign_id": campaign_id,
                "cutoff_date": cutoff_date
            })
            
            # Get email engagement metrics
            email_query = """
            SELECT 
                COUNT(*) as total_sent,
                SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) as total_opened,
                SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) as total_clicked,
                SUM(CASE WHEN replied_at IS NOT NULL THEN 1 ELSE 0 END) as total_replied
            FROM emails
            WHERE campaign_id = :campaign_id
            AND sent_at >= :cutoff_date
            """
            
            email_results = await fetch_one(email_query, {
                "campaign_id": campaign_id,
                "cutoff_date": cutoff_date
            })
            
            # Get leads that upgraded from low probability to higher probability
            upgraded_query = """
            SELECT 
                COUNT(*) as count,
                AVG(EXTRACT(EPOCH FROM (cl.updated_at - cl.created_at))/86400) as avg_days_to_upgrade
            FROM campaign_leads cl
            JOIN leads l ON cl.lead_id = l.id
            WHERE cl.campaign_id = :campaign_id
            AND cl.status = 'qualified'
            AND cl.metadata->>'workflow_stage' = 'graduated'
            AND cl.updated_at >= :cutoff_date
            """
            
            upgraded_results = await fetch_one(upgraded_query, {
                "campaign_id": campaign_id,
                "cutoff_date": cutoff_date
            })
            
            # Prepare data for LLM analysis
            workflow_data = {
                "campaign_name": campaign.name,
                "time_period_days": days,
                "status_breakdown": status_results,
                "email_metrics": email_results or {},
                "upgraded_leads": upgraded_results or {},
                "current_workflow_stages": list(EMAIL_TEMPLATES.keys()),
                "avg_nurturing_cycles": 0,  # Will calculate if data available
                "most_effective_templates": []  # Will populate if data available
            }
            
            # Get average nurturing cycles
            cycles_query = """
            SELECT AVG((cl.metadata->>'nurturing_cycle')::int) as avg_cycles
            FROM campaign_leads cl
            WHERE cl.campaign_id = :campaign_id
            AND cl.updated_at >= :cutoff_date
            AND cl.metadata->>'nurturing_cycle' IS NOT NULL
            """
            
            cycles_result = await fetch_one(cycles_query, {
                "campaign_id": campaign_id,
                "cutoff_date": cutoff_date
            })
            
            if cycles_result and cycles_result.get("avg_cycles") is not None:
                workflow_data["avg_nurturing_cycles"] = cycles_result["avg_cycles"]
            
            # Get most effective templates
            templates_query = """
            SELECT 
                e.metadata->>'step' as template,
                COUNT(*) as sent,
                SUM(CASE WHEN e.opened_at IS NOT NULL THEN 1 ELSE 0 END) as opened,
                SUM(CASE WHEN e.clicked_at IS NOT NULL THEN 1 ELSE 0 END) as clicked
            FROM emails e
            WHERE e.campaign_id = :campaign_id
            AND e.sent_at >= :cutoff_date
            AND e.metadata->>'workflow' = 'low_probability'
            AND e.metadata->>'step' IS NOT NULL
            GROUP BY e.metadata->>'step'
            ORDER BY (SUM(CASE WHEN e.clicked_at IS NOT NULL THEN 1 ELSE 0 END)::float / COUNT(*)) DESC
            """
            
            templates_results = await fetch_all(templates_query, {
                "campaign_id": campaign_id,
                "cutoff_date": cutoff_date
            })
            
            workflow_data["most_effective_templates"] = templates_results
            
            # Calculate conversion rates
            if email_results:
                email_metrics = email_results
                total_sent = email_metrics.get("total_sent", 0)
                if total_sent > 0:
                    workflow_data["email_metrics"]["open_rate"] = email_metrics.get("total_opened", 0) / total_sent
                    workflow_data["email_metrics"]["click_rate"] = email_metrics.get("total_clicked", 0) / total_sent
                    workflow_data["email_metrics"]["reply_rate"] = email_metrics.get("total_replied", 0) / total_sent
            
            # Format data for LLM prompt
            formatted_data = json.dumps(workflow_data, default=str, indent=2)
            
            # Build prompt for LLM analysis
            prompt = f"""
            As an expert marketing analyst, analyze the low probability lead nurturing workflow data and provide insights and recommendations.
            
            WORKFLOW DATA:
            {formatted_data}
            
            Please analyze the data above and provide:
            1. Key performance metrics and trends
            2. Insights about what's working and what's not
            3. Specific opportunities for improvement in the low probability nurturing workflow
            4. Recommendations for adjusting content, timing, or targeting to increase conversion rates
            5. Any patterns in the leads that successfully convert vs those that don't
            
            RESPONSE FORMAT:
            Return a JSON object with the following structure:
            {{
                "summary": "Overall performance summary in 1-2 sentences",
                "key_metrics": [list of 3-5 key metrics with context],
                "successful_patterns": [list of patterns observed in converted leads],
                "recommendations": [list of 4-6 specific recommendations to improve conversion],
                "content_suggestions": [list of content ideas for each stage of the nurturing process],
                "experimental_ideas": [2-3 innovative approaches to test]
            }}
            """
            
            # Use centralized LLM service for analysis
            llm_response = await LiteLLMService.get_json_completion(
                prompt=prompt,
                system_prompt="You are an expert marketing analyst specializing in lead nurturing optimization.",
                temperature=0.2,
                request_type="workflow_analysis",
                metadata={
                    "campaign_id": campaign_id,
                    "analysis_type": "low_probability_workflow"
                }
            )
            
            # Enhance the response with actionable next steps
            next_steps = [
                "Review the recommendations and prioritize implementation based on effort vs. impact",
                "A/B test new content variations based on the content suggestions",
                "Adjust email timing and sequencing based on engagement patterns",
                "Refine lead segmentation to better target content to specific lead groups",
                "Schedule a follow-up analysis in 30 days to measure improvements"
            ]
            
            result = {
                **llm_response,
                "analysis_date": datetime.now().isoformat(),
                "campaign_id": campaign_id,
                "data_period_days": days,
                "next_steps": next_steps
            }
            
            # Store the analysis results for reference
            await insert_row(
                "workflow_analyses",
                {
                    "campaign_id": campaign_id,
                    "analysis_type": "low_probability",
                    "results": result,
                    "created_at": datetime.now()
                }
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing workflow performance: {str(e)}")
            return {
                "error": str(e),
                "summary": "Unable to complete workflow analysis due to an error."
            }

# Singleton instance
low_probability_workflow = LowProbabilityWorkflow() 