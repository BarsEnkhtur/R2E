import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/config";
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
  Share,
  Edit2
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
  if (taskId.includes('casing') || taskId.includes('prep')) return "📊";
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

// Default badges
const badges: Badge[] = [
  {
    id: "first-task",
    name: "Getting Started",
    icon: "🎯",
    description: "Complete your first task",
    criteria: "Complete 1 task",
    checkUnlocked: (stats) => stats.totalTasks >= 1
  },
  {
    id: "streak-starter",
    name: "Streak Starter",
    icon: "🔥",
    description: "Complete at least 1 task per day for 7 consecutive days",
    criteria: "7-day streak",
    checkUnlocked: (stats) => stats.longestStreak >= 7
  },
  {
    id: "consistency-champ",
    name: "Consistency Champ",
    icon: "📆",
    description: "Earn 10 or more points in a single week",
    criteria: "≥10 points per week",
    checkUnlocked: (stats) => stats.bestWeekPoints >= 10
  }
];

// Sortable Task Item Component
function SortableTaskItem({ 
  task, 
  openTaskDialog, 
  getCurrentTaskValue, 
  getTaskStreak,
  isExpanded,
  setIsExpanded 
}: {
  task: Task;
  openTaskDialog: (task: Task) => void;
  getCurrentTaskValue: (task: Task) => number;
  getTaskStreak: (taskId: string) => number;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}) {
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
  const streak = getTaskStreak(task.id);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all ${isExpanded ? 'ring-2 ring-blue-200' : ''}`}
    >
      {/* Compact View */}
      <div className={`${isExpanded ? 'hidden' : ''}`}>
        <div className="flex items-center justify-between">
          {/* Drag Handle */}
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab active:cursor-grabbing hover:bg-gray-100 p-1 rounded transition-colors flex-shrink-0 mr-3"
            style={{ touchAction: 'none' }}
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>

          {/* Task Icon */}
          <div className="flex items-center gap-3 flex-1" onClick={toggleExpanded}>
            <IconComponent className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-base">{task.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>🔥 {streak}</span>
                <span>+{currentValue} pts</span>
              </div>
            </div>
          </div>

          {/* Quick Add Button */}
          <Button 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              openTaskDialog(task);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add
          </Button>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <IconComponent className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold">{task.name}</h3>
                <p className="text-gray-600">{task.description}</p>
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
          <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">+{currentValue}</div>
              <div className="text-xs text-gray-500">Current Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{streak}</div>
              <div className="text-xs text-gray-500">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">🎯</div>
              <div className="text-xs text-gray-500">Status</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Task
            </Button>
            
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

export default function MomentumTracker() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskNote, setTaskNote] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState("");
  const [taskOrder, setTaskOrder] = useState<string[]>([]);
  const [showWeeklyStats, setShowWeeklyStats] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [editingUserName, setEditingUserName] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState("");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize display name from user data
  useEffect(() => {
    if (user && !userDisplayName) {
      const defaultName = (user as any)?.email?.split('@')[0] || 'there';
      setUserDisplayName(defaultName);
    }
  }, [user, userDisplayName]);

  // Get the current week or selected week
  const getWeekStartFixed = () => {
    const today = new Date();
    const day = today.getDay() || 7; // Sunday = 7
    today.setDate(today.getDate() - day + 1); // Set to Monday
    return today.toISOString().split('T')[0];
  };

  const currentWeek = selectedWeek || getWeekStartFixed();

  // Default tasks
  const tasks: Task[] = [
    { id: "job-application", name: "Job Application", description: "Apply for a job position", points: 3, icon: Briefcase, color: "blue" },
    { id: "networking", name: "Networking", description: "Connect with professionals", points: 2, icon: Coffee, color: "green" },
    { id: "code-push", name: "Code Push", description: "Push code to repository", points: 2, icon: Code, color: "purple" },
    { id: "learn-skill", name: "Learn New Skill", description: "Study or practice a new skill", points: 2, icon: Lightbulb, color: "orange" },
    { id: "gym-recovery", name: "Gym/Recovery/PT", description: "Physical activity or recovery", points: 6, icon: Heart, color: "red" },
    { id: "sauna-ice", name: "Sauna/Ice Bath", description: "Heat or cold therapy", points: 1, icon: Zap, color: "blue" },
    { id: "journal", name: "Journal/Reflection", description: "Write thoughts and reflections", points: 1.5, icon: PenTool, color: "indigo" },
    { id: "casing-prep", name: "Casing prep", description: "Prepare for case interviews", points: 2, icon: FileText, color: "yellow" }
  ];

  // Queries
  const { data: completedTasks = [], isLoading } = useQuery({
    queryKey: ['/api/completed-tasks', currentWeek],
    queryFn: () => fetch(apiUrl(`/api/completed-tasks?week=${currentWeek}`)).then(res => res.json())
  });

  const { data: dynamicGoalData, isLoading: isGoalLoading } = useQuery({
    queryKey: ['/api/dynamic-goal', currentWeek],
    queryFn: () => fetch(apiUrl(`/api/dynamic-goal/${currentWeek}`)).then(res => res.json())
  });

  const { data: taskStats = [] } = useQuery({
    queryKey: ['/api/task-stats', currentWeek],
    queryFn: () => fetch(apiUrl(`/api/task-stats?week=${currentWeek}`)).then(res => res.json())
  });

  // Calculate current points
  const currentPoints = Array.isArray(completedTasks) ? completedTasks.reduce((sum: number, task: CompletedTask) => sum + task.points, 0) : 0;
  const maxPoints = dynamicGoalData?.goal || 15;
  const progressPercentage = maxPoints > 0 ? Math.min((currentPoints / maxPoints) * 100, 100) : 0;

  // Get current task value
  const getCurrentTaskValue = (task: Task): number => {
    const stats = taskStats.find((stat: TaskStats) => stat.taskId === task.id);
    return stats?.currentValue || task.points;
  };

  // Get task streak
  const getTaskStreak = (taskId: string): number => {
    const stats = taskStats.find((stat: TaskStats) => stat.taskId === taskId);
    return stats?.timesThisWeek || 0;
  };

  // Open task dialog
  const openTaskDialog = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await fetch(apiUrl('/api/completed-tasks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      if (!response.ok) throw new Error('Failed to create task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/completed-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/task-stats'] });
      setIsDialogOpen(false);
      setSelectedTask(null);
      setTaskNote("");
    }
  });

  // Drag and drop handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = taskOrder.indexOf(active.id as string);
      const newIndex = taskOrder.indexOf(over.id as string);
      setTaskOrder(arrayMove(taskOrder, oldIndex, newIndex));
    }
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

  const isCurrentWeek = currentWeek === getWeekStartFixed();

  // Get unlocked badges
  const getUnlockedBadges = () => {
    const stats = {
      totalTasks: completedTasks.length,
      longestStreak: Math.max(...taskStats.map((stat: TaskStats) => stat.timesThisWeek), 0),
      bestWeekPoints: currentPoints
    };
    return badges.filter(badge => badge.checkUnlocked(stats));
  };

  // Show loading state if essential data is still loading
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
    <div className="min-h-screen">
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
              {user && (
                <>
                  <span className="text-sm text-gray-600 hidden sm:block">
                    {(user as any)?.email || (user as any)?.id || 'User'}
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
              )}
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-xl lg:text-3xl font-bold mb-4">Stay Hungry</h1>
            
            {/* Week Navigation */}
            <div className="flex items-center justify-center gap-2 lg:gap-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('prev')}
                className="hover:bg-slate-50 hover:shadow-sm transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="text-center min-w-[160px] lg:min-w-[200px]">
                <div className="text-sm lg:text-lg font-semibold">{formatWeekDisplay(currentWeek)}</div>
                {!isCurrentWeek && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={goToCurrentWeek}
                    className="text-blue-600 text-xs lg:text-sm hover:text-blue-700 hover:underline transition-all"
                  >
                    Go to current week
                  </Button>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('next')}
                className="hover:bg-slate-50 hover:shadow-sm transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Weekly Stats and Share Buttons */}
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => setShowWeeklyStats(true)}
                variant="outline"
                size="sm"
                className="hover:bg-blue-50 hover:border-blue-300 transition-all text-xs lg:text-sm"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Weekly Stats
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(`Check out my progress: ${currentPoints}/${maxPoints} points this week!`);
                  toast({ title: "Copied to clipboard!" });
                }}
                variant="outline"
                size="sm"
                className="hover:bg-green-50 hover:border-green-300 transition-all text-xs lg:text-sm"
              >
                <Share className="w-4 h-4 mr-2" />
                Share Progress
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        <div className="max-w-6xl mx-auto">

          {/* Hero Greeting Area */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl lg:text-3xl font-bold">
                    👋 Hey {editingUserName ? (
                      <span className="inline-flex items-center gap-2">
                        <Input
                          value={userDisplayName}
                          onChange={(e) => setUserDisplayName(e.target.value)}
                          onBlur={() => setEditingUserName(false)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') setEditingUserName(false);
                          }}
                          className="inline-block w-32 h-8 text-2xl lg:text-3xl font-bold border-b-2 border-blue-500 bg-transparent"
                          autoFocus
                        />
                      </span>
                    ) : (
                      <span 
                        className="cursor-pointer hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                        onClick={() => setEditingUserName(true)}
                        title="Click to edit name"
                      >
                        {userDisplayName}
                        <Edit2 className="w-4 h-4 opacity-50" />
                      </span>
                    )}, you're getting started
                  </h1>
                </div>
                <p className="text-gray-600">
                  {isCurrentWeek ? 
                    "Add today's tasks to keep your momentum going" : 
                    `Viewing week of ${formatWeekDisplay(currentWeek)}`
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {currentPoints}<span className="text-lg text-gray-500">/{maxPoints}</span>
                </div>
                <div className="text-sm text-gray-500">Weekly Progress</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress value={progressPercentage} className="h-2" />
              </div>
              <div className="text-sm text-gray-500">
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
              onClick={() => setShowWeeklyStats(true)}
            >
              Progress
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex-1"
              onClick={() => setShowAchievements(true)}
            >
              Badges
            </Button>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Today's Tasks */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Today's Tasks</h2>
                    <Button
                      onClick={() => setShowWeeklyStats(true)}
                      size="sm"
                      variant="outline"
                      className="text-blue-600"
                    >
                      Show All Tasks
                    </Button>
                  </div>
                  
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={tasks.map(task => task.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {tasks.map((task) => (
                          <SortableTaskItem
                            key={task.id}
                            task={task}
                            openTaskDialog={openTaskDialog}
                            getCurrentTaskValue={getCurrentTaskValue}
                            getTaskStreak={getTaskStreak}
                            isExpanded={expandedTasks.has(task.id)}
                            setIsExpanded={(expanded) => {
                              const newExpanded = new Set(expandedTasks);
                              if (expanded) {
                                newExpanded.add(task.id);
                              } else {
                                newExpanded.delete(task.id);
                              }
                              setExpandedTasks(newExpanded);
                            }}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </CardContent>
              </Card>
            </div>

            {/* Middle Panel - Streak & Progress */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Streak & Progress</h3>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-3xl mb-2">🔥</div>
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.max(...taskStats.map((stat: TaskStats) => stat.timesThisWeek), 0)}
                      </div>
                      <div className="text-sm text-gray-500">Day Streak</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{currentPoints}</div>
                      <div className="text-sm text-gray-500">Points This Week</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Badges</h3>
                  {(() => {
                    const unlockedBadges = getUnlockedBadges();
                    
                    if (unlockedBadges.length === 0) {
                      return (
                        <div className="text-center py-4">
                          <div className="text-4xl mb-2">🏆</div>
                          <div className="text-sm text-gray-500">Complete tasks to earn badges</div>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-3">
                        {unlockedBadges.slice(-3).map(badge => (
                          <div key={badge.id} className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center bg-yellow-50 border-2 border-yellow-200 rounded-full">
                              <span className="text-sm">{badge.icon}</span>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{badge.name}</div>
                              <div className="text-xs text-gray-500">{badge.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Recent Activity */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  {completedTasks && completedTasks.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {completedTasks.slice(0, 10).map((task: CompletedTask) => (
                        <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            <span className="text-lg">{getTaskCategoryIcon(task.taskId)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{task.name}</div>
                            <div className="text-xs text-gray-500">
                              +{task.points} points • {new Date(task.completedAt).toLocaleDateString()}
                            </div>
                            {task.note && (
                              <div className="text-xs text-gray-600 mt-1 italic">"{task.note}"</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-4xl mb-2">📝</div>
                      <div className="text-sm text-gray-500">No activities yet this week</div>
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
              <Button onClick={() => {
                if (selectedTask) {
                  createTaskMutation.mutate({
                    taskId: selectedTask.id,
                    name: selectedTask.name,
                    points: getCurrentTaskValue(selectedTask),
                    note: taskNote.trim() || undefined
                  });
                }
              }}>
                Complete Task (+{selectedTask ? getCurrentTaskValue(selectedTask) : 0} pts)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Weekly Stats Modal */}
      <Dialog open={showWeeklyStats} onOpenChange={setShowWeeklyStats}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Weekly Summary</DialogTitle>
            <DialogDescription>
              Your progress for the week of {formatWeekDisplay(currentWeek)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{currentPoints}</div>
                <div className="text-sm text-blue-800">Total Points</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
                <div className="text-sm text-green-800">Tasks Completed</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{new Set(completedTasks.map((t: CompletedTask) => t.taskId)).size}</div>
                <div className="text-sm text-purple-800">Unique Tasks</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{Math.round(progressPercentage)}%</div>
                <div className="text-sm text-orange-800">Goal Progress</div>
              </div>
            </div>
            
            <div className="text-center">
              <Button onClick={() => setShowWeeklyStats(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Achievements Modal */}
      <Dialog open={showAchievements} onOpenChange={setShowAchievements}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Achievements
            </DialogTitle>
            <DialogDescription>
              Track your progress and unlock badges as you complete tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {(() => {
              const unlockedBadges = getUnlockedBadges();
              
              if (unlockedBadges.length === 0) {
                return (
                  <div className="text-center p-8">
                    <div className="text-6xl mb-4">🏆</div>
                    <h3 className="text-lg font-semibold mb-2">Complete Tasks to Earn Badges</h3>
                    <p className="text-gray-600">
                      Keep completing tasks to unlock achievements and track your progress. 
                      Your first badge will appear here once you build momentum!
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{completedTasks.length}</div>
                        <div className="text-xs text-blue-800">Tasks Completed</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{currentPoints}</div>
                        <div className="text-xs text-green-800">Total Points</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{new Set(completedTasks.map((t: CompletedTask) => t.taskId)).size}</div>
                        <div className="text-xs text-purple-800">Unique Tasks</div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  <h3 className="font-semibold">Unlocked Badges ({unlockedBadges.length})</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {unlockedBadges.map(badge => (
                      <div key={badge.id} className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="w-10 h-10 flex items-center justify-center bg-yellow-100 border-2 border-yellow-300 rounded-full">
                          <span className="text-lg">{badge.icon}</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{badge.name}</div>
                          <div className="text-sm text-gray-600">{badge.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
            
            <div className="text-center">
              <Button onClick={() => setShowAchievements(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}