import { z } from 'zod';
import { makeFieldSchemaFromZod } from '../utils';


/**
 * @public
 */
export const DatabasePickerSchema = makeFieldSchemaFromZod(
  z.object({
    instance: z.string(),
    database: z.object({ // matches RDSDatabase
      name: z.string(),
    }),
  }),
  z.object({
    allowArbitraryValues: z.boolean().optional(),
    filter: z.string().optional(),
    allowedInstances: z.array(z.string()).optional(),
  }),
);

/**
 * @public
 */
export type DatabaseUiOptions =
  typeof DatabasePickerSchema.uiOptionsType;

export type DatabaseProps = typeof DatabasePickerSchema.type;

export const DatabaseSchema = DatabasePickerSchema.schema;