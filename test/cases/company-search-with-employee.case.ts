import { ImportEventCase } from './model';
import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.758Z';
const creationDate = new Date(isoCreationDate);

export const data: ImportEventCase = {
  name: 'search company with employees',
  // only: true,
  events: [
    {
      id: 'aaa',
      entity: 'User',
      entityId: 'aabbcc',
      data: {
        id: 'a1',
        username: 'john.doe',
        createdAt: creationDate,
      },
      type: StoreEventType.CREATED,
      date: creationDate,
    },
    {
      id: 'bbb',
      entity: 'Company',
      entityId: 'c1',
      data: {
        id: 'c1',
        name: 'test company',
        employees_ids: ['a1'],
        createdAt: creationDate,
      },
      type: StoreEventType.CREATED,
      date: creationDate,
    },
    {
      id: 'ccc',
      entity: 'Company',
      entityId: 'c2',
      data: {
        id: 'c2',
        name: 'Another company',
        createdAt: creationDate,
      },
      type: StoreEventType.CREATED,
      date: creationDate,
    },
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
