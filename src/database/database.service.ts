import {
  Connection,
  EntitySchema,
  Repository,
  createConnection,
} from 'typeorm';
import { ModelEntity, ModelSchema } from '../model/model.schema';

import { DriverUtils } from './driver.utils';
import { ENV } from '../env';
import { Injectable } from '@nestjs/common';
import { Meta } from './entities/Meta';
import { schemaForEntity } from './database.schema';

@Injectable()
export class DatabaseService {
  private connection?: Connection;

  private repositories: { [key: string]: Repository<any> } = {};
  metadataRepository: Repository<Meta>;

  private async initializeConnection(entities: EntitySchema<any>[]) {
    const options = DriverUtils.getConnectionOptions();
    const connection = await createConnection({
      entities: [Meta, ...entities],
      logging: !!ENV.DEBUG,
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

    this.metadataRepository = this.connection.getRepository(Meta);
  }

  async close() {
    if (this.connection) await this.connection.close();
  }

  async cleanAll() {
    for (const meta of this.connection.entityMetadatas) {
      const repo = this.connection.getRepository(meta.name);
      await repo.query(`DELETE FROM ${meta.tableName}`);
    }
  }

  initializeRepository(entity: ModelEntity) {
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
