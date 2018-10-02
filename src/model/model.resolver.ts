import { FindManyOptions, Repository, SelectQueryBuilder } from 'typeorm';

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

  async resolveOne(entity: ModelEntity, args, fields: FieldSelection) {
    fields = { items: fields };
    args.limit = 1;
    const res = await this.resolve(entity, args, fields);
    if (res.items && res.items.length > 0) return res.items[0];
    return null;
  }

  async resolve(entity: ModelEntity, args, fields: FieldSelection) {
    const order = args.sort
      ? args.sort.reduce(
          (current, prev) => Object.assign({}, current, prev),
          {},
        )
      : undefined;

    const options: FindManyOptions = {};
    if (args.offset) options.skip = args.offset;
    if (args.limit) options.take = args.limit;
    if (args.filter) options.where = args.filter;
    if (order) options.order = order;

    // const selectionSet = info.fieldNodes[0].selectionSet as SelectionSetNode;
    // const fields = this.getFieldSelection(selectionSet);

    // global.console.log('fields', fields);

    const repository = this.databaseService.repositoryForEntityName(
      entity.name,
    );
    // const query = repository.createQueryBuilder('data');

    // query
    //   .limit(args.limit)
    //   .offset(args.offset)
    //   .where(args.filter)
    //   .orderBy(order);

    if (fields.items) {
      options.select = [
        'id',
        ...Object.keys(options.order || {}),
        ...Object.keys(fields.items).filter(f => entity.hasColumn(f)),
      ].filter(onlyUnique);
      options.relations = Object.keys(fields.items)
        .filter(
          f =>
            entity.hasRelation(f) ||
            entity.hasRelation(f.replace('_ids', '').replace('_id', '')),
        )
        .map(f => f.replace('_ids', '').replace('_id', ''))
        .filter(onlyUnique);
      // options.relations.push('assignee');
      // const select = [
      //   'data.id',
      //   ...Object.keys(fields.items)
      //     .filter(f => entity.hasColumn(f))
      //     .map(x => 'data.' + x),
      // ];
      // query.select(select);

      // Object.keys(fields.items)
      //   .filter(f => entity.hasRelation(f))
      //   .map(rel => {
      //     query.leftJoin('data.' + rel, rel);
      //     // query.leftJoin(rel, rel);
      //   });

      // options.join = {
      //   alias: 'THIS',
      //   leftJoinAndSelect: { roles: 'THIS.roles' },
      // };
    }

    // return this.fetch({ query, fields });
    // global.console.log(JSON.stringify({ options, fields }));
    return this.fetch({ options, repository, fields });
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
