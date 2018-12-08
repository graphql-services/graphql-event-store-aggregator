import 'cross-fetch/polyfill';
import { resolve } from 'url';
import { getENV } from '../src/env';

const EVENT_STORE_URL = getENV('EVENT_STORE_URL', 'http://event-store/graphql');
const AGGREGATOR_URL = getENV('AGGREGATOR_URL', 'http://localhost/');

export interface Event {
  [key: string]: any;
  cursor: string;
}

const delay = (interval: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, interval);
  });
};

export const fetchLatestEvent = async (): Promise<Event | null> => {
  const req = fetch(resolve(AGGREGATOR_URL, `/events/latest`));
  const res = await req;
  if (parseInt(res.headers.get('content-length'), 10) === 0) {
    return null;
  }
  return res.json();
};

export const isImportRequired = async (iteration: number = 0) => {
  try {
    const event = await fetchLatestEvent();
    return event === null;
  } catch (err) {
    if (iteration > 5) {
      throw new Error(
        `could not fetch latestEvent, please check if the aggregator is runnig`,
      );
    }
    log(`could not fetch latestEvent, retrying after ${iteration * 2}s...`);
    await delay(iteration * 2000);
    return isImportRequired(iteration + 1);
  }
};

export const fetchEvents = async (cursor?: string): Promise<Event[]> => {
  const query = `query ($cursor:String) {
    _events(cursor:$cursor,limit:30){
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

  const req = fetch(EVENT_STORE_URL, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
  const res = await req;
  const json = await res.json();
  return json.data._events;
};

export const importEvent = async (event: Event) => {
  // global.console.log(`importing event ${JSON.stringify(event)}`);
  if (typeof event.data === 'string') {
    event.data = JSON.parse(event.data);
  }
  const req = fetch(resolve(AGGREGATOR_URL, `events`), {
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

export const runImport = async () => {
  log(`running import`);
  const isRequired = await isImportRequired();
  let cursor: string | undefined;
  log(`import required: ${isRequired ? 'yes' : 'no'}`);
  if (isRequired) {
    while (true) {
      const events = await fetchEvents(cursor);
      if (events.length === 0) {
        log('received end of event stream');
        break;
      }
      log('importing events', events.length);
      for (const event of events) {
        await importEvent(event);
      }
      cursor = events[events.length - 1].cursor;
    }
    log('import finished');
  }
};
