# Road2Employment (R2E)

*A personal momentum tracker that grew from one person's need to a community of goal-crushers*

## The Story

I built this app because I was burning out. As someone grinding through job applications, coding projects, gym sessions, and learning new skills, I needed a way to track my weekly progress without losing sight of what I was actually accomplishing.

The problem wasn't lack of motivation, it was lack of visibility. I'd work hard all week, then feel like I hadn't done anything meaningful. Sound familiar?

So I created this momentum tracker for myself. A simple way to:
- Log every meaningful task I completed
- See my weekly progress in real-time  
- Prevent burnout by celebrating small wins
- Stay accountable to my goals

It worked so well that my friends and peers started asking to use it. Now it's helping a growing community of job seekers, developers, and ambitious people stay on track with their goals.

## What Makes This Different

**🎯 Built for Real Life**
- Tracks the messy, varied work of personal growth
- Job applications, code commits, workouts, learning—all in one place
- Dynamic point system that rewards consistency

**🧠 AI-Powered Encouragement**  
- Personalized micro-feedback after each task completion
- "🧠 Smart move!" for job apps, "🔥 Great push!" for code
- Weekly performance summaries that actually motivate

**📱 Mobile-First Design**
- Drag-and-drop task management
- Quick-add buttons for common activities
- Works seamlessly on phone, tablet, or desktop

**🔥 Momentum-Based Scoring**
- Tasks get more valuable the more you do them (up to 2x base points)
- Neglected tasks get bonus points to encourage balance
- Weekly goals that adapt to your performance

## Core Features

### Task Management
- **Preset Tasks**: Job applications, coding, gym, learning, networking
- **Custom Tasks**: Create personalized activities with emoji icons
- **Smart Categorization**: Visual badges (💼 💻 💪 💡) for quick scanning

### Progress Tracking
- **Daily Activity Logs**: See exactly what you accomplished each day
- **Weekly Highlights**: Auto-detection of your biggest wins and streaks
- **Streak Tracking**: Build momentum with consistency rewards

### Intelligent Feedback
- **Micro-Feedback Bubbles**: AI-generated encouragement after each task
- **Goal Achievement Messages**: Personalized celebrations when you hit targets
- **Weekly Summaries**: Performance insights that keep you motivated

### Social Features
- **Progress Sharing**: Create shareable snapshots of your week
- **Community Ready**: Easy for friends to join and start tracking

## Tech Stack

- **Frontend**: React + TypeScript with shadcn/ui components
- **Backend**: Node.js + Express with session-based auth
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-4o for personalized feedback
- **Styling**: Tailwind CSS with mobile-responsive design

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- OpenAI API key (for AI feedback features)

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set environment variables:
   ```
   DATABASE_URL=your_postgresql_url
   OPENAI_API_KEY=your_openai_key
   ```
4. Push database schema: `npm run db:push`
5. Start development server: `npm run dev`

The app will be available at `http://localhost:5000`

## Why It Works

This isn't just another productivity app. It's designed around the psychology of momentum:

- **Visibility**: See your progress accumulating in real-time
- **Variety**: Track different types of meaningful work together
- **Validation**: Get immediate positive feedback for every action
- **Balance**: Neglect penalties encourage well-rounded development
- **Community**: Share wins and stay accountable with peers

## Contributing

Started as a personal project, now maintained for the community. Feel free to:
- Report bugs or suggest features
- Submit pull requests
- Share your momentum tracking success stories

## From Personal Tool to Community Platform

What began as a solo solution to prevent burnout has become a platform helping friends and peers stay motivated on their career journeys. Every feature was battle-tested in my own goal pursuit before being shared with others.

If you're grinding toward your next opportunity—whether it's landing your dream job, building coding skills, or maintaining healthy habits—this tracker will help you see and celebrate the progress you're already making.
