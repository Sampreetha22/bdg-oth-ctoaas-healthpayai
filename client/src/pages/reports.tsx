import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDown, CalendarIcon, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Reports() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });
  const [reportType, setReportType] = useState("all");

  const { data: reportStats, isLoading } = useQuery({
    queryKey: ["/api/reports/stats", dateRange, reportType],
  });

  const handleExport = (format: string) => {
    console.log(`Exporting report in ${format} format`);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2" data-testid="heading-reports">
          Compliance Reports & Analytics
        </h1>
        <p className="text-muted-foreground">
          Export comprehensive FWA detection reports for payment validation and auditing
        </p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-64" data-testid="button-date-range">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from && dateRange.to ? (
                <>
                  {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                </>
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range: any) => range && setDateRange(range)}
            />
          </PopoverContent>
        </Popover>

        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-48" data-testid="select-report-type">
            <SelectValue placeholder="Report Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All FWA Types</SelectItem>
            <SelectItem value="claim-anomaly">Claim Anomaly</SelectItem>
            <SelectItem value="evv">EVV Intelligence</SelectItem>
            <SelectItem value="provider">Provider Profiling</SelectItem>
            <SelectItem value="utilization">Benefit Utilization</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button onClick={() => handleExport("pdf")} data-testid="button-export-pdf">
          <FileDown className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
        <Button variant="outline" onClick={() => handleExport("csv")} data-testid="button-export-csv">
          <FileDown className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Cases</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-3xl font-mono font-semibold">
                  {reportStats?.totalCases || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">In selected period</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Amount</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <p className="text-3xl font-mono font-semibold">
                  ${(reportStats?.totalAmount || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Detected FWA</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Resolved Cases</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-3xl font-mono font-semibold">
                  {reportStats?.resolvedCases || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {reportStats?.resolutionRate || 0}% resolution rate
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Recovered</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <p className="text-3xl font-mono font-semibold">
                  ${(reportStats?.recovered || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Funds recovered</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-2">Coverage Period</h3>
              <p className="text-sm text-muted-foreground">
                {format(dateRange.from, "MMMM d, yyyy")} - {format(dateRange.to, "MMMM d, yyyy")}
              </p>
            </div>
            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-2">Report Type</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {reportType.replace("-", " ")}
              </p>
            </div>
            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-2">Data Included</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• All detected fraud, waste, and abuse cases</li>
                <li>• AI-powered risk assessments and pathway analysis</li>
                <li>• Provider behavioral patterns and statistical outliers</li>
                <li>• EVV validation results and GPS verification data</li>
                <li>• Clinical outcome correlations (PHQ-9 scores)</li>
                <li>• Compliance documentation and audit trails</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
