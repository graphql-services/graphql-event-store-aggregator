import { StoreEvent } from '../../src/events/store-event.model';

export interface ImportEventCase {
  name: string;
  query: string;
  expectedResult: any;
  events: StoreEvent[];
}
