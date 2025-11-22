import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/metric-card";
import { AlertCard } from "@/components/alert-card";
import { RiskScoreBadge } from "@/components/risk-score-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  FileText,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { DashboardMetrics } from "@shared/schema";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: recentAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-alerts"],
  });

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2" data-testid="heading-dashboard">
          Executive Dashboard
        </h1>
        <p className="text-muted-foreground">
          Comprehensive view of fraud, waste, and abuse detection across all modules
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total FWA Detected"
          value={`$${(metrics?.totalAmount || 0).toLocaleString()}`}
          trend={metrics?.recoveryRate}
          trendLabel="recovery rate"
          icon={<DollarSign className="h-5 w-5" />}
          testId="metric-total-fwa"
        />
        <MetricCard
          title="Active Investigations"
          value={metrics?.activeInvestigations || 0}
          subtitle="Cases under review"
          icon={<FileText className="h-5 w-5" />}
          testId="metric-active-investigations"
        />
        <MetricCard
          title="High-Risk Claims"
          value={metrics?.highRiskClaims || 0}
          subtitle="Requiring immediate action"
          icon={<AlertTriangle className="h-5 w-5" />}
          testId="metric-high-risk-claims"
        />
        <MetricCard
          title="Detection Cases"
          value={metrics?.totalFwaDetected || 0}
          trend={15}
          trendLabel="vs last month"
          icon={<BarChart3 className="h-5 w-5" />}
          testId="metric-detection-cases"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
            {alertsLoading ? (
              <Skeleton className="h-24" />
            ) : recentAlerts && recentAlerts.length > 0 ? (
              recentAlerts.slice(0, 5).map((alert: any) => (
                <AlertCard
                  key={alert.id}
                  id={alert.id}
                  type={alert.alertType}
                  riskLevel={alert.riskLevel}
                  providerName={alert.providerName}
                  message={alert.message}
                  detectedAt={new Date(alert.detectedAt)}
                  onView={(id) => setLocation(`/alert/${id}`)}
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No recent alerts</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>FWA by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics?.categoryBreakdown || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(metrics?.categoryBreakdown || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detection Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics?.detectionTrend || []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                name="Cases"
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                name="Amount ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Risk Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics?.topRiskProviders?.slice(0, 5).map((provider: any) => (
              <div
                key={provider.id}
                className="flex items-center justify-between p-3 border rounded-md hover-elevate cursor-pointer"
                onClick={() => setLocation(`/provider/${provider.id}`)}
                data-testid={`provider-${provider.id}`}
              >
                <div className="flex-1">
                  <p className="font-medium">{provider.name}</p>
                  <p className="text-sm text-muted-foreground">{provider.specialty}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-mono">{provider.alertCount} alerts</p>
                    <p className="text-xs text-muted-foreground">
                      ${Number(provider.avgClaimAmount).toLocaleString()} avg
                    </p>
                  </div>
                  <RiskScoreBadge score={provider.riskScore} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
