import { useApi } from '@backstage/core-plugin-api';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Autocomplete, {
  AutocompleteChangeReason,
} from '@material-ui/lab/Autocomplete';
import React, { useCallback, useEffect } from 'react';
import useAsync from 'react-use/esm/useAsync';
import { jiraApiRef } from 'backstage-plugin-zf-tech-insights-common';

import {
  JiraIssueProps,
} from './schema';

type SearchIssuesResponse = {
  issues: JiraIssue[];
  maxResults: number;
  total: number;
  startAt: number;
  error: any;
}

type JiraIssueType = {
  id: string;
  self: string;
  avatarId: number;
  iconUrl: string;
  name: string;
  description: string;
}

type JiraAccount = {
  accountId: string;
  accountType: string;
  active: boolean;
  avatarUrls: {
    "48x48": string;
    "24x24": string;
    "16x16": string;
    "32x32": string;
  };
  displayName: string;
  emailAddress: string;
  self: string;
  timeZone: string;
}

type JiraIssue = {
  id: string;
  key: string;
  self: string;
  parent: JiraIssue;
  issueType: JiraIssueType
  creator: JiraAccount;
  assignee: JiraAccount;
}

/**
 * @public
 */
export const JiraIssuePicker = (props: JiraIssueProps) => {
  const {
    onChange,
    schema: { title = 'Issue', description = 'An issue from JIRA' },
    required,
    uiSchema,
    rawErrors,
    formData,
    idSchema,
  } = props;

  const allowArbitraryValues =
    uiSchema['ui:options']?.allowArbitraryValues ?? true;

  const searchString = uiSchema['ui:options']?.searchString ?? ''
  const api = useApi(jiraApiRef);
  const { value: entries, loading } = useAsync(() =>
    new Promise<JiraIssue[]>((resolve, reject) =>
      api.searchJira(searchString)
        .then((res: any) => {
          debugger
          resolve((res as SearchIssuesResponse).issues);
        })
        .catch(reject),
    ),
  );

  const getLabel = (item: JiraIssue | string | undefined) => {
    try {
      if (typeof item === 'string') {
        return item;
      }
      return item ? item.key : '';
    } catch (err) {
      return "";
    }
  }

  const selectedEntry = entries?.find(e => e.key === formData) ?? (allowArbitraryValues && formData ? getLabel(formData) : '');

  useEffect(() => {
    if (entries?.length === 1 && selectedEntry === '') {
      onChange(entries[0].key);
    }
  }, [entries, onChange, selectedEntry]);

  const onSelect = useCallback(
    (_: any, entry: string | JiraIssue | null, reason: AutocompleteChangeReason) => {
      if (typeof entry !== 'string') {
        onChange(entry ? (entry as JiraIssue).key : undefined);
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