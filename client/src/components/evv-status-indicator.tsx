import { CheckCircle2, XCircle, AlertTriangle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface EvvStatusIndicatorProps {
  status: "verified" | "missing" | "mismatch" | "overlap" | "missed";
  label?: string;
  className?: string;
}

export function EvvStatusIndicator({ status, label, className }: EvvStatusIndicatorProps) {
  const config = {
    verified: {
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      label: label || "Verified",
    },
    missing: {
      icon: AlertTriangle,
      color: "text-yellow-600 dark:text-yellow-400",
      label: label || "Missing",
    },
    mismatch: {
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      label: label || "Mismatch",
    },
    overlap: {
      icon: Calendar,
      color: "text-orange-600 dark:text-orange-400",
      label: label || "Overlap",
    },
    missed: {
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      label: label || "Missed",
    },
  };

  const { icon: Icon, color, label: displayLabel } = config[status];

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Icon className={cn("h-4 w-4", color)} />
      <span className={cn("text-sm font-medium", color)}>{displayLabel}</span>
    </div>
  );
}
