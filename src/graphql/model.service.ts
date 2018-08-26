import { Injectable, Inject, forwardRef } from '@nestjs/common';
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLFieldConfigMap,
  GraphQLInt,
  GraphQLResolveInfo,
  SelectionSetNode,
  FieldNode,
  GraphQLList,
} from 'graphql';
import { ModelSchema, Entity, EntityField } from './model.schema';
import * as pluralize from 'pluralize';
import { sync as globSync } from 'glob';
import { readFileSync } from 'fs';
import { DatabaseService } from 'database/database.service';
import { FindManyOptions } from 'typeorm';
import { camelCase } from 'voca';

interface FieldSelection {
  [key: string]: FieldSelection | null;
}

@Injectable()
export class ModelService {
  constructor(
    @Inject(forwardRef(() => DatabaseService))
    private readonly databaseService: DatabaseService,
  ) {}

  async initialize() {
    await this.databaseService.initialize(this.modelSchema);
  }

  parseModelSchema(string: string): ModelSchema {
    return new ModelSchema(string);
  }

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

  getGraphQLSchema(modelSchema: ModelSchema): GraphQLSchema {
    const queryFields: GraphQLFieldConfigMap<any, any> = {};

    for (const entity of modelSchema.entities) {
      const repository = this.databaseService.repositoryForEntityName(
        entity.name,
      );

      queryFields[pluralize(camelCase(entity.name))] = {
        type: entity.getObjectResultType(),
        args: {
          offset: { type: GraphQLInt },
          limit: { type: GraphQLInt },
          sort: { type: new GraphQLList(entity.getOrderInputType()) },
          filter: { type: entity.getFilterInputType() },
        },
        resolve: async (parent, args, ctx, info: GraphQLResolveInfo) => {
          const order = args.sort
            ? args.sort.reduce(
                (current, prev) => Object.assign({}, current, prev),
                {},
              )
            : undefined;

          const options: FindManyOptions = {
            skip: args.offset,
            take: args.limit,
            where: args.filter,
            order,
          };

          const selectionSet = info.fieldNodes[0]
            .selectionSet as SelectionSetNode;
          const fields = this.getFieldSelection(selectionSet);

          const result: { items?: any[]; count?: number } = {};

          if (fields.items) {
            options.select = Object.keys(fields.items).filter(f =>
              entity.hasField(f),
            );
          }

          if (fields.count && fields.items) {
            const [items, count] = await repository.findAndCount(options);
            result.items = items;
            result.count = count;
          }

          if (fields.items) {
            result.items = await repository.find(options);
          }
          if (fields.count) {
            result.count = await repository.count(options);
          }

          return result;
        },
      };
    }

    const schema = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: queryFields,
      }),
    });
    return schema;
  }

  private loadTypes(pattern: string): string[] {
    const paths = globSync(pattern);
    return paths.map(path => readFileSync(path, 'utf8'));
  }

  private _modelSchema?: ModelSchema;
  get modelSchema(): ModelSchema {
    if (!this._modelSchema) {
      const string = this.loadTypes('./**/*.graphql').join('\n');
      if (string === '') {
        throw new Error('No GraphQL schema files found (*.grpahql)');
      }
      this._modelSchema = this.parseModelSchema(string);
    }
    return this._modelSchema;
  }
}
