import {
  getNullableType,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLID,
  GraphQLInputType,
  GraphQLFieldConfigMap,
  GraphQLInterfaceType,
  GraphQLInt,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInputFieldConfigMap,
  GraphQLEnumValueConfigMap,
} from 'graphql';
import { GraphQLDateTime } from 'graphql-iso-date';
import { EntityField } from './entityfield.model';
import { ModelSchema } from '../model.schema';

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

export class Entity {
  fields: { [key: string]: EntityField };

  constructor(private readonly config: { name: string; schema: ModelSchema }) {
    this.fields = {
      id: new EntityField({
        name: 'id',
        type: new GraphQLNonNull(GraphQLID),
        entity: this,
        directives: [],
      }),
      updatedAt: new EntityField({
        name: 'updatedAt',
        type: GraphQLDateTime,
        entity: this,
        directives: [],
      }),
      createdAt: new EntityField({
        name: 'createdAt',
        type: new GraphQLNonNull(GraphQLDateTime),
        entity: this,
        directives: [],
      }),
    };
  }

  get name(): string {
    return this.config.name;
  }
  get schema(): ModelSchema {
    return this.config.schema;
  }

  hasColumn(name: string): boolean {
    const field = this.fields[name];
    if (!field) return false;
    return !field.isReference() && !field.isReferenceList();
  }

  hasRelation(name: string): boolean {
    const field = this.fields[name];
    if (!field) return false;
    return field.isReference() || field.isReferenceList();
  }

  hasField(name: string): boolean {
    return !!this.outputFieldMap()[name];
  }

  _fields?: GraphQLFieldConfigMap<any, any>;
  outputFieldMap(): GraphQLFieldConfigMap<any, any> {
    if (!this._fields) {
      const fields: GraphQLFieldConfigMap<any, any> = {};
      for (const fieldName of Object.keys(this.fields)) {
        const field = this.fields[fieldName];
        fields[field.name] = { type: field.outputType };
      }
      // fields.id = { type: new GraphQLNonNull(GraphQLID) };
      // fields.createdAt = { type: new GraphQLNonNull(GraphQLDateTime) };
      // fields.updatedAt = { type: GraphQLDateTime };
      this._fields = fields;
    }

    return this._fields;
  }

  inputFieldMap(optionals: boolean = false): GraphQLInputFieldConfigMap {
    const fields: GraphQLInputFieldConfigMap = {};
    for (const fieldName of Object.keys(this.fields)) {
      const field = this.fields[fieldName];
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
      const values: GraphQLEnumValueConfigMap = {};

      const columns = [
        'ID',
        'CREATED_AT',
        'UPDATED_AT',
        ...Object.keys(this.inputFieldMap()),
      ];
      for (const fieldName of columns) {
        values[fieldName.toUpperCase()] = {
          value: { updatedAt: 'ASC' },
          deprecationReason: `Please use ${fieldName.toUpperCase()}_ASC`,
        };
        values[fieldName.toUpperCase() + '_ASC'] = {
          value: { updatedAt: 'ASC' },
        };
        values[fieldName.toUpperCase() + '_DESC'] = {
          value: { updatedAt: 'DESC' },
        };
      }

      this._orderInputType = new GraphQLEnumType({
        name: `${this.name}SortType`,
        values,
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
