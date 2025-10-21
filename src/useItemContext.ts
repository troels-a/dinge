import { useContext } from 'react';
import { useStore } from './store';
import { makeRequest } from './utils/api';
import { createInitialItem } from './utils/cache';
import { ItemContext } from './ItemProvider';

export const useItemContext = (type: string) => {
  const context = useContext(ItemContext);
  if (!context) {
    throw new Error('useItemContext must be used within an ItemProvider');
  }
  
  const { setItem } = useStore();
  const itemConfig = context.config[type];
  
  const create = async (data: any) => {
    const result = await makeRequest(itemConfig.create, undefined, data);
    
    if (itemConfig.store) {
      setItem(type, result.id || result._id || String(result.id), createInitialItem(result));
    }
    
    return result;
  };
  
  return {
    create,
    config: itemConfig,
  };
};
