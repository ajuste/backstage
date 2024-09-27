import { useApi } from '@backstage/core-plugin-api';
import TextField from '@material-ui/core/TextField';

import Link from '@material-ui/core/Link';
import FormControl from '@material-ui/core/FormControl';
import Autocomplete, {
  AutocompleteChangeReason,
} from '@material-ui/lab/Autocomplete';
import React, { useCallback, useEffect, useState } from 'react';
import { rdsApiRef, RDSInstance } from 'backstage-plugin-zf-tech-insights-common';
import { DatabaseProps } from './databaseSchema';


export type InstanceResult = RDSInstance & {}

/**
 * @public
 */
export const InstancePicker = (props: DatabaseProps) => {
  const {
    onChange,
    schema: { title = 'Instance', description = 'An RDS instance' },
    required,
    uiSchema,
    rawErrors,
    formData,
    idSchema,
  } = props;

  const [loading, setLoading] = useState<boolean>(false);
  const [instance, setInstance] = useState<InstanceResult | null>(formData);
  const [entries, setEntries] = useState<RDSInstance[]>([]);
  const allowArbitraryValues =
    uiSchema['ui:options']?.allowArbitraryValues ?? true;
  const rdsApi = useApi(rdsApiRef);


  useEffect((): any => {
    setLoading(true);
    rdsApi
      .getInstances()
      .then((instances) => setEntries(instances))
      .finally(() => setLoading(false));
  }, []);


  const getLabel = (r?: InstanceResult) => r?.displayName ?? r?.name ?? '';
  const getEntryByName = (name: string) => entries?.find(e => e?.name === name) ?? null;
  const selectedEntry = getEntryByName(instance?.name ?? formData?.name)

  useEffect(() => {
    if (entries?.length === 1 && selectedEntry?.name === '') {
      onChange(instance);
    }
  }, [entries, instance]);

  const onSelect = useCallback(
    (_0: any, entry: InstanceResult | string | null, _1: AutocompleteChangeReason) => {
      setInstance(typeof entry === 'string' ? getEntryByName(entry) : entry);
    }, [],
  );

  useEffect(() => { onChange(instance); }, [instance]);

  let catalogLink = null;
  if (selectedEntry?.catalogLink) {
    catalogLink = (
      <div style={{ paddingBottom: '1rem' }}>
        <Link target='blank' href={selectedEntry?.catalogLink}>Check '{selectedEntry.name}' instance details</Link>
      </div>
    );
  }

  return (
    <FormControl
      margin="normal"
      required={required}
      error={rawErrors?.length > 0 && !formData}
    >
      <Autocomplete
        id={idSchema?.$id}
        value={selectedEntry}
        loading={loading}
        onChange={onSelect}
        options={entries || []}
        getOptionLabel={(option: any) => getLabel(option)}
        autoSelect
        freeSolo={allowArbitraryValues}
        renderInput={params => (
          <TextField
            {...params}
            label={title}
            margin="dense"
            helperText={description}
            FormHelperTextProps={{ margin: 'dense', style: { marginLeft: 0 } }}
            variant="outlined"
            required={required}
            InputProps={params.InputProps}
          />
        )}
      />
      {catalogLink}
    </FormControl>
  );
};