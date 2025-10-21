import { useContext } from 'react';
import { useStore } from './store';
import { useItemContext } from './ItemProvider';
import { ItemContext } from './Item';
import { makeRequest } from './utils/api';
import { updateItemData, setItemLoading, setItemError, rollbackToClean, updateItemClean } from './utils/cache';
import { UpdateOptions } from './types';

export const useItem = () => {
  const context = useContext(ItemContext);
  if (!context) {
    throw new Error('useItem must be used within an Item component');
  }
  
  const { type, id } = context;
  const { setItem, getItem, removeItem } = useStore();
  const itemConfig = useItemContext(type);
  const item = getItem(type, id);
  
  const mutate = (updater: (prev: any) => any) => {
    if (item) {
      setItem(type, id, updateItemData(item, updater(item.data)));
    }
  };
  
  const update = async (updates?: any, options?: UpdateOptions) => {
    if (!item) return;
    
    setItem(type, id, setItemLoading(item, true));
    
    try {
      const dataToSend = updates || item.data;
      const result = await makeRequest(itemConfig.update, id, dataToSend);
      
      setItem(type, id, updateItemClean(item, result));
      return result;
    } catch (error) {
      setItem(type, id, setItemError(item, error as Error));
      
      if (options?.rollback) {
        setItem(type, id, rollbackToClean(item));
      }
      
      throw error;
    }
  };
  
  const remove = async () => {
    if (!item) return;
    
    setItem(type, id, setItemLoading(item, true));
    
    try {
      await makeRequest(itemConfig.delete, id);
      removeItem(type, id);
    } catch (error) {
      setItem(type, id, setItemError(item, error as Error));
      throw error;
    }
  };
  
  const refresh = async () => {
    if (!item) return;
    
    setItem(type, id, setItemLoading(item, true));
    
    try {
      const data = await makeRequest(itemConfig.read, id);
      setItem(type, id, updateItemClean(item, data));
      return data;
    } catch (error) {
      setItem(type, id, setItemError(item, error as Error));
      throw error;
    }
  };
  
  return {
    data: item?.data,
    loading: item?.loading || false,
    error: item?.error,
    mutate,
    update,
    remove,
    refresh,
  };
};
