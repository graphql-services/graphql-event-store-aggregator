import * as moment from 'moment';

import { GraphQLDateTime } from 'graphql-iso-date';
import { ModelEntity } from 'model/model.schema';
import { SelectQueryBuilder } from 'typeorm';

const momentFn = (moment as any).default || moment;

declare module 'typeorm' {
  export interface SelectQueryBuilder<Entity> {
    getRawManyAndHydrate: (entity: ModelEntity) => Promise<any[]>;
    getRawOneAndHydrate: (entity: ModelEntity) => Promise<any>;
  }
}

interface RowHydrationCache {
  entities: {
    [entity: string]: {
      [id: string]: { [key: string]: any };
    };
  };
  rows: any[];
}

SelectQueryBuilder.prototype.getRawManyAndHydrate = async function(
  entity: ModelEntity,
): Promise<any[]> {
  const results = await this.getRawMany();
  const hydrated = hydrateRows(entity, results, { entities: {}, rows: [] });
  // global.console.log(JSON.stringify(results), '=>', hydrated);
  return hydrated;
};

SelectQueryBuilder.prototype.getRawOneAndHydrate = async function(
  entity: ModelEntity,
): Promise<any> {
  const results = await this.getRawManyAndHydrate(entity);
  return results[0];
};

const hydrateRows = (
  rootEntity: ModelEntity,
  rows: any[],
  cache: RowHydrationCache,
): any[] => {
  const results = [];
  for (const row of rows) {
    const newRow =
      !cache.entities[rootEntity.name] ||
      !cache.entities[rootEntity.name][row['SELF.id']];
    const res = entityValuesFromResultRow(rootEntity, row, cache);
    if (newRow) results.push(res);
  }
  return results;
};

const entityValuesFromResultRow = (
  entity: ModelEntity,
  row: { [key: string]: any },
  cache: RowHydrationCache,
  prefix: string = 'SELF.',
): { [key: string]: any } => {
  cache.entities[entity.name] = cache.entities[entity.name] || {};

  const entityID = row[`${prefix}id`];
  const result = cache.entities[entity.name][entityID] || {};

  cache.entities[entity.name][entityID] = result;

  for (const field of entity.fieldsArray) {
    const fieldName = `${prefix}${field.name}`;

    if (field.isRelationship()) {
      const targetEntityID = row[fieldName + '.id'];

      if (!targetEntityID) {
        result[field.name] = field.isReference() ? null : [];
        continue;
      }

      const targetEntity = field.targetEntity();
      // if (
      //   cache.entities[targetEntity.name] &&
      //   cache.entities[targetEntity.name][targetEntityID]
      // ) {
      //   continue;
      // }

      const values = entityValuesFromResultRow(
        field.targetEntity(),
        row,
        cache,
        `${fieldName}.`,
      );
      cache.entities[targetEntity.name] =
        cache.entities[targetEntity.name] || {};
      cache.entities[targetEntity.name][targetEntityID] = values;

      if (field.isReference()) {
        result[field.name] = values;
      } else {
        result[field.name] = result[field.name] || [];
        result[field.name].push(values);
      }
      continue;
    }

    if (typeof result[field.name] !== 'undefined') {
      continue;
    }

    if (row[fieldName] && field.namedType === GraphQLDateTime) {
      result[field.name] = momentFn.utc(row[fieldName]).toISOString();
      continue;
    }

    // global.console.log('???', field.name, '=>', fieldName, row[fieldName]);
    result[field.name] = row[fieldName];
  }
  return result;
};
