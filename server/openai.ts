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
  tier?: string;
  taskPatterns: any;
} | null> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an advanced gamification designer for a momentum tracking app. Create dynamic, tiered badges that celebrate unique user patterns and encourage balanced growth across multiple task categories.

ADVANCED BADGE DESIGN PRINCIPLES:
1. ADAPTIVE THRESHOLDS: Base requirements on user's personal history (e.g., "20% more than your usual")
2. COMBO BADGES: Reward synergistic combinations (gym + coding + job apps in same timeframe)
3. TIERED PROGRESSION: Bronze → Silver → Gold levels that build upon each other
4. BEHAVIORAL VARIETY: Encourage cross-category engagement
5. STREAK MASTERY: Recognize sustained consistency across multiple areas
6. HIDDEN LEGENDARY: Extremely rare achievements for exceptional patterns

BADGE CATEGORIES & EXAMPLES:
- "synergy": Cross-category combinations (e.g., "Code & Sweat Warrior")
- "balance": Even distribution across task types
- "streak": Consistency patterns (daily, weekly, monthly)
- "intensity": High-volume periods or exceptional effort
- "variety": Exploring different task types
- "legendary": Rare, exceptional achievements
- "adaptive": Personal growth relative to user's baseline

TIER SYSTEM:
- Bronze: Basic achievement
- Silver: Enhanced version with additional requirements
- Gold: Master level with streaks or multiple weeks
- Legendary: Hidden, exceptional accomplishments

VISUAL DESIGN:
- Use 2-emoji combinations for synergy badges (🏋️‍♂️💻, ⚡🎯)
- Single powerful emoji for milestone badges (🏆, 💎, ⭐)
- Color should match intensity: bronze/orange, silver/cyan, gold/yellow, legendary/purple

Respond with JSON in this exact format:
{
  "badgeId": "unique-identifier",
  "name": "Badge Name",
  "description": "Achievement description with motivational language",
  "icon": "🏆",
  "color": "blue",
  "category": "synergy",
  "tier": "Bronze",
  "criteria": "Human readable criteria",
  "shouldCreate": true
}

If no meaningful badge can be created, respond with: {"shouldCreate": false}`
        },
        {
          role: "user",
          content: `Analyze this user's task completion patterns and create an advanced gamified badge:

USER PERFORMANCE DATA:
- Total tasks completed: ${data.totalTasks}
- Total points earned: ${data.totalPoints}
- Unique task types: ${data.uniqueTaskTypes}
- Longest streak: ${data.longestStreak} days
- Current streak: ${data.currentStreak} days
- Average tasks per week: ${data.averageTasksPerWeek}
- Top categories: ${data.topCategories.join(', ')}

DETAILED TASK BREAKDOWN:
${data.completedTasks.map(task => 
  `- ${task.taskName}: ${task.count}x completed (${task.totalPoints} total points, ${task.averagePoints.toFixed(1)} avg/task)`
).join('\n')}

PATTERN ANALYSIS HINTS:
- Look for cross-category synergies (gym + coding, job apps + learning, etc.)
- Identify exceptional volume in specific timeframes
- Detect balanced distribution across categories
- Recognize adaptive growth patterns
- Find unique combinations not typically seen together

CONTEXTUAL NOTES (User's recent activities):
${data.completedTasks.flatMap(t => t.notes.slice(0, 2)).slice(0, 5).join('\n')}

CREATE A BADGE that:
1. Celebrates their strongest pattern or most impressive combination
2. Uses appropriate tier level based on achievement difficulty
3. Motivates continued growth in their demonstrated strengths
4. Follows the advanced gamification principles outlined above`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"shouldCreate": false}');
    
    if (!result.shouldCreate) {
      return null;
    }

    // Calculate XP reward based on tier and rarity
    const calculateXpReward = (tier?: string, category?: string): number => {
      const baseXp = {
        'Bronze': 150,
        'Silver': 300,
        'Gold': 600,
        'Legendary': 1200
      };
      
      const categoryMultiplier = {
        'synergy': 1.5,
        'legendary': 2.0,
        'balance': 1.3,
        'streak': 1.2,
        'adaptive': 1.4
      };
      
      const base = baseXp[tier as keyof typeof baseXp] || 100;
      const multiplier = categoryMultiplier[category as keyof typeof categoryMultiplier] || 1.0;
      
      return Math.round(base * multiplier);
    };

    // Determine rarity based on category and tier
    const determineRarity = (tier?: string, category?: string): string => {
      if (tier === 'Legendary' || category === 'legendary') return 'legendary';
      if (tier === 'Gold' || category === 'synergy') return 'epic';
      if (tier === 'Silver' || category === 'balance') return 'rare';
      return 'common';
    };

    const xpReward = calculateXpReward(result.tier, result.category);
    const rarity = determineRarity(result.tier, result.category);

    return {
      badgeId: result.badgeId || `ai-badge-${Date.now()}`,
      name: result.name,
      description: result.description,
      icon: result.icon,
      color: result.color,
      category: result.category,
      tier: result.tier,
      criteria: result.criteria,
      xpReward,
      rarity,
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