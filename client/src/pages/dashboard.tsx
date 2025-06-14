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
  Circle
} from "lucide-react";

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

  // Helper function to get current week start date
  const getWeekStartFixed = (): string => {
    const now = new Date();
    const utcDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const dayOfWeek = utcDate.getDay();
    const daysBack = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(utcDate);
    weekStart.setDate(utcDate.getDate() - daysBack);
    return weekStart.toISOString().split('T')[0];
  };

  const currentWeek = selectedWeek || getWeekStartFixed();

  // Fetch completed tasks
  const { data: completedTasks = [], isLoading } = useQuery({
    queryKey: ['/api/completed-tasks', currentWeek],
    queryFn: async () => {
      const response = await fetch(`/api/completed-tasks?weekStartDate=${currentWeek}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch weekly goal
  const { data: goalData, isLoading: isGoalLoading } = useQuery({
    queryKey: ['/api/dynamic-goal', currentWeek],
    queryFn: async () => {
      const response = await fetch(`/api/dynamic-goal/${currentWeek}`);
      if (!response.ok) return { goal: 15 };
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

  // Calculate task frequency and multipliers for focus panel
  const getTopTasks = () => {
    if (!Array.isArray(completedTasks)) return [];
    
    const taskFrequency = completedTasks.reduce((acc: Record<string, { count: number; totalPoints: number; taskName: string; lastCompleted: string }>, task: CompletedTask) => {
      if (!acc[task.taskId]) {
        acc[task.taskId] = {
          count: 0,
          totalPoints: 0,
          taskName: task.name,
          lastCompleted: task.completedAt
        };
      }
      acc[task.taskId].count += 1;
      acc[task.taskId].totalPoints += task.points;
      if (new Date(task.completedAt) > new Date(acc[task.taskId].lastCompleted)) {
        acc[task.taskId].lastCompleted = task.completedAt;
      }
      return acc;
    }, {});

    const sortedTasks = Object.entries(taskFrequency)
      .map(([taskId, data]) => ({
        taskId,
        ...data,
        multiplier: Math.min(1 + (data.count - 1) * 0.5, 2.5),
        task: allTasks.find(t => t.id === taskId || t.id === `custom-${taskId}`)
      }))
      .filter(item => item.task)
      .sort((a, b) => b.multiplier - a.multiplier || b.count - a.count)
      .slice(0, 4);

    return sortedTasks;
  };

  const topTasks = getTopTasks();

  // Calculate progress
  const currentPoints = Array.isArray(completedTasks) ? completedTasks.reduce((sum: number, task: CompletedTask) => sum + task.points, 0) : 0;
  const maxPoints = goalData?.goal || 15;
  const progressPercentage = Math.min((currentPoints / maxPoints) * 100, 100);

  // Initialize user name from email
  useEffect(() => {
    if (user && !userName) {
      const emailName = (user as any)?.email?.split('@')[0] || 'there';
      setUserName(emailName);
    }
  }, [user, userName]);

  // Calculate day streak
  const calculateDayStreak = (): number => {
    if (!Array.isArray(completedTasks) || completedTasks.length === 0) return 0;
    
    const tasksByDate = completedTasks.reduce((acc: Record<string, CompletedTask[]>, task: CompletedTask) => {
      const date = new Date(task.completedAt).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(task);
      return acc;
    }, {});
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toDateString();
      
      if (tasksByDate[dateString] && tasksByDate[dateString].length > 0) {
        streak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Dynamic greeting based on progress
  const getDynamicGreeting = (): string => {
    const streak = calculateDayStreak();
    if (streak >= 7) {
      return `you're on a ${streak}-day streak! 🔥`;
    } else if (streak >= 3) {
      return `${streak}-day streak going strong! ⚡`;
    } else if (progressPercentage >= 80) {
      return "you're crushing it this week! 💪";
    } else if (progressPercentage >= 60) {
      return "keep that momentum going! 🚀";
    } else {
      return "let's build some momentum! 🎯";
    }
  };

  // Week navigation functions
  const formatWeekDisplay = (weekStart: string) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const goToPreviousWeek = () => {
    const current = new Date(currentWeek);
    current.setDate(current.getDate() - 7);
    setSelectedWeek(current.toISOString().split('T')[0]);
  };

  const goToNextWeek = () => {
    const current = new Date(currentWeek);
    current.setDate(current.getDate() + 7);
    const today = new Date();
    const nextWeek = new Date(current);
    
    if (nextWeek <= today) {
      setSelectedWeek(current.toISOString().split('T')[0]);
    }
  };

  const goToCurrentWeek = () => {
    setSelectedWeek("");
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
      queryClient.invalidateQueries({ queryKey: ['/api/completed-tasks'] });
      setIsDialogOpen(false);
      setSelectedTask(null);
      setTaskNote("");
      toast({
        title: "Task completed!",
        description: "Great job! Keep building that momentum.",
      });
    }
  });

  const addPoints = () => {
    if (!selectedTask) return;
    
    createTaskMutation.mutate({
      taskId: selectedTask.id,
      name: selectedTask.name,
      points: selectedTask.points,
      note: taskNote.trim() || undefined
    });
  };

  if (isLoading || isGoalLoading || isAuthLoading) {
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
      <div className="space-y-8">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                👋 Hey {editingName ? (
                  <Input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    onBlur={() => setEditingName(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setEditingName(false);
                      }
                    }}
                    className="inline-block w-auto min-w-[100px] mx-2 px-2 py-1 text-2xl font-bold bg-transparent border-b-2 border-white text-white"
                    autoFocus
                    onFocus={(e) => e.target.select()}
                  />
                ) : (
                  <span 
                    onClick={() => setEditingName(true)}
                    className="cursor-pointer hover:text-blue-200 transition-colors inline-block mx-1"
                    title="Click to edit name"
                  >
                    {userName}
                  </span>
                )}, {getDynamicGreeting()}
              </h1>
              <p className="text-blue-100">
                {isCurrentWeek ? "Keep building momentum today" : `Viewing week: ${formatWeekDisplay(currentWeek)}`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold mb-1">
                {currentPoints}<span className="text-lg text-blue-200">/{maxPoints}</span>
              </div>
              <div className="text-sm text-blue-100">Weekly Progress</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={progressPercentage} className="h-2 bg-blue-800" />
            </div>
            <div className="text-sm text-blue-100">
              {Math.round(progressPercentage)}% complete
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
                className="text-blue-600 border-white bg-white hover:bg-blue-50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="text-center">
                <div className="font-medium text-sm">{formatWeekDisplay(currentWeek)}</div>
                {!isCurrentWeek && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={goToCurrentWeek}
                    className="text-xs text-blue-200 p-0 h-auto"
                  >
                    Go to current week
                  </Button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
                disabled={isCurrentWeek}
                className="text-blue-600 border-white bg-white hover:bg-blue-50 disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Focus for This Week Panel */}
        {topTasks.length > 0 && (
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-blue-800">Focus for This Week</h2>
                </div>
                <div className="text-sm text-blue-600 font-medium">
                  Top momentum builders
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topTasks.map((topTask) => {
                  const task = topTask.task!;
                  const IconComponent = task.icon;
                  return (
                    <div 
                      key={task.id}
                      className="flex items-center gap-4 p-4 bg-white rounded-lg border border-blue-100 hover:border-blue-200 transition-all hover:shadow-sm"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-blue-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{task.name}</h3>
                          <div className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                            ×{topTask.multiplier.toFixed(1)}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{topTask.count} times</span>
                          <span>•</span>
                          <span>{topTask.totalPoints} points</span>
                        </div>
                      </div>

                      <Button 
                        size="sm" 
                        onClick={() => openTaskDialog(task)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 shadow-sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compact Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Streak & Progress Widget */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Streak & Progress
              </h3>
              <div className="space-y-4">
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-3xl mb-2">🔥</div>
                  <div className="text-2xl font-bold text-orange-600">{calculateDayStreak()}</div>
                  <div className="text-sm text-gray-600">Day Streak</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{currentPoints}</div>
                  <div className="text-sm text-gray-600">Points This Week</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Badges Widget */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-500" />
                Recent Badges
              </h3>
              <div className="space-y-3">
                {completedTasks.length >= 1 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-lg">🎯</span>
                    <span className="font-medium text-green-600">Getting Started</span>
                  </div>
                )}
                {currentPoints >= 10 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-lg">📆</span>
                    <span className="font-medium text-green-600">Consistency Champ</span>
                  </div>
                )}
                {calculateDayStreak() >= 3 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-lg">🔥</span>
                    <span className="font-medium text-green-600">Streak Starter</span>
                  </div>
                )}
                <Button variant="link" className="text-xs p-0 h-auto text-blue-600">
                  View All Badges →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Widget */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              {Array.isArray(completedTasks) && completedTasks.length > 0 ? (
                <div className="space-y-3">
                  {completedTasks
                    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                    .slice(0, 3)
                    .map((task: CompletedTask) => (
                    <div 
                      key={task.id} 
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      title="Click to view details"
                    >
                      <div className="flex-shrink-0">
                        <span className="text-lg">{getTaskCategoryIcon(task.taskId)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{task.name}</div>
                        <div className="text-xs text-gray-500">
                          +{task.points} points • {new Date(task.completedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="link" className="text-xs p-0 h-auto text-blue-600">
                    View All Activity →
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">📝</div>
                  <div className="text-sm text-gray-500">No activities yet</div>
                </div>
              )}
            </CardContent>
          </Card>
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
                  value={taskNote}
                  onChange={(e) => setTaskNote(e.target.value)}
                  placeholder="What did you accomplish?"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addPoints} disabled={createTaskMutation.isPending}>
                  {createTaskMutation.isPending ? "Adding..." : `Add ${selectedTask?.points} Points`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}