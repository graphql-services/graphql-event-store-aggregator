import { Injectable } from '@nestjs/common';
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLFieldConfigMap,
  GraphQLInt,
  GraphQLResolveInfo,
  GraphQLList,
  SelectionSetNode,
  GraphQLID,
  GraphQLString,
} from 'graphql';
import * as pluralize from 'pluralize';
import { sync as globSync } from 'glob';
import { readFileSync } from 'fs';
import { camelCase } from 'voca';

import { ModelSchema } from './model.schema';
import { ModelResolver, FieldSelection } from './model.resolver';
import { DatabaseService } from '../database/database.service';
import { ModelEntity } from './types/entity.model';

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

  getFieldSelectionFromInfo(info: GraphQLResolveInfo): FieldSelection[] {
    const selectionSet = info.fieldNodes[0].selectionSet; // as SelectionSetNode;

    for (const selection of selectionSet.selections) {
      if (selection.kind === 'Field' && selection.name.value === 'items') {
        return this.getFieldSelection(selection.selectionSet);
      }
    }

    if (info.fieldNodes[0].selectionSet.kind === 'SelectionSet') {
      return this.getFieldSelection(selectionSet);
    }
    return [];
  }
  getFieldSelection(
    selectionNode?: SelectionSetNode,
    parentPaths: string[] = [],
  ): FieldSelection[] {
    if (selectionNode) {
      let result: FieldSelection[] = [];
      for (const selection of selectionNode.selections) {
        if (selection.kind === 'Field') {
          const item = { path: [...parentPaths, selection.name.value] };
          if (selection.selectionSet) {
            const childItems = this.getFieldSelection(
              selection.selectionSet,
              item.path,
            );
            result = [...result, ...childItems];
          } else {
            result.push(item);
          }
        } else if (selection.kind === 'InlineFragment') {
          result = [
            ...result,
            ...this.getFieldSelection(selection.selectionSet, parentPaths),
          ];
        }
      }
      return result;
    } else {
      return [];
    }
  }

  getGraphQLSchema(
    modelSchema: ModelSchema,
    databaseService: DatabaseService,
  ): GraphQLSchema {
    const queryFields: GraphQLFieldConfigMap<any, any> = {};
    const resolver = new ModelResolver(databaseService);

    for (const entity of modelSchema.entities) {
      const TypeFilter = {
        type: entity.getFilterInputType(),
        description: 'Object used for filtering results',
      };
      const TypeQ = {
        type: GraphQLString,
        description:
          'Query string for entities filtering. Each word is searched in any string column.',
      };

      queryFields[camelCase(entity.name)] = {
        type: entity.getObjectType(),
        args: {
          id: { type: GraphQLID },
          filter: TypeFilter,
          q: TypeQ,
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
          offset: {
            type: GraphQLInt,
            description: 'Skip number of returned rows',
          },
          limit: {
            type: GraphQLInt,
            description: 'Limit number of returned rows',
            defaultValue: 30,
          },
          sort: { type: new GraphQLList(entity.getOrderInputType()) },
          filter: TypeFilter,
          q: TypeQ,
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
