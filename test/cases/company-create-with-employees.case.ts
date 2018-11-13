import { ImportEventCase } from './model';
import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.758Z';
const creationDate = new Date(isoCreationDate);

export const data: ImportEventCase = {
  name: 'create company with employees',
  // only: true,
  events: [
    {
      id: 'aaa',
      entity: 'User',
      entityId: 'aabbcc',
      data: {
        id: 'a1',
        username: 'john.doe',
        createdAt: creationDate,
      },
      type: StoreEventType.CREATED,
      date: creationDate,
    },
    {
      id: 'bbb',
      entity: 'Company',
      entityId: 'c1',
      data: {
        id: 'c1',
        name: 'test company',
        employees_ids: ['a1'],
        createdAt: creationDate,
      },
      type: StoreEventType.CREATED,
      date: creationDate,
    },
  ],
  queries: [
    `
        query {
            companies {
                items { id name createdAt updatedAt employees { id username } employees2 { id username } }
                count
            }
        }
      `,
    `
      query {
          companies {
              items { id name createdAt updatedAt employees_ids employees2_ids }
              count
          }
      }
    `,
    `
      query {
          users {
              items { id username company_id company2_id company {id name} company2 {id name} }
              count
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
            employees_ids: ['a1'],
            employees2_ids: [],
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
            company: null,
            company_id: 'c1',
            company2: null,
            company2_id: null,
          },
        ],
        count: 1,
      },
    },
  ],
};
