import React, { useEffect, useMemo, useState } from 'react';

import Alert from '@material-ui/lab/Alert';
import useAsync from 'react-use/lib/useAsync';
import { Entity } from '@backstage/catalog-model';

import { DefaultEntityFilters, EntityFilter, useEntityList, CatalogApi, catalogApiRef } from '@backstage/plugin-catalog-react';
import { Progress } from '@backstage/core-components';
import { Box, Checkbox, FormControlLabel, TextField, Typography } from '@material-ui/core';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { Autocomplete } from '@material-ui/lab';
import { useApi } from '@backstage/core-plugin-api';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

type Filters = DefaultEntityFilters & {
    engineVersion?: Filter;
};

class Filter implements EntityFilter {
    constructor(readonly values: string[]) {
    }
    filterEntity(entity: Entity): boolean {
        const specValue = entity.spec?.version;
        return specValue !== null && specValue !== undefined && this.values.includes(specValue.toString());
    }
}


export const DatabaseEngineVersionPicker = () => {
    const {
        filters,
        updateFilters,
        queryParameters: { engineVersion: engineVersionParams },
    } = useEntityList<Filters>();

    const queryParam = useMemo(
        () => [engineVersionParams].flat().filter(Boolean) as string[],
        [engineVersionParams],
    );

    const [selectedValue, setSelectedValue] = useState(
        queryParam.length ? queryParam : filters?.engineVersion?.values ?? [],
    );

    const catalogClient = useApi(catalogApiRef) as CatalogApi

    const {
        value: facets,
        loading,
        error,
    } = useAsync(async () => catalogClient.getEntityFacets({ facets: ["spec.version"] }), []);


    // Set selected pillars on query parameter updates; this happens at initial page load and from
    // external updates to the page location.
    useEffect(() => {
        if (queryParam?.length) {
            setSelectedValue(queryParam);
        }
    }, [queryParam]);

    useEffect(() => {
        updateFilters({
            engineVersion:
                selectedValue?.length && facets?.facets["spec.version"].length
                    ? new Filter(selectedValue)
                    : undefined,
        });
    }, [selectedValue, updateFilters, facets]);


    if (loading) {
        return <Progress />;
    } else if (error) {
        return <Alert severity="error">{error.message}</Alert>;
    }
    return (
        <Box pb={1} pt={1}>
            <Typography variant="button" component="label">
                Engine Version
                <Autocomplete
                    multiple
                    options={facets?.facets["spec.version"].map(({ value }) => String(value)) || []}
                    value={selectedValue}
                    onChange={(_: object, value: string[]) => setSelectedValue(value)}
                    renderOption={(option, { selected }) => (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    icon={icon}
                                    checkedIcon={checkedIcon}
                                    checked={selected}
                                />
                            }
                            label={option}
                        />
                    )}
                    size="small"
                    popupIcon={<ExpandMoreIcon data-testid="pillar-picker-expand" />}
                    renderInput={params => (
                        <TextField
                            {...params}
                            variant="outlined"
                        />
                    )}
                />
            </Typography>
        </Box>
    );
};