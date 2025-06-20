import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageCircle, 
  Code, 
  FileText, 
  DollarSign, 
  Heart, 
  PenTool, 
  Lightbulb, 
  Monitor, 
  MessageSquare, 
  Zap,
  Star,
  CheckCircle2,
  RotateCcw,
  ClipboardList,
  Trash2,
  StickyNote,
  Plus,
  TrendingUp,
  Flame,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BarChart3,
  Settings,
  Circle,
  Coffee,
  Briefcase,
  BookOpen,
  Target,
  Music,
  Camera,
  Gamepad2,
  Palette,
  X
} from "lucide-react";

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

interface TaskStats {
  id: number;
  taskId: string;
  taskName: string;
  basePoints: number;
  currentValue: number;
  timesThisWeek: number;
  lastCompleted: string | null;
  weekStartDate: string;
}

interface WeeklyHistory {
  id: number;
  weekStartDate: string;
  totalPoints: number;
  tasksCompleted: number;
  createdAt: string;
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

const tasks: Task[] = [
  {
    id: "networking",
    name: "Networking DM/email",
    description: "Build professional connections",
    points: 2,
    icon: MessageCircle,
    color: "blue"
  },
  {
    id: "code-push",
    name: "App code push",
    description: "Commit and deploy changes",
    points: 3,
    icon: Code,
    color: "emerald"
  },
  {
    id: "job-application",
    name: "Job application",
    description: "Apply to new opportunities",
    points: 2,
    icon: FileText,
    color: "purple"
  },
  {
    id: "work-freelance",
    name: "Work shift/freelance $",
    description: "Earn money through work",
    points: 2,
    icon: DollarSign,
    color: "yellow"
  },
  {
    id: "gym-recovery",
    name: "Gym/Recovery/PT",
    description: "Physical health and fitness",
    points: 1,
    icon: Heart,
    color: "red"
  },
  {
    id: "journal",
    name: "Journal/Reflection",
    description: "Mental health and clarity",
    points: 1,
    icon: PenTool,
    color: "indigo"
  },
  {
    id: "learn-skill",
    name: "Learned new skill",
    description: "Expand knowledge and abilities",
    points: 2,
    icon: Lightbulb,
    color: "green"
  },
  {
    id: "casing-prep",
    name: "Casing prep",
    description: "Practice case studies and frameworks",
    points: 2,
    icon: Monitor,
    color: "orange"
  },
  {
    id: "behavioral-prep",
    name: "Behavioral prep",
    description: "Practice soft skills interviews",
    points: 2,
    icon: MessageSquare,
    color: "pink"
  },
  {
    id: "sauna-ice",
    name: "Sauna/Ice bath session",
    description: "Recovery and wellness",
    points: 1,
    icon: Zap,
    color: "cyan"
  }
];

const colorClasses = {
  blue: "bg-blue-100 text-blue-600",
  emerald: "bg-emerald-100 text-emerald-600",
  purple: "bg-purple-100 text-purple-600",
  yellow: "bg-yellow-100 text-yellow-600",
  red: "bg-red-100 text-red-600",
  indigo: "bg-indigo-100 text-indigo-600",
  green: "bg-green-100 text-green-600",
  orange: "bg-orange-100 text-orange-600",
  pink: "bg-pink-100 text-pink-600",
  cyan: "bg-cyan-100 text-cyan-600"
};

const pointsColorClasses = {
  blue: "text-blue-600",
  emerald: "text-emerald-600",
  purple: "text-purple-600",
  yellow: "text-yellow-600",
  red: "text-red-600",
  indigo: "text-indigo-600",
  green: "text-green-600",
  orange: "text-orange-600",
  pink: "text-pink-600",
  cyan: "text-cyan-600"
};

export default function MomentumTracker() {
  const [showAchievement, setShowAchievement] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskNote, setTaskNote] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [showCustomTaskForm, setShowCustomTaskForm] = useState(false);
  const [customTaskForm, setCustomTaskForm] = useState({
    name: "",
    description: "",
    points: 1,
    icon: "Circle",
    color: "blue"
  });
  
  const queryClient = useQueryClient();

  // Helper function to get current week start date (Monday) using UTC
  const getWeekStartFixed = (): string => {
    const now = new Date();
    // Use UTC to match server timezone
    const utcDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const dayOfWeek = utcDate.getDay(); // 0=Sunday, 1=Monday, etc.
    
    // Calculate days to go back to Monday
    const daysBack = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const weekStart = new Date(utcDate);
    weekStart.setDate(utcDate.getDate() - daysBack);
    return weekStart.toISOString().split('T')[0];
  };

  const currentWeek = selectedWeek || getWeekStartFixed();

  // Fetch completed tasks from database
  const { data: completedTasks = [], isLoading } = useQuery({
    queryKey: ['/api/completed-tasks', currentWeek],
    queryFn: async (): Promise<CompletedTask[]> => {
      console.log('Fetching tasks for week:', currentWeek);
      const response = await fetch(`/api/completed-tasks?week=${currentWeek}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      console.log('Received tasks:', data);
      return data;
    }
  });

  // Fetch task stats for current week
  const { data: taskStats = [] } = useQuery({
    queryKey: ['/api/task-stats', currentWeek],
    queryFn: async (): Promise<TaskStats[]> => {
      const response = await fetch(`/api/task-stats?week=${currentWeek}`);
      if (!response.ok) throw new Error('Failed to fetch task stats');
      return await response.json();
    }
  });

  // Fetch weekly history
  const { data: weeklyHistory = [] } = useQuery({
    queryKey: ['/api/weekly-history'],
    queryFn: async (): Promise<WeeklyHistory[]> => {
      const response = await fetch('/api/weekly-history');
      if (!response.ok) throw new Error('Failed to fetch weekly history');
      return await response.json();
    }
  });

  // Fetch dynamic goal for current week
  const { data: dynamicGoalData, isLoading: isGoalLoading } = useQuery({
    queryKey: ['/api/dynamic-goal', currentWeek],
    queryFn: async (): Promise<{ goal: number }> => {
      const response = await fetch(`/api/dynamic-goal/${currentWeek}`);
      if (!response.ok) throw new Error('Failed to fetch dynamic goal');
      return await response.json();
    }
  });

  // Fetch custom tasks
  const { data: customTasks = [] } = useQuery({
    queryKey: ['/api/custom-tasks'],
    queryFn: async (): Promise<CustomTask[]> => {
      const response = await fetch('/api/custom-tasks');
      if (!response.ok) throw new Error('Failed to fetch custom tasks');
      return await response.json();
    }
  });

  // Calculate points and progress with proper fallbacks
  const currentPoints = Array.isArray(completedTasks) ? completedTasks.reduce((sum, task) => sum + task.points, 0) : 0;
  const maxPoints = dynamicGoalData?.goal || 15;
  const progressPercentage = maxPoints > 0 ? Math.min((currentPoints / maxPoints) * 100, 100) : 0;

  // Helper function to get task stats for a specific task
  const getTaskStats = (taskId: string): TaskStats | undefined => {
    return Array.isArray(taskStats) ? taskStats.find(stat => stat.taskId === taskId) : undefined;
  };

  // Helper function to check if task needs attention (4+ days since last completion)
  const needsAttention = (taskId: string): boolean => {
    const stats = getTaskStats(taskId);
    if (!stats || !stats.lastCompleted) return false;
    
    const lastCompleted = new Date(stats.lastCompleted);
    const daysSince = (Date.now() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= 4;
  };

  // Helper function to calculate current task value with compounding
  const getCurrentTaskValue = (task: Task): number => {
    const stats = getTaskStats(task.id);
    if (!stats) return task.points;
    
    // Add neglect bonus if needed
    const neglectBonus = needsAttention(task.id) ? 1 : 0;
    return stats.currentValue + neglectBonus;
  };

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
      // Always navigate to current week after adding a task
      const actualCurrentWeek = getWeekStartFixed();
      setSelectedWeek("");
      
      // Force refetch by removing all cached data
      queryClient.removeQueries();
      
      // Show achievement if goal reached - use safe fallback for maxPoints
      const currentMaxPoints = dynamicGoalData?.goal || 15;
      const newPoints = currentPoints + (selectedTask ? getCurrentTaskValue(selectedTask) : 0);
      if (newPoints >= currentMaxPoints) {
        setTimeout(() => {
          setShowAchievement(true);
        }, 500);
      }
    }
  });

  // Show loading state if essential data is still loading
  if (isLoading || isGoalLoading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-slate-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Loading momentum tracker...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Momentum Tracker</h1>
          <div className="text-lg mb-6">
            <span className="text-2xl font-bold text-blue-600">{currentPoints}</span>
            <span className="text-slate-600"> / {maxPoints} points</span>
          </div>
          <Progress value={progressPercentage} className="w-full max-w-md mx-auto h-4 mb-4" />
          <p className="text-slate-600">{Math.round(progressPercentage)}% complete</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Tasks</h2>
              <div className="space-y-3">
                {tasks.map((task) => {
                  const IconComponent = task.icon;
                  const currentValue = getCurrentTaskValue(task);
                  const hasAttention = needsAttention(task.id);
                  
                  return (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${colorClasses[task.color as keyof typeof colorClasses]}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium">{task.name}</h3>
                          <p className="text-sm text-slate-600">{task.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${hasAttention ? 'text-red-600' : pointsColorClasses[task.color as keyof typeof pointsColorClasses]}`}>
                          +{currentValue}
                        </span>
                        <Button 
                          size="sm" 
                          onClick={() => openTaskDialog(task)}
                          className="ml-2"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">This Week's Progress</h2>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <div>
                      <span className="font-medium">{task.name}</span>
                      {task.note && <p className="text-sm text-slate-600">{task.note}</p>}
                    </div>
                    <span className="font-semibold text-blue-600">+{task.points}</span>
                  </div>
                ))}
                {completedTasks.length === 0 && (
                  <p className="text-slate-500 text-center py-4">No tasks completed yet this week</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Task: {selectedTask?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="note">Note (optional)</Label>
                <Input
                  id="note"
                  value={taskNote}
                  onChange={(e) => setTaskNote(e.target.value)}
                  placeholder="Add details about what you accomplished..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (selectedTask) {
                      createTaskMutation.mutate({
                        taskId: selectedTask.id,
                        name: selectedTask.name,
                        points: getCurrentTaskValue(selectedTask),
                        note: taskNote.trim() || undefined
                      });
                      setIsDialogOpen(false);
                      setSelectedTask(null);
                      setTaskNote("");
                    }
                  }}
                  disabled={createTaskMutation.isPending}
                >
                  {createTaskMutation.isPending ? "Adding..." : "Complete Task"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Achievement Modal */}
        {showAchievement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-2">Week Complete!</h2>
              <p className="text-slate-600 mb-6">
                You've reached your {maxPoints} point goal for this week!
              </p>
              <Button onClick={() => setShowAchievement(false)}>
                Continue
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}