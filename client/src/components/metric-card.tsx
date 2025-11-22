import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  testId?: string;
}

export function MetricCard({
  title,
  value,
  trend,
  trendLabel,
  subtitle,
  icon,
  className,
  testId,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend > 0) return <TrendingUp className="h-4 w-4" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (!trend) return "text-muted-foreground";
    if (trend > 0) return "text-green-600 dark:text-green-400";
    if (trend < 0) return "text-red-600 dark:text-red-400";
    return "text-muted-foreground";
  };

  return (
    <Card className={cn("hover-elevate", className)} data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-mono font-semibold" data-testid={`${testId}-value`}>
          {value}
        </div>
        {(trend !== undefined || subtitle) && (
          <div className="flex items-center gap-2 mt-2">
            {trend !== undefined && (
              <div className={cn("flex items-center gap-1 text-sm font-medium", getTrendColor())}>
                {getTrendIcon()}
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
            {trendLabel && (
              <p className="text-xs text-muted-foreground">{trendLabel}</p>
            )}
            {subtitle && !trendLabel && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
