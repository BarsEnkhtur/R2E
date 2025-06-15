import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Layout from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Star, 
  Bookmark, 
  Check, 
  Clock, 
  Camera, 
  Target, 
  Zap, 
  Globe, 
  Home, 
  Settings,
  Music, 
  Book, 
  Coffee, 
  Phone, 
  Mail, 
  Calendar, 
  Flag, 
  Gift, 
  Shield, 
  Compass,
  Diamond, 
  Rocket, 
  Crown, 
  Palette, 
  Mountain, 
  Smile, 
  Sun, 
  Moon, 
  Cloud,
  Umbrella, 
  Car, 
  Bike, 
  Plane, 
  Train, 
  Heart, 
  Users, 
  Code, 
  Briefcase, 
  Lightbulb,
  Trophy,
  Award,
  TrendingUp,
  Gamepad2,
  Dumbbell,
  GraduationCap,
  Wallet,
  ShoppingCart,
  Utensils,
  Wrench,
  Hammer,
  Scissors,
  Paintbrush,
  Calculator,
  Building,
  School,
  Hospital,
  MapPin,
  Navigation,
  Anchor,
  TreePine,
  Flower,
  Leaf,
  Apple,
  Cherry,
  Laptop,
  Smartphone,
  Tablet,
  Headphones,
  Gamepad,
  Monitor,
  Keyboard,
  Mouse,
  Printer,
  Wifi,
  Bluetooth,
  Battery,
  Volume2,
  Play,
  Pause,
  StopCircle,
  SkipForward,
  Repeat,
  Shuffle,
  Radio,
  Tv,
  Film,
  Image,
  FileText,
  Folder,
  Archive,
  Download,
  Upload,
  Share,
  Link,
  Copy,
  Trash,
  Save,
  Edit3,
  PenTool,
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  CheckSquare,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Octagon,
  Minus,
  X,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  RotateCcw,
  RefreshCw,
  Maximize,
  Minimize,
  Move,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Filter,
  Grid,
  Layers,
  Package,
  Box
} from "lucide-react";

interface Task {
  id: string;
  name: string;
  description: string;
  points: number;
  icon: React.ComponentType<any>;
  color: string;
  type?: string;
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

export default function TasksPage() {
  const [searchFilter, setSearchFilter] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPoints, setNewTaskPoints] = useState(1);
  const [newTaskColor, setNewTaskColor] = useState("blue");
  const [newTaskIcon, setNewTaskIcon] = useState("Star");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskNote, setTaskNote] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Available colors for tasks
  const colors = [
    { name: "blue", class: "bg-blue-500" },
    { name: "green", class: "bg-green-500" },
    { name: "purple", class: "bg-purple-500" },
    { name: "red", class: "bg-red-500" },
    { name: "orange", class: "bg-orange-500" },
    { name: "yellow", class: "bg-yellow-500" },
    { name: "pink", class: "bg-pink-500" },
    { name: "indigo", class: "bg-indigo-500" }
  ];

  // Available icons for tasks (comprehensive icon set)
  const availableIcons = [
    // Core task icons
    { name: "Star", component: Star },
    { name: "Target", component: Target },
    { name: "Check", component: Check },
    { name: "Flag", component: Flag },
    { name: "Trophy", component: Trophy },
    { name: "Award", component: Award },
    
    // Work & Career
    { name: "Briefcase", component: Briefcase },
    { name: "Users", component: Users },
    { name: "Code", component: Code },
    { name: "Building", component: Building },
    { name: "GraduationCap", component: GraduationCap },
    { name: "Calculator", component: Calculator },
    
    // Health & Fitness
    { name: "Heart", component: Heart },
    { name: "Dumbbell", component: Dumbbell },
    { name: "Apple", component: Apple },
    
    // Learning & Growth
    { name: "Book", component: Book },
    { name: "Lightbulb", component: Lightbulb },
    { name: "School", component: School },
    
    // Tech & Devices
    { name: "Laptop", component: Laptop },
    { name: "Smartphone", component: Smartphone },
    { name: "Monitor", component: Monitor },
    { name: "Gamepad", component: Gamepad },
    { name: "Headphones", component: Headphones },
    
    // Communication
    { name: "Mail", component: Mail },
    { name: "Phone", component: Phone },
    { name: "Share", component: Share },
    
    // Time & Schedule
    { name: "Clock", component: Clock },
    { name: "Calendar", component: Calendar },
    
    // Creative & Design
    { name: "Palette", component: Palette },
    { name: "Paintbrush", component: Paintbrush },
    { name: "Camera", component: Camera },
    { name: "Music", component: Music },
    { name: "Film", component: Film },
    
    // Tools & Utilities
    { name: "Wrench", component: Wrench },
    { name: "Hammer", component: Hammer },
    { name: "Scissors", component: Scissors },
    { name: "Settings", component: Settings },
    
    // Travel & Transportation
    { name: "Car", component: Car },
    { name: "Bike", component: Bike },
    { name: "Plane", component: Plane },
    { name: "Train", component: Train },
    { name: "MapPin", component: MapPin },
    
    // Nature & Weather
    { name: "Sun", component: Sun },
    { name: "Moon", component: Moon },
    { name: "Cloud", component: Cloud },
    { name: "TreePine", component: TreePine },
    { name: "Flower", component: Flower },
    { name: "Mountain", component: Mountain },
    
    // Objects & Items
    { name: "Coffee", component: Coffee },
    { name: "Gift", component: Gift },
    { name: "Wallet", component: Wallet },
    { name: "ShoppingCart", component: ShoppingCart },
    { name: "Utensils", component: Utensils },
    { name: "Home", component: Home },
    
    // Shapes & Symbols
    { name: "Circle", component: Circle },
    { name: "Square", component: Square },
    { name: "Diamond", component: Diamond },
    { name: "Crown", component: Crown },
    { name: "Shield", component: Shield },
    
    // Navigation & Direction
    { name: "Compass", component: Compass },
    { name: "Navigation", component: Navigation },
    { name: "TrendingUp", component: TrendingUp },
    { name: "Rocket", component: Rocket },
    
    // Files & Documents
    { name: "FileText", component: FileText },
    { name: "Folder", component: Folder },
    { name: "Archive", component: Archive },
    { name: "Bookmark", component: Bookmark },
    
    // Fun & Entertainment
    { name: "Gamepad2", component: Gamepad2 },
    { name: "Smile", component: Smile },
    { name: "Globe", component: Globe },
    { name: "Zap", component: Zap }
  ];

  // Default tasks with semantic icons
  const defaultTasks: Task[] = [
    {
      id: "job-application",
      name: "Job Application",
      description: "Apply to a new position",
      points: 3,
      icon: Briefcase,
      color: "blue",
      type: "Default"
    },
    {
      id: "networking",
      name: "Networking",
      description: "Connect with professionals",
      points: 2,
      icon: Users,
      color: "green",
      type: "Default"
    },
    {
      id: "coding-practice",
      name: "Coding Practice",
      description: "Solve coding challenges",
      points: 2,
      icon: Code,
      color: "purple",
      type: "Default"
    },
    {
      id: "gym-recovery",
      name: "Gym/Recovery/PT",
      description: "Physical wellness",
      points: 2,
      icon: Heart,
      color: "red",
      type: "Default"
    },
    {
      id: "learn-skill",
      name: "Learn New Skill",
      description: "Study or practice new abilities",
      points: 2,
      icon: Lightbulb,
      color: "orange",
      type: "Default"
    }
  ];

  // Fetch custom tasks
  const { data: customTasks = [], isLoading } = useQuery({
    queryKey: ['/api/custom-tasks'],
    queryFn: async () => {
      const response = await fetch('/api/custom-tasks');
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch weekly task data from progress API
  const getCurrentWeekRange = () => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0]
    };
  };

  const weekRange = getCurrentWeekRange();

  const { data: progressData, isLoading: isProgressLoading } = useQuery({
    queryKey: ['/api/progress', weekRange.start, weekRange.end],
    queryFn: async () => {
      const response = await fetch(`/api/progress?start=${weekRange.start}&end=${weekRange.end}`);
      if (!response.ok) throw new Error('Failed to fetch progress data');
      const data = await response.json();
      console.log('Progress data received:', data);
      return data;
    },
    enabled: !!user,
  });

  // Create a map of weekly task data by taskId for quick lookup
  const weeklyDataById = (progressData?.weeklyTaskData || []).reduce((acc: Record<string, any>, taskData: any) => {
    acc[taskData.taskId] = taskData;
    return acc;
  }, {});

  console.log('Weekly data by ID:', weeklyDataById);

  // Icon mapping for custom tasks
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      // Core task icons
      Star, Target, Check, Flag, Trophy, Award,
      
      // Work & Career
      Briefcase, Users, Code, Building, GraduationCap, Calculator,
      
      // Health & Fitness
      Heart, Dumbbell, Apple,
      
      // Learning & Growth
      Book, Lightbulb, School,
      
      // Tech & Devices
      Laptop, Smartphone, Monitor, Gamepad, Headphones,
      
      // Communication
      Mail, Phone, Share,
      
      // Time & Schedule
      Clock, Calendar,
      
      // Creative & Design
      Palette, Paintbrush, Camera, Music, Film,
      
      // Tools & Utilities
      Wrench, Hammer, Scissors, Settings,
      
      // Travel & Transportation
      Car, Bike, Plane, Train, MapPin,
      
      // Nature & Weather
      Sun, Moon, Cloud, TreePine, Flower, Mountain,
      
      // Objects & Items
      Coffee, Gift, Wallet, ShoppingCart, Utensils, Home,
      
      // Shapes & Symbols
      Circle, Square, Diamond, Crown, Shield,
      
      // Navigation & Direction
      Compass, Navigation, TrendingUp, Rocket,
      
      // Files & Documents
      FileText, Folder, Archive, Bookmark,
      
      // Fun & Entertainment
      Gamepad2, Smile, Globe, Zap,
      
      // Legacy support
      Umbrella
    };
    return iconMap[iconName] || Star;
  };

  // Combine all tasks with override logic
  const allTasks: Task[] = [
    // Start with default tasks and apply any custom overrides
    ...defaultTasks.map(defaultTask => {
      const override = customTasks.find((ct: CustomTask) => ct.taskId === defaultTask.id);
      if (override) {
        return {
          ...defaultTask,
          name: override.name,
          description: override.description,
          points: override.points,
          icon: getIconComponent(override.icon),
          color: override.color,
          type: "Default" // Keep as Default type but with override data
        };
      }
      return defaultTask;
    }),
    // Add pure custom tasks (those that don't override defaults)
    ...customTasks
      .filter((ct: CustomTask) => !defaultTasks.some(dt => dt.id === ct.taskId))
      .map((ct: CustomTask) => ({
        id: `custom-${ct.taskId}`,
        name: ct.name,
        description: ct.description,
        points: ct.points,
        icon: getIconComponent(ct.icon),
        color: ct.color,
        type: "Custom"
      }))
  ];

  // New logarithmic multiplier function matching backend
  const computeMultiplier = (count: number): number => {
    const maxBonus = 0.5;
    const scale = 3;
    const bonus = maxBonus * Math.log1p(count - 1) / Math.log1p(scale);
    return 1 + Math.min(bonus, maxBonus);
  };

  // Helper function to get weekly stats for a task
  const getWeeklyStats = (taskId: string) => {
    const cleanTaskId = taskId.startsWith('custom-') ? taskId.replace('custom-', '') : taskId;
    return weeklyDataById[cleanTaskId] || {
      completions: 0,
      totalPoints: 0,
      currentMultiplier: 1.0
    };
  };

  // Filter tasks based on search
  const filteredTasks = allTasks.filter(task =>
    task.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    task.description.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Get color class for a task
  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-100 text-blue-800",
      green: "bg-green-100 text-green-800",
      purple: "bg-purple-100 text-purple-800",
      red: "bg-red-100 text-red-800",
      orange: "bg-orange-100 text-orange-800",
      yellow: "bg-yellow-100 text-yellow-800",
      pink: "bg-pink-100 text-pink-800",
      indigo: "bg-indigo-100 text-indigo-800"
    };
    return colorMap[color] || "bg-gray-100 text-gray-800";
  };

  // Handle edit task
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    if (task.type === "Custom") {
      // For custom tasks, find the original custom task data
      const cleanTaskId = task.id.replace('custom-', '');
      const customTask = customTasks.find((ct: CustomTask) => ct.taskId === cleanTaskId);
      if (customTask) {
        setNewTaskName(customTask.name);
        setNewTaskDescription(customTask.description);
        setNewTaskPoints(customTask.points);
        setNewTaskColor(customTask.color);
        setNewTaskIcon(customTask.icon);
      }
    } else {
      // For default tasks, check if there's an existing override
      const existingOverride = customTasks.find((ct: CustomTask) => ct.taskId === task.id);
      if (existingOverride) {
        // Use override data
        setNewTaskName(existingOverride.name);
        setNewTaskDescription(existingOverride.description);
        setNewTaskPoints(existingOverride.points);
        setNewTaskColor(existingOverride.color);
        setNewTaskIcon(existingOverride.icon);
      } else {
        // Use default task data
        setNewTaskName(task.name);
        setNewTaskDescription(task.description);
        setNewTaskPoints(task.points);
        setNewTaskColor(task.color);
        // Find the icon name for default tasks
        const iconName = availableIcons.find(icon => icon.component === task.icon)?.name || "Briefcase";
        setNewTaskIcon(iconName);
      }
    }
    setShowEditDialog(true);
  };

  // Mutation to create custom task
  const createCustomTaskMutation = useMutation({
    mutationFn: async (taskData: { name: string; description: string; points: number; color: string; icon: string }) => {
      const response = await fetch('/api/custom-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskData,
          taskId: taskData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          isActive: true
        })
      });
      if (!response.ok) throw new Error('Failed to create custom task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-tasks'] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Task created",
        description: "New custom task has been added.",
      });
    }
  });

  // Mutation to update task
  const updateTaskMutation = useMutation({
    mutationFn: async (updateData: { id: string; name: string; description: string; points: number; color: string; icon: string }) => {
      if (editingTask?.type === "Custom") {
        // Update custom task
        const cleanTaskId = editingTask.id.replace('custom-', '');
        const customTask = customTasks.find((ct: CustomTask) => ct.taskId === cleanTaskId);
        if (customTask) {
          const response = await fetch(`/api/custom-tasks/${customTask.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: updateData.name,
              description: updateData.description,
              points: updateData.points,
              color: updateData.color,
              icon: updateData.icon
            })
          });
          if (!response.ok) throw new Error('Failed to update task');
          return response.json();
        }
      } else {
        // For default tasks, check if override exists
        const existingOverride = customTasks.find((ct: CustomTask) => ct.taskId === editingTask?.id);
        if (existingOverride) {
          // Update existing override
          const response = await fetch(`/api/custom-tasks/${existingOverride.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: updateData.name,
              description: updateData.description,
              points: updateData.points,
              color: updateData.color,
              icon: updateData.icon
            })
          });
          if (!response.ok) throw new Error('Failed to update task override');
          return response.json();
        } else {
          // Create new override
          const response = await fetch('/api/custom-tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              taskId: editingTask?.id || updateData.id,
              name: updateData.name,
              description: updateData.description,
              points: updateData.points,
              color: updateData.color,
              icon: updateData.icon,
              isActive: true
            })
          });
          if (!response.ok) throw new Error('Failed to create task override');
          return response.json();
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-tasks'] });
      setShowEditDialog(false);
      setEditingTask(null);
      resetForm();
      toast({
        title: "Task updated",
        description: "Task has been successfully updated.",
      });
    }
  });

  // Mutation to delete task
  const deleteTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      if (task.type === "Custom") {
        const cleanTaskId = task.id.replace('custom-', '');
        const customTask = customTasks.find((ct: CustomTask) => ct.taskId === cleanTaskId);
        if (customTask) {
          const response = await fetch(`/api/custom-tasks/${customTask.id}`, {
            method: 'DELETE'
          });
          if (!response.ok) throw new Error('Failed to delete task');
        }
      } else {
        // For default tasks, check if there's a custom override to delete
        const customOverride = customTasks.find((ct: CustomTask) => ct.taskId === task.id);
        if (customOverride) {
          const response = await fetch(`/api/custom-tasks/${customOverride.id}`, {
            method: 'DELETE'
          });
          if (!response.ok) throw new Error('Failed to delete task override');
        }
      }
    },
    onSuccess: (_, task) => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-tasks'] });
      toast({
        title: task.type === "Default" ? "Task reset" : "Task deleted",
        description: task.type === "Default" 
          ? "Task has been reset to default settings."
          : "Task has been successfully deleted.",
      });
    }
  });

  const resetForm = () => {
    setNewTaskName("");
    setNewTaskDescription("");
    setNewTaskPoints(1);
    setNewTaskColor("blue");
    setNewTaskIcon("Star");
    setShowIconPicker(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim() || !newTaskDescription.trim()) return;

    if (editingTask) {
      updateTaskMutation.mutate({
        id: editingTask.id,
        name: newTaskName,
        description: newTaskDescription,
        points: newTaskPoints,
        color: newTaskColor,
        icon: newTaskIcon
      });
    } else {
      createCustomTaskMutation.mutate({
        name: newTaskName,
        description: newTaskDescription,
        points: newTaskPoints,
        color: newTaskColor,
        icon: newTaskIcon
      });
    }
  };

  const handleDelete = (task: Task) => {
    deleteTaskMutation.mutate(task);
  };

  // Task dialog functions
  const openTaskDialog = (task: Task) => {
    setSelectedTask(task);
    setTaskNote("");
    setIsDialogOpen(true);
  };

  // Mutation to create a new completed task with optimistic updates
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
    onMutate: async (taskData) => {
      // Get current stats for this task
      const stats = getWeeklyStats(taskData.taskId);
      const currentMultiplier = stats.currentMultiplier;
      const actualPoints = Math.round(taskData.points * currentMultiplier);
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/progress', weekRange.start, weekRange.end] });
      
      // Snapshot current data
      const previousData = queryClient.getQueryData(['/api/progress', weekRange.start, weekRange.end]);
      
      // Optimistically update
      queryClient.setQueryData(['/api/progress', weekRange.start, weekRange.end], (old: any) => {
        if (!old) return old;
        
        const updatedWeeklyTaskData = [...(old.weeklyTaskData || [])];
        const existingIndex = updatedWeeklyTaskData.findIndex((t: any) => t.taskId === taskData.taskId);
        
        if (existingIndex >= 0) {
          // Update existing task
          const existing = updatedWeeklyTaskData[existingIndex];
          const newCompletions = existing.completions + 1;
          const newCurrentMultiplier = computeMultiplier(newCompletions + 1); // For next completion
          
          updatedWeeklyTaskData[existingIndex] = {
            ...existing,
            completions: newCompletions,
            totalPoints: existing.totalPoints + actualPoints,
            currentMultiplier: newCurrentMultiplier
          };
        } else {
          // Add new task
          updatedWeeklyTaskData.push({
            taskId: taskData.taskId,
            displayName: taskData.name,
            basePoints: taskData.points,
            completions: 1,
            totalPoints: actualPoints,
            currentMultiplier: computeMultiplier(2) // Next completion will be 2nd
          });
        }
        
        return {
          ...old,
          weeklyTaskData: updatedWeeklyTaskData,
          points: old.points + actualPoints,
          tasksCompleted: old.tasksCompleted + 1
        };
      });
      
      return { previousData, actualPoints };
    },
    onSuccess: (_, taskData, context) => {
      // Invalidate queries to sync with server
      queryClient.invalidateQueries({ queryKey: ['/api/progress', weekRange.start, weekRange.end] });
      queryClient.invalidateQueries({ queryKey: ['/api/completed-tasks'] });
      
      toast({
        title: "Task completed!",
        description: `You earned ${context?.actualPoints || taskData.points} points for ${taskData.name}`,
      });
      setIsDialogOpen(false);
      setSelectedTask(null);
      setTaskNote("");
    },
    onError: (error: any, taskData, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(['/api/progress', weekRange.start, weekRange.end], context.previousData);
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to complete task",
        variant: "destructive",
      });
    }
  });

  const handleTaskSubmit = () => {
    if (!selectedTask) return;
    
    const cleanTaskId = selectedTask.id.startsWith('custom-') ? selectedTask.id.replace('custom-', '') : selectedTask.id;
    const stats = getWeeklyStats(selectedTask.id);
    const actualPoints = Math.round(selectedTask.points * stats.currentMultiplier);
    
    createTaskMutation.mutate({
      taskId: cleanTaskId,
      name: selectedTask.name,
      points: selectedTask.points, // Send base points, backend will calculate multiplier
      note: taskNote.trim() || undefined
    });
  };

  if (isAuthLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-slate-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
            <p className="text-gray-600">Create and manage your momentum tasks</p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Task Name</Label>
                  <Input
                    id="name"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Enter task name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Enter task description"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    max="10"
                    value={newTaskPoints}
                    onChange={(e) => setNewTaskPoints(parseInt(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 mt-2">
                    {colors.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setNewTaskColor(color.name)}
                        className={`w-8 h-8 rounded-full ${color.class} ${
                          newTaskColor === color.name ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Icon</Label>
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowIconPicker(!showIconPicker)}
                      className="w-full justify-start"
                    >
                      {(() => {
                        const IconComponent = getIconComponent(newTaskIcon);
                        return <IconComponent className="w-4 h-4 mr-2" />;
                      })()}
                      {newTaskIcon}
                    </Button>
                    {showIconPicker && (
                      <div className="grid grid-cols-8 gap-2 mt-2 p-3 border rounded-md bg-gray-50">
                        {availableIcons.map((icon) => {
                          const IconComponent = icon.component;
                          return (
                            <button
                              key={icon.name}
                              type="button"
                              onClick={() => {
                                setNewTaskIcon(icon.name);
                                setShowIconPicker(false);
                              }}
                              className={`p-2 rounded-md hover:bg-gray-200 ${
                                newTaskIcon === icon.name ? 'bg-blue-100 text-blue-600' : ''
                              }`}
                            >
                              <IconComponent className="w-4 h-4" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createCustomTaskMutation.isPending}
                    className="flex-1"
                  >
                    {createCustomTaskMutation.isPending ? "Creating..." : "Create Task"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateDialog(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search tasks..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Tasks ({filteredTasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                <p className="text-slate-600">Loading tasks...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-20">Base pts</TableHead>
                    <TableHead className="w-32">This Week</TableHead>
                    <TableHead className="w-32">Next Add</TableHead>
                    <TableHead className="w-20">Type</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => {
                    const IconComponent = task.icon;
                    const stats = getWeeklyStats(task.id);
                    const nextPoints = Math.round(task.points * stats.currentMultiplier);
                    
                    return (
                      <TableRow key={task.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getColorClass(task.color)}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{task.name}</TableCell>
                        <TableCell className="text-gray-600">{task.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{task.points} pts</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {stats.completions}× → <strong>{stats.totalPoints} pts</strong>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            +{task.points} × {stats.currentMultiplier.toFixed(1)} → <strong>{nextPoints} pts</strong>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={task.type === "Default" ? "secondary" : "default"}>
                            {task.type || "Custom"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openTaskDialog(task)}
                              className="h-8 px-2 text-green-600 hover:text-green-800 hover:bg-green-50"
                              title="Complete Task"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              <span className="text-xs font-medium">+{nextPoints}</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditTask(task)}
                              className="h-8 w-8 p-0"
                              title="Edit Task"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                                  title={task.type === "Default" ? "Reset Task" : "Delete Task"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {task.type === "Default" 
                                      ? `Are you sure you want to reset "${task.name}" to its default settings? This will remove any customizations.`
                                      : `Are you sure you want to delete "${task.name}"? This action cannot be undone.`
                                    }
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(task)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {task.type === "Default" ? "Reset" : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            
            {!isLoading && filteredTasks.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No tasks found matching your search.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Task Name</Label>
                <Input
                  id="edit-name"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Enter task name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Enter task description"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-points">Points</Label>
                <Input
                  id="edit-points"
                  type="number"
                  min="1"
                  max="10"
                  value={newTaskPoints}
                  onChange={(e) => setNewTaskPoints(parseInt(e.target.value))}
                />
              </div>
              
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setNewTaskColor(color.name)}
                      className={`w-8 h-8 rounded-full ${color.class} ${
                        newTaskColor === color.name ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Icon</Label>
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-full justify-start"
                  >
                    {(() => {
                      const IconComponent = getIconComponent(newTaskIcon);
                      return <IconComponent className="w-4 h-4 mr-2" />;
                    })()}
                    {newTaskIcon}
                  </Button>
                  {showIconPicker && (
                    <div className="grid grid-cols-8 gap-2 mt-2 p-3 border rounded-md bg-gray-50">
                      {availableIcons.map((icon) => {
                        const IconComponent = icon.component;
                        return (
                          <button
                            key={icon.name}
                            type="button"
                            onClick={() => {
                              setNewTaskIcon(icon.name);
                              setShowIconPicker(false);
                            }}
                            className={`p-2 rounded-md hover:bg-gray-200 ${
                              newTaskIcon === icon.name ? 'bg-blue-100 text-blue-600' : ''
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={updateTaskMutation.isPending}
                  className="flex-1"
                >
                  {updateTaskMutation.isPending ? "Updating..." : "Update Task"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingTask(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

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