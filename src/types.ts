export type ItemConfig = {
  store?: boolean;
  ttl?: number;
  create?: OperationConfig | string;
  read?: OperationConfig | string;
  update?: OperationConfig | string;
  delete?: OperationConfig | string;
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

export type StoreState = {
  items: {
    [type: string]: {
      [id: string]: ItemState;
    };
  };
};

export type StoreActions = {
  setItem: <T>(type: string, id: string, item: Partial<ItemState<T>>) => void;
  getItem: <T>(type: string, id: string) => ItemState<T> | undefined;
  removeItem: (type: string, id: string) => void;
  clearItems: (type?: string) => void;
};

export type ParsedConfig = {
  [type: string]: {
    store: boolean;
    ttl?: number;
    create: ParsedOperationConfig;
    read: ParsedOperationConfig;
    update: ParsedOperationConfig;
    delete: ParsedOperationConfig;
  };
};

export type ParsedOperationConfig = {
  endpoint: string;
  method: string;
  handler: (response: Response) => Promise<any>;
  headers?: Record<string, string>;
  transform?: (data: any) => any;
};
