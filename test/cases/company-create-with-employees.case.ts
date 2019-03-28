import { ImportEventCase, createEntityEvent } from './model';

const isoCreationDate = '2018-10-01T06:15:53.000Z';
const creationDate = new Date(isoCreationDate);

export const data: ImportEventCase = {
  name: 'create company with employees',
  // only: true,
  events: [
    createEntityEvent({
      entity: 'User',
      entityId: 'a1',
      data: { username: 'john.doe' },
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
  ],
  queries: [
    `
        query {
            companies(limit: 10) {
                items { id name createdAt updatedAt employees { id username } employees2 { id username } }
                count
            }
        }
      `,
    `
      query {
          companies(limit: 5) {
              items { id name createdAt updatedAt employeesIds employees2Ids }
              count
          }
      }
    `,
    `
      query {
          users(limit: 5) {
              items { id username companyId company2Id company {id name} company2 {id name} }
              count
          }
      }
    `,
    `
      query {
          user(id: "a1") {
              id username companyId company2Id company {id name} company2 {id name}
          }
      }
    `,
  ],
  expectedResults: [
    {
      companies: {
        items: [
          {
            id: 'c1',
            name: 'test company',
            employees: [
              {
                id: 'a1',
                username: 'john.doe',
              },
            ],
            employees2: [],
            createdAt: isoCreationDate,
            updatedAt: null,
          },
        ],
        count: 1,
      },
    },
    {
      companies: {
        items: [
          {
            id: 'c1',
            name: 'test company',
            employeesIds: ['a1'],
            employees2Ids: [],
            createdAt: isoCreationDate,
            updatedAt: null,
          },
        ],
        count: 1,
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
            company2: null,
            company2Id: null,
          },
        ],
        count: 1,
      },
    },
    {
      user: {
        id: 'a1',
        username: 'john.doe',
        company: { id: 'c1', name: 'test company' },
        companyId: 'c1',
        company2: null,
        company2Id: null,
      },
    },
  ],
};
