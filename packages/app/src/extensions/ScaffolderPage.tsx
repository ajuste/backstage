import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { createScaffolderFieldExtension } from '@backstage/plugin-scaffolder-react';
import { EntityPickerWithRepo } from '../scaffolder/ExtendedEntityPicker';
import { MultipleNomadJobPicker, NomadJobPicker } from '../scaffolder/Nomad';

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