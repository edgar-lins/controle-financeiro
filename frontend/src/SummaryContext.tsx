import { createContext, useContext, useState, type ReactNode } from "react";

interface SummaryContextValue {
  refreshKey: number;
  refreshSummary: () => void;
}

const SummaryContext = createContext<SummaryContextValue | null>(null);

export function SummaryProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshSummary = () => setRefreshKey((prev) => prev + 1);

  return (
    <SummaryContext.Provider value={{ refreshKey, refreshSummary }}>
      {children}
    </SummaryContext.Provider>
  );
}

export function useSummary(): SummaryContextValue {
  const ctx = useContext(SummaryContext);
  if (!ctx) throw new Error("useSummary must be used within SummaryProvider");
  return ctx;
}
