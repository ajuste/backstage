import { z } from 'zod';
import { makeFieldSchemaFromZod } from '../utils';


/**
 * @public
 */
export const DatabaseSchemaPickerSchema = makeFieldSchemaFromZod(
  z.object({
    instance: z.string(),
    database: z.object({
      name: z.string(),
    }),
    schema: z.object({
      name: z.string(),
    }),
  }),
  z.object({
    allowArbitraryValues: z.boolean().optional(),
    filter: z.string().optional(),
    instance: z.string(),
    database: z.string(),
    allowedInstances: z.array(z.string()).optional(),
  }),
);

/**
 * @public
 */
export type DatabaseSchemaUiOptions =
  typeof DatabaseSchemaPickerSchema.uiOptionsType;

export type DatabaseSchemaProps = typeof DatabaseSchemaPickerSchema.type;

export const DatabaseSchemachema = DatabaseSchemaPickerSchema.schema;