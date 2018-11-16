import 'cross-fetch/polyfill';

import { getENV } from '../src/env';

const EVENT_STORE_URL = getENV('EVENT_STORE_URL');
const AGGREGATOR_URL = getENV('AGGREGATOR_URL');

// implement fetch and import to POST http://localhost/events

interface Event {
  cursor: string;
}

const isImportRequired = async () => {
  const req = fetch(`${AGGREGATOR_URL}/events/latest`);
  const res = await req;
  return parseInt(res.headers.get('content-length'), 10) === 0;
};

const fetchEvents = async (cursor?: string): Promise<Event[]> => {
  const query = `query ($cursor:String) {
    _events(cursor:$cursor){
      id
      entityId
      entity
      cursor
      data
      date
      operationName
      principalId
      columns
      type
    }
  }`;
  const variables = { cursor };
  const body = { query, variables };

  const req = fetch(`${EVENT_STORE_URL}/graphql`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
  const res = await req;
  const json = await res.json();
  return json.data._events;
};

const importEvent = async (event: Event) => {
  // global.console.log(`importing event ${JSON.stringify(event)}`);
  const req = fetch(`${AGGREGATOR_URL}/events`, {
    method: 'POST',
    body: JSON.stringify(event),
    headers: { 'content-type': 'application/json' },
  });
  const res = await req;
  if (res.status !== 201) {
    throw new Error(
      `unexpected status code ${res.status}, body: ${await res.text()}`,
    );
  }
};

const start = async () => {
  const isRequired = await isImportRequired();
  let cursor: string | undefined;
  if (isRequired) {
    while (true) {
      const events = await fetchEvents(cursor);
      if (events.length === 0) {
        global.console.log('no more events, ending');
        break;
      }
      global.console.log('importing events', events.length);
      for (const event of events) {
        await importEvent(event);
      }
      cursor = events[events.length - 1].cursor;
    }
  }
};

start();
