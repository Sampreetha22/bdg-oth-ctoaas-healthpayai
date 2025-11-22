import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RiskScoreBadge } from "@/components/risk-score-badge";
import {
  AlertTriangle,
  FileText,
  Users,
  TrendingUp,
  AlertCircle,
  MapPin,
  Zap,
  BarChart3,
} from "lucide-react";
import { useLocation } from "wouter";
import type { DashboardMetrics } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: recentAlerts } = useQuery({
    queryKey: ["/api/dashboard/recent-alerts"],
  });

  // Signal card definitions mapping to FWA detection modules
  const signalCards = [
    {
      id: "duplicate-billing",
      title: "Duplicate Billing",
      icon: AlertTriangle,
      color: "red",
      count: metrics?.totalFwaDetected ? Math.floor(metrics.totalFwaDetected * 0.15) : 0,
      description: "Claims submitted multiple times for the same service, indicating systematic overbilling patterns",
      route: "/claim-anomaly",
    },
    {
      id: "evv-discrepancies",
      title: "EVV Discrepancies",
      icon: MapPin,
      color: "red",
      count: metrics?.totalFwaDetected ? Math.floor(metrics.totalFwaDetected * 0.25) : 0,
      description: "Electronic Visit Verification mismatches, phantom visits, and location fraud indicators",
      route: "/evv-intelligence",
    },
    {
      id: "provider-anomalies",
      title: "Provider Anomalies",
      icon: Zap,
      color: "orange",
      count: metrics?.totalFwaDetected ? Math.floor(metrics.totalFwaDetected * 0.35) : 0,
      description: "Unusual billing patterns, statistical outliers, and behavioral risk indicators from provider profiling",
      route: "/provider-profiling",
    },
    {
      id: "utilization-outcomes",
      title: "Utilization vs Outcomes",
      icon: BarChart3,
      color: "orange",
      count: metrics?.totalFwaDetected ? Math.floor(metrics.totalFwaDetected * 0.25) : 0,
      description: "Service utilization exceeding clinical outcomes, over-treatment patterns, and benefit abuse signals",
      route: "/benefit-utilization",
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "red":
        return "bg-red-950/20 border-red-900/30 text-red-400";
      case "orange":
        return "bg-orange-950/20 border-orange-900/30 text-orange-400";
      case "blue":
        return "bg-blue-950/20 border-blue-900/30 text-blue-400";
      case "green":
        return "bg-green-950/20 border-green-900/30 text-green-400";
      default:
        return "bg-slate-900/20 border-slate-800/30 text-slate-400";
    }
  };

  const getCountBgColor = (color: string) => {
    switch (color) {
      case "red":
        return "bg-red-500/20 text-red-400";
      case "orange":
        return "bg-orange-500/20 text-orange-400";
      case "blue":
        return "bg-blue-500/20 text-blue-400";
      case "green":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Compliance Violations */}
        <Card
          className="border-red-900/30 bg-slate-950/50 hover-elevate cursor-pointer"
          onClick={() => setLocation("/claim-anomaly")}
          data-testid="summary-card-violations"
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Compliance Violations
              </span>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <div className="text-3xl font-mono font-bold text-red-400" data-testid="text-violations-count">
              {metrics?.totalFwaDetected || 0}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>High-risk patterns detected</span>
            </div>
          </CardContent>
        </Card>

        {/* Audit Findings */}
        <Card
          className="border-orange-900/30 bg-slate-950/50 hover-elevate cursor-pointer"
          onClick={() => setLocation("/evv-intelligence")}
          data-testid="summary-card-findings"
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Audit Findings
              </span>
              <FileText className="h-4 w-4 text-orange-400" />
            </div>
            <div className="text-3xl font-mono font-bold text-orange-400" data-testid="text-findings-count">
              {metrics?.activeInvestigations || 0}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Cases under review</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Members */}
        <Card
          className="border-blue-900/30 bg-slate-950/50 hover-elevate cursor-pointer"
          onClick={() => setLocation("/provider-profiling")}
          data-testid="summary-card-members"
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Active Members
              </span>
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-3xl font-mono font-bold text-blue-400" data-testid="text-members-count">
              {metrics?.highRiskClaims || 0}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Analyzed this period</span>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Rate */}
        <Card
          className="border-green-900/30 bg-slate-950/50 hover-elevate cursor-pointer"
          onClick={() => setLocation("/benefit-utilization")}
          data-testid="summary-card-compliance"
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Compliance Rate
              </span>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
            <div className="text-3xl font-mono font-bold text-green-400" data-testid="text-compliance-rate">
              {((metrics?.recoveryRate || 0) * 100).toFixed(1)}%
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Network performance</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FWA Detection - Signal Categories */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold" data-testid="heading-signal-categories">
            FWA Detection - Signal Categories
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Click any category to explore detected patterns and drill down into specific cases
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {signalCards.map((card) => {
            const Icon = card.icon;
            const getBorderColor = (color: string) => {
              switch (color) {
                case "red":
                  return "border-l-red-500";
                case "orange":
                  return "border-l-orange-500";
                case "blue":
                  return "border-l-blue-500";
                case "green":
                  return "border-l-green-500";
                default:
                  return "border-l-slate-500";
              }
            };

            const getCountBadgeColor = (color: string) => {
              switch (color) {
                case "red":
                  return "bg-red-500 text-white border-0";
                case "orange":
                  return "bg-orange-500 text-white border-0";
                case "blue":
                  return "bg-blue-500 text-white border-0";
                case "green":
                  return "bg-green-500 text-white border-0";
                default:
                  return "bg-slate-500 text-white border-0";
              }
            };

            return (
              <Card
                key={card.id}
                className={`border-l-4 hover-elevate cursor-pointer transition-all ${getColorClasses(card.color)} ${getBorderColor(card.color)}`}
                onClick={() => setLocation(card.route)}
                data-testid={`signal-card-${card.id}`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-md ${getCountBgColor(card.color)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-sm" data-testid={`text-signal-title-${card.id}`}>
                        {card.title}
                      </h3>
                    </div>
                    <Badge
                      className={getCountBadgeColor(card.color)}
                      data-testid={`badge-signal-count-${card.id}`}
                    >
                      {card.count}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed" data-testid={`text-signal-description-${card.id}`}>
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Alerts Section */}
      {recentAlerts && recentAlerts.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold" data-testid="heading-recent-alerts">
              Recent Critical Alerts
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {recentAlerts.slice(0, 6).map((alert: any) => (
              <Card
                key={alert.id}
                className="border-slate-800 hover-elevate cursor-pointer"
                onClick={() => setLocation(`/claim-anomaly`)}
                data-testid={`alert-card-${alert.id}`}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={alert.riskLevel === "high" ? "destructive" : "secondary"}>
                      {alert.alertType.replace(/_/g, " ")}
                    </Badge>
                    <RiskScoreBadge score={alert.riskScore} size="sm" />
                  </div>
                  <p className="text-sm font-medium" data-testid={`text-alert-provider-${alert.id}`}>
                    {alert.providerName}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid={`text-alert-message-${alert.id}`}>
                    {alert.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(alert.detectedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
