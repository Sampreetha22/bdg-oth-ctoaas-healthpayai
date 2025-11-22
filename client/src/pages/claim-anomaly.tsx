import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CptCodePill } from "@/components/cpt-code-pill";
import { RiskScoreBadge } from "@/components/risk-score-badge";
import { FileDown } from "lucide-react";
import { formatDate } from "date-fns";
import { useState } from "react";
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

export default function ClaimAnomaly() {
  const [activeTab, setActiveTab] = useState("duplicate");
  const [selectedCase, setSelectedCase] = useState<any>(null);

  const { data: duplicates, isLoading: dupLoading } = useQuery({
    queryKey: ["/api/claim-anomaly/duplicate-billing"],
  });

  const { data: underbilling, isLoading: underLoading } = useQuery({
    queryKey: ["/api/claim-anomaly/underbilling"],
  });

  const { data: upcoding, isLoading: upLoading } = useQuery({
    queryKey: ["/api/claim-anomaly/upcoding"],
  });

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
                <p className="text-sm text-muted-foreground mt-1">Auto-resolved cases</p>
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
              <CardTitle>Detected Cases</CardTitle>
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
                        <TableHead>Claim ID</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Service Date</TableHead>
                        <TableHead>CPT Code</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Risk</TableHead>
                        <TableHead>Pathway</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {duplicates?.cases?.map((item: any) => (
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
          <Card>
            <CardHeader>
              <CardTitle>Underbilling & Revenue Leakage</CardTitle>
            </CardHeader>
            <CardContent>
              {underLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-md">
                    <p className="text-sm text-muted-foreground mb-2">Detected Leakage</p>
                    <p className="text-2xl font-mono font-semibold">
                      ${(underbilling?.totalLeakage || 0).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-center text-muted-foreground py-12">
                    {underbilling?.cases?.length || 0} cases detected
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoding" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoding & Misclassification</CardTitle>
            </CardHeader>
            <CardContent>
              {upLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-md">
                    <p className="text-sm text-muted-foreground mb-2">Potential Overpayment</p>
                    <p className="text-2xl font-mono font-semibold">
                      ${(upcoding?.totalOverpayment || 0).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-center text-muted-foreground py-12">
                    {upcoding?.cases?.length || 0} cases under AI review
                  </p>
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
