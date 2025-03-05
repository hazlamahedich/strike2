#!/usr/bin/env python3
"""
Database Seed Script for CRM Application

This script populates the database with initial data for testing.
It uses the Supabase client for database access.
"""

import logging
import os
import sys
import bcrypt
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# User roles
ROLE_ADMIN = "admin"
ROLE_MANAGER = "manager"
ROLE_SALES_REP = "sales_rep"

def get_supabase_client() -> Client:
    """Get a Supabase client"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        # Fall back to local settings
        supabase_url = os.getenv("SUPABASE_LOCAL_URL", "http://localhost:8080")
        supabase_key = os.getenv("SUPABASE_LOCAL_KEY", "postgres")
    
    logger.info(f"Connecting to Supabase at {supabase_url}")
    try:
        return create_client(supabase_url, supabase_key)
    except Exception as e:
        logger.error(f"Error creating Supabase client: {e}")
        raise e

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def seed_users(supabase: Client):
    """Seed the users table with initial admin and test users"""
    logger.info("Seeding users table...")
    
    # Create admin user
    admin_data = {
        "email": "admin@example.com",
        "hashed_password": get_password_hash("admin123"),
        "name": "Admin User",
        "role": ROLE_ADMIN,
        "is_active": True,
        "created_at": str(datetime.now()),
        "updated_at": str(datetime.now())
    }
    
    admin_response = supabase.table('users').insert(admin_data).execute()
    if len(admin_response.data) == 0:
        raise Exception("Failed to create admin user")
    
    admin_id = admin_response.data[0]['id']
    logger.info(f"Created admin user with ID: {admin_id}")
    
    # Create test users with different roles
    test_users = [
        {
            "email": "manager@example.com",
            "hashed_password": get_password_hash("password123"),
            "name": "Manager User",
            "role": ROLE_MANAGER,
            "is_active": True,
            "created_at": str(datetime.now()),
            "updated_at": str(datetime.now())
        },
        {
            "email": "marketer@example.com",
            "hashed_password": get_password_hash("password123"),
            "name": "Marketer User",
            "role": ROLE_MANAGER,
            "is_active": True,
            "created_at": str(datetime.now()),
            "updated_at": str(datetime.now())
        },
        {
            "email": "salesperson@example.com",
            "hashed_password": get_password_hash("password123"),
            "name": "Sales Person",
            "role": ROLE_SALES_REP,
            "is_active": True,
            "created_at": str(datetime.now()),
            "updated_at": str(datetime.now())
        }
    ]
    
    for user_data in test_users:
        response = supabase.table('users').insert(user_data).execute()
        if len(response.data) > 0:
            user_id = response.data[0]['id']
            logger.info(f"Created {user_data['role']} user with ID: {user_id}")
        else:
            logger.error(f"Failed to create user: {user_data['email']}")
    
    return admin_id

def seed_leads(supabase: Client, admin_id):
    """Seed the leads table with sample leads"""
    logger.info("Seeding leads table...")
    
    # Create test leads
    leads = [
        {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "phone": "+15551234567",
            "company": "Acme Inc",
            "job_title": "CTO",
            "status": "qualified",
            "source": "website",
            "notes": "Interested in enterprise plan",
            "owner_id": admin_id,
            "created_at": str(datetime.now()),
            "updated_at": str(datetime.now()),
            "last_contacted": str(datetime.now() - timedelta(days=2)),
            "lead_score": 85
        },
        {
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane.smith@example.com",
            "phone": "+15559876543",
            "company": "XYZ Corp",
            "job_title": "Marketing Director",
            "status": "new",
            "source": "referral",
            "notes": "Referred by existing customer",
            "owner_id": admin_id,
            "created_at": str(datetime.now()),
            "updated_at": str(datetime.now()),
            "lead_score": 65
        },
        {
            "first_name": "Bob",
            "last_name": "Johnson",
            "email": "bob.johnson@example.com",
            "phone": "+15555555555",
            "company": "Johnson & Co",
            "job_title": "CEO",
            "status": "contacted",
            "source": "linkedin",
            "notes": "Needs follow-up next week",
            "owner_id": admin_id,
            "created_at": str(datetime.now()),
            "updated_at": str(datetime.now()),
            "last_contacted": str(datetime.now() - timedelta(days=5)),
            "lead_score": 90
        }
    ]
    
    lead_ids = []
    for lead_data in leads:
        response = supabase.table('leads').insert(lead_data).execute()
        if len(response.data) > 0:
            lead_id = response.data[0]['id']
            lead_ids.append(lead_id)
            logger.info(f"Created lead for {lead_data['first_name']} {lead_data['last_name']} with ID: {lead_id}")
        else:
            logger.error(f"Failed to create lead: {lead_data['email']}")
    
    return lead_ids

def seed_campaigns(supabase: Client, admin_id):
    """Seed the campaigns table with sample campaigns"""
    logger.info("Seeding campaigns table...")
    
    # Create test campaigns
    campaigns = [
        {
            "name": "Summer Promotion 2023",
            "description": "Special offer for summer season",
            "type": "email",
            "status": "active",
            "start_date": str(datetime.now() - timedelta(days=10)),
            "end_date": str(datetime.now() + timedelta(days=20)),
            "budget": 5000.00,
            "created_by": admin_id,
            "created_at": str(datetime.now()),
            "updated_at": str(datetime.now()),
            "tags": ["summer", "promotion", "email"]
        },
        {
            "name": "Product Launch Webinar",
            "description": "Webinar for new product launch",
            "type": "event",
            "status": "scheduled",
            "start_date": str(datetime.now() + timedelta(days=15)),
            "end_date": str(datetime.now() + timedelta(days=16)),
            "budget": 3000.00,
            "created_by": admin_id,
            "created_at": str(datetime.now()),
            "updated_at": str(datetime.now()),
            "tags": ["webinar", "product launch", "event"]
        }
    ]
    
    campaign_ids = []
    for campaign_data in campaigns:
        response = supabase.table('campaigns').insert(campaign_data).execute()
        if len(response.data) > 0:
            campaign_id = response.data[0]['id']
            campaign_ids.append(campaign_id)
            logger.info(f"Created campaign {campaign_data['name']} with ID: {campaign_id}")
        else:
            logger.error(f"Failed to create campaign: {campaign_data['name']}")
    
    return campaign_ids

def seed_tasks(supabase: Client, admin_id, lead_ids):
    """Seed the tasks table with sample tasks"""
    logger.info("Seeding tasks table...")
    
    # Create test tasks
    tasks = [
        {
            "title": "Follow up with John Doe",
            "description": "Discuss enterprise plan options",
            "due_date": str(datetime.now() + timedelta(days=2)),
            "priority": "high",
            "status": "pending",
            "type": "call",
            "created_by": admin_id,
            "assigned_to": admin_id,
            "lead_id": lead_ids[0],
            "created_at": str(datetime.now()),
            "updated_at": str(datetime.now())
        },
        {
            "title": "Send proposal to XYZ Corp",
            "description": "Prepare and send the sales proposal",
            "due_date": str(datetime.now() + timedelta(days=5)),
            "priority": "medium",
            "status": "pending",
            "type": "email",
            "created_by": admin_id,
            "assigned_to": admin_id,
            "lead_id": lead_ids[1],
            "created_at": str(datetime.now()),
            "updated_at": str(datetime.now())
        },
        {
            "title": "Follow up with Bob",
            "description": "Discuss next steps",
            "due_date": str(datetime.now() + timedelta(days=1)),
            "priority": "high",
            "status": "pending",
            "type": "call",
            "created_by": admin_id,
            "assigned_to": admin_id,
            "lead_id": lead_ids[2],
            "created_at": str(datetime.now()),
            "updated_at": str(datetime.now())
        }
    ]
    
    for task_data in tasks:
        response = supabase.table('tasks').insert(task_data).execute()
        if len(response.data) > 0:
            task_id = response.data[0]['id']
            logger.info(f"Created task '{task_data['title']}' with ID: {task_id}")
        else:
            logger.error(f"Failed to create task: {task_data['title']}")

def clear_tables(supabase: Client):
    """Clear all tables in preparation for seeding"""
    logger.info("Clearing existing data...")
    tables = ['tasks', 'campaign_leads', 'campaigns', 'leads', 'users']
    
    for table in tables:
        try:
            # Use delete without where to delete all records
            response = supabase.table(table).delete().neq('id', 0).execute()
            logger.info(f"Cleared table: {table}")
        except Exception as e:
            logger.error(f"Error clearing table {table}: {e}")

def seed_database():
    """Main function to seed the database with initial data"""
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Clear tables
        clear_tables(supabase)
        
        # Seed tables
        admin_id = seed_users(supabase)
        lead_ids = seed_leads(supabase, admin_id)
        campaign_ids = seed_campaigns(supabase, admin_id)
        seed_tasks(supabase, admin_id, lead_ids)
        
        logger.info("Database seeding completed successfully!")
        return True
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        return False

if __name__ == "__main__":
    logger.info("Starting database seeding...")
    success = seed_database()
    if success:
        logger.info("Database seeding completed successfully!")
        sys.exit(0)
    else:
        logger.error("Database seeding failed!")
        sys.exit(1) 