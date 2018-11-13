import {
  GraphQLSchema,
  GraphQLFieldConfigMap,
  GraphQLString,
  GraphQLID,
  GraphQLResolveInfo,
  GraphQLList,
  GraphQLInt,
  GraphQLObjectType,
  SelectionSetNode,
} from 'graphql';
import { camelCase } from 'voca';
import * as pluralize from 'pluralize';

import { ModelSchema } from '../model.schema';
import { FieldSelection, IModeLResolver } from '../model.resolver';

const pluralizeFn = (pluralize as any).default || pluralize; // jest handles default export differently

export const getGraphQLSchema = (
  modelSchema: ModelSchema,
  resolver: IModeLResolver,
): GraphQLSchema => {
  const queryFields: GraphQLFieldConfigMap<any, any> = {};

  for (const entity of modelSchema.entities) {
    const TypeFilter = {
      type: entity.getFilterInputType(),
      description: 'Object used for filtering results',
    };
    const TypeQ = {
      type: GraphQLString,
      description:
        'Query string for entities filtering. Each word is searched in any string column.',
    };

    queryFields[camelCase(entity.name)] = {
      type: entity.getObjectType(),
      args: {
        id: { type: GraphQLID },
        filter: TypeFilter,
        q: TypeQ,
      },
      resolve: async (parent, args, ctx, info: GraphQLResolveInfo) => {
        if (args.id) {
          args.filter = args.filter || {};
          args.filter.id = args.id;
        }
        return resolver.resolveOne(
          entity,
          args,
          getFieldSelectionFromInfo(info),
        );
      },
    };
    queryFields[pluralizeFn(camelCase(entity.name))] = {
      type: entity.getObjectResultType(),
      args: {
        offset: {
          type: GraphQLInt,
          description: 'Skip number of returned rows',
        },
        limit: {
          type: GraphQLInt,
          description: 'Limit number of returned rows',
          defaultValue: 30,
        },
        sort: { type: new GraphQLList(entity.getOrderInputType()) },
        filter: TypeFilter,
        q: TypeQ,
      },
      resolve: async (parent, args, ctx, info: GraphQLResolveInfo) => {
        return resolver.resolve(entity, args, getFieldSelectionFromInfo(info));
      },
    };
  }

  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: queryFields,
    }),
  });
  return schema;
};

const getFieldSelectionFromInfo = (
  info: GraphQLResolveInfo,
): FieldSelection[] => {
  const selectionSet = info.fieldNodes[0].selectionSet; // as SelectionSetNode;

  for (const selection of selectionSet.selections) {
    if (selection.kind === 'Field' && selection.name.value === 'items') {
      return getFieldSelection(selection.selectionSet);
    }
  }

  if (info.fieldNodes[0].selectionSet.kind === 'SelectionSet') {
    return getFieldSelection(selectionSet);
  }
  return [];
};
const getFieldSelection = (
  selectionNode?: SelectionSetNode,
  parentPaths: string[] = [],
): FieldSelection[] => {
  if (selectionNode) {
    let result: FieldSelection[] = [];
    for (const selection of selectionNode.selections) {
      if (selection.kind === 'Field') {
        const item = { path: [...parentPaths, selection.name.value] };
        if (selection.selectionSet) {
          const childItems = getFieldSelection(
            selection.selectionSet,
            item.path,
          );
          result = [...result, ...childItems];
        } else {
          result.push(item);
        }
      } else if (selection.kind === 'InlineFragment') {
        result = [
          ...result,
          ...getFieldSelection(selection.selectionSet, parentPaths),
        ];
      }
    }
    return result;
  } else {
    return [];
  }
};
