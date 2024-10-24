import { TemplateAction } from '@backstage/plugin-scaffolder-node';
import { ScaffolderActionFactoryOptions } from './types';
import serviceAssessmentFactories from './serviceAssessment';
import fsFactories from './fs';
import commandRunnerFactories from './commandRunner';
import utilsFactories from './utils'
import workspacePathFactories from './workspacePath'
import currentUserFactories from './currentUser'
import jiraFactories from './jira'
import s3Factories from './s3'
import ingestions from './ingestions'

const factories = [
    ...Object.values(serviceAssessmentFactories),
    ...Object.values(fsFactories),
    ...Object.values(commandRunnerFactories),
    ...Object.values(utilsFactories),
    ...Object.values(workspacePathFactories),
    ...Object.values(currentUserFactories),
    ...Object.values(jiraFactories),
    ...Object.values(s3Factories),
    ...Object.values(ingestions)
]

export const buildActions = (opts: ScaffolderActionFactoryOptions) => factories.map((factory) => factory(opts) as TemplateAction)
