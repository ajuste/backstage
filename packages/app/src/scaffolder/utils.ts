import { JSONSchema7 } from 'json-schema';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import {
  CustomFieldExtensionSchema,
  FieldExtensionComponentProps,
} from '@backstage/plugin-scaffolder-react';

/**
 * @public
 * FieldSchema encapsulates a JSONSchema7 along with the
 * matching FieldExtensionComponentProps type for a field extension.
 */
export interface FieldSchema<TReturn, TUiOptions> {
  readonly schema: CustomFieldExtensionSchema;
  readonly type: FieldExtensionComponentProps<TReturn, TUiOptions>;
  readonly uiOptionsType: TUiOptions;
}

/**
 * @public
 * Utility function to convert zod return and UI options schemas to a
 * CustomFieldExtensionSchema with FieldExtensionComponentProps type inference
 */
export function makeFieldSchemaFromZod<
  TReturnSchema extends z.ZodType,
  TUiOptionsSchema extends z.ZodType = z.ZodType<any, any, {}>,
>(
  returnSchema: TReturnSchema,
  uiOptionsSchema?: TUiOptionsSchema,
): FieldSchema<
  TReturnSchema extends z.ZodType<any, any, infer IReturn> ? IReturn : never,
  TUiOptionsSchema extends z.ZodType<any, any, infer IUiOptions>
    ? IUiOptions
    : never
> {
  return {
    schema: {
      returnValue: zodToJsonSchema(returnSchema) as JSONSchema7,
      uiOptions: uiOptionsSchema
        ? (zodToJsonSchema(uiOptionsSchema) as JSONSchema7)
        : undefined,
    },
    type: null as any,
    uiOptionsType: null as any,
  };
}