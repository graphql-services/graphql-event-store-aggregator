import { ImportEventCase, createEntityEvent } from './model';

import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.000Z';
const creationDate = new Date(isoCreationDate);
const isoCreationDate2 = '2018-10-03T15:15:53.000Z';
const creationDate2 = new Date(isoCreationDate2);

export const data: ImportEventCase = {
  name: 'limiting and offset',
  // only: true,
  events: [
    createEntityEvent({
      entity: 'User',
      entityId: 'a1',
      data: {
        username: 'john.doe',
        age: 30,
      },
      date: creationDate,
    }),
    createEntityEvent({
      entity: 'User',
      entityId: 'a2',
      data: {
        username: 'jane.siri',
        age: 25,
      },
      date: creationDate2,
    }),
    createEntityEvent({
      entity: 'User',
      entityId: 'a3',
      data: {
        username: 'user3',
        age: 35,
      },
      date: creationDate2,
    }),
  ],
  queries: [
    `
      query {
          users(sort:[ID_ASC], limit:1) {
            items{
              id username
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
          },
        ],
        count: 3,
      },
    },
  ],
};
