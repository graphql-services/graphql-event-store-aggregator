import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { StoreEvent, StoreEventType } from './store-event.model';
import { DatabaseService } from '../database/database.service';
import { Entity } from '../model/model.schema';
import { ModelService } from '../model/model.service';

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

    switch (event.type) {
      case StoreEventType.CREATED:
        return this.handleCreateEvent(event, repo, entity);
      case StoreEventType.UPDATED:
        return this.handleUpdateEvent(event, repo, entity);
      case StoreEventType.DELETED:
        return this.handleDeleteEvent(event, repo);
    }
  }

  private async handleCreateEvent(
    event: StoreEvent,
    repo: Repository<any>,
    entity: Entity,
  ) {
    const data = this.getDataForStorage(event.data, entity);
    const item = repo.create({ id: event.entityId, ...data });
    await repo.save(item);
  }

  private async handleUpdateEvent(
    event: StoreEvent,
    repo: Repository<any>,
    entity: Entity,
  ) {
    const item = await repo.findOne({
      where: { id: event.entityId },
    });
    if (item) {
      const data = this.getDataForStorage(event.data, entity);
      repo.merge(item, data);
      await repo.save(item);
    }
  }

  private async handleDeleteEvent(event: StoreEvent, repo: Repository<any>) {
    await repo.delete(event.entityId);
  }

  private getDataForStorage(data: any, entity: Entity): any {
    const result = {};
    for (const fieldName of Object.keys(entity.fields)) {
      const field = entity.fields[fieldName];
      if (field.isReference() && data[fieldName + '_id']) {
        result[fieldName] = { id: data[fieldName + '_id'] };
      } else if (field.isReferenceList() && data[fieldName + '_ids']) {
        result[fieldName] = data[fieldName + '_ids'].map(x => ({ id: x }));
      } else if (data[fieldName]) {
        result[fieldName] = data[fieldName];
      }
    }
    return result;
  }
}
