import { ParsedOperationConfig } from '../types';

export const parseConfig = (config: Record<string, any>): Record<string, any> => {
  const parsed: Record<string, any> = {};
  
  for (const [type, itemConfig] of Object.entries(config)) {
    if (typeof itemConfig === 'string') {
      // Simple string config - convert to full config
      parsed[type] = {
        store: true,
        ttl: undefined,
        create: parseOperation(itemConfig, 'POST'),
        read: parseOperation(itemConfig, 'GET'),
        update: parseOperation(itemConfig, 'PUT'),
        delete: parseOperation(itemConfig, 'DELETE'),
      };
    } else {
      // Object config
      parsed[type] = {
        store: itemConfig.store ?? true,
        ttl: itemConfig.ttl,
        create: parseOperation(itemConfig.create || itemConfig.read, 'POST'),
        read: parseOperation(itemConfig.read, 'GET'),
        update: parseOperation(itemConfig.update || itemConfig.read, 'PUT'),
        delete: parseOperation(itemConfig.delete || itemConfig.read, 'DELETE'),
      };
    }
  }
  
  return parsed;
};

const parseOperation = (config: any, defaultMethod: string): ParsedOperationConfig => {
  if (typeof config === 'string') {
    return {
      endpoint: config,
      method: defaultMethod,
      handler: (res: Response) => res.json(),
    };
  }
  
  return {
    endpoint: config.endpoint,
    method: config.method || defaultMethod,
    handler: config.handler || ((res: Response) => res.json()),
    headers: config.headers,
    transform: config.transform,
  };
};

export const makeRequest = async (
  operation: ParsedOperationConfig,
  id?: string,
  data?: any
): Promise<any> => {
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
