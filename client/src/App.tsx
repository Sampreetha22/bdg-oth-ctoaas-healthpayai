import { type CSSProperties, type ReactNode, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavigationProvider } from "@/lib/navigation-context";
import { BreadcrumbTrail } from "@/components/breadcrumb-trail";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import Dashboard from "@/pages/dashboard";
import ClaimAnomaly from "@/pages/claim-anomaly";
import EvvIntelligence from "@/pages/evv-intelligence";
import ProviderProfiling from "@/pages/provider-profiling";
import BenefitUtilization from "@/pages/benefit-utilization";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) navigate("/login", { replace: true });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/claim-anomaly" component={() => <RequireAuth><ClaimAnomaly /></RequireAuth>} />
      <Route path="/evv-intelligence" component={() => <RequireAuth><EvvIntelligence /></RequireAuth>} />
      <Route path="/provider-profiling" component={() => <RequireAuth><ProviderProfiling /></RequireAuth>} />
      <Route path="/benefit-utilization" component={() => <RequireAuth><BenefitUtilization /></RequireAuth>} />
      <Route path="/reports" component={() => <RequireAuth><Reports /></RequireAuth>} />
      <Route path="/login" component={Login} />
      <Route component={() => <RequireAuth><NotFound /></RequireAuth>} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isLoginRoute = location === "/login";
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light">
          <NavigationProvider>
            <TooltipProvider>
              {isLoginRoute ? (
                <Login />
              ) : (
                <SidebarProvider style={style as CSSProperties}>
                  <div className="flex h-screen w-full">
                    <AppSidebar />
                    <div className="flex flex-col flex-1">
                      <header className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-2">
                          <SidebarTrigger data-testid="button-sidebar-toggle" />
                          <ThemeToggle />
                        </div>
                        <LogoutButton />
                      </header>
                      <BreadcrumbTrail />
                      <main className="flex-1 overflow-auto">
                        <Router />
                      </main>
                    </div>
                  </div>
                </SidebarProvider>
              )}
              <Toaster />
            </TooltipProvider>
          </NavigationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;

function LogoutButton() {
  const { isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (!isAuthenticated) return null;

  return (
    <Button size="sm" variant="outline" onClick={handleLogout}>
      Log out
    </Button>
  );
}
