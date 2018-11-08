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
        firstname: 'John',
        retired: true,
        retired2: false,
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
        firstname: '',
        retired: false,
        retired2: true,
        updatedAt: updateDate,
        updatedBy: 'abcdef',
      },
      type: StoreEventType.UPDATED,
      date: updateDate,
      principalId: 'abcdef',
    },
  ],
  queries: [
    `
    query {
        users {
            items { id username password firstname retired retired2 createdAt createdBy updatedAt updatedBy }
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
            username: 'john.doe2',
            password: null,
            firstname: '',
            retired: false,
            retired2: true,
            createdAt: isoCreationDate,
            createdBy: '123456',
            updatedAt: isoUpdateDate,
            updatedBy: 'abcdef',
          },
        ],
        count: 1,
      },
    },
  ],
};
