import request, { SuperTest } from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { INestApplication } from '@nestjs/common';
import { DatabaseService } from '../src/database/database.service';

import { cases } from './cases';

for (const caseItem of cases) {
  describe(`${caseItem.name}`, () => {
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

      const events = caseItem.events;

      for (const event of events) {
        await test
          .post('/events')
          .send(event)
          // .expect(201)
          .expect('OK');
      }
    });

    afterEach(async () => {
      await app.close();
      await databaseService.close();
    });

    for (let i = 0; i < caseItem.queries.length; i++) {
      (caseItem.only ? it.only : it)(`${caseItem.name} #${i}`, async () => {
        await test
          .post('/graphql')
          .send({
            query: caseItem.queries[i],
          })
          // .expect(200)
          .expect(res => {
            expect(res.body.errors).toBeUndefined();
            const data = res.body.data;
            expect(data).toEqual(caseItem.expectedResults[i]);
          });
      });
    }
  });
}

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

  it('should return latest event', async () => {
    const events = cases[0].events;
    const latestEvent = events[events.length - 1];

    for (const event of events) {
      await test
        .post('/events')
        .send(event)
        .expect(201)
        .expect('OK');
    }

    await test
      .get('/events/latest')
      .expect(200)
      .expect(res => {
        expect(JSON.stringify(res.body)).toBe(JSON.stringify(latestEvent));
      });
  });

  it('should provide healthcheck status', async () => {
    await test
      .get('/healthcheck')
      .expect(200)
      .expect(res => {
        expect(res.body.status).toBe('OK');
      });
  });
});
