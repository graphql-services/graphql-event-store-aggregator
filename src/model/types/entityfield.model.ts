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
  getNamedType,
  GraphQLNamedType,
} from 'graphql';
import { GraphQLDateTime } from 'graphql-iso-date';
import { GraphQLPasswordHash } from 'gql-directives';

import { ModelEntity } from './entity.model';
import { EntityFieldDirective } from './entityfielddirective.model';

export class EntityField {
  constructor(
    private readonly config: {
      name: string;
      type: GraphQLType;
      entity: ModelEntity;
      directives: EntityFieldDirective[];
    },
  ) {}

  isReference(): boolean {
    return getNullableType(this.config.type) instanceof GraphQLObjectType;
  }
  isReferenceList(): boolean {
    return getNullableType(this.config.type) instanceof GraphQLList;
  }
  isNonNull(): boolean {
    return this.config.type instanceof GraphQLNonNull;
  }

  get name(): string {
    return this.config.name;
  }

  get entity(): ModelEntity {
    return this.config.entity;
  }

  get namedType(): GraphQLNamedType {
    return getNamedType(this.config.type);
  }

  get directives(): EntityFieldDirective[] {
    return this.config.directives;
  }

  getDirective(name: string): EntityFieldDirective | undefined {
    return this.directives.find(d => d.name === name);
  }

  get outputType(): GraphQLOutputType {
    if (this.isReference() || this.isReferenceList()) {
      const entity = this.config.entity.schema.getEntityForName(
        this.namedType.name,
      );
      const type = this.isNonNull()
        ? new GraphQLNonNull(entity.getObjectType())
        : entity.getObjectType();
      if (this.isReference()) {
        return type;
      } else if (this.isReferenceList()) {
        return new GraphQLNonNull(new GraphQLList(type));
      }
    }

    const namedType = getNamedType(this.config.type);
    switch (namedType.name) {
      case 'DateTime':
        return this.isNonNull()
          ? new GraphQLNonNull(GraphQLDateTime)
          : GraphQLDateTime;
      case 'PasswordHash':
        return this.isNonNull()
          ? new GraphQLNonNull(GraphQLPasswordHash)
          : GraphQLPasswordHash;
    }

    return assertOutputType(this.config.type);
  }

  get inputType(): GraphQLInputType {
    if (this.isReference()) {
      return GraphQLID;
    } else if (this.isReferenceList()) {
      return new GraphQLList(new GraphQLNonNull(GraphQLID));
    }

    const namedType = getNamedType(this.config.type);
    switch (namedType.name) {
      case 'DateTime':
        return this.isNonNull()
          ? new GraphQLNonNull(GraphQLDateTime)
          : GraphQLDateTime;
      case 'PasswordHash':
        return this.isNonNull()
          ? new GraphQLNonNull(GraphQLPasswordHash)
          : GraphQLPasswordHash;
    }

    return assertInputType(this.config.type);
  }
}
