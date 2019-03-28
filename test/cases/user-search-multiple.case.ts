import { ImportEventCase, createEntityEvent } from './model';

import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.000Z';
const creationDate = new Date(isoCreationDate);

export const data: ImportEventCase = {
  name: 'search user by multiple columns',
  // only: true,
  events: [
    createEntityEvent({
      entity: 'User',
      entityId: 'john.test',
      data: {
        username: 'john',
        password: 'test',
      },
      date: creationDate,
      principalId: '123456',
    }),
    createEntityEvent({
      entity: 'User',
      entityId: 'john.doe',
      data: {
        username: 'john',
        password:
          'c9cc61d920d4349df9f71ea323fb1c14988fe8e147d9917d9c3808035d4c77b1d8cf1a193030a4c5772cd11606fdd5b2dea3051573e077db2e12bd661155308d',
      },
      date: creationDate,
      principalId: '123456',
    }),
    createEntityEvent({
      entity: 'User',
      entityId: 'siri',
      data: {
        username: 'jane',
        password:
          'c9cc61d920d4349df9f71ea323fb1c14988fe8e147d9917d9c3808035d4c77b1d8cf1a193030a4c5772cd11606fdd5b2dea3051573e077db2e12bd661155308d',
      },
      date: creationDate,
      principalId: '123456',
    }),
  ],
  queries: [
    `
    query {
        users(filter:{username:"john",password:"doe"},sort: [USERNAME_ASC, CREATEDAT_DESC]) {
          items {
            id username createdAt updatedAt createdBy updatedBy company { id } companyId
          }
          count
        }
    }
  `,
  ],
  expectedResults: [
    {
      users: {
        items: [
          {
            id: 'john.doe',
            username: 'john',
            createdAt: isoCreationDate,
            updatedAt: null,
            company: null,
            companyId: null,
            createdBy: '123456',
            updatedBy: null,
          },
        ],
        count: 1,
      },
    },
  ],
};
