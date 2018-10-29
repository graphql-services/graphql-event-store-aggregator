import { ImportEventCase } from './model';
import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.758Z';
const creationDate = new Date(isoCreationDate);

export const data: ImportEventCase = {
  name: 'fetch user',
  events: [
    {
      id: 'aaa',
      entity: 'User',
      entityId: 'aabbcc',
      data: {
        id: 'a1',
        username: 'john.doe',
        createdAt: creationDate,
        createdBy: '123456',
      },
      type: StoreEventType.CREATED,
      date: creationDate,
    },
    {
      id: 'bbb',
      entity: 'User',
      entityId: 'aabbcc2',
      data: {
        id: 'a2',
        username: 'jane',
        createdAt: creationDate,
        createdBy: '123456',
      },
      type: StoreEventType.CREATED,
      date: creationDate,
    },
  ],
  query: `
    query {
        users(filter:{username:"jane"}) {
          items{
            id username createdAt updatedAt createdBy updatedBy company { id } company_id
          }
        }
    }
  `,
  expectedResult: {
    users: {
      items: [
        {
          id: 'a2',
          username: 'jane',
          createdAt: isoCreationDate,
          updatedAt: null,
          company: null,
          company_id: null,
          createdBy: '123456',
          updatedBy: null,
        },
      ],
    },
  },
};
