import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CptCodePill } from "@/components/cpt-code-pill";
import { RiskScoreBadge } from "@/components/risk-score-badge";
import { FileDown, ArrowUpDown } from "lucide-react";
import { formatDate } from "date-fns";
import { useState, useMemo } from "react";
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

type SortKey = "claimId" | "providerName" | "memberName" | "serviceDate" | "cptCode" | "amount" | "expectedAmount" | "riskScore" | "pathway";
type SortDirection = "asc" | "desc";

export default function ClaimAnomaly() {
  const [activeTab, setActiveTab] = useState("duplicate");
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [dupSortKey, setDupSortKey] = useState<SortKey>("riskScore");
  const [dupSortDirection, setDupSortDirection] = useState<SortDirection>("desc");
  const [underSortKey, setUnderSortKey] = useState<SortKey>("riskScore");
  const [underSortDirection, setUnderSortDirection] = useState<SortDirection>("desc");
  const [upSortKey, setUpSortKey] = useState<SortKey>("riskScore");
  const [upSortDirection, setUpSortDirection] = useState<SortDirection>("desc");

  const handleDupSort = (key: SortKey) => {
    if (dupSortKey === key) {
      setDupSortDirection(dupSortDirection === "asc" ? "desc" : "asc");
    } else {
      setDupSortKey(key);
      const ascendingFirstColumns: SortKey[] = ["claimId", "providerName", "memberName", "serviceDate", "cptCode", "pathway"];
      setDupSortDirection(ascendingFirstColumns.includes(key) ? "asc" : "desc");
    }
  };

  const handleUnderSort = (key: SortKey) => {
    if (underSortKey === key) {
      setUnderSortDirection(underSortDirection === "asc" ? "desc" : "asc");
    } else {
      setUnderSortKey(key);
      const ascendingFirstColumns: SortKey[] = ["claimId", "providerName", "memberName", "serviceDate", "cptCode", "pathway"];
      setUnderSortDirection(ascendingFirstColumns.includes(key) ? "asc" : "desc");
    }
  };

  const handleUpSort = (key: SortKey) => {
    if (upSortKey === key) {
      setUpSortDirection(upSortDirection === "asc" ? "desc" : "asc");
    } else {
      setUpSortKey(key);
      const ascendingFirstColumns: SortKey[] = ["claimId", "providerName", "memberName", "serviceDate", "cptCode", "pathway"];
      setUpSortDirection(ascendingFirstColumns.includes(key) ? "asc" : "desc");
    }
  };

  const { data: duplicates, isLoading: dupLoading } = useQuery({
    queryKey: ["/api/claim-anomaly/duplicate-billing"],
  });

  const { data: underbilling, isLoading: underLoading } = useQuery({
    queryKey: ["/api/claim-anomaly/underbilling"],
  });

  const { data: upcoding, isLoading: upLoading } = useQuery({
    queryKey: ["/api/claim-anomaly/upcoding"],
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

  const sortedDuplicates = useMemo(() => 
    sortData(duplicates?.cases || [], dupSortKey, dupSortDirection),
    [duplicates?.cases, dupSortKey, dupSortDirection]
  );

  const sortedUnderbilling = useMemo(() => 
    sortData(underbilling?.cases || [], underSortKey, underSortDirection),
    [underbilling?.cases, underSortKey, underSortDirection]
  );

  const sortedUpcoding = useMemo(() => 
    sortData(upcoding?.cases || [], upSortKey, upSortDirection),
    [upcoding?.cases, upSortKey, upSortDirection]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="heading-claim-anomaly">
            Claim Anomaly Detection
          </h1>
          <p className="text-muted-foreground">
            AI-powered detection of duplicate billing, underbilling, and upcoding patterns
          </p>
        </div>
        <Button variant="outline" data-testid="button-export-claim-anomaly">
          <FileDown className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="duplicate" data-testid="tab-duplicate">
            Duplicate/Shadow Billing
          </TabsTrigger>
          <TabsTrigger value="underbilling" data-testid="tab-underbilling">
            Underbilling & Leakage
          </TabsTrigger>
          <TabsTrigger value="upcoding" data-testid="tab-upcoding">
            Upcoding & Misclassification
          </TabsTrigger>
        </TabsList>

        <TabsContent value="duplicate" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Duplicate Claims Detected</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-mono font-semibold">
                  {duplicates?.totalCount || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ${(duplicates?.totalAmount || 0).toLocaleString()} potential overpayment
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Operational Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-mono font-semibold">
                  {duplicates?.operationalCount || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Auto-resolved claims</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Fraud Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-mono font-semibold">
                  {duplicates?.fraudCount || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Escalated for review</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detected Claims</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {dupLoading ? (
                <div className="p-6">
                  <Skeleton className="h-64" />
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleDupSort("claimId")}
                            data-testid="sort-claimId"
                          >
                            Claim ID
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleDupSort("providerName")}
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
                            className="h-8 px-2"
                            onClick={() => handleDupSort("memberName")}
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
                            className="h-8 px-2"
                            onClick={() => handleDupSort("serviceDate")}
                            data-testid="sort-serviceDate"
                          >
                            Service Date
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleDupSort("cptCode")}
                            data-testid="sort-cptCode"
                          >
                            CPT Code
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleDupSort("amount")}
                            data-testid="sort-amount"
                          >
                            Amount
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleDupSort("riskScore")}
                            data-testid="sort-riskScore"
                          >
                            Risk
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleDupSort("pathway")}
                            data-testid="sort-pathway"
                          >
                            Pathway
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedDuplicates.map((item: any) => (
                        <TableRow
                          key={item.id}
                          className="cursor-pointer hover-elevate"
                          onClick={() => setSelectedCase(item)}
                          data-testid={`claim-row-${item.id}`}
                        >
                          <TableCell className="font-mono text-sm">{item.claimId}</TableCell>
                          <TableCell>{item.providerName}</TableCell>
                          <TableCell>{item.memberName}</TableCell>
                          <TableCell className="text-sm">
                            {formatDate(new Date(item.serviceDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <CptCodePill code={item.cptCode} modifiers={item.modifiers} />
                          </TableCell>
                          <TableCell className="font-mono">
                            ${Number(item.amount).toLocaleString()}
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
        </TabsContent>

        <TabsContent value="underbilling" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Detected Leakage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-mono font-semibold">
                  ${(underbilling?.totalLeakage || 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Revenue opportunity identified
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Claims</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-mono font-semibold">
                  {underbilling?.totalCount || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Under AI review</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detected Claims</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {underLoading ? (
                <div className="p-6">
                  <Skeleton className="h-64" />
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover-elevate"
                            onClick={() => handleUnderSort("claimId")}
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
                            onClick={() => handleUnderSort("providerName")}
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
                            onClick={() => handleUnderSort("memberName")}
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
                            onClick={() => handleUnderSort("serviceDate")}
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
                            onClick={() => handleUnderSort("cptCode")}
                          >
                            CPT Code
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover-elevate"
                            onClick={() => handleUnderSort("amount")}
                          >
                            Billed
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover-elevate"
                            onClick={() => handleUnderSort("expectedAmount")}
                          >
                            Expected
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover-elevate"
                            onClick={() => handleUnderSort("riskScore")}
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
                            onClick={() => handleUnderSort("pathway")}
                          >
                            Pathway
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedUnderbilling.map((item: any) => (
                        <TableRow
                          key={item.id}
                          className="cursor-pointer hover-elevate"
                          onClick={() => setSelectedCase(item)}
                          data-testid={`underbilling-row-${item.id}`}
                        >
                          <TableCell className="font-mono text-sm">{item.claimId}</TableCell>
                          <TableCell>{item.providerName}</TableCell>
                          <TableCell>{item.memberName}</TableCell>
                          <TableCell className="text-sm">
                            {formatDate(new Date(item.serviceDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <CptCodePill code={item.cptCode} modifiers={item.modifiers} />
                          </TableCell>
                          <TableCell className="font-mono">
                            ${Number(item.amount).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-green-600 dark:text-green-400">
                            ${Number(item.expectedAmount).toLocaleString()}
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
        </TabsContent>

        <TabsContent value="upcoding" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Potential Overpayment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-mono font-semibold">
                  ${(upcoding?.totalOverpayment || 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Recovery opportunity identified
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Claims</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-mono font-semibold">
                  {upcoding?.totalCount || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Under AI review</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detected Claims</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {upLoading ? (
                <div className="p-6">
                  <Skeleton className="h-64" />
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover-elevate"
                            onClick={() => handleUpSort("claimId")}
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
                            onClick={() => handleUpSort("providerName")}
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
                            onClick={() => handleUpSort("memberName")}
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
                            onClick={() => handleUpSort("serviceDate")}
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
                            onClick={() => handleUpSort("cptCode")}
                          >
                            Billed Code
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Expected Code</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover-elevate"
                            onClick={() => handleUpSort("amount")}
                          >
                            Amount
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover-elevate"
                            onClick={() => handleUpSort("riskScore")}
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
                            onClick={() => handleUpSort("pathway")}
                          >
                            Pathway
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedUpcoding.map((item: any) => (
                        <TableRow
                          key={item.id}
                          className="cursor-pointer hover-elevate"
                          onClick={() => setSelectedCase(item)}
                          data-testid={`upcoding-row-${item.id}`}
                        >
                          <TableCell className="font-mono text-sm">{item.claimId}</TableCell>
                          <TableCell>{item.providerName}</TableCell>
                          <TableCell>{item.memberName}</TableCell>
                          <TableCell className="text-sm">
                            {formatDate(new Date(item.serviceDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <CptCodePill code={item.cptCode} modifiers={item.modifiers} />
                          </TableCell>
                          <TableCell>
                            <CptCodePill code={item.expectedCode} modifiers={[]} />
                          </TableCell>
                          <TableCell className="font-mono">
                            ${Number(item.amount).toLocaleString()}
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
        </TabsContent>
      </Tabs>

      {/* Claim Details Dialog */}
      <Dialog open={!!selectedCase} onOpenChange={() => setSelectedCase(null)}>
        <DialogContent className="max-w-2xl" data-testid="dialog-claim-details">
          <DialogHeader>
            <DialogTitle>Claim Details - {selectedCase?.claimId}</DialogTitle>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Provider</p>
                  <p className="font-semibold" data-testid="text-claim-provider">
                    {selectedCase.providerName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member</p>
                  <p className="font-semibold" data-testid="text-claim-member">
                    {selectedCase.memberName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Service Date</p>
                  <p className="font-semibold">
                    {formatDate(new Date(selectedCase.serviceDate), "MMMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Billed Amount</p>
                  <p className="font-mono font-semibold text-lg">
                    ${Number(selectedCase.amount).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Risk Assessment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Risk Score</p>
                      <div className="mt-2">
                        <RiskScoreBadge score={selectedCase.riskScore} />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Analysis Pathway</p>
                      <Badge
                        className="mt-2"
                        variant={selectedCase.pathway === "fraud" ? "destructive" : "secondary"}
                      >
                        {selectedCase.pathway}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Service Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">CPT Code</span>
                    <CptCodePill code={selectedCase.cptCode} modifiers={selectedCase.modifiers} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
