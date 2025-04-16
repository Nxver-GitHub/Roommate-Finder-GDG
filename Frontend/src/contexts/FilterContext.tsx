import React, { createContext, useState, useContext, ReactNode } from 'react';
import { SearchFilters, defaultFilters } from '../services/searchService'; // Adjust path if needed

interface FilterContextType {
  activeFilters: SearchFilters;
  setActiveFilters: (filters: SearchFilters) => void;
  resetFilters: () => void;
}

// Create the context with a default value
const FilterContext = createContext<FilterContextType | undefined>(undefined);

// Create the provider component
export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeFilters, setActiveFilters] = useState<SearchFilters>(defaultFilters);

  const resetFilters = () => {
    setActiveFilters(defaultFilters);
  };

  return (
    <FilterContext.Provider value={{ activeFilters, setActiveFilters, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
};

// Create a custom hook for easy access to the context
export const useFilters = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}; 