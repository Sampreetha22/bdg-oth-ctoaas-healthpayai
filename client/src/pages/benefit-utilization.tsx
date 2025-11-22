import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RiskScoreBadge } from "@/components/risk-score-badge";
import { Activity, FileDown, TrendingDown, ArrowUpDown } from "lucide-react";
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
import { useState, useMemo } from "react";

type SortKey = "memberName" | "providerName" | "sessionCount" | "initialPhq9" | "currentPhq9" | "change" | "riskScore" | "pathway";
type SortDirection = "asc" | "desc";

export default function BenefitUtilization() {
  const { data: overutilization, isLoading } = useQuery({
    queryKey: ["/api/benefit-utilization/overutilization"],
  });
  
  const [sortKey, setSortKey] = useState<SortKey>("riskScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const sortedCases = useMemo(() => {
    if (!overutilization?.cases) return [];
    
    const sorted = [...overutilization.cases].sort((a: any, b: any) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        const comparison = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
        return sortDirection === "asc" ? comparison : -comparison;
      }
      
      // Numeric comparison
      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return sorted;
  }, [overutilization?.cases, sortKey, sortDirection]);

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
            <CardTitle className="text-sm">Overutilization Claims</CardTitle>
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
            <p className="text-sm text-muted-foreground mt-1">Across flagged claims</p>
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
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover-elevate"
                        onClick={() => handleSort("memberName")}
                        data-testid="sort-member"
                      >
                        Member
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover-elevate"
                        onClick={() => handleSort("providerName")}
                        data-testid="sort-provider"
                      >
                        Provider
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover-elevate"
                        onClick={() => handleSort("sessionCount")}
                        data-testid="sort-sessions"
                      >
                        Session Count
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover-elevate"
                        onClick={() => handleSort("initialPhq9")}
                        data-testid="sort-initial-phq9"
                      >
                        Initial PHQ-9
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover-elevate"
                        onClick={() => handleSort("currentPhq9")}
                        data-testid="sort-current-phq9"
                      >
                        Current PHQ-9
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover-elevate"
                        onClick={() => handleSort("change")}
                        data-testid="sort-change"
                      >
                        Change
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover-elevate"
                        onClick={() => handleSort("riskScore")}
                        data-testid="sort-risk"
                      >
                        Risk
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover-elevate"
                        onClick={() => handleSort("pathway")}
                        data-testid="sort-pathway"
                      >
                        Pathway
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCases.map((item: any) => (
                    <TableRow 
                      key={item.id} 
                      className="hover-elevate cursor-pointer"
                      data-testid={`utilization-row-${item.id}`}
                    >
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
