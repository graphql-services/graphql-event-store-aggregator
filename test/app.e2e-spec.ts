import request, { SuperTest } from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { INestApplication } from '@nestjs/common';
// import { StoreEvent, StoreEventType } from '../src/events/store-event.model';
import { DatabaseService } from '../src/database/database.service';

import { cases } from './cases';

// const tests: { [key: string]: { events: StoreEvent[] } } =
// {
//   'import created event': {
//     events: [
//       {
//         id: 'aaa',
//         entity: 'User',
//         entityId: 'aabbcc',
//         data: {
//           id: 'a1',
//           username: 'john.doe',
//           createdAt: new Date(),
//         },
//         type: StoreEventType.CREATED,
//         date: new Date(),
//       },
//     ],
//   },
//   'import created event2': {
//     events: [
//       {
//         id: 'aaa',
//         entity: 'User',
//         entityId: 'aabbcc',
//         data: {
//           id: 'a2',
//           username: 'jane.siri',
//           createdAt: new Date(),
//         },
//         type: StoreEventType.CREATED,
//         date: new Date(),
//       },
//     ],
//   },
// };

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let test: SuperTest<any>;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    databaseService = moduleFixture.get(DatabaseService);
    test = request(app.getHttpServer());
  });

  afterEach(async () => {
    await app.close();
    await databaseService.close();
  });

  for (const caseItem of cases) {
    it(caseItem.name, async () => {
      const events = caseItem.events;

      for (const event of events) {
        await test
          .post('/events')
          .send(event)
          .expect(201)
          .expect('OK');
      }

      await test
        .post('/graphql')
        .send({
          query: caseItem.query,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          const data = res.body.data;
          expect(data).toEqual(caseItem.expectedResult);
        });
    });
  }
});
