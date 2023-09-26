import jsep from 'jsep';

export type EvaluationContext = Record<string, any>;

const includes = (haystack: any, needle: any): boolean => {
  if (!Array.isArray(haystack)) {
    throw Error(`@> operator can only be used on an array`);
  }

  return (haystack as any[]).includes(needle);
};

export class QueryEvaluator {
  constructor() {
    // [A] @> B, is B in A
    jsep.addBinaryOp("@>", 6);
  }

  parse(query: string): jsep.Expression {
    return jsep(query);
  }

  evaluate(root: jsep.Expression, context: EvaluationContext): any {
    switch (root.type) {
      case 'UnaryExpression':
        return this.evaluateUnaryExpression(root as jsep.UnaryExpression, context);
      case 'BinaryExpression':
        return this.evaluateBinaryExpression(root as jsep.BinaryExpression, context);
      case 'Identifier':
        if (!context.hasOwnProperty((root as jsep.Identifier).name)) {
          throw Error(`identifier ${(root as jsep.Identifier).name} does not exist`);
        }

        return context[(root as jsep.Identifier).name];
      case 'Literal':
        return (root as jsep.Literal).value;
      default:
        throw Error(`unknown node type ${root.type}`);
    }
  }

  private evaluateUnaryExpression(root: jsep.UnaryExpression, context: EvaluationContext): any {
    switch (root.operator) {
      case '!':
        return !this.evaluate(root.argument, context);
      default:
        throw Error(`unknown unary operator ${root.operator}`);
    }
  }

  private evaluateBinaryExpression(root: jsep.BinaryExpression, context: EvaluationContext): any {
    switch (root.operator) {
      case '&&':
        return this.evaluate(root.left, context) && this.evaluate(root.right, context);
      case '||':
        return this.evaluate(root.left, context) || this.evaluate(root.right, context);
      case '==':
        return this.evaluate(root.left, context) === this.evaluate(root.right, context);
      case '!=':
        return this.evaluate(root.left, context) !== this.evaluate(root.right, context);
      case '@>':
        return includes(
          this.evaluate(root.left, context),
          this.evaluate(root.right, context),
        );
      default:
        throw Error(`unknown binary operator ${root.operator}`);
    }
  }
}