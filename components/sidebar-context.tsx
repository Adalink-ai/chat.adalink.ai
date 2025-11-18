'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  activePanel: string | null;
  setActivePanel: (value: string | null) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarContextProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activePanel, setActivePanel] = useState<string | null>(null);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, activePanel, setActivePanel }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebarContext must be used within SidebarContextProvider');
  }
  return context;
}
