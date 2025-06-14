import React from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  CheckSquare, 
  BarChart3, 
  Award, 
  Settings, 
  Target,
  LogOut 
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { 
      path: "/dashboard", 
      label: "Dashboard", 
      icon: LayoutDashboard,
      description: "Overview & progress"
    },
    { 
      path: "/tasks", 
      label: "Tasks", 
      icon: CheckSquare,
      description: "Manage activities"
    },
    { 
      path: "/progress", 
      label: "Progress", 
      icon: BarChart3,
      description: "Statistics & history"
    },
    { 
      path: "/badges", 
      label: "Badges", 
      icon: Award,
      description: "Achievements & milestones"
    },
    { 
      path: "/settings", 
      label: "Settings", 
      icon: Settings,
      description: "Profile & preferences"
    }
  ];

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard">
                <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <Target className="h-8 w-8 text-blue-600" />
                  <span className="text-xl font-bold text-gray-900">Road2Employment</span>
                </div>
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <span className="text-sm text-gray-600 hidden sm:block">
                    {(user as any)?.email || 'User'}
                  </span>
                  <Button
                    onClick={() => window.location.href = '/api/logout'}
                    variant="outline"
                    size="sm"
                    className="text-sm"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {navItems.map(({ path, label, icon: Icon, description }) => (
              <Link key={path} href={path}>
                <div
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                    isActive(path)
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  title={description}
                >
                  <Icon className="w-5 h-5" />
                  <span className="whitespace-nowrap">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}