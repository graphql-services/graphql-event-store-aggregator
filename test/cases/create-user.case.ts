import { ImportEventCase } from './model';
import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.758Z';
const creationDate = new Date(isoCreationDate);

export const data: ImportEventCase = {
  name: 'create user test',
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
  ],
  query: `
    query {
        users {
            items { id username createdAt updatedAt }
            count
        }
    }
  `,
  expectedResult: {
    users: {
      items: [
        {
          id: 'a1',
          username: 'john.doe',
          createdAt: isoCreationDate,
          updatedAt: null,
        },
      ],
      count: 1,
    },
  },
};
