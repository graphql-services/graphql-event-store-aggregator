import { ImportEventCase } from './model';
import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.758Z';
const creationDate = new Date(isoCreationDate);

export const data: ImportEventCase = {
  name: 'filtering',
  // only: true,
  events: [
    {
      id: 'aaa',
      entity: 'User',
      entityId: 'aabbcc',
      data: {
        id: 'a1',
        username: 'john.doe',
        age: 30,
        createdAt: creationDate,
      },
      type: StoreEventType.CREATED,
      date: creationDate,
    },
    {
      id: 'bbb',
      entity: 'User',
      entityId: 'aabbcc',
      data: {
        id: 'a2',
        username: 'jane.siri',
        age: 25,
        createdAt: creationDate,
      },
      type: StoreEventType.CREATED,
      date: creationDate,
    },
    {
      id: 'caaa',
      entity: 'Company',
      entityId: 'c1',
      data: {
        id: 'c1',
        name: 'test company',
        employeesIds: ['a1'],
        createdAt: creationDate,
      },
      type: StoreEventType.CREATED,
      date: creationDate,
    },
    {
      id: 'raaa',
      entity: 'Role',
      entityId: 'r1',
      data: {
        id: 'r1',
        name: 'admin',
        usersIds: ['a1'],
        createdAt: creationDate,
      },
      type: StoreEventType.CREATED,
      date: creationDate,
    },
  ],
  queries: [
    `
      query {
          user(filter:{username:"john.doe"}) {
              id username companyId company {
                id name
              }
          }
      }
    `,
    `
      query {
          user(filter:{username_in:["john.doe"]}) {
              id username companyId company {
                id name
              }
          }
      }
    `,
    `
      query {
          user(filter:{age_gt:30}) {
              id username companyId company {
                id name
              }
          }
      }
    `,
    `
      query {
          user(filter:{age_gt:29}) {
              id username companyId company {
                id name
              }
          }
      }
    `,
    `
      query {
          user(filter:{age_gte:30}) {
              id username companyId company {
                id name
              }
          }
      }
    `,
    `
      query {
          user(filter:{age_lt:30}) {
              id username companyId company {
                id name
              }
          }
      }
    `,
    `
      query {
          users(filter:{id_contains:"a"}) {
            items{
              id username companyId company {
                id name
              }
            }
          }
      }
    `,
    `
      query {
        user(filter:{username_like:"joh??d*"}) {
          id username companyId company {
            id name
          }
        }
      }
    `,
    `
      query {
        user(filter:{company:{name:"test company"}}) {
          id username companyId company {
            id
          }
        }
      }
    `,
    `
      query {
        user(filter:{roles:{name:"admin"}}) {
          id username companyId company {
            id
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
        company: { id: 'c1', name: 'test company' },
        companyId: 'c1',
      },
    },
    {
      user: {
        id: 'a1',
        username: 'john.doe',
        company: { id: 'c1', name: 'test company' },
        companyId: 'c1',
      },
    },
    { user: null },
    {
      user: {
        id: 'a1',
        username: 'john.doe',
        company: { id: 'c1', name: 'test company' },
        companyId: 'c1',
      },
    },
    {
      user: {
        id: 'a1',
        username: 'john.doe',
        company: { id: 'c1', name: 'test company' },
        companyId: 'c1',
      },
    },
    {
      user: {
        id: 'a2',
        username: 'jane.siri',
        company: null,
        companyId: null,
      },
    },
    {
      users: {
        items: [
          {
            id: 'a1',
            username: 'john.doe',
            company: { id: 'c1', name: 'test company' },
            companyId: 'c1',
          },
          {
            id: 'a2',
            username: 'jane.siri',
            company: null,
            companyId: null,
          },
        ],
      },
    },
    {
      user: {
        id: 'a1',
        username: 'john.doe',
        company: { id: 'c1', name: 'test company' },
        companyId: 'c1',
      },
    },
    {
      user: {
        id: 'a1',
        username: 'john.doe',
        company: { id: 'c1' },
        companyId: 'c1',
      },
    },
    {
      user: {
        id: 'a1',
        username: 'john.doe',
        company: { id: 'c1' },
        companyId: 'c1',
      },
    },
  ],
};
