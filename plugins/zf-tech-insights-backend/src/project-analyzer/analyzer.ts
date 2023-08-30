export type AnalysisMatch = {
    analyzer: Analyzer;
    result: AnalyzeResult;
    path: string;
}

export class AnalyzeResult {
    matched: boolean;
    constructor(matched: boolean) {
        this.matched = matched;
    }
}

/**
 * Analyzer that analyzes a project.
 */
export interface Analyzer {
    /**
     * Analyzes a file.
     * @param path Path to the file to analyze.
     * @param content Content of the file to analyze.
     */
    analyze(path: string, content: string): Promise<AnalyzeResult>;

    /**
     * Disambiguate the analysis results.ƒ
     * @param analyses List of analysis results.
     */
    disambiguate(analyses: Array<AnalysisMatch>): Promise<AnalysisMatch>;
}

/**
 * Result with no matches.
 */
export const NoMatchResult = new AnalyzeResult(false);