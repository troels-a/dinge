// src/ItemProvider.tsx
import { createContext, useContext } from "react";

// src/utils/api.ts
var parseConfig = (config) => {
  const parsed = {};
  for (const [type, itemConfig] of Object.entries(config)) {
    if (typeof itemConfig === "string") {
      parsed[type] = {
        store: true,
        ttl: void 0,
        create: parseOperation(itemConfig, "POST"),
        read: parseOperation(itemConfig, "GET"),
        update: parseOperation(itemConfig, "PUT"),
        delete: parseOperation(itemConfig, "DELETE")
      };
    } else {
      parsed[type] = {
        store: itemConfig.store ?? true,
        ttl: itemConfig.ttl,
        create: parseOperation(itemConfig.create || itemConfig.read, "POST"),
        read: parseOperation(itemConfig.read, "GET"),
        update: parseOperation(itemConfig.update || itemConfig.read, "PUT"),
        delete: parseOperation(itemConfig.delete || itemConfig.read, "DELETE")
      };
    }
  }
  return parsed;
};
var parseOperation = (config, defaultMethod) => {
  if (typeof config === "string") {
    return {
      endpoint: config,
      method: defaultMethod,
      handler: (res) => res.json()
    };
  }
  return {
    endpoint: config.endpoint,
    method: config.method || defaultMethod,
    handler: config.handler || ((res) => res.json()),
    headers: config.headers,
    transform: config.transform
  };
};
var makeRequest = async (operation, id, data) => {
  const url = id ? `${operation.endpoint}/${id}` : operation.endpoint;
  const requestData = operation.transform ? operation.transform(data) : data;
  const response = await fetch(url, {
    method: operation.method,
    headers: {
      "Content-Type": "application/json",
      ...operation.headers
    },
    body: requestData ? JSON.stringify(requestData) : void 0
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return operation.handler(response);
};

// src/ItemProvider.tsx
import { jsx } from "react/jsx-runtime";
var ItemContext = createContext(null);
var ItemProvider = ({ config, children }) => {
  const parsedConfig = parseConfig(config);
  return /* @__PURE__ */ jsx(ItemContext.Provider, { value: { config: parsedConfig }, children });
};
var useItemContext = (type) => {
  const context = useContext(ItemContext);
  if (!context) {
    throw new Error("useItemContext must be used within an ItemProvider");
  }
  return context.config[type];
};

// src/Item.tsx
import { createContext as createContext2, useEffect } from "react";

// src/store.ts
import { create } from "zustand";
var useStore = create((set, get) => ({
  items: {},
  setItem: (type, id, item) => {
    set((state) => ({
      items: {
        ...state.items,
        [type]: {
          ...state.items[type],
          [id]: {
            ...state.items[type]?.[id],
            ...item
          }
        }
      }
    }));
  },
  getItem: (type, id) => {
    return get().items[type]?.[id];
  },
  removeItem: (type, id) => {
    set((state) => {
      const newItems = { ...state.items };
      if (newItems[type]) {
        const { [id]: removed, ...rest } = newItems[type];
        newItems[type] = rest;
      }
      return { items: newItems };
    });
  },
  clearItems: (type) => {
    set((state) => {
      if (type) {
        const newItems = { ...state.items };
        delete newItems[type];
        return { items: newItems };
      }
      return { items: {} };
    });
  }
}));

// src/utils/cache.ts
var isExpired = (item, ttl) => {
  if (!ttl) return false;
  return Date.now() - item.timestamp > ttl;
};
var shouldRefresh = (item, ttl) => {
  if (!item.data) return true;
  if (isExpired(item, ttl)) return true;
  return false;
};
var createInitialItem = (data) => ({
  data,
  clean: data,
  loading: false,
  error: null,
  timestamp: Date.now()
});
var updateItemData = (item, newData) => ({
  ...item,
  data: newData,
  timestamp: Date.now()
});
var updateItemClean = (item, newData) => ({
  ...item,
  data: newData,
  clean: newData,
  timestamp: Date.now()
});
var setItemLoading = (item, loading) => ({
  ...item,
  loading
});
var setItemError = (item, error) => ({
  ...item,
  error,
  loading: false
});
var rollbackToClean = (item) => ({
  ...item,
  data: item.clean
});

// src/Item.tsx
import { Fragment, jsx as jsx2 } from "react/jsx-runtime";
var ItemContext2 = createContext2(null);
var Item = ({ type, id, fallback, children }) => {
  const { setItem, getItem } = useStore();
  const itemConfig = useItemContext(type);
  const itemId = String(id);
  const item = getItem(type, itemId);
  useEffect(() => {
    const fetchItem = async () => {
      if (!itemConfig.store || item && shouldRefresh(item, itemConfig.ttl)) {
        const currentItem = item || { data: null, clean: null, loading: false, error: null, timestamp: 0 };
        setItem(type, itemId, setItemLoading(currentItem, true));
        try {
          const data = await makeRequest(itemConfig.read, itemId);
          setItem(type, itemId, updateItemData(createInitialItem(data), data));
        } catch (error) {
          const errorItem = item || { data: null, clean: null, loading: false, error: null, timestamp: 0 };
          setItem(type, itemId, setItemError(errorItem, error));
        }
      }
    };
    fetchItem();
  }, [type, itemId, itemConfig, setItem, getItem]);
  if (item?.loading && fallback) {
    return /* @__PURE__ */ jsx2(Fragment, { children: fallback });
  }
  return /* @__PURE__ */ jsx2(ItemContext2.Provider, { value: { type, id: itemId }, children });
};

// src/useItem.ts
import { useContext as useContext3 } from "react";
var useItem = () => {
  const context = useContext3(ItemContext2);
  if (!context) {
    throw new Error("useItem must be used within an Item component");
  }
  const { type, id } = context;
  const { setItem, getItem, removeItem } = useStore();
  const itemConfig = useItemContext(type);
  const item = getItem(type, id);
  const mutate = (updater) => {
    if (item) {
      setItem(type, id, updateItemData(item, updater(item.data)));
    }
  };
  const update = async (updates, options) => {
    if (!item) return;
    setItem(type, id, setItemLoading(item, true));
    try {
      const dataToSend = updates || item.data;
      const result = await makeRequest(itemConfig.update, id, dataToSend);
      setItem(type, id, updateItemClean(item, result));
      return result;
    } catch (error) {
      setItem(type, id, setItemError(item, error));
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
      setItem(type, id, setItemError(item, error));
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
      setItem(type, id, setItemError(item, error));
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
    refresh
  };
};

// src/useItemContext.ts
import { useContext as useContext4 } from "react";
var useItemContext2 = (type) => {
  const context = useContext4(ItemContext);
  if (!context) {
    throw new Error("useItemContext must be used within an ItemProvider");
  }
  const { setItem } = useStore();
  const itemConfig = context.config[type];
  const create2 = async (data) => {
    const result = await makeRequest(itemConfig.create, void 0, data);
    if (itemConfig.store) {
      setItem(type, result.id || result._id || String(result.id), createInitialItem(result));
    }
    return result;
  };
  return {
    create: create2,
    config: itemConfig
  };
};
export {
  Item,
  ItemProvider,
  useItem,
  useItemContext2 as useItemContext
};
