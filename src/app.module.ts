import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { graphqlExpress } from 'apollo-server-express';
import expressPlayground from 'graphql-playground-middleware-express';
import { GraphQLModule } from '@nestjs/graphql';

import { AppService, AppServiceProvider } from './app.service';
import { PubSubFactory } from './pubsub/pubsub.factory';
import { EventsModule } from './events/events.module';
import { PubSubModule } from './pubsub/pubsub.module';
import { DatabaseModule } from './database/database.module';
import { ModelModule } from './model/model.module';
import { HealthCheckModule } from './healthcheck/healthcheck.module';

@Module({
  imports: [
    GraphQLModule,
    EventsModule,
    PubSubModule,
    DatabaseModule,
    ModelModule,
    HealthCheckModule,
  ],
  providers: [AppServiceProvider],
})
export class AppModule implements NestModule {
  constructor(
    private readonly appService: AppService,
    private readonly pubsubFactory: PubSubFactory,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    const service = this.pubsubFactory.getService();
    service.ensureWriter();

    const schema = this.appService.getSchema();
    consumer
      .apply(
        graphqlExpress(req => ({
          schema,
          rootValue: req,
          tracing: true,
          // formatError: (e: Error) => {
          //   global.console.log(e.stack);
          //   return {message:e.message};
          // },
        })),
      )
      .forRoutes({ path: '/graphql', method: RequestMethod.POST })
      .apply(expressPlayground({ endpoint: '/graphql' }))
      .forRoutes({ path: '/graphql', method: RequestMethod.GET });
  }
}
