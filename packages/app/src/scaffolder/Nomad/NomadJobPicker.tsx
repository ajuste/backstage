import { useApi } from '@backstage/core-plugin-api';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Autocomplete, {
  AutocompleteChangeReason,
} from '@material-ui/lab/Autocomplete';
import React, { useCallback, useEffect } from 'react';
import useAsync from 'react-use/esm/useAsync';
import { nomadApiRef, NomadJob } from 'backstage-plugin-zf-tech-insights-common';

import {
  NomadJobProps,
} from './schema';

/**
 * @public
 */
export const NomadJobPicker = (props: NomadJobProps) => {
  const {
    onChange,
    schema: { title = 'Entity', description = 'An entity from the catalog' },
    required,
    uiSchema,
    rawErrors,
    formData,
    idSchema,
  } = props;

  const allowArbitraryValues =
    uiSchema['ui:options']?.allowArbitraryValues ?? true;

  const filter = uiSchema['ui:options']?.filter
  const nomadApi = useApi(nomadApiRef);
  const { value: entries, loading } = useAsync(() => nomadApi.getJobs({
    filter
  }));
  const getLabel = (job: NomadJob | string | undefined) => {
    try {
      if (typeof job === 'string') {
        return job;
      }
      return job ? job.Name : '';
    } catch (err) {
      return "";
    }
  }

  const selectedEntry = entries?.find(e => e.ID === formData) ?? (allowArbitraryValues && formData ? getLabel(formData) : '');

  useEffect(() => {
    if (entries?.length === 1 && selectedEntry === '') {
      onChange(entries[0].Name);
    }
  }, [entries, onChange, selectedEntry]);

  const onSelect = useCallback(
    (_: any, entry: string | NomadJob | null, reason: AutocompleteChangeReason) => {
      if (typeof entry !== 'string') {
        onChange(entry ? (entry as NomadJob).Name : undefined);
      }
      else {
        if (reason === 'blur' || reason === 'create-option') {
          if (formData !== entry || allowArbitraryValues) {
            onChange(entry);
          }
        }
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
    </FormControl>
  );
};