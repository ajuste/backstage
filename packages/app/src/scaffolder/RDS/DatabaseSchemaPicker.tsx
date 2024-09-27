import { useApi } from '@backstage/core-plugin-api';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Link from '@material-ui/core/Link';
import Autocomplete, {
  AutocompleteChangeReason,
} from '@material-ui/lab/Autocomplete';
import React, { useCallback, useEffect, useState } from 'react';
import { rdsApiRef, RDSDatabase, RDSSchema } from 'backstage-plugin-zf-tech-insights-common';
import { DatabaseSchemaProps } from './databaseSchemaSchema';
import { DatabasePicker, Result as DatabaseResult } from './DatabasePicker';
import { ErrorSchema } from '@rjsf/utils';

export type DatabaseSchemaResult = RDSSchema & {}

/**
 * @public
 */
export const DatabaseSchemaPicker = (props: DatabaseSchemaProps) => {
  const {
    onChange,
    schema: { title = 'Schema', description = 'A RDS schema' },
    required,
    uiSchema,
    rawErrors,
    formData,
    idSchema,
    registry,
  } = props;

  const [database, setDatabase] = useState<RDSDatabase | null>();
  const [schema, setSchema] = useState<DatabaseSchemaResult | null>(formData);
  const [loading, setLoading] = useState<boolean>(false);
  const [entries, setEntries] = useState<RDSSchema[]>([]);
  const allowArbitraryValues =
    uiSchema['ui:options']?.allowArbitraryValues ?? true;

  const rdsApi = useApi(rdsApiRef);

  useEffect((): any => {
    if (database) {
      setLoading(true);
      rdsApi
        .getSchemas(database)
        .then(setEntries)
        .finally(() => setLoading(false));
    } else {
      setEntries([]);
    }
    return () => null
  }, [database]);


  const getLabel = (r?: DatabaseSchemaResult) => r?.displayName ?? r?.name ?? '';
  const getEntryByName = (name: string) => entries?.find(e => e?.name === name) ?? null;
  const selectedEntry = getEntryByName(schema?.name ?? formData?.table?.name)

  const onSelect = useCallback(
    (_0: any, entry: DatabaseSchemaResult | string | null, _1: AutocompleteChangeReason) => {
      setSchema(typeof entry === 'string' ? getEntryByName(entry) : entry);
    }, [],
  );

  useEffect(() => { setSchema(null); }, [database]);
  useEffect(() => { onChange(schema); }, [schema]);
  
  let catalogLink = null;
  if (selectedEntry?.catalogLink) {
    catalogLink = (
      <div style={{ paddingBottom: '1rem' }}>
        <Link target='blank' href={selectedEntry?.catalogLink}>Check '{selectedEntry.name}' schema details</Link>
      </div>
    );
  }

  return (
    <FormControl
      margin="normal"
      required={required}
      error={rawErrors?.length > 0 && !formData}
    >
      <DatabasePicker
        idSchema={{} as any}
        required={true}
        schema={{
          title: "Source database",
          description: "The database you are ingesting data from",
        }}
        uiSchema={{
          "ui:options": {
            allowArbitraryValues: false,
            allowedInstances: uiSchema['ui:options']?.allowedInstances,
          }
        }}
        onChange={(database: DatabaseResult | null, _1: ErrorSchema<DatabaseResult> | undefined, _?: string) => setDatabase(database)}
        disabled={false}
        readonly={false}
        name={'rds-source-instance'}
        rawErrors={[]}
        registry={registry as any}
        formData={database}
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
        renderInput={params => (database ?
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