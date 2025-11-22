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
import { exportToCSV } from "@/lib/exportUtils";
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
  const [overlapSortKey, setOverlapSortKey] = useState<SortKey>("riskScore");
  const [overlapSortDirection, setOverlapSortDirection] = useState<SortDirection>("desc");
  const [missedSortKey, setMissedSortKey] = useState<SortKey>("riskScore");
  const [missedSortDirection, setMissedSortDirection] = useState<SortDirection>("desc");

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

  const handleOverlapSort = (key: SortKey) => {
    if (overlapSortKey === key) {
      setOverlapSortDirection(overlapSortDirection === "asc" ? "desc" : "asc");
    } else {
      setOverlapSortKey(key);
      const ascendingFirstColumns: SortKey[] = ["claimId", "providerName", "memberName", "serviceDate", "evvStatus", "pathway"];
      setOverlapSortDirection(ascendingFirstColumns.includes(key) ? "asc" : "desc");
    }
  };

  const handleMissedSort = (key: SortKey) => {
    if (missedSortKey === key) {
      setMissedSortDirection(missedSortDirection === "asc" ? "desc" : "asc");
    } else {
      setMissedSortKey(key);
      const ascendingFirstColumns: SortKey[] = ["claimId", "providerName", "memberName", "serviceDate", "evvStatus", "pathway"];
      setMissedSortDirection(ascendingFirstColumns.includes(key) ? "asc" : "desc");
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

  const sortData = (data: any[], key: SortKey, direction: SortDirection) => {
    if (!data) return [];
    return [...data].sort((a: any, b: any) => {
      let aVal = a[key];
      let bVal = b[key];
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        const comparison = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
        return direction === "asc" ? comparison : -comparison;
      }
      
      if (aVal === bVal) return 0;
      if (direction === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  };

  const sortedCases = useMemo(() => 
    sortData(notVisited?.cases || [], sortKey, sortDirection),
    [notVisited?.cases, sortKey, sortDirection]
  );

  const sortedOverlaps = useMemo(() => 
    sortData(overlaps?.cases || [], overlapSortKey, overlapSortDirection),
    [overlaps?.cases, overlapSortKey, overlapSortDirection]
  );

  const sortedMissed = useMemo(() => 
    sortData(missed?.cases || [], missedSortKey, missedSortDirection),
    [missed?.cases, missedSortKey, missedSortDirection]
  );

  const handleExport = () => {
    let data: any[] = [];
    let filename = "";
    const columns = [
      { key: "claimId", label: "Claim ID" },
      { key: "providerName", label: "Provider" },
      { key: "memberName", label: "Member" },
      { key: "serviceDate", label: "Service Date" },
      { key: "evvStatus", label: "EVV Status" },
      { key: "distance", label: "Distance (mi)" },
      { key: "riskScore", label: "Risk Score" },
    ];

    if (activeTab === "not-visited") {
      data = sortedCases;
      filename = "billed-not-visited-claims";
    } else if (activeTab === "overlaps") {
      data = sortedOverlaps;
      filename = "service-overlap-claims";
    } else if (activeTab === "missed") {
      data = sortedMissed;
      filename = "missed-visits-claims";
    }

    exportToCSV(data, filename, columns);
  };

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
        <Button variant="outline" onClick={handleExport} data-testid="button-export-evv">
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
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover-elevate"
                            onClick={() => handleOverlapSort("claimId")}
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
                            onClick={() => handleOverlapSort("providerName")}
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
                            onClick={() => handleOverlapSort("memberName")}
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
                            onClick={() => handleOverlapSort("serviceDate")}
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
                            onClick={() => handleOverlapSort("evvStatus")}
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
                            onClick={() => handleOverlapSort("riskScore")}
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
                            onClick={() => handleOverlapSort("pathway")}
                          >
                            Pathway
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedOverlaps.map((item: any) => (
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
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover-elevate"
                            onClick={() => handleMissedSort("claimId")}
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
                            onClick={() => handleMissedSort("providerName")}
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
                            onClick={() => handleMissedSort("memberName")}
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
                            onClick={() => handleMissedSort("serviceDate")}
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
                            onClick={() => handleMissedSort("evvStatus")}
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
                            onClick={() => handleMissedSort("riskScore")}
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
                            onClick={() => handleMissedSort("pathway")}
                          >
                            Pathway
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedMissed.map((item: any) => (
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
