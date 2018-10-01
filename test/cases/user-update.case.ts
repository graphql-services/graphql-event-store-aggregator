import { ImportEventCase } from './model';
import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.758Z';
const creationDate = new Date(isoCreationDate);
const isoUpdateDate = '2018-10-02T06:15:53.758Z';
const updateDate = new Date(isoUpdateDate);

export const data: ImportEventCase = {
  name: 'create and delete user',
  events: [
    {
      id: '1',
      entity: 'User',
      entityId: 'a1',
      data: {
        id: 'a1',
        username: 'john.doe',
        createdAt: creationDate,
      },
      type: StoreEventType.CREATED,
      date: creationDate,
    },
    {
      id: '2',
      entity: 'User',
      entityId: 'a1',
      data: {
        id: 'a1',
        username: 'john.doe2',
        updatedAt: updateDate,
      },
      type: StoreEventType.UPDATED,
      date: updateDate,
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
          username: 'john.doe2',
          createdAt: isoCreationDate,
          updatedAt: isoUpdateDate,
        },
      ],
      count: 1,
    },
  },
};
