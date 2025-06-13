import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  X,
  Search,
  GripVertical,
  Edit,
  Share
} from "lucide-react";

// Helper function to get task category icon
const getTaskCategoryIcon = (taskId: string): string => {
  if (taskId.includes('job') || taskId.includes('application')) return "💼";
  if (taskId.includes('code') || taskId.includes('push') || taskId.includes('dev')) return "💻";
  if (taskId.includes('gym') || taskId.includes('recovery') || taskId.includes('workout')) return "💪";
  if (taskId.includes('learn') || taskId.includes('study') || taskId.includes('course')) return "💡";
  if (taskId.includes('network') || taskId.includes('coffee') || taskId.includes('meeting')) return "🤝";
  if (taskId.includes('sauna') || taskId.includes('ice')) return "🧊";
  if (taskId.includes('journal') || taskId.includes('writing')) return "📝";
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
  microFeedback?: string;
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
  weeklyGoal: number;
  goalAchieved: boolean;
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

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  criteria: string;
  tier?: string;
  xpReward?: number;
  rarity?: string;
  checkUnlocked: (stats: any) => boolean;
}

// Enhanced Task Card Component
function SortableTaskItem({ task, openTaskDialog, getCurrentTaskValue, needsAttention, getTaskStreak, isOnStreak, getStreakEmoji }: {
  task: Task;
  openTaskDialog: (task: Task) => void;
  getCurrentTaskValue: (task: Task) => number;
  needsAttention: (taskId: string) => boolean;
  getTaskStreak: (taskId: string) => number;
  isOnStreak: (taskId: string) => boolean;
  getStreakEmoji: (streak: number) => string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = task.icon;
  const currentValue = getCurrentTaskValue(task);
  const hasAttention = needsAttention(task.id);
  const streak = getTaskStreak(task.id);
  const onStreak = isOnStreak(task.id);
  const streakEmoji = getStreakEmoji(streak);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`focus-card ${isExpanded ? 'focus-card-expanded' : ''} ${onStreak ? 'active' : ''} ${hasAttention ? 'border-red-400 bg-red-50/20' : ''}`}
    >
      {/* Compact View */}
      <div className={`task-card-compact ${isExpanded ? 'hidden' : ''}`}>
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing hover:bg-gray-100 p-1 rounded transition-colors flex-shrink-0"
          style={{ touchAction: 'none' }}
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>

        {/* Task Icon */}
        <div className="task-icon-container">
          <IconComponent className="w-5 h-5" style={{ color: `var(--color-accent)` }} />
        </div>

        {/* Task Info */}
        <div className="flex-1 min-w-0" onClick={toggleExpanded}>
          <div className="flex items-center justify-between">
            <h3 className="card-title text-base mb-0">{task.name}</h3>
            <div className="flex items-center gap-2">
              {streak > 0 && (
                <div className="task-streak-indicator">
                  <Flame className="w-3 h-3" />
                  <span>{streak}</span>
                </div>
              )}
              <div className="task-points-badge">
                +{currentValue}
              </div>
            </div>
          </div>
          <div className="caption text-gray-500 mt-1">
            Today's progress • Click to expand
          </div>
        </div>

        {/* Quick Add Button */}
        <Button 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            openTaskDialog(task);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Add
        </Button>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="task-card-expanded">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="task-icon-container">
                <IconComponent className="w-6 h-6" style={{ color: `var(--color-accent)` }} />
              </div>
              <div>
                <h3 className="card-title text-lg mb-1">{task.name}</h3>
                <p className="body-text text-gray-600">{task.description}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress & Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">+{currentValue}</div>
              <div className="caption">Current Value</div>
              {currentValue > task.points && (
                <div className="caption text-gray-500">Base: {task.points}</div>
              )}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{streak}</div>
              <div className="caption">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">{streakEmoji || "🎯"}</div>
              <div className="caption">Status</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
            
            <Button 
              onClick={() => openTaskDialog(task)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              Complete Task
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MomentumTrackerEnhanced() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskNote, setTaskNote] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState("");
  
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sample tasks for demo
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
    queryFn: () => apiRequest(`/api/completed-tasks?weekStartDate=${currentWeek}`, { on401: "returnNull" }),
    enabled: !!user,
  });

  // Fetch weekly goal
  const { data: goalData, isLoading: isGoalLoading } = useQuery({
    queryKey: ['/api/dynamic-goal', currentWeek],
    queryFn: () => apiRequest(`/api/dynamic-goal/${currentWeek}`, { on401: "returnNull" }),
    enabled: !!user,
  });

  // Calculate progress
  const currentPoints = completedTasks.reduce((sum: number, task: CompletedTask) => sum + task.points, 0);
  const maxPoints = goalData?.goal || 15;
  const progressPercentage = Math.min((currentPoints / maxPoints) * 100, 100);

  // Helper functions
  const getCurrentTaskValue = (task: Task): number => task.points;
  const needsAttention = (taskId: string): boolean => false;
  const getTaskStreak = (taskId: string): number => 0;
  const isOnStreak = (taskId: string): boolean => false;
  const getStreakEmoji = (streak: number): string => "";
  const getCurrentStreak = () => ({ streak: 0, streakIcon: "🎯", streakText: "Getting started" });

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
      setTaskNote("");
      toast({
        title: "Task completed!",
        description: `+${selectedTask?.points} points added to your week.`,
      });
    }
  });

  const addPoints = () => {
    if (!selectedTask) return;
    
    createTaskMutation.mutate({
      taskId: selectedTask.id,
      name: selectedTask.name,
      points: getCurrentTaskValue(selectedTask),
      note: taskNote.trim() || undefined
    });
  };

  const formatWeekDisplay = (weekStart: string) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  if (isLoading || isGoalLoading || isAuthLoading) {
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white z-40 border-b border-slate-200 py-4 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => window.location.href = '/'}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <Target className="h-6 w-6 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">Road2Employment</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {user ? (
                <>
                  <span className="text-sm text-gray-600 hidden sm:block">
                    {(user as any)?.email || 'User'}
                  </span>
                  <Button
                    onClick={() => window.location.href = '/api/logout'}
                    variant="outline"
                    size="sm"
                    className="text-sm"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => window.location.href = '/api/login'}
                  variant="outline"
                  size="sm"
                  className="text-sm"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        <div className="max-w-6xl mx-auto">

          {/* Hero Greeting Area */}
          <div className="hero-greeting mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="hero-title mb-2">
                  👋 Hey {(user as any)?.email?.split('@')[0] || 'there'}, you're {(() => {
                    const streakInfo = getCurrentStreak();
                    return streakInfo.streak > 0 ? `at ${streakInfo.streak}-day streak` : `getting started`;
                  })()}
                </h1>
                <p className="body-text">
                  Add today's tasks to keep your momentum going
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {currentPoints}<span className="text-lg text-gray-500">/{maxPoints}</span>
                </div>
                <div className="caption">Weekly Progress</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress value={progressPercentage} className="h-2" />
              </div>
              <div className="caption">
                {Math.round(progressPercentage)}% complete
              </div>
            </div>
          </div>

          {/* Secondary Navigation */}
          <div className="flex items-center justify-center gap-1 mb-6 bg-white rounded-lg p-1 border max-w-md mx-auto">
            <Button 
              variant="ghost" 
              size="sm"
              className="flex-1 bg-blue-600 text-white"
            >
              Tasks
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex-1"
            >
              Progress
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex-1"
            >
              Badges
            </Button>
          </div>

          {/* Enhanced Dashboard Grid */}
          <div className="dashboard-grid">
            {/* Left Panel - Today's Tasks */}
            <div className="space-y-4">
              <Card className="focus-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="section-title">Today's Tasks</h2>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search tasks..."
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                          className="pl-10 w-36 lg:w-48 h-9"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {defaultTasks.map((task) => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        openTaskDialog={openTaskDialog}
                        getCurrentTaskValue={getCurrentTaskValue}
                        needsAttention={needsAttention}
                        getTaskStreak={getTaskStreak}
                        isOnStreak={isOnStreak}
                        getStreakEmoji={getStreakEmoji}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Middle Panel - Live Streak & Progress Widgets */}
            <div className="space-y-4">
              <Card className="focus-card">
                <CardContent className="p-6">
                  <h3 className="card-title mb-4">Streak & Progress</h3>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-3xl mb-2">🎯</div>
                      <div className="text-2xl font-bold text-orange-600">0</div>
                      <div className="caption">Day Streak</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{currentPoints}</div>
                      <div className="caption">Points This Week</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="focus-card">
                <CardContent className="p-6">
                  <h3 className="card-title mb-4">Recent Badges</h3>
                  <div className="text-center py-4">
                    <div className="text-4xl mb-2">🏆</div>
                    <div className="caption">Complete tasks to earn badges</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Recent Activity Log */}
            <div className="space-y-4">
              <Card className="focus-card">
                <CardContent className="p-6">
                  <h3 className="card-title mb-4">Recent Activity</h3>
                  {completedTasks && completedTasks.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {completedTasks.slice(0, 10).map((task: CompletedTask) => (
                        <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            <span className="text-lg">{getTaskCategoryIcon(task.taskId)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{task.name}</div>
                            <div className="caption text-gray-500">
                              +{task.points} points • {new Date(task.completedAt).toLocaleDateString()}
                            </div>
                            {task.note && (
                              <div className="caption text-gray-600 mt-1 italic">"{task.note}"</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-4xl mb-2">📝</div>
                      <div className="caption">No activities yet this week</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Task Completion Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task: {selectedTask?.name}</DialogTitle>
            <DialogDescription>
              Add details about your progress (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="note">Note (optional)</Label>
              <Input
                id="note"
                value={taskNote}
                onChange={(e) => setTaskNote(e.target.value)}
                placeholder="What did you accomplish?"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addPoints} disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending ? 'Adding...' : `Complete Task (+${selectedTask ? getCurrentTaskValue(selectedTask) : 0} pts)`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}