import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MessageCircle, 
  Code, 
  Briefcase, 
  Heart,
  Users,
  Lightbulb,
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
  Circle
} from "lucide-react";

interface Task {
  id: string;
  name: string;
  description: string;
  points: number;
  icon: React.ComponentType<any>;
  color: string;
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
  
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Default tasks with semantic icons
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
      icon: Users,
      color: "green"
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
    },
    {
      id: "learn-skill",
      name: "Learn New Skill",
      description: "Study or practice new abilities",
      points: 2,
      icon: Lightbulb,
      color: "orange"
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

  // Icon mapping for custom tasks
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      Star, Bookmark, Check, Clock, Camera, Target, Zap, Globe, Home, Settings,
      Music, Book, Coffee, Phone, Mail, Calendar, Flag, Gift, Shield, Compass,
      Diamond, Rocket, Crown, Palette, Mountain, Smile, Sun, Moon, Cloud,
      Umbrella, Car, Bike, Plane, Train, Heart, Users, Code, Briefcase, Lightbulb
    };
    return iconMap[iconName] || Star;
  };

  // Available icons for picker
  const availableIcons = [
    { name: "Star", component: Star },
    { name: "Bookmark", component: Bookmark },
    { name: "Check", component: Check },
    { name: "Clock", component: Clock },
    { name: "Camera", component: Camera },
    { name: "Target", component: Target },
    { name: "Zap", component: Zap },
    { name: "Globe", component: Globe },
    { name: "Home", component: Home },
    { name: "Settings", component: Settings },
    { name: "Music", component: Music },
    { name: "Book", component: Book },
    { name: "Coffee", component: Coffee },
    { name: "Phone", component: Phone },
    { name: "Mail", component: Mail },
    { name: "Calendar", component: Calendar },
    { name: "Flag", component: Flag },
    { name: "Gift", component: Gift },
    { name: "Shield", component: Shield },
    { name: "Compass", component: Compass },
    { name: "Diamond", component: Diamond },
    { name: "Rocket", component: Rocket },
    { name: "Crown", component: Crown },
    { name: "Palette", component: Palette },
    { name: "Mountain", component: Mountain },
    { name: "Smile", component: Smile },
    { name: "Sun", component: Sun },
    { name: "Moon", component: Moon },
    { name: "Cloud", component: Cloud },
    { name: "Umbrella", component: Umbrella },
    { name: "Car", component: Car },
    { name: "Bike", component: Bike },
    { name: "Plane", component: Plane },
    { name: "Train", component: Train },
    { name: "Heart", component: Heart },
    { name: "Users", component: Users },
    { name: "Code", component: Code },
    { name: "Briefcase", component: Briefcase },
    { name: "Lightbulb", component: Lightbulb }
  ];

  // Combine all tasks
  const allTasks: Task[] = [
    ...defaultTasks,
    ...customTasks.map((ct: CustomTask) => ({
      id: `custom-${ct.taskId}`,
      name: ct.name,
      description: ct.description,
      points: ct.points,
      icon: getIconComponent(ct.icon),
      color: ct.color
    }))
  ];

  // Filter tasks based on search
  const filteredTasks = allTasks.filter(task =>
    task.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    task.description.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Mutation to create custom task
  const createCustomTaskMutation = useMutation({
    mutationFn: async (taskData: { name: string; description: string; points: number; color: string; icon: string }) => {
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
      setShowCreateDialog(false);
      setNewTaskName("");
      setNewTaskDescription("");
      setNewTaskPoints(1);
      setNewTaskColor("blue");
      setNewTaskIcon("Star");
      setShowIconPicker(false);
      toast({
        title: "Task created",
        description: "New custom task has been added.",
      });
    }
  });

  // Mutation to update custom task
  const updateCustomTaskMutation = useMutation({
    mutationFn: async (data: { id: number; name: string; description: string; points: number; color: string }) => {
      const response = await fetch(`/api/custom-tasks/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          points: data.points,
          color: data.color
        })
      });
      if (!response.ok) throw new Error('Failed to update custom task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-tasks'] });
      setShowEditDialog(false);
      setEditingTask(null);
      toast({
        title: "Task updated",
        description: "Custom task has been updated successfully.",
      });
    }
  });

  // Mutation to delete custom task
  const deleteCustomTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const customTask = customTasks.find((ct: CustomTask) => ct.taskId === taskId);
      if (!customTask) throw new Error('Custom task not found');
      
      const response = await fetch(`/api/custom-tasks/${customTask.id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete custom task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-tasks'] });
      toast({
        title: "Task deleted",
        description: "Custom task has been removed.",
      });
    }
  });

  const handleCreateTask = () => {
    if (!newTaskName.trim()) return;
    
    createCustomTaskMutation.mutate({
      name: newTaskName.trim(),
      description: newTaskDescription.trim(),
      points: newTaskPoints,
      color: newTaskColor,
      icon: newTaskIcon
    });
  };

  const handleEditTask = (task: Task) => {
    const isCustomTask = task.id.startsWith('custom-');
    
    if (!isCustomTask) {
      toast({
        title: "Cannot edit default task",
        description: "You can only edit custom tasks that you created.",
        variant: "destructive"
      });
      return;
    }

    const cleanTaskId = task.id.replace('custom-', '');
    const customTask = customTasks.find((ct: CustomTask) => ct.taskId === cleanTaskId);
    
    if (customTask) {
      setEditingTask(task);
      setNewTaskName(task.name);
      setNewTaskDescription(task.description);
      setNewTaskPoints(task.points);
      setNewTaskColor(task.color);
      setShowEditDialog(true);
    }
  };

  const handleUpdateTask = () => {
    if (!newTaskName.trim() || !editingTask) return;
    
    const cleanTaskId = editingTask.id.replace('custom-', '');
    const customTask = customTasks.find((ct: CustomTask) => ct.taskId === cleanTaskId);
    
    if (customTask) {
      updateCustomTaskMutation.mutate({
        id: customTask.id,
        name: newTaskName.trim(),
        description: newTaskDescription.trim(),
        points: newTaskPoints,
        color: newTaskColor
      });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const cleanTaskId = taskId.startsWith('custom-') ? taskId.replace('custom-', '') : taskId;
    const customTask = customTasks.find((ct: CustomTask) => ct.taskId === cleanTaskId);
    
    if (customTask) {
      if (confirm("Are you sure you want to delete this custom task? This action cannot be undone.")) {
        deleteCustomTaskMutation.mutate(cleanTaskId);
      }
    } else {
      toast({
        title: "Cannot delete default task",
        description: "You can only delete custom tasks that you created.",
        variant: "destructive"
      });
    }
  };

  const colorOptions = [
    { value: "blue", label: "Blue", class: "bg-blue-500" },
    { value: "green", label: "Green", class: "bg-green-500" },
    { value: "purple", label: "Purple", class: "bg-purple-500" },
    { value: "red", label: "Red", class: "bg-red-500" },
    { value: "orange", label: "Orange", class: "bg-orange-500" },
    { value: "pink", label: "Pink", class: "bg-pink-500" },
  ];

  if (isLoading || isAuthLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-slate-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading tasks...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-600">Manage your activities and track progress</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="taskName">Task Name</Label>
                  <Input
                    id="taskName"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Enter task name"
                  />
                </div>
                <div>
                  <Label htmlFor="taskDescription">Description</Label>
                  <Input
                    id="taskDescription"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Describe the task"
                  />
                </div>
                <div>
                  <Label htmlFor="taskPoints">Points</Label>
                  <Input
                    id="taskPoints"
                    type="number"
                    min="1"
                    max="10"
                    value={newTaskPoints}
                    onChange={(e) => setNewTaskPoints(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 mt-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setNewTaskColor(color.value)}
                        className={`w-6 h-6 rounded-full ${color.class} ${
                          newTaskColor === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                        }`}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTask} disabled={createCustomTaskMutation.isPending}>
                    {createCustomTaskMutation.isPending ? "Creating..." : "Create Task"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Edit Task Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editTaskName">Task Name</Label>
                  <Input
                    id="editTaskName"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Enter task name"
                  />
                </div>
                <div>
                  <Label htmlFor="editTaskDescription">Description</Label>
                  <Input
                    id="editTaskDescription"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Describe the task"
                  />
                </div>
                <div>
                  <Label htmlFor="editTaskPoints">Points</Label>
                  <Input
                    id="editTaskPoints"
                    type="number"
                    min="1"
                    max="10"
                    value={newTaskPoints}
                    onChange={(e) => setNewTaskPoints(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 mt-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setNewTaskColor(color.value)}
                        className={`w-6 h-6 rounded-full ${color.class} ${
                          newTaskColor === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                        }`}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateTask} disabled={updateCustomTaskMutation.isPending}>
                    {updateCustomTaskMutation.isPending ? "Updating..." : "Update Task"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search tasks..."
              className="pl-10"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filteredTasks.length} of {allTasks.length} tasks
          </div>
        </div>

        {/* Tasks Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-900">Task</th>
                    <th className="text-left p-4 font-medium text-gray-900">Description</th>
                    <th className="text-left p-4 font-medium text-gray-900">Base Points</th>
                    <th className="text-left p-4 font-medium text-gray-900">Type</th>
                    <th className="text-right p-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTasks.map((task) => {
                    const IconComponent = task.icon;
                    const isCustomTask = task.id.startsWith('custom-');
                    
                    return (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <div className={`w-8 h-8 rounded-full bg-${task.color}-100 flex items-center justify-center`}>
                                <IconComponent className={`w-4 h-4 text-${task.color}-600`} />
                              </div>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{task.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-gray-600">{task.description}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-medium">{task.points} points</div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isCustomTask 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {isCustomTask ? 'Custom' : 'Default'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTask(task)}
                              className="text-gray-500 hover:text-blue-600"
                              title="Edit task"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-gray-500 hover:text-red-600"
                              title="Delete task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-500 mb-4">
                  {searchFilter ? "Try adjusting your search criteria" : "Get started by creating your first custom task"}
                </p>
                {!searchFilter && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Task
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Categories Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-medium text-blue-900 mb-3">Task Management Tips</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• <strong>Default tasks</strong> are pre-configured activities optimized for job seekers</p>
              <p>• <strong>Custom tasks</strong> can be created, edited, and deleted to fit your specific needs</p>
              <p>• Base points determine the value of each task completion</p>
              <p>• Tasks with higher completion frequency get automatic multiplier bonuses</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}