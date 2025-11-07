import { createContext, useContext, useState } from "react";

const SummaryContext = createContext();

export function SummaryProvider({ children }) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Função que será chamada depois de cadastrar uma renda/gasto
  const refreshSummary = () => setRefreshKey((prev) => prev + 1);

  return (
    <SummaryContext.Provider value={{ refreshKey, refreshSummary }}>
      {children}
    </SummaryContext.Provider>
  );
}

export function useSummary() {
  return useContext(SummaryContext);
}
