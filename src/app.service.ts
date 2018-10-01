import { Injectable } from '@nestjs/common';
import { GraphQLSchema } from 'graphql';

import { DatabaseService } from './database/database.service';
import { ModelService } from './model/model.service';

@Injectable()
export class AppService {
  constructor(
    private readonly modelService: ModelService,
    private readonly databaseService: DatabaseService,
  ) {}

  getSchema(): GraphQLSchema {
    return this.modelService.getGraphQLSchema(
      this.modelService.modelSchema,
      this.databaseService,
    );
  }
}

export const AppServiceProvider = {
  provide: AppService,
  useFactory: async (
    modelService: ModelService,
    databaseService: DatabaseService,
  ) => {
    const service = new AppService(modelService, databaseService);
    await databaseService.initialize(modelService.modelSchema);
    return service;
  },
  inject: [ModelService, DatabaseService],
};
