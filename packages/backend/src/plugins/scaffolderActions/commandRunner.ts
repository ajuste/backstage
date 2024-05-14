import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { z } from 'zod';
import { exec } from 'child_process';
import { ScaffolderActionFactoryOptions } from './types';

const commandRunner = (_: ScaffolderActionFactoryOptions) => {
    const commandWhitelist = ['backstage-zf-cli', '~/go/bin/backstage-zf-cli', 'git', 'cd', 'pwd', 'ls'];

    return createTemplateAction({
        id: 'zf:execute',
        schema: {
            input: z.object({
                command: z.string().describe('The command to execute'),
                args: z.string().optional().describe('Arguments for the command'),
                basePath: z.string().optional().describe('The base path to execute the command'),
            }),
            output: z.object({
                code: z.any().describe('The result of the command execution'),
                stdout: z.string().describe('The standard output of the command'),
                stderr: z.string().describe('The standard error of the command'),
            }),
        },
        async handler(ctx) {
            const { command, args = [] } = ctx.input;

            if (!commandWhitelist.includes(command)) {
                throw new Error(`Command "${command}" is not allowed.`);
            }

            let fullCommand = `${command} ${args ?? ''} `;
            const opts = {} as any;
            if (ctx.input.basePath) {
                ctx.logger.info(`Using working directory as ${ctx.input.basePath}`);
                opts.cwd = ctx.input.basePath;
            }
            return new Promise((resolve, reject) => {
                exec(fullCommand, opts, (error: any, stdout: any, stderr: any) => {
                    try {
                        ctx.logger.info(`Executing command: ${fullCommand} \n${error} \n${stdout} \n${stderr}`);
                        if (error) {
                            reject(error);
                            return;
                        }
                        resolve(stdout);
                        ctx.output("code", error);
                        ctx.output("stdout", stdout);
                        ctx.output("stderr", stderr);
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            }
            );
        }
    });
}

export default { commandRunner }