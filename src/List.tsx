import React, { createContext, useEffect, ReactNode } from 'react';
import { useStore } from './store';
import { useItemContext } from './ItemProvider';
import { makeListRequest, listKey } from './utils/api';
import { ListParams } from './types';

export const ListContext = createContext<{
  type: string;
  listKey: string;
} | null>(null);

export interface ListProps {
  type: string;
  params?: ListParams;
  fallback?: ReactNode;
  children: ReactNode;
}

export const List: React.FC<ListProps> = ({ type, params, fallback, children }) => {
  const { setList, getList, setItem } = useStore();
  const itemConfig = useItemContext(type);
  const key = listKey(type, params);

  const list = getList(key);

  useEffect(() => {
    const fetchList = async () => {
      setList(key, { loading: true, error: null });

      try {
        const result = await makeListRequest(itemConfig.list, params);
        const items = Array.isArray(result) ? result : result.data || result.items || [];

        // Cache each item individually in the item store
        for (const item of items) {
          const itemId = String(item.id ?? item._id ?? '');
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

        setList(key, {
          ids,
          data: items,
          loading: false,
          error: null,
          timestamp: Date.now(),
        });
      } catch (error) {
        setList(key, {
          loading: false,
          error: error as Error,
        });
      }
    };

    fetchList();
  }, [type, key, itemConfig]);

  if (list?.loading && fallback) {
    return <>{fallback}</>;
  }

  return (
    <ListContext.Provider value={{ type, listKey: key }}>
      {children}
    </ListContext.Provider>
  );
};
