import { ImportEventCase, createEntityEvent } from './model';
import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.758Z';
const creationDate = new Date(isoCreationDate);
const isoCreationDate2 = '2018-10-02T15:15:53.758Z';
const creationDate2 = new Date(isoCreationDate2);

export const data: ImportEventCase = {
  name: 'relationship-fetching',
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
      entity: 'Company',
      entityId: 'c1',
      data: {
        name: 'test company',
        employeesIds: ['a1'],
      },
      date: creationDate,
    }),
    createEntityEvent({
      entity: 'Address',
      entityId: 'a1',
      data: {
        street: 'Infinite loop',
        city: 'San Francisco',
        companiesIds: ['c1'],
      },
      date: creationDate,
    }),
  ],
  queries: [
    `
      query {
          user(filter:{username:"john.doe"}) {
              id username companyId company {
                id name
                address {
                  street
                  city
                }
              }
          }
      }
    `,
  ],
  expectedResults: [
    {
      user: {
        id: 'a1',
        username: 'john.doe',
        company: {
          id: 'c1',
          name: 'test company',
          address: { street: 'Infinite loop', city: 'San Francisco' },
        },
        companyId: 'c1',
      },
    },
  ],
};
