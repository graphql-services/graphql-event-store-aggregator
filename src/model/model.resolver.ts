import {
  FindManyOptions,
  Repository,
  SelectQueryBuilder,
  Brackets,
  WhereExpression,
} from 'typeorm';

import { DatabaseService } from '../database/database.service';
import { ModelEntity } from './types/entity.model';

export interface FieldSelection {
  [key: string]: FieldSelection | null;
}

const onlyUnique = (value, index, self) => {
  return self.indexOf(value) === index;
};

export class ModelResolver {
  constructor(private readonly databaseService: DatabaseService) {}

  private query = (
    entity: ModelEntity,
    args,
    fields: FieldSelection,
  ): SelectQueryBuilder<any> => {
    const repository = this.databaseService.repositoryForEntityName(
      entity.name,
    );

    const qb = repository.createQueryBuilder('SELF');

    const order = args.sort
      ? args.sort.reduce(
          (current, prev) => Object.assign({}, current, prev),
          {},
        )
      : undefined;

    if (args.limit) qb.take(args.limit);
    if (args.offset) qb.skip(args.offset);
    if (args.filter) {
      for (const key of Object.keys(args.filter)) {
        const value = args.filter[key];
        qb.andWhere(`SELF.${key} = :value`, { value });
      }
    }
    if (args.q) {
      const stringColumns = [
        'id',
        ...Object.keys(order || {}),
        ...Object.keys(fields).filter(f => entity.hasColumn(f)),
      ]
        .filter(onlyUnique)
        .filter(f => {
          const column = entity.fields[f];
          return column.isSearchable();
        });

      qb.andWhere(
        new Brackets((_qb: WhereExpression) => {
          const parts = args.q.split(' ');
          for (const part of parts) {
            for (const column of stringColumns) {
              const _val = part.replace(/\*/g, '%').replace(/\?/g, '_');
              _qb.orWhere(
                `SELF.${column} LIKE :value1 OR SELF.${column} LIKE :value2`,
                {
                  value1: `${_val}%`,
                  value2: `% ${_val}%`,
                },
              );
            }
          }
        }),
      );
    }
    if (order) qb.orderBy(order);

    // qb.select(['id']); // queryBuilder from repository sets default fields
    // for (const field of select) {
    //   qb.addSelect(`SELF.${field}`, field);
    // }

    const relations = Object.keys(fields)
      .filter(
        f =>
          entity.hasRelation(f) ||
          entity.hasRelation(f.replace('_ids', '').replace('_id', '')),
      )
      .map(f => f.replace('_ids', '').replace('_id', ''))
      .filter(onlyUnique);

    relations.map(rel => {
      const relationship = entity.fields[rel];
      qb.leftJoinAndSelect(`SELF.${relationship.name}`, relationship.name);
      // qb.leftJoin('SELF.' + rel, rel);
      // query.leftJoin(rel, rel);
    });

    // global.console.log('??', qb.getSql());
    return qb;
  }

  async resolveOne(entity: ModelEntity, args, fields: FieldSelection) {
    args.limit = 1;
    const query = this.query(entity, args, fields || {});
    return query.getOne();

    // const res = await this.resolve(entity, args, fields);
    // if (res.items && res.items.length > 0) return res.items[0];
    // return null;
  }

  async resolve(entity: ModelEntity, args, fields: FieldSelection) {
    const query = this.query(entity, args, fields.items || {});
    const items = await query.getMany();
    const count = await query.getCount();
    return { items, count };
    // global.console.log(
    //   '??!!',
    //   await this.query(entity, args, fields.items || {}).getRawMany(),
    // );
    // const order = args.sort
    //   ? args.sort.reduce(
    //       (current, prev) => Object.assign({}, current, prev),
    //       {},
    //     )
    //   : undefined;

    // const options: FindManyOptions = {};
    // if (args.offset) options.skip = args.offset;
    // if (args.limit) options.take = args.limit;
    // if (args.filter) options.where = { ...args.filter };
    // if (order) options.order = { ...order };

    // // const selectionSet = info.fieldNodes[0].selectionSet as SelectionSetNode;
    // // const fields = this.getFieldSelection(selectionSet);

    // // global.console.log('fields', fields);

    // const repository = this.databaseService.repositoryForEntityName(
    //   entity.name,
    // );

    // if (fields.items) {
    //   options.select = [
    //     'id',
    //     ...Object.keys(options.order || {}),
    //     ...Object.keys(fields.items).filter(f => entity.hasColumn(f)),
    //   ].filter(onlyUnique);
    //   options.relations = Object.keys(fields.items)
    //     .filter(
    //       f =>
    //         entity.hasRelation(f) ||
    //         entity.hasRelation(f.replace('_ids', '').replace('_id', '')),
    //     )
    //     .map(f => f.replace('_ids', '').replace('_id', ''))
    //     .filter(onlyUnique);

    //   // options.join = {
    //   //   alias: 'THIS',
    //   //   leftJoinAndSelect: { roles: 'THIS.roles' },
    //   // };
    // }

    // // return this.fetch({ query, fields });
    // // global.console.log(JSON.stringify({ options, fields }));
    // return this.fetch({ options, repository, fields });
  }

  async fetch(props: {
    // query: SelectQueryBuilder<any>;
    options: FindManyOptions;
    repository: Repository<any>;
    fields: FieldSelection;
  }) {
    const result: { items?: any[]; count?: number } = {};

    // if (props.fields.count && props.fields.items) {
    //   const [items, count] = await props.query.get
    //   result.items = items;
    //   result.count = count;
    // }

    if (props.fields.items) {
      // result.items = await props.query.getMany();
      result.items = await props.repository.find(props.options);
    }
    if (props.fields.count) {
      // result.count = await props.query.getCount();
      result.count = await props.repository.count({
        ...props.options,
        select: [],
      });
    }

    // global.console.log('results:', result);
    return result;
  }
}
