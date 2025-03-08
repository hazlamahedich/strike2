# STRIKE - AI-Powered CRM System
## User Manual

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
   - [System Requirements](#system-requirements)
   - [Account Creation](#account-creation)
   - [Logging In](#logging-in)
   - [Dashboard Overview](#dashboard-overview)
   - [API Keys Setup](#api-keys-setup)
3. [Lead Management](#lead-management)
   - [Viewing Leads](#viewing-leads)
   - [Adding New Leads](#adding-new-leads)
   - [Importing Leads](#importing-leads)
   - [Lead Details](#lead-details)
   - [Lead Pipeline Management](#lead-pipeline-management)
4. [Communication Tools](#communication-tools)
   - [Email Integration](#email-integration)
   - [SMS Messaging](#sms-messaging)
   - [Call Tracking](#call-tracking)
   - [Communication History](#communication-history)
5. [Meeting Management](#meeting-management)
   - [Scheduling Meetings](#scheduling-meetings)
   - [Calendar Integration](#calendar-integration)
   - [Meeting Notes](#meeting-notes)
6. [Task Management](#task-management)
   - [Creating Tasks](#creating-tasks)
   - [Assigning Tasks](#assigning-tasks)
   - [Task Tracking](#task-tracking)
7. [Campaign Management](#campaign-management)
   - [Creating Campaigns](#creating-campaigns)
   - [Campaign Types](#campaign-types)
   - [Campaign Status Management](#campaign-status-management)
   - [Adding Leads to Campaigns](#adding-leads-to-campaigns)
   - [Campaign Analytics](#campaign-analytics)
   - [Campaign Audit Logs](#campaign-audit-logs)
8. [AI-Powered Features](#ai-powered-features)
   - [Chatbot Assistant](#chatbot-assistant)
   - [Chatbot-Manual Integration](#chatbot-manual-integration)
   - [Lead Scoring](#lead-scoring)
   - [Automated Workflows for Low Probability Clients](#automated-workflows-for-low-probability-clients)
   - [Sentiment Analysis](#sentiment-analysis)
   - [Smart Recommendations](#smart-recommendations)
9. [Analytics & Reporting](#analytics--reporting)
   - [Dashboard Analytics](#dashboard-analytics)
   - [Custom Reports](#custom-reports)
   - [Performance Metrics](#performance-metrics)
   - [User Analytics](#user-analytics)
   - [Email Performance Tracking](#email-performance-tracking)
10. [User Settings](#user-settings)
    - [Profile Management](#profile-management)
    - [Notification Settings](#notification-settings)
    - [Team Collaboration](#team-collaboration)
11. [System Administration](#system-administration)
    - [Role-Based Access Control](#role-based-access-control)
    - [Audit Logs](#audit-logs)
    - [Integration Management](#integration-management)
    - [Ticketing System](#ticketing-system)
12. [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
    - [Using the Chatbot for Troubleshooting](#using-the-chatbot-for-troubleshooting)
    - [Support Contact](#support-contact)

## Introduction

STRIKE is an intelligent, AI-powered Customer Relationship Management (CRM) system designed to streamline lead management, enhance communication, and provide actionable insights for sales and marketing teams. With its modern interface and advanced AI capabilities, STRIKE helps you manage your customer relationships more effectively and close deals faster.

This user manual provides comprehensive guidance on using all features of the STRIKE platform. For your convenience, our AI-powered chatbot assistant is fully integrated with this manual, allowing you to ask questions about any feature or process directly within the application. Simply open the chatbot and ask for help on any topic covered in this manual.

## Getting Started

### System Requirements

To use STRIKE effectively, ensure you have:
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection
- Screen resolution of at least 1280x720

### Account Creation

1. Navigate to the STRIKE login page
2. Click on "Create Account" or "Sign Up"
3. Fill in your details:
   - Full Name
   - Email Address
   - Password (must be at least 8 characters with a mix of letters, numbers, and special characters)
4. Accept the Terms of Service
5. Click "Create Account"
6. Verify your email address by clicking the link sent to your email

### Logging In

1. Navigate to the STRIKE login page
2. Enter your email address and password
3. Click "Log In"
4. If you've forgotten your password, click "Forgot Password" and follow the instructions sent to your email

### Dashboard Overview

Upon logging in, you'll be greeted with your personalized dashboard featuring:

- **Quick Stats**: Overview of key metrics like lead count, conversion rate, and recent activities
- **Activity Feed**: Recent interactions and updates
- **Task List**: Your upcoming and overdue tasks
- **Lead Pipeline**: Visual representation of your sales pipeline
- **Calendar**: Upcoming meetings and events
- **Navigation Menu**: Access to all STRIKE features

### API Keys Setup

STRIKE integrates with several third-party services that require API keys. Follow these instructions to obtain and configure each required API key:

#### Supabase API Keys

1. **Create a Supabase Account**:
   - Go to [https://supabase.com](https://supabase.com) and sign up for an account
   - Verify your email address

2. **Create a New Project**:
   - From the Supabase dashboard, click "New Project"
   - Enter a name for your project
   - Set a secure database password
   - Choose a region closest to your users
   - Click "Create new project"

3. **Get API Keys**:
   - Once your project is created, go to the project dashboard
   - Navigate to "Settings" > "API" in the sidebar
   - You'll find two keys: `anon public` and `service_role`
   - Copy the `anon public` key for `SUPABASE_KEY` in your STRIKE configuration
   - Copy the URL from the "Config" section for `SUPABASE_URL`

4. **Configure Database**:
   - Run the SQL scripts provided in the STRIKE installation package to set up the required tables and functions

#### OpenAI API Keys

1. **Create an OpenAI Account**:
   - Go to [https://platform.openai.com/signup](https://platform.openai.com/signup)
   - Complete the registration process

2. **Get API Key**:
   - Log in to your OpenAI account
   - Navigate to "API Keys" in the left sidebar
   - Click "Create new secret key"
   - Give your key a name (e.g., "STRIKE CRM")
   - Copy the generated key immediately (it won't be shown again)
   - Use this key for `OPENAI_API_KEY` in your STRIKE configuration

3. **Set Up Billing**:
   - Go to "Billing" in the sidebar
   - Add a payment method
   - Set usage limits to control costs

#### SendGrid API Keys (for Email Integration)

1. **Create a SendGrid Account**:
   - Go to [https://sendgrid.com](https://sendgrid.com) and sign up
   - Complete the verification process

2. **Create API Key**:
   - From the SendGrid dashboard, go to "Settings" > "API Keys"
   - Click "Create API Key"
   - Name your key (e.g., "STRIKE CRM Integration")
   - Select "Full Access" or customize permissions (at minimum, need "Mail Send" permissions)
   - Click "Create & View"
   - Copy the generated key for `SENDGRID_API_KEY` in your STRIKE configuration

3. **Verify Sender Identity**:
   - Go to "Settings" > "Sender Authentication"
   - Follow the steps to verify your domain or at least a single sender email
   - Use the verified email address for `SENDGRID_FROM_EMAIL` in your configuration

#### Twilio API Keys (for SMS and Call Integration)

1. **Create a Twilio Account**:
   - Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
   - Sign up and verify your email and phone number

2. **Get Account SID and Auth Token**:
   - From the Twilio dashboard, find your Account SID and Auth Token
   - These will be used for `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` in your STRIKE configuration

3. **Get a Twilio Phone Number**:
   - In the Twilio dashboard, go to "Phone Numbers" > "Manage" > "Buy a Number"
   - Search for a number with SMS and voice capabilities
   - Purchase the number
   - Use this number for `TWILIO_PHONE_NUMBER` in your configuration

4. **Configure Webhooks** (for advanced functionality):
   - Set up webhooks in the Twilio dashboard to point to your STRIKE instance
   - For SMS: Configure the webhook URL to `https://your-strike-domain.com/api/twilio/sms`
   - For Voice: Configure the webhook URL to `https://your-strike-domain.com/api/twilio/voice`

#### Google Calendar API (for Calendar Integration)

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project

2. **Enable the Google Calendar API**:
   - In your project, go to "APIs & Services" > "Library"
   - Search for "Google Calendar API" and enable it

3. **Create OAuth Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Configure the OAuth consent screen
   - For Application type, select "Web application"
   - Add authorized redirect URIs (e.g., `https://your-strike-domain.com/api/auth/callback/google`)
   - Copy the Client ID and Client Secret for your STRIKE configuration

#### Configuring API Keys in STRIKE

1. **Locate the .env File**:
   - In your STRIKE installation directory, find the `.env` file in the backend directory

2. **Update the .env File**:
   - Replace the placeholder values with your actual API keys:
   ```
   # Supabase settings
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   
   # OpenAI settings
   OPENAI_API_KEY=your_openai_api_key
   
   # SendGrid settings
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=your_verified_email
   
   # Twilio settings
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   
   # Google Calendar settings (optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

3. **Restart the STRIKE Backend**:
   - After updating the `.env` file, restart the backend server for changes to take effect

#### API Key Security Best Practices

1. **Never share your API keys** publicly or commit them to version control
2. **Use environment variables** instead of hardcoding keys in your application
3. **Set up usage limits** where possible to prevent unexpected charges
4. **Rotate keys periodically** for enhanced security
5. **Use the minimum required permissions** for each service
6. **Monitor API usage** regularly to detect unusual activity

## Lead Management

### Viewing Leads

1. Click on "Leads" in the main navigation menu
2. The leads page displays all your leads in a sortable and filterable table
3. Use the search bar to find specific leads
4. Apply filters to narrow down leads by status, source, or custom fields
5. Sort leads by clicking on column headers

### Adding New Leads

1. From the Leads page, click "Add Lead" button
2. Fill in the lead information form:
   - Contact Information (Name, Email, Phone)
   - Company Details
   - Lead Source
   - Initial Status
   - Custom Fields
3. Click "Save" to add the lead to your database

### Importing Leads

1. From the Leads page, click "Import Leads"
2. Download the template CSV file if needed
3. Prepare your CSV file with lead data
4. Upload the file using the drag-and-drop area or file browser
5. Map the columns in your CSV to STRIKE fields
6. Review the data preview
7. Click "Import" to add the leads to your database
8. Review the import summary for any errors or warnings

### Lead Details

1. Click on any lead name to view their detailed profile
2. The lead profile includes:
   - Contact Information
   - Activity Timeline
   - Communication History
   - Notes
   - Tasks
   - Documents
   - Custom Fields
3. Edit any information by clicking the "Edit" button
4. Add notes, tasks, or schedule meetings directly from this page

### Lead Pipeline Management

1. Navigate to the "Pipeline" view from the Leads section
2. Drag and drop leads between pipeline stages
3. Click on a lead card to view quick details
4. Use the filter options to focus on specific segments
5. Customize pipeline stages through the Settings menu

## Communication Tools

### Email Integration

1. Click on "Communications" in the main menu, then select "Email"
2. Compose new emails by clicking "New Email"
3. Use templates from the template library
4. Schedule emails for later delivery
5. Track email opens, clicks, and responses
6. View email history for each lead

### SMS Messaging

1. Navigate to "Communications" > "SMS"
2. Select a lead or multiple leads to message
3. Compose your SMS message
4. Schedule or send immediately
5. View delivery status and responses
6. Access SMS history for each lead

### Call Tracking

1. Go to "Communications" > "Calls"
2. Initiate calls directly from the platform
3. Record call notes during or after the call
4. Set follow-up tasks based on call outcomes
5. Review call history and recordings

### Communication History

All communications are automatically logged in:
1. The lead's activity timeline
2. The Communications section
3. Your personal activity feed

## Meeting Management

### Scheduling Meetings

1. Click "Meetings" in the main navigation
2. Select "Schedule Meeting"
3. Choose meeting type (in-person, video call, phone call)
4. Select participants (leads, team members)
5. Set date, time, and duration
6. Add agenda and notes
7. Send invitations

### Calendar Integration

1. Go to "Settings" > "Integrations"
2. Connect your Google Calendar or Outlook Calendar
3. Two-way sync ensures all meetings appear in both STRIKE and your personal calendar
4. Receive notifications for upcoming meetings

### Meeting Notes

1. During or after a meeting, open the meeting details
2. Click "Add Notes"
3. Record key points, decisions, and action items
4. Tag participants as needed
5. Set follow-up tasks
6. Save notes to the meeting record and lead timeline

## Task Management

### Creating Tasks

1. Click "Tasks" in the main navigation
2. Select "New Task"
3. Enter task details:
   - Title
   - Description
   - Due Date
   - Priority
   - Related Lead (optional)
4. Click "Save" to create the task

### Assigning Tasks

1. When creating or editing a task, use the "Assign To" dropdown
2. Select team members to assign the task
3. Optionally add watchers who will be notified of updates
4. Save changes

### Task Tracking

1. View all tasks from the Tasks dashboard
2. Filter by status, priority, assignee, or due date
3. Sort tasks as needed
4. Mark tasks as In Progress or Complete
5. Add comments to tasks to provide updates

## Campaign Management

### Creating Campaigns

1. Navigate to "Campaigns" in the main menu
2. Click "Create Campaign" button
3. Fill in the campaign details:
   - Campaign Name
   - Campaign Type
   - Start and End Dates
   - Description
   - Goals and KPIs
   - Target Audience
4. Configure campaign settings:
   - Frequency of communications
   - Content templates
   - Follow-up rules
   - Exit criteria
5. Click "Create" to launch the campaign setup wizard

### Campaign Types

STRIKE supports multiple campaign types to address different business needs:

1. **Drip Campaigns**
   - Automated sequence of messages sent at predetermined intervals
   - Ideal for nurturing leads over time
   - Configure message content, timing, and conditions

2. **Outreach Campaigns**
   - Focused on initial contact with new leads
   - Multi-channel approach (email, SMS, call)
   - Performance tracking for each channel

3. **Event Campaigns**
   - Promote and manage attendance for webinars, conferences, or workshops
   - Registration tracking
   - Automated reminders
   - Post-event follow-up

4. **Re-engagement Campaigns**
   - Target inactive leads
   - Specialized content to rekindle interest
   - Escalation paths for responsive leads

5. **Conversion Campaigns**
   - Focus on leads near the decision stage
   - Targeted offers and incentives
   - Deadline-driven messaging

### Campaign Status Management

Campaigns in STRIKE can have the following statuses:

1. **Draft**: Campaign is being created and configured
   - All settings can be modified
   - No communications are sent

2. **Active**: Campaign is running and executing its workflow
   - Leads receive communications according to the schedule
   - Performance metrics are tracked in real-time
   - Minor adjustments can be made without stopping the campaign

3. **Paused**: Campaign is temporarily halted
   - No new communications are sent
   - Existing leads remain in the campaign
   - Can be reactivated at any time

4. **Completed**: Campaign has reached its end date or goals
   - No further communications are sent
   - Full analytics are available
   - Can be cloned for future use

5. **Cancelled**: Campaign has been permanently stopped
   - No further communications are sent
   - Leads can be removed or reassigned
   - Reason for cancellation is documented

To change a campaign's status:
1. Go to the Campaigns page
2. Find the campaign in the list
3. Click the "Status" dropdown
4. Select the new status
5. Confirm the change

When attempting to modify leads or activities for campaigns with restricted statuses (completed, cancelled), the system will display an alert explaining the limitation and offering appropriate actions.

### Adding Leads to Campaigns

There are multiple ways to add leads to campaigns:

1. **From Campaign Setup**:
   - During campaign creation, use the "Add Leads" step
   - Filter leads by criteria (status, score, source, etc.)
   - Select leads individually or in bulk

2. **From Lead List**:
   - Select leads in the lead list view
   - Click "Add to Campaign" in the actions menu
   - Choose the target campaign

3. **From Lead Detail**:
   - Open a lead's detail page
   - Click "Add to Campaign" in the actions menu
   - Select the campaign from the dropdown

4. **Automated Rules**:
   - Configure rules to automatically add leads to campaigns based on:
     - Score changes
     - Status updates
     - Website activity
     - Form submissions
     - Custom triggers

5. **CSV Import**:
   - Import leads directly into a campaign
   - Map CSV fields to lead properties
   - Set campaign-specific properties during import

### Campaign Analytics

Track campaign performance with dedicated analytics:

1. **Overview Dashboard**:
   - Active leads count
   - Completion percentage
   - Engagement rate
   - Conversion rate
   - ROI calculation

2. **Engagement Metrics**:
   - Email open and click rates
   - SMS response rates
   - Call connection rates
   - Content engagement

3. **Conversion Tracking**:
   - Lead status progression
   - Opportunity creation
   - Deal closure
   - Revenue attribution

4. **A/B Testing Results**:
   - Comparative performance of different:
     - Subject lines
     - Message content
     - Send times
     - Call scripts

5. **Lead Response Analysis**:
   - Response time metrics
   - Sentiment analysis
   - Frequently asked questions
   - Objection patterns

### Campaign Audit Logs

Every campaign maintains a detailed audit log for compliance and optimization:

1. **Activity Tracking**:
   - All communications sent
   - Status changes
   - Configuration updates
   - Lead additions and removals

2. **User Actions**:
   - Record of which team members made changes
   - Timestamps for all actions
   - Notes and justifications

3. **System Events**:
   - Automated rule executions
   - Error logs
   - Performance alerts

4. **Compliance Documentation**:
   - Opt-out requests
   - Consent records
   - Regulatory compliance checks

5. **Export Options**:
   - Download audit logs in CSV or PDF format
   - Filter by date range, action type, or user
   - Schedule regular audit reports

## AI-Powered Features

### Chatbot Assistant

The STRIKE Chatbot Assistant is available throughout the platform:

1. Click the chat icon in the bottom right corner to open the chatbot
2. Ask questions about:
   - Lead information
   - System features
   - Data analysis
   - Recommendations
   - User manual and help documentation
   - Database queries in natural language
3. The chatbot can:
   - Retrieve lead details
   - Summarize communications
   - Suggest follow-up actions
   - Generate email drafts
   - Provide insights on lead behavior
   - Answer questions about how to use STRIKE
   - Reference this user manual to provide detailed instructions
   - Guide you through complex workflows step-by-step
   - Troubleshoot common issues by referencing documentation
   - Convert natural language questions into database queries

#### Natural Language Database Queries

One of the most powerful features of the STRIKE chatbot is its ability to translate natural language questions into SQL database queries. This allows you to retrieve information from your CRM database without needing to know SQL:

1. **Ask Data Questions Naturally**: Simply ask questions like:
   - "How many leads do we have from the technology sector?"
   - "Show me all tasks assigned to Sarah that are due this week"
   - "What's the average lead score for leads acquired in the last month?"
   - "Which sales rep has the highest conversion rate this quarter?"

2. **How It Works**:
   - The chatbot analyzes your question to determine if it requires database access
   - It automatically generates an appropriate SQL query
   - The query is executed securely against your database
   - Results are formatted and presented in a readable format
   - The chatbot provides additional context and insights about the data

3. **Security Measures**:
   - All queries are limited to read-only operations (SELECT statements only)
   - Queries are sanitized to prevent SQL injection
   - Access is restricted based on user permissions
   - All database interactions are logged for security auditing

4. **Example Interactions**:

   *User*: "How many high-priority tasks are overdue?"
   
   *Chatbot*: "There are 12 high-priority tasks currently overdue. Here's the breakdown by assignee:
   - John Smith: 5 tasks
   - Sarah Johnson: 4 tasks
   - Michael Brown: 3 tasks
   
   Would you like to see the details of these tasks?"

   *User*: "Show me leads from California with a score above 80"
   
   *Chatbot*: "I found 8 leads from California with a score above 80. Here are the top 3 by score:
   1. Acme Corporation (Score: 95) - Last contacted: 2 days ago
   2. TechSolutions Inc (Score: 92) - Last contacted: 1 week ago
   3. Pacific Innovations (Score: 88) - Last contacted: 3 days ago
   
   Would you like to see the full list or get more details about any of these leads?"

#### Chatbot Interface Controls

The chatbot interface includes several controls for easy interaction:

1. **Minimize Button**: Click the minimize button (−) in the top-right corner of the chatbot window to collapse it back to the chat icon. You can reopen it anytime by clicking the chat icon again.
2. **Clear Conversation**: Click the trash icon to clear the current conversation history and start fresh.
3. **Copy to Clipboard**: Each message has a copy icon that appears on hover, allowing you to copy specific responses.
4. **Feedback Buttons**: After receiving a response, you can provide feedback using the thumbs up/down buttons.
5. **Expand/Collapse**: Some responses, especially those with multiple steps or sections, can be expanded or collapsed for easier reading.
6. **Draggable Window**: The chatbot window can be moved anywhere on the screen by clicking and dragging the header bar. By default, the chatbot opens in the lower right corner of the screen in a visible area, and will automatically stay within the screen boundaries when dragged.

#### Using the Chatbot for Help

The chatbot is integrated with this user manual and can provide contextual help:

1. Ask questions like "How do I import leads?" or "What is lead scoring?"
2. Request walkthroughs: "Guide me through setting up email integration"
3. Get troubleshooting help: "I'm having trouble logging in"
4. Access feature explanations: "Explain how sentiment analysis works"
5. Find specific sections: "Show me the task management section of the manual"

The chatbot will extract relevant information from this manual and present it in a conversational format, making it easier to find the help you need without leaving your current workflow.

### Chatbot-Manual Integration

The STRIKE chatbot is deeply integrated with this user manual through several advanced features:

#### Knowledge Base Integration

The chatbot has been trained on the entire contents of this user manual, allowing it to:

1. **Retrieve Specific Sections**: Request exact sections from the manual with commands like "Show me section 4.2 on Email Integration"
2. **Contextual Search**: Ask questions in natural language and receive relevant manual excerpts
3. **Visual Aids**: Request screenshots or diagrams from the manual for visual guidance

#### Interactive Tutorials

The chatbot can transform manual content into interactive tutorials:

1. **Step-by-Step Guidance**: The chatbot will break down complex procedures into interactive steps
2. **Contextual Awareness**: Recognizes which page you're on and offers relevant guidance
3. **Progress Tracking**: Remembers where you left off in multi-step tutorials
4. **Completion Verification**: Confirms each step is completed before moving to the next

#### Manual Updates and Feedback

The chatbot facilitates keeping the manual current:

1. **Suggest Updates**: If you find outdated information, tell the chatbot "This information is outdated" and suggest corrections
2. **Feature Requests**: Request new sections or topics to be added to the manual
3. **Clarity Feedback**: If a section is confusing, the chatbot can log this for improvement

#### Technical Implementation

The chatbot-manual integration uses several technologies:

1. **Vector Database**: The manual content is stored in a vector database for semantic search
2. **Context-Aware Retrieval**: The chatbot uses retrieval-augmented generation to pull relevant manual sections
3. **User Context Tracking**: The system tracks which parts of the application you're using to provide relevant help
4. **Markdown Parsing**: The chatbot can interpret the manual's markdown structure to find specific sections
5. **Image Recognition**: For visual elements, the chatbot can identify and retrieve relevant screenshots

#### Usage Examples

Here are some specific ways to leverage the chatbot-manual integration:

1. **Direct Section Access**: "Show me the section on importing leads"
2. **Procedural Guidance**: "Walk me through creating a custom report step by step"
3. **Feature Explanation**: "Explain how lead scoring works according to the manual"
4. **Contextual Help**: "I'm on the lead details page, what can I do here?"
5. **Manual Navigation**: "What topics are covered in section 7?"
6. **Comparative Information**: "What's the difference between SMS messaging and email integration?"
7. **Visual Guidance**: "Show me a screenshot of the dashboard analytics"
8. **Update Requests**: "The information about calendar integration seems outdated"

### Lead Scoring

STRIKE uses a sophisticated AI-powered lead scoring system to help you prioritize your sales efforts:

1. **Scoring Range**: Leads are scored on a scale of 1-100:
   - 80-100: Hot leads (high probability of conversion)
   - 50-79: Warm leads (moderate probability)
   - 20-49: Cool leads (lower probability)
   - 1-19: Cold leads (very low probability)

2. **Scoring Factors**: The AI considers multiple data points when calculating scores:
   - **Engagement Metrics** (40% weight):
     - Email open and response rates
     - Website visits (frequency and duration)
     - Content downloads and interaction
     - Form submissions
     - Chat interactions
   
   - **Demographic Fit** (25% weight):
     - Industry alignment with your target markets
     - Company size and revenue
     - Job title and decision-making authority
     - Geographic location
   
   - **Behavioral Signals** (20% weight):
     - Specific pages visited (pricing, product details)
     - Time spent on high-intent pages
     - Repeated visits to key conversion pages
     - Engagement with bottom-funnel content
   
   - **Communication Sentiment** (10% weight):
     - Positive language in communications
     - Response time to your outreach
     - Questions indicating buying intent
   
   - **External Data** (5% weight):
     - Social media activity
     - Company news and growth indicators
     - Market conditions

3. **Score Visibility**:
   - Lead scores are prominently displayed on lead cards and profiles
   - Color-coding provides quick visual reference (red: cold, yellow: cool, green: warm, blue: hot)
   - Hover over scores to see a breakdown of contributing factors
   - Historical score tracking shows progression over time

4. **Using Lead Scores**:
   - Sort lead lists by score to prioritize outreach
   - Filter dashboard views to focus on specific score ranges
   - Set up alerts for score changes above a certain threshold
   - Create segments based on score ranges for targeted campaigns
   - Track conversion rates by initial and current scores

5. **Score Recalculation**:
   - Scores are automatically updated daily
   - Significant interactions trigger immediate recalculation
   - Manual recalculation can be triggered from the lead profile

6. **Score Customization**:
   - Administrators can adjust factor weights in Settings > Lead Scoring
   - Industry-specific scoring models can be selected
   - Custom scoring factors can be added based on your unique business needs
   - A/B test different scoring models to optimize for your sales process

### Automated Workflows for Low Probability Clients

STRIKE includes powerful automation capabilities specifically designed to nurture low probability leads efficiently without consuming valuable sales team resources:

1. **Low Probability Classification**:
   - Leads with scores below 30 are automatically classified as low probability
   - Leads showing declining engagement patterns over 30 days
   - Leads that have explicitly indicated long future timeframes
   - Leads that match your configured exclusion criteria

2. **Automated Nurture Campaigns**:
   - **Activation**: Low probability leads are automatically enrolled in specialized nurture campaigns
   - **Content Delivery**: Scheduled delivery of educational content, case studies, and industry insights
   - **Frequency Control**: Optimized contact frequency to maintain presence without overwhelming
   - **Multi-Channel Approach**: Coordinated outreach across email, SMS, and social touchpoints
   - **Personalization**: AI-generated personalized content based on lead characteristics and behavior

3. **Workflow Configuration**:
   - Access workflow settings in **Settings > Automation > Low Probability Workflows**
   - Create multiple workflows for different types of low probability leads
   - Set entry and exit conditions based on score thresholds and behaviors
   - Configure content sequences with conditional logic
   - Set maximum workflow duration (typically 90-180 days)
   - Define success metrics and conversion paths

4. **Monitoring and Optimization**:
   - **Performance Dashboard**: Track key metrics for low probability workflows
   - **Engagement Analytics**: Monitor open rates, click-through rates, and response patterns
   - **Conversion Tracking**: Measure how many low probability leads convert to higher scores
   - **A/B Testing**: Compare different nurture approaches for continuous improvement
   - **ROI Calculation**: Measure resource investment against conversion outcomes

5. **Re-Engagement Triggers**:
   - **Score Improvements**: Leads that reach a score of 40+ are automatically flagged for sales review
   - **Buying Signals**: Specific high-intent actions trigger alerts regardless of overall score
   - **Timing Indicators**: Responses indicating changed timeframes accelerate follow-up
   - **Manual Overrides**: Sales team can manually move leads out of automated workflows at any time

6. **Exit Strategies**:
   - **Successful Conversion**: Leads showing renewed interest move to active sales workflows
   - **Time-Based Exit**: Leads with no engagement after configured timeframe (default: 120 days)
   - **Explicit Opt-Out**: Leads requesting no further contact
   - **Disqualification**: Leads confirmed as poor fits after additional data collection

7. **Implementation Best Practices**:
   - Start with a simple 5-7 touch sequence focused on education and value
   - Include periodic "check-in" messages that invite direct response
   - Incorporate seasonal or trigger-based content relevant to the lead's industry
   - Use progressive profiling to gather additional information over time
   - Maintain consistent branding while varying content formats
   - Include clear paths for leads to indicate renewed interest

8. **Example Workflow: "Hibernating Lead Nurture"**:
   - **Day 1**: Welcome email explaining the value-focused content they'll receive
   - **Day 7**: Industry-specific insight or trend report
   - **Day 21**: Case study relevant to their business challenges
   - **Day 35**: Invitation to upcoming webinar or resource library
   - **Day 60**: "Quick check-in" with easy response options
   - **Day 90**: Personalized value proposition based on accumulated data
   - **Day 120**: Final "stay in touch" message with future-focused options
   - **Conditional**: Any engagement above threshold triggers sales team notification

This automated approach ensures that low probability leads receive appropriate attention without diverting resources from higher-probability opportunities, while maintaining the possibility of future conversion when timing or circumstances change.

### Sentiment Analysis

Communication sentiment is automatically analyzed:

1. Email and SMS messages display sentiment indicators (positive, neutral, negative)
2. Call recordings can be analyzed for sentiment
3. Overall lead sentiment is displayed on their profile
4. Alerts for significant sentiment changes

### Smart Recommendations

AI-powered recommendations appear throughout the platform:

1. Best time to contact leads
2. Suggested follow-up actions
3. Email content recommendations
4. Next best offers
5. Personalization suggestions

## Analytics & Reporting

### Dashboard Analytics

1. The main dashboard provides key performance indicators
2. Visualizations include:
   - Lead conversion funnel
   - Activity volume by type
   - Lead source effectiveness
   - Team performance metrics
   - Pipeline value forecast

### Custom Reports

1. Navigate to "Analytics" > "Reports"
2. Select "New Report"
3. Choose report type or start from scratch
4. Select metrics and dimensions
5. Apply filters and date ranges
6. Choose visualization types
7. Save, schedule, or export reports

### Performance Metrics

Track key metrics including:
1. Lead conversion rates
2. Sales cycle length
3. Communication effectiveness
4. Activity volume
5. Revenue forecasts
6. Team performance

### User Analytics

Monitor and optimize individual and team performance:

1. **User Performance Dashboard**:
   - Access from Analytics > User Performance
   - View metrics for individual team members or teams
   - Compare performance across different time periods

2. **Key Metrics Tracked**:
   - Activity volume (calls, emails, meetings)
   - Response times
   - Lead conversion rates
   - Task completion rates
   - Revenue generation

3. **Performance Trends**:
   - Daily, weekly, and monthly activity patterns
   - Improvement or decline over time
   - Comparison to team averages and goals

4. **Activity Breakdown**:
   - Time spent on different activities
   - Most effective communication channels
   - Best performing lead sources
   - Highest value activities

5. **Goal Tracking**:
   - Progress toward individual and team goals
   - Achievement badges and recognition
   - Performance against KPIs

6. **Coaching Insights**:
   - AI-generated recommendations for improvement
   - Skill gap identification
   - Training suggestions
   - Success pattern recognition

### Email Performance Tracking

Gain insights into email campaign effectiveness:

1. **Email Analytics Dashboard**:
   - Access from Analytics > Email Performance
   - Overview of all email campaigns and individual emails
   - Real-time tracking of key metrics

2. **Metrics Tracked**:
   - Open rates
   - Click-through rates
   - Reply rates
   - Conversion rates
   - Bounce and unsubscribe rates

3. **Content Performance**:
   - Most effective subject lines
   - Highest performing email templates
   - Optimal email length and structure
   - Best performing calls-to-action

4. **Timing Analysis**:
   - Best days and times to send emails
   - Response time patterns
   - Optimal follow-up timing
   - Frequency optimization

5. **Recipient Behavior**:
   - Device and email client usage
   - Reading time analysis
   - Forward and share tracking
   - Multiple opens tracking

6. **A/B Test Results**:
   - Comparative performance of test variants
   - Statistical significance indicators
   - Recommended optimizations
   - Historical test results

## User Settings

### Profile Management

1. Click your profile picture in the top right
2. Select "Profile Settings"
3. Update personal information
4. Change password
5. Set preferences
6. Manage connected accounts

### Notification Settings

1. Go to "Settings" > "Notifications"
2. Configure notifications for:
   - New leads
   - Task assignments
   - Meeting reminders
   - Lead status changes
   - Team mentions
3. Choose notification methods (in-app, email, mobile)

### Team Collaboration

1. Administrators can manage teams via "Settings" > "Team Management"
2. Add new team members by email invitation
3. Assign roles and permissions
4. Create teams and departments
5. Set up approval workflows
6. Configure data sharing rules

## System Administration

### Role-Based Access Control

STRIKE implements a comprehensive role-based access control (RBAC) system to ensure appropriate access to features and data:

1. **Predefined Roles**:
   - **Administrator**: Full system access and configuration rights
   - **Manager**: Team management and reporting access
   - **Sales Rep**: Standard CRM functionality for assigned leads
   - **Marketing**: Campaign management and analytics access
   - **Support**: Limited access focused on customer service
   - **Viewer**: Read-only access to specific data

2. **Role Management**:
   - Access from Settings > User Management > Roles
   - Create custom roles with specific permissions
   - Modify existing roles
   - Assign users to multiple roles if needed

3. **Permission Categories**:
   - **Lead Management**: Create, view, edit, delete leads
   - **Communication**: Email, SMS, call permissions
   - **Campaign Management**: Create, modify, analyze campaigns
   - **Analytics**: Access to different reports and dashboards
   - **System Configuration**: Settings and integration management
   - **User Management**: Add, modify, deactivate users

4. **Data Access Controls**:
   - Team-based data segregation
   - Territory management
   - Record-level permissions
   - Field-level security

5. **Permission Assignment**:
   - Assign permissions to roles, not individual users
   - Use permission templates for common scenarios
   - Implement approval workflows for sensitive actions
   - Set up temporary access with expiration

6. **Audit and Compliance**:
   - Track permission changes
   - Regular access reviews
   - Permission usage reports
   - Compliance documentation

### Audit Logs

STRIKE maintains comprehensive audit logs for security, compliance, and troubleshooting:

1. **System-Wide Audit Trail**:
   - Access from Settings > System > Audit Logs
   - Searchable and filterable log entries
   - Export capabilities for compliance reporting

2. **Actions Tracked**:
   - User logins and logouts
   - Record creation, modification, and deletion
   - Permission changes
   - Configuration updates
   - API access and usage
   - Bulk operations

3. **Log Details**:
   - Timestamp (with timezone)
   - User identifier
   - IP address
   - Action performed
   - Affected records
   - Before and after values
   - Session information

4. **Retention and Archiving**:
   - Configure log retention periods
   - Automated archiving of older logs
   - Compliance with data retention regulations
   - Secure storage of archived logs

5. **Alert Configuration**:
   - Set up notifications for suspicious activities
   - Configure alerts for compliance violations
   - Create custom alert rules
   - Integrate with security monitoring systems

6. **Log Analysis**:
   - Pattern detection for security threats
   - Usage analytics
   - Performance impact analysis
   - Compliance reporting

### Integration Management

Manage all your third-party integrations from a central location:

1. **Integration Dashboard**:
   - Access from Settings > Integrations
   - Overview of all connected services
   - Status monitoring
   - Usage statistics

2. **Available Integrations**:
   - Email providers (Gmail, Outlook, etc.)
   - Calendar services (Google Calendar, Outlook)
   - Communication tools (Slack, Teams)
   - Marketing platforms (Mailchimp, HubSpot)
   - Document management (Google Drive, Dropbox)
   - Social media platforms
   - Custom API integrations

3. **Integration Setup**:
   - Step-by-step configuration wizards
   - API key management
   - OAuth authentication
   - Permission scoping
   - Testing tools

4. **Data Mapping**:
   - Configure field mappings between systems
   - Set up data transformation rules
   - Manage bidirectional sync settings
   - Handle conflict resolution

5. **Sync Settings**:
   - Configure sync frequency
   - Set up filters for data synchronization
   - Schedule syncs during off-hours
   - Monitor sync history and errors

6. **Webhooks and Automation**:
   - Create custom webhooks for real-time integration
   - Set up automated workflows between systems
   - Configure event triggers
   - Test and monitor webhook performance

### Ticketing System

STRIKE includes a built-in ticketing system for internal support and issue tracking:

1. **Ticket Management**:
   - Access from Support > Tickets
   - Create, view, update, and resolve tickets
   - Assign tickets to team members
   - Set priority and due dates

2. **Ticket Creation**:
   - Manual creation through the interface
   - Email-to-ticket conversion
   - Chatbot-generated tickets
   - Customer portal submissions

3. **Ticket Categories**:
   - Technical issues
   - Feature requests
   - Data problems
   - Account questions
   - Training requests
   - Custom categories

4. **Workflow Management**:
   - Customizable ticket statuses
   - Automated routing rules
   - SLA tracking
   - Escalation paths
   - Approval workflows

5. **Integration with CRM Data**:
   - Link tickets to leads, contacts, or accounts
   - Access relevant CRM data within tickets
   - Track ticket history in customer records
   - Generate reports on common issues by customer segment

6. **Knowledge Base Integration**:
   - Suggest solutions from knowledge base
   - Create knowledge base articles from resolved tickets
   - Track which articles successfully resolve issues
   - Identify knowledge gaps based on ticket patterns

## Troubleshooting

### Common Issues

**Login Problems**
- Ensure you're using the correct email and password
- Check if Caps Lock is enabled
- Try the "Forgot Password" option
- Clear browser cache and cookies

**Data Import Issues**
- Verify your CSV file format matches the template
- Check for special characters that might cause parsing errors
- Ensure required fields are populated
- Try importing smaller batches

**Performance Slowdowns**
- Close unnecessary browser tabs
- Clear browser cache
- Check your internet connection
- Try a different browser

**API Key Issues**
- **Invalid API Key Errors**: Verify you've copied the full key without any extra spaces
- **OpenAI API Errors**: Check your OpenAI account has sufficient credits and billing is set up
- **Supabase Connection Issues**: Ensure your IP is not restricted in Supabase settings
- **SendGrid Email Not Sending**: Verify your sender email is properly authenticated
- **Twilio SMS/Call Failures**: Check your Twilio account balance and number capabilities
- **Rate Limit Exceeded**: Some APIs have usage limits; check your usage dashboard for the relevant service
- **Permission Denied**: Ensure your API key has the necessary permissions for the operations you're performing

### Using the Chatbot for Troubleshooting

The STRIKE chatbot is your first line of support for any issues:

1. Click the chat icon in the bottom right corner of any screen
2. Describe your issue in natural language
3. The chatbot will:
   - Provide immediate solutions for common problems
   - Reference relevant sections of this user manual
   - Guide you through troubleshooting steps
   - Collect necessary information if escalation is needed
   - Create support tickets automatically when needed

Example queries for the chatbot:
- "I can't import my CSV file"
- "The dashboard isn't loading properly"
- "How do I fix the error when adding a new lead?"
- "My email integration isn't working"

### Support Contact

For additional assistance:
- Email: support@strikecrm.com
- In-app chat: Click the "Help" button in the bottom right
- Knowledge Base: help.strikecrm.com
- Phone: 1-800-STRIKE-CRM (Monday-Friday, 9am-5pm EST) 