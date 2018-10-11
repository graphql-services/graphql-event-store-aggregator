export enum StoreEventType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
}

export interface StoreEventData {
  [key: string]: any;
}
export interface StoreEventOutputData extends StoreEventData {
  id: string;
  createdAt: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
  deletedAt?: Date;
  deletedBy?: string;
}

export interface StoreEvent {
  id: string;
  entity: string;
  entityId: string;
  data: StoreEventData | null;
  type: StoreEventType;
  date: Date;
  principalId?: string;
}
