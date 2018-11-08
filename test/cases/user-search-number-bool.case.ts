import { ImportEventCase } from './model';
import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.758Z';
const creationDate = new Date(isoCreationDate);

export const data: ImportEventCase = {
  name: 'search user by number and boolean',
  events: [
    {
      id: 'aaa',
      entity: 'User',
      entityId: 'aabbcc',
      data: {
        id: 'john.doe',
        username: 'john',
        password: 'test',
        age: 23,
        retired: false,
        createdAt: creationDate,
        createdBy: '123456',
      },
      type: StoreEventType.CREATED,
      date: creationDate,
    },
    {
      id: 'aaa',
      entity: 'User',
      entityId: 'aabbcc',
      data: {
        id: 'john.old',
        username: 'john',
        password: 'test',
        age: 68,
        retired: true,
        createdAt: creationDate,
        createdBy: '123456',
      },
      type: StoreEventType.CREATED,
      date: creationDate,
    },
  ],
  queries: [
    `
    query {
        users(filter:{age:23,retired: false},sort: [USERNAME_ASC, CREATEDAT_DESC]) {
          items {
            id age retired
          }
          count
        }
    }
  `,
    `
  query {
      users(filter:{age:68,retired: true},sort: [USERNAME_ASC, CREATEDAT_DESC]) {
        items {
          id age retired
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
            id: 'john.doe',
            age: 23,
            retired: false,
          },
        ],
        count: 1,
      },
    },
    {
      users: {
        items: [
          {
            id: 'john.old',
            age: 68,
            retired: true,
          },
        ],
        count: 1,
      },
    },
  ],
};
