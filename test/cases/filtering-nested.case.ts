import { ImportEventCase, createEntityEvent } from './model';
import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.000Z';
const creationDate = new Date(isoCreationDate);
const isoCreationDate2 = '2018-10-03T15:15:53.000Z';
const creationDate2 = new Date(isoCreationDate2);

const isoCreationDate3 = '2018-10-02T14:15:53.000Z';

export const data: ImportEventCase = {
  name: 'filtering nested',
  // only: true,
  events: [
    createEntityEvent({
      entity: 'User',
      entityId: 'a1',
      data: {
        username: 'john.doe',
        age: 30,
      },
      date: creationDate,
    }),
    createEntityEvent({
      entity: 'User',
      entityId: 'a2',
      data: {
        username: 'jane.siri',
        age: 25,
      },
      date: creationDate2,
    }),
    createEntityEvent({
      entity: 'Company',
      entityId: 'c1',
      data: {
        name: 'téíáýžřčšěst company',
        employeesIds: ['a1'],
      },
      date: creationDate,
    }),
    createEntityEvent({
      entity: 'Role',
      entityId: 'r1',
      data: {
        name: 'admin',
        usersIds: ['a1'],
      },
      date: creationDate,
    }),
  ],
  queries: [
    `
      query {
        users(filter:{OR:[{company:{id:"c1"}}]}) {
          items{
            id age
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
            id: 'a1',
            age: 30,
          },
        ],
        count: 1,
      },
    },
  ],
};
