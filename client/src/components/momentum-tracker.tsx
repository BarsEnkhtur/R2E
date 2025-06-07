import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
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
  ClipboardList
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
  id: string;
  name: string;
  points: number;
  timestamp: string;
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
    id: "tech-prep",
    name: "Tech interview prep",
    description: "Practice coding challenges",
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
  const [currentPoints, setCurrentPoints] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [showAchievement, setShowAchievement] = useState(false);
  
  const maxPoints = 15;
  const progressPercentage = Math.min((currentPoints / maxPoints) * 100, 100);

  const addPoints = (task: Task) => {
    if (currentPoints >= maxPoints) return;

    const newPoints = Math.min(currentPoints + task.points, maxPoints);
    setCurrentPoints(newPoints);

    const timestamp = new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const completedTask: CompletedTask = {
      id: `${task.id}-${Date.now()}`,
      name: task.name,
      points: task.points,
      timestamp: `Completed at ${timestamp}`
    };

    setCompletedTasks(prev => [completedTask, ...prev]);

    // Show achievement if goal reached
    if (newPoints >= maxPoints) {
      setTimeout(() => {
        setShowAchievement(true);
      }, 500);
    }
  };

  const resetWeek = () => {
    if (window.confirm('Are you sure you want to reset this week? This will clear all progress.')) {
      setCurrentPoints(0);
      setCompletedTasks([]);
      setShowAchievement(false);
    }
  };

  const closeAchievement = () => {
    setShowAchievement(false);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            Weekly Momentum Tracker
          </h1>
          <p className="text-slate-600">Build momentum with consistent daily actions</p>
        </div>

        {/* Progress Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800">Weekly Progress</h2>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-blue-600">{currentPoints}</span>
                <span className="text-slate-500">/</span>
                <span className="text-2xl font-bold text-slate-400">15</span>
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
            
            {/* Progress Stats */}
            <div className="flex justify-between text-sm text-slate-600">
              <span>Started: <span className="font-medium">This Week</span></span>
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
                {tasks.map((task) => {
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
                        <div>
                          <p className="font-medium text-slate-800">{task.name}</p>
                          <p className="text-sm text-slate-500">{task.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`text-lg font-semibold ${pointsColorClasses[task.color as keyof typeof pointsColorClasses]}`}>
                          +{task.points}
                        </span>
                        <Button 
                          onClick={() => addPoints(task)}
                          disabled={currentPoints >= maxPoints}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
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
                {completedTasks.length === 0 ? (
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
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-emerald-800">{task.name}</p>
                          <p className="text-xs text-emerald-600">{task.timestamp}</p>
                        </div>
                      </div>
                      <div className="text-emerald-700 font-semibold">+{task.points} pts</div>
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
      </div>
    </div>
  );
}
