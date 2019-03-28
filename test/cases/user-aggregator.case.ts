import { ImportEventCase, createEntityEvent } from './model';
import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.000Z';
const creationDate = new Date(isoCreationDate);

export const data: ImportEventCase = {
  name: 'user aggregator',
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
  ],
  queries: [
    `
    query {
        users {
            items {
              username
              ... on User {
                id
                createdBy
              }
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
            id: 'a1',
            username: 'john.doe',
            createdBy: '123456',
          },
        ],
        count: 1,
      },
    },
  ],
};
