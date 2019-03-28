import { ImportEventCase, createEntityEvent, updateEntityEvent } from './model';

import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.000Z';
const creationDate = new Date(isoCreationDate);
const isoUpdateDate = '2018-10-02T06:15:53.000Z';
const updateDate = new Date(isoUpdateDate);

export const data: ImportEventCase = {
  name: 'create and update user',
  events: [
    createEntityEvent({
      entity: 'User',
      entityId: 'a1',
      data: {
        username: 'john.doe',
        password: 'secretpassword',
        firstname: 'John',
        retired: true,
        retired2: false,
      },
      date: creationDate,
      principalId: '123456',
    }),
    updateEntityEvent({
      entity: 'User',
      entityId: 'a1',
      dataFrom: {
        username: 'john.doe',
        password: 'secretpassword',
        firstname: 'John',
        retired: true,
        retired2: false,
      },
      data: {
        id: 'a1',
        username: 'john.doe2',
        password: null,
        firstname: '',
        retired: false,
        retired2: true,
      },
      date: updateDate,
      principalId: 'abcdef',
    }),
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
