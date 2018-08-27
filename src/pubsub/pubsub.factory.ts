import { Injectable } from '@nestjs/common';
import { PubSubService } from './pubsub.service';
import { ENV } from 'env';
import { DatabaseService } from 'database/database.service';

@Injectable()
export class PubSubFactory {
  constructor(private readonly databaseService: DatabaseService) {}

  isServiceEnabled(): boolean {
    return !!ENV.NSQ_URL;
  }

  getService(): PubSubService {
    return new PubSubService({
      url: ENV.NSQ_URL || ':4160',
      databaseService: this.databaseService,
    });
  }
}
