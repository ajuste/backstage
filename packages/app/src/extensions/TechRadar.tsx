
import React from 'react';
import {
    TechRadarApi,
    TechRadarLoaderResponse,
} from '@backstage/plugin-tech-radar';
import { GithubResourceFetcherApi } from '@internal/plugin-github-resource-fetcher';
import {
    createPageExtension,
    createRouteRef,
    createExtensionOverrides,
    RouteRef,
} from '@backstage/frontend-plugin-api';
import { compatWrapper } from '@backstage/core-compat-api';
import { TechRadarPage } from '@backstage/plugin-tech-radar';

type GithubRepoDetails = {
    owner: string;
    repo: string;
    path: string;
    branch: string;
};

type RadarType = {
    id: string;
    title: string;
    subtitle: string;
    pageTitle: string;
    path: string;
    routeRef: RouteRef<undefined>;
    repo: GithubRepoDetails;
}

export const Radars: Array<RadarType> = [
    {
        id: "ui-e",
        title: "UI - East",
        subtitle: "Use this radar to determine recommended technologies for new and existing frontend projects.",
        pageTitle: "UI-East",
        path: "/tech-radars/ui-e",
        routeRef: createRouteRef(),
        repo: {
            path: '.backstage/radars/ui-e.json',
            owner: 'riskive',
            repo: 'ui-architecture',
            branch: 'master',
        }
    },
    {
        id: "ui-w",
        title: "UI - West",
        subtitle: "Use this radar to determine recommended technologies for new and existing frontend projects.",
        pageTitle: "UI-West",
        path: "/tech-radars/ui-w",
        routeRef: createRouteRef(),
        repo: {
            path: '.backstage/radars/ui-w.json',
            owner: 'riskive',
            repo: 'ui-architecture',
            branch: 'master',
        }
    },
    {
        id: "qa",
        title: "Testing & Quality",
        subtitle: "Use this radar to determine recommended technologies for testing and quality purposes.",
        pageTitle: "QA",
        path: "/tech-radars/qa",
        routeRef: createRouteRef(),
        repo: {
            path: '.backstage/radars/test-quality.json',
            owner: 'riskive',
            repo: 'ui-architecture',
            branch: 'master',
        }
    },
    {
        id: "sre",
        title: "SRE: Core Infra",
        subtitle: "Use this radar to determine recommended technologies for new and existing infrastructure projects.",
        pageTitle: "SRE: Core Infra",
        path: "/tech-radars/sre",
        routeRef: createRouteRef(),
        repo: {
            path: '.backstage/radars/sre.json',
            owner: 'riskive',
            repo: 'ui-architecture',
            branch: 'master',
        },
    },
    {
        id: "python",
        title: "Python",
        subtitle: "Use this radar to determine recommended technologies for new and existing Python projects.",
        pageTitle: "Python",
        path: "/tech-radars/python",
        routeRef: createRouteRef(),
        repo: {
            path: '.backstage/radars/python.json',
            owner: 'riskive',
            repo: 'ui-architecture',
            branch: 'master',
        }
    }, 
    {
        id: "ai",
        title: "AI & Analysis",
        subtitle: "Use this radar to determine recommended technologies for AI and data analysis projects.",
        pageTitle: "AI & Analysis",
        path: "/tech-radars/ai",
        routeRef: createRouteRef(),
        repo: {
            path: '.backstage/radars/ai.json',
            owner: 'riskive',
            repo: 'ui-architecture',
            branch: 'master',
        }
    }, {
        id: "flutter-mobile",
        title: "Flutter Mobile",
        subtitle: "Use this radar to determine recommended technologies for Flutter mobile projects.",
        pageTitle: "Flutter Mobile",
        path: "/tech-radars/flutter-mobile",
        routeRef: createRouteRef(),
        repo: {
            path: '.backstage/radars/mobile.json',
            owner: 'riskive',
            repo: 'mobile-architecture',
            branch: 'master',
        }
    }
];

export const techRadarExtensionOverride = createExtensionOverrides({
    extensions: Radars.map((radar) => createPageExtension({
        namespace: 'techradar',
        name: radar.id,
        defaultPath: radar.path,
        routeRef: radar.routeRef,
        loader: () => Promise.resolve(compatWrapper(<TechRadarPage id={radar.id} width={1500} height={800} title={radar.title} subtitle={radar.subtitle} pageTitle={radar.pageTitle} />))
    }))
})

/**
 * This is a client for the Tech Radar API.
 * It is responsible for fetching the data from the backend.
 */
export class TechRadarClient implements TechRadarApi {
    constructor(private githubResourceFetcherApi: GithubResourceFetcherApi) { }
    async load(id: string | undefined): Promise<TechRadarLoaderResponse> {
        const details = this.getRepoDetails(id);

        const res = await this.githubResourceFetcherApi.fetch({
            owner: details.owner,
            repo: details.repo,
            branch: details.branch,
            path: details.path,
        });

        const data = JSON.parse(res);

        return {
            ...data,
            entries: data.entries.map((entry: any) => ({
                ...entry,
                timeline: entry.timeline.map((timeline: any) => ({
                    ...timeline,
                    date: new Date(timeline.date),
                })),
            })),
        };
    }

    getRepoDetails(id: string | undefined): GithubRepoDetails {
        const radar = Radars.find(radar => radar.id === id);
        if (!radar) {
            throw new Error('No repo details found');
        }
        return radar.repo;
    }
}
