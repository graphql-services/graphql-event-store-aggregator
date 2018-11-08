import { StoreEvent } from '../../src/events/store-event.model';

export interface ImportEventCase {
  only?: boolean;
  name: string;
  queries: string[];
  expectedResults: any[];
  events: StoreEvent[];
}
