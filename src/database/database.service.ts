import {
  createConnection,
  EntitySchema,
  Connection,
  Repository,
  EntitySchemaColumnOptions,
} from 'typeorm';
import { Entity, ModelSchema } from 'graphql/model.schema';
import { schemaForEntity } from './database.schema';
import { ENV } from 'env';
import { DriverUtils } from './driver.utils';

export class DatabaseService {
  private connection?: Connection;

  private async initializeConnection(entities: EntitySchema<any>[]) {
    const options = DriverUtils.getConnectionOptions();
    global.console.log('??', options);
    const connection = await createConnection({
      entities,
      logging: true,
      ...options,
    });

    await connection.synchronize();

    this.connection = connection;
  }

  async initialize(schema: ModelSchema) {
    const entities = schema.entities.map(x => schemaForEntity(x));
    await this.initializeConnection(entities);
    for (const entity of schema.entities) {
      this.initializeRepository(entity);
    }
  }

  private repositories: { [key: string]: Repository<any> } = {};
  initializeRepository(entity: Entity) {
    if (!this.repositories[entity.name]) {
      const connection = this.connection;
      this.repositories[entity.name] = connection.getRepository(
        schemaForEntity(entity),
      );
    }
  }

  repositoryForEntityName(entityName: string): Repository<any> {
    if (!this.repositories[entityName]) {
      throw new Error(`No repository for entity '${entityName}' found`);
    }
    return this.repositories[entityName];
  }
}

// export const DatabaseServiceProvider = {
//   provide: DatabaseService,
//   useFactory: async () => {
//     // global.console.log(modelService)
//     const service = new DatabaseService();
//     // await service.initialize(modelService.modelSchema);
//     return service;
//   },
//   inject: [ModelService],
// };
