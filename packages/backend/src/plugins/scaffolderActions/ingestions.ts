import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { z } from 'zod';
import { ScaffolderActionFactoryOptions } from './types';
import fs from 'fs';
import path from 'path';
import * as Handlebars from 'handlebars';
import { getAllFiles, } from './utils';


const formatDataLineNames = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:dataIngest:formatIngestName',
        schema: {
            input: z.any(),
            output: z.object({
                snakeCaseIngestionName: z.string(),
                camelCaseIngestionName: z.string(),
                kebabCaseIngestionName: z.string(),
                snakeCaseTaskName: z.string(),
                camelCaseTaskName: z.string(),
                kebabCaseTaskName: z.string(),
                snakeCaseSchemaName: z.string(),
                camelCaseSchemaName: z.string(),
                kebabCaseSchemaName: z.string(),
                snakeCaseDatabaseName: z.string(),
                camelCaseDatabaseName: z.string(),
                kebabCaseDatabaseName: z.string(),
                snakeCaseInstanceName: z.string(),
                camelCaseInstanceName: z.string(),
                kebabCaseInstanceName: z.string(),
            }),
        },
        async handler(ctx) {
            const snakeCase = (str: string): string => {
                return str
                    .replace(/([a-z])([A-Z])/g, '$1_$2') // Insert underscore between lowercase and uppercase
                    .replace(/\s+/g, '_')                // Replace spaces with underscores
                    .replace(/-/g, '_')                  // Replace dashes with underscores
                    .toLowerCase();                      // Convert everything to lowercase
            }
            const camelCase = (str: string): string => {
                return str.replace(/([-_][a-z])/ig, ($1) => {
                    return $1.toUpperCase()
                        .replace('-', '')
                        .replace('_', '');
                });
            }

            const kebabCase = (str: string): string => {
                return str
                    .replace(/([a-z])([A-Z])/g, '$1-$2') // Insert dash between lowercase and uppercase
                    .replace(/\s+/g, '-')                // Replace spaces with dashes
                    .replace(/_/g, '-')                  // Replace underscores with dashes
                    .toLowerCase();                      // Convert everything to lowercase
            }


            const { ingestionName } = ctx.input;
            ctx.output('snakeCaseIngestionName', snakeCase(ingestionName));
            ctx.output('camelCaseIngestionName', camelCase(ingestionName));
            ctx.output('kebabCaseIngestionName', kebabCase(ingestionName));

            const { name: tableName, schema } = ctx.input.sourceTable;
            ctx.output('snakeCaseTaskName', snakeCase(tableName));
            ctx.output('camelCaseTaskName', camelCase(tableName));
            ctx.output('kebabCaseTaskName', kebabCase(tableName));

            const { name: schemaName, database } = schema;
            ctx.output('snakeCaseSchemaName', snakeCase(schemaName));
            ctx.output('camelCaseSchemaName', camelCase(schemaName));
            ctx.output('kebabCaseSchemaName', kebabCase(schemaName));

            const { name: databaseName, instance } = database;
            ctx.output('snakeCaseDatabaseName', snakeCase(databaseName));
            ctx.output('camelCaseDatabaseName', camelCase(databaseName));
            ctx.output('kebabCaseDatabaseName', kebabCase(databaseName));

            const { name: instanceName } = instance;
            ctx.output('snakeCaseInstanceName', snakeCase(instanceName));
            ctx.output('camelCaseInstanceName', camelCase(instanceName));
            ctx.output('kebabCaseInstanceName', kebabCase(instanceName));
        },
    });
};

const createDagFolderFromTemplate = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:dataIngest:createDagFolderFromTemplate',
        schema: {
            input: z.object({
                ingestionName: z.string(),
                snakeCaseInstanceName: z.string(),
                snakeCaseTaskName: z.string(),
                camelCaseTaskName: z.string(),
                owner: z.string(),
                scheduleInterval: z.string(),
                slackAlertChannel: z.string(),
                snakeCaseIngestionName: z.string(),
                basePath: z.string(),
                taskDescription: z.string().optional(),
                sourceTable: z.any(),
                bqTable: z.any(),
                bqSchema: z.any(),
                ddl: z.string(),
                sql: z.string(),
                mode: z.string(),
            }),
            output: z.object({
                dataLineFileCreated: z.boolean(),
            }),
        },
        async handler(ctx) {
            const {
                ingestionName, basePath, snakeCaseInstanceName, snakeCaseIngestionName, snakeCaseTaskName, mode, slackAlertChannel, camelCaseTaskName, owner, scheduleInterval, taskDescription, bqTable, bqSchema, sql, ddl,
            } = ctx.input;

            const { name: tableName, schema } = ctx.input.sourceTable;
            const { name: schemaName, database } = schema;
            const { name: databaseName, instance } = database;
            const { name: instanceName } = instance;

            // Define paths based on the provided structure
            const templateDir = path.join(basePath, 'sql_to_bq', "templates");
            const dagDir = path.join(basePath, 'sql_to_bq', snakeCaseInstanceName, snakeCaseTaskName);

            // Copy dir structure
            fs.cpSync(templateDir, dagDir, { recursive: true });

            const templateData = {
                snakeCaseIngestionName, snakeCaseTaskName, slackAlertChannel, owner, scheduleInterval,
                snakeCaseInstanceName, taskDescription, databaseName, tableName, schemaName, instanceName, bqSchema, bqTable, ingestionName, ddl, sql, mode,
                taskClassName: camelCaseTaskName.charAt(0).toUpperCase() + camelCaseTaskName.slice(1),
            }

            // Get all files under new dag folder
            const allFiles = getAllFiles(dagDir);
            allFiles
                .map(file => [file, fs.readFileSync(file, 'utf8')])
                .map(([file, data]) => {
                    ctx.logger.info(`Compiling template ${data} for ${file}`);
                    return [file, Handlebars.compile(data)]
                })
                .map(([file, template]) => [file, (template as any)(templateData)])
                .forEach(([file, output]) => {
                    ctx.logger.info(`Writing to ${file} with the following content ${output}`);
                    fs.writeFileSync(file, output, { encoding: 'utf8', flag: 'w' });
                });

            const nameMap = {
                "ingestion/ingestion.template": `ingestion/${snakeCaseTaskName}.py`,
                "ingestion/ingestion_factory.template": `ingestion/${snakeCaseTaskName}_factory.py`,
                "task/task.template": `task/${snakeCaseTaskName}.py`,
                "sql/task.sql": `sql/${snakeCaseTaskName}.sql`,
                "ddl/task.sql": `ddl/${snakeCaseTaskName}.sql`,
            };

            // Rename files
            (Object.keys(nameMap) as Array<keyof typeof nameMap>).forEach((from) => {
                const fromAbs = path.join(dagDir, from);
                const toAbs = path.join(dagDir, nameMap[from]);
                ctx.logger.info(`Renaming ${fromAbs} to ${toAbs}`);
                fs.renameSync(fromAbs, toAbs)
            });
        },
    });
};

const generatePullRequestTextsForDataLine = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:generatePRTexts:newIngestion',
        schema: {
            input: z.object({
                githubAuthor: z.string(),
                jiraTicket: z.string(),
                ingestionName: z.string(),
                additionalNotes: z.string().optional(), // Optional notes field
            }),
            output: z.object({
                description: z.string(),
                commitMessage: z.string(),
            }),
        },

        async handler(ctx) {
            const { githubAuthor, jiraTicket, ingestionName, additionalNotes } = ctx.input;

            const description = `
                ## Overview
                This PR introduces a new data ingestion DAG: \`${ingestionName}\`.

                ## Reminder
                Please ensure to update the queries with \`{start_date}\` and \`{end_date}\`.

                ## Additional Notes
                ${additionalNotes || 'N/A'}

                ## Author
                The author of this change is @${githubAuthor}.

                ## JIRA Ticket
                ${jiraTicket}

                ## Review
                This PR should be reviewed by the Data Engineering Team. Please make sure everything written makes sense or update the commit if needed. Ask for help if you need it.

                Please review and merge when ready.
            `;

            const commitMessage = `feat(dags/data_lines/bq_to_sql/monolith): add ${ingestionName} DAG\nRefs: ${jiraTicket}`;

            ctx.output("description", description.trim());
            ctx.output("commitMessage", commitMessage.trim());
        },
    });
};
export default {
    formatDataLineNames,
    generatePullRequestTextsForDataLine,
    createDagFolderFromTemplate,
}