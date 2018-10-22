import {
  EntitySchemaColumnOptions,
  EntitySchema,
  ColumnType,
  EntitySchemaRelationOptions,
  JoinTableOptions,
} from 'typeorm';

import { ModelEntity, EntityField } from '../model/model.schema';
import {
  getNamedType,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLFloat,
} from 'graphql';
import { GraphQLDate, GraphQLDateTime } from 'graphql-iso-date';

export const schemaForEntity = (entity: ModelEntity): EntitySchema => {
  const columns: { [key: string]: EntitySchemaColumnOptions } = {};

  const relations: { [key: string]: EntitySchemaRelationOptions } = {};

  for (const fieldName of Object.keys(entity.fields)) {
    const field = entity.fields[fieldName];
    if (field.isReference() || field.isReferenceList()) {
      const options = relationshipOptionsForField(field, entity);
      if (options) {
        relations[field.name] = options;
      }
    } else {
      columns[field.name] = columnOptionsForField(field);
    }
  }
  columns.id.primary = true;

  return new EntitySchema({
    name: entity.name,
    columns,
    relations,
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

const relationshipOptionsForField = (
  field: EntityField,
  entity: ModelEntity,
): EntitySchemaRelationOptions | undefined => {
  const relationDirective = field.getDirective('relation');

  if (!relationDirective) {
    global.console.log(
      `Relation directive missing ${entity.name}.${field.name} ... skipping`,
    );
    return undefined;
  }

  const relationEntity = entity.schema.getEntityForName(field.namedType.name);
  const target = field.namedType.name;

  const inverseSide = relationDirective.arguments.inverse as string;
  if (!inverseSide) {
    global.console.log(
      `Relation directive missing ${entity.name}.${field.name} ... skipping`,
    );
    return undefined;
  }

  const inverseField = relationEntity.fields[inverseSide];
  if (!inverseField) {
    global.console.log(
      `Inverse relation field ${
        relationEntity.name
      }.${inverseSide} not found relation ${entity.name}.${
        field.name
      } ... skipping`,
    );
    return undefined;
  }

  if (field.isReferenceList() && inverseField.isReferenceList()) {
    return {
      target,
      inverseSide,
      type: 'many-to-many',
      onDelete: 'SET NULL',
      joinTable:
        isPrimaryRelationship(field, inverseField) &&
        joinTableOptionsForManyToMany(field, inverseField),
    };
  } else if (field.isReference() && inverseField.isReferenceList()) {
    return {
      target,
      inverseSide,
      type: 'many-to-one',
      onDelete: 'SET NULL',
      joinColumn: { name: `${field.name}_id` },
    };
  } else if (field.isReferenceList() && inverseField.isReference()) {
    return {
      target,
      inverseSide,
      onDelete: 'SET NULL',
      type: 'one-to-many',
    };
  } else if (field.isReference() && inverseField.isReference()) {
    throw new Error('one-to-one relationships are not supported');
    // return {
    //   target,
    //   inverseSide,
    //   type: 'one-to-one',
    //   joinColumn: relationDirective.arguments.primary && {
    //     name: `${field.name}_id`,
    //   },
    // };
  }
  return undefined;
};

const isPrimaryRelationship = (
  field1: EntityField,
  field2: EntityField,
): boolean => {
  return field1.entity.name > field2.entity.name;
};

const joinTableOptionsForManyToMany = (
  field1: EntityField,
  field2: EntityField,
): JoinTableOptions => {
  const name =
    field1.entity.name > field2.entity.name
      ? `${field1.entity.name}_${field1.name}`
      : `${field2.entity.name}_${field2.name}`;
  return { name };
};

const columnTypeForField = (field: EntityField): ColumnType => {
  const type = getNamedType(field.outputType);
  switch (type) {
    case GraphQLInt:
    case GraphQLFloat:
      return Number;
    case GraphQLBoolean:
      return Boolean;
    case GraphQLDate:
    case GraphQLDateTime:
      return Date;
  }
  return String;
};
