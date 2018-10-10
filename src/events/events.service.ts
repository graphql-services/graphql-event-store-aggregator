import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { StoreEvent, StoreEventType } from './store-event.model';
import { DatabaseService } from '../database/database.service';
import { ModelEntity } from '../model/model.schema';
import { ModelService } from '../model/model.service';
import { Meta } from '../database/entities/Meta';
import { log } from '../logger';

@Injectable()
export class EventsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly modelService: ModelService,
  ) {}

  async handleEvent(event: StoreEvent) {
    const db = this.databaseService;
    const repo = db.repositoryForEntityName(event.entity);
    const entity = this.modelService.modelSchema.getEntityForName(event.entity);

    log('received event:', JSON.stringify(event));

    switch (event.type) {
      case StoreEventType.CREATED:
        return this.handleCreateEvent(event, repo, entity);
      case StoreEventType.UPDATED:
        return this.handleUpdateEvent(event, repo, entity);
      case StoreEventType.DELETED:
        return this.handleDeleteEvent(event, repo);
    }
  }

  async getLatestEvent(): Promise<StoreEvent | undefined> {
    const meta = await this.databaseService.metadataRepository.findOne(
      'latestEventData',
    );

    if (meta) {
      return JSON.parse(meta.value) as StoreEvent;
    }

    return undefined;
  }
  private async setLatestEvent(event: StoreEvent) {
    await this.databaseService.metadataRepository.delete('latestEventData');
    const meta = new Meta();
    meta.key = 'latestEventData';
    meta.value = JSON.stringify(event);
    await this.databaseService.metadataRepository.save(meta);
  }

  private async handleCreateEvent(
    event: StoreEvent,
    repo: Repository<any>,
    entity: ModelEntity,
  ) {
    const data = this.getDataForStorage(event.data, entity);
    log('data for create:', data);
    const item = repo.create({ id: event.entityId, ...data });
    await repo.save(item);
    await this.setLatestEvent(event);
  }

  private async handleUpdateEvent(
    event: StoreEvent,
    repo: Repository<any>,
    entity: ModelEntity,
  ) {
    const item = await repo.findOne({
      where: { id: event.entityId },
    });
    if (item) {
      const data = this.getDataForStorage(event.data, entity);
      log('data for update:', data);
      repo.merge(item, data);
      await repo.save(item);
    }
  }

  private async handleDeleteEvent(event: StoreEvent, repo: Repository<any>) {
    await repo.delete(event.entityId);
  }

  private getDataForStorage(data: any, entity: ModelEntity): any {
    const result = {};
    for (const fieldName of Object.keys(entity.fields)) {
      const field = entity.fields[fieldName];
      if (
        (field.isReference() && data[fieldName + '_id']) ||
        data[fieldName + '_id'] === null
      ) {
        result[fieldName] = { id: data[fieldName + '_id'] };
      } else if (field.isReferenceList() && data[fieldName + '_ids']) {
        result[fieldName] = data[fieldName + '_ids'].map(x => ({ id: x }));
      } else if (data[fieldName] || data[fieldName] === null) {
        result[fieldName] = data[fieldName];
      }
    }
    return result;
  }
}
