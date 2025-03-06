# AI-Powered CRM System

An intelligent, modular CRM system built with modern AI capabilities, focusing on lead generation and management.

## Features

- **User Authentication & Management**: Role-based access control, team collaboration, and user profiles.
- **Lead Management**: Import/export with AI parsing, customizable fields, segmentation, and pipeline stages.
- **Communication Suite**: Email, SMS, and call integration with tracking and analysis.
- **Calendar & Meeting Management**: Calendar integration, scheduling, and meeting management.
- **Task Management**: Task creation, assignment, and tracking with reminders.
- **Interaction History**: Comprehensive activity timeline and searchable history.
- **AI-Powered Insights**: Sentiment analysis, lead scoring, conversion prediction, and content suggestions.
- **Analytics & Reporting**: Real-time dashboards, custom reports, and sales forecasting.

## Technical Stack

### Backend
- Python with FastAPI
- Pydantic for data validation and settings management
- LangChain and LangGraph for AI agent orchestration
- Supabase for database and authentication
- OpenAI API for AI capabilities
- SendGrid for email functionality
- Twilio for SMS and call functionality

### Frontend
- React with Next.js
- Tailwind CSS with shadcn/ui components
- React Query for state management

### DevOps & Infrastructure
- Docker for containerization
- CI/CD pipeline with GitHub Actions
- Vercel for frontend deployment
- Monitoring and logging with Sentry

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker and Docker Compose (optional)
- Supabase account (or local Supabase setup)

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-crm.git
   cd ai-crm
   ```

2. Set up a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the backend directory:
   ```
   # API settings
   SECRET_KEY=your_secret_key
   
   # Supabase settings
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   
   # OpenAI settings
   OPENAI_API_KEY=your_openai_api_key
   
   # SendGrid settings
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=your_from_email
   
   # Twilio settings
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_NUMBER=your_twilio_phone
   ```

5. Set up the Supabase database:
   ```bash
   cd backend
   python setup_supabase.py
   ```
   
   This script will create all the necessary tables, indexes, and seed the database with initial data.
   
   You can also run specific parts of the setup:
   ```bash
   # Only create the schema (tables, indexes, etc.)
   python setup_supabase.py --schema-only
   
   # Only seed the database with initial data
   python setup_supabase.py --seed-only
   ```

6. Run the backend server:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

### Database Structure

The CRM system uses a Supabase PostgreSQL database with the following main tables:

- **users**: User accounts with role-based access control
- **teams**: Team organization for users
- **leads**: Lead information and tracking
- **pipeline_stages**: Customizable sales pipeline stages
- **lead_status_history**: History of lead status changes
- **tasks**: Task management and assignment
- **emails, calls, sms**: Communication tracking
- **meetings**: Meeting scheduling and management
- **notes**: Notes attached to leads
- **activities**: Comprehensive activity timeline
- **campaigns**: Marketing campaign management
- **campaign_leads**: Junction table for leads in campaigns
- **lead_scores**: AI-generated lead scoring
- **recordings**: Call and meeting recordings
- **profiles**: User profiles and preferences

The database includes:
- Foreign key constraints for data integrity
- Indexes for performance optimization
- Triggers for automatic timestamp updates and activity logging
- Row-level security policies for data access control

### Frontend Setup

Coming soon...

### Docker Setup

1. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

## Project Structure

```
.
├── backend/                # Backend FastAPI application
│   ├── app/                # Application code
│   │   ├── core/           # Core functionality
│   │   ├── models/         # Pydantic models
│   │   ├── routers/        # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   ├── main.py             # Application entry point
│   ├── supabase_schema.sql # Database schema definition
│   ├── supabase_seed.sql   # Initial seed data
│   ├── setup_supabase.py   # Database setup script
│   └── Dockerfile          # Backend Docker config
├── frontend/               # Frontend Next.js application (coming soon)
├── docker-compose.yml      # Docker Compose config
└── README.md               # This file
```

## AI Capabilities

- **Lead Parsing & Enrichment**: Extract and categorize lead information from unstructured documents.
- **Sentiment Analysis**: Analyze communication for sentiment, intent, and urgency.
- **Lead Scoring**: Multi-factor ML model to predict conversion probability.
- **Smart Recommendations**: Suggest next best actions and optimal contact times.
- **Conversation Assistance**: Real-time suggestions and summarization.
- **Automated Follow-ups**: Smart scheduling and content generation.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Common Issues

### Supabase Auth and Database Setup Issues

You may encounter the following issues with Supabase authentication:

1. **Missing auth schema**: The auth schema may not be properly set up.
2. **Missing profiles table**: The profiles table may not exist or have the wrong structure.
3. **Missing triggers**: The trigger to create a profile when a new user registers may be missing.
4. **Incorrect permissions**: Row-level security policies may not be properly configured.
5. **Type mismatches**: The user_id column in the profiles table must be a UUID type.
6. **Database error saving new user**: This error occurs during registration when the trigger function fails.

### How to Fix

#### Option 1: Run the SQL Migration Script (Recommended)

1. Log into your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to the SQL Editor
3. Copy the contents of `frontend/lib/supabase/migrations/fix_auth_tables.sql`
4. Paste into the SQL Editor and run the script
5. This will:
   - Create the auth schema if it doesn't exist
   - Create the profiles table with the correct structure
   - Enable Row Level Security on the profiles table
   - Create policies for users to view and update their own profiles
   - Create trigger functions to handle user creation, updates, and deletions
   - Grant necessary permissions
   - Create a test table for anonymous access testing

#### Option 2: Manual Setup

If you prefer to set up the database manually, follow these steps:

1. Create the profiles table:
```sql
CREATE TABLE IF NOT EXISTS public.profiles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    avatar_url VARCHAR,
    preferences JSONB DEFAULT '{"theme": "light", "language": "en"}',
    notification_settings JSONB DEFAULT '{"push": true, "email": true}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

2. Enable Row Level Security and add policies:
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
    ON public.profiles 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles 
    FOR UPDATE 
    USING (auth.uid() = user_id);
```

3. Create a trigger for new users:
```sql
CREATE OR REPLACE FUNCTION auth.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, avatar_url)
    VALUES (new.id, 'https://randomuser.me/api/portraits/lego/1.jpg');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION auth.handle_new_user();
```

4. Create a test table for anonymous access:
```sql
CREATE TABLE IF NOT EXISTS public.test (
    id SERIAL PRIMARY KEY,
    content TEXT
);

ALTER TABLE public.test ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access" ON public.test FOR SELECT USING (true);

INSERT INTO public.test (content) VALUES ('This is a test record') ON CONFLICT DO NOTHING;
```

### Verifying the Fix

1. Visit the `/auth/test` page in your application to run the built-in tests
2. Ensure all database connection tests pass
3. Try to register a new user - it should work without errors
4. Check the Supabase dashboard to verify that a new profile was created

### Running the Test Script

We've included a test script that can help diagnose issues with your Supabase setup:

```bash
# From the frontend directory
node lib/supabase/test-script.mjs
```

The test script checks:
1. Database connection
2. Auth schema
3. Profiles table structure
4. Anonymous permissions
5. Profile creation

If any tests fail, follow the recommendations to fix the issues.

### Troubleshooting

If you're still experiencing issues:

1. **Check Supabase Project Settings**:
   - Ensure your project is on the correct plan
   - Verify that the database is not paused

2. **Check Database Permissions**:
   - Ensure the `anon` role has appropriate permissions
   - Check that RLS policies are correctly configured

3. **Network Issues**:
   - Verify that your application can reach the Supabase API
   - Check for CORS issues in the browser console

4. **Rate Limiting**:
   - Supabase has rate limits that may affect authentication
   - Check for rate limit errors in the console

### Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues) 