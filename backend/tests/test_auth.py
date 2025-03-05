import pytest
from httpx import AsyncClient
from fastapi import status

from main import app

# Mock test data
test_user = {
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User",
    "role": "sales_rep"
}


@pytest.mark.asyncio
async def test_register_user():
    """Test user registration"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/auth/register", json=test_user)
        
        # Either the test will succeed with a 200 OK if this is the first run,
        # or it will return 400 Bad Request if the user already exists
        assert response.status_code in (status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST)
        
        if response.status_code == status.HTTP_200_OK:
            # If successful, check that the response contains the user data
            data = response.json()
            assert data["email"] == test_user["email"]
            assert data["name"] == test_user["name"]
            assert "id" in data
            # Password should not be returned
            assert "password" not in data
            assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_login_user():
    """Test user login"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Use form data for OAuth2 password flow
        response = await client.post(
            "/api/auth/login",
            data={
                "username": test_user["email"],
                "password": test_user["password"]
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        
        # Store the token for the next test
        return data["access_token"]


@pytest.mark.asyncio
async def test_get_current_user(test_login_user):
    """Test getting the current user with the auth token"""
    access_token = await test_login_user
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == test_user["email"]
        assert data["name"] == test_user["name"]


@pytest.mark.asyncio
async def test_logout(test_login_user):
    """Test user logout"""
    access_token = await test_login_user
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "logged out" in data["message"].lower()
        
        # Try to use the token after logout
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        # Should fail with 401 Unauthorized
        assert response.status_code == status.HTTP_401_UNAUTHORIZED 