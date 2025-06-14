import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import TasksPage from "@/pages/tasks";
import ProgressPage from "@/pages/progress";
import BadgesPage from "@/pages/badges";
import SettingsPage from "@/pages/settings";
import Landing from "@/pages/landing";
import ShareView from "./pages/share-view";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Check for demo mode in URL
  const urlParams = new URLSearchParams(window.location.search);
  const isDemoMode = urlParams.has('demo');

  return (
    <Switch>
      {isDemoMode ? (
        <>
          <Route path="/" component={() => <Redirect to="/dashboard" />} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/tasks" component={TasksPage} />
          <Route path="/progress" component={ProgressPage} />
          <Route path="/badges" component={BadgesPage} />
          <Route path="/settings" component={SettingsPage} />
        </>
      ) : isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={() => <Redirect to="/dashboard" />} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/tasks" component={TasksPage} />
          <Route path="/progress" component={ProgressPage} />
          <Route path="/badges" component={BadgesPage} />
          <Route path="/settings" component={SettingsPage} />
        </>
      )}
      <Route path="/share/:token" component={ShareView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
