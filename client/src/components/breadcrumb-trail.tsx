import { useNavigation } from "@/lib/navigation-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowLeft } from "lucide-react";

export function BreadcrumbTrail() {
  const { breadcrumbs, goBack } = useNavigation();
  const [, setLocation] = useLocation();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
      <Button
        variant="ghost"
        size="sm"
        onClick={goBack}
        className="gap-1"
        data-testid="button-breadcrumb-back"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="flex items-center gap-1 text-sm ml-2">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.path} className="flex items-center gap-1">
            <button
              onClick={() => setLocation(crumb.path)}
              className="text-muted-foreground hover:text-foreground transition-colors underline"
              data-testid={`breadcrumb-${crumb.label}`}
            >
              {crumb.label}
            </button>
            {index < breadcrumbs.length - 1 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
