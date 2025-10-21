import React, { createContext, useContext, ReactNode } from 'react';
import { Config } from './types';
import { parseConfig } from './utils/api';

export const ItemContext = createContext<{
  config: Record<string, any>;
} | null>(null);

export interface ItemProviderProps {
  config: Config;
  children: ReactNode;
}

export const ItemProvider: React.FC<ItemProviderProps> = ({ config, children }) => {
  const parsedConfig = parseConfig(config);
  
  return (
    <ItemContext.Provider value={{ config: parsedConfig }}>
      {children}
    </ItemContext.Provider>
  );
};

export const useItemContext = (type: string) => {
  const context = useContext(ItemContext);
  if (!context) {
    throw new Error('useItemContext must be used within an ItemProvider');
  }
  
  return context.config[type];
};
