import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface SecondaryTab {
  id: string;
  label: string;
  route: string;
}

interface SecondaryTabsContextType {
  secondaryTabs: SecondaryTab[];
  addSecondaryTab: (tab: SecondaryTab) => void;
  removeSecondaryTab: (tabId: string) => void;
  hasSecondaryTab: (tabId: string) => boolean;
}

const SecondaryTabsContext = createContext<SecondaryTabsContextType | undefined>(undefined);

export function SecondaryTabsProvider({ children }: { children: ReactNode }) {
  const [secondaryTabs, setSecondaryTabs] = useState<SecondaryTab[]>([]);

  const addSecondaryTab = (tab: SecondaryTab) => {
    setSecondaryTabs(prev => {
      // Don't add if it already exists
      if (prev.some(t => t.id === tab.id)) {
        return prev;
      }
      return [...prev, tab];
    });
  };

  const removeSecondaryTab = (tabId: string) => {
    setSecondaryTabs(prev => prev.filter(tab => tab.id !== tabId));
  };

  const hasSecondaryTab = (tabId: string) => {
    return secondaryTabs.some(tab => tab.id === tabId);
  };

  return (
    <SecondaryTabsContext.Provider value={{ 
      secondaryTabs, 
      addSecondaryTab, 
      removeSecondaryTab, 
      hasSecondaryTab 
    }}>
      {children}
    </SecondaryTabsContext.Provider>
  );
}

export function useSecondaryTabs() {
  const context = useContext(SecondaryTabsContext);
  if (context === undefined) {
    throw new Error('useSecondaryTabs must be used within a SecondaryTabsProvider');
  }
  return context;
} 