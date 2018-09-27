import { GraphQLResolveInfo, SelectionSetNode, FieldNode } from 'graphql';
import { DatabaseService } from 'database/database.service';
import { FindManyOptions, Repository, SelectQueryBuilder } from 'typeorm';
import { Entity } from './model/entity.model';
import { Query } from '@nestjs/graphql';

interface FieldSelection {
  [key: string]: FieldSelection | null;
}

export class ModelResolver {
  constructor(private readonly databaseService: DatabaseService) {}

  getFieldSelection(selectionNode: SelectionSetNode): FieldSelection {
    const result = {};
    if (selectionNode) {
      for (const selection of selectionNode.selections) {
        const node = selection as FieldNode;
        result[node.name.value] = this.getFieldSelection(node.selectionSet);
      }
    }
    return result;
  }

  async resolve(entity: Entity, parent, args, ctx, info: GraphQLResolveInfo) {
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
    if (args.order) options.order = args.order;

    const selectionSet = info.fieldNodes[0].selectionSet as SelectionSetNode;
    const fields = this.getFieldSelection(selectionSet);

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
        ...Object.keys(fields.items).filter(f => entity.hasColumn(f)),
      ];
      options.relations = Object.keys(fields.items).filter(f =>
        entity.hasRelation(f),
      );
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
      result.count = await props.repository.count(props.options);
    }

    // global.console.log('results:', result);
    return result;
  }
}
