import React from "react";
import Layout from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your profile and preferences</p>
        </div>
        
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">User Settings</h3>
              <p className="text-gray-500">Profile management and preferences coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}