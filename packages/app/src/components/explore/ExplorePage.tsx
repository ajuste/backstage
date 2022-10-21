
import React, { createContext } from 'react';
import { DomainExplorerContent, ExploreLayout, } from '@backstage/plugin-explore';

import { EntityListContextProps, } from '@backstage/plugin-catalog-react';
import { TeamsExplorerComponent } from './TeamExplorerComponent'

export const EntityListContext = createContext<
    EntityListContextProps<any> | undefined
>(undefined);


export const ExplorePage = () => {

    return (
        <ExploreLayout
            title="Explore Zerofox ecosystem"
            subtitle="Browse our ecosystem">
            <ExploreLayout.Route path="domains" title="Domains">
                <DomainExplorerContent />
            </ExploreLayout.Route>
            <ExploreLayout.Route path="/scrum-teams" title="Scrum Teams">
                <TeamsExplorerComponent />
            </ExploreLayout.Route>
        </ExploreLayout>
    );
};

export const explorePage = <ExplorePage />;