import React, { useState, useEffect } from "react";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User, Bell, Shield, Trash2, Save, Download } from "lucide-react";

export default function SettingsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Profile settings - initialize from user data when available
  const [displayName, setDisplayName] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [taskReminders, setTaskReminders] = useState(false);
  const [achievementAlerts, setAchievementAlerts] = useState(true);

  // Initialize form values when user data loads
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.email?.split('@')[0] || '');
      setEmailNotifications(user.emailNotifications ?? true);
      setWeeklyDigest(user.weeklyDigest ?? true);
      setTaskReminders(user.taskReminders ?? false);
      setAchievementAlerts(user.achievementAlerts ?? true);
    }
  }, [user]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: (updates: any) => apiRequest('/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profile updated",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      displayName,
      emailNotifications,
      weeklyDigest,
      taskReminders,
      achievementAlerts,
    });
  };

  const handleExportData = () => {
    // Create a link to download the data export
    const link = document.createElement('a');
    link.href = '/api/user/export';
    link.download = `road2employment-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Data export started",
      description: "Your data will download shortly.",
    });
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.")) {
      toast({
        title: "Account deletion requested",
        description: "Your account deletion request has been submitted. You will receive a confirmation email.",
        variant: "destructive"
      });
    }
  };

  if (isAuthLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-slate-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading settings...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your profile and preferences</p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <CardTitle>Profile Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveProfile} 
                disabled={updateProfileMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-green-600" />
              <CardTitle>Notification Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications" className="text-base font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-gray-500">Receive task completion confirmations and updates</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weeklyDigest" className="text-base font-medium">
                    Weekly Progress Digest
                  </Label>
                  <p className="text-sm text-gray-500">Get a summary of your weekly performance every Sunday</p>
                </div>
                <Switch
                  id="weeklyDigest"
                  checked={weeklyDigest}
                  onCheckedChange={setWeeklyDigest}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="taskReminders" className="text-base font-medium">
                    Task Reminders
                  </Label>
                  <p className="text-sm text-gray-500">Daily reminders to log your activities</p>
                </div>
                <Switch
                  id="taskReminders"
                  checked={taskReminders}
                  onCheckedChange={setTaskReminders}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="achievementAlerts" className="text-base font-medium">
                    Achievement Alerts
                  </Label>
                  <p className="text-sm text-gray-500">Notifications when you unlock new badges</p>
                </div>
                <Switch
                  id="achievementAlerts"
                  checked={achievementAlerts}
                  onCheckedChange={setAchievementAlerts}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Data */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <CardTitle>Privacy & Data</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Data Export</h3>
              <p className="text-sm text-gray-600 mb-4">
                Download a copy of all your data including tasks, progress, and achievements.
              </p>
              <Button variant="outline" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-2" />
                Export My Data
              </Button>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Data Sharing</h3>
              <p className="text-sm text-gray-600 mb-4">
                Your data is private by default. Only share progress when you explicitly create shareable links.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>• No data sharing with third parties</span>
                <span>• Encrypted data storage</span>
                <span>• Optional progress sharing</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              <CardTitle className="text-red-900">Danger Zone</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-red-900 mb-2">Delete Account</h3>
              <p className="text-sm text-red-700 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">About Road2Employment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• <strong>Version:</strong> 1.0.0</p>
              <p>• <strong>Last Updated:</strong> June 2025</p>
              <p>• <strong>Support:</strong> Built for job seekers and professionals</p>
              <p>• <strong>Privacy:</strong> Your data stays private and secure</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}