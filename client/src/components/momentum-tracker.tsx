import { useState } from "react";
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

  // Helper function to get current week start date
  const getCurrentWeekStart = (): string => {
    const d = new Date();
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    return d.toISOString().split('T')[0];
  };

  const currentWeek = selectedWeek || getCurrentWeekStart();

  // Debug logging
  console.log('Current selectedWeek:', selectedWeek);
  console.log('getCurrentWeekStart():', getCurrentWeekStart());
  console.log('Final currentWeek:', currentWeek);

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
      const actualCurrentWeek = getCurrentWeekStart();
      setSelectedWeek("");
      
      // Force refetch by removing all cached data
      queryClient.removeQueries();
      
      // Show achievement if goal reached
      const currentMaxPoints = dynamicGoalData?.goal || 15;
      const newPoints = currentPoints + (selectedTask ? getCurrentTaskValue(selectedTask) : 0);
      if (newPoints >= currentMaxPoints) {
        setTimeout(() => {
          setShowAchievement(true);
        }, 500);
      }
    }
  });

  // Mutation to delete a completed task
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await fetch(`/api/completed-tasks/${taskId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete task');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/completed-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/task-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dynamic-goal'] });
      setShowAchievement(false);
    }
  });

  // Mutation to clear all tasks
  const clearAllTasksMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/completed-tasks', {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to clear tasks');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/completed-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/task-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dynamic-goal'] });
      setShowAchievement(false);
    }
  });

  // Mutation to create custom task
  const createCustomTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await fetch('/api/custom-tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to create custom task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-tasks'] });
      setShowCustomTaskForm(false);
      setCustomTaskForm({
        name: "",
        description: "",
        points: 1,
        icon: "Circle",
        color: "blue"
      });
    }
  });

  const addPoints = (task: Task, note?: string) => {
    createTaskMutation.mutate({
      taskId: task.id,
      name: task.name,
      points: task.points,
      note: note || undefined
    });
  };

  const handleTaskSubmit = () => {
    if (selectedTask) {
      addPoints(selectedTask, taskNote.trim() || undefined);
      setIsDialogOpen(false);
      setSelectedTask(null);
      setTaskNote("");
    }
  };

  const deleteCompletedTask = (taskId: number) => {
    deleteTaskMutation.mutate(taskId);
  };

  const resetWeek = () => {
    if (window.confirm('Are you sure you want to reset this week? This will clear all progress.')) {
      clearAllTasksMutation.mutate();
    }
  };

  const closeAchievement = () => {
    setShowAchievement(false);
  };

  // Helper functions for week navigation
  const formatWeekDisplay = (weekStart: string): string => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const current = new Date(currentWeek);
    const newDate = new Date(current);
    newDate.setDate(current.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newDate.toISOString().split('T')[0]);
  };

  const goToCurrentWeek = () => {
    setSelectedWeek("");
  };

  // Available icons for custom tasks
  const availableIcons = [
    { name: "Circle", component: Circle },
    { name: "Coffee", component: Coffee },
    { name: "Briefcase", component: Briefcase },
    { name: "BookOpen", component: BookOpen },
    { name: "Target", component: Target },
    { name: "Music", component: Music },
    { name: "Camera", component: Camera },
    { name: "Gamepad2", component: Gamepad2 },
    { name: "Palette", component: Palette },
    { name: "Heart", component: Heart },
    { name: "Code", component: Code },
    { name: "MessageCircle", component: MessageCircle },
    { name: "Lightbulb", component: Lightbulb },
    { name: "Monitor", component: Monitor },
  ];

  // Handle custom task form submission
  const handleCustomTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTaskForm.name.trim() || !customTaskForm.description.trim()) return;

    const taskId = customTaskForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    createCustomTaskMutation.mutate({
      taskId,
      name: customTaskForm.name,
      description: customTaskForm.description,
      points: customTaskForm.points,
      icon: customTaskForm.icon,
      color: customTaskForm.color,
      isActive: true
    });
  };

  // Convert custom tasks to Task format
  const convertCustomTasksToTasks = (customTasks: CustomTask[]): Task[] => {
    return customTasks.map(ct => {
      const iconComponent = availableIcons.find(icon => icon.name === ct.icon)?.component || Circle;
      return {
        id: ct.taskId,
        name: ct.name,
        description: ct.description,
        points: ct.points,
        icon: iconComponent,
        color: ct.color
      };
    });
  };

  // Combine default tasks with custom tasks
  const allTasks = [...tasks, ...convertCustomTasksToTasks(Array.isArray(customTasks) ? customTasks : [])];

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
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            Road2Employment
          </h1>
          <p className="text-slate-600">Build momentum with consistent daily actions</p>
          
          {/* Week Navigation */}
          <div className="flex items-center justify-center space-x-4 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
              className="flex items-center space-x-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>
            
            <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="font-medium text-slate-800">
                {formatWeekDisplay(currentWeek)}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
              className="flex items-center space-x-1"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
            
            {selectedWeek && (
              <Button
                variant="ghost"
                size="sm"
                onClick={goToCurrentWeek}
                className="text-blue-600 hover:text-blue-700"
              >
                Current Week
              </Button>
            )}
          </div>
        </div>

        {/* Progress Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <h2 className="text-xl font-semibold text-slate-800">Weekly Progress</h2>
                {dynamicGoalData && dynamicGoalData.goal !== 15 && (
                  <div className="flex items-center space-x-2 mt-1">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-slate-600">
                      Adaptive goal: {dynamicGoalData.goal} points
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-blue-600">{currentPoints}</span>
                <span className="text-slate-500">/</span>
                <span className="text-2xl font-bold text-slate-400">{maxPoints}</span>
                <span className="text-sm text-slate-500 ml-1">points</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <Progress 
                value={progressPercentage} 
                className="h-4 bg-slate-200"
              />
            </div>
            
            {/* Progress Stats and Compounding Info */}
            <div className="flex justify-between items-center text-sm text-slate-600">
              <div className="flex items-center space-x-4">
                <span>Started: <span className="font-medium">This Week</span></span>
                {Array.isArray(taskStats) && taskStats.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">
                      {taskStats.filter(s => s.timesThisWeek > 1).length} compounding
                    </span>
                  </div>
                )}
              </div>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Tasks Section */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Momentum Tasks</h2>
              
              <div className="space-y-3">
                {allTasks.map((task) => {
                  const IconComponent = task.icon;
                  return (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[task.color as keyof typeof colorClasses]}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-slate-800">{task.name}</p>
                            {needsAttention(task.id) && (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                <Flame className="w-3 h-3" />
                                <span>Needs attention</span>
                              </div>
                            )}
                            {getTaskStats(task.id) && getTaskStats(task.id)!.timesThisWeek > 1 && (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                <TrendingUp className="w-3 h-3" />
                                <span>{getTaskStats(task.id)!.timesThisWeek}x</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">{task.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${pointsColorClasses[task.color as keyof typeof pointsColorClasses]}`}>
                            +{getCurrentTaskValue(task)}
                          </div>
                          {getTaskStats(task.id) && getCurrentTaskValue(task) !== task.points && (
                            <div className="text-xs text-slate-400">
                              base: {task.points}
                            </div>
                          )}
                        </div>
                        <Button 
                          onClick={() => addPoints(task)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button 
                          onClick={() => openTaskDialog(task)}
                          variant="outline"
                          size="sm"
                          className="border-slate-300 hover:bg-slate-50"
                        >
                          <StickyNote className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                
                {/* Add Custom Task Button */}
                <div className="pt-4 border-t border-slate-200">
                  <Button
                    onClick={() => setShowCustomTaskForm(true)}
                    variant="outline"
                    className="w-full flex items-center space-x-2 py-6 border-dashed border-slate-300 hover:border-slate-400"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Custom Task</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Tasks Log */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-800">Completed This Week</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetWeek}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset Week
                </Button>
              </div>
              
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-8 text-slate-400">
                    <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full mx-auto mb-3"></div>
                    <p className="text-sm">Loading tasks...</p>
                  </div>
                ) : completedTasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No tasks completed yet</p>
                    <p className="text-xs mt-1">Start building momentum!</p>
                  </div>
                ) : (
                  completedTasks.map((task) => (
                    <div 
                      key={task.id}
                      className="animate-fade-in flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-emerald-800">{task.name}</p>
                          <div className="flex items-center space-x-2 text-xs text-emerald-600">
                            <span>{new Date(task.completedAt).toLocaleDateString([], {
                              weekday: 'short',
                              month: 'short', 
                              day: 'numeric'
                            })}</span>
                            <span>•</span>
                            <span>{new Date(task.completedAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}</span>
                          </div>
                          {task.note && (
                            <div className="flex items-center space-x-1 mt-1">
                              <StickyNote className="w-3 h-3 text-emerald-500" />
                              <p className="text-xs text-emerald-700 italic truncate">{task.note}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-emerald-700 font-semibold text-sm">+{task.points}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCompletedTask(task.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                          title="Delete task"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Summary Section */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{completedTasks.length}</p>
                    <p className="text-sm text-slate-500">Tasks Done</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{currentPoints}</p>
                    <p className="text-sm text-slate-500">Total Points</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Note Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Task with Note</DialogTitle>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[selectedTask.color as keyof typeof colorClasses]}`}>
                    <selectedTask.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{selectedTask.name}</p>
                    <p className="text-sm text-slate-500">+{selectedTask.points} points</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-note">Add a note (optional)</Label>
                  <Input
                    id="task-note"
                    placeholder="e.g., Sent email to John from LinkedIn"
                    value={taskNote}
                    onChange={(e) => setTaskNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTaskSubmit()}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleTaskSubmit}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Add Task
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Achievement Badge */}
        {showAchievement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4 animate-bounce-subtle">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-yellow-600 fill-current" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Week Complete!</h3>
              <p className="text-slate-600 mb-4">You've reached your 15-point goal. Amazing momentum!</p>
              <Button 
                onClick={closeAchievement}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Custom Task Creation Dialog */}
        <Dialog open={showCustomTaskForm} onOpenChange={setShowCustomTaskForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Custom Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCustomTaskSubmit} className="space-y-4">
              <div>
                <Label htmlFor="taskName">Task Name</Label>
                <Input
                  id="taskName"
                  value={customTaskForm.name}
                  onChange={(e) => setCustomTaskForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Read 30 minutes"
                  required
                />
              </div>
              <div>
                <Label htmlFor="taskDescription">Description</Label>
                <Input
                  id="taskDescription"
                  value={customTaskForm.description}
                  onChange={(e) => setCustomTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Daily reading habit for personal growth"
                  required
                />
              </div>
              <div>
                <Label htmlFor="taskPoints">Points (1-5)</Label>
                <Input
                  id="taskPoints"
                  type="number"
                  min="1"
                  max="5"
                  value={customTaskForm.points}
                  onChange={(e) => setCustomTaskForm(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                  required
                />
              </div>
              <div>
                <Label>Icon</Label>
                <div className="grid grid-cols-7 gap-2 mt-2">
                  {availableIcons.map((icon) => {
                    const IconComponent = icon.component;
                    return (
                      <Button
                        key={icon.name}
                        type="button"
                        variant={customTaskForm.icon === icon.name ? "default" : "outline"}
                        size="sm"
                        className="h-10 w-10 p-0"
                        onClick={() => setCustomTaskForm(prev => ({ ...prev, icon: icon.name }))}
                      >
                        <IconComponent className="w-4 h-4" />
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label>Color</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {Object.keys(colorClasses).map((color) => (
                    <Button
                      key={color}
                      type="button"
                      variant={customTaskForm.color === color ? "default" : "outline"}
                      size="sm"
                      className="capitalize"
                      onClick={() => setCustomTaskForm(prev => ({ ...prev, color }))}
                    >
                      <div className={`w-4 h-4 rounded-full mr-2 ${colorClasses[color as keyof typeof colorClasses]}`}></div>
                      {color}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex space-x-2 pt-4">
                <Button 
                  type="submit"
                  className="flex-1"
                  disabled={createCustomTaskMutation.isPending}
                >
                  {createCustomTaskMutation.isPending ? "Creating..." : "Create Task"}
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setShowCustomTaskForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
