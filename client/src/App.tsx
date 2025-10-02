import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoginPage } from "@/components/LoginPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import DriverPage from "@/pages/DriverPage";
import NotFound from "@/pages/not-found";
import type { User } from "@shared/schema";

function Router() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setLocation(userData.role === "admin" ? "/admin" : "/driver");
        }
      } catch (error) {
        console.log("No active session");
      } finally {
        setIsChecking(false);
      }
    };
    checkSession();
  }, [setLocation]);

  const handleLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setLocation(authenticatedUser.role === "admin" ? "/admin" : "/driver");
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setUser(null);
      setLocation("/");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still clear local state even if API call fails
      setUser(null);
      setLocation("/");
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Switch>
      <Route path="/admin">
        {user.role === "admin" ? <AdminDashboardPage user={user} onLogout={handleLogout} /> : <NotFound />}
      </Route>
      <Route path="/driver">
        {user.role === "driver" ? <DriverPage user={user} onLogout={handleLogout} /> : <NotFound />}
      </Route>
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
