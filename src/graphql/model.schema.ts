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
  constructor(
    private readonly config: {
      name: string;
      type: GraphQLType;
      entity: Entity;
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

  get namedType(): GraphQLNamedType {
    return getNamedType(this.config.type);
  }

  get outputType(): GraphQLOutputType {
    if (this.isReference() || this.isReferenceList()) {
      const entity = this.config.entity.schema.getEntityForName(
        this.namedType.name,
      );
      const type = entity.getObjectType();
      if (this.isReference()) {
        return new GraphQLNonNull(type);
      } else if (this.isReferenceList()) {
        return new GraphQLNonNull(
          new GraphQLList(this.isNonNull() ? new GraphQLNonNull(type) : type),
        );
      }
    }

    const namedType = getNamedType(this.config.type);
    if (namedType.name === 'DateTime') {
      return GraphQLDateTime;
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
    if (namedType.name === 'DateTime') {
      return GraphQLDateTime;
    }

    return assertInputType(this.config.type);
  }
}

export class Entity {
  fields: EntityField[] = [];

  constructor(private readonly config: { name: string; schema: ModelSchema }) {}

  get name(): string {
    return this.config.name;
  }
  get schema(): ModelSchema {
    return this.config.schema;
  }

  hasField(name: string): boolean {
    return !!this.outputFieldMap()[name];
  }

  _fields?: GraphQLFieldConfigMap<any, any>;
  outputFieldMap(): GraphQLFieldConfigMap<any, any> {
    if (!this._fields) {
      const fields: GraphQLFieldConfigMap<any, any> = {};
      for (const field of this.fields) {
        fields[field.name] = { type: field.outputType };
      }
      fields.id = { type: new GraphQLNonNull(GraphQLID) };
      fields.createdAt = { type: new GraphQLNonNull(GraphQLDateTime) };
      fields.updatedAt = { type: GraphQLDateTime };
      this._fields = fields;
    }

    return this._fields;
  }

  inputFieldMap(optionals: boolean = false): GraphQLInputFieldConfigMap {
    const fields: GraphQLInputFieldConfigMap = {};
    for (const field of this.fields) {
      fields[field.name] = {
        type: optionals ? getNullableType(field.inputType) : field.inputType,
      };
    }
    return fields;
  }

  private _objectType?: GraphQLObjectType;
  getObjectType(): GraphQLObjectType {
    if (!this._objectType) {
      this._objectType = new GraphQLObjectType({
        name: this.name,
        interfaces: [entityInterface],
        fields: () => this.outputFieldMap(),
      });
    }

    return this._objectType;
  }

  private _objectResultType?: GraphQLObjectType;
  getObjectResultType(): GraphQLObjectType {
    if (!this._objectResultType) {
      this._objectResultType = new GraphQLObjectType({
        name: `${this.name}ResultType`,
        fields: {
          items: {
            type: new GraphQLNonNull(
              new GraphQLList(new GraphQLNonNull(this.getObjectType())),
            ),
          },
          count: { type: GraphQLInt },
        },
      });
    }

    return this._objectResultType;
  }

  private _orderInputType?: GraphQLInputType;
  getOrderInputType(): GraphQLInputType {
    if (!this._orderInputType) {
      this._orderInputType = new GraphQLEnumType({
        name: `${this.name}SortType`,
        values: {
          ID: { value: { id: 'ASC' } },
          ID_DESC: { value: { id: 'DESC' } },
          CREATED_AT: { value: { createdAt: 'ASC' } },
          CREATED_AT_DESC: { value: { createdAt: 'DESC' } },
          UPDATED_AT: { value: { updatedAt: 'ASC' } },
          UPDATED_AT_DESC: { value: { updatedAt: 'DESC' } },
        },
      });
    }
    return this._orderInputType;
  }

  private _filterInputType?: GraphQLInputType;
  getFilterInputType(): GraphQLInputType {
    if (!this._filterInputType) {
      this._filterInputType = new GraphQLInputObjectType({
        name: `${this.name}FilterType`,
        fields: this.inputFieldMap(true),
      });
    }
    return this._filterInputType;
  }
}

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
        const fields = def.fields.map(field => {
          const type = typeFromAST(schema, field.type);
          return new EntityField({ type, entity, name: field.name.value });
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
