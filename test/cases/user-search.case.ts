import { ImportEventCase } from './model';
import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.758Z';
const creationDate = new Date(isoCreationDate);

export const data: ImportEventCase = {
  name: 'search user',
  events: [
    {
      id: 'aaa',
      entity: 'User',
      entityId: 'aabbcc',
      data: {
        id: 'john.test',
        username: 'john',
        password: 'test',
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
        id: 'john.doe',
        username: 'john',
        password:
          'c9cc61d920d4349df9f71ea323fb1c14988fe8e147d9917d9c3808035d4c77b1d8cf1a193030a4c5772cd11606fdd5b2dea3051573e077db2e12bd661155308d',
        createdAt: creationDate,
        createdBy: '123456',
      },
      type: StoreEventType.CREATED,
      date: creationDate,
    },
    {
      id: 'ccc',
      entity: 'User',
      entityId: 'aabbcc2',
      data: {
        id: 'siri',
        username: 'jane',
        password:
          'c9cc61d920d4349df9f71ea323fb1c14988fe8e147d9917d9c3808035d4c77b1d8cf1a193030a4c5772cd11606fdd5b2dea3051573e077db2e12bd661155308d',
        createdAt: creationDate,
        createdBy: '123456',
      },
      type: StoreEventType.CREATED,
      date: creationDate,
    },
  ],
  query: `
    query {
        users(q:"jo?n",filter:{password:"doe"}) {
          items {
            id username createdAt updatedAt createdBy updatedBy company { id } company_id
          }
          count
        }
    }
  `,
  expectedResult: {
    users: {
      items: [
        {
          id: 'john.doe',
          username: 'john',
          createdAt: isoCreationDate,
          updatedAt: null,
          company: null,
          company_id: null,
          createdBy: '123456',
          updatedBy: null,
        },
      ],
      count: 1,
    },
  },
};
