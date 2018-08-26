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

  for (const field of entity.fields) {
    if (!field.isReferenceList() && !field.isReference()) {
      columns[field.name] = columnOptionsForField(field);
    }
  }

  return new EntitySchema({
    name: entity.name,
    columns,
  });
};

const columnOptionsForField = (
  field: EntityField,
): EntitySchemaColumnOptions => {
  return {
    type: columnTypeForField(field),
    nullable: !field.isNonNull(),
  };
};

const columnTypeForField = (field: EntityField): ColumnType => {
  const type = getNamedType(field.outputType);
  switch (type) {
    case GraphQLInt:
      return Number;
  }
  if (type === GraphQLInt) {
    return Number;
  }
  return String;
};
