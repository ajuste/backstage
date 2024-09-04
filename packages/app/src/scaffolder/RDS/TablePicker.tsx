import { useApi } from '@backstage/core-plugin-api';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import { parseEntityRef } from '@backstage/catalog-model';
import Autocomplete, {
  AutocompleteChangeReason,
} from '@material-ui/lab/Autocomplete';
import React, { useCallback, useEffect, useState } from 'react';
import { rdsApiRef, RDSTable } from 'backstage-plugin-zf-tech-insights-common';
import { TableProps } from './tableSchema';
import { DatabasePicker, Result as DatabaseResult } from './DatabasePicker';
import { ErrorSchema } from '@rjsf/utils';

type Result = DatabaseResult & { table: RDSTable }

/**
 * @public
 */
export const TablePicker = (props: TableProps) => {
  const {
    onChange,
    schema: { title = 'Dataset', description = 'A table from an RDS table' },
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

  const rdsApi = useApi(rdsApiRef);

  useEffect((): any => {
    if (instance?.instance && instance?.database) {
      setLoading(true);
      const ref = parseEntityRef(instance.instance);
      rdsApi
        .getTables(ref, instance.database.name)
        .then((tables) =>
          setEntries(tables.map(table => ({ ...instance, table }))))
        .finally(() => setLoading(false));
    }
    return () => null
  }, [instance]);


  const getLabel = (r?: Result) => r?.table?.name || '';
  const selectedEntry = entries?.find(e => e.table?.name === formData?.table?.name) ?? ({ ...instance, table: { name: allowArbitraryValues && formData ? getLabel(formData) : '' } });

  useEffect(() => {
    if (entries?.length === 1 && selectedEntry?.table?.name === '') {
      onChange(instance);
    }
  }, [entries, selectedEntry]);

  const onSelect = useCallback(
    (_: any, entry: Result | string | null, reason: AutocompleteChangeReason) => {
      if (typeof entry === 'string') {
        if (reason === 'blur' || reason === 'create-option') {
          if (formData?.table?.name !== entry || allowArbitraryValues) {
            onChange({ ...instance, table: { name: entry } });
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
      <DatabasePicker
        idSchema={{} as any}
        required={true}
        schema={{
          title: "Source database",
          description: "The database / schema you are ingesting data from",
        }}
        uiSchema={{
          "ui:options": {
            allowArbitraryValues: false,
            allowedInstances: uiSchema['ui:options']?.allowedInstances,
          }
        }}
        onChange={(database: DatabaseResult | undefined, _1: ErrorSchema<DatabaseResult> | undefined, _?: string) => setInstance((prevState: Result) => ({ ...prevState, ...database, table: { name: '' } }))}
        disabled={false}
        readonly={false}
        name={'rds-source-instance'}
        rawErrors={[]}
        registry={registry as any}
        formData={instance}
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