import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta

from app.models.campaign import CampaignTypeEnum, CampaignStatusEnum
from app.models.campaign_lead import LeadCampaignStatus

# Test data
test_campaign = {
    "name": "Test Marketing Campaign",
    "description": "A test campaign for unit testing",
    "type": CampaignTypeEnum.EMAIL.value,
    "status": CampaignStatusEnum.DRAFT.value,
    "start_date": (datetime.now() + timedelta(days=1)).isoformat(),
    "end_date": (datetime.now() + timedelta(days=30)).isoformat(),
    "budget": 5000.0,
    "goals": {
        "conversion_target": 100,
        "expected_revenue": 50000.0
    },
    "tags": ["test", "email", "marketing"]
}

test_lead = {
    "first_name": "Test",
    "last_name": "Lead",
    "email": "test.lead@example.com",
    "phone": "123-456-7890",
    "company": "Test Company",
    "position": "CEO",
    "source": "Test",
    "status": "NEW",
    "notes": "Test lead for campaign tests"
}


# Fixtures for common test data
@pytest.fixture(scope="module")
async def auth_headers(client: AsyncClient):
    """Get auth headers for authenticated requests"""
    # Login as test user
    login_data = {
        "email": "test@example.com",
        "password": "password123"
    }
    response = await client.post("/api/auth/login", json=login_data)
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
async def test_campaign_id(client: AsyncClient, auth_headers):
    """Create a test campaign and return its ID"""
    response = await client.post("/api/campaigns/", json=test_campaign, headers=auth_headers)
    assert response.status_code == 201
    return response.json()["id"]


@pytest.fixture(scope="module")
async def test_lead_id(client: AsyncClient, auth_headers):
    """Create a test lead and return its ID"""
    response = await client.post("/api/leads/", json=test_lead, headers=auth_headers)
    assert response.status_code == 201
    return response.json()["id"]


# Tests for campaign CRUD operations
async def test_create_campaign(client: AsyncClient, auth_headers):
    """Test creating a new campaign"""
    response = await client.post("/api/campaigns/", json=test_campaign, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == test_campaign["name"]
    assert data["type"] == test_campaign["type"]
    assert data["status"] == test_campaign["status"]
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data
    assert data["lead_count"] == 0
    
    # Clean up
    await client.delete(f"/api/campaigns/{data['id']}", headers=auth_headers)


async def test_get_campaigns(client: AsyncClient, auth_headers, test_campaign_id):
    """Test getting a list of campaigns"""
    response = await client.get("/api/campaigns/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # At least our test campaign should be in the list
    assert any(campaign["id"] == test_campaign_id for campaign in data)


async def test_get_campaign_by_id(client: AsyncClient, auth_headers, test_campaign_id):
    """Test getting a specific campaign by ID"""
    response = await client.get(f"/api/campaigns/{test_campaign_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_campaign_id
    assert data["name"] == test_campaign["name"]


async def test_get_campaign_detail(client: AsyncClient, auth_headers, test_campaign_id):
    """Test getting detailed campaign information"""
    response = await client.get(f"/api/campaigns/{test_campaign_id}/detail", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_campaign_id
    assert "owner" in data
    assert "lead_sample" in data
    assert "recent_activities" in data


async def test_update_campaign(client: AsyncClient, auth_headers, test_campaign_id):
    """Test updating a campaign"""
    update_data = {
        "name": "Updated Campaign Name",
        "status": CampaignStatusEnum.ACTIVE.value,
        "tags": ["updated", "test"]
    }
    response = await client.put(
        f"/api/campaigns/{test_campaign_id}", 
        json=update_data, 
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_campaign_id
    assert data["name"] == update_data["name"]
    assert data["status"] == update_data["status"]
    assert set(data["tags"]) == set(update_data["tags"])


# Tests for campaign-lead relationship
async def test_add_lead_to_campaign(
    client: AsyncClient, auth_headers, test_campaign_id, test_lead_id
):
    """Test adding a lead to a campaign"""
    response = await client.post(
        f"/api/campaigns/{test_campaign_id}/leads/{test_lead_id}",
        params={"status": LeadCampaignStatus.ADDED.value, "notes": "Test note"},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["campaign_id"] == test_campaign_id
    assert data["lead_id"] == test_lead_id
    assert data["status"] == LeadCampaignStatus.ADDED.value
    assert data["notes"] == "Test note"


async def test_get_campaign_leads(
    client: AsyncClient, auth_headers, test_campaign_id, test_lead_id
):
    """Test getting all leads in a campaign"""
    response = await client.get(
        f"/api/campaigns/{test_campaign_id}/leads",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(lead["lead_id"] == test_lead_id for lead in data)
    
    # Check that lead details are included
    lead_data = next(lead for lead in data if lead["lead_id"] == test_lead_id)
    assert "lead" in lead_data
    assert lead_data["lead"]["email"] == test_lead["email"]


async def test_update_lead_status(
    client: AsyncClient, auth_headers, test_campaign_id, test_lead_id
):
    """Test updating the status of a lead in a campaign"""
    status_data = {
        "status": LeadCampaignStatus.ENGAGED.value,
        "notes": "Lead is engaged"
    }
    response = await client.put(
        f"/api/campaigns/{test_campaign_id}/leads/{test_lead_id}",
        json=status_data,
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["campaign_id"] == test_campaign_id
    assert data["lead_id"] == test_lead_id
    assert data["status"] == LeadCampaignStatus.ENGAGED.value
    # Notes should be appended
    assert "Lead is engaged" in data["notes"]


async def test_get_lead_campaigns(
    client: AsyncClient, auth_headers, test_lead_id, test_campaign_id
):
    """Test getting all campaigns a lead is part of"""
    response = await client.get(
        f"/api/campaigns/leads/{test_lead_id}",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(campaign["campaign_id"] == test_campaign_id for campaign in data)
    
    # Check that campaign details are included
    campaign_data = next(campaign for campaign in data if campaign["campaign_id"] == test_campaign_id)
    assert "campaign" in campaign_data
    assert campaign_data["campaign"]["name"] == "Updated Campaign Name"  # From the update test


async def test_bulk_add_leads(client: AsyncClient, auth_headers, test_campaign_id):
    """Test adding multiple leads to a campaign at once"""
    # First create two more test leads
    lead1_response = await client.post("/api/leads/", json={
        **test_lead,
        "email": "bulk1@example.com",
        "first_name": "Bulk1"
    }, headers=auth_headers)
    lead2_response = await client.post("/api/leads/", json={
        **test_lead,
        "email": "bulk2@example.com",
        "first_name": "Bulk2"
    }, headers=auth_headers)
    
    lead1_id = lead1_response.json()["id"]
    lead2_id = lead2_response.json()["id"]
    
    # Now bulk add these leads to the campaign
    bulk_data = {
        "lead_ids": [lead1_id, lead2_id],
        "status": LeadCampaignStatus.ADDED.value,
        "notes": "Bulk added for testing"
    }
    
    response = await client.post(
        f"/api/campaigns/{test_campaign_id}/bulk-add",
        json=bulk_data,
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == 2
    
    # Verify the leads were added by checking campaign leads
    response = await client.get(
        f"/api/campaigns/{test_campaign_id}/leads",
        headers=auth_headers
    )
    leads_data = response.json()
    lead_ids = [lead["lead_id"] for lead in leads_data]
    assert lead1_id in lead_ids
    assert lead2_id in lead_ids


async def test_remove_lead_from_campaign(
    client: AsyncClient, auth_headers, test_campaign_id, test_lead_id
):
    """Test removing a lead from a campaign"""
    response = await client.delete(
        f"/api/campaigns/{test_campaign_id}/leads/{test_lead_id}",
        params={"notes": "Removed for testing"},
        headers=auth_headers
    )
    assert response.status_code == 204
    
    # Verify the lead was removed by checking it's not in active leads
    response = await client.get(
        f"/api/campaigns/{test_campaign_id}/leads",
        headers=auth_headers
    )
    leads_data = response.json()
    lead_ids = [lead["lead_id"] for lead in leads_data]
    assert test_lead_id not in lead_ids
    
    # It should still be visible if we include removed leads in lead campaigns
    response = await client.get(
        f"/api/campaigns/leads/{test_lead_id}",
        params={"include_removed": True},
        headers=auth_headers
    )
    campaigns_data = response.json()
    campaign_data = next((c for c in campaigns_data if c["campaign_id"] == test_campaign_id), None)
    assert campaign_data is not None
    assert campaign_data["status"] == LeadCampaignStatus.REMOVED.value


# Clean up test
async def test_delete_campaign(client: AsyncClient, auth_headers, test_campaign_id):
    """Test deleting a campaign"""
    response = await client.delete(f"/api/campaigns/{test_campaign_id}", headers=auth_headers)
    assert response.status_code == 204
    
    # Verify the campaign was deleted
    response = await client.get(f"/api/campaigns/{test_campaign_id}", headers=auth_headers)
    assert response.status_code == 404 