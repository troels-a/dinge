import { create } from 'zustand';
import { StoreState, StoreActions, ItemState, ListState } from './types';

export const useStore = create<StoreState & StoreActions>((set, get) => ({
  items: {},
  lists: {},

  setItem: <T>(type: string, id: string, item: Partial<ItemState<T>>) => {
    set((state) => ({
      items: {
        ...state.items,
        [type]: {
          ...state.items[type],
          [id]: {
            ...state.items[type]?.[id],
            ...item,
          } as ItemState<T>,
        },
      },
    }));
  },

  getItem: <T>(type: string, id: string): ItemState<T> | undefined => {
    return get().items[type]?.[id] as ItemState<T> | undefined;
  },

  removeItem: (type: string, id: string) => {
    set((state) => {
      const newItems = { ...state.items };
      if (newItems[type]) {
        const { [id]: removed, ...rest } = newItems[type];
        newItems[type] = rest;
      }
      return { items: newItems };
    });
  },

  clearItems: (type?: string) => {
    set((state) => {
      if (type) {
        const newItems = { ...state.items };
        delete newItems[type];
        return { items: newItems };
      }
      return { items: {} };
    });
  },

  setList: <T>(key: string, list: Partial<ListState<T>>) => {
    set((state) => ({
      lists: {
        ...state.lists,
        [key]: {
          ...state.lists[key],
          ...list,
        } as ListState<T>,
      },
    }));
  },

  getList: <T>(key: string): ListState<T> | undefined => {
    return get().lists[key] as ListState<T> | undefined;
  },

  removeList: (key: string) => {
    set((state) => {
      const { [key]: removed, ...rest } = state.lists;
      return { lists: rest };
    });
  },
}));
