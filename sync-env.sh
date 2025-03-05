#!/bin/bash

# This script syncs shared environment variables between frontend and backend

# Extract Supabase URL and key from backend .env
SUPABASE_URL=$(grep SUPABASE_URL backend/.env | cut -d '=' -f2)
SUPABASE_KEY=$(grep SUPABASE_KEY backend/.env | cut -d '=' -f2)

# Update frontend .env.local with these values
sed -i '' "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL|g" frontend/.env.local
sed -i '' "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_KEY|g" frontend/.env.local

echo "Environment variables synced successfully!" 