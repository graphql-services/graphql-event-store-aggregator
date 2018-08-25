import * as diff from 'changeset';
import * as nsq from 'nsq.js';
import { StoreEvent, StoreEventType } from './store-event.model';
import { DatabaseService } from 'database/database.service';
import { Repository } from 'typeorm';

interface PubSubServiceConfig {
  url: string;
  databaseService: DatabaseService;
}

export class PubSubService {
  private reader?: any;

  constructor(private readonly config: PubSubServiceConfig) {}

  async ensureWriter() {
    if (!this.reader) {
      this.reader = nsq.reader({
        nsqd: this.config.url.split(','),
        maxInFlight: 1,
        maxAttempts: 5,
        topic: 'es-event',
        channel: 'aggregator',
      });
      this.reader.on('error', err => {
        global.console.log('error', err);
      });

      this.reader.on('message', async msg => {
        const event = JSON.parse(msg.body.toString()) as StoreEvent;
        await this.handleEvent(event);
        msg.finish();
      });
    }
  }

  async handleEvent(event: StoreEvent) {
    const db = this.config.databaseService;
    const repo = db.repositoryForEntityName(event.entity);

    global.console.log(event);

    switch (event.type) {
      case StoreEventType.CREATED:
        this.handleCreateEvent(event, repo);
        break;
      case StoreEventType.UPDATED:
        this.handleUpdateEvent(event, repo);
        break;
      case StoreEventType.DELETED:
        this.handleDeleteEvent(event, repo);
        break;
    }
  }

  async handleCreateEvent(event: StoreEvent, repo: Repository<any>) {
    const data = diff.apply(event.data, {});
    data.createdAt = event.date;
    const item = repo.create({ id: event.entityId, ...data });
    await repo.save(item);
  }

  async handleUpdateEvent(event: StoreEvent, repo: Repository<any>) {
    const item = await repo.findOne({
      where: { id: event.entityId },
    });
    if (item) {
      const data = diff.apply(event.data, item);
      data.updatedAt = event.date;
      repo.merge(item, data);
      await repo.save(item);
    }
  }

  async handleDeleteEvent(event: StoreEvent, repo: Repository<any>) {
    await repo.delete(event.entityId);
  }
}
