import { ImportEventCase, createEntityEvent } from './model';

import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.758Z';
const creationDate = new Date(isoCreationDate);

export const data: ImportEventCase = {
  name: 'fetch user',
  // only: true,
  events: [
    createEntityEvent({
      entity: 'User',
      entityId: 'a1',
      data: {
        username: 'john.doe',
      },
      date: creationDate,
      principalId: '123456',
    }),
    createEntityEvent({
      entity: 'User',
      entityId: 'a2',
      data: {
        username: 'jane',
      },
      date: creationDate,
      principalId: '123456',
    }),
  ],
  queries: [
    `
    query {
        user(filter:{username:"jane"}) {
          __typename
          id username createdAt updatedAt createdBy updatedBy company { id } companyId
        }
    }
  `,
  ],
  expectedResults: [
    {
      user: {
        __typename: 'User',
        id: 'a2',
        username: 'jane',
        createdAt: isoCreationDate,
        updatedAt: null,
        company: null,
        companyId: null,
        createdBy: '123456',
        updatedBy: null,
      },
    },
  ],
};
