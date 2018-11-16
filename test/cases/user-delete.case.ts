import { ImportEventCase, createEntityEvent, deleteEntityEvent } from './model';
import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.758Z';
const creationDate = new Date(isoCreationDate);
const isoDeletionDate = '2018-10-02T06:15:53.758Z';
const deletionDate = new Date(isoDeletionDate);

export const data: ImportEventCase = {
  name: 'create and delete user',
  events: [
    createEntityEvent({
      entity: 'User',
      entityId: 'a1',
      data: {
        username: 'john.doe',
      },
      date: creationDate,
      principalId: '123456',
    }),
    deleteEntityEvent({ entity: 'User', entityId: 'a1', date: deletionDate }),
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
