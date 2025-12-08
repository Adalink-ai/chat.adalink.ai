'use client';

import type { ReactNode } from 'react';
import { useSidebarContext } from './sidebar-context';

interface ChatLayoutProps {
  children: ReactNode;
}

export function ChatLayout({ children }: ChatLayoutProps) {
  const { isCollapsed, activePanel } = useSidebarContext();
  const sidebarWidth = isCollapsed ? 0 : (activePanel ? 360 : 80);

  return (
    <div 
      className="flex md:h-screen pt-16 md:p-4 bg-muted/30 transition-all duration-300"
      style={{ 
        paddingLeft: `max(16px, ${sidebarWidth}px)`,
        height: '100dvh'
      }}
    >
      {children}
    </div>
  );
}

