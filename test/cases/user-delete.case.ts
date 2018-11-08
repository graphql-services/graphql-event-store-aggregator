import { ImportEventCase } from './model';
import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.758Z';
const creationDate = new Date(isoCreationDate);
const isoDeletionDate = '2018-10-02T06:15:53.758Z';
const deletionDate = new Date(isoDeletionDate);

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
      data: null,
      type: StoreEventType.DELETED,
      date: deletionDate,
    },
  ],
  queries: [
    `
    query {
        users {
            items { id username createdAt updatedAt }
            count
        }
    }
  `,
  ],
  expectedResults: [
    {
      users: {
        items: [],
        count: 0,
      },
    },
  ],
};
