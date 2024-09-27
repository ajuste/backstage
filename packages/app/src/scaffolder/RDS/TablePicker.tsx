import { useApi } from '@backstage/core-plugin-api';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Link from '@material-ui/core/Link';
import Autocomplete, {
  AutocompleteChangeReason,
} from '@material-ui/lab/Autocomplete';
import React, { useCallback, useEffect, useState } from 'react';
import { rdsApiRef, RDSSchema, RDSTable } from 'backstage-plugin-zf-tech-insights-common';
import { TableProps } from './tableSchema';
import { DatabaseSchemaPicker, DatabaseSchemaResult } from './DatabaseSchemaPicker';
import { ErrorSchema } from '@rjsf/utils';

type Result = RDSTable & {}

/**
 * @public
 */
export const TablePicker = (props: TableProps) => {
  const {
    onChange,
    schema: { title = 'Table', description = 'A table from an RDS table' },
    required,
    uiSchema,
    rawErrors,
    formData,
    idSchema,
    registry,
  } = props;

  const [schema, setSchema] = useState<RDSSchema | null>();
  const [table, setTable] = useState<Result | null>(formData);
  const [loading, setLoading] = useState<boolean>(false);
  const [entries, setEntries] = useState<RDSTable[]>([]);
  const allowArbitraryValues =
    uiSchema['ui:options']?.allowArbitraryValues ?? true;

  const rdsApi = useApi(rdsApiRef);

  useEffect((): any => {
    if (schema) {
      setLoading(true);
      rdsApi
        .getTables(schema)
        .then(setEntries)
        .finally(() => setLoading(false));
    } else {
      setEntries([]);
    }
    return () => null
  }, [schema]);


  const getLabel = (r?: Result) => r?.displayName ?? r?.name ?? '';
  const getEntryByName = (name: string) => entries?.find(e => e?.name === name) ?? null;
  const selectedEntry = getEntryByName(table?.name ?? formData?.table?.name)

  const onSelect = useCallback(
    (_0: any, entry: Result | string | null, _1: AutocompleteChangeReason) => {
      setTable(typeof entry === 'string' ? getEntryByName(entry) : entry);
    }, [],
  );

  useEffect(() => { setTable(null); }, [schema]);
  useEffect(() => { onChange(table); }, [table]);

  let catalogLink = null;
  if (selectedEntry?.catalogLink) {
    catalogLink = (
      <div style={{ paddingBottom: '1rem' }}>
        <Link target='blank' href={selectedEntry?.catalogLink}>Check '{selectedEntry.name}' table details</Link>
      </div>
    );
  }

  return (
    <FormControl
      margin="normal"
      required={required}
      error={rawErrors?.length > 0 && !formData}
    >
      <DatabaseSchemaPicker
        idSchema={{} as any}
        required={true}
        schema={{
          title: "Source shema",
          description: "The schema you are ingesting data from",
        }}
        uiSchema={{
          "ui:options": {
            allowArbitraryValues: false,
            allowedInstances: uiSchema['ui:options']?.allowedInstances,
          }
        }}
        onChange={(schema: DatabaseSchemaResult | null, _1: ErrorSchema<DatabaseSchemaResult> | undefined, _?: string) => setSchema(schema)}
        disabled={false}
        readonly={false}
        name={'rds-source-instance'}
        rawErrors={[]}
        registry={registry as any}
        formData={schema}
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
        renderInput={params => (schema ?
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