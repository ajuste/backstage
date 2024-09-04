import { useApi } from '@backstage/core-plugin-api';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import { parseEntityRef } from '@backstage/catalog-model';
import Autocomplete, {
  AutocompleteChangeReason,
} from '@material-ui/lab/Autocomplete';
import React, { useCallback, useEffect, useState } from 'react';
import { rdsApiRef, RDSDatabase } from 'backstage-plugin-zf-tech-insights-common';
import { DatabaseProps } from './databaseSchema';
import { EntityPickerWithRepo } from '../ExtendedEntityPicker';
import { ErrorSchema } from '@rjsf/utils';

export type Result = { instance: string, database: RDSDatabase }

/**
 * @public
 */
export const DatabasePicker = (props: DatabaseProps) => {
  const {
    onChange,
    schema: { title = 'Database', description = 'A database from an instance RDS' },
    required,
    uiSchema,
    rawErrors,
    formData,
    idSchema,
    registry,
  } = props;

  const [instance, setInstance] = useState<Result>(formData);
  const [loading, setLoading] = useState<boolean>(false);
  const [entries, setEntries] = useState<Result[]>([]);
  const allowArbitraryValues =
    uiSchema['ui:options']?.allowArbitraryValues ?? true;
  const allowedInstances = uiSchema['ui:options']?.allowedInstances ?? [];
  const rdsApi = useApi(rdsApiRef);


  useEffect((): any => {
    if (instance?.instance && instance?.database) {
      setLoading(true);
      const ref = parseEntityRef(instance.instance);
      rdsApi
        .getDatabases(ref)
        .then((databases) =>
          setEntries(databases.map(database => ({ ...instance, database }))))
        .finally(() => setLoading(false));
    }
    return () => null
  }, [instance]);


  const getLabel = (r?: Result) => r?.database?.name || '';

  const selectedEntry = entries?.find(e => e.database?.name === formData?.database?.name) ?? ({ ...instance, database: { name: allowArbitraryValues && formData ? getLabel(formData) : '' } });

  useEffect(() => {
    debugger
    if (entries?.length === 1 && selectedEntry?.database?.name === '') {
      onChange(instance);
    }
  }, [entries, selectedEntry]);

  const onSelect = useCallback(
    (_: any, entry: Result | string | null, reason: AutocompleteChangeReason) => {
      debugger
      if (typeof entry === 'string') {
        if (reason === 'blur' || reason === 'create-option') {
          if (formData?.database?.name !== entry || allowArbitraryValues) {
            onChange({ ...instance, database: { name: entry } });
          }
        }
      }
      else {
        onChange(entry ?? undefined);
      }
    },
    [onChange, formData, allowArbitraryValues],
  );

  return (
    <FormControl
      margin="normal"
      required={required}
      error={rawErrors?.length > 0 && !formData}
    >
      <EntityPickerWithRepo
        idSchema={{} as any}
        required={true}
        schema={{
          title: "Source RDS instance",
          description: "Select the RDS instance to use as the source",
        }}
        uiSchema={{
          "ui:options": {
            whitelistRefs: allowedInstances,
            tryShowDisplayName: true,
            allowArbitraryValues: false,
            catalogFilter: {
              'spec.type': 'database',
              kind: 'resource',
            }
          }
        }}
        onChange={(instance: string | undefined, _1: ErrorSchema<string> | undefined, _?: string) => setInstance({ instance: instance || '', database: { name: '' } })}
        disabled={false}
        readonly={false}
        name={'rds-source-instance'}
        rawErrors={[]}
        registry={registry as any}
        formData={instance?.instance}
        onBlur={(_0: string, _1: any) => void 0}
        onFocus={(_0: string, _1: any) => void 0} />
      <Autocomplete
        disabled={entries?.length === 1}
        id={idSchema?.$id}
        value={selectedEntry}
        loading={loading}
        onChange={onSelect}
        options={entries || []}
        getOptionLabel={(option: any) => getLabel(option)}
        autoSelect
        freeSolo={allowArbitraryValues}
        renderInput={params => (instance ?
          <TextField
            {...params}
            label={title}
            margin="dense"
            helperText={description}
            FormHelperTextProps={{ margin: 'dense', style: { marginLeft: 0 } }}
            variant="outlined"
            required={required}
            InputProps={params.InputProps}
          /> : null
        )}
      />
    </FormControl >
  );
};