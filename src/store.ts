import { create } from 'zustand';
import { StoreState, StoreActions, ItemState } from './types';

export const useStore = create<StoreState & StoreActions>((set, get) => ({
  items: {},

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
}));
