import { ImportEventCase, createEntityEvent } from './model';

import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.000Z';
const creationDate = new Date(isoCreationDate);

export const data: ImportEventCase = {
  name: 'create company',
  // only: true,
  events: [
    createEntityEvent({
      entity: 'Company',
      entityId: 'c1',
      data: {
        name: 'test company',
      },
      date: creationDate,
    }),
  ],
  queries: [
    `
    query {
        companies {
            items { id name createdAt updatedAt employees { id username } }
            count
        }
    }
  `,
  ],
  expectedResults: [
    {
      companies: {
        items: [
          {
            id: 'c1',
            name: 'test company',
            employees: [],
            createdAt: isoCreationDate,
            updatedAt: null,
          },
        ],
        count: 1,
      },
    },
  ],
};
