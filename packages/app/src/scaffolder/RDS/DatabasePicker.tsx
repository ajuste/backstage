import { useApi } from '@backstage/core-plugin-api';
import TextField from '@material-ui/core/TextField';

import Link from '@material-ui/core/Link';
import FormControl from '@material-ui/core/FormControl';
import Autocomplete, {
  AutocompleteChangeReason,
} from '@material-ui/lab/Autocomplete';
import React, { useCallback, useEffect, useState } from 'react';
import { rdsApiRef, RDSDatabase, RDSInstance } from 'backstage-plugin-zf-tech-insights-common';
import { DatabaseProps } from './databaseSchema';
import { InstancePicker, InstanceResult } from './InstancePicker';
import { ErrorSchema } from '@rjsf/utils';


export type Result = RDSDatabase & {}

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

  const [instance, setInstance] = useState<RDSInstance | null>();
  const [database, setDatabase] = useState<Result | null>(formData);
  const [loading, setLoading] = useState<boolean>(false);
  const [entries, setEntries] = useState<Result[]>([]);
  const allowArbitraryValues =
    uiSchema['ui:options']?.allowArbitraryValues ?? true;
  const rdsApi = useApi(rdsApiRef);

  useEffect((): any => {
    if (instance) {
      setLoading(true);
      rdsApi
        .getDatabases(instance)
        .then(setEntries)
        .finally(() => setLoading(false));
    } else {
      setEntries([]);
    }
    return () => null
  }, [instance]);

  const getLabel = (r?: Result) => r?.displayName ?? r?.name ?? '';
  const getEntryByName = (name: string) => entries?.find(e => e?.name === name) ?? null;
  const selectedEntry = getEntryByName(database?.name ?? formData?.table?.name)
  
  const onSelect = useCallback(
    (_0: any, entry: Result | string | null, _1: AutocompleteChangeReason) => {
      setDatabase(typeof entry === 'string' ? getEntryByName(entry) : entry);
    }, [],
  );

  useEffect(() => { setDatabase(null); }, [instance]);
  useEffect(() => { onChange(database); }, [database]);

  let catalogLink = null;
  if (selectedEntry?.catalogLink) {
    catalogLink = (
      <div style={{ paddingBottom: '1rem' }}>
        <Link target='blank' href={selectedEntry?.catalogLink}>Check '{selectedEntry.name}' database details</Link>
      </div>
    );
  }

  return (
    <FormControl
      margin="normal"
      required={required}
      error={rawErrors?.length > 0 && !formData}
    >
      <InstancePicker
        idSchema={{} as any}
        required={true}
        schema={{
          title: "Source database instance",
          description: "The database instance you are ingesting data from",
        }}
        uiSchema={{
          "ui:options": {
            allowArbitraryValues: false,
            allowedInstances: uiSchema['ui:options']?.allowedInstances,
          }
        }}
        onChange={(instance: InstanceResult | undefined, _1: ErrorSchema<InstanceResult> | undefined, _?: string) => setInstance(instance)}
        disabled={false}
        readonly={false}
        name={'rds-source-instance'}
        rawErrors={[]}
        registry={registry as any}
        formData={instance}
        onBlur={(_0: string, _1: any) => void 0}
        onFocus={(_0: string, _1: any) => void 0} />
      <Autocomplete
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
      {catalogLink}
    </FormControl >
  );
};