/**
 * Types for optimistic UI operations and rollback functionality
 */

export interface OptimisticOperation {
  id: string;
  type: 'add_stop' | 'remove_stop' | 'reorder_stops' | 'update_meta';
  timestamp: number;
}

export interface AddStopOperation extends OptimisticOperation {
  type: 'add_stop';
  dayId: string;
  stopId: string;
  stopData: {
    title: string;
    lat: number;
    lng: number;
    note?: string;
    cost?: number;
  };
  sortOrder: number;
}

export interface RemoveStopOperation extends OptimisticOperation {
  type: 'remove_stop';
  dayId: string;
  stopId: string;
  dayPlaceId: string;
  stopData: {
    title: string;
    lat: number;
    lng: number;
    note?: string;
    cost?: number;
  };
  sortOrder: number;
}

export interface ReorderStopsOperation extends OptimisticOperation {
  type: 'reorder_stops';
  dayId: string;
  originalOrder: string[];
  newOrder: string[];
  originalSortOrders: number[];
  newSortOrders: number[];
}

export interface UpdateMetaOperation extends OptimisticOperation {
  type: 'update_meta';
  stopId: string;
  dayPlaceId: string;
  placeId: string;
  originalMeta: {
    lat?: number;
    lng?: number;
    note?: string;
    cost?: number;
  };
  newMeta: {
    lat?: number;
    lng?: number;
    note?: string;
    cost?: number;
  };
}

export type PersistenceOperation = 
  | AddStopOperation 
  | RemoveStopOperation 
  | ReorderStopsOperation 
  | UpdateMetaOperation;

export interface PersistenceError {
  operation: PersistenceOperation;
  error: Error;
  timestamp: number;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // ms, undefined = persist until dismissed
  action?: {
    label: string;
    onClick: () => void;
  };
}