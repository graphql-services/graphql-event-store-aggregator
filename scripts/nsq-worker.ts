import * as nsq from 'nsqjs';

import { log } from '../src/logger';
import { getENV } from '../src/env';
import { runImport, importEvent, Event } from './tools';

const NSQ_URL: string = getENV('NSQ_URL');

const start = async () => {
  await runImport();

  log(`creating NSQ reader 'aggregator' for 'es-event' topic`);
  const reader = new nsq.Reader('es-event', 'aggregator', {
    lookupdHTTPAddresses: NSQ_URL.split(','),
    maxAttempts: 5,
  });

  reader.on('message', async msg => {
    try {
      const rawEvent = msg.body.toString();
      log(`received event`, rawEvent);
      const event = JSON.parse(rawEvent) as Event;
      await importEvent(event);
      msg.finish();
      log(`event processed`, rawEvent);
    } catch (e) {
      log(`failed to process event ${msg.body.toString()},error: ${e}`);
      msg.requeue(0);
    }
  });

  reader.connect();
  log(`NSQ reader started`);
};

start();
