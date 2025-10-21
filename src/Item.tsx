import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useStore } from './store';
import { useItemContext } from './ItemProvider';
import { makeRequest } from './utils/api';
import { createInitialItem, updateItemData, setItemLoading, setItemError, shouldRefresh } from './utils/cache';

export const ItemContext = createContext<{
  type: string;
  id: string;
} | null>(null);

export interface ItemProps {
  type: string;
  id: string | number;
  fallback?: ReactNode;
  children: ReactNode;
}

export const Item: React.FC<ItemProps> = ({ type, id, fallback, children }) => {
  const { setItem, getItem } = useStore();
  const itemConfig = useItemContext(type);
  const itemId = String(id);
  
  const item = getItem(type, itemId);
  
  useEffect(() => {
    const fetchItem = async () => {
      if (!itemConfig.store || !item || shouldRefresh(item, itemConfig.ttl)) {
        const currentItem = item || { data: null, clean: null, loading: false, error: null, timestamp: 0 };
        setItem(type, itemId, setItemLoading(currentItem, true));
        
        try {
          const data = await makeRequest(itemConfig.read, itemId);
          setItem(type, itemId, updateItemData(createInitialItem(data), data));
        } catch (error) {
          const errorItem = item || { data: null, clean: null, loading: false, error: null, timestamp: 0 };
          setItem(type, itemId, setItemError(errorItem, error as Error));
        }
      }
    };
    
    fetchItem();
  }, [type, itemId, itemConfig, setItem, getItem]);
  
  if (item?.loading && fallback) {
    return <>{fallback}</>;
  }
  
  return (
    <ItemContext.Provider value={{ type, id: itemId }}>
      {children}
    </ItemContext.Provider>
  );
};
