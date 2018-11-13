import { ImportEventCase } from './model';
import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.758Z';
const creationDate = new Date(isoCreationDate);

export const data: ImportEventCase = {
  name: 'create roles',
  // only: true,
  events: [
    {
      id: 'role1',
      entity: 'Role',
      entityId: 'r1',
      data: {
        id: 'r1',
        name: 'admin',
        createdAt: creationDate,
      },
      type: StoreEventType.CREATED,
      date: creationDate,
    },
    {
      id: 'user1',
      entity: 'User',
      entityId: 'u1',
      data: {
        id: 'u1',
        username: 'john.doe',
        roles_ids: ['r1'],
        createdAt: creationDate,
      },
      type: StoreEventType.CREATED,
      date: creationDate,
    },
  ],
  queries: [
    `
    query {
        users {
            items { id username roles {id name} roles_ids }
            count
        }
    }
    `,
    `
    query {
        roles {
            items { id name users {id username} users_ids }
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
            id: 'u1',
            username: 'john.doe',
            roles: [{ id: 'r1', name: 'admin' }],
            roles_ids: ['r1'],
          },
        ],
        count: 1,
      },
    },
    {
      roles: {
        items: [
          {
            id: 'r1',
            name: 'admin',
            users: [{ id: 'u1', username: 'john.doe' }],
            users_ids: ['u1'],
          },
        ],
        count: 1,
      },
    },
  ],
};
