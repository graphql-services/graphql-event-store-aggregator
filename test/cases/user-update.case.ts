import { ImportEventCase } from './model';
import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.758Z';
const creationDate = new Date(isoCreationDate);
const isoUpdateDate = '2018-10-02T06:15:53.758Z';
const updateDate = new Date(isoUpdateDate);

export const data: ImportEventCase = {
  name: 'create and update user',
  events: [
    {
      id: '1',
      entity: 'User',
      entityId: 'a1',
      data: {
        id: 'a1',
        username: 'john.doe',
        password: 'secretpassword',
        createdAt: creationDate,
        createdBy: '123456',
      },
      type: StoreEventType.CREATED,
      date: creationDate,
      principalId: '123456',
    },
    {
      id: '2',
      entity: 'User',
      entityId: 'a1',
      data: {
        id: 'a1',
        username: 'john.doe2',
        password: null,
        updatedAt: updateDate,
        updatedBy: 'abcdef',
      },
      type: StoreEventType.UPDATED,
      date: updateDate,
      principalId: 'abcdef',
    },
  ],
  query: `
    query {
        users {
            items { id username password createdAt createdBy updatedAt updatedBy }
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
          password: null,
          createdAt: isoCreationDate,
          createdBy: '123456',
          updatedAt: isoUpdateDate,
          updatedBy: 'abcdef',
        },
      ],
      count: 1,
    },
  },
};
