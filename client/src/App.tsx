import { Switch, Route } from "wouter";
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
import Dashboard from "@/pages/dashboard";
import ClaimAnomaly from "@/pages/claim-anomaly";
import EvvIntelligence from "@/pages/evv-intelligence";
import ProviderProfiling from "@/pages/provider-profiling";
import BenefitUtilization from "@/pages/benefit-utilization";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/claim-anomaly" component={ClaimAnomaly} />
      <Route path="/evv-intelligence" component={EvvIntelligence} />
      <Route path="/provider-profiling" component={ProviderProfiling} />
      <Route path="/benefit-utilization" component={BenefitUtilization} />
      <Route path="/reports" component={Reports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <NavigationProvider>
          <TooltipProvider>
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1">
                  <header className="flex items-center justify-between p-4 border-b">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <ThemeToggle />
                  </header>
                  <BreadcrumbTrail />
                  <main className="flex-1 overflow-auto">
                    <Router />
                  </main>
                </div>
              </div>
            </SidebarProvider>
            <Toaster />
          </TooltipProvider>
        </NavigationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
