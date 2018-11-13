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
  GraphQLString,
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
    createdBy: { type: GraphQLID },
    updatedAt: { type: GraphQLDateTime },
    updatedBy: { type: GraphQLID },
  },
});

export class ModelEntity {
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
      updatedBy: new EntityField({
        name: 'updatedBy',
        type: GraphQLID,
        entity: this,
        directives: [],
      }),
      createdAt: new EntityField({
        name: 'createdAt',
        type: new GraphQLNonNull(GraphQLDateTime),
        entity: this,
        directives: [],
      }),
      createdBy: new EntityField({
        name: 'createdBy',
        type: GraphQLID,
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

  private _fields?: GraphQLFieldConfigMap<any, any>;
  outputFieldMap(): GraphQLFieldConfigMap<any, any> {
    if (!this._fields) {
      const fields: GraphQLFieldConfigMap<any, any> = {};
      for (const fieldName of Object.keys(this.fields)) {
        const field = this.fields[fieldName];
        fields[field.name] = { type: field.outputType };
        fields[field.name] = { type: field.outputType };
        if (field.isReference()) {
          fields[field.name + 'Id'] = {
            type: GraphQLID,
          };
        }
        if (field.isReferenceList()) {
          fields[field.name + 'Ids'] = {
            type: new GraphQLNonNull(
              new GraphQLList(new GraphQLNonNull(GraphQLID)),
            ),
            resolve: parent => {
              return (parent[fieldName] || []).map(x => x.id);
            },
          };
        }
      }
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
        if (this.hasColumn(fieldName)) {
          values[fieldName.toUpperCase()] = {
            value: {},
            deprecationReason: `Please use ${fieldName.toUpperCase()}_ASC`,
          };
          values[fieldName.toUpperCase()].value[fieldName] = 'ASC';

          values[fieldName.toUpperCase() + '_ASC'] = {
            value: {},
          };
          values[fieldName.toUpperCase() + '_ASC'].value[fieldName] = 'ASC';

          values[fieldName.toUpperCase() + '_DESC'] = {
            value: {},
          };
          values[fieldName.toUpperCase() + '_DESC'].value[fieldName] = 'DESC';
        }
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
