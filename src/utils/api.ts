import { ParsedOperationConfig, ListParams } from '../types';

export const parseConfig = (config: Record<string, any>): Record<string, any> => {
  const parsed: Record<string, any> = {};

  for (const [type, itemConfig] of Object.entries(config)) {
    if (typeof itemConfig === 'string') {
      parsed[type] = {
        store: true,
        ttl: undefined,
        create: parseOperation(itemConfig, 'POST'),
        read: parseOperation(itemConfig, 'GET'),
        update: parseOperation(itemConfig, 'PUT'),
        delete: parseOperation(itemConfig, 'DELETE'),
        list: parseOperation(itemConfig, 'GET'),
      };
    } else {
      parsed[type] = {
        store: itemConfig.store ?? true,
        ttl: itemConfig.ttl,
        create: parseOperation(itemConfig.create || itemConfig.read, 'POST'),
        read: parseOperation(itemConfig.read, 'GET'),
        update: parseOperation(itemConfig.update || itemConfig.read, 'PUT'),
        delete: parseOperation(itemConfig.delete || itemConfig.read, 'DELETE'),
        list: parseOperation(itemConfig.list || itemConfig.read, 'GET'),
      };
    }
  }

  return parsed;
};

const parseOperation = (config: any, defaultMethod: string): ParsedOperationConfig => {
  if (!config) {
    return {
      endpoint: '',
      method: defaultMethod,
      handler: (res: Response) => res.json(),
    };
  }

  if (typeof config === 'string') {
    return {
      endpoint: config,
      method: defaultMethod,
      handler: (res: Response) => res.json(),
    };
  }

  return {
    endpoint: config.endpoint || '',
    method: config.method || defaultMethod,
    handler: config.handler || ((res: Response) => res.json()),
    headers: config.headers,
    transform: config.transform,
    fetcher: config.fetcher,
  };
};

export const makeRequest = async (
  operation: ParsedOperationConfig,
  id?: string,
  data?: any
): Promise<any> => {
  // Use custom fetcher if provided — bypasses fetch entirely
  if (operation.fetcher) {
    return operation.fetcher(id, data);
  }

  const url = id ? `${operation.endpoint}/${id}` : operation.endpoint;

  const requestData = operation.transform ? operation.transform(data) : data;

  const response = await fetch(url, {
    method: operation.method,
    headers: {
      'Content-Type': 'application/json',
      ...operation.headers,
    },
    body: requestData ? JSON.stringify(requestData) : undefined,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return operation.handler(response);
};

export const makeListRequest = async (
  operation: ParsedOperationConfig,
  params?: ListParams
): Promise<any> => {
  // Use custom fetcher if provided — bypasses fetch entirely
  if (operation.fetcher) {
    return operation.fetcher(params);
  }

  let url = operation.endpoint;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) {
      url += `?${qs}`;
    }
  }

  const response = await fetch(url, {
    method: operation.method,
    headers: {
      'Content-Type': 'application/json',
      ...operation.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return operation.handler(response);
};

export const listKey = (type: string, params?: ListParams): string => {
  if (!params) return type;
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  if (sorted.length === 0) return type;
  return `${type}:${sorted.map(([k, v]) => `${k}=${v}`).join('&')}`;
};
