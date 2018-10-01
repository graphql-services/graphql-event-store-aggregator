import { Injectable } from '@nestjs/common';
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLFieldConfigMap,
  GraphQLInt,
  GraphQLResolveInfo,
  GraphQLList,
  SelectionSetNode,
  FieldNode,
  GraphQLID,
} from 'graphql';
import * as pluralize from 'pluralize';
import { sync as globSync } from 'glob';
import { readFileSync } from 'fs';
import { camelCase } from 'voca';

import { ModelSchema } from './model.schema';
import { ModelResolver, FieldSelection } from './model.resolver';
import { DatabaseService } from '../database/database.service';

const pluralizeFn = (pluralize as any).default || pluralize; // jest handles default export differently

@Injectable()
export class ModelService {
  // private resolver: ModelResolver;
  // constructor(
  //   @Inject(forwardRef(() => DatabaseService))
  //   private readonly databaseService: DatabaseService,
  // ) {
  //   this.resolver = new ModelResolver(databaseService);
  // }

  // async initialize(databaseService: DatabaseService) {
  //   await databaseService.initialize(this.modelSchema);
  // }

  parseModelSchema(string: string): ModelSchema {
    return new ModelSchema(string);
  }

  getFieldSelectionFromInfo(info: GraphQLResolveInfo): FieldSelection {
    const selectionSet = info.fieldNodes[0].selectionSet as SelectionSetNode;
    return this.getFieldSelection(selectionSet);
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

  getGraphQLSchema(
    modelSchema: ModelSchema,
    databaseService: DatabaseService,
  ): GraphQLSchema {
    const queryFields: GraphQLFieldConfigMap<any, any> = {};
    const resolver = new ModelResolver(databaseService);

    for (const entity of modelSchema.entities) {
      queryFields[camelCase(entity.name)] = {
        type: entity.getObjectType(),
        args: {
          id: { type: GraphQLID },
          filter: { type: entity.getFilterInputType() },
        },
        resolve: async (parent, args, ctx, info: GraphQLResolveInfo) => {
          if (args.id) {
            args.filter = args.filter || {};
            args.filter.id = args.id;
          }
          return resolver.resolveOne(
            entity,
            args,
            this.getFieldSelectionFromInfo(info),
          );
        },
      };
      queryFields[pluralizeFn(camelCase(entity.name))] = {
        type: entity.getObjectResultType(),
        args: {
          offset: { type: GraphQLInt },
          limit: { type: GraphQLInt },
          sort: { type: new GraphQLList(entity.getOrderInputType()) },
          filter: { type: entity.getFilterInputType() },
        },
        resolve: async (parent, args, ctx, info: GraphQLResolveInfo) => {
          return resolver.resolve(
            entity,
            args,
            this.getFieldSelectionFromInfo(info),
          );
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
    const paths = globSync(pattern).filter(
      x => x.indexOf('node_modules') === -1,
    );
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
