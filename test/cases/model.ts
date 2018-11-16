import { StoreEvent, StoreEventType } from '../../src/events/store-event.model';
import { diff } from '../../src/events/changeset';

export interface ImportEventCase {
  only?: boolean;
  name: string;
  queries: string[];
  expectedResults: any[];
  events: StoreEvent[];
}

export const createEntityEvent = (props: {
  entity: string;
  entityId: string;
  date: Date;
  data: any;
  principalId?: string;
}): StoreEvent => {
  return createEvent({ ...props, type: StoreEventType.CREATED, dataFrom: {} });
};

export const updateEntityEvent = (props: {
  entity: string;
  entityId: string;
  date: Date;
  dataFrom: any;
  data: any;
  principalId?: string;
}): StoreEvent => {
  return createEvent({ ...props, type: StoreEventType.UPDATED });
};

export const deleteEntityEvent = (props: {
  entity: string;
  entityId: string;
  date: Date;
  principalId?: string;
}): StoreEvent => {
  return createEvent({
    ...props,
    type: StoreEventType.DELETED,
    dataFrom: {},
    data: {},
  });
};

const createEvent = (props: {
  entity: string;
  entityId: string;
  type: StoreEventType;
  date: Date;
  dataFrom: any;
  data: any;
  principalId?: string;
}): StoreEvent => {
  const data = diff(props.dataFrom, props.data);
  const columns = data.map(x => x.key[0]);
  return {
    id: Math.random().toString(),
    ...props,
    columns,
    data,
  };
};
