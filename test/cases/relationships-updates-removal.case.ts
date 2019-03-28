import { ImportEventCase, createEntityEvent, updateEntityEvent } from './model';

import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.758Z';
const creationDate = new Date(isoCreationDate);

export const data: ImportEventCase = {
  name: 'relationships updates removal',
  // only: true,
  events: [
    createEntityEvent({
      entity: 'User',
      entityId: 'a1',
      data: {
        username: 'john.doe',
      },
      date: creationDate,
    }),
    createEntityEvent({
      entity: 'User',
      entityId: 'a2',
      data: {
        username: 'jane.siri',
      },
      date: creationDate,
    }),
    createEntityEvent({
      entity: 'User',
      entityId: 'a3',
      data: {
        username: 'blah',
      },
      date: creationDate,
    }),
    createEntityEvent({
      entity: 'Company',
      entityId: 'c1',
      data: {
        name: 'test company',
        employeesIds: ['a1', 'a2', 'a3'],
      },
      date: creationDate,
    }),
    updateEntityEvent({
      entity: 'Company',
      entityId: 'c1',
      dataFrom: {
        employeesIds: ['a1', 'a2', 'a3'],
      },
      data: {
        employeesIds: ['a1', 'a2'],
      },
      date: creationDate,
    }),
  ],
  queries: [
    `
    query {
        company(id:"c1") {
            id name employees { id username }
        }
    }
  `,
  ],
  expectedResults: [
    {
      company: {
        id: 'c1',
        name: 'test company',
        employees: [
          {
            id: 'a1',
            username: 'john.doe',
          },
          {
            id: 'a2',
            username: 'jane.siri',
          },
        ],
      },
    },
  ],
};
