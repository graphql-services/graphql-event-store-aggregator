import { Injectable } from '@nestjs/common';

import { PubSubService } from './pubsub.service';
import { ENV } from '../env';
import { EventsService } from '../events/events.service';
// import { DatabaseService } from 'database/database.service';
// import { ModelService } from '../model/model.service';

@Injectable()
export class PubSubFactory {
  constructor(
    // private readonly databaseService: DatabaseService,
    // private readonly modelService: ModelService,
    private readonly eventsService: EventsService,
  ) {}

  isServiceEnabled(): boolean {
    return !!ENV.NSQ_URL;
  }

  getService(): PubSubService {
    return new PubSubService({
      url: ENV.NSQ_URL,
      // databaseService: this.databaseService,
      // modelSchema: this.modelService.modelSchema,
      eventsService: this.eventsService,
    });
  }
}
