import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Share2, 
  Copy, 
  Trophy, 
  Target, 
  Calendar,
  User,
  GitFork,
  LogIn,
  TrendingUp,
  CheckCircle2,
  Star
} from "lucide-react";
import { useState } from "react";

export default function ShareView() {
  const { token } = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [copiedUrl, setCopiedUrl] = useState(false);

  const { data: share, isLoading } = useQuery({
    queryKey: ["/api/shares", token],
    enabled: !!token,
  });

  const forkMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/shares/${token}/fork`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`${response.status}: ${error.message || 'Fork failed'}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Setup forked successfully!",
        description: "The custom tasks have been added to your account.",
      });
      // Redirect to home or specific week
      window.location.href = "/";
    },
    onError: (error: any) => {
      if (error.message.includes("401")) {
        toast({
          title: "Sign in required",
          description: "Please sign in to fork this setup to your account.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to fork setup",
          description: "There was an error copying this setup to your account.",
          variant: "destructive",
        });
      }
    },
  });

  const copyShareUrl = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      toast({
        title: "Link copied!",
        description: "Share URL has been copied to clipboard.",
      });
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the share link.",
        variant: "destructive",
      });
    }
  };

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading shared progress...</p>
        </div>
      </div>
    );
  }

  if (!share) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Share2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Share Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This share link may have been removed or expired.
          </p>
          <Button onClick={() => window.location.href = "/"}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  const shareData = (share as any).data || {};
  const { completedTasks, taskStats, weekHistory, customTasks, dynamicGoal, totalPoints, tasksCompleted } = shareData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Road2Employment
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Shared Progress View
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyShareUrl}
                disabled={copiedUrl}
              >
                {copiedUrl ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedUrl ? "Copied!" : "Copy Link"}
              </Button>
              {!isAuthenticated && !authLoading && (
                <Button onClick={handleLogin} size="sm">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Share Info */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {(share as any).title || "Shared Progress"}
              </h2>
              {(share as any).description && (
                <p className="text-gray-600 dark:text-gray-400">
                  {(share as any).description}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Week of {(share as any).weekStartDate || "Unknown"}
            </Badge>
          </div>

          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
            <span className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              Shared by user
            </span>
            <span>•</span>
            <span>
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Fork CTA for unauthenticated users */}
        {!isAuthenticated && !authLoading && (
          <Alert className="mb-8 border-blue-200 bg-blue-50 dark:bg-blue-950">
            <GitFork className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <strong>Like this setup?</strong> Sign in to fork these custom tasks and tracking system to your own account.
                </div>
                <Button onClick={handleLogin} size="sm" className="ml-4">
                  Sign In to Fork
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Fork CTA for authenticated users */}
        {isAuthenticated && (
          <Alert className="mb-8 border-green-200 bg-green-50 dark:bg-green-950">
            <GitFork className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <strong>Fork this setup?</strong> Copy the custom tasks and tracking configuration to your own account.
                </div>
                <Button 
                  onClick={() => forkMutation.mutate()}
                  disabled={forkMutation.isPending}
                  size="sm" 
                  className="ml-4"
                >
                  {forkMutation.isPending ? "Forking..." : "Fork Setup"}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {totalPoints}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tasks Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {tasksCompleted}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Weekly Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {dynamicGoal}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Goal Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {Math.round((totalPoints / dynamicGoal) * 100)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Completed Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
                Completed Tasks ({completedTasks.length})
              </CardTitle>
              <CardDescription>
                Activities completed during this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedTasks.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No tasks completed this week
                </p>
              ) : (
                <div className="space-y-3">
                  {completedTasks.map((task: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {task.name}
                        </h4>
                        {task.note && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {task.note}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(task.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        +{task.points}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custom Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-600" />
                Custom Tasks ({customTasks.length})
              </CardTitle>
              <CardDescription>
                Personalized activities for this user's goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customTasks.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No custom tasks configured
                </p>
              ) : (
                <div className="space-y-3">
                  {customTasks.map((task: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {task.name}
                        </h4>
                        <Badge variant="outline" style={{ color: task.color }}>
                          {task.points} pts
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {task.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Call to action footer */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Ready to Track Your Own Progress?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                Start your own momentum tracking journey with Road2Employment. 
                Set goals, track activities, and build the habits that lead to career success.
              </p>
              {!isAuthenticated ? (
                <Button onClick={handleLogin} size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Get Started Free
                </Button>
              ) : (
                <Button onClick={() => window.location.href = "/"} size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Go to Your Dashboard
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}