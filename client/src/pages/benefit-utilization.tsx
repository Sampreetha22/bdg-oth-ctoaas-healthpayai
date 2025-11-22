import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RiskScoreBadge } from "@/components/risk-score-badge";
import { Activity, FileDown, TrendingDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

export default function BenefitUtilization() {
  const { data: overutilization, isLoading } = useQuery({
    queryKey: ["/api/benefit-utilization/overutilization"],
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="heading-benefit-utilization">
            Benefit Utilization vs Clinical Outcomes
          </h1>
          <p className="text-muted-foreground">
            Analysis of service volume effectiveness and clinical outcome correlation
          </p>
        </div>
        <Button variant="outline" data-testid="button-export-utilization">
          <FileDown className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Overutilization Cases</CardTitle>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-mono font-semibold">
              {overutilization?.totalCases || 0}
            </p>
            <p className="text-sm text-muted-foreground mt-1">High volume, flat outcomes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Avg PHQ-9 Change</CardTitle>
            <TrendingDown className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-mono font-semibold">
              {overutilization?.avgPhq9Change || 0}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Across flagged cases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Avg Sessions</CardTitle>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-mono font-semibold">
              {overutilization?.avgSessions || 0}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Per flagged member</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overutilization Without Outcome Gain</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Session Count</TableHead>
                  <TableHead>Initial PHQ-9</TableHead>
                  <TableHead>Current PHQ-9</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Pathway</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overutilization?.cases?.map((item: any) => (
                  <TableRow key={item.id} data-testid={`utilization-row-${item.id}`}>
                    <TableCell>{item.memberName}</TableCell>
                    <TableCell>{item.providerName}</TableCell>
                    <TableCell className="font-mono">{item.sessionCount}</TableCell>
                    <TableCell className="font-mono">{item.initialPhq9}</TableCell>
                    <TableCell className="font-mono">{item.currentPhq9}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className={cn(
                          "font-mono text-sm",
                          item.change > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                        )}>
                          {item.change > 0 ? "+" : ""}{item.change}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RiskScoreBadge score={item.riskScore} size="sm" />
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.pathway === "fraud" ? "destructive" : "secondary"}>
                        {item.pathway}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
