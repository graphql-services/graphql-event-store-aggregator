import { ImportEventCase, createEntityEvent } from './model';
import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.758Z';
const creationDate = new Date(isoCreationDate);

export const data: ImportEventCase = {
  name: 'search company with employees',
  // only: true,
  events: [
    createEntityEvent({
      entity: 'User',
      entityId: 'a1',
      data: {
        username: 'john.doe',
      },
      date: creationDate,
    }),
    createEntityEvent({
      entity: 'Company',
      entityId: 'c1',
      data: {
        name: 'test company',
        employeesIds: ['a1'],
      },
      date: creationDate,
    }),
    createEntityEvent({
      entity: 'Company',
      entityId: 'c2',
      data: {
        name: 'Another company',
      },
      date: creationDate,
    }),
  ],
  queries: [
    `
    query {
        companies(q:"john.doe") {
            items { id name employees { id username } }
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
            employees: [
              {
                id: 'a1',
                username: 'john.doe',
              },
            ],
            // createdAt: isoCreationDate,
            // updatedAt: null,
          },
        ],
        count: 1,
      },
    },
  ],
};
