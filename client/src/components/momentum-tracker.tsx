import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
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

// Available icons for custom tasks
const availableIcons = [
  { name: "Circle", component: Circle },
  { name: "Heart", component: Heart },
  { name: "Star", component: Star },
  { name: "Coffee", component: Coffee },
  { name: "Briefcase", component: Briefcase },
  { name: "BookOpen", component: BookOpen },
  { name: "Target", component: Target },
  { name: "Music", component: Music },
  { name: "Camera", component: Camera },
  { name: "Gamepad2", component: Gamepad2 },
  { name: "Palette", component: Palette },
  { name: "Code", component: Code },
  { name: "MessageCircle", component: MessageCircle },
  { name: "Lightbulb", component: Lightbulb },
  { name: "Zap", component: Zap }
];

// Badge definitions
interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  criteria: string;
  checkUnlocked: (stats: any) => boolean;
}

const badges: Badge[] = [
  {
    id: "first-step",
    name: "First Step",
    icon: "🏁",
    description: "Complete your very first task",
    criteria: "Complete 1 task",
    checkUnlocked: (stats) => stats.totalTasks >= 1
  },
  {
    id: "3-day-streak",
    name: "3-Day Streak",
    icon: "🔥",
    description: "Complete at least 1 task per day for 3 days in a row",
    criteria: "3-day streak",
    checkUnlocked: (stats) => stats.longestStreak >= 3
  },
  {
    id: "7-day-streak",
    name: "7-Day Streak",
    icon: "🔥🔥",
    description: "Complete at least 1 task per day for 7 consecutive days",
    criteria: "7-day streak",
    checkUnlocked: (stats) => stats.longestStreak >= 7
  },
  {
    id: "momentum-master",
    name: "Momentum Master",
    icon: "🚀",
    description: "Hit a 3× multiplier on any task at least once",
    criteria: "3× multiplier",
    checkUnlocked: (stats) => stats.highestMultiplier >= 3
  },
  {
    id: "consistency-champ",
    name: "Consistency Champ",
    icon: "📆",
    description: "Earn 10 or more points in a single week",
    criteria: "≥10 points per week",
    checkUnlocked: (stats) => stats.bestWeekPoints >= 10
  },
  {
    id: "monthly-hustler",
    name: "Monthly Hustler",
    icon: "💼",
    description: "Earn 40 or more points in a calendar month",
    criteria: "≥40 points per month",
    checkUnlocked: (stats) => stats.bestMonthPoints >= 40
  },
  {
    id: "first-10-tasks",
    name: "First 10 Tasks",
    icon: "🎯",
    description: "Complete 10 total tasks",
    criteria: "Complete 10 tasks",
    checkUnlocked: (stats) => stats.totalTasks >= 10
  },
  {
    id: "task-titan",
    name: "Task Titan",
    icon: "🏆",
    description: "Complete 50 total tasks",
    criteria: "Complete 50 tasks",
    checkUnlocked: (stats) => stats.totalTasks >= 50
  },
  {
    id: "networker",
    name: "Networker",
    icon: "💬",
    description: "Log 10 networking tasks",
    criteria: "10 networking tasks",
    checkUnlocked: (stats) => (stats.taskCounts['networking'] || 0) >= 10
  },
  {
    id: "code-committer",
    name: "Code Committer",
    icon: "💻",
    description: "Push code 10 times",
    criteria: "10 code pushes",
    checkUnlocked: (stats) => (stats.taskCounts['code-push'] || 0) >= 10
  },
  {
    id: "job-seeker",
    name: "Job Seeker",
    icon: "📝",
    description: "Submit 5 job applications",
    criteria: "5 job applications",
    checkUnlocked: (stats) => (stats.taskCounts['job-application'] || 0) >= 5
  },
  {
    id: "wellness-warrior",
    name: "Wellness Warrior",
    icon: "🧘",
    description: "Complete 7 gym/recovery tasks",
    criteria: "7 wellness tasks",
    checkUnlocked: (stats) => (stats.taskCounts['gym-recovery'] || 0) >= 7
  },
  {
    id: "reflection-guru",
    name: "Reflection Guru",
    icon: "📔",
    description: "Log 10 journal/reflection entries",
    criteria: "10 journal entries",
    checkUnlocked: (stats) => (stats.taskCounts['journal'] || 0) >= 10
  },
  {
    id: "on-fire",
    name: "On Fire!",
    icon: "🔥🔥🔥",
    description: "Maintain a 5-day streak without missing a day",
    criteria: "5-day streak",
    checkUnlocked: (stats) => stats.longestStreak >= 5
  },
  {
    id: "power-hour",
    name: "Power Hour",
    icon: "⏱️",
    description: "Complete 3 tasks in under 1 hour",
    criteria: "3 tasks in 1 hour",
    checkUnlocked: (stats) => stats.powerHour >= 1
  }
];

// Sortable Task Item Component
function SortableTaskItem({ task, openTaskDialog, getCurrentTaskValue, needsAttention, getTaskStreak, isOnStreak, getStreakEmoji, openTaskForm }: {
  task: Task;
  openTaskDialog: (task: Task) => void;
  getCurrentTaskValue: (task: Task) => number;
  needsAttention: (taskId: string) => boolean;
  getTaskStreak: (taskId: string) => number;
  isOnStreak: (taskId: string) => boolean;
  getStreakEmoji: (streak: number) => string;
  openTaskForm: (task?: Task) => void;
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
  const hasAttention = needsAttention(task.id);
  const streak = getTaskStreak(task.id);
  const onStreak = isOnStreak(task.id);
  const streakEmoji = getStreakEmoji(streak);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex flex-col p-3 border rounded-lg hover:bg-slate-50 hover:shadow-sm transition-all h-full bg-[#F9FAFB] ${onStreak ? 'border-l-4 border-l-blue-400 bg-blue-50/30' : ''} ${hasAttention ? 'border-l-4 border-l-red-400 bg-red-50/30' : ''}`}
    >
      <div className="flex items-start gap-3 mb-2">
        <div 
          {...attributes} 
          {...listeners}
          className="p-1 rounded cursor-grab active:cursor-grabbing hover:bg-slate-200 transition-colors flex-shrink-0"
        >
          <GripVertical className="w-4 h-4 text-slate-400" />
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[task.color as keyof typeof colorClasses]} flex-shrink-0`}>
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm">{task.name}</h3>
            {streakEmoji && <span className="text-lg">{streakEmoji}</span>}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2 flex-wrap">
          {streak > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {streak}x
            </span>
          )}
          {hasAttention && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
              ⚠️
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className={`font-bold ${hasAttention ? 'text-red-600' : onStreak ? 'text-blue-600' : pointsColorClasses[task.color as keyof typeof pointsColorClasses]}`}>
              +{currentValue}
            </span>
            {currentValue > task.points && (
              <div className="text-xs text-slate-500">
                base: {task.points}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              onClick={() => openTaskDialog(task)}
              className="h-8 hover:bg-blue-600 hover:shadow-sm transition-all"
            >
              Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openTaskForm(task)}
              className="h-8 opacity-60 hover:opacity-100 text-slate-500 hover:text-slate-700"
              title="Edit task"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MomentumTracker() {
  const [showAchievement, setShowAchievement] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskNote, setTaskNote] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [showCustomTaskForm, setShowCustomTaskForm] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
  const [searchFilter, setSearchFilter] = useState("");
  const [taskOrder, setTaskOrder] = useState<string[]>([]);
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [editNoteValue, setEditNoteValue] = useState("");
  const [showWeeklyStats, setShowWeeklyStats] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showShareSnapshot, setShowShareSnapshot] = useState(false);
  const [customTaskForm, setCustomTaskForm] = useState({
    id: "",
    name: "",
    description: "",
    points: 1,
    icon: "Circle",
    color: "blue"
  });
  
  const queryClient = useQueryClient();

  // Set up drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize task order on first load
  React.useEffect(() => {
    if (taskOrder.length === 0) {
      setTaskOrder(tasks.map(task => task.id));
    }
  }, [taskOrder.length]);

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setTaskOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over?.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Convert custom tasks to Task format
  const convertCustomTasksToTasks = (customTasks: CustomTask[]): Task[] => {
    return customTasks.filter(ct => ct.isActive).map(ct => {
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

  // Combine default tasks with custom tasks (after customTasks is defined)
  const allTasks = [...tasks, ...convertCustomTasksToTasks(Array.isArray(customTasks) ? customTasks : [])];

  // Filter and sort tasks based on search and custom order
  const getFilteredAndSortedTasks = () => {
    let filteredTasks = allTasks;
    
    // Apply search filter
    if (searchFilter.trim()) {
      const searchTerm = searchFilter.toLowerCase().trim();
      filteredTasks = allTasks.filter(task => 
        task.name.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by custom order, then by original order for new tasks
    return filteredTasks.sort((a, b) => {
      const aIndex = taskOrder.indexOf(a.id);
      const bIndex = taskOrder.indexOf(b.id);
      
      // If both tasks are in the custom order, use that order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // If only one task is in custom order, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // If neither is in custom order, maintain original order
      return 0;
    });
  };

  // Helper functions for task management
  const openTaskForm = (task?: Task) => {
    if (task) {
      // Editing existing task - find the custom task
      const customTask = customTasks.find(ct => ct.taskId === task.id);
      if (customTask) {
        setEditingTask(task);
        setCustomTaskForm({
          id: customTask.id.toString(),
          name: task.name,
          description: task.description,
          points: task.points,
          icon: availableIcons.find(icon => icon.component === task.icon)?.name || "Circle",
          color: task.color
        });
      }
    } else {
      // Creating new task
      setEditingTask(null);
      setCustomTaskForm({
        id: "",
        name: "",
        description: "",
        points: 1,
        icon: "Circle",
        color: "blue"
      });
    }
    setShowTaskForm(true);
  };

  const handleTaskFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTaskForm.name.trim() || !customTaskForm.description.trim()) return;

    if (editingTask && customTaskForm.id) {
      // Update existing task
      updateCustomTaskMutation.mutate({
        id: parseInt(customTaskForm.id),
        updates: {
          name: customTaskForm.name,
          description: customTaskForm.description,
          points: customTaskForm.points,
          icon: customTaskForm.icon,
          color: customTaskForm.color
        }
      });
    } else {
      // Create new task
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
    }
  };

  // Inline note editing functions
  const startEditingNote = (task: CompletedTask) => {
    setEditingNote(task.id);
    setEditNoteValue(task.note || "");
  };

  const saveNoteEdit = () => {
    if (editingNote !== null) {
      updateTaskNoteMutation.mutate({
        id: editingNote,
        note: editNoteValue.trim()
      });
    }
  };

  const cancelNoteEdit = () => {
    setEditingNote(null);
    setEditNoteValue("");
  };

  // Weekly stats calculation
  const calculateWeeklyStats = () => {
    const thisWeekTasks = completedTasks.filter(task => task.weekStartDate === currentWeek);
    const totalPoints = thisWeekTasks.reduce((sum, task) => sum + task.points, 0);
    const uniqueTaskTypes = new Set(thisWeekTasks.map(task => task.taskId)).size;
    const streaks = Array.from(new Set(thisWeekTasks.map(task => task.taskId)))
      .map(taskId => getTaskStreak(taskId))
      .filter(streak => streak >= 3).length;

    return {
      totalPoints,
      tasksCompleted: thisWeekTasks.length,
      uniqueTaskTypes,
      newStreaks: streaks
    };
  };

  // Calculate comprehensive user statistics for badge tracking
  const calculateUserStats = () => {
    // Get all completed tasks across all weeks
    const allWeeks = weeklyHistory || [];
    const allCompletedTasks = completedTasks || [];
    
    // Calculate total tasks
    const totalTasks = allCompletedTasks.length;
    
    // Calculate task counts by type
    const taskCounts: Record<string, number> = {};
    allCompletedTasks.forEach(task => {
      taskCounts[task.taskId] = (taskCounts[task.taskId] || 0) + 1;
    });
    
    // Calculate best week and month points
    const bestWeekPoints = Math.max(...allWeeks.map(week => week.totalPoints), currentPoints);
    const bestMonthPoints = allWeeks.reduce((max, week) => Math.max(max, week.totalPoints), currentPoints);
    
    // Calculate highest multiplier
    const highestMultiplier = Math.max(...taskStats.map(stat => stat.currentValue / stat.basePoints), 1);
    
    // Calculate actual date-based streak
    const longestStreak = calculateDateBasedStreak();
    
    // Power hour calculation (tasks completed within 1 hour)
    const powerHour = calculatePowerHour();
    
    return {
      totalTasks,
      taskCounts,
      bestWeekPoints,
      bestMonthPoints,
      highestMultiplier,
      longestStreak,
      powerHour
    };
  };

  // Calculate date-based streak
  const calculateDateBasedStreak = () => {
    if (!completedTasks || completedTasks.length === 0) return 0;
    
    // Group tasks by date
    const tasksByDate: Record<string, number> = {};
    completedTasks.forEach(task => {
      const dateKey = new Date(task.completedAt).toDateString();
      tasksByDate[dateKey] = (tasksByDate[dateKey] || 0) + 1;
    });
    
    // Sort dates in descending order
    const sortedDates = Object.keys(tasksByDate).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
    
    if (sortedDates.length === 0) return 0;
    
    let currentStreak = 0;
    let longestStreak = 0;
    let previousDate = new Date(sortedDates[0]);
    
    for (const dateStr of sortedDates) {
      const currentDate = new Date(dateStr);
      const daysDiff = Math.floor((previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        // Same day, continue streak
        currentStreak = Math.max(currentStreak, 1);
      } else if (daysDiff === 1) {
        // Consecutive day, extend streak
        currentStreak++;
      } else {
        // Gap in dates, reset streak
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
      
      previousDate = currentDate;
    }
    
    return Math.max(longestStreak, currentStreak);
  };

  // Calculate power hour achievements (3 tasks within 1 hour)
  const calculatePowerHour = () => {
    if (!completedTasks || completedTasks.length < 3) return 0;
    
    const sortedTasks = [...completedTasks].sort((a, b) => 
      new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    );
    
    let powerHours = 0;
    
    for (let i = 0; i <= sortedTasks.length - 3; i++) {
      const firstTask = new Date(sortedTasks[i].completedAt);
      const thirdTask = new Date(sortedTasks[i + 2].completedAt);
      const timeDiff = thirdTask.getTime() - firstTask.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      if (hoursDiff <= 1) {
        powerHours++;
      }
    }
    
    return powerHours;
  };

  // Generate shareable snapshot text
  const generateSnapshot = () => {
    const stats = calculateWeeklyStats();
    const userStats = calculateUserStats();
    const unlockedBadges = getUnlockedBadges();
    const streakInfo = getCurrentStreak();
    const weekDisplay = formatWeekDisplay(currentWeek);
    
    const topTasks = completedTasks
      .sort((a, b) => b.points - a.points)
      .slice(0, 3)
      .map(task => `• ${task.name} (+${task.points} pts)`)
      .join('\n');
    
    const badgesList = unlockedBadges.length > 0 
      ? unlockedBadges.slice(-3).map(badge => `${badge.icon} ${badge.name}`).join(' ')
      : 'Working toward first achievements';
    
    return `🚀 Road2Employment - Week of ${weekDisplay}

📊 This Week's Progress:
• ${stats.totalPoints}/${maxPoints} points (${Math.round(progressPercentage)}%)
• ${stats.tasksCompleted} tasks completed
• ${stats.uniqueTaskTypes} different task types
${streakInfo.streak > 0 ? `• ${streakInfo.streakIcon} ${streakInfo.streakText}` : ''}

🏆 Top Completed Tasks:
${topTasks || '• No tasks completed this week'}

🎯 Recent Achievements:
${badgesList}

💪 Total Stats:
• ${userStats.totalTasks} total tasks completed
• ${userStats.longestStreak} day longest streak
• ${userStats.bestWeekPoints} points best week

Keep the momentum going! 💼

#Road2Employment #ProductivityTracker #CareerGrowth`;
  };

  // Copy snapshot to clipboard
  const copySnapshot = async () => {
    try {
      await navigator.clipboard.writeText(generateSnapshot());
      // Could add a toast notification here
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = generateSnapshot();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  // Share via Web Share API or fallback to copy
  const shareSnapshot = async () => {
    const snapshotText = generateSnapshot();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Road2Employment - Weekly Progress',
          text: snapshotText,
        });
      } catch (err) {
        await copySnapshot();
      }
    } else {
      await copySnapshot();
    }
  };

  // Get unlocked badges
  const getUnlockedBadges = () => {
    const stats = calculateUserStats();
    return badges.filter(badge => badge.checkUnlocked(stats));
  };

  // Get current streak info
  const getCurrentStreak = () => {
    const stats = calculateUserStats();
    const streak = stats.longestStreak;
    let streakIcon = "";
    let streakText = "";
    
    if (streak >= 5) {
      streakIcon = "🔥🔥🔥";
      streakText = `${streak}-day streak`;
    } else if (streak >= 3) {
      streakIcon = "🔥🔥";
      streakText = `${streak}-day streak`;
    } else if (streak >= 1) {
      streakIcon = "🔥";
      streakText = `${streak}-day streak`;
    }
    
    return { streakIcon, streakText, streak };
  };

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

  // Helper function to calculate streak for a task
  const getTaskStreak = (taskId: string): number => {
    const stats = getTaskStats(taskId);
    return stats?.timesThisWeek || 0;
  };

  // Helper function to check if task is on a streak (3+ completions this week)
  const isOnStreak = (taskId: string): boolean => {
    return getTaskStreak(taskId) >= 3;
  };

  // Helper function to get streak emoji
  const getStreakEmoji = (streak: number): string => {
    if (streak >= 5) return "🔥";
    if (streak >= 3) return "⚡";
    return "";
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

  // Mutation to update a completed task's note
  const updateTaskNoteMutation = useMutation({
    mutationFn: async ({ id, note }: { id: number; note: string }) => {
      const response = await fetch(`/api/completed-tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      });
      if (!response.ok) throw new Error('Failed to update task note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/completed-tasks'] });
      setEditingNote(null);
      setEditNoteValue("");
    }
  });

  // Mutation to create custom task
  const createCustomTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await fetch('/api/custom-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      if (!response.ok) throw new Error('Failed to create custom task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-tasks'] });
      setShowTaskForm(false);
      setEditingTask(null);
      setCustomTaskForm({
        id: "",
        name: "",
        description: "",
        points: 1,
        icon: "Circle",
        color: "blue"
      });
    }
  });

  // Mutation to update custom task
  const updateCustomTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<CustomTask> }) => {
      const response = await fetch(`/api/custom-tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update custom task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-tasks'] });
      setShowTaskForm(false);
      setEditingTask(null);
      setCustomTaskForm({
        id: "",
        name: "",
        description: "",
        points: 1,
        icon: "Circle",
        color: "blue"
      });
    }
  });

  // Mutation to delete custom task
  const deleteCustomTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await fetch(`/api/custom-tasks/${taskId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete custom task');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-tasks'] });
    }
  });

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

  const toggleNoteExpansion = (taskId: number) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedNotes(newExpanded);
  };

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
    <div className="min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white z-40 border-b border-slate-200 py-4 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl lg:text-4xl font-bold mb-4">Road2Employment</h1>
            
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
                onClick={() => setShowShareSnapshot(true)}
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

          {/* Compact Progress Module */}
          <div className="flex items-center justify-center gap-4 mb-4 max-w-2xl mx-auto">
            <div className="text-lg font-bold text-blue-600">
              {currentPoints} / {maxPoints}
            </div>
            <div className="flex-1">
              <Progress value={progressPercentage} className="h-3" />
            </div>
            <div className="text-sm text-slate-600 whitespace-nowrap">
              {Math.round(progressPercentage)}%
            </div>
          </div>

          {/* Streak and Badge Widget */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 max-w-2xl mx-auto">
            {(() => {
              const streakInfo = getCurrentStreak();
              const unlockedBadges = getUnlockedBadges();
              const topBadges = unlockedBadges.slice(-3); // Show latest 3 badges
              
              return (
                <>
                  {/* Streak Display */}
                  {streakInfo.streak > 0 && (
                    <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-full border border-orange-200">
                      <span className="text-lg">{streakInfo.streakIcon}</span>
                      <span className="text-sm font-medium text-orange-800">{streakInfo.streakText}</span>
                    </div>
                  )}
                  
                  {/* Top Badges Preview */}
                  {topBadges.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Latest:</span>
                      <TooltipProvider>
                        <div className="flex gap-1">
                          {topBadges.map(badge => (
                            <Tooltip key={badge.id}>
                              <TooltipTrigger asChild>
                                <div className="w-8 h-8 flex items-center justify-center bg-yellow-50 border border-yellow-200 rounded-full cursor-pointer hover:bg-yellow-100 transition-colors">
                                  <span className="text-sm">{badge.icon}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-center">
                                  <div className="font-medium">{badge.name}</div>
                                  <div className="text-xs text-slate-500 mt-1">{badge.description}</div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </TooltipProvider>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setShowAchievements(true)}
                        className="text-blue-600 hover:text-blue-700 p-0 h-auto text-sm"
                      >
                        View all
                      </Button>
                    </div>
                  )}
                  
                  {/* Achievements Button if no badges yet */}
                  {topBadges.length === 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAchievements(true)}
                      className="text-slate-600 hover:text-slate-700"
                    >
                      <Star className="w-4 h-4 mr-1" />
                      View Achievements
                    </Button>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Tasks</h2>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => openTaskForm()}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Task
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search tasks..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="pl-10 w-36 lg:w-48 h-9"
                    />
                  </div>
                </div>
              </div>
              
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={getFilteredAndSortedTasks().map(task => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {getFilteredAndSortedTasks().map((task) => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        openTaskDialog={openTaskDialog}
                        getCurrentTaskValue={getCurrentTaskValue}
                        needsAttention={needsAttention}
                        getTaskStreak={getTaskStreak}
                        isOnStreak={isOnStreak}
                        getStreakEmoji={getStreakEmoji}
                        openTaskForm={openTaskForm}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              
              {getFilteredAndSortedTasks().length === 0 && searchFilter.trim() && (
                <div className="text-center py-8 text-slate-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No tasks found matching "{searchFilter}"</p>
                  <p className="text-sm mt-1">Try searching for task names or descriptions</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">This Week's Progress</h2>
              <div className="space-y-2">
                {completedTasks
                  .sort((a, b) => b.points - a.points) // Sort by highest points first
                  .map((task) => (
                  <div key={task.id} className="flex items-start justify-between p-3 bg-[#F9FAFB] rounded-lg hover:bg-slate-50 hover:shadow-sm transition-all border border-slate-200">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{task.name}</span>
                        <span className="font-bold text-blue-600">+{task.points}</span>
                      </div>
                      
                      {task.note && editingNote !== task.id && (
                        <p 
                          className="task-note text-sm text-slate-700 italic mb-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5 transition-colors"
                          onClick={() => startEditingNote(task)}
                          title="Click to edit note"
                        >
                          "{task.note}"
                        </p>
                      )}
                      
                      {!task.note && editingNote !== task.id && (
                        <p 
                          className="text-sm text-slate-400 italic mb-2 cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5 transition-colors"
                          onClick={() => startEditingNote(task)}
                          title="Click to add note"
                        >
                          Add note...
                        </p>
                      )}
                      
                      {editingNote === task.id && (
                        <div className="mb-2 flex gap-2">
                          <Input
                            value={editNoteValue}
                            onChange={(e) => setEditNoteValue(e.target.value)}
                            placeholder="Add a note..."
                            className="text-sm"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') saveNoteEdit();
                              if (e.key === 'Escape') cancelNoteEdit();
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={saveNoteEdit}
                            disabled={updateTaskNoteMutation.isPending}
                            className="h-8"
                          >
                            {updateTaskNoteMutation.isPending ? "..." : "Save"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelNoteEdit}
                            className="h-8"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                      
                      <p className="text-xs text-slate-400">
                        {new Date(task.completedAt).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex items-start ml-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTaskMutation.mutate(task.id)}
                        disabled={deleteTaskMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:shadow-sm transition-all h-8 w-8 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
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

        {/* Task Management Modal */}
        <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleTaskFormSubmit} className="space-y-4">
              <div>
                <Label htmlFor="taskName">Task Name</Label>
                <Input
                  id="taskName"
                  value={customTaskForm.name}
                  onChange={(e) => setCustomTaskForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Morning workout"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="taskDescription">Description</Label>
                <Input
                  id="taskDescription"
                  value={customTaskForm.description}
                  onChange={(e) => setCustomTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., 30 minutes of cardio or strength training"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="taskPoints">Points</Label>
                <Input
                  id="taskPoints"
                  type="number"
                  min="1"
                  max="10"
                  value={customTaskForm.points}
                  onChange={(e) => setCustomTaskForm(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="taskIcon">Icon</Label>
                <select
                  id="taskIcon"
                  value={customTaskForm.icon}
                  onChange={(e) => setCustomTaskForm(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  {availableIcons.map(icon => (
                    <option key={icon.name} value={icon.name}>{icon.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="taskColor">Color</Label>
                <select
                  id="taskColor"
                  value={customTaskForm.color}
                  onChange={(e) => setCustomTaskForm(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="blue">Blue</option>
                  <option value="emerald">Emerald</option>
                  <option value="purple">Purple</option>
                  <option value="yellow">Yellow</option>
                  <option value="red">Red</option>
                  <option value="indigo">Indigo</option>
                  <option value="green">Green</option>
                  <option value="orange">Orange</option>
                  <option value="pink">Pink</option>
                  <option value="cyan">Cyan</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowTaskForm(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCustomTaskMutation.isPending || updateCustomTaskMutation.isPending}
                >
                  {editingTask ? "Update Task" : "Create Task"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Weekly Stats Modal */}
        <Dialog open={showWeeklyStats} onOpenChange={setShowWeeklyStats}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Weekly Summary</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {(() => {
                const stats = calculateWeeklyStats();
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalPoints}</div>
                        <div className="text-sm text-blue-800">Total Points</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{stats.tasksCompleted}</div>
                        <div className="text-sm text-green-800">Tasks Completed</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{stats.uniqueTaskTypes}</div>
                        <div className="text-sm text-purple-800">Unique Tasks</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{stats.newStreaks}</div>
                        <div className="text-sm text-orange-800">New Streaks</div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <Button onClick={() => setShowWeeklyStats(false)}>
                        Continue to Next Week
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>

        {/* Achievements Modal */}
        <Dialog open={showAchievements} onOpenChange={setShowAchievements}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Achievements
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {(() => {
                const stats = calculateUserStats();
                const unlockedBadges = getUnlockedBadges();
                const lockedBadges = badges.filter(badge => !unlockedBadges.includes(badge));
                
                return (
                  <>
                    {/* Achievement Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalTasks}</div>
                        <div className="text-sm text-slate-600">Total Tasks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.longestStreak}</div>
                        <div className="text-sm text-slate-600">Longest Streak</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{stats.bestWeekPoints}</div>
                        <div className="text-sm text-slate-600">Best Week</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{unlockedBadges.length}/{badges.length}</div>
                        <div className="text-sm text-slate-600">Badges</div>
                      </div>
                    </div>

                    {/* Unlocked Badges */}
                    {unlockedBadges.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-green-700">Unlocked Badges ({unlockedBadges.length})</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {unlockedBadges.map(badge => (
                            <div
                              key={badge.id}
                              className="p-4 bg-green-50 border border-green-200 rounded-lg text-center hover:bg-green-100 transition-colors"
                            >
                              <div className="text-3xl mb-2">{badge.icon}</div>
                              <div className="font-medium text-green-800">{badge.name}</div>
                              <div className="text-xs text-green-600 mt-1">{badge.criteria}</div>
                              <div className="text-xs text-slate-600 mt-2">{badge.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Locked Badges */}
                    {lockedBadges.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-slate-600">Locked Badges ({lockedBadges.length})</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {lockedBadges.map(badge => (
                            <div
                              key={badge.id}
                              className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center opacity-60"
                            >
                              <div className="text-3xl mb-2 grayscale">{badge.icon}</div>
                              <div className="font-medium text-slate-600">{badge.name}</div>
                              <div className="text-xs text-slate-500 mt-1">{badge.criteria}</div>
                              <div className="text-xs text-slate-500 mt-2">{badge.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>

        {/* Share Snapshot Modal */}
        <Dialog open={showShareSnapshot} onOpenChange={setShowShareSnapshot}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share className="w-5 h-5 text-green-500" />
                Share Weekly Progress
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {(() => {
                const snapshotText = generateSnapshot();
                
                return (
                  <>
                    {/* Preview of the snapshot */}
                    <div className="bg-slate-50 p-4 rounded-lg border">
                      <h3 className="font-medium mb-3 text-slate-700">Preview:</h3>
                      <div className="whitespace-pre-line text-sm text-slate-600 font-mono leading-relaxed">
                        {snapshotText}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={shareSnapshot}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Share className="w-4 h-4 mr-2" />
                        Share Progress
                      </Button>
                      <Button
                        onClick={copySnapshot}
                        variant="outline"
                        className="flex-1"
                      >
                        Copy to Clipboard
                      </Button>
                    </div>

                    {/* Social sharing suggestions */}
                    <div className="text-center">
                      <p className="text-sm text-slate-500 mb-2">
                        Share your progress on social media to inspire others!
                      </p>
                      <div className="text-xs text-slate-400">
                        Perfect for LinkedIn, Twitter, or team updates
                      </div>
                    </div>
                  </>
                );
              })()}
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
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setShowAchievement(false)}>
                  Continue
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowAchievement(false);
                  setShowWeeklyStats(true);
                }}>
                  View Stats
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}