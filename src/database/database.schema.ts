import { EntitySchemaColumnOptions, EntitySchema, ColumnType } from 'typeorm';
import { Entity, EntityField } from 'graphql/model.schema';
import { getNamedType, GraphQLInt } from 'graphql';

export const schemaForEntity = (entity: Entity): EntitySchema => {
  const columns: { [key: string]: EntitySchemaColumnOptions } = {
    id: { type: String, primary: true },
    createdAt: {
      type: Date,
      nullable: false,
    },
    updatedAt: {
      type: Date,
      nullable: true,
    },
  };

  entity.fields.map(f => {
    columns[f.name] = {
      type: String,
      nullable: true,
    };
  });
  return new EntitySchema({
    name: entity.name,
    columns,
  });
};

const columnTypeForField = (field: EntityField): ColumnType => {
  const type = getNamedType(field.outputType);
  if (type === GraphQLInt) {
    return Number;
  }
  return String;
};
