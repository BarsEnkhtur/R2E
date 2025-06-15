# Road2Employment - Momentum Tracker Application

## Overview

Road2Employment (R2E) is a personal momentum tracking application designed for job seekers, developers, and ambitious individuals. Built as a full-stack React application with Express.js backend, it helps users track daily tasks, maintain consistency, and celebrate progress through an AI-powered feedback system.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Component Library**: Radix UI with shadcn/ui components
- **State Management**: TanStack Query (React Query) for server state
- **Drag & Drop**: @dnd-kit for sortable task management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture  
- **Framework**: Express.js with TypeScript
- **Development**: Vite for frontend bundling, tsx for backend development
- **Authentication**: Google OAuth 2.0 via Passport.js with session-based auth
- **API Design**: RESTful API with JSON responses

### Data Storage Solutions
- **Database**: PostgreSQL (via Neon serverless)
- **ORM**: Drizzle ORM with type-safe schema
- **Session Storage**: PostgreSQL table for session persistence
- **Database Schema**: User management, task tracking, statistics, custom tasks, sharing, and AI badges

### Authentication and Authorization
- **Primary Auth**: Google OAuth 2.0 with Passport.js
- **Session Management**: Express sessions stored in PostgreSQL
- **Demo Mode**: Fallback authentication for testing
- **Authorization**: Middleware-based route protection with user context

## Key Components

### Task Management System
- **Preset Tasks**: Common activities (job applications, coding, gym, learning, networking)
- **Custom Tasks**: User-created activities with emoji icons and point values
- **Drag & Drop**: Reorderable task lists with @dnd-kit
- **Point System**: Dynamic scoring with momentum-based multipliers (up to 2x)

### Progress Tracking
- **Weekly Goals**: Adaptive goal calculation based on historical performance
- **Streak Tracking**: Consecutive task completion monitoring
- **Statistics**: Task frequency, point accumulation, and trend analysis
- **History**: Weekly performance summaries and comparisons

### AI Integration
- **Micro-feedback**: Instant AI-generated encouragement after task completion
- **Weekly Messages**: Personalized performance summaries using OpenAI GPT-4o
- **Smart Badges**: AI-generated achievement recognition
- **Goal Achievement**: Contextual celebration messages

### Sharing System
- **Week Sharing**: Generate shareable links for weekly performance
- **Forking**: Copy shared tasks and goals to personal account
- **Public Views**: Read-only access to shared progress without authentication

## Data Flow

1. **User Authentication**: Google OAuth → Session creation → User profile storage
2. **Task Completion**: User action → Point calculation → Database storage → AI feedback generation
3. **Progress Calculation**: Weekly aggregation → Goal comparison → Statistics update
4. **AI Generation**: Task/performance data → OpenAI API → Personalized feedback storage
5. **Sharing**: Progress data → Token generation → Public link creation

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless instance
- **AI Services**: OpenAI API (GPT-4o model)
- **Authentication**: Google OAuth 2.0 credentials
- **Session Storage**: PostgreSQL with connect-pg-simple

### Development Tools
- **TypeScript**: Type safety across full stack
- **ESBuild**: Production backend bundling
- **Drizzle Kit**: Database schema management and migrations

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **@dnd-kit**: Drag and drop functionality

## Deployment Strategy

### Production Build
- **Frontend**: Vite build process generating static assets
- **Backend**: ESBuild bundling for Node.js deployment
- **Database**: Drizzle migrations for schema updates

### Environment Configuration
- **Database**: `DATABASE_URL` for PostgreSQL connection
- **Authentication**: Google OAuth client ID and secret
- **AI**: OpenAI API key for GPT integration
- **Sessions**: Secure session secret for cookie signing

### Replit Deployment
- **Modules**: Node.js 20, web environment, PostgreSQL 16
- **Autoscale**: Configured for automatic scaling
- **Port**: Application serves on port 5000, exposed on port 80

## Changelog

```
Changelog:
- June 14, 2025. Initial setup
- June 14, 2025. Dashboard Architecture Implementation:
  - Created dedicated Dashboard page at /dashboard as default landing
  - Implemented persistent navigation tabs (Dashboard, Tasks, Progress, Badges, Settings)
  - Added Focus for This Week panel with top 3-4 tasks by multiplier
  - Built compact widgets for Streak & Progress, Recent Badges, Recent Activity
  - Separated full task management into dedicated /tasks page
  - Enhanced week navigation with dynamic data loading and context updates
  - Added client-side routing with no page reloads between views
- June 14, 2025. Task Icons & Table Polish Implementation:
  - Integrated lucide-react with 40+ semantic icons for task management
  - Mapped default tasks to semantic icons (Briefcase, Users, Code, Heart, Lightbulb)
  - Built icon picker with 8-column grid of curated lucide icons for custom tasks
  - Implemented polished task table with proper colored icon circles (32px)
  - Added complete CRUD functionality with edit/delete modals for all tasks
  - Enhanced table layout with hover states, type badges, and action buttons
  - Completed Settings page with profile management and notification controls
- June 15, 2025. Badges Page Enhancement & API Integration:
  - Replaced legacy badge system with complete API-driven implementation
  - Added filter functionality for rarity selection and responsive design
  - Enhanced badge gallery with 3-4 column grid and proper card layouts
  - Implemented comprehensive stats row with Total Badges, XP, Legendary, Recent counts
  - Added Trophy icon empty state with motivational copy and example badge types
  - Built rarity legend with gradient badges for Common/Uncommon/Rare/Legendary
  - Integrated loading states and responsive breakpoints for mobile compatibility
- June 15, 2025. Week Scroller Data & Progress Tab Enhancement:
  - Fixed week scroller to use authentic Monday-Sunday date ranges (Jun 8 – Jun 14)
  - Implemented /api/progress endpoint with start/end date parameters for real data
  - Enhanced Progress page with dynamic stats cards using authentic API responses
  - Updated week navigation with proper ISO week calculation and current week detection
  - Integrated top tasks display from actual completion data with points and counts
  - Added Recent Performance table with real date ranges and achievement status
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```