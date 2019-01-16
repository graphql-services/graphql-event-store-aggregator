import { ImportEventCase, createEntityEvent } from './model';
import { StoreEventType } from '../../src/events/store-event.model';

const isoCreationDate = '2018-10-01T06:15:53.000Z';
const creationDate = new Date(isoCreationDate);
const isoCreationDate2 = '2018-10-02T15:15:53.000Z';
const creationDate2 = new Date(isoCreationDate2);

export const data: ImportEventCase = {
  name: 'filtering',
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
        user(filter:{company:{name:"téíáýžřčšěst company"}}) {
          id username companyId company {
            id
          }
        }
      }
    `,
    `
      query {
        user(id:"a1",filter:{roles:{name:"admin"}}) {
          id username companyId company {
            id
          }
        }
      }
    `,
    `
      query {
        user(id:"a1",filter:{roles:{id:"r1"}}) {
          id username companyId company {
            id
          }
        }
      }
    `,
    `
      query {
        user(id:"a1",filter:{roles:{name_prefix:"ad"}}) {
          id username companyId company {
            id
          }
        }
      }
    `,
    `
      query {
        user(id:"a1",filter:{roles:{name_suffix:"min"}}) {
          id username companyId company {
            id
          }
        }
      }
    `,
    `
      query {
        users(filter:{createdAt_gte:"${isoCreationDate2}"}) {
          items{
            id username companyId company {
              id
            }
          }
          count
        }
      }
    `,
    `
      query {
        companies(q:"téíáýžřčšěst") {
          items{
            id
            name
          }
          count
        }
      }
    `,
  ],
  expectedResults: [
    {
      user: {
        id: 'a1',
        username: 'john.doe',
        company: { id: 'c1', name: 'téíáýžřčšěst company' },
        companyId: 'c1',
      },
    },
    {
      user: {
        id: 'a1',
        username: 'john.doe',
        company: { id: 'c1', name: 'téíáýžřčšěst company' },
        companyId: 'c1',
      },
    },
    { user: null },
    {
      user: {
        id: 'a1',
        username: 'john.doe',
        company: { id: 'c1', name: 'téíáýžřčšěst company' },
        companyId: 'c1',
      },
    },
    {
      user: {
        id: 'a1',
        username: 'john.doe',
        company: { id: 'c1', name: 'téíáýžřčšěst company' },
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
            company: { id: 'c1', name: 'téíáýžřčšěst company' },
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
        company: { id: 'c1', name: 'téíáýžřčšěst company' },
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
    {
      user: {
        id: 'a1',
        username: 'john.doe',
        company: { id: 'c1' },
        companyId: 'c1',
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
        ],
        count: 1,
      },
    },
    {
      companies: {
        items: [
          {
            id: 'c1',
            name: 'téíáýžřčšěst company',
          },
        ],
        count: 1,
      },
    },
  ],
};
