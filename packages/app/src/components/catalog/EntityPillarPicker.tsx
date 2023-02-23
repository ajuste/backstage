import React, {useEffect, useMemo, useState} from 'react';

import {Entity} from '@backstage/catalog-model';

import {DefaultEntityFilters, EntityFilter, useEntityList,} from '@backstage/plugin-catalog-react';

import {Box, Checkbox, FormControlLabel, TextField, Typography} from '@material-ui/core';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {Autocomplete} from '@material-ui/lab';

const icon = <CheckBoxOutlineBlankIcon fontSize="small"/>;
const checkedIcon = <CheckBoxIcon fontSize="small"/>;

type PillarFilters = DefaultEntityFilters & {
    pillars?: EntityPillarFilter;
};

class EntityPillarFilter implements EntityFilter {
    constructor(readonly values: string[]) {
    }

    filterEntity(entity: Entity): boolean {
        const pillar = entity.metadata.annotations?.['zerofox.com/pillar'];
        return pillar !== undefined && this.values.includes(pillar);
    }

    toQueryValue(): string | string[] {
        return this.values;
    }
}

export const EntityPillarPicker = () => {
    const {
        filters: {pillars},
        updateFilters,
        backendEntities,
        queryParameters: {pillars: pillarsParameter},
    } = useEntityList<PillarFilters>();

    const queryParamPillars = useMemo(
        () => [pillarsParameter].flat().filter(Boolean) as string[],
        [pillarsParameter],
    );

    const [selectedPillars, setSelectedPillars] = useState(
        queryParamPillars.length ? queryParamPillars : pillars?.values ?? [],
    );

    // Set selected pillars on query parameter updates; this happens at initial page load and from
    // external updates to the page location.
    useEffect(() => {
        if (queryParamPillars.length) {
            setSelectedPillars(queryParamPillars);
        }
    }, [queryParamPillars]);

    const availablePillars = useMemo(
        () => {
            const backendPillars = backendEntities
                .flatMap((e: Entity) =>
                    (e.metadata.annotations?.['zerofox.com/pillar'])
                )
                .filter(Boolean) as string[];

            const defaultPillars = [
                'Attack Surface',
                'Disruption',
                'Intelligence',
                'Protection',
                'Response',
                'Sustaining',
            ];

            return [...new Set([...backendPillars, ...defaultPillars])].sort();
        },
        [backendEntities],
    )

    useEffect(() => {
        updateFilters({
            pillars:
                selectedPillars.length && availablePillars.length
                    ? new EntityPillarFilter(selectedPillars)
                    : undefined,
        });
    }, [selectedPillars, updateFilters, availablePillars]);

    if (!availablePillars.length) return null;

    return (
        <Box pb={1} pt={1}>
            <Typography variant="button" component="label">
                Pillar
                <Autocomplete
                    multiple
                    options={availablePillars}
                    value={selectedPillars}
                    onChange={(_: object, value: string[]) => setSelectedPillars(value)}
                    renderOption={(option, {selected}) => (
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
                    popupIcon={<ExpandMoreIcon data-testid="pillar-picker-expand"/>}
                    renderInput={params => (
                        <TextField
                            {...params}
                            // className={classes.input}
                            variant="outlined"
                        />
                    )}
                />
            </Typography>
        </Box>
    );
};