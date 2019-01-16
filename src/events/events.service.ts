import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { StoreEvent, StoreEventType } from './store-event.model';
import { DatabaseService } from '../database/database.service';
import { ModelEntity } from '../model/model.schema';
import { ModelService } from '../model/model.service';
import { Meta } from '../database/entities/Meta';
import { log } from '../logger';
import { apply } from './changeset';

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

    log(
      JSON.stringify({
        type: 'received event',
        event,
      }),
    );

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
    const entityData = apply(event.data, {});
    entityData.createdAt = event.date;
    entityData.createdBy = event.principalId;
    const data = this.getDataForStorage(entityData, entity);
    log(
      JSON.stringify({
        type: 'create',
        changes: event.data,
        to: data,
        entityData,
      }),
    );
    const item = repo.create({ id: event.entityId, ...data });
    await repo.save(item);
    await this.setLatestEvent(event);
  }

  private async handleUpdateEvent(
    event: StoreEvent,
    repo: Repository<any>,
    entity: ModelEntity,
  ) {
    const item = await this.loadEntityData(repo, event, entity);
    if (item) {
      const entityData = apply(event.data, { ...item });
      entityData.updatedAt = event.date;
      entityData.updatedBy = event.principalId;
      const data = this.getDataForStorage(entityData, entity);

      log(
        JSON.stringify({
          type: 'update',
          from: item,
          changes: event.data,
          to: data,
          entityData,
        }),
      );

      repo.merge(item, data);
      await repo.save(item);
    }
  }

  private async handleDeleteEvent(event: StoreEvent, repo: Repository<any>) {
    await repo.delete(event.entityId);
  }

  private loadEntityData(
    repo: Repository<any>,
    event: StoreEvent,
    entity: ModelEntity,
  ): any {
    const relations = event.columns
      .map(column => column.replace('Ids', '').replace('Id', ''))
      .filter(column => entity.hasRelation(column));
    return repo.findOne({
      where: { id: event.entityId },
      relations,
    });
  }

  private getDataForStorage(data: any, entity: ModelEntity): any {
    const result = {};
    for (const fieldName of Object.keys(entity.fields)) {
      const field = entity.fields[fieldName];
      if (
        (field.isReference() && data[fieldName + 'Id']) ||
        data[fieldName + 'Id'] === null
      ) {
        result[fieldName] = { id: data[fieldName + 'Id'] };
      } else if (field.isReferenceList() && data[fieldName + 'Ids']) {
        if (typeof data[fieldName + 'Ids'] === 'object') {
          data[fieldName + 'Ids'] = Object.values(data[fieldName + 'Ids']);
        }
        result[fieldName] = data[fieldName + 'Ids'].map(x => ({ id: x }));
      } else if (typeof data[fieldName] !== 'undefined') {
        result[fieldName] = data[fieldName];
      }
    }
    return result;
  }
}
