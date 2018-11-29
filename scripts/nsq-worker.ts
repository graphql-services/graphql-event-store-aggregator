import nsq from 'nsqjs';

import { log } from '../src/logger';
import { getENV } from '../src/env';
import { runImport, importEvent, Event } from './tools';

const NSQ_URL: string = getENV('NSQ_URL');

const start = async () => {
  global.console.log();
  await runImport();

  const reader = new nsq.Reader('es-event', 'aggregator', {
    lookupdHTTPAddresses: NSQ_URL.split(','),
    maxAttempts: 5,
  });

  reader.on('message', async msg => {
    try {
      const event = JSON.parse(msg.body.toString()) as Event;
      await importEvent(event);
      msg.finish();
    } catch (e) {
      log(`failed to process event ${msg.body.toString()},error: ${e}`);
      msg.requeue(0);
    }
  });

  this.reader.connect();
};

start();
