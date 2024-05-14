import { z } from 'zod';
import { makeFieldSchemaFromZod } from '../utils';

/**
 * @public
 */
export const JiraIssuePickerSchema = makeFieldSchemaFromZod(
  z.string(),
  z.object({
    searchString: z.string().describe('The search string to filter issues'),
    allowArbitraryValues: z.boolean().default(true).describe('Allow arbitrary values'),
  }),
);

/**
 * @public
 */
export type NomadIssueUiOptions =
  typeof JiraIssuePickerSchema.uiOptionsType;

export type JiraIssueProps = typeof JiraIssuePickerSchema.type;

export const JiraIssueSchema = JiraIssuePickerSchema.schema;