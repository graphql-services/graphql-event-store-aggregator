import {
  DirectiveNode,
  IntValueNode,
  FloatValueNode,
  StringValueNode,
  BooleanValueNode,
  EnumValueNode,
} from 'graphql';

// https://github.com/graphql/graphql-js/issues/1461
type DirectiveValueNode =
  | IntValueNode
  | FloatValueNode
  | StringValueNode
  | BooleanValueNode
  // | NullValueNode
  | EnumValueNode;
// | ListValueNode
// | ObjectValueNode;

export class EntityFieldDirective {
  public arguments: { [key: string]: any };

  constructor(private readonly config: { directive: DirectiveNode }) {
    const args = config.directive.arguments || [];

    this.arguments = {};
    args.map(arg => {
      const value = arg.value as DirectiveValueNode;
      if (value.value) {
        this.arguments[arg.name.value] = value.value;
      }
    });
  }

  get name(): string {
    return this.config.directive.name.value;
  }
}
