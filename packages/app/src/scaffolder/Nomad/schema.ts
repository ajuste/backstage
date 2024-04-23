import { z } from 'zod';
import { makeFieldSchemaFromZod } from '../utils';

/**
 * @public
 */
export const MultipleNomadJobPickerSchema = makeFieldSchemaFromZod(
  z.array(z.string()),
  z.object({
    allowArbitraryValues: z.boolean().optional(),
    filter: z.string().optional(),
    prefixMatching: z.boolean().optional(),
    previewMatches: z.boolean().optional(),
  }),
);

/**
 * @public
 */
export type MultipleNomadJobUiOptions =
  typeof MultipleNomadJobPickerSchema.uiOptionsType;

export type MultipleNomadJobProps = typeof MultipleNomadJobPickerSchema.type;

export const MultipleNomadJobSchema = MultipleNomadJobPickerSchema.schema;


/**
 * @public
 */
export const NomadJobPickerSchema = makeFieldSchemaFromZod(
  z.string(),
  z.object({
    allowArbitraryValues: z.boolean().optional(),
    filter: z.string().optional(),
  }),
);

/**
 * @public
 */
export type NomadJobUiOptions =
  typeof NomadJobPickerSchema.uiOptionsType;

export type NomadJobProps = typeof NomadJobPickerSchema.type;

export const NomadJobSchema = NomadJobPickerSchema.schema;