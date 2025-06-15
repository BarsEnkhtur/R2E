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
  Lightbulb
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

  // Available icons for tasks (using curated lucide icons)
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
    { name: "Train", component: Train }
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

  // Combine all tasks
  const allTasks: Task[] = [
    ...defaultTasks,
    ...customTasks.map((ct: CustomTask) => ({
      id: `custom-${ct.taskId}`,
      name: ct.name,
      description: ct.description,
      points: ct.points,
      icon: getIconComponent(ct.icon),
      color: ct.color,
      type: "Custom"
    }))
  ];

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
      // For default tasks, use the task data
      setNewTaskName(task.name);
      setNewTaskDescription(task.description);
      setNewTaskPoints(task.points);
      setNewTaskColor(task.color);
      // Find the icon name for default tasks
      const iconName = availableIcons.find(icon => icon.component === task.icon)?.name || "Star";
      setNewTaskIcon(iconName);
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
        // For default tasks, create a custom task override
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
                    <TableHead className="w-20">Points</TableHead>
                    <TableHead className="w-20">Type</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => {
                    const IconComponent = task.icon;
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
                          <Badge variant={task.type === "Default" ? "secondary" : "default"}>
                            {task.type || "Custom"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditTask(task)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
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
      </div>
    </Layout>
  );
}