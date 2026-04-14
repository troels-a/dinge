export type ItemConfig = {
  store?: boolean;
  ttl?: number;
  create?: OperationConfig | string;
  read?: OperationConfig | string;
  update?: OperationConfig | string;
  delete?: OperationConfig | string;
  list?: OperationConfig | string;
};

export type OperationConfig = {
  endpoint: string;
  method?: string;
  handler?: (response: Response) => Promise<any>;
  headers?: Record<string, string>;
  transform?: (data: any) => any;
};

export type Config = Record<string, ItemConfig | string>;

export type UpdateOptions = {
  rollback?: boolean;
};

export type ItemState<T = any> = {
  data: T;
  clean: T;
  loading: boolean;
  error: Error | null;
  timestamp: number;
};

export type ListState<T = any> = {
  ids: string[];
  data: T[];
  loading: boolean;
  error: Error | null;
  timestamp: number;
};

export type StoreState = {
  items: {
    [type: string]: {
      [id: string]: ItemState;
    };
  };
  lists: {
    [key: string]: ListState;
  };
};

export type StoreActions = {
  setItem: <T>(type: string, id: string, item: Partial<ItemState<T>>) => void;
  getItem: <T>(type: string, id: string) => ItemState<T> | undefined;
  removeItem: (type: string, id: string) => void;
  clearItems: (type?: string) => void;
  setList: <T>(key: string, list: Partial<ListState<T>>) => void;
  getList: <T>(key: string) => ListState<T> | undefined;
  removeList: (key: string) => void;
};

export type ParsedConfig = {
  [type: string]: {
    store: boolean;
    ttl?: number;
    create: ParsedOperationConfig;
    read: ParsedOperationConfig;
    update: ParsedOperationConfig;
    delete: ParsedOperationConfig;
    list: ParsedOperationConfig;
  };
};

export type ParsedOperationConfig = {
  endpoint: string;
  method: string;
  handler: (response: Response) => Promise<any>;
  headers?: Record<string, string>;
  transform?: (data: any) => any;
};

export type ListParams = Record<string, string | number | boolean | undefined>;
