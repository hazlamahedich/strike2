# Modern CRM UI/UX Design

This project implements a sleek, modern CRM interface that confines all relationship management functionality to a single responsive screen while evoking a sense of kinetic energy and movement.

## Features

### Visual Style
- Clean, professional design language with purposeful white space
- Modern color palette with strategic accent colors for status indicators
- Subtle gradients and shadows for depth to distinguish different information cards and panels
- Typography that balances readability with modern aesthetics
- Responsive grid system that maintains visual hierarchy across device sizes

### Motion and Kinetic Elements
- Subtle micro-interactions for all interactive elements
- Motion to guide users between different views
- Smooth transitions between deal stages in the sales pipeline
- Gesture-based interactions for quick actions
- Meaningful loading states that maintain the sense of flow

### Single-Screen CRM Functionality
- Component-based architecture with modular sections for contacts, deals, tasks, and communications
- Contextual panels that expand without navigating away
- Intelligent dashboard that prioritizes urgent deals, follow-ups, and key metrics
- Adaptive layout that reorganizes content based on the user's role and current focus
- Smart filtering system that maintains context while narrowing visible data

### AI-Powered Features
- LLM-powered text generation for email drafting, note summarization, and content creation
- Configurable language models for different AI use-cases
- Centralized LLM configuration system for consistent AI experiences
- Usage tracking and analytics for LLM API consumption

## Components

1. **CrmLayout**: The main layout component that provides the structure for the CRM interface.
2. **ContactCard**: Displays contact information with relationship health indicators and communication history.
3. **DealPipeline**: Visualizes the sales pipeline with drag-and-drop functionality for moving deals between stages.
4. **TaskManager**: Manages tasks with priority indicators and deadline visualization.
5. **CommunicationPanel**: Displays and manages communications with contacts.
6. **AnalyticsDashboard**: Displays key performance metrics and sales analytics.
7. **LLMSettingsPanel**: Configures and manages language models for AI features.

## Technical Implementation

- Built with React and Next.js
- Uses Framer Motion for animations
- Implements Tailwind CSS for styling
- Uses Radix UI components for accessibility
- Recharts for data visualization
- Supabase for database and authentication
- LLM integration for AI-powered features

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Design Considerations

- Focus on reducing friction in the sales process with kinetic transitions
- Balance comprehensive customer data with digestible information architecture
- Create a system that feels responsive and alive without overwhelming sales professionals
- Design for data entry efficiency—minimize clicks for common tasks
- Support both light and dark mode implementations for different working environments

# LLM Configuration System

## Overview

The centralized LLM (Large Language Model) configuration system provides a unified way to manage and use language models throughout the application. It enables:

- Setting up and configuring multiple LLM providers (OpenAI, Anthropic, Google, etc.)
- Designating a default model for AI features
- Tracking usage statistics across the application
- Ensuring consistent error handling and fallback mechanisms

## Architecture

The system consists of the following components:

### 1. Database Schema

The Supabase database contains the following tables:
- `llm_models`: Stores model configurations
- `llm_usage`: Tracks API usage statistics

### 2. Core Components

- **LLM Context Provider** (`frontend/contexts/LLMContext.tsx`): React context for app-wide access to LLM settings
- **LLM Service** (`frontend/lib/services/llmService.ts`): Core service for fetching settings and communicating with LLM APIs
- **LLM Generate API** (`frontend/app/api/llm/generate/route.ts`): Central API endpoint for text generation
- **LLM Types** (`frontend/lib/types/llm.ts`): TypeScript definitions for LLM-related data
- **LLM Settings Panel** (`frontend/components/LLMSettingsPanel.tsx`): UI component for managing models

### 3. API Endpoints

- `GET/POST /api/llm/models`: List and create LLM models
- `GET/PUT/DELETE /api/llm/models/[id]`: Get, update, and delete a specific model
- `PUT /api/llm/models/[id]/default`: Set a model as the default
- `POST /api/llm/generate`: Generate text with a specified model

## Usage Guidelines

### Using LLM in Components

To use the LLM functionality in a React component, use the `useLLMGenerate` hook:

```tsx
import { useLLMGenerate } from '@/lib/hooks/useLLM';

function MyComponent() {
  const { generating, error, generateText } = useLLMGenerate();
  
  const handleGenerate = async () => {
    const result = await generateText('Your prompt here');
    // Use the generated text
  };
  
  return (
    <div>
      <button onClick={handleGenerate} disabled={generating}>
        {generating ? 'Generating...' : 'Generate Text'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
```

### Accessing LLM Information

To access information about the current LLM settings:

```tsx
import { useLLM } from '@/contexts/LLMContext';

function MyComponent() {
  const { defaultModel, settings, loading, error, refreshSettings } = useLLM();
  
  return (
    <div>
      {defaultModel && (
        <p>Using {defaultModel.provider} / {defaultModel.model_name}</p>
      )}
      <button onClick={refreshSettings}>Refresh Settings</button>
    </div>
  );
}
```

### Backend Integration

The backend server has a corresponding `/api/llm/generate` endpoint that handles actual API calls to LLM providers. It:

1. Validates requests and API keys
2. Makes calls to the appropriate LLM provider
3. Records usage statistics
4. Handles errors and provides appropriate responses

## Configuration

Models can be configured through the LLM Settings Panel in the admin interface. For each model, you can specify:

- Provider (OpenAI, Anthropic, etc.)
- Model name (gpt-3.5-turbo, claude-2, etc.)
- API key
- Base URL (for custom deployments)
- API version
- Organization ID (if applicable)
- Temperature and max tokens settings

## Error Handling

The system includes robust error handling at multiple levels:

1. API endpoints return appropriate HTTP status codes
2. The LLM service captures and processes errors
3. UI components display error messages and provide retry mechanisms
4. Mock data can be used for testing or when APIs are unavailable
