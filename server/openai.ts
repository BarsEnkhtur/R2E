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