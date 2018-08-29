import {
  getNullableType,
  GraphQLObjectType,
  GraphQLType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLOutputType,
  GraphQLID,
  assertOutputType,
  GraphQLInputType,
  assertInputType,
  GraphQLFieldConfigMap,
  GraphQLInterfaceType,
  getNamedType,
  buildSchema,
  parse,
  ObjectTypeDefinitionNode,
  typeFromAST,
  GraphQLInt,
  GraphQLNamedType,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInputFieldConfigMap,
  GraphQLEnumValueConfigMap,
  NamedTypeNode,
} from 'graphql';
import { GraphQLDateTime } from 'graphql-iso-date';
import { Entity } from './model/entity.model';
import { EntityField } from './model/entityfield.model';
import { EntityFieldDirective } from './model/entityfielddirective.model';

export { Entity } from './model/entity.model';
export { EntityField } from './model/entityfield.model';
export { EntityFieldDirective } from './model/entityfielddirective.model';

const entityInterface = new GraphQLInterfaceType({
  name: 'Entity',
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
    },
    createdAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    updatedAt: { type: GraphQLDateTime },
  },
});

export class ModelSchema {
  entities: Entity[] = [];

  constructor(string: string) {
    const schema = buildSchema(`scalar DateTime\n${string}`);
    const document = parse(string);

    for (const _def of document.definitions) {
      if (_def.kind === 'ObjectTypeDefinition') {
        const def = _def as ObjectTypeDefinitionNode;
        const name = def.name.value;
        const entity = new Entity({
          name,
          schema: this,
        });
        const fields = {};
        def.fields.map(field => {
          const type = typeFromAST(schema, field.type as NamedTypeNode);
          fields[field.name.value] = new EntityField({
            type,
            entity,
            name: field.name.value,
            directives: (field.directives || []).map(
              directive => new EntityFieldDirective({ directive }),
            ),
          });
        });

        entity.fields = fields;
        this.entities.push(entity);
      }
    }
  }

  getEntityForName(name: string): Entity | null {
    for (const entity of this.entities) {
      if (entity.name === name) {
        return entity;
      }
    }
    return null;
  }
}
