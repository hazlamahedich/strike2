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

5. Run the backend server:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

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