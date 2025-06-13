import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface WeeklyPerformanceData {
  totalPoints: number;
  weeklyGoal: number;
  tasksCompleted: number;
  uniqueTaskTypes: number;
  topTasks: Array<{ name: string; count: number; points: number }>;
  goalAchieved: boolean;
  streaksStarted: number;
  weekNumber: number;
  previousWeekPoints?: number;
}

export async function generateWeeklyMessage(data: WeeklyPerformanceData): Promise<string> {
  try {
    const prompt = `You are a motivational career coach for job seekers. Generate a personalized, encouraging message based on this week's performance data.

Week Performance:
- Points earned: ${data.totalPoints}/${data.weeklyGoal} (Goal ${data.goalAchieved ? 'ACHIEVED' : 'not met'})
- Tasks completed: ${data.tasksCompleted}
- Different task types: ${data.uniqueTaskTypes}
- New streaks started: ${data.streaksStarted}
- Top activities: ${data.topTasks.map(t => `${t.name} (${t.count}x, ${t.points} pts)`).join(', ')}
${data.previousWeekPoints ? `- Previous week: ${data.previousWeekPoints} points` : ''}

Guidelines:
- Keep it under 50 words, conversational and motivating
- Reference specific accomplishments when impressive
- If goal wasn't met, be encouraging but honest
- Use "you" language, be personal and supportive
- Mention job search context when relevant
- Vary the tone based on performance level
- Be specific to their actual activities

Examples of good messages:
- "Crushing those networking calls paid off - 8 this week! That persistence is exactly what lands great opportunities."
- "Solid week even though you fell short of your goal. Those 3 job applications show real commitment to moving forward."
- "Wow, 25% over your goal! That interview prep streak is building serious momentum for your search."

Generate ONE motivational message:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.8,
    });

    return response.choices[0].message.content?.trim() || "Great effort this week! Keep pushing forward with your goals.";
  } catch (error) {
    console.error("Failed to generate weekly message:", error);
    // Fallback message
    if (data.goalAchieved) {
      return "Fantastic work hitting your goal this week! That momentum will carry you far.";
    } else {
      return "Every step forward counts. Keep building on this week's progress!";
    }
  }
}

export async function generateGoalAchievementMessage(data: {
  totalPoints: number;
  weeklyGoal: number;
  tasksCompleted: number;
  topTaskToday?: string;
}): Promise<string> {
  try {
    const prompt = `Generate a brief, celebratory message for achieving a weekly goal in job searching.

Achievement:
- Reached ${data.totalPoints} points (goal was ${data.weeklyGoal})
- Completed ${data.tasksCompleted} tasks total
${data.topTaskToday ? `- Just completed: ${data.topTaskToday}` : ''}

Guidelines:
- Maximum 25 words
- Celebratory but not over the top
- Job search context
- Encourage continued momentum

Generate ONE celebration message:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50,
      temperature: 0.7,
    });

    return response.choices[0].message.content?.trim() || "Goal achieved! You're building incredible momentum in your job search.";
  } catch (error) {
    console.error("Failed to generate goal achievement message:", error);
    return "Goal achieved! You're building incredible momentum in your job search.";
  }
}

export async function generateMicroFeedback(taskData: {
  taskId: string;
  taskName: string;
  note?: string;
  streakCount: number;
  isFirstThisWeek: boolean;
}): Promise<string> {
  try {
    const prompt = `Generate a brief, encouraging micro-feedback message for completing a job search task.

Task Details:
- Task: ${taskData.taskName}
- Streak count this week: ${taskData.streakCount}
- First time this week: ${taskData.isFirstThisWeek}
${taskData.note ? `- Note: ${taskData.note}` : ''}

Guidelines:
- Maximum 15 words
- Upbeat and specific to the task type
- Use relevant emoji (🧠, 🔥, 💪, 💼, 💻, 💡)
- Match the energy to streak/performance

Task type patterns:
- Job applications: Focus on persistence, momentum
- Code/Development: Focus on building, progress  
- Gym/Recovery: Focus on discipline, strength
- Learning: Focus on growth, skills
- Networking: Focus on connections, relationships

Generate ONE micro-feedback message:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 30,
      temperature: 0.8,
    });

    return response.choices[0].message.content?.trim() || getDefaultMicroFeedback(taskData.taskId, taskData.streakCount);
  } catch (error) {
    console.error("Failed to generate micro feedback:", error);
    return getDefaultMicroFeedback(taskData.taskId, taskData.streakCount);
  }
}

function getDefaultMicroFeedback(taskId: string, streakCount: number): string {
  const streakBonus = streakCount >= 3 ? " 🔥" : "";
  
  if (taskId.includes('job') || taskId.includes('application')) {
    return `🧠 Smart move!${streakBonus}`;
  } else if (taskId.includes('code') || taskId.includes('push') || taskId.includes('dev')) {
    return `🔥 Great push!${streakBonus}`;
  } else if (taskId.includes('gym') || taskId.includes('recovery') || taskId.includes('workout')) {
    return `💪 Staying disciplined${streakBonus}`;
  } else if (taskId.includes('learn') || taskId.includes('study') || taskId.includes('course')) {
    return `💡 Growing stronger${streakBonus}`;
  } else if (taskId.includes('network') || taskId.includes('coffee') || taskId.includes('meeting')) {
    return `🤝 Building connections${streakBonus}`;
  } else {
    return `✨ Great progress${streakBonus}`;
  }
}

interface TaskPattern {
  taskId: string;
  taskName: string;
  count: number;
  totalPoints: number;
  averagePoints: number;
  lastCompleted: string;
  notes: string[];
}

interface BadgeGenerationData {
  userId: string;
  completedTasks: TaskPattern[];
  totalTasks: number;
  totalPoints: number;
  uniqueTaskTypes: number;
  longestStreak: number;
  currentStreak: number;
  averageTasksPerWeek: number;
  topCategories: string[];
  recentAchievements: string[];
}

export async function generateAIBadge(data: BadgeGenerationData): Promise<{
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  criteria: string;
  taskPatterns: any;
} | null> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a personalized badge designer for a momentum tracking app. Analyze user task patterns and create meaningful, personalized badges that celebrate their unique achievements and motivate continued progress.

Guidelines:
- Create badges that are specific to the user's actual task patterns and behaviors
- Focus on unique combinations, consistency patterns, or personal milestones
- Use encouraging, professional language
- Badge names should be 2-4 words, catchy and personal
- Descriptions should be 1-2 sentences explaining the achievement
- Categories: "streak", "consistency", "task-specific", "milestone", "creativity", "balance"
- Colors: "blue", "emerald", "purple", "yellow", "red", "indigo", "green", "orange", "pink", "cyan"
- Icons should be single emojis that represent the achievement
- Only suggest badges for meaningful patterns or achievements

Respond with JSON in this exact format:
{
  "badgeId": "unique-identifier",
  "name": "Badge Name",
  "description": "Achievement description",
  "icon": "🏆",
  "color": "blue",
  "category": "milestone",
  "criteria": "Human readable criteria",
  "shouldCreate": true
}

If no meaningful badge can be created, respond with: {"shouldCreate": false}`
        },
        {
          role: "user",
          content: `Analyze this user's task completion patterns and suggest a personalized badge:

User Data:
- Total tasks completed: ${data.totalTasks}
- Total points earned: ${data.totalPoints}
- Unique task types: ${data.uniqueTaskTypes}
- Longest streak: ${data.longestStreak} days
- Current streak: ${data.currentStreak} days
- Average tasks per week: ${data.averageTasksPerWeek}
- Top task categories: ${data.topCategories.join(', ')}

Detailed task patterns:
${data.completedTasks.map(task => 
  `- ${task.taskName}: ${task.count} times (${task.totalPoints} points, avg ${task.averagePoints.toFixed(1)} per task)`
).join('\n')}

Recent task notes (for context):
${data.completedTasks.flatMap(t => t.notes.slice(0, 2)).slice(0, 5).join('\n')}

Create a badge that celebrates a specific pattern, achievement, or unique combination in this user's data.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"shouldCreate": false}');
    
    if (!result.shouldCreate) {
      return null;
    }

    return {
      badgeId: result.badgeId || `ai-badge-${Date.now()}`,
      name: result.name,
      description: result.description,
      icon: result.icon,
      color: result.color,
      category: result.category,
      criteria: result.criteria,
      taskPatterns: {
        analyzedTasks: data.completedTasks.length,
        totalPoints: data.totalPoints,
        uniqueTypes: data.uniqueTaskTypes,
        topCategories: data.topCategories,
        generatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Failed to generate AI badge:', error);
    return null;
  }
}