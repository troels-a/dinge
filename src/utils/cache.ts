import { ItemState } from '../types';

export const isExpired = (item: ItemState, ttl?: number): boolean => {
  if (!ttl) return false;
  return Date.now() - item.timestamp > ttl;
};

export const shouldRefresh = (item: ItemState, ttl?: number): boolean => {
  if (!item.data) return true;
  if (isExpired(item, ttl)) return true;
  return false;
};

export const createInitialItem = <T>(data: T): ItemState<T> => ({
  data,
  clean: data,
  loading: false,
  error: null,
  timestamp: Date.now(),
});

export const updateItemData = <T>(item: ItemState<T>, newData: T): ItemState<T> => ({
  ...item,
  data: newData,
  timestamp: Date.now(),
});

export const updateItemClean = <T>(item: ItemState<T>, newData: T): ItemState<T> => ({
  ...item,
  data: newData,
  clean: newData,
  timestamp: Date.now(),
});

export const setItemLoading = <T>(item: ItemState<T>, loading: boolean): ItemState<T> => ({
  ...item,
  loading,
});

export const setItemError = <T>(item: ItemState<T>, error: Error | null): ItemState<T> => ({
  ...item,
  error,
  loading: false,
});

export const rollbackToClean = <T>(item: ItemState<T>): ItemState<T> => ({
  ...item,
  data: item.clean,
});
