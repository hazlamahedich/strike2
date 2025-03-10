# STRIKE - AI-Powered CRM System

STRIKE is an intelligent, modular CRM system built with modern AI capabilities, focusing on lead management, communication, and sales pipeline optimization.

## Features

- **User Authentication & Management**: Secure login, role-based access control, team collaboration, and user profiles.
- **Lead Management**: Import/export with AI parsing, customizable fields, segmentation, and pipeline stages.
- **Communication Suite**: Email, SMS, and call integration with tracking and sentiment analysis.
- **Campaign Management**: Create, manage, and track marketing campaigns with different statuses (draft, active, paused, completed).
- **Calendar & Meeting Management**: Calendar integration, scheduling, and meeting management.
- **Task Management**: Task creation, assignment, and tracking with reminders.
- **Interaction History**: Comprehensive activity timeline and searchable communication history.
- **AI-Powered Insights**: Sentiment analysis, lead scoring, conversion prediction, and content suggestions.
- **Analytics & Reporting**: Real-time dashboards, custom reports, and sales forecasting.
- **AI Chatbot Assistant**: Integrated chatbot for user assistance and natural language database queries.

## Technical Stack

### Backend
- Python with FastAPI
- Pydantic for data validation and settings management
- Supabase for database and authentication
- OpenAI API for AI capabilities
- SendGrid for email functionality
- Twilio for SMS and call functionality

### Frontend
- Next.js 15 with React
- Tailwind CSS with shadcn/ui components
- Supabase client for authentication and data access
- Modern React patterns with hooks and context

### DevOps & Infrastructure
- Docker for containerization
- Environment configuration management
- Monitoring and error handling

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- Docker and Docker Compose (optional)
- Supabase account
- API keys for OpenAI, SendGrid, and Twilio (optional)

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/strike.git
   cd strike
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

4. Create a `.env` file in the backend directory based on `.env.example`:
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

6. Run the backend server:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

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
│   │   ├── agents/         # AI agent implementations
│   │   ├── core/           # Core functionality
│   │   ├── data/           # Data handling utilities
│   │   ├── models/         # Pydantic models
│   │   ├── routers/        # API routes
│   │   └── services/       # Business logic
│   ├── main.py             # Application entry point
│   ├── supabase_schema.sql # Database schema definition
│   ├── supabase_seed.sql   # Initial seed data
│   └── setup_supabase.py   # Database setup script
├── frontend/               # Frontend Next.js application
│   ├── app/                # Next.js app directory
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Dashboard pages
│   │   ├── communications/ # Communication pages
│   │   └── leads/          # Lead management pages
│   ├── components/         # Reusable UI components
│   ├── context/            # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and API clients
│   ├── public/             # Static assets
│   └── styles/             # Global styles
├── docker-compose.yml      # Docker Compose configuration
├── requirements.txt        # Python dependencies
└── STRIKE_USER_MANUAL.md   # Comprehensive user manual
```

## AI Capabilities

- **Lead Parsing & Enrichment**: Extract and categorize lead information from unstructured documents.
- **Sentiment Analysis**: Analyze communication for sentiment, intent, and urgency.
- **Lead Scoring**: Multi-factor model to predict conversion probability.
- **Smart Recommendations**: Suggest next best actions and optimal contact times.
- **Conversation Assistance**: Real-time suggestions and summarization.
- **Automated Follow-ups**: Smart scheduling and content generation.
- **Chatbot Assistant**: Integrated with the user manual for contextual help and natural language database queries.

## Campaign Management

STRIKE supports comprehensive campaign management with different statuses:

- **Draft**: Initial state for campaigns being created
- **Scheduled**: Campaign is scheduled to start in the future
- **Active**: Campaign is currently running with full functionality
- **Paused**: Campaign is temporarily stopped but can be resumed
- **Completed**: Campaign has finished and cannot be modified
- **Cancelled**: Campaign has been cancelled and cannot be modified

Each status has specific behaviors and restrictions regarding lead and activity management.

## Database Structure

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

## Troubleshooting

### Supabase Auth and Database Setup Issues

If you encounter issues with Supabase authentication or database setup:

1. Run the SQL migration script:
   ```bash
   cd frontend/lib/supabase/migrations
   ```
   
   Copy the contents of `fix_auth_tables.sql` and run it in the Supabase SQL Editor.

2. Check the database connection:
   ```bash
   cd backend
   python test_db_connection.py
   ```

3. Verify the database schema:
   ```bash
   python check_db_schema.py
   ```

### API Key Issues

- **OpenAI API Errors**: Check your OpenAI account has sufficient credits and billing is set up
- **Supabase Connection Issues**: Ensure your IP is not restricted in Supabase settings
- **SendGrid Email Not Sending**: Verify your sender email is properly authenticated
- **Twilio SMS/Call Failures**: Check your Twilio account balance and number capabilities

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Documentation

For detailed usage instructions, refer to the [STRIKE User Manual](./STRIKE_USER_MANUAL.md). 