import '../extensions/SelectQueryBuilder';

import { Brackets, SelectQueryBuilder, WhereExpression } from 'typeorm';

import { DatabaseService } from '../database/database.service';
import { EntityField } from './types/entityfield.model';
import { ModelEntity } from './types/entity.model';
import { fieldsConflictMessage } from 'graphql/validation/rules/OverlappingFieldsCanBeMerged';
import { log } from '../logger';

export interface FieldSelection {
  path: string[];
}
export interface IModelResolver {
  resolveOne(entity: ModelEntity, args, fields: FieldSelection[]): Promise<any>;
  resolve(
    entity: ModelEntity,
    args,
    fields: FieldSelection[],
  ): Promise<{ items: any[]; count: number }>;
}

const onlyUnique = (value, index, self) => {
  return self.indexOf(value) === index;
};

export class ModelResolver implements IModelResolver {
  constructor(private readonly databaseService: DatabaseService) {}

  private query = (
    entity: ModelEntity,
    args,
    fields: FieldSelection[],
  ): SelectQueryBuilder<any> => {
    log(
      `entity: ${entity.name}; args:${JSON.stringify(args)}; fields:${fields}`,
    );
    const repository = this.databaseService.repositoryForEntityName(
      entity.name,
    );

    const alias = 'SELF';
    const qb = repository.createQueryBuilder(alias);

    if (args.filter) {
      this.applyFilter(qb, args.filter, 'SELF');
      const columns = this.getRelationshipColumnsFromFilter(
        args.filter,
        entity,
      );
      // force table joining
      for (const column of columns) {
        fields.push({ path: [...column.split('.'), 'id'] });
      }
    }

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
          for (let partIndex = 0; partIndex < parts.length; partIndex++) {
            const part = parts[partIndex];
            for (
              let columnIndex = 0;
              columnIndex < stringColumns.length;
              columnIndex++
            ) {
              const column = stringColumns[columnIndex];
              const _val = part.replace(/\*/g, '%').replace(/\?/g, '_');
              const key1 = `qvalue1_${columnIndex}_${partIndex}`;
              const key2 = `qvalue2_${columnIndex}_${partIndex}`;
              const valueObject = {};
              valueObject[key1] = `${_val}%`;
              valueObject[key2] = `% ${_val}%`;
              _qb.orWhere(
                `${column} LIKE :${key1} OR ${column} LIKE :${key2}`,
                valueObject,
              );
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
    for (const relationKey of Object.keys(relations)) {
      const relation = relations[relationKey];
      let mapToProperty = `${alias}.${relationKey}`;
      let property = `${alias}.${relationKey}`;
      let joinAlias = `${alias}_${relationKey}`;
      if (relationKey.indexOf('.') !== -1) {
        const parts = relationKey.split('.');
        const middle = parts.slice(0, -1).join('_');
        property = `${alias}_${middle}.${parts[parts.length - 1]}`;
        mapToProperty = property;
        joinAlias = `${alias}_${middle}_${parts[parts.length - 1]}`;
      }

      if (relation.isReference()) {
        qb.leftJoinAndMapOne(mapToProperty, property, joinAlias);
      } else if (relation.isReferenceList()) {
        qb.leftJoinAndMapMany(mapToProperty, property, joinAlias);
      }
    }

    const columnsByKey: {
      [key: string]: {
        path: string[];
        fullPath: string;
        field?: EntityField;
        relationship?: EntityField;
      };
    } = {};
    for (const col of columns) {
      const p = col.path.join('.');
      // const key = `SELF_${p.replace(/\./g, '_')}`;
      columnsByKey[p] = { ...col, fullPath: p };
    }

    qb.select('SELF.id', 'SELF.id');
    for (const p of Object.keys(columnsByKey)) {
      const column = columnsByKey[p];
      const parts = p.split('.');
      const columnAlias = `SELF.${parts.join('.')}`;
      if (column.relationship) {
        const columnName = `SELF_${parts.slice(0, -1).join('_')}.${
          parts[parts.length - 1]
        }`;
        qb.addSelect(columnName, columnAlias);

        const idColumnName = `SELF_${parts.slice(0, -1).join('_')}.id`;
        const idColumnAlias = `SELF.${parts.slice(0, -1).join('.')}.id`;
        qb.addSelect(idColumnName, idColumnAlias);
      } else {
        const columnName = `SELF${parts.slice(0, -1).join('_')}.${
          parts[parts.length - 1]
        }`;
        qb.addSelect(columnName, columnAlias);
      }
    }

    return qb;
  };

  applyFilter(
    qb: WhereExpression,
    filter: any,
    columnPrefix: string = 'SELF.',
  ) {
    for (const key of Object.keys(filter)) {
      const value = filter[key];
      if (key === 'OR' && Array.isArray(value)) {
        qb.andWhere(
          new Brackets((_qb: WhereExpression) => {
            for (const orFilter of value) {
              _qb.orWhere(
                new Brackets((__qb: WhereExpression) => {
                  this.applyFilter(__qb, orFilter, columnPrefix);
                }),
              );
            }
          }),
        );
      } else if (key === 'AND' && Array.isArray(value)) {
        for (const orFilter of value) {
          qb.andWhere(
            new Brackets((_qb: WhereExpression) => {
              this.applyFilter(_qb, orFilter, columnPrefix);
            }),
          );
        }
      } else {
        this.applyFilterValue(qb, key, value, columnPrefix);
      }
    }
  }

  applyFilterValue(qb: WhereExpression, key: string, value: any, columnPrefix) {
    if (value instanceof Date) {
      value = value.toISOString();
    }
    const [column, suffix] = key.split('_');
    const fullColumn = `${columnPrefix}.${column}`;
    const uniqueKey = Buffer.from(
      `value_${key}_${fullColumn}_${JSON.stringify(value)}`,
    )
      .toString('base64')
      .replace(/=/g, '');

    const valueObj = {};
    valueObj[uniqueKey] = value;

    const signs = {
      ne: '<>',
      gt: '>',
      lt: '<',
      gte: '>=',
      lte: '<=',
    };

    switch (suffix) {
      case 'in':
        qb.andWhere(`${fullColumn} IN (:...${uniqueKey})`, valueObj);
        break;
      case 'contains':
        valueObj[uniqueKey] = `%${value}%`;
        qb.andWhere(`${fullColumn} LIKE :${uniqueKey}`, valueObj);
        break;
      case 'prefix':
        valueObj[uniqueKey] = `${value}%`;
        qb.andWhere(`${fullColumn} LIKE :${uniqueKey}`, valueObj);
        break;
      case 'suffix':
        valueObj[uniqueKey] = `%${value}`;
        qb.andWhere(`${fullColumn} LIKE :${uniqueKey}`, valueObj);
        break;
      case 'like':
        valueObj[uniqueKey] = value.replace(/\?/g, '_').replace(/\*/g, '%');
        qb.andWhere(`${fullColumn} LIKE :${uniqueKey}`, valueObj);
        break;
      default:
        if (typeof value === 'object') {
          // qb.andWhere(`SELF_company.name = 'test company'`, valueObj);
          this.applyFilter(qb, value, `${columnPrefix}_${column}`);
        } else {
          qb.andWhere(
            `${fullColumn} ${signs[suffix] || '='} :${uniqueKey}`,
            valueObj,
          );
        }
    }
  }

  getRelationshipColumnsFromFilter(
    filter: any,
    entity: ModelEntity,
    prefix: string = '',
  ): string[] {
    let columns: string[] = [];
    for (const key of Object.keys(filter)) {
      if (key === 'OR' || key === 'AND') {
        filter[key].map(
          f =>
            (columns = [
              ...this.getRelationshipColumnsFromFilter(f, entity, prefix),
              ...columns,
            ]),
        );
      }

      const field = entity.fields[key];
      if (field && field.isRelationship()) {
        columns.push(prefix + key);
        const subFilter = filter[key];
        if (typeof subFilter === 'object') {
          columns = [
            ...columns,
            ...this.getRelationshipColumnsFromFilter(
              subFilter,
              field.targetEntity(),
              prefix + key + '.',
            ),
          ];
        }
      }
    }
    return columns;
  }

  async resolveOne(
    entity: ModelEntity,
    args,
    fields: FieldSelection[],
  ): Promise<any> {
    args.offset = 0;
    const query = this.query(entity, args, fields || []);
    const result = await query.getRawOneAndHydrate(
      entity,
      args.offset,
      args.limit,
    );

    return result;
  }

  async resolve(
    entity: ModelEntity,
    args,
    fields: FieldSelection[],
  ): Promise<{ items: any[]; count: number }> {
    const query = this.query(entity, args, fields || []);
    const items = await query.getRawManyAndHydrate(
      entity,
      args.offset,
      args.limit,
    );
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
      if (field.path[field.path.length - 1].startsWith('__')) {
        continue;
      }
      let targetEntity = entity;
      let relationship: EntityField | undefined;
      const paths = [...field.path];

      // if path contains something like ['employeesIds','companyId'] we translate it to ['employees','id']
      if (paths[paths.length - 1].match(/.+Ids?/)) {
        paths[paths.length - 1] = paths[paths.length - 1]
          .replace('Ids', '')
          .replace('Id', '');
        paths.push('id');
      }

      // find target entity for nested relationship
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
      result.push({ path: paths, field: entityField, relationship });
    }

    return result;
  }
}
