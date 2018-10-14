import * as nsq from 'nsqjs';

import { StoreEvent } from '../events/store-event.model';
import { EventsService } from '../events/events.service';
import { log } from '../logger';

interface PubSubServiceConfig {
  url: string;
  eventsService: EventsService;
}

export class PubSubService {
  private reader?: any;

  constructor(private readonly config: PubSubServiceConfig) {}

  async ensureWriter() {
    if (!this.reader && this.config.url) {
      this.reader = new nsq.Reader('es-event', 'aggregator', {
        lookupdHTTPAddresses: this.config.url.split(','),
        maxAttempts: 5,
      });

      this.reader.on('message', async msg => {
        try {
          const event = JSON.parse(msg.body.toString()) as StoreEvent;
          await this.config.eventsService.handleEvent(event);
          msg.finish();
        } catch (e) {
          log(`failed to process event ${msg.body.toString()},error: ${e}`);
          msg.requeue(0);
        }
      });

      this.reader.connect();
    }
  }
}
