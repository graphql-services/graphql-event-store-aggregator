import { Injectable } from '@nestjs/common';

import { ENV } from '../env';
import { PubSubService } from './pubsub.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class PubSubFactory {
  constructor(
    private readonly eventsService: EventsService,
  ) {}

  isServiceEnabled(): boolean {
    return !!ENV.NSQ_URL;
  }

  getService(): PubSubService {
    return new PubSubService({
      url: ENV.NSQ_URL,
      eventsService: this.eventsService,
    });
  }
}
