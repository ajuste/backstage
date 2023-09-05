import semver from 'semver';
import { AnalyzeResult, Analyzer, NoMatchResult, AnalysisMatch } from "./analyzer";

/**
 * Result of the Django version analyzer.
 */
export class DjangoVersionAnalyzeResult extends AnalyzeResult {
    djangoVersion: string;
    constructor(matched: boolean, djangoVersion: string) {
        super(matched);
        this.djangoVersion = djangoVersion;
    }
}

/**
 * Analyzer that extracts the django version from a requirements file.
 */
export class DjangoVersionAnalyzer implements Analyzer {
    analyze(path: string, content: string): Promise<AnalyzeResult> {
        if (path.endsWith("requirements.txt") && content.includes("django==")) {
            const djangoVersion = this.extractDjangoVersion(content);
            if (djangoVersion) {
                return Promise.resolve(new DjangoVersionAnalyzeResult(true, djangoVersion));
            }
        }
        return Promise.resolve(NoMatchResult);
    }

    /**
     * Disambiguate the analysis results by choosing the one with the lowest Django version.
     * @param analyses List of analysis results.
     * @returns The analysis result with the lowest Django version.
     */
    disambiguate(analyses: AnalysisMatch[]): Promise<AnalysisMatch> {
        return Promise.resolve(analyses.sort((a: AnalysisMatch, b: AnalysisMatch) => {
            return semver.compare((a.result as DjangoVersionAnalyzeResult).djangoVersion, (b.result as DjangoVersionAnalyzeResult).djangoVersion);
        })[0]);
    }

    /**
     * Extracts the Django version from the content of a Django file.
     * @param text Content of a Django file.
     * @returns The Django version or null if not found.
     */
    extractDjangoVersion(text: string) {
        const pattern = /^django==([\d\.]+)/mi;

        const match = pattern.exec(text);
        if (match) {
            return match[1];
        }
        return null;
    };

}