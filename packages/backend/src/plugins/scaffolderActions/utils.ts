import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { z } from 'zod';
import { ScaffolderActionFactoryOptions } from './types';
import fs from 'fs';
import path from 'path';

const randomBranchName = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:util:randomBranchName',
        schema: {
            input: z.object({}),
            output: z.object({
                branchName: z.string()
            }),
        },

        async handler(ctx) {
            ctx.output("branchName", `feature-${Math.random().toString(36).substring(7)}`);
        },
    });
};

const getEntity = (opts: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:entity:get',
        schema: {
            input: z.object({
                entityRef: z.string()
            }),
            output: z.object({
                entity: z.any()
            }),
        },

        async handler(ctx) {
            const ref = ctx.input.entityRef;
            const entity = await opts.catalogApi.getEntityByRef(ref);
            ctx.output("entity", entity);
        },
    });
};

const generatePullRequestTextsForLibraryOnboarding = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:generatePRTexts:libraryOnBoarding',
        schema: {
            input: z.object({
                githubAuthor: z.string(),
                jiraTicket: z.string(),
            }),
            output: z.object({
                description: z.string(),
                commitMessage: z.string(),
            }),
        },

        async handler(ctx) {
            ctx.output("description", `This PR is created as part of the library onboarding process, the author is @${ctx.input.githubAuthor} and is associated with the JIRA ticket ${ctx.input.jiraTicket}.`);
            ctx.output("commitMessage", `Library onboarding.\n\nRefs: ${ctx.input.jiraTicket}`);
        },
    });
};

const generatePullRequestTextsForGenericOnBoarding = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:generatePRTexts:genericOnBoarding',
        schema: {
            input: z.object({
                githubAuthor: z.string(),
                jiraTicket: z.string(),
            }),
            output: z.object({
                description: z.string(),
                commitMessage: z.string(),
            }),
        },

        async handler(ctx) {
            ctx.output("description", `This PR is created as part of the generic onboarding process, the author is @${ctx.input.githubAuthor} and is associated with the JIRA ticket ${ctx.input.jiraTicket}.`);
            ctx.output("commitMessage", `Generic repository onboarding.\n\nRefs: ${ctx.input.jiraTicket}`);
        },
    });
};

const generatePullRequestTextsForNomadServiceOnboarding = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:generatePRTexts:nomadServiceOnBoarding',
        schema: {
            input: z.object({
                githubAuthor: z.string(),
                jiraTicket: z.string(),
            }),
            output: z.object({
                description: z.string(),
                commitMessage: z.string(),
            }),
        },

        async handler(ctx) {
            ctx.output("description", `This PR is created as part of the Nomad service onboarding process, the author is @${ctx.input.githubAuthor} and is associated with the JIRA ticket ${ctx.input.jiraTicket}.`);
            ctx.output("commitMessage", `Nomad service onboarding.\n\nRefs: ${ctx.input.jiraTicket}`);
        },
    });
};

const generatePullRequestTextsForStandardDocumentationGeneration = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:generatePRTexts:generateStandardDocs',
        schema: {
            input: z.object({
                githubAuthor: z.string(),
                jiraTicket: z.string(),
            }),
            output: z.object({
                description: z.string(),
                commitMessage: z.string(),
            }),
        },

        async handler(ctx) {
            ctx.output("description", `This PR is created as part of the standard documentation generation, the author is @${ctx.input.githubAuthor} and is associated with the JIRA ticket ${ctx.input.jiraTicket}.`);
            ctx.output("commitMessage", `Standard documentation generation.\n\nRefs: ${ctx.input.jiraTicket}`);
        },
    });
};

const ifAction = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:utils:if',
        schema: {
            input: z.object({
                condition: z.any(),
                returnOnTrue: z.any(),
                returnOnFalse: z.any(),
            }),
            output: z.object({
                return: z.any(),
            }),
        },

        async handler(ctx) {
            ctx.output("return", ctx.input.condition ? ctx.input.returnOnTrue : ctx.input.returnOnFalse);
        },
    });
};


const getSetting = (opts: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:util:getSetting',
        schema: {
            input: z.object({
                key: z.string(),
            }),
            output: z.object({
                setting: z.any(),
            }),
        },

        async handler(ctx) {
            debugger
            ctx.output("setting", opts.config.get(ctx.input.key));
        },
    });
};

const formatDataLineNames = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:formatDataLineNames:dataLine',
        schema: {
            input: z.object({
                dataLineName: z.string(),
                dataTaskName: z.string(),
            }),
            output: z.object({
                snake_case_data_line_name: z.string(),
                camel_case_data_line_name: z.string(),
                kebab_case_data_line_name: z.string(),  // New output for kebab-case format
                snake_case_data_task_name: z.string(),
                camel_case_data_task_name: z.string(),
                kebab_case_data_task_name: z.string(),  // New output for kebab-case format
            }),
        },

        async handler(ctx) {
            const snakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/\s+/g, '_').toLowerCase();
            const camelCase = (str: string) => str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) =>
                index === 0 ? match.toLowerCase() : match.toUpperCase()
            ).replace(/\s+/g, '');
            const kebabCase = (str: string) => str.replace(/\s+/g, '-').replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).toLowerCase();

            const snake_case_data_line_name = snakeCase(ctx.input.dataLineName);
            const camel_case_data_line_name = camelCase(ctx.input.dataLineName);
            const kebab_case_data_line_name = kebabCase(ctx.input.dataLineName);

            const snake_case_data_task_name = snakeCase(ctx.input.dataTaskName);
            const camel_case_data_task_name = camelCase(ctx.input.dataTaskName);
            const kebab_case_data_task_name = kebabCase(ctx.input.dataTaskName);

            ctx.output('snake_case_data_line_name', snake_case_data_line_name);
            ctx.output('camel_case_data_line_name', camel_case_data_line_name);
            ctx.output('kebab_case_data_line_name', kebab_case_data_line_name);  // Output the kebab-case data line name
            ctx.output('snake_case_data_task_name', snake_case_data_task_name);
            ctx.output('camel_case_data_task_name', camel_case_data_task_name);
            ctx.output('kebab_case_data_task_name', kebab_case_data_task_name);  // Output the kebab-case data task name
        },
    });
};

const createDataLineDirectories = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:createDatalineDirectories:dataLine',
        schema: {
            input: z.object({
                basePath: z.string(),
                dataLineName: z.string(),
            }),
            output: z.object({
                directoriesCreated: z.boolean(),
                dataLineDir: z.string(), // Output the main directory path
                ingestionDir: z.string(), // Output the ingestion directory path
                ddlDir: z.string(),      // Output the ddl directory path
                sqlDir: z.string(),      // Output the sql directory path
            }),
        },
        async handler(ctx) {
            const { basePath, dataLineName } = ctx.input;

            // Define paths based on the provided structure
            const dataLineDir = path.join(basePath, 'sql_to_bq', 'monolith_db', dataLineName);
            const ingestionDir = path.join(dataLineDir, 'ingestion');
            const dataTasksDir = path.join(ingestionDir, 'data_tasks');
            const ddlDir = path.join(dataLineDir, 'ddl');
            const sqlDir = path.join(dataLineDir, 'sql');

            // Create directories
            fs.mkdirSync(dataLineDir, { recursive: true });
            fs.mkdirSync(ingestionDir, { recursive: true });
            fs.mkdirSync(dataTasksDir, { recursive: true });
            fs.mkdirSync(ddlDir, { recursive: true });
            fs.mkdirSync(sqlDir, { recursive: true });

            // Create __init__.py files
            fs.writeFileSync(path.join(dataLineDir, '__init__.py'), '');
            fs.writeFileSync(path.join(ingestionDir, '__init__.py'), '');
            fs.writeFileSync(path.join(dataTasksDir, '__init__.py'), '');

            ctx.logger.info(`Created DataLine directories for ${dataLineName}`);

            ctx.output('directoriesCreated', true);
            ctx.output('dataLineDir', dataLineDir);
            ctx.output('ingestionDir', ingestionDir); 
            ctx.output('ddlDir', ddlDir);
            ctx.output('sqlDir', sqlDir);
        },
    });
};

const createDataTaskSQLFiles = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:createDataTaskSQLFiles:dataTask',
        schema: {
            input: z.object({
                ddlDir: z.string(),
                sqlDir: z.string(),
                dataTaskName: z.string(),
                dataTaskDescription: z.string(),
                dataTaskSourceSchema: z.string(),
                dataTaskSourceTable: z.string(),
                dataTaskQuery: z.string(),
                dataTaskBqTableDDL: z.string(),
                dataTaskBqSchema: z.string(),
                dataTaskBqTable: z.string(),
            }),
            output: z.object({
                sqlFilesCreated: z.boolean(),
            }),
        },
        async handler(ctx) {
            const { 
                ddlDir, 
                sqlDir, 
                dataTaskName, 
                dataTaskDescription, 
                dataTaskSourceSchema, 
                dataTaskSourceTable, 
                dataTaskQuery, 
                dataTaskBqTableDDL, 
                dataTaskBqSchema, 
                dataTaskBqTable 
            } = ctx.input;

            // Define the filenames for the SQL files
            const ddlFileName = `${dataTaskName}_ddl.sql`;
            const sqlFileName = `${dataTaskName}.sql`;

            // Create the content for the DDL file
            const ddlContent = `
-- DDL statements for ${dataTaskName}

-- Description: ${dataTaskDescription}

-- Source Schema: ${dataTaskSourceSchema}
-- Source Table: ${dataTaskSourceTable}

${dataTaskBqTableDDL}
            `.trim();

            // Create the content for the SQL file
            const sqlContent = `
-- SQL queries for ${dataTaskName}

-- Description: ${dataTaskDescription}

-- Source Schema: ${dataTaskSourceSchema}
-- Source Table: ${dataTaskSourceTable}

-- BigQuery Schema: ${dataTaskBqSchema}
-- BigQuery Table: ${dataTaskBqTable}

${dataTaskQuery}
            `.trim();

            // Write the content to the respective SQL files
            fs.writeFileSync(path.join(ddlDir, ddlFileName), ddlContent);
            fs.writeFileSync(path.join(sqlDir, sqlFileName), sqlContent);

            ctx.logger.info(`Created SQL files for ${dataTaskName}`);

            ctx.output('sqlFilesCreated', true);
        },
    });
};


const createDataLineFile = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:createDatalineFile:dataLine',
        schema: {
            input: z.object({
                dataLineDir: z.string(),
                templatePath: z.string(),
                dataLineName: z.string(),
                dataTaskName: z.string(),
                owner: z.string(),
                scheduleInterval: z.string(),
                slackAlertChannel: z.string(),
            }),
            output: z.object({
                dataLineFileCreated: z.boolean(),
            }),
        },
        async handler(ctx) {
            const { dataLineDir, templatePath, dataLineName, dataTaskName, owner, scheduleInterval, slackAlertChannel } = ctx.input;

            // Read and replace placeholders in the template
            let dataLineTemplate = fs.readFileSync(templatePath, 'utf8');
            dataLineTemplate = dataLineTemplate
                .replace(/{{ values.snake_case_data_line_name }}/g, dataLineName)
                .replace(/{{ values.snake_case_data_task_name }}/g, dataTaskName)
                .replace(/{{ values.camel_case_data_task_name }}/g, dataTaskName.charAt(0).toUpperCase() + dataTaskName.slice(1))
                .replace(/{{ values.owner }}/g, owner)
                .replace(/{{ values.schedule_interval }}/g, scheduleInterval)
                .replace(/{{ values.slack_alert_channel }}/g, slackAlertChannel);

            // Write the processed template to the data line directory
            const dataLineOutputPath = path.join(dataLineDir, `${dataLineName}.py`);
            fs.writeFileSync(dataLineOutputPath, dataLineTemplate);

            ctx.logger.info(`Created DataLine file for ${dataLineName}`);

            ctx.output('dataLineFileCreated', true);
        },
    });
};

const createDataTaskFactory = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:createDataTaskFactory:dataLine',
        schema: {
            input: z.object({
                ingestionDir: z.string(),   // Update to reference the ingestion directory
                templatePath: z.string(),
                dataLineName: z.string(),
                dataTaskName: z.string(),
            }),
            output: z.object({
                factoryFileCreated: z.boolean(),
            }),
        },
        async handler(ctx) {
            const { ingestionDir, templatePath, dataLineName, dataTaskName } = ctx.input;

            // Read and replace placeholders in the template
            let dataTaskFactoryTemplate = fs.readFileSync(templatePath, 'utf8');
            dataTaskFactoryTemplate = dataTaskFactoryTemplate
                .replace(/{{ values.snake_case_data_line_name }}/g, dataLineName)
                .replace(/{{ values.snake_case_data_task_name }}/g, dataTaskName)
                .replace(/{{ values.camel_case_data_task_name }}/g, dataTaskName.charAt(0).toUpperCase() + dataTaskName.slice(1));

            // Construct the path to save the factory file in the ingestion directory
            const dataTaskFactoryOutputPath = path.join(ingestionDir, `${dataLineName}_factory.py`);
            fs.writeFileSync(dataTaskFactoryOutputPath, dataTaskFactoryTemplate);

            ctx.logger.info(`Created Factory file for ${dataLineName} in the ingestion directory`);

            ctx.output('factoryFileCreated', true);
        },
    });
};

const addDataTask = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:addDataTask:dataTask',
        schema: {
            input: z.object({
                ingestionDir: z.string(),  // Updated to point to the correct directory
                templatePath: z.string(),
                dataTaskName: z.string(),
                srcDatabase: z.string(),
                srcTable: z.string(),
                tgtSchema: z.string(),
                tgtTable: z.string(),
                mode: z.string(),
            }),
            output: z.object({
                dataTaskFileCreated: z.boolean(),
            }),
        },
        async handler(ctx) {
            const { ingestionDir, templatePath, dataTaskName, srcDatabase, srcTable, tgtSchema, tgtTable, mode } = ctx.input;

            // Read and replace placeholders in the template
            let dataTaskTemplate = fs.readFileSync(templatePath, 'utf8');
            dataTaskTemplate = dataTaskTemplate
                .replace(/{{ values.pascal_case_data_task_name }}/g, dataTaskName.charAt(0).toUpperCase() + dataTaskName.slice(1))
                .replace(/{{ values.snake_case_data_task_name }}/g, dataTaskName)  // Ensure this replacement is consistent
                .replace(/{{ values.src_database }}/g, srcDatabase)
                .replace(/{{ values.src_table }}/g, srcTable)
                .replace(/{{ values.tgt_schema }}/g, tgtSchema)
                .replace(/{{ values.tgt_table }}/g, tgtTable)
                .replace(/{{ values.mode }}/g, mode);

            // Write the processed template to the data tasks directory
            const dataTaskOutputPath = path.join(ingestionDir, `${dataTaskName}.py`);
            fs.writeFileSync(dataTaskOutputPath, dataTaskTemplate);

            ctx.logger.info(`Created Data Task file for ${dataTaskName}`);

            ctx.output('dataTaskFileCreated', true);
        },
    });
};

const generatePullRequestTextsForDataLine = (_: ScaffolderActionFactoryOptions) => {
    return createTemplateAction({
        id: 'zf:generatePRTexts:dataLine',
        schema: {
            input: z.object({
                githubAuthor: z.string(),
                jiraTicket: z.string(),
                dataLineName: z.string(), 
                additionalNotes: z.string().optional(), // Optional notes field
            }),
            output: z.object({
                description: z.string(),
                commitMessage: z.string(),
            }),
        },

        async handler(ctx) {
            const { githubAuthor, jiraTicket, dataLineName, additionalNotes } = ctx.input;

            const description = `
                ## Overview
                This PR introduces a new data ingestion DAG: \`${dataLineName}\`.

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

            const commitMessage = `feat(dags/data_lines/bq_to_sql/monolith): add ${dataLineName} DAG\nref: ${jiraTicket}`;

            ctx.output("description", description.trim());
            ctx.output("commitMessage", commitMessage.trim());
        },
    });
};

export default {
    randomBranchName,
    getEntity,
    generatePullRequestTextsForLibraryOnboarding,
    generatePullRequestTextsForNomadServiceOnboarding,
    generatePullRequestTextsForStandardDocumentationGeneration,
    generatePullRequestTextsForGenericOnBoarding,
    ifAction,
    getSetting,
    // Data Line Actions
    formatDataLineNames,
    createDataLineDirectories,
    createDataLineFile,
    createDataTaskFactory,
    addDataTask,
    createDataTaskSQLFiles,
    generatePullRequestTextsForDataLine,
}