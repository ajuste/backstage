import { useApi } from '@backstage/core-plugin-api';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Autocomplete, {
  AutocompleteChangeReason,
} from '@material-ui/lab/Autocomplete';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import useAsync from 'react-use/esm/useAsync';
import { nomadApiRef, NomadJob } from 'backstage-plugin-zf-tech-insights-common';

import {
  MultipleNomadJobProps,
} from './schema';

/**
 * @public
 */
export const MultipleNomadJobPicker = (props: MultipleNomadJobProps) => {
  const {
    onChange,
    schema: { title = 'Entity', description = 'An entity from the catalog' },
    required,
    uiSchema,
    rawErrors,
    formData,
    idSchema,
  } = props;

  const [enteredTexts, setEnteredTexts] = useState([] as string[])
  const allowArbitraryValues =
    uiSchema['ui:options']?.allowArbitraryValues ?? true;
  const prefixMatching =
    uiSchema['ui:options']?.prefixMatching ?? false;
  const previewMatches =
    uiSchema['ui:options']?.previewMatches ?? false;

  const filter = uiSchema['ui:options']?.filter
  const nomadApi = useApi(nomadApiRef);
  const { value: entries, loading } = useAsync(async () => nomadApi.getJobs({ filter }));

  const filteredJobs = useMemo(() => {
    if (prefixMatching && enteredTexts.length > 0) {
      return entries?.filter((job: NomadJob) => enteredTexts.find(enteredText => job.ID.toLowerCase().startsWith(enteredText.toLowerCase())));
    }
    return [];
  }, [entries, enteredTexts]);

  const getLabel = (job: NomadJob | string | undefined) => {
    try {
      if (typeof job === 'string') {
        return job;
      }
      return job ? job.ID : '';
    } catch (err) {
      return "";
    }
  }

  const onSelect = useCallback(
    (_: any, refs: (string | NomadJob)[], reason: AutocompleteChangeReason) => {
      const values = refs
        .map(ref => {
          if (typeof ref !== 'string') {
            // if ref does not exist: pass 'undefined' to trigger validation for required value
            return ref ? ref.ID : undefined;
          }
          if (reason === 'blur' || reason === 'create-option') {

            // We need to check against formData here as that's the previous value for this field.
            if (formData.includes(ref) || allowArbitraryValues) {
              return ref;
            }
          }

          return undefined;
        })
        .filter(ref => ref !== undefined) as string[];
      setEnteredTexts(values);
      onChange(values);
    },
    [onChange, formData, allowArbitraryValues],
  );

  useEffect(() => {
    if (entries?.length === 1) {
      onChange([entries[0].ID]);
    }
  }, [entries, onChange]);

  const matchingJobsElements = useMemo(() =>
    filteredJobs?.map((entry: NomadJob) => (<li>{entry.ID}</li>))
  , [filteredJobs]);

  return (
    <FormControl
      margin="normal"
      required={required}
      error={rawErrors?.length > 0 && !formData}
    >
      <Autocomplete
        multiple
        filterSelectedOptions
        disabled={entries?.length === 1}
        id={idSchema?.$id}
        value={
          entries?.filter(e => formData && formData.includes(e.ID)).map((j) => j.ID)
            .concat(allowArbitraryValues && formData ? formData.map(getLabel) : [])
            .concat(allowArbitraryValues ? enteredTexts : [])
        }
        loading={loading}
        onChange={onSelect}
        options={entries || []}
        getOptionLabel={(option) => getLabel(typeof option === 'string' ? option : option.ID)}
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
      {previewMatches && matchingJobsElements?.length ?
        <div>
          <h3>These are the batch jobs that matched your prefixes</h3>
          {matchingJobsElements}
        </div> : null
      }
    </FormControl>
  );
};