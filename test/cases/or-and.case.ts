import { ImportEventCase, createEntityEvent } from './model';

const isoCreationDate = '2018-10-01T06:15:53.000Z';
const creationDate = new Date(isoCreationDate);
const isoCreationDate2 = '2018-10-02T15:15:53.000Z';
const creationDate2 = new Date(isoCreationDate2);

export const data: ImportEventCase = {
  name: 'or / and',
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
      entity: 'User',
      entityId: 'a3',
      data: {
        username: 'dummy',
        age: 34,
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
      entity: 'Company',
      entityId: 'c2',
      data: {
        name: 'test company2',
        employeesIds: ['a3'],
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
          users(filter:{OR:[{username:"john.doe"},{username:"jane.siri"}]}) {
            items{
              id username companyId company {
                id name
              }
            }
            count
          }
      }
    `,
    `
    query {
      users(filter:{OR:[{company:{name:"test company"}},{company:{name:"test company2"}}]}) {
        items{
          id username companyId company {
            id name
          }
        }
        count
      }
    }
    `,
    `
    query {
      users(filter:{AND:[{company:{name:"test company"}},{company:{name:"test company2"}}]}) {
        items{
          id username companyId company {
            id name
          }
        }
        count
      }
    }
    `,
    `
    query {
      users(filter:{
        AND:[
          {OR:[{company:{name:"test company"}},{company:{name:"test company2"}}]}
          {id_prefix:"a"}
        ]
      }) {
        items{
          id username companyId company {
            id name
          }
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
        count: 2,
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
            id: 'a3',
            username: 'dummy',
            company: { id: 'c2', name: 'test company2' },
            companyId: 'c2',
          },
        ],
        count: 2,
      },
    },
    {
      users: {
        items: [],
        count: 0,
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
            id: 'a3',
            username: 'dummy',
            company: { id: 'c2', name: 'test company2' },
            companyId: 'c2',
          },
        ],
        count: 2,
      },
    },
  ],
};
