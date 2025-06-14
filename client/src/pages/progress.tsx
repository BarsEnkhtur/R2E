import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, ChevronRight, TrendingUp, Calendar, Target, Award } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";

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
    const weekStart = startOfWeek(now, { weekStartsOn: 6 });
    return format(weekStart, 'yyyy-MM-dd');
  });

  const { user, isLoading: isAuthLoading } = useAuth();

  // Fetch completed tasks for current week
  const { data: completedTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/completed-tasks', { weekStartDate: currentWeek }],
    queryFn: async () => {
      const response = await fetch(`/api/completed-tasks?weekStartDate=${currentWeek}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch weekly history
  const { data: weeklyHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['/api/weekly-history'],
    queryFn: async () => {
      const response = await fetch('/api/weekly-history');
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch weekly goal
  const { data: goalData, isLoading: goalLoading } = useQuery({
    queryKey: ['/api/dynamic-goal', currentWeek],
    queryFn: async () => {
      const response = await fetch(`/api/dynamic-goal/${currentWeek}`);
      if (!response.ok) return { goal: 15 };
      return response.json();
    },
    enabled: !!user,
  });

  const isCurrentWeek = currentWeek === format(startOfWeek(new Date(), { weekStartsOn: 6 }), 'yyyy-MM-dd');
  
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
    const weekStart = startOfWeek(now, { weekStartsOn: 6 });
    setCurrentWeek(format(weekStart, 'yyyy-MM-dd'));
  };

  const formatWeekDisplay = (weekStartDate: string) => {
    const start = new Date(weekStartDate + 'T00:00:00');
    const end = endOfWeek(start, { weekStartsOn: 6 });
    return `${format(start, 'MMM d')}–${format(end, 'd')}`;
  };

  // Calculate current week stats
  const currentPoints = Array.isArray(completedTasks) ? completedTasks.reduce((sum: number, task: CompletedTask) => sum + task.points, 0) : 0;
  const weeklyGoal = goalData?.goal || 15;
  const progressPercentage = Math.min((currentPoints / weeklyGoal) * 100, 100);
  const tasksThisWeek = completedTasks.length;

  // Calculate task frequency for current week
  const taskFrequency = completedTasks.reduce((acc: Record<string, { count: number; totalPoints: number; taskName: string }>, task: CompletedTask) => {
    if (!acc[task.taskId]) {
      acc[task.taskId] = { count: 0, totalPoints: 0, taskName: task.name };
    }
    acc[task.taskId].count++;
    acc[task.taskId].totalPoints += task.points;
    return acc;
  }, {});

  const topTasks = Object.entries(taskFrequency)
    .map(([taskId, data]) => ({ taskId, ...data }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 3);

  // Calculate streaks and trends
  const recentWeeks = weeklyHistory.slice(-4);
  const averagePoints = recentWeeks.length > 0 
    ? recentWeeks.reduce((sum, week) => sum + week.totalPoints, 0) / recentWeeks.length 
    : 0;

  if (isAuthLoading || tasksLoading || historyLoading || goalLoading) {
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
              <div className="font-semibold text-blue-900">{formatWeekDisplay(currentWeek)}</div>
              {!isCurrentWeek && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={goToCurrentWeek}
                  className="text-xs text-blue-600 p-0 h-auto"
                >
                  Current week
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextWeek}
              disabled={isCurrentWeek}
              className="text-blue-700 border-blue-300 disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Current Week Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Points This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{currentPoints}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Weekly Goal</p>
                  <p className="text-2xl font-bold text-gray-900">{weeklyGoal}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tasks Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{tasksThisWeek}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Award className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(progressPercentage)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Goal Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Current: {currentPoints} points</span>
                <span>Goal: {weeklyGoal} points</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <p className="text-sm text-gray-600">
                {progressPercentage >= 100 
                  ? `🎉 Goal achieved! You exceeded your target by ${currentPoints - weeklyGoal} points.`
                  : `${weeklyGoal - currentPoints} points remaining to reach your goal.`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Top Tasks This Week */}
        {topTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Tasks This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topTasks.map((task, index) => (
                  <div key={task.taskId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <span className="font-medium">{task.taskName}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{task.totalPoints} points</div>
                      <div className="text-sm text-gray-500">{task.count} times</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly History */}
        {weeklyHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="text-left border-b">
                    <tr>
                      <th className="pb-2 font-medium">Week</th>
                      <th className="pb-2 font-medium text-right">Points</th>
                      <th className="pb-2 font-medium text-right">Tasks</th>
                      <th className="pb-2 font-medium text-right">Goal</th>
                      <th className="pb-2 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {weeklyHistory.slice(-8).reverse().map((week) => (
                      <tr key={week.id} className="hover:bg-gray-50">
                        <td className="py-2">{formatWeekDisplay(week.weekStartDate)}</td>
                        <td className="py-2 text-right font-medium">{week.totalPoints}</td>
                        <td className="py-2 text-right">{week.tasksCompleted}</td>
                        <td className="py-2 text-right">{week.weeklyGoal}</td>
                        <td className="py-2 text-center">
                          {week.goalAchieved ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Achieved
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Incomplete
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Insights */}
        {recentWeeks.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg text-blue-900">Performance Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-blue-800">
                <p>• <strong>Average weekly points:</strong> {Math.round(averagePoints)} over last {recentWeeks.length} weeks</p>
                <p>• <strong>Goal achievement rate:</strong> {Math.round((recentWeeks.filter(w => w.goalAchieved).length / recentWeeks.length) * 100)}% in recent weeks</p>
                <p>• <strong>Total tasks completed:</strong> {weeklyHistory.reduce((sum, week) => sum + week.tasksCompleted, 0)} all-time</p>
                <p>• <strong>Current vs average:</strong> {currentPoints > averagePoints ? 'Above' : currentPoints < averagePoints ? 'Below' : 'At'} average performance</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}