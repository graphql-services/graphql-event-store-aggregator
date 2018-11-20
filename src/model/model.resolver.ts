import { Brackets, SelectQueryBuilder, WhereExpression } from 'typeorm';
import { DatabaseService } from '../database/database.service';
import { ModelEntity } from './types/entity.model';
import { EntityField } from './types/entityfield.model';
import { log } from '../logger';

export interface FieldSelection {
  path: string[];
}
export interface IModeLResolver {
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

export class ModelResolver implements IModeLResolver {
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
      for (const key of Object.keys(args.filter)) {
        const field = entity.fields[key];

        // force table joining
        if (field && field.isRelationship()) {
          fields.push({ path: [key, 'id'] });
        }
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
          for (const part of parts) {
            for (const column of stringColumns) {
              const _val = part.replace(/\*/g, '%').replace(/\?/g, '_');
              const key1 = `qvalue1_${_val}`;
              const key2 = `qvalue2_${_val}`;
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

    for (const relationName of Object.keys(relations)) {
      const relation = relations[relationName];
      if (relation.isReference()) {
        qb.leftJoinAndMapOne(
          `SELF.${relationName}`,
          `SELF.${relationName}`,
          `SELF_${relationName}`,
        );
      } else if (relation.isReferenceList()) {
        qb.leftJoinAndMapMany(
          `SELF.${relationName}`,
          `SELF.${relationName}`,
          `SELF_${relationName}`,
        );
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

    qb.select(['SELF.id']);
    for (const p of Object.keys(columnsByKey)) {
      const column = columnsByKey[p];
      if (column.relationship) {
        qb.addSelect(`SELF_${p}`, `SELF_${p.replace(/\./g, '_')}`);
      } else {
        qb.addSelect(`SELF.${p}`, `SELF_${p.replace(/\./g, '_')}`);
      }
    }

    return qb;
  }

  applyFilter(
    qb: SelectQueryBuilder<any>,
    filter: any,
    columnPrefix: string = 'SELF.',
  ) {
    for (const key of Object.keys(filter)) {
      const value = filter[key];
      const [column, suffix] = key.split('_');
      const fullColumn = `${columnPrefix}.${column}`;
      const uniqueKey = `value_${key}_${fullColumn}`;

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
            this.applyFilter(qb, value, `SELF_${column}`);
          } else {
            qb.andWhere(
              `${fullColumn} ${signs[suffix] || '='} :${uniqueKey}`,
              valueObj,
            );
          }
      }
    }
  }

  async resolveOne(
    entity: ModelEntity,
    args,
    fields: FieldSelection[],
  ): Promise<any> {
    args.offset = 0;
    const query = this.query(entity, args, fields || []);
    return query.getOne();
  }

  async resolve(
    entity: ModelEntity,
    args,
    fields: FieldSelection[],
  ): Promise<{ items: any[]; count: number }> {
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

      // if path contains something like ['employeesIds'] we translate it to ['employees','id']
      if (paths[paths.length - 1].match(/.+Ids/)) {
        paths[paths.length - 1] = paths[paths.length - 1].replace('Ids', '');
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
      result.push({ path: paths, field: entityField, relationship });
    }

    return result;
  }
}
