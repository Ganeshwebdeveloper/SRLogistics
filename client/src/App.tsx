import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoginPage } from "@/components/LoginPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import DriverPage from "@/pages/DriverPage";
import NotFound from "@/pages/not-found";

function Router() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "driver">("admin");

  const handleLogin = (email: string, password: string, role: "admin" | "driver") => {
    setIsAuthenticated(true);
    setUserRole(role);
    setLocation(role === "admin" ? "/admin" : "/driver");
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Switch>
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/driver" component={DriverPage} />
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
