import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { z } from 'zod';
import { _Object } from '@aws-sdk/client-s3';

import { generateSafetyAreaScore } from './safety';
import { generateKnowledgeAreaScore } from './knowledge';
import { generateInfrastructureAreaScore } from './infraestructure';
import { generateServiceOwnershipAreaScore } from './serviceOwnership';
import { getLabelForScore } from './utils';
import { ScaffolderActionFactoryOptions } from '../types';

const assessmentSchema = z.object({
    entityRef: z.object({
        kind: z.string().describe('The kind of the entity'),
        name: z.string().optional().describe('The name of the entity'),
    }),
    generatedDateTimeUtc: z.string().describe('The date and time the score was generated'),
    scorePercent: z.number().int().min(0).max(100).describe('The score as a percentage'),
    scoreSuccess: z.string().describe('The success of the score'),
    scoringReviewDate: z.string().describe('The date the score was reviewed'),
    scoringReviewer: z.object({
        name: z.string().describe('The name of the reviewer'),
        reviewer: z.string().describe('The reviewer of the score'),
    }).optional().describe('The reviewer of the score'),
    areaScores: z.array(z.object({
        id: z.number().describe('The id of the area'),
        title: z.string().describe('The area being assessed'),
        scorePercent: z.number().int().min(0).max(100).describe('The score as a percentage'),
        scoreSuccess: z.string().describe('The success of the score'),
        howToScore: z.string().optional().describe('How to score the area'),
        scoreChoices: z.array(z.any()).optional().describe('The choices for scoring the area'),
    })).optional().describe('The scores for each area'),
})

/**
 * Generate a score for a service
 * @returns The action to generate a score
 */
const generateScore = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:serviceAssessment:generateScore',
        schema: {
            input: z.object({
                kind: z.string().describe('The kind of the entity'),
                name: z.string().describe('The name of the entity'),
                reviewerRef: z.string().describe('Assessing user'),
                reviwerName: z.string().describe('Assessing user name'),
                service: z.string().describe('The service being assessed'),
                subsystem: z.string().describe('The subsystem being assessed'),
                static_typing: z.string().describe('Availability and enforcement level of static typing'),
                unit_tests: z.string().describe('Unit tests availability and enforcement'),
                integration_tests: z.string().describe('Integration tests availability and enforcement'),
                testing_coverage: z.string().describe('Testing coverage'),
                e2e_tests: z.string().describe('End-to-end tests availability and enforcement'),
                ramp_up: z.string().describe('Ramp-up time required for new developers'),
                users: z.string().describe('Understanding of who the users are'),
                expected_output: z.string().describe('Clarity of expected outputs'),
                internal_functionality: z.string().describe('Understanding of internal functionality'),
                business_importance: z.string().describe('Business criticality and impact of downtime'),
                environments: z.string().describe('Environments the service is validated against'),
                continuous_integration: z.string().describe('Continuous integration practices'),
                continuous_deployment: z.string().describe('Continuous deployment practices'),
                monitoring_alerting: z.string().describe('Monitoring and alerting practices'),
                service_ownership: z.string().describe('Ownership of the service'),
                code_standards: z.string().describe('Adherence to code standards'),
                maintenance: z.string().describe('Maintenance status of the service'),
                analytics_analysis: z.string().describe('Analytics and usage reporting practices'),
            }),
            output: z.object({
                assessment: assessmentSchema,
            }),
        },

        async handler(ctx): Promise<any> {
            const areaScores = [
                generateSafetyAreaScore(ctx),
                generateKnowledgeAreaScore(ctx),
                generateInfrastructureAreaScore(ctx),
                generateServiceOwnershipAreaScore(ctx),
            ]
            const scorePercent = Math.round(areaScores.reduce((a, b) => a + b.scorePercent, 0) / areaScores.length);
            const assessment = {
                entityRef: {
                    kind: ctx.input.service.split(":")[0],
                    name: ctx.input.service.split(":")[1].split("/")[1],
                    namespace: ctx.input.service.split(":")[1].split("/")[0] ?? "default",
                },
                scorePercent,
                areaScores,
                generatedDateTimeUtc: new Date().toISOString(),
                scoreSuccess: getLabelForScore(scorePercent),
                scoringReviewDate: new Date().toISOString(),
                scoringReviewer: {
                    reviewer: ctx.input.reviewerRef,
                    name: ctx.input.reviwerName,
                }
            };
            ctx.output('assessment', assessment);
        },
    });
}

export default generateScore