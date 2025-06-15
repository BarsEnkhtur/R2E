import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Target, 
  Flame, 
  Award,
  MessageCircle, 
  Code, 
  FileText, 
  DollarSign, 
  Heart, 
  Briefcase,
  Circle,
  Trophy,
  TrendingUp
} from "lucide-react";
import { format, startOfWeek, endOfWeek, getISOWeek } from "date-fns";

// Helper function to get task category icon
const getTaskCategoryIcon = (taskId: string): string => {
  if (taskId.includes('job') || taskId.includes('application')) return "💼";
  if (taskId.includes('code') || taskId.includes('push') || taskId.includes('dev')) return "💻";
  if (taskId.includes('gym') || taskId.includes('recovery') || taskId.includes('workout')) return "💪";
  if (taskId.includes('learn') || taskId.includes('study') || taskId.includes('course')) return "💡";
  if (taskId.includes('network') || taskId.includes('coffee') || taskId.includes('meeting')) return "🤝";
  return "✅";
};

interface Task {
  id: string;
  name: string;
  description: string;
  points: number;
  icon: React.ComponentType<any>;
  color: string;
}

interface CompletedTask {
  id: number;
  taskId: string;
  name: string;
  points: number;
  note?: string;
  completedAt: string;
  weekStartDate: string;
}

interface CustomTask {
  id: number;
  userId: string;
  taskId: string;
  name: string;
  description: string;
  points: number;
  icon: string;
  color: string;
  isActive: boolean;
  createdAt: string;
}

export default function Dashboard() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskNote, setTaskNote] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [editingName, setEditingName] = useState(false);
  const [userName, setUserName] = useState("");
  
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Default tasks
  const defaultTasks: Task[] = [
    {
      id: "job-application",
      name: "Job Application",
      description: "Apply to a new position",
      points: 3,
      icon: Briefcase,
      color: "blue"
    },
    {
      id: "networking",
      name: "Networking",
      description: "Connect with professionals",
      points: 2,
      icon: MessageCircle,
      color: "emerald"
    },
    {
      id: "coding-practice",
      name: "Coding Practice",
      description: "Solve coding challenges",
      points: 2,
      icon: Code,
      color: "purple"
    },
    {
      id: "gym-recovery",
      name: "Gym/Recovery/PT",
      description: "Physical wellness",
      points: 2,
      icon: Heart,
      color: "red"
    }
  ];

  // Helper function to get current week start date (Monday)
  const getWeekStartFixed = (): string => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    return format(weekStart, 'yyyy-MM-dd');
  };

  const currentWeek = selectedWeek || getWeekStartFixed();

  // Helper to calculate week date range
  const getWeekRange = (weekStartDate: string) => {
    const start = new Date(weekStartDate);
    const end = endOfWeek(start, { weekStartsOn: 1 });
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
      display: `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`,
      weekNumber: getISOWeek(start)
    };
  };

  const currentWeekRange = getWeekRange(currentWeek);

  // Fetch progress data for current week
  const { data: progressData, isLoading } = useQuery({
    queryKey: ['/api/progress', currentWeekRange.start, currentWeekRange.end],
    queryFn: async () => {
      const response = await fetch(`/api/progress?start=${currentWeekRange.start}&end=${currentWeekRange.end}`);
      if (!response.ok) {
        throw new Error('Failed to fetch progress data');
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch custom tasks
  const { data: customTasks = [], isLoading: isCustomTasksLoading } = useQuery({
    queryKey: ['/api/custom-tasks'],
    queryFn: async () => {
      const response = await fetch('/api/custom-tasks');
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch AI badges for Recent Badges widget
  const { data: aiBadges = [], isLoading: isBadgesLoading } = useQuery({
    queryKey: ['/api/ai-badges', 'recent'],
    queryFn: async () => {
      const response = await fetch('/api/ai-badges?recent=true');
      if (!response.ok) return [];
      const badges = await response.json();
      return badges
        .filter((badge: any) => badge.unlockedAt)
        .sort((a: any, b: any) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
        .slice(0, 3);
    },
    enabled: !!user,
  });

  // Combine default and custom tasks
  const allTasks: Task[] = [
    ...defaultTasks,
    ...customTasks.map((ct: CustomTask) => ({
      id: `custom-${ct.taskId}`,
      name: ct.name,
      description: ct.description,
      points: ct.points,
      icon: Circle,
      color: ct.color
    }))
  ];

  // Extract data from progress response
  const weeklyGoal = progressData?.goal || 15;
  const totalPoints = progressData?.points || 0;
  const topTasksData = progressData?.topTasks || [];
  const completionsData = progressData?.completions || [];

  // Calculate progress
  const progressPercentage = Math.min((totalPoints / weeklyGoal) * 100, 100);

  // New logarithmic multiplier function matching backend
  const computeMultiplier = (count: number): number => {
    const maxBonus = 0.5;
    const scale = 3;
    const bonus = maxBonus * Math.log1p(count - 1) / Math.log1p(scale);
    return 1 + Math.min(bonus, maxBonus);
  };

  // Get top tasks for focus panel with logarithmic multiplier calculation
  const getTopTasks = () => {
    if (!topTasksData || topTasksData.length === 0) return [];
    
    return topTasksData.slice(0, 4).map((task: any) => {
      // Try multiple ways to find the task
      const taskId = task.taskId || task.id;
      let foundTask = allTasks.find(t => t.id === taskId);
      
      // If not found, try with custom prefix
      if (!foundTask) {
        foundTask = allTasks.find(t => t.id === `custom-${taskId}`);
      }
      
      // If still not found, try without custom prefix
      if (!foundTask && taskId && taskId.startsWith('custom-')) {
        foundTask = allTasks.find(t => t.id === taskId.replace('custom-', ''));
      }
      
      // Calculate what the next completion would be worth using logarithmic curve
      const currentCount = task.count || 1;
      const basePoints = task.basePoints || foundTask?.points || 1;
      const nextMultiplier = computeMultiplier(currentCount + 1); // Next completion multiplier with 1.5x cap
      const nextPoints = Math.round(basePoints * nextMultiplier);
      
      return {
        taskId: taskId,
        taskName: task.name || foundTask?.name || 'Unknown Task',
        totalPoints: task.points || 0, // Total earned this week
        count: currentCount,
        basePoints: basePoints,
        nextMultiplier: nextMultiplier,
        nextPoints: nextPoints,
        task: foundTask
      };
    }).filter((item: any) => item.task || item.taskName !== 'Unknown Task');
  };

  const topTasks = getTopTasks();

  // Initialize user name from email
  useEffect(() => {
    if (user && !userName) {
      const emailName = (user as any)?.email?.split('@')[0] || 'there';
      setUserName(emailName);
    }
  }, [user, userName]);

  // Dynamic greeting based on progress
  const getDynamicGreeting = (): string => {
    if (progressPercentage >= 80) {
      return "you're crushing it this week! 💪";
    } else if (progressPercentage >= 60) {
      return "keep that momentum going! 🚀";
    } else {
      return "let's build some momentum! 🎯";
    }
  };

  // Week navigation functions with ISO week calculation
  const formatWeekDisplay = (weekStart: string) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const weekNumber = getISOWeek(start);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (Week ${weekNumber})`;
  };

  const goToPreviousWeek = () => {
    const current = new Date(currentWeek);
    current.setDate(current.getDate() - 7);
    const newWeek = current.toISOString().split('T')[0];
    setSelectedWeek(newWeek);
    // Invalidate queries for new week
    queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
    queryClient.invalidateQueries({ queryKey: ['/api/ai-badges', 'recent'] });
  };

  const goToNextWeek = () => {
    const current = new Date(currentWeek);
    current.setDate(current.getDate() + 7);
    const newWeek = current.toISOString().split('T')[0];
    setSelectedWeek(newWeek);
    // Invalidate queries for new week
    queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
    queryClient.invalidateQueries({ queryKey: ['/api/ai-badges', 'recent'] });
  };

  const goToCurrentWeek = () => {
    setSelectedWeek("");
    // Invalidate queries for current week
    queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
    queryClient.invalidateQueries({ queryKey: ['/api/ai-badges', 'recent'] });
  };

  const isCurrentWeek = currentWeek === getWeekStartFixed();

  // Task dialog functions
  const openTaskDialog = (task: Task) => {
    setSelectedTask(task);
    setTaskNote("");
    setIsDialogOpen(true);
  };

  // Mutation to create a new completed task
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: { taskId: string; name: string; points: number; note?: string }) => {
      const response = await fetch('/api/completed-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      if (!response.ok) throw new Error('Failed to create task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/completed-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dynamic-goal'] });
      toast({
        title: "Task completed!",
        description: "Great job on staying consistent.",
      });
      setIsDialogOpen(false);
      setSelectedTask(null);
      setTaskNote("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete task",
        variant: "destructive",
      });
    }
  });

  const handleTaskSubmit = () => {
    if (!selectedTask) return;
    
    createTaskMutation.mutate({
      taskId: selectedTask.id,
      name: selectedTask.name,
      points: selectedTask.points,
      note: taskNote.trim() || undefined
    });
  };

  const handleNameSave = () => {
    setEditingName(false);
  };

  if (isAuthLoading || isLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-slate-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 mb-2">
                Hey {editingName ? (
                  <Input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    onBlur={handleNameSave}
                    onKeyPress={(e) => e.key === 'Enter' && handleNameSave()}
                    className="inline-block w-32 text-3xl font-bold"
                    autoFocus
                  />
                ) : (
                  <span onClick={() => setEditingName(true)} className="cursor-pointer hover:text-blue-700">
                    {userName}
                  </span>
                )}, {getDynamicGreeting()}
              </h1>
              <p className="text-blue-800">Stay consistent, build momentum, and achieve your goals.</p>
            </div>

            {/* Week Navigation */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
                className="text-blue-700 border-blue-300 bg-white hover:bg-blue-100"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="text-center px-4">
                <div className="font-semibold text-blue-900">{formatWeekDisplay(currentWeek)}</div>
                {!isCurrentWeek && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={goToCurrentWeek}
                    className="text-xs text-blue-600 p-0 h-auto hover:text-blue-800"
                  >
                    Go to current week
                  </Button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
                className="text-blue-700 border-blue-300 bg-white hover:bg-blue-100"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-blue-800">
              <span>Weekly Progress</span>
              <span>{totalPoints} / {weeklyGoal} points</span>
            </div>
            <Progress value={progressPercentage} className="h-3 bg-blue-200" />
            <p className="text-sm text-blue-700">
              {progressPercentage >= 100 
                ? "🎉 Goal achieved! Keep it up!" 
                : `${weeklyGoal - totalPoints} points to reach your goal`}
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Focus for This Week */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Focus for This Week
                </h2>
                {topTasks.length > 0 ? (
                  <div className="space-y-3">
                    {topTasks.map((topTask: any, index: number) => {
                      const IconComponent = topTask.task?.icon || Target;
                      return (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <IconComponent className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{topTask.taskName}</h3>
                              <p className="text-sm text-gray-600">
                                {topTask.count}x this week • {Math.round(topTask.totalPoints)} pts total
                              </p>
                              <div className="text-xs text-gray-500 mt-1">
                                Next: {topTask.nextMultiplier.toFixed(1)}x multiplier
                              </div>
                            </div>
                          </div>
                          {topTask.task ? (
                            <Button
                              onClick={() => openTaskDialog(topTask.task)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2"
                            >
                              +{topTask.nextPoints} pts
                            </Button>
                          ) : (
                            <div className="text-xs text-gray-500 px-3 py-1 bg-gray-200 rounded">
                              {topTask.totalPoints} pts
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Complete some tasks to see your focus areas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Widgets */}
          <div className="space-y-6">
            {/* Streak & Progress Widget */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Streak & Progress
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Week</span>
                    <span className="font-medium">{totalPoints} pts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Weekly Goal</span>
                    <span className="font-medium">{weeklyGoal} pts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="font-medium text-blue-600">{Math.round(progressPercentage)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Badges Widget */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-500" />
                  Recent Badges
                </h3>
                {!isBadgesLoading && aiBadges.length > 0 ? (
                  <div className="space-y-2">
                    {aiBadges.map((badge: any, index: number) => (
                      <div key={badge.id || index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                        <div className="text-lg">{badge.icon || "🏆"}</div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{badge.name}</p>
                          <p className="text-xs text-gray-600">
                            +{badge.xpReward || 10} XP • {new Date(badge.unlockedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Trophy className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Complete tasks to earn badges</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity Widget */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Recent Activity
                </h3>
                {topTasksData.length > 0 ? (
                  <div className="space-y-2">
                    {topTasksData.slice(0, 3).map((task: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{task.name}</p>
                          <p className="text-xs text-gray-600">{task.count} times</p>
                        </div>
                        <span className="text-sm font-medium text-green-600">+{task.points}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No activity this week</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Task Completion Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Task: {selectedTask?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="note">Add a note (optional)</Label>
                <Input
                  id="note"
                  placeholder="What did you accomplish?"
                  value={taskNote}
                  onChange={(e) => setTaskNote(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleTaskSubmit}
                  disabled={createTaskMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createTaskMutation.isPending ? "Adding..." : `+${selectedTask?.points} pts`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}