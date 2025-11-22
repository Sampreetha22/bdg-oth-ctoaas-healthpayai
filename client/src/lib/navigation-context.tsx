import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface BreadcrumbItem {
  label: string;
  path: string;
}

interface NavigationContextType {
  breadcrumbs: BreadcrumbItem[];
  navigate: (path: string, label: string) => void;
  goBack: () => void;
  reset: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { label: "Dashboard", path: "/" }
  ]);

  const navigate = useCallback((path: string, label: string) => {
    setBreadcrumbs((prev) => {
      // Check if we're navigating to a path that already exists in breadcrumbs
      const existingIndex = prev.findIndex((item) => item.path === path);
      if (existingIndex !== -1) {
        // Navigate to that point in the breadcrumb trail
        return prev.slice(0, existingIndex + 1);
      }
      // Add new breadcrumb
      return [...prev, { label, path }];
    });
  }, []);

  const goBack = useCallback(() => {
    setBreadcrumbs((prev) => {
      if (prev.length > 1) {
        return prev.slice(0, -1);
      }
      return prev;
    });
  }, []);

  const reset = useCallback(() => {
    setBreadcrumbs([{ label: "Dashboard", path: "/" }]);
  }, []);

  return (
    <NavigationContext.Provider value={{ breadcrumbs, navigate, goBack, reset }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
}
