import { Injectable } from '@nestjs/common';
import { PubSubService } from './pubsub.service';
import { ENV } from 'env';
import { DatabaseService } from 'database/database.service';
import { ModelService } from 'graphql/model.service';

@Injectable()
export class PubSubFactory {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly modelService: ModelService,
  ) {}

  isServiceEnabled(): boolean {
    return !!ENV.NSQ_URL;
  }

  getService(): PubSubService {
    return new PubSubService({
      url: ENV.NSQ_URL || ':4160',
      databaseService: this.databaseService,
      modelSchema: this.modelService.modelSchema,
    });
  }
}
