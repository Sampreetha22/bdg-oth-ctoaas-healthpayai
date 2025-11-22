import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskScoreBadge } from "@/components/risk-score-badge";
import { Badge } from "@/components/ui/badge";
import { Search, FileDown, TrendingUp, Clock, Code, X, ArrowUpDown } from "lucide-react";
import { useState, useMemo } from "react";
import { exportToCSV } from "@/lib/exportUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SortKey = "name" | "npi" | "specialty" | "totalClaims" | "avgClaimAmount" | "alertCount" | "riskScore" | "networkStatus";
type SortDirection = "asc" | "desc";

export default function ProviderProfiling() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("riskScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      // Default to ascending for text columns, descending for numeric/score columns
      const ascendingFirstColumns: SortKey[] = ["name", "npi", "specialty", "networkStatus"];
      setSortDirection(ascendingFirstColumns.includes(key) ? "asc" : "desc");
    }
  };

  const { data: providers, isLoading } = useQuery({
    queryKey: ["/api/providers/risk-analysis"],
  });

  const { data: outliers, isLoading: outliersLoading } = useQuery({
    queryKey: ["/api/providers/outliers"],
  });

  const { data: providerDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["/api/providers", selectedProviderId, "claims"],
    enabled: !!selectedProviderId,
  });

  const filteredProviders = providers?.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.npi.includes(searchTerm)
  );

  const sortedProviders = useMemo(() => {
    if (!filteredProviders) return [];
    
    const sorted = [...filteredProviders].sort((a: any, b: any) => {
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
  }, [filteredProviders, sortKey, sortDirection]);

  const selectedProvider = providers?.find((p: any) => p.id === selectedProviderId);

  const handleExport = () => {
    const columns = [
      { key: "name", label: "Provider Name" },
      { key: "npi", label: "NPI" },
      { key: "specialty", label: "Specialty" },
      { key: "totalClaims", label: "Total Claims" },
      { key: "avgClaimAmount", label: "Avg Claim Amount" },
      { key: "alertCount", label: "Alert Count" },
      { key: "riskScore", label: "Risk Score" },
      { key: "networkStatus", label: "Network Status" },
    ];

    exportToCSV(sortedProviders, "provider-risk-analysis", columns);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="heading-provider-profiling">
            Provider Behavioral Profiling
          </h1>
          <p className="text-muted-foreground">
            Statistical analysis of billing patterns, outlier detection, and peer group comparison
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} data-testid="button-export-providers">
          <FileDown className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Billing Intensity Outliers</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-mono font-semibold">{outliers?.intensityCount || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">&gt;2 SD above peer average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Code Switching Patterns</CardTitle>
            <Code className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-mono font-semibold">{outliers?.codeSwitchCount || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Suspicious reimbursement patterns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">After-Hours Spikes</CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-mono font-semibold">{outliers?.afterHoursCount || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Weekend/off-hours anomalies</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>High-Risk Provider Analysis</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name or NPI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-providers"
              />
            </div>
          </div>
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
                        onClick={() => handleSort("name")}
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
                        onClick={() => handleSort("npi")}
                        data-testid="sort-npi"
                      >
                        NPI
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover-elevate"
                        onClick={() => handleSort("specialty")}
                        data-testid="sort-specialty"
                      >
                        Specialty
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover-elevate"
                        onClick={() => handleSort("totalClaims")}
                        data-testid="sort-claims"
                      >
                        Total Claims
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover-elevate"
                        onClick={() => handleSort("avgClaimAmount")}
                        data-testid="sort-avg-amount"
                      >
                        Avg Claim Amount
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover-elevate"
                        onClick={() => handleSort("alertCount")}
                        data-testid="sort-alerts"
                      >
                        Alerts
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
                        Risk Score
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover-elevate"
                        onClick={() => handleSort("networkStatus")}
                        data-testid="sort-status"
                      >
                        Status
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProviders.map((provider: any) => (
                    <TableRow
                      key={provider.id}
                      className="cursor-pointer hover-elevate"
                      onClick={() => setSelectedProviderId(provider.id)}
                      data-testid={`provider-row-${provider.id}`}
                    >
                      <TableCell className="font-medium">{provider.name}</TableCell>
                      <TableCell className="font-mono text-sm">{provider.npi}</TableCell>
                      <TableCell className="text-sm">{provider.specialty}</TableCell>
                      <TableCell className="font-mono">{provider.totalClaims.toLocaleString()}</TableCell>
                      <TableCell className="font-mono">
                        ${Number(provider.avgClaimAmount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {provider.alertCount > 0 && (
                          <Badge variant="destructive">{provider.alertCount}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <RiskScoreBadge score={provider.riskScore} size="sm" />
                      </TableCell>
                      <TableCell>
                        <Badge variant={provider.networkStatus === "active" ? "secondary" : "destructive"}>
                          {provider.networkStatus}
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

      <Dialog open={!!selectedProviderId} onOpenChange={() => setSelectedProviderId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="dialog-provider-details">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span data-testid="text-provider-name">{selectedProvider?.name}</span>
              <RiskScoreBadge score={selectedProvider?.riskScore || 0} />
            </DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-48" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">NPI</p>
                  <p className="font-mono font-semibold" data-testid="text-provider-npi">{selectedProvider?.npi}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Specialty</p>
                  <p className="font-semibold" data-testid="text-provider-specialty">{selectedProvider?.specialty}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Network Status</p>
                  <Badge variant={selectedProvider?.networkStatus === "active" ? "secondary" : "destructive"}>
                    {selectedProvider?.networkStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Years Active</p>
                  <p className="font-semibold">{selectedProvider?.yearsActive || 0} years</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Claim Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Total Claims</p>
                      <p className="text-2xl font-mono font-semibold" data-testid="text-total-claims">
                        {selectedProvider?.totalClaims?.toLocaleString() || 0}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Avg Claim Amount</p>
                      <p className="text-2xl font-mono font-semibold" data-testid="text-avg-claim-amount">
                        ${Number(selectedProvider?.avgClaimAmount || 0).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Fraud Alerts</p>
                      <p className="text-2xl font-mono font-semibold text-destructive" data-testid="text-alert-count">
                        {selectedProvider?.alertCount || 0}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {providerDetails && providerDetails.recentClaims && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Recent Claims</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Claim ID</TableHead>
                        <TableHead>Service Date</TableHead>
                        <TableHead>CPT Code</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {providerDetails.recentClaims.slice(0, 10).map((claim: any) => (
                        <TableRow key={claim.id}>
                          <TableCell className="font-mono text-sm">{claim.claimId}</TableCell>
                          <TableCell>{new Date(claim.serviceDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{claim.cptCode}</Badge>
                          </TableCell>
                          <TableCell className="font-mono">${Number(claim.billedAmount).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={claim.approved ? "secondary" : "destructive"}>
                              {claim.approved ? "Approved" : "Pending"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
