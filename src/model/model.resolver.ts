import {
  FindManyOptions,
  Repository,
  SelectQueryBuilder,
  Brackets,
  WhereExpression,
} from 'typeorm';

import { DatabaseService } from '../database/database.service';
import { ModelEntity } from './types/entity.model';

export interface FieldSelection {
  [key: string]: FieldSelection | null;
}

const onlyUnique = (value, index, self) => {
  return self.indexOf(value) === index;
};

export class ModelResolver {
  constructor(private readonly databaseService: DatabaseService) {}

  private query = (
    entity: ModelEntity,
    args,
    fields: FieldSelection,
  ): SelectQueryBuilder<any> => {
    const repository = this.databaseService.repositoryForEntityName(
      entity.name,
    );

    const qb = repository.createQueryBuilder('SELF');

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
        qb.andWhere(`SELF.${key} = :value`, { value });
      }
    }
    if (args.q) {
      const stringColumns = [
        'id',
        ...orderKeys,
        ...Object.keys(fields).filter(f => entity.hasColumn(f)),
      ]
        .filter(onlyUnique)
        .filter(f => {
          const column = entity.fields[f];
          return column.isSearchable();
        });

      qb.andWhere(
        new Brackets((_qb: WhereExpression) => {
          const parts = args.q.split(' ');
          for (const part of parts) {
            for (const column of stringColumns) {
              const _val = part.replace(/\*/g, '%').replace(/\?/g, '_');
              _qb.orWhere(
                `SELF.${column} LIKE :value1 OR SELF.${column} LIKE :value2`,
                {
                  value1: `${_val}%`,
                  value2: `% ${_val}%`,
                },
              );
            }
          }
        }),
      );
    }

    // qb.select(['id']); // queryBuilder from repository sets default fields
    // for (const field of select) {
    //   qb.addSelect(`SELF.${field}`, field);
    // }

    const relations = Object.keys(fields)
      .filter(
        f =>
          entity.hasRelation(f) ||
          entity.hasRelation(f.replace('_ids', '').replace('_id', '')),
      )
      .map(f => f.replace('_ids', '').replace('_id', ''))
      .filter(onlyUnique);

    relations.map(rel => {
      const relationship = entity.fields[rel];
      qb.leftJoinAndSelect(`SELF.${relationship.name}`, relationship.name);
    });

    return qb;
  }

  async resolveOne(entity: ModelEntity, args, fields: FieldSelection) {
    args.limit = 1;
    args.offset = 0;
    const query = this.query(entity, args, fields || {});
    return query.getOne();
  }

  async resolve(entity: ModelEntity, args, fields: FieldSelection) {
    const query = this.query(entity, args, fields.items || {});
    const items = await query.getMany();
    const count = await query.getCount();
    return { items, count };
  }
}
