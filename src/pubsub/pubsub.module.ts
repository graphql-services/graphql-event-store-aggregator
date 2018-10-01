import { Module } from '@nestjs/common';
import { PubSubFactory } from './pubsub.factory';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  providers: [PubSubFactory],
  exports: [PubSubFactory],
})
export class PubSubModule {}
