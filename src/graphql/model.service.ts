import { Injectable, Inject, forwardRef } from '@nestjs/common';
import {
  GraphQLSchema,
  parse,
  GraphQLObjectType,
  ObjectTypeDefinitionNode,
  GraphQLFieldConfigMap,
  typeFromAST,
  buildSchema,
  GraphQLNonNull,
  GraphQLList,
} from 'graphql';
import { ModelSchema, Entity, EntityField } from './model.schema';
import * as pluralize from 'pluralize';
import { sync as globSync } from 'glob';
import { readFileSync } from 'fs';
import { DatabaseService } from 'database/database.service';

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
    const schema = buildSchema(`scalar DateTime\n${string}`);
    const document = parse(string);

    const entities: Entity[] = [];
    for (const _def of document.definitions) {
      if (_def.kind === 'ObjectTypeDefinition') {
        const def = _def as ObjectTypeDefinitionNode;
        const name = def.name.value;
        const fields = def.fields.map(field => {
          const type = typeFromAST(schema, field.type);
          return new EntityField({ type, name: field.name.value });
        });
        entities.push(new Entity({ name, fields }));
      }
    }
    return new ModelSchema({ entities });
  }

  getGraphQLSchema(modelSchema: ModelSchema): GraphQLSchema {
    const queryFields: GraphQLFieldConfigMap<any, any> = {};

    for (const entity of modelSchema.entities) {
      const repository = this.databaseService.repositoryForEntityName(
        entity.name,
      );

      queryFields[pluralize(entity.name.toLocaleLowerCase())] = {
        type: new GraphQLNonNull(
          new GraphQLList(new GraphQLNonNull(entity.getObjectType())),
        ),
        resolve: () => {
          return repository.find();
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
