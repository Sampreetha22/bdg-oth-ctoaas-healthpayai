import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EvvStatusIndicator } from "@/components/evv-status-indicator";
import { RiskScoreBadge } from "@/components/risk-score-badge";
import { MapPin, FileDown, Calendar } from "lucide-react";
import { formatDate } from "date-fns";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function EvvIntelligence() {
  const [activeTab, setActiveTab] = useState("not-visited");

  const { data: notVisited, isLoading: nvLoading } = useQuery({
    queryKey: ["/api/evv/not-visited"],
  });

  const { data: overlaps, isLoading: overlapLoading } = useQuery({
    queryKey: ["/api/evv/service-overlap"],
  });

  const { data: missed, isLoading: missedLoading } = useQuery({
    queryKey: ["/api/evv/missed-visits"],
  });

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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim ID</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Service Date</TableHead>
                      <TableHead>EVV Status</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Pathway</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notVisited?.cases?.map((item: any) => (
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
                <p className="text-center text-muted-foreground py-12">
                  {overlaps?.cases?.length || 0} overlapping claims detected
                </p>
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
                <p className="text-center text-muted-foreground py-12">
                  {missed?.cases?.length || 0} claims for missed visits without incident reports
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
