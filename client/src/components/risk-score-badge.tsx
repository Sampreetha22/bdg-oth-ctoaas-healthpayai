import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RiskScoreBadgeProps {
  score: number;
  size?: "sm" | "default" | "lg";
  showLabel?: boolean;
}

export function RiskScoreBadge({ score, size = "default", showLabel = true }: RiskScoreBadgeProps) {
  const getRiskLevel = (score: number): { level: string; variant: "destructive" | "default" | "secondary" } => {
    if (score >= 80) return { level: "Critical", variant: "destructive" };
    if (score >= 60) return { level: "High", variant: "destructive" };
    if (score >= 40) return { level: "Medium", variant: "default" };
    return { level: "Low", variant: "secondary" };
  };

  const { level, variant } = getRiskLevel(score);

  const sizeClasses = {
    sm: "text-xs",
    default: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={cn("font-mono font-semibold", sizeClasses[size])}>{score}</span>
      {showLabel && (
        <Badge variant={variant} className={sizeClasses[size]}>
          {level}
        </Badge>
      )}
    </div>
  );
}
