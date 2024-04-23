import { newId, getLabelForScore } from "./utils"

const infrastructureScores = {
    environments: {
        "production_only": 25,
        "production_and_staging": 50,
        "production_staging_qa": 75,
        "production_staging_qa_local": 100
    },
    continuous_integration: {
        "best_practices_not_defined": 0,
        "best_practices_defined_but_not_enforced": 33,
        "best_practices_defined_and_enforced_but_not_reproducible": 67,
        "best_practices_defined_and_enforced_and_reproducible": 100
    },
    continuous_deployment: {
        "deployment_not_automated": 0,
        "deployment_automated_not_containerized": 33,
        "deployment_automated_containerized_not_orchestrated": 67,
        "deployment_fully_automated_containerized_orchestrated": 100
    },
    monitoring_alerting: {
        "uptime_requirements_not_defined": 0,
        "uptime_requirements_defined_but_not_monitored": 33,
        "uptime_requirements_defined_and_monitored_but_logs_uncaptured": 67,
        "uptime_requirements_defined_monitored_and_logs_captured": 100
    }
};

const infrastructureDescriptions = {
    environments: {
        "production_only": "Service can only be validated on Production.",
        "production_and_staging": "Service can only be validated on Production and Staging.",
        "production_staging_qa": "Service can only be validated on Production, Staging and QA.",
        "production_staging_qa_local": "Service can be validated on Production, Staging, QA and Locally."
    },
    continuous_integration: {
        "best_practices_not_defined": "Best practices such as linting, testing, and structure are not defined.",
        "best_practices_defined_but_not_enforced": "Best practices are well defined, but not enforced.",
        "best_practices_defined_and_enforced_but_not_reproducible": "Best practices are well defined and enforced, but engineers cannot reproduce issues locally.",
        "best_practices_defined_and_enforced_and_reproducible": "Best practices are well defined, enforced, and reproducible."
    },
    continuous_deployment: {
        "deployment_not_automated": "Deployment of service is not automated.",
        "deployment_automated_not_containerized": "Deployment of service is automated, but not containerized.",
        "deployment_automated_containerized_not_orchestrated": "Deployment of service is automated and containerized, but not orchestrated.",
        "deployment_fully_automated_containerized_orchestrated": "Deployment of service is fully automated, containerized, and orchestrated."
    },
    monitoring_alerting: {
        "uptime_requirements_not_defined": "Uptime requirements have not been defined.",
        "uptime_requirements_defined_but_not_monitored": "Uptime requirements have been defined, but the service is not monitored.",
        "uptime_requirements_defined_and_monitored_but_logs_uncaptured": "Uptime requirements have been defined and the service is monitored, but logs are uncaptured.",
        "uptime_requirements_defined_monitored_and_logs_captured": "Uptime requirements have been defined, the service is monitored, and logs are being captured."
    }
};

export const generateInfrastructureAreaScore = (ctx: any) => {
    const environmentsScore = Math.round(infrastructureScores.environments[ctx.input.environments as keyof typeof infrastructureScores.environments]);
    const continuousIntegrationScore = Math.round(infrastructureScores.continuous_integration[ctx.input.continuous_integration as keyof typeof infrastructureScores.continuous_integration]);
    const continuousDeploymentScore = Math.round(infrastructureScores.continuous_deployment[ctx.input.continuous_deployment as keyof typeof infrastructureScores.continuous_deployment]);
    const monitoringAlertingScore =Math.round(infrastructureScores.monitoring_alerting[ctx.input.monitoring_alerting as keyof typeof infrastructureScores.monitoring_alerting]);

    const scores = [environmentsScore, continuousIntegrationScore, continuousDeploymentScore, monitoringAlertingScore];

    return {
        id: newId(),
        title: "Infrastructure",
        scorePercent: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        scoreSuccess: getLabelForScore(scores.reduce((a, b) => a + b, 0) / scores.length),
        scoreEntries: [{
            id: newId(),
            title: "Environments",
            scorePercent: environmentsScore,
            scoreSuccess: getLabelForScore(environmentsScore),
            details: infrastructureDescriptions['environments'][ctx.input.environments as keyof typeof infrastructureScores.environments],
            scoreChoices: Object.keys(infrastructureScores['environments']).map((key: string) => {
                return {
                    [infrastructureDescriptions['environments'][key as keyof typeof infrastructureDescriptions.environments]]: infrastructureScores['environments'][key as keyof typeof infrastructureScores.environments] as any
                }
            })
        }, {
            id: newId(),
            title: "Continuous Integration",
            howToScore: "How much of the peer review process is automated to enforce good practices?",
            scorePercent: continuousIntegrationScore,
            scoreSuccess: getLabelForScore(continuousIntegrationScore),
            details: infrastructureDescriptions['continuous_integration'][ctx.input.continuous_integration as keyof typeof infrastructureScores.continuous_integration],
            scoreChoices: Object.keys(infrastructureScores['continuous_integration']).map((key: string) => {
                return {
                    [infrastructureDescriptions['continuous_integration'][key as keyof typeof infrastructureDescriptions.continuous_integration]]: infrastructureScores['continuous_integration'][key as keyof typeof infrastructureScores.continuous_integration] as any
                }
            })
        }, {
            id: newId(),
            title: "Continuous Deployment",
            howToScore: "How much of the deployment process is automated and reproducible locally?",
            scorePercent: continuousDeploymentScore,
            scoreSuccess: getLabelForScore(continuousDeploymentScore),
            details: infrastructureDescriptions['continuous_deployment'][ctx.input.continuous_deployment as keyof typeof infrastructureScores.continuous_deployment],
            scoreChoices: Object.keys(infrastructureScores['continuous_deployment']).map((key: string) => {
                return {
                    [infrastructureDescriptions['continuous_deployment'][key as keyof typeof infrastructureDescriptions.continuous_deployment]]: infrastructureScores['continuous_deployment'][key as keyof typeof infrastructureScores.continuous_deployment] as any
                }
            })
        }, {
            id: newId(),
            title: "Monitoring / Alerting",
            howToScore: "What automated systems do we have to ensure availability and expected functionality?",
            scorePercent: monitoringAlertingScore,
            scoreSuccess: getLabelForScore(monitoringAlertingScore),
            details: infrastructureDescriptions['monitoring_alerting'][ctx.input.monitoring_alerting as keyof typeof infrastructureScores.monitoring_alerting],
            scoreChoices: Object.keys(infrastructureScores['monitoring_alerting']).map((key: string) => {
                return {
                    [infrastructureDescriptions['monitoring_alerting'][key as keyof typeof infrastructureDescriptions.monitoring_alerting]]: infrastructureScores['monitoring_alerting'][key as keyof typeof infrastructureScores.monitoring_alerting] as any
                }
            })
        }]
    };
};
