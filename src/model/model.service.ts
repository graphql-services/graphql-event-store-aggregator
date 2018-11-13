import { Injectable } from '@nestjs/common';
import { GraphQLSchema } from 'graphql';
import { sync as globSync } from 'glob';
import { readFileSync } from 'fs';

import { ModelSchema } from './model.schema';
import { ModelResolver } from './model.resolver';
import { DatabaseService } from 'database/database.service';
import { getGraphQLSchema } from './graphql/schema';

@Injectable()
export class ModelService {
  parseModelSchema(string: string): ModelSchema {
    return new ModelSchema(string);
  }

  getGraphQLSchema(
    modelSchema: ModelSchema,
    databaseService: DatabaseService,
  ): GraphQLSchema {
    const resolver = new ModelResolver(databaseService);
    return getGraphQLSchema(modelSchema, resolver);
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
