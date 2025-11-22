import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CptCodePillProps {
  code: string;
  description?: string;
  modifiers?: string[];
  className?: string;
}

export function CptCodePill({ code, description, modifiers, className }: CptCodePillProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Badge variant="outline" className="font-mono text-xs">
        {code}
      </Badge>
      {description && (
        <span className="text-sm text-muted-foreground">{description}</span>
      )}
      {modifiers && modifiers.length > 0 && (
        <div className="inline-flex gap-1">
          {modifiers.map((mod) => (
            <Badge key={mod} variant="secondary" className="text-xs font-mono">
              {mod}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
