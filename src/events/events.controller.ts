import {
  Catch,
  Controller,
  Post,
  Body,
  HttpException,
  Get,
} from '@nestjs/common';

import { EventsService } from './events.service';
import { StoreEvent } from './store-event.model';

@Catch()
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('/latest')
  async fetchLatestEvent(): Promise<StoreEvent | null> {
    return this.eventsService.getLatestEvent();
  }

  @Post()
  async importEvents(@Body() body): Promise<string> {
    try {
      const event = body as StoreEvent;
      await this.eventsService.handleEvent(event);
      return 'OK';
    } catch (e) {
      throw new HttpException(
        `failed to import event, error: ${e.message}`,
        400,
      );
    }
  }
}
