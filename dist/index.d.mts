import React, { ReactNode } from 'react';

type ItemConfig = {
    store?: boolean;
    ttl?: number;
    create?: OperationConfig | string;
    read?: OperationConfig | string;
    update?: OperationConfig | string;
    delete?: OperationConfig | string;
};
type OperationConfig = {
    endpoint: string;
    method?: string;
    handler?: (response: Response) => Promise<any>;
    headers?: Record<string, string>;
    transform?: (data: any) => any;
};
type Config = Record<string, ItemConfig | string>;
type UpdateOptions = {
    rollback?: boolean;
};

interface ItemProviderProps {
    config: Config;
    children: ReactNode;
}
declare const ItemProvider: React.FC<ItemProviderProps>;

interface ItemProps {
    type: string;
    id: string | number;
    fallback?: ReactNode;
    children: ReactNode;
}
declare const Item: React.FC<ItemProps>;

declare const useItem: () => {
    data: unknown;
    loading: boolean;
    error: Error | null | undefined;
    mutate: (updater: (prev: any) => any) => void;
    update: (updates?: any, options?: UpdateOptions) => Promise<any>;
    remove: () => Promise<void>;
    refresh: () => Promise<any>;
};

declare const useItemContext: (type: string) => {
    create: (data: any) => Promise<any>;
    config: any;
};

export { type Config, Item, type ItemConfig, ItemProvider, type OperationConfig, type UpdateOptions, useItem, useItemContext };
