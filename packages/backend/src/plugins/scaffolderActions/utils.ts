import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { z } from 'zod';
import { ScaffolderActionFactoryOptions } from './types';
import fs from 'fs';
import path from 'path';
import { resolveSafeChildPath } from '@backstage/backend-common';
import { Octokit } from "@octokit/core";
import { exec } from 'child_process';
import { createPullRequest, DELETE_FILE } from 'octokit-plugin-create-pull-request';

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

export const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []): string[] => {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, arrayOfFiles);
        } else {
            arrayOfFiles.push(filePath);
        }
    });

    return arrayOfFiles;
};

export function parseRepoUrl(url: string): { host: string, repo: string, owner: string } {
    // Parse the host
    const [host, queryString] = url.split('?');

    // Parse the query string to get repo and owner
    const params = new URLSearchParams(queryString);
    const repo = params.get('repo') ?? '';
    const owner = params.get('owner') ?? '';

    return {
        host,
        repo,
        owner
    };
}

export type ChangeType = "A" | "M" | "D" | "??";
export type Change = { file: string, status: ChangeType };

export function getChangedFiles(path: string): Promise<Change[]> {
    let fullCommand = 'git status --porcelain';
    const opts = {
        cwd: path
    }
    return new Promise((resolve, reject) => {
        exec(fullCommand, opts, (error: any, stdout: any, stderr: any) => {
            try {
                if (error || stderr?.length) {
                    reject(error);
                    return;
                }
                debugger
                const changedFiles = stdout.trim().split('\n').map((s: string) => s.trim()).filter((line: string) => line.length > 0).map((line: string) => {
                    const statusSep = line.indexOf(' ');
                    const [status, file] = [line.slice(0, statusSep), line.slice(statusSep + 1)];
                    return { status, file };
                });
                resolve(changedFiles);
            }
            catch (error) {
                reject(error);
            }
        });
    })
}

export function getAllFilesContentInDir(dirPath: string, relativeTo: string | undefined): { [path: string]: string } {
    const result: { [path: string]: string } = {};

    function traverseDirectory(currentPath: string) {
        const files = fs.readdirSync(currentPath);

        files.forEach(file => {
            const filePath = path.join(currentPath, file);
            const stats = fs.lstatSync(filePath);

            if (stats.isSymbolicLink()) {
                return; // Skip symbolic links
            }

            if (stats.isDirectory()) {
                traverseDirectory(filePath);
            } else {
                const content = fs.readFileSync(filePath, 'base64');
                result[relativeTo ? path.relative(relativeTo, filePath) : filePath] = content;
            }
        });
    }

    traverseDirectory(dirPath);
    return result
}
/**
 * Creates a Github Pull Request action.
 * Based on https://github.com/backstage/backstage/blob/patch/v1.22.0/plugins/scaffolder-backend-module-github/src/actions/githubPullRequest.ts
 * @public
 */
export const createPublishGithubPullRequestAction = (
    options: ScaffolderActionFactoryOptions,
) => {
    const { getGithubCredentials, } = options;

    return createTemplateAction<{
        title: string;
        branchName: string;
        targetBranchName?: string;
        description: string;
        repoUrl: string;
        draft?: boolean;
        targetPath?: string;
        sourcePath?: string;
        commitMessage?: string;
        update?: boolean;
    }>({
        id: 'zf:github:pull-request',
        schema: {
            input: {
                required: ['repoUrl', 'title', 'description', 'branchName'],
                type: 'object',
                properties: {
                    repoUrl: {
                        title: 'Repository Location',
                        description: `Accepts the format 'github.com?repo=reponame&owner=owner' where 'reponame' is the repository name and 'owner' is an organization or username`,
                        type: 'string',
                    },
                    branchName: {
                        type: 'string',
                        title: 'Branch Name',
                        description: 'The name for the branch',
                    },
                    targetBranchName: {
                        type: 'string',
                        title: 'Target Branch Name',
                        description: 'The target branch name of the merge request',
                    },
                    title: {
                        type: 'string',
                        title: 'Pull Request Name',
                        description: 'The name for the pull request',
                    },
                    description: {
                        type: 'string',
                        title: 'Pull Request Description',
                        description: 'The description of the pull request',
                    },
                    draft: {
                        type: 'boolean',
                        title: 'Create as Draft',
                        description: 'Create a draft pull request',
                    },
                    sourcePath: {
                        type: 'string',
                        title: 'Working Subdirectory',
                        description:
                            'Subdirectory of working directory to copy changes from',
                    },
                    targetPath: {
                        type: 'string',
                        title: 'Repository Subdirectory',
                        description: 'Subdirectory of repository to apply changes to',
                    },
                    commitMessage: {
                        type: 'string',
                        title: 'Commit Message',
                        description: 'The commit message for the pull request commit',
                    },
                    update: {
                        type: 'boolean',
                        title: 'Update',
                        description: 'Update pull request if already exists',
                    },
                },
            },
            output: {
                required: ['remoteUrl'],
                type: 'object',
                properties: {
                    targetBranchName: {
                        title: 'Target branch name of the merge request',
                        type: 'string',
                    },
                    remoteUrl: {
                        type: 'string',
                        title: 'Pull Request URL',
                        description: 'Link to the pull request in Github',
                    },
                    pullRequestNumber: {
                        type: 'number',
                        title: 'Pull Request Number',
                        description: 'The pull request number',
                    },
                },
            },
        },
        async handler(ctx) {
            const {
                repoUrl,
                branchName,
                targetBranchName,
                title,
                description,
                draft,
                sourcePath,
                commitMessage,
                update,
            } = ctx.input;

            debugger

            const { owner, repo, host } = parseRepoUrl(repoUrl);

            if (!owner) {
                throw new Error(
                    `No owner provided for host: ${host}, and repo ${repo}`,
                );
            }

            const fileRoot = sourcePath
                ? resolveSafeChildPath(ctx.workspacePath, sourcePath)
                : ctx.workspacePath;

            const changeset = await getChangedFiles(fileRoot);
            debugger
            if (!changeset?.length) {
                throw new Error('No changes to commit');
            }

            const fileContents: [string, {
                mode: string;
                encoding: "base64" | "utf-8";
                content: string;
            } | typeof DELETE_FILE][] = changeset
                .flatMap((change: Change): [string, { mode: string, encoding: 'base64' | 'utf-8', content: string }][] => {
                    const mode = '100644';
                    const encoding = 'base64';
                    const { status, file: changePath } = change;
                    const absPath = path.join(fileRoot, changePath);
                    debugger
                    if (status === '??' || status === 'A') {
                        const stat = fs.statSync(absPath);
                        if (stat.isDirectory()) {
                            const dirContent = getAllFilesContentInDir(absPath, fileRoot)
                            return Object.entries(dirContent).map(([path, content]) => [path, { mode, encoding, content }]);
                        }
                    }
                    else if (status === "D") {
                        return [[changePath, DELETE_FILE as any]]
                    }
                    return [[changePath, { mode, encoding, content: fs.readFileSync(absPath, 'base64') }]]
                })

            const { token } = await getGithubCredentials()
            const OctokitPR = Octokit.plugin(createPullRequest);
            const octokit = new OctokitPR({
                auth: token,
            });
            let githubUser: any = null;

            const username = ctx.user?.entity?.metadata.annotations?.['github.com/user-login'];
            if (username) {
                githubUser = await octokit.request(`GET /users/${username}`);
            }
            const createOptions = {
                owner,
                repo,
                title,
                changes: [
                    {
                        files: Object.fromEntries(fileContents),
                        commit: commitMessage ?? title,
                    },
                ],
                body: description,
                head: branchName,
                draft,
                update,
                base: targetBranchName ?? undefined,
                author: {
                    name: githubUser?.data?.name,
                    email: githubUser?.data?.email,
                    date: new Date().toISOString(),
                },
                committer: {
                    name: githubUser?.data?.name,
                    email: githubUser?.data?.email,
                    date: new Date().toISOString(),
                },
            };
            const response: any = await octokit.createPullRequest(createOptions);
            ctx.output('targetBranchName', response.data.base.ref);
            ctx.output('remoteUrl', response.data.html_url);
            ctx.output('pullRequestNumber', response.data.number);
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
    createPublishGithubPullRequestAction,
}