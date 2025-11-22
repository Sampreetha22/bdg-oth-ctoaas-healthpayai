import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EvvStatusIndicator } from "@/components/evv-status-indicator";
import { RiskScoreBadge } from "@/components/risk-score-badge";
import { MapPin, FileDown, Calendar, ArrowUpDown } from "lucide-react";
import { formatDate } from "date-fns";
import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SortKey = "claimId" | "providerName" | "memberName" | "serviceDate" | "evvStatus" | "distance" | "riskScore" | "pathway";
type SortDirection = "asc" | "desc";

export default function EvvIntelligence() {
  const [activeTab, setActiveTab] = useState("not-visited");
  const [sortKey, setSortKey] = useState<SortKey>("riskScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      // Default to ascending for text columns, descending for numeric/score columns
      const ascendingFirstColumns: SortKey[] = ["claimId", "providerName", "memberName", "serviceDate", "evvStatus", "pathway"];
      setSortDirection(ascendingFirstColumns.includes(key) ? "asc" : "desc");
    }
  };

  const { data: notVisited, isLoading: nvLoading } = useQuery({
    queryKey: ["/api/evv/not-visited"],
  });

  const { data: overlaps, isLoading: overlapLoading } = useQuery({
    queryKey: ["/api/evv/service-overlap"],
  });

  const { data: missed, isLoading: missedLoading } = useQuery({
    queryKey: ["/api/evv/missed-visits"],
  });

  const sortedCases = useMemo(() => {
    if (!notVisited?.cases) return [];
    
    const sorted = [...notVisited.cases].sort((a: any, b: any) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        const comparison = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
        return sortDirection === "asc" ? comparison : -comparison;
      }
      
      // Numeric comparison
      if (aVal === bVal) return 0;
      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return sorted;
  }, [notVisited?.cases, sortKey, sortDirection]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="heading-evv-intelligence">
            EVV Pattern Intelligence
          </h1>
          <p className="text-muted-foreground">
            Electronic Visit Verification analysis with GPS validation and incident correlation
          </p>
        </div>
        <Button variant="outline" data-testid="button-export-evv">
          <FileDown className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Billed But Not Visited</CardTitle>
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-mono font-semibold">{notVisited?.totalCount || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">
              ${(notVisited?.totalAmount || 0).toLocaleString()} at risk
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Service Overlaps</CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-mono font-semibold">{overlaps?.totalCount || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Scheduling conflicts detected</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Missed Visits</CardTitle>
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-mono font-semibold">{missed?.totalCount || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Without incident reports</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="not-visited" data-testid="tab-not-visited">
            Billed But Not Visited
          </TabsTrigger>
          <TabsTrigger value="overlaps" data-testid="tab-overlaps">
            Service Overlaps
          </TabsTrigger>
          <TabsTrigger value="missed" data-testid="tab-missed">
            Missed Visits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="not-visited" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>GPS Mismatch Detection</CardTitle>
            </CardHeader>
            <CardContent>
              {nvLoading ? (
                <Skeleton className="h-64" />
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
                            onClick={() => handleSort("claimId")}
                            data-testid="sort-claim-id"
                          >
                            Claim ID
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
                            onClick={() => handleSort("serviceDate")}
                            data-testid="sort-date"
                          >
                            Service Date
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover-elevate"
                            onClick={() => handleSort("evvStatus")}
                            data-testid="sort-status"
                          >
                            EVV Status
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover-elevate"
                            onClick={() => handleSort("distance")}
                            data-testid="sort-distance"
                          >
                            Distance
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
                        <TableRow key={item.id} data-testid={`evv-row-${item.id}`}>
                          <TableCell className="font-mono text-sm">{item.claimId}</TableCell>
                          <TableCell>{item.providerName}</TableCell>
                          <TableCell>{item.memberName}</TableCell>
                          <TableCell className="text-sm">
                            {formatDate(new Date(item.serviceDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <EvvStatusIndicator status={item.evvStatus} />
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {item.distance > 0 ? `${item.distance} mi` : "N/A"}
                          </TableCell>
                          <TableCell>
                            <RiskScoreBadge score={item.riskScore} size="sm" />
                          </TableCell>
                          <TableCell className="text-sm">{item.pathway}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overlaps" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Simultaneous Service Detection</CardTitle>
            </CardHeader>
            <CardContent>
              {overlapLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead>Claim ID</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Service Date</TableHead>
                        <TableHead>EVV Status</TableHead>
                        <TableHead>Risk</TableHead>
                        <TableHead>Pathway</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overlaps?.cases?.map((item: any) => (
                        <TableRow key={item.id} data-testid={`overlap-row-${item.id}`}>
                          <TableCell className="font-mono text-sm">{item.claimId}</TableCell>
                          <TableCell>{item.providerName}</TableCell>
                          <TableCell>{item.memberName}</TableCell>
                          <TableCell className="text-sm">
                            {formatDate(new Date(item.serviceDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <EvvStatusIndicator status={item.evvStatus} />
                          </TableCell>
                          <TableCell>
                            <RiskScoreBadge score={item.riskScore} size="sm" />
                          </TableCell>
                          <TableCell className="text-sm">{item.pathway}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="missed" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Unreported Missed Visits</CardTitle>
            </CardHeader>
            <CardContent>
              {missedLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead>Claim ID</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Service Date</TableHead>
                        <TableHead>EVV Status</TableHead>
                        <TableHead>Risk</TableHead>
                        <TableHead>Pathway</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {missed?.cases?.map((item: any) => (
                        <TableRow key={item.id} data-testid={`missed-row-${item.id}`}>
                          <TableCell className="font-mono text-sm">{item.claimId}</TableCell>
                          <TableCell>{item.providerName}</TableCell>
                          <TableCell>{item.memberName}</TableCell>
                          <TableCell className="text-sm">
                            {formatDate(new Date(item.serviceDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <EvvStatusIndicator status={item.evvStatus} />
                          </TableCell>
                          <TableCell>
                            <RiskScoreBadge score={item.riskScore} size="sm" />
                          </TableCell>
                          <TableCell className="text-sm">{item.pathway}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
