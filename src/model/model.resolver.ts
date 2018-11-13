import {
  FindManyOptions,
  Repository,
  SelectQueryBuilder,
  Brackets,
  WhereExpression,
} from 'typeorm';

import { DatabaseService } from '../database/database.service';
import { ModelEntity } from './types/entity.model';
import { EntityField } from './types/entityfield.model';

export interface FieldSelection {
  path: string[];
}

const onlyUnique = (value, index, self) => {
  return self.indexOf(value) === index;
};

export class ModelResolver {
  constructor(private readonly databaseService: DatabaseService) {}

  private query = (
    entity: ModelEntity,
    args,
    fields: FieldSelection[],
  ): SelectQueryBuilder<any> => {
    const repository = this.databaseService.repositoryForEntityName(
      entity.name,
    );

    const alias = 'SELF';
    const qb = repository.createQueryBuilder(alias);

    const columns = this.fieldSelectionToColumns(entity, fields);

    const orderKeys: string[] = [];
    if (Array.isArray(args.sort)) {
      for (const sort of args.sort) {
        for (const key of Object.keys(sort)) {
          orderKeys.push(key);
          qb.addOrderBy(`SELF.${key}`, sort[key]);
        }
      }
    }

    if (args.limit) qb.take(args.limit);
    if (args.offset) qb.skip(args.offset);
    if (args.filter) {
      for (const key of Object.keys(args.filter)) {
        const value = args.filter[key];
        const obj = {};
        obj[`value${key}`] = value;
        qb.andWhere(`SELF.${key} = :value${key}`, obj);
      }
    }
    if (args.q) {
      const stringColumns = [
        'SELF.id',
        ...columns
          .filter(c => c.field && c.field.isSearchable())
          .map(c => `SELF${c.relationship ? '_' : '.'}` + c.path.join('.')),
      ].filter(onlyUnique);

      qb.andWhere(
        new Brackets((_qb: WhereExpression) => {
          const parts = args.q.split(' ');
          for (const part of parts) {
            for (const column of stringColumns) {
              const _val = part.replace(/\*/g, '%').replace(/\?/g, '_');
              _qb.orWhere(`${column} LIKE :value1 OR ${column} LIKE :value2`, {
                value1: `${_val}%`,
                value2: `% ${_val}%`,
              });
            }
          }
        }),
      );
    }

    const relations: { [key: string]: EntityField } = {};
    for (const col of columns) {
      if (col.relationship) {
        relations[col.path.slice(0, -1).join('.')] = col.relationship;
      }
    }

    for (const relationName of Object.keys(relations)) {
      const relation = relations[relationName];
      if (relation.isReference()) {
        qb.leftJoinAndMapOne(
          `SELF.${relationName}`,
          `SELF.${relationName}`,
          `SELF.${relationName}`,
        );
      } else if (relation.isReferenceList()) {
        qb.leftJoinAndMapMany(
          `SELF.${relationName}`,
          `SELF.${relationName}`,
          `SELF_${relationName}`,
        );
        // qb.leftJoinAndSelect(`SELF.${relationName}`, relationName);
      }
    }

    const selectedColumns = [
      'SELF.id',
      ...columns.map(field => {
        const p = field.path.join('.');
        if (field.relationship) {
          return `SELF_${p}`;
        } else {
          return `SELF.${p}`;
        }
      }),
    ].filter(onlyUnique);
    qb.select(selectedColumns);

    return qb;
  }

  async resolveOne(entity: ModelEntity, args, fields: FieldSelection[]) {
    args.limit = 1;
    args.offset = 0;
    const query = this.query(entity, args, fields || []);
    return query.getOne();
  }

  async resolve(entity: ModelEntity, args, fields: FieldSelection[]) {
    const query = this.query(entity, args, fields || []);
    const items = await query.getMany();
    const count = await query.getCount();
    return { items, count };
  }

  private fieldSelectionToColumns(
    entity: ModelEntity,
    fields: FieldSelection[],
  ): { path: string[]; field?: EntityField; relationship?: EntityField }[] {
    const result: {
      path: string[];
      field?: EntityField;
      relationship?: EntityField;
    }[] = [];

    loop1: for (const field of fields) {
      let targetEntity = entity;
      let relationship: EntityField | undefined;
      const paths = [...field.path];

      // if path contains something like ['employees_ids'] we translate it to ['employees','id']
      if (paths[paths.length - 1].match(/.+_ids/)) {
        paths[paths.length - 1] = paths[paths.length - 1].replace('_ids', '');
        // .replace('_id', '');
        paths.push('id');
      }

      for (let i = 0; i < paths.length - 1; i++) {
        relationship = targetEntity.fields[paths[i]];
        if (relationship.isReference() || relationship.isReferenceList()) {
          targetEntity = relationship.targetEntity();
          if (!targetEntity) {
            break loop1;
          }
        } else {
          break loop1;
        }
      }
      const fieldName = paths[paths.length - 1];
      const entityField = targetEntity.fields[fieldName];
      // if (!entityField) {
      //   break;
      // }
      result.push({ path: paths, field: entityField, relationship });
    }

    return result;
  }
}
