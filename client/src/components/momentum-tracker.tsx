import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  GripVertical
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

// Sortable Task Item Component
function SortableTaskItem({ task, openTaskDialog, getCurrentTaskValue, needsAttention, getTaskStreak, isOnStreak, getStreakEmoji }: {
  task: Task;
  openTaskDialog: (task: Task) => void;
  getCurrentTaskValue: (task: Task) => number;
  needsAttention: (taskId: string) => boolean;
  getTaskStreak: (taskId: string) => number;
  isOnStreak: (taskId: string) => boolean;
  getStreakEmoji: (streak: number) => string;
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
          <Button 
            size="sm" 
            onClick={() => openTaskDialog(task)}
            className="h-8 hover:bg-blue-600 hover:shadow-sm transition-all"
          >
            Add
          </Button>
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
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Momentum Tracker</h1>
          
          {/* Week Navigation */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
              className="hover:bg-slate-50 hover:shadow-sm transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="text-center">
              <div className="text-lg font-semibold">{formatWeekDisplay(currentWeek)}</div>
              {!isCurrentWeek && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={goToCurrentWeek}
                  className="text-blue-600 text-sm hover:text-blue-700 hover:underline transition-all"
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
            {Array.isArray(taskStats) && taskStats.filter(stat => stat.timesThisWeek >= 3).length > 0 && (
              <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs whitespace-nowrap">
                🔥 {taskStats.filter(stat => stat.timesThisWeek >= 3).length}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
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
                      className="pl-10 w-48 h-9"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      
                      {task.note && (
                        <p className="task-note text-sm text-slate-700 italic mb-2">"{task.note}"</p>
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