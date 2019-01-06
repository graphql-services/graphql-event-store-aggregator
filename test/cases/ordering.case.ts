import { ImportEventCase, createEntityEvent } from './model';
// import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.758Z';
const creationDate = new Date(isoCreationDate);
const isoCreationDate2 = '2018-10-02T15:15:53.758Z';
const creationDate2 = new Date(isoCreationDate2);

export const data: ImportEventCase = {
  name: 'ordering',
  only: true,
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
        name: 'test company',
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
          users(sort:[USERNAME_ASC]) {
            items{
              id companyId company {
                id name
              }
            }
          }
      }
    `,
    `
      query {
          users(sort:[{company:NAME_ASC}]) {
            items{
              id username companyId company {
                id name
              }
            }
          }
      }
    `,
  ],
  expectedResults: [
    {
      users: {
        items: [
          {
            id: 'a2',
            company: null,
            companyId: null,
          },
          {
            id: 'a1',
            company: { id: 'c1', name: 'test company' },
            companyId: 'c1',
          },
        ],
      },
    },
    {
      users: {
        items: [
          {
            id: 'a2',
            username: 'jane.siri',
            company: null,
            companyId: null,
          },
          {
            id: 'a1',
            username: 'john.doe',
            company: { id: 'c1', name: 'test company' },
            companyId: 'c1',
          },
        ],
      },
    },
  ],
};
