import { newId, getLabelForScore } from "./utils"

const safetyScores = {
    "static_typing": {
        "not_available": 0,
        "available_unenforced": 33,
        "available_enforced": 67,
        "available_enforced_cross_service": 100
    },
    "unit_tests": {
        "not_available": 0,
        "available_unenforced": 33,
        "available_enforced_incomplete": 67,
        "available_enforced_complete": 100
    },
    "integration_tests": {
        "not_available": 0,
        "available_unenforced": 33,
        "available_enforced_incomplete": 67,
        "available_enforced_complete": 100,
    },
    "e2e_tests": {
        "not_available": 0,
        "available_unenforced": 25,
        "available_enforced_incomplete": 50,
        "available_enforced_complete": 100
    },
    "testing_coverage": {
        "not_available": 0,
        "available_unenforced": 25,
        "available_enforced_incomplete": 50,
        "available_enforced_complete": 100
    },
}

const safetyDescription = {
    "static_typing": {
        "not_available": 'Static typing is not available.',
        "available_unenforced": 'Static typing is available but ignored/unused/unenforced.',
        "available_enforced": 'Static typing is available and enforced.',
        "available_enforced_cross_service": 'Static typing is available, enforced and cross-service types are separated out.'
    },
    "unit_tests": {
        "not_available": 'Unit test framework is not available.',
        "available_unenforced": 'Unit test framework is available but unenforced.',
        "available_enforced_incomplete": 'Unit test framework is available and enforced for new pull requests, but incomplete.',
        "available_enforced_complete": 'Unit test framework is available, enforced, and provides enough coverage to effectively catch regressions.',
    },
    "integration_tests": {
        "not_available": 'Integration test framework is not available.',
        "available_unenforced": 'Integration test framework is available but unenforced.',
        "available_enforced_incomplete": 'Integration test framework is available and enforced for new pull requests, but incomplete.',
        "available_enforced_complete": 'Integration test framework is available, enforced, and provides enough coverage to effectively catch regressions.',
    },
    "e2e_tests": {
        "not_available": 'E2E test framework is not available.',
        "available_unenforced": 'E2E test framework is available but unenforced.',
        "available_enforced_incomplete": 'E2E test framework is available and enforced for new pull requests, but incomplete.',
        "available_enforced_complete": 'E2E test framework is available, enforced, and provides enough coverage to effectively catch regressions.'
    },
    "testing_coverage": {
        "not_available": "Testing coverage is not collected.",
        "available_unenforced": "Testing coverage is collected, but not reported.",
        "available_enforced_incomplete": "Testing coverage is collected and reported, but minimums are unenforced.",
        "available_enforced_complete": "Testing coverage is collected, reported, and minimums are enforced."
    },
}

export const generateSafetyAreaScore = (ctx: any) => {
    const staticTypingScore = Math.round(safetyScores.static_typing[ctx.input.static_typing as keyof typeof safetyScores.static_typing]);
    const unitTestsScore = Math.round(safetyScores.unit_tests[ctx.input.unit_tests as keyof typeof safetyScores.unit_tests]);
    const integrationTestsScore = Math.round(safetyScores.integration_tests[ctx.input.integration_tests as keyof typeof safetyScores.integration_tests]);
    const e2eTestsScore = Math.round(safetyScores.e2e_tests[ctx.input.e2e_tests as keyof typeof safetyScores.e2e_tests]);
    const testingCoverageScore = Math.round(safetyScores.testing_coverage[ctx.input.testing_coverage as keyof typeof safetyScores.testing_coverage]);

    const scores = [
        staticTypingScore,
        unitTestsScore,
        integrationTestsScore,
        e2eTestsScore,
        testingCoverageScore,
    ]
    return {
        id: newId(),
        title: "Safety",
        scorePercent: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        scoreSuccess: getLabelForScore(scores.reduce((a, b) => a + b, 0) / scores.length),
        scoreEntries: [{
            id: newId(),
            title: "Static Typing",
            scorePercent: staticTypingScore,
            scoreSuccess: getLabelForScore(staticTypingScore),
            details: safetyDescription['static_typing'][ctx.input.static_typing as keyof typeof safetyScores.static_typing],
            scoreChoices: Object.keys(safetyScores['static_typing']).map((key: string) => {
                return {
                    [safetyDescription['static_typing'][key as keyof typeof safetyDescription.static_typing]]: safetyScores['static_typing'][key as keyof typeof safetyScores.static_typing] as any
                }
            })
        }, {
            id: newId(),
            title: "Unit Tests",
            howToScore: 'See Small Tests for a definition to apply here\: https://testing.googleblog.com/2010/12/test-sizes.html',
            scorePercent: unitTestsScore,
            scoreSuccess: getLabelForScore(unitTestsScore),
            details: safetyDescription['unit_tests'][ctx.input.unit_tests as keyof typeof safetyScores.unit_tests],
            scoreChoices: Object.keys(safetyScores['unit_tests']).map((key: string) => {
                return {
                    [safetyDescription['unit_tests'][key as keyof typeof safetyDescription.unit_tests]]: safetyScores['unit_tests'][key as keyof typeof safetyScores.unit_tests] as any
                }
            })
        }, {
            id: newId(),
            title: "Integration Tests",
            howToScore: 'See "Medium Tests" for a definition to apply here: https://testing.googleblog.com/2010/12/test-sizes.html',
            scorePercent: integrationTestsScore,
            scoreSuccess: getLabelForScore(integrationTestsScore),
            details: safetyDescription['integration_tests'][ctx.input.integration_tests as keyof typeof safetyScores.integration_tests],
            scoreChoices: Object.keys(safetyScores['integration_tests']).map((key: string) => {
                return {
                    [safetyDescription['integration_tests'][key as keyof typeof safetyDescription.integration_tests]]: safetyScores['integration_tests'][key as keyof typeof safetyScores.integration_tests] as any
                }
            })
        }, {
            id: newId(),
            title: "E2E Tests",
            howToScore: 'See "Large Tests" for a definition to apply here: https://testing.googleblog.com/2010/12/test-sizes.html',
            scorePercent: e2eTestsScore,
            scoreSuccess: getLabelForScore(e2eTestsScore),
            details: safetyDescription['e2e_tests'][ctx.input.e2e_tests as keyof typeof safetyScores.e2e_tests],
            scoreChoices: Object.keys(safetyScores['e2e_tests']).map((key: string) => {
                return {
                    [safetyDescription['e2e_tests'][key as keyof typeof safetyDescription.e2e_tests]]: safetyScores['e2e_tests'][key as keyof typeof safetyScores.e2e_tests] as any
                }
            })
        }, {
            id: newId(),
            title: "Testing Coverage",
            scorePercent: testingCoverageScore,
            scoreSuccess: getLabelForScore(testingCoverageScore),
            details: safetyDescription['testing_coverage'][ctx.input.testing_coverage as keyof typeof safetyScores.testing_coverage],
            scoreChoices: Object.keys(safetyScores['testing_coverage']).map((key: string) => {
                return {
                    [safetyDescription['testing_coverage'][key as keyof typeof safetyDescription.testing_coverage]]: safetyScores['testing_coverage'][key as keyof typeof safetyScores.testing_coverage] as any
                }
            })
        }]
    }
}