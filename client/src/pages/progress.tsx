import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, ChevronRight, TrendingUp, Calendar, Target, Award } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, getISOWeek } from "date-fns";

interface CompletedTask {
  id: number;
  taskId: string;
  name: string;
  points: number;
  note?: string;
  completedAt: string;
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

export default function ProgressPage() {
  const [currentWeek, setCurrentWeek] = useState(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
    return format(weekStart, 'yyyy-MM-dd');
  });

  const { user, isLoading: isAuthLoading } = useAuth();

  // Calculate week date range with ISO week number
  const getWeekRange = (weekStartDate: string) => {
    const start = new Date(weekStartDate);
    const end = endOfWeek(start, { weekStartsOn: 1 }); // Sunday end
    const weekNumber = getISOWeek(start);
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
      display: `${format(start, 'MMM d')} – ${format(end, 'MMM d')} (Week ${weekNumber})`
    };
  };

  const currentWeekRange = getWeekRange(currentWeek);

  // Fetch progress data for current week
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['/api/progress', currentWeekRange.start, currentWeekRange.end],
    queryFn: async () => {
      const response = await fetch(`/api/progress?start=${currentWeekRange.start}&end=${currentWeekRange.end}`);
      if (!response.ok) {
        // Fallback to existing endpoints for compatibility
        const [tasksRes, goalRes, historyRes] = await Promise.all([
          fetch(`/api/completed-tasks?weekStartDate=${currentWeek}`),
          fetch(`/api/dynamic-goal/${currentWeek}`),
          fetch('/api/weekly-history')
        ]);
        
        const tasks = tasksRes.ok ? await tasksRes.json() : [];
        const goalData = goalRes.ok ? await goalRes.json() : { goal: 15 };
        const history = historyRes.ok ? await historyRes.json() : [];
        
        // Calculate top tasks
        const taskCounts = tasks.reduce((acc: Record<string, {name: string, points: number, count: number}>, task: CompletedTask) => {
          if (!acc[task.taskId]) {
            acc[task.taskId] = { name: task.name, points: 0, count: 0 };
          }
          acc[task.taskId].points += task.points;
          acc[task.taskId].count += 1;
          return acc;
        }, {});
        
        const topTasks = Object.values(taskCounts)
          .sort((a: any, b: any) => b.points - a.points)
          .slice(0, 5);
        
        return {
          points: tasks.reduce((sum: number, task: CompletedTask) => sum + task.points, 0),
          goal: goalData.goal,
          tasksCompleted: tasks.length,
          topTasks,
          history: history.slice(0, 8)
        };
      }
      return response.json();
    },
    enabled: !!user,
  });

  const isCurrentWeek = currentWeek === format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  
  const goToPreviousWeek = () => {
    const current = new Date(currentWeek + 'T00:00:00');
    const previous = subWeeks(current, 1);
    setCurrentWeek(format(previous, 'yyyy-MM-dd'));
  };

  const goToNextWeek = () => {
    const current = new Date(currentWeek + 'T00:00:00');
    const next = addWeeks(current, 1);
    setCurrentWeek(format(next, 'yyyy-MM-dd'));
  };

  const goToCurrentWeek = () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    setCurrentWeek(format(weekStart, 'yyyy-MM-dd'));
  };

  // Calculate current week stats from progress data
  const currentPoints = progressData?.points || 0;
  const weeklyGoal = progressData?.goal || 15;
  const progressPercentage = Math.min((currentPoints / weeklyGoal) * 100, 100);
  const tasksThisWeek = progressData?.tasksCompleted || 0;
  const topTasksThisWeek = progressData?.topTasks || [];
  const recentHistory = progressData?.history || [];

  if (isAuthLoading || progressLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-slate-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading progress data...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
            <p className="text-gray-600">Track your statistics and performance trends</p>
          </div>
          
          {/* Week Navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousWeek}
              className="text-blue-700 border-blue-300"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <div className="text-center px-4">
              <div className="font-semibold text-blue-900">{currentWeekRange.display}</div>
              {!isCurrentWeek && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={goToCurrentWeek}
                  className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                >
                  Current Week
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextWeek}
              className="text-blue-700 border-blue-300"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Points This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{currentPoints}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Weekly Goal</p>
                  <p className="text-2xl font-bold text-gray-900">{weeklyGoal}</p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasks Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{tasksThisWeek}</p>
                </div>
                <Award className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(progressPercentage)}%</p>
                </div>
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Goal Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Weekly Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{currentPoints} / {weeklyGoal} points</span>
              </div>
              <Progress value={progressPercentage} className="w-full" />
              <p className="text-sm text-gray-600">
                {progressPercentage >= 100 
                  ? "🎉 Goal achieved! Great work!" 
                  : `${weeklyGoal - currentPoints} points to go`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Top Tasks This Week */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Top Tasks This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topTasksThisWeek.length > 0 ? (
              <div className="space-y-3">
                {topTasksThisWeek.map((task: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{task.name}</p>
                      <p className="text-sm text-gray-600">{task.count} times completed</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">{task.points} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No tasks completed this week yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              Recent Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 text-sm font-medium text-gray-600">Week</th>
                      <th className="text-left p-2 text-sm font-medium text-gray-600">Points</th>
                      <th className="text-left p-2 text-sm font-medium text-gray-600">Tasks</th>
                      <th className="text-left p-2 text-sm font-medium text-gray-600">Goal</th>
                      <th className="text-left p-2 text-sm font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentHistory.map((week: WeeklyHistory) => {
                      const weekStart = new Date(week.weekStartDate);
                      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                      const weekDisplay = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`;
                      
                      return (
                        <tr key={week.id} className="border-b">
                          <td className="p-2 text-sm text-gray-900">{weekDisplay}</td>
                          <td className="p-2 text-sm font-medium text-blue-600">{week.totalPoints}</td>
                          <td className="p-2 text-sm text-gray-900">{week.tasksCompleted}</td>
                          <td className="p-2 text-sm text-gray-900">{week.weeklyGoal}</td>
                          <td className="p-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              week.goalAchieved 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {week.goalAchieved ? 'Achieved' : 'In Progress'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No performance history available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}