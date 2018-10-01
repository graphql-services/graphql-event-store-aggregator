// import * as diff from 'changeset';
// import * as nsq from 'nsq.js';
import * as nsq from 'nsqjs';
import { StoreEvent } from '../events/store-event.model';
// import { DatabaseService } from 'database/database.service';
// import { Repository } from 'typeorm';
// import { Entity, ModelSchema } from 'graphql/model.schema';
import { EventsService } from '../events/events.service';

interface PubSubServiceConfig {
  url: string;
  eventsService: EventsService;
  // databaseService: DatabaseService;
  // modelSchema: ModelSchema;
}

export class PubSubService {
  private reader?: any;

  constructor(private readonly config: PubSubServiceConfig) {}

  async ensureWriter() {
    if (!this.reader && this.config.url) {
      this.reader = new nsq.Reader('es-event', 'aggregator', {
        lookupdHTTPAddresses: this.config.url.split(','),
      });

      this.reader.on('message', async msg => {
        const event = JSON.parse(msg.body.toString()) as StoreEvent;
        await this.config.eventsService.handleEvent(event);
        msg.finish();
      });

      this.reader.connect();
    }
  }

  // async handleEvent(event: StoreEvent) {
  //   const db = this.config.databaseService;
  //   const repo = db.repositoryForEntityName(event.entity);
  //   const entity = this.config.modelSchema.getEntityForName(event.entity);

  //   switch (event.type) {
  //     case StoreEventType.CREATED:
  //       this.handleCreateEvent(event, repo, entity);
  //       break;
  //     case StoreEventType.UPDATED:
  //       this.handleUpdateEvent(event, repo, entity);
  //       break;
  //     case StoreEventType.DELETED:
  //       this.handleDeleteEvent(event, repo);
  //       break;
  //   }
  // }

  // async handleCreateEvent(
  //   event: StoreEvent,
  //   repo: Repository<any>,
  //   entity: Entity,
  // ) {
  //   const data = this.getDataForStorage(event.data, entity);
  //   const item = repo.create({ id: event.entityId, ...data });
  //   await repo.save(item);
  // }

  // async handleUpdateEvent(
  //   event: StoreEvent,
  //   repo: Repository<any>,
  //   entity: Entity,
  // ) {
  //   const item = await repo.findOne({
  //     where: { id: event.entityId },
  //   });
  //   if (item) {
  //     const data = this.getDataForStorage(event.data, entity);
  //     repo.merge(item, data);
  //     await repo.save(item);
  //   }
  // }

  // private getDataForStorage(data: any, entity: Entity): any {
  //   const result = {};
  //   for (const fieldName of Object.keys(entity.fields)) {
  //     const field = entity.fields[fieldName];
  //     if (field.isReference() && data[fieldName + '_id']) {
  //       result[fieldName] = { id: data[fieldName + '_id'] };
  //     } else if (field.isReferenceList() && data[fieldName + '_ids']) {
  //       result[fieldName] = data[fieldName + '_ids'].map(x => ({ id: x }));
  //     } else if (data[fieldName]) {
  //       result[fieldName] = data[fieldName];
  //     }
  //   }
  //   return result;
  // }

  // async handleDeleteEvent(event: StoreEvent, repo: Repository<any>) {
  //   await repo.delete(event.entityId);
  // }
}
