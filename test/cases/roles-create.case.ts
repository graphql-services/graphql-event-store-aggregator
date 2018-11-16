import { ImportEventCase, createEntityEvent } from './model';
import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.758Z';
const creationDate = new Date(isoCreationDate);

export const data: ImportEventCase = {
  name: 'create roles',
  // only: true,
  events: [
    createEntityEvent({
      entity: 'Role',
      entityId: 'r1',
      data: {
        name: 'admin',
      },
      date: creationDate,
    }),
    createEntityEvent({
      entity: 'User',
      entityId: 'u1',
      data: {
        username: 'john.doe',
        rolesIds: ['r1'],
      },
      date: creationDate,
    }),
  ],
  queries: [
    `
    query {
        users {
            items { id username roles {id name} rolesIds }
            count
        }
    }
    `,
    `
    query {
        roles {
            items { id name users {id username} usersIds }
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
            rolesIds: ['r1'],
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
            usersIds: ['u1'],
          },
        ],
        count: 1,
      },
    },
  ],
};
