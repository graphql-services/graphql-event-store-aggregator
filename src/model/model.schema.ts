import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLInterfaceType,
  buildSchema,
  parse,
  ObjectTypeDefinitionNode,
  typeFromAST,
  NamedTypeNode,
} from 'graphql';

import { ModelEntity } from './types/entity.model';
import { EntityField } from './types/entityfield.model';
import { EntityFieldDirective } from './types/entityfielddirective.model';

export { ModelEntity } from './types/entity.model';
export { EntityField } from './types/entityfield.model';
export { EntityFieldDirective } from './types/entityfielddirective.model';

export class ModelSchema {
  entities: ModelEntity[] = [];

  constructor(string: string) {
    const schema = buildSchema(
      `directive @relation(inverse: String) on FIELD_DEFINITION\nscalar DateTime\nscalar PasswordHash\n${string}`,
    );
    const document = parse(string);

    for (const _def of document.definitions) {
      if (_def.kind === 'ObjectTypeDefinition') {
        const def = _def as ObjectTypeDefinitionNode;
        const name = def.name.value;
        const entity = new ModelEntity({
          name,
          schema: this,
        });
        const fields = entity.fields;
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

  getEntityForName(name: string): ModelEntity | null {
    for (const entity of this.entities) {
      if (entity.name === name) {
        return entity;
      }
    }
    return null;
  }
}
