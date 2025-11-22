import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface AlertCardProps {
  id: string;
  type: string;
  riskLevel: "critical" | "high" | "medium" | "low";
  providerName: string;
  message: string;
  detectedAt: Date;
  onView: (id: string) => void;
}

export function AlertCard({
  id,
  type,
  riskLevel,
  providerName,
  message,
  detectedAt,
  onView,
}: AlertCardProps) {
  const getRiskColor = () => {
    switch (riskLevel) {
      case "critical":
        return "border-l-destructive bg-destructive/5";
      case "high":
        return "border-l-orange-500 bg-orange-500/5";
      case "medium":
        return "border-l-yellow-500 bg-yellow-500/5";
      default:
        return "border-l-blue-500 bg-blue-500/5";
    }
  };

  const getRiskBadgeVariant = () => {
    if (riskLevel === "critical" || riskLevel === "high") return "destructive";
    return "default";
  };

  return (
    <Card className={cn("border-l-4 hover-elevate", getRiskColor())} data-testid={`alert-${id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={getRiskBadgeVariant()} className="text-xs">
                  {riskLevel.toUpperCase()}
                </Badge>
                <span className="text-xs text-muted-foreground font-medium">{type}</span>
              </div>
              <p className="text-sm font-medium mb-1">{providerName}</p>
              <p className="text-sm text-muted-foreground">{message}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {formatDistanceToNow(detectedAt, { addSuffix: true })}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(id)}
            data-testid={`button-view-alert-${id}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
