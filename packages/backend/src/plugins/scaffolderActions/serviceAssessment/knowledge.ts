import { newId, getLabelForScore } from "./utils"

const knowledgeScores = {
    ramp_up: {
        "requires_1_day_or_more_with_help": 25,
        "requires_1_hour_with_help": 50,
        "requires_1_hour_with_readme": 75,
        "requires_5_minutes_with_readme": 100
    },
    users: {
        "not_well_understood": 25,
        "well_understood_by_several_engineers": 50,
        "architecturally_documented_but_not_well_understood_by_engineers": 75,
        "architecturally_documented_and_well_understood_by_engineers": 100
    },
    expected_output: {
        "not_well_defined": 25,
        "well_defined_by_several_engineers_but_not_documented": 50,
        "architecturally_documented_but_not_well_understood_by_engineers": 75,
        "architecturally_documented_and_well_understood_by_engineers": 100
    },
    internal_functionality: {
        "not_well_defined": 25,
        "well_defined_by_several_engineers_but_not_documented": 50,
        "architecturally_documented_but_not_well_understood_by_engineers": 75,
        "architecturally_documented_and_well_understood_by_engineers": 100
    },
    business_importance: {
        "service_downtime_is_acceptable": 25,
        "service_downtime_requires_hotfix_deploy_within_5_days": 50,
        "service_downtime_requires_hotfix_deploy_within_1_day": 75,
        "service_is_critical_and_downtime_requires_hotfix_deploy_as_soon_as_possible": 100
    }
};

const knowledgeDescriptions = {
    ramp_up: {
        "requires_1_day_or_more_with_help": "Developing service locally requires 1 day or more of setup with an SME's help.",
        "requires_1_hour_with_help": "Developing service locally requires 1 hour of setup with an SME's help.",
        "requires_1_hour_with_readme": "Developing service locally requires 1 hour of setup following just the README.",
        "requires_5_minutes_with_readme": "Developing service locally requires 5 minutes of setup following just the README."
    },
    users: {
        "not_well_understood": "Users are not well understood.",
        "well_understood_by_several_engineers": "Users are well understood by several engineers, but not documented.",
        "architecturally_documented_but_not_well_understood_by_engineers": "The users are architecturally documented, but not well understood by engineers.",
        "architecturally_documented_and_well_understood_by_engineers": "The users are architecturally documented and well understood by engineers."
    },
    expected_output: {
        "not_well_defined": "Expected output is not well defined.",
        "well_defined_by_several_engineers_but_not_documented": "Expected output is well defined by several engineers, but not documented.",
        "architecturally_documented_but_not_well_understood_by_engineers": "Expected output is architecturally documented, but not well understood by engineers.",
        "architecturally_documented_and_well_understood_by_engineers": "Expected output is architecturally documented and well understood by engineers."
    },
    internal_functionality: {
        "not_well_defined": "Internal functionality is not well defined.",
        "well_defined_by_several_engineers_but_not_documented": "Internal functionality is well defined by several engineers, but not documented.",
        "architecturally_documented_but_not_well_understood_by_engineers": "Internal functionality is architecturally documented, but not well understood by engineers.",
        "architecturally_documented_and_well_understood_by_engineers": "Internal functionality is architecturally documented and well understood by engineers."
    },
    business_importance: {
        "service_downtime_is_acceptable": "Service downtime is acceptable.",
        "service_downtime_requires_hotfix_deploy_within_5_days": "Service downtime requires a hotfix deploy within 5 days.",
        "service_downtime_requires_hotfix_deploy_within_1_day": "Service downtime requires a hotfix deploy within 1 day.",
        "service_is_critical_and_downtime_requires_hotfix_deploy_as_soon_as_possible": "Service is critical and downtime requires a hotfix deploy as soon as possible."
    }
};

export const generateKnowledgeAreaScore = (ctx: any) => {
    const rampUpScore = Math.round(knowledgeScores.ramp_up[ctx.input.ramp_up as keyof typeof knowledgeScores.ramp_up]);
    const usersScore = Math.round(knowledgeScores.users[ctx.input.users as keyof typeof knowledgeScores.users]);
    const expectedOutputScore = Math.round(knowledgeScores.expected_output[ctx.input.expected_output as keyof typeof knowledgeScores.expected_output]);
    const internalFunctionalityScore = Math.round(knowledgeScores.internal_functionality[ctx.input.internal_functionality as keyof typeof knowledgeScores.internal_functionality]);
    const businessImportanceScore = Math.round(knowledgeScores.business_importance[ctx.input.business_importance as keyof typeof knowledgeScores.business_importance]);

    const scores = [rampUpScore, usersScore, expectedOutputScore, internalFunctionalityScore, businessImportanceScore];

    return {
        id: newId(),
        title: "Knowledge",
        scorePercent: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        scoreSuccess: getLabelForScore(scores.reduce((a, b) => a + b, 0) / scores.length),
        scoreEntries: [{
            id: newId(),
            title: "Ramp-up",
            howToScore: "An SME is a subject matter expert who is knowledgable about running the service.",
            scorePercent: rampUpScore,
            scoreSuccess: getLabelForScore(rampUpScore),
            details: knowledgeDescriptions['ramp_up'][ctx.input.ramp_up as keyof typeof knowledgeScores.ramp_up],
            scoreChoices: Object.keys(knowledgeScores['ramp_up']).map((key: string) => {
                return {
                    [knowledgeDescriptions['ramp_up'][key as keyof typeof knowledgeDescriptions.ramp_up]]: knowledgeScores['ramp_up'][key as keyof typeof knowledgeScores.ramp_up] as any
                }
            })
        }, {
            id: newId(),
            title: "Users",
            howToScore: "Users do not mean Humans, any service that uses another service can be a \"User\" in this definition.",
            scorePercent: usersScore,
            scoreSuccess: getLabelForScore(usersScore),
            details: knowledgeDescriptions['users'][ctx.input.users as keyof typeof knowledgeScores.users],
            scoreChoices: Object.keys(knowledgeScores['users']).map((key: string) => {
                return {
                    [knowledgeDescriptions['users'][key as keyof typeof knowledgeDescriptions.users]]: knowledgeScores['users'][key as keyof typeof knowledgeScores.users] as any
                }
            })
        }, {
            id: newId(),
            title: "Expected Output",
            howToScore: "By defined, we mean behavior can be communicated easily without requiring an investigation.",
            scorePercent: expectedOutputScore,
            scoreSuccess: getLabelForScore(expectedOutputScore),
            details: knowledgeDescriptions['expected_output'][ctx.input.expected_output as keyof typeof knowledgeScores.expected_output],
            scoreChoices: Object.keys(knowledgeScores['expected_output']).map((key: string) => {
                return {
                    [knowledgeDescriptions['expected_output'][key as keyof typeof knowledgeDescriptions.expected_output]]: knowledgeScores['expected_output'][key as keyof typeof knowledgeScores.expected_output] as any
                }
            })
        }, {
            id: newId(),
            title: "Internal Functionality",
            howToScore: "By defined, we mean behavior can be communicated easily without requiring an investigation.",
            scorePercent: internalFunctionalityScore,
            scoreSuccess: getLabelForScore(internalFunctionalityScore),
            details: knowledgeDescriptions['internal_functionality'][ctx.input.internal_functionality as keyof typeof knowledgeScores.internal_functionality],
            scoreChoices: Object.keys(knowledgeScores['internal_functionality']).map((key: string) => {
                return {
                    [knowledgeDescriptions['internal_functionality'][key as keyof typeof knowledgeDescriptions.internal_functionality]]: knowledgeScores['internal_functionality'][key as keyof typeof knowledgeScores.internal_functionality] as any
                }
            })
        }, {
            id: newId(),
            title: "Business Importance",
            howToScore: "Service downtime is described as the entire service becoming unavailable.",
            scorePercent: businessImportanceScore,
            scoreSuccess: getLabelForScore(businessImportanceScore),
            details: knowledgeDescriptions['business_importance'][ctx.input.business_importance as keyof typeof knowledgeScores.business_importance],
            scoreChoices: Object.keys(knowledgeScores['business_importance']).map((key: string) => {
                return {
                    [knowledgeDescriptions['business_importance'][key as keyof typeof knowledgeDescriptions.business_importance]]: knowledgeScores['business_importance'][key as keyof typeof knowledgeScores.business_importance] as any
                }
            })
        }]
    };
};
