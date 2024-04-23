import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { z } from 'zod';
import { Config } from '@backstage/config';
import { _Object } from '@aws-sdk/client-s3';
import { getLabelForScore } from './utils';
import { listEntries, getEntries, S3ClientGetter } from './utils';

/**
 * Generate a single entry for all catalog
 * @param entry The entry
 * @returns The entry
 */
const generateSingleEntryForAllCatalog = (entry: Record<string, any>): object => {
    return {
        entityRef: {
            kind: entry['entityRef']['kind'],
            name: entry['entityRef']['name']
        },
        scorePercent: Math.round(entry['scorePercent']),
        areaScores: entry['areaScores'].map((area: Record<string, any>) => {
            return {
                title: area['title'],
                scorePercent: Math.round(area['scorePercent']),
                scoreSuccess: getLabelForScore(area['scorePercent']),
            }
        }),
        generatedDateTimeUtc: entry['generatedDateTimeUtc'],
        scoreSuccess: getLabelForScore(entry['scorePercent']),
        scoringReviewer: entry['scoringReviewer'],
        scoringReviewDate: entry['scoringReviewDate'],
    }
}

/**
 * Generate all entries for the catalog
 * @param config The config object
 * @returns The action to generate all entries
 */
export const generateAllEntry = (getS3Client: S3ClientGetter, config: Config) => {
    return createTemplateAction({
        id: 'zf:serviceAssessment:generateAllEntry',
        schema: {
            input: z.object({
                bucket: z.string().describe('The S3 bucket to list assessments from (will be prefixed with {env}-'),
                path: z.string().describe('The S3 bucket to list assessments from (will be prefixed with {env}-'),
                assessment: z.any().describe('The assessment to generate the entry for'),
            }),
            output: z.object({
                allEntry: z.any().describe('All entries in the catalog'),
            }),
        },

        async handler(ctx): Promise<any> {
            const assessmentsFiles = await listEntries(getS3Client, config);
            const assessmentContents = await getEntries(getS3Client, config, assessmentsFiles.map((object) => object.Key ?? ""));
            ctx.output('allEntry', assessmentContents.map(generateSingleEntryForAllCatalog));
        },
    });
}