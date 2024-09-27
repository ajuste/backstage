import { z } from 'zod';
import { makeFieldSchemaFromZod } from '../utils';


/**
 * @public
 */
export const InstancePickerSchema = makeFieldSchemaFromZod(
  z.object({
    instance: z.string(), // matches RDSInstance
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
export type InstanceUiOptions =
  typeof InstancePickerSchema.uiOptionsType;

export type InstanceProps = typeof InstancePickerSchema.type;

export const InstanceSchema = InstancePickerSchema.schema;