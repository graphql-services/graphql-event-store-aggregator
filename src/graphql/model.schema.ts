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
} from 'graphql';
import { GraphQLDateTime } from 'graphql-iso-date';

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

export class EntityField {
  constructor(private readonly config: { name: string; type: GraphQLType }) {}

  private isReference(): boolean {
    return getNullableType(this.config.type) instanceof GraphQLObjectType;
  }
  private isReferenceList(): boolean {
    return getNullableType(this.config.type) instanceof GraphQLList;
  }
  private isNonNull(): boolean {
    return this.config.type instanceof GraphQLNonNull;
  }

  get name(): string {
    return this.config.name;
  }

  get outputType(): GraphQLOutputType {
    const type = GraphQLID;
    if (this.isReference()) {
      return new GraphQLNonNull(GraphQLID);
    } else if (this.isReferenceList()) {
      return new GraphQLNonNull(
        new GraphQLList(this.isNonNull() ? new GraphQLNonNull(type) : type),
      );
    }

    const namedType = getNamedType(this.config.type);
    if (namedType.name === 'DateTime') {
      return GraphQLDateTime;
    }

    return assertOutputType(this.config.type);
  }

  get inputType(): GraphQLInputType {
    const type = GraphQLID;
    if (this.isReference()) {
      return new GraphQLNonNull(type);
    } else if (this.isReferenceList()) {
      return new GraphQLNonNull(
        new GraphQLList(this.isNonNull() ? new GraphQLNonNull(type) : type),
      );
    }

    const namedType = getNamedType(this.config.type);
    if (namedType.name === 'DateTime') {
      return GraphQLDateTime;
    }

    return assertInputType(this.config.type);
  }
}

export class Entity {
  constructor(
    private readonly config: { name: string; fields: EntityField[] },
  ) {}

  get name(): string {
    return this.config.name;
  }

  get fields(): EntityField[] {
    return this.config.fields;
  }

  outputFieldMap(): GraphQLFieldConfigMap<any, any> {
    const fields: GraphQLFieldConfigMap<any, any> = {};
    for (const field of this.fields) {
      fields[field.name] = { type: field.outputType };
    }
    fields.id = { type: new GraphQLNonNull(GraphQLID) };
    fields.createdAt = { type: new GraphQLNonNull(GraphQLDateTime) };
    fields.updatedAt = { type: GraphQLDateTime };
    return fields;
  }

  private _objectType?: GraphQLObjectType;
  getObjectType(): GraphQLObjectType {
    if (!this._objectType) {
      this._objectType = new GraphQLObjectType({
        name: this.name,
        interfaces: [entityInterface],
        fields: this.outputFieldMap(),
      });
    }

    return this._objectType;
  }
}

export class ModelSchema {
  constructor(private readonly config: { entities: Entity[] }) {}
  get entities(): Entity[] {
    return this.config.entities;
  }
}
