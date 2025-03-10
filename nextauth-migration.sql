-- Create NextAuth.js tables in Supabase

-- Account table
CREATE TABLE IF NOT EXISTS "Account" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on provider and providerAccountId
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" 
ON "Account"("provider", "providerAccountId");

-- Session table
CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL,
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on sessionToken
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" 
ON "Session"("sessionToken");

-- VerificationToken table
CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL
);

-- Create unique constraint on token
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" 
ON "VerificationToken"("token");

-- Create unique constraint on identifier and token
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" 
ON "VerificationToken"("identifier", "token");

-- User table (only if you don't already have a users table)
-- If you already have a users table in Supabase, you'll need to modify it instead
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "emailVerified" TIMESTAMP(3),
  "password" TEXT NOT NULL,
  "image" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on email
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" 
ON "User"("email");

-- Profile table
CREATE TABLE IF NOT EXISTS "Profile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bio" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on userId
CREATE UNIQUE INDEX IF NOT EXISTS "Profile_userId_key" 
ON "Profile"("userId");

-- Add foreign key constraints
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; 