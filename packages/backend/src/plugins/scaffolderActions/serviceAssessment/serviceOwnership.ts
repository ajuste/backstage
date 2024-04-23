import { newId, getLabelForScore } from "./utils"

const ownershipScores = {
    service_ownership: {
        "primary_or_secondary_not_specified": 0,
        "primary_not_knowledgable": 25,
        "primary_owns_secondary_not_knowledgable": 50,
        "primary_and_secondary_knowledgable": 100
    },
    code_standards: {
        "no_code_standards_defined": 0,
        "linting_no_guidance_on_organization": 33,
        "linting_well_organized_no_scaffolding": 67,
        "linting_organization_scaffolding": 100
    },
    maintenance: {
        "service_not_changed_in_3_months": 0,
        "service_deployed_recently_security_issues_outstanding": 25,
        "service_deployed_recently_security_issues_fixed_framework_out_of_date": 50,
        "service_actively_deployed_maintained_up_to_date": 100
    },
    analytics_analysis: {
        "no_usage_reporting": 0,
        "usage_reporting_no_dashboard": 25,
        "usage_reporting_dashboard_no_bigquery": 50,
        "usage_reporting_dashboard_bigquery": 100
    }
};

const ownershipDescriptions = {
    service_ownership: {
        "primary_or_secondary_not_specified": "Either the primary or secondary service owner is not specified.",
        "primary_not_knowledgable": "Primary and secondary service owners are specified, but the primary isn't knowledgeable about the service.",
        "primary_owns_secondary_not_knowledgable": "Primary owns the service, and the secondary is specified, but cannot own the service in the primary's absence.",
        "primary_and_secondary_knowledgable": "Primary and secondary are specified and knowledgeable owners of the service."
    },
    code_standards: {
        "no_code_standards_defined": "No code standards have been defined.",
        "linting_no_guidance_on_organization": "The service implements linting, but doesn't offer any guidance on file organization.",
        "linting_well_organized_no_scaffolding": "The service implements linting and is well organized, but doesn't provide scaffolding.",
        "linting_organization_scaffolding": "The service implements linting, organization, and scaffolding."
    },
    maintenance: {
        "service_not_changed_in_3_months": "The service has not been changed/deployed in the last 3 months.",
        "service_deployed_recently_security_issues_outstanding": "The service has been deployed recently, but identified security issues have been outstanding for more than 2 weeks.",
        "service_deployed_recently_security_issues_fixed_framework_out_of_date": "The service has been deployed recently, and security issues fixed, but the service's framework/language is out of date with the current LTS version.",
        "service_actively_deployed_maintained_up_to_date": "The service is being actively deployed, maintained, and kept up to date."
    },
    analytics_analysis: {
        "no_usage_reporting": "The service does not report usage to any external/internal service.",
        "usage_reporting_no_dashboard": "The service reports usage, but no dashboard has been developed to track important metrics.",
        "usage_reporting_dashboard_no_bigquery": "The service reports usage, and a dashboard has been developed, but the data isn't accessible in BigQuery.",
        "usage_reporting_dashboard_bigquery": "The service reports usage, a dashboard has been developed, and the data is accessible in BigQuery."
    }
};

export const generateServiceOwnershipAreaScore = (ctx: any) => {
    const serviceOwnershipScore = Math.round(ownershipScores.service_ownership[ctx.input.service_ownership as keyof typeof ownershipScores.service_ownership]);
    const codeStandardsScore = Math.round(ownershipScores.code_standards[ctx.input.code_standards as keyof typeof ownershipScores.code_standards]);
    const maintenanceScore = Math.round(ownershipScores.maintenance[ctx.input.maintenance as keyof typeof ownershipScores.maintenance]);
    const analyticsAnalysisScore = Math.round(ownershipScores.analytics_analysis[ctx.input.analytics_analysis as keyof typeof ownershipScores.analytics_analysis]);

    const scores = [serviceOwnershipScore, codeStandardsScore, maintenanceScore, analyticsAnalysisScore];

    return {
        id: newId(),
        title: "Service Ownership",
        scorePercent: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        scoreSuccess: getLabelForScore(scores.reduce((a, b) => a + b, 0) / scores.length),
        scoreEntries: [{
            id: newId(),
            title: "Service Ownership",
            scorePercent: serviceOwnershipScore,
            scoreSuccess: getLabelForScore(serviceOwnershipScore),
            scoreDescription: ownershipDescriptions.service_ownership[ctx.input.service_ownership as keyof typeof ownershipDescriptions.service_ownership],
            details: ownershipDescriptions['service_ownership'][ctx.input.service_ownership as keyof typeof ownershipScores.service_ownership],
            scoreChoices: Object.keys(ownershipDescriptions['service_ownership']).map((key: string) => {
                return {
                    [ownershipDescriptions['service_ownership'][key as keyof typeof ownershipDescriptions.service_ownership]]: ownershipScores['service_ownership'][key as keyof typeof ownershipScores.service_ownership] as any
                }
            })
        }, {
            id: newId(),
            title: "Code Standards",
            scorePercent: codeStandardsScore,
            scoreSuccess: getLabelForScore(codeStandardsScore),
            scoreDescription: ownershipDescriptions.code_standards[ctx.input.code_standards as keyof typeof ownershipDescriptions.code_standards],
            details: ownershipDescriptions['code_standards'][ctx.input.code_standards as keyof typeof ownershipScores.code_standards],
            scoreChoices: Object.keys(ownershipDescriptions['code_standards']).map((key: string) => {
                return {
                    [ownershipDescriptions['code_standards'][key as keyof typeof ownershipDescriptions.code_standards]]: ownershipScores['code_standards'][key as keyof typeof ownershipScores.code_standards] as any
                }
            })
        }, {
            id: newId(),
            title: "Maintenance",
            scorePercent: maintenanceScore,
            scoreSuccess: getLabelForScore(maintenanceScore),
            scoreDescription: ownershipDescriptions.maintenance[ctx.input.maintenance as keyof typeof ownershipDescriptions.maintenance],
            details: ownershipDescriptions['maintenance'][ctx.input.maintenance as keyof typeof ownershipScores.maintenance],
            scoreChoices: Object.keys(ownershipDescriptions['maintenance']).map((key: string) => {
                return {
                    [ownershipDescriptions['maintenance'][key as keyof typeof ownershipDescriptions.maintenance]]: ownershipScores['maintenance'][key as keyof typeof ownershipScores.maintenance] as any
                }
            })
        }, {
            id: newId(),
            title: "Analytics/Analysis",
            scorePercent: analyticsAnalysisScore,
            scoreSuccess: getLabelForScore(analyticsAnalysisScore),
            details: ownershipDescriptions['analytics_analysis'][ctx.input.analytics_analysis as keyof typeof ownershipScores.analytics_analysis],
            scoreChoices: Object.keys(ownershipDescriptions['analytics_analysis']).map((key: string) => {
                return {
                    [ownershipDescriptions['analytics_analysis'][key as keyof typeof ownershipDescriptions.analytics_analysis]]: ownershipScores['analytics_analysis'][key as keyof typeof ownershipScores.analytics_analysis] as any
                }
            })
        }]
    };
};
