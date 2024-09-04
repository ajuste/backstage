import { z } from 'zod';
import { makeFieldSchemaFromZod } from '../utils';


/**
 * @public
 */
export const TablePickerSchema = makeFieldSchemaFromZod(
  z.object({
    instance: z.string(),
    database: z.object({ // matches RDSDatabase
      name: z.string(),
    }),
    table: z.object({ // matches RDSTable
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
export type TableUiOptions =
  typeof TablePickerSchema.uiOptionsType;

export type TableProps = typeof TablePickerSchema.type;

export const TableSchema = TablePickerSchema.schema;