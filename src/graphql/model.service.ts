import { Injectable, Inject, forwardRef } from '@nestjs/common';
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLFieldConfigMap,
  GraphQLInt,
  GraphQLResolveInfo,
  GraphQLList,
} from 'graphql';
import { ModelSchema } from './model.schema';
import * as pluralize from 'pluralize';
import { sync as globSync } from 'glob';
import { readFileSync } from 'fs';
import { DatabaseService } from 'database/database.service';
import { camelCase } from 'voca';
import { ModelResolver } from './model.resolver';

@Injectable()
export class ModelService {
  private resolver: ModelResolver;
  constructor(
    @Inject(forwardRef(() => DatabaseService))
    private readonly databaseService: DatabaseService,
  ) {
    this.resolver = new ModelResolver(databaseService);
  }

  async initialize() {
    await this.databaseService.initialize(this.modelSchema);
  }

  parseModelSchema(string: string): ModelSchema {
    return new ModelSchema(string);
  }

  getGraphQLSchema(modelSchema: ModelSchema): GraphQLSchema {
    const queryFields: GraphQLFieldConfigMap<any, any> = {};

    for (const entity of modelSchema.entities) {
      queryFields[pluralize(camelCase(entity.name))] = {
        type: entity.getObjectResultType(),
        args: {
          offset: { type: GraphQLInt },
          limit: { type: GraphQLInt },
          sort: { type: new GraphQLList(entity.getOrderInputType()) },
          filter: { type: entity.getFilterInputType() },
        },
        resolve: async (parent, args, ctx, info: GraphQLResolveInfo) => {
          return this.resolver.resolve(entity, parent, args, ctx, info);
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
