import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { createScaffolderFieldExtension } from '@backstage/plugin-scaffolder-react';
import { EntityPickerWithRepo } from '../scaffolder/ExtendedEntityPicker';
import { MultipleNomadJobPicker, NomadJobPicker } from '../scaffolder/Nomad';
import { JiraIssuePicker } from '../scaffolder/Jira';
import { DatabasePicker, TablePicker } from '../scaffolder/RDS';

export const EntityPickerWithRepoExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    name: 'ExtendedEntityPicker',
    component: EntityPickerWithRepo,
  }),
);

export const MultipleNomadJobPickerExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    name: 'MultipleNomadJobPicker',
    component: MultipleNomadJobPicker,
  }),
);

export const NomadJobPickerExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    name: 'NomadJobPicker',
    component: NomadJobPicker,
  }),
);

export const JiraIssuePickeExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    name: 'JiraIssuePicker',
    component: JiraIssuePicker,
  }),
);

export const DatabasePickerExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    name: 'DatabasePicker',
    component: DatabasePicker,
  }),
);

export const TablePickerExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    name: 'TablePicker',
    component: TablePicker,
  }),
);