import { useContext } from 'react';
import { useStore } from './store';
import { useItemContext } from './ItemProvider';
import { ListContext } from './List';
import { makeListRequest, listKey as buildListKey } from './utils/api';
import { ListParams } from './types';

export const useList = <T = any>() => {
  const context = useContext(ListContext);
  if (!context) {
    throw new Error('useList must be used within a List component');
  }

  const { type, listKey: key } = context;
  const { getList, setList, setItem } = useStore();
  const itemConfig = useItemContext(type);
  const list = getList<T>(key);

  const refresh = async (params?: ListParams) => {
    const refreshKey = params ? buildListKey(type, params) : key;
    setList(refreshKey, { loading: true, error: null });

    try {
      const result = await makeListRequest(itemConfig.list, params);
      const items = Array.isArray(result) ? result : result.data || result.items || [];

      // Update individual item cache
      for (const item of items) {
        const itemId = String((item as any).id ?? (item as any)._id ?? '');
        if (itemId) {
          setItem(type, itemId, {
            data: item,
            clean: item,
            loading: false,
            error: null,
            timestamp: Date.now(),
          });
        }
      }

      const ids = items
        .map((item: any) => String(item.id ?? item._id ?? ''))
        .filter(Boolean);

      setList(refreshKey, {
        ids,
        data: items,
        loading: false,
        error: null,
        timestamp: Date.now(),
      });

      return items as T[];
    } catch (error) {
      setList(refreshKey, {
        loading: false,
        error: error as Error,
      });
      throw error;
    }
  };

  return {
    items: (list?.data ?? []) as T[],
    ids: list?.ids ?? [],
    loading: list?.loading ?? false,
    error: list?.error ?? null,
    refresh,
  };
};
