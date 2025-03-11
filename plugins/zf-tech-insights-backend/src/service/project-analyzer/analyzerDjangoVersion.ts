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
        if (path.endsWith("requirements.txt") && (content.includes("django==") || content.includes("Django=="))) {
            const djangoVersion = this.extractDjangoVersionFromRequirementsFile(content);
            if (djangoVersion) {
                return Promise.resolve(new DjangoVersionAnalyzeResult(true, djangoVersion));
            }
        }
        if (path.endsWith("pyproject.toml") && (content.includes("django ="))) {
            const djangoVersion = this.extractDjangoVersionFromPoetryFile(content);
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
        if (analyses.length === 0) {
            return Promise.resolve(analyses[0]);
        }

        return Promise.resolve(analyses.reduce((min, current) => {
            const minVersion = (min.result as DjangoVersionAnalyzeResult).djangoVersion;
            const currentVersion = (current.result as DjangoVersionAnalyzeResult).djangoVersion;
            
            const validMin = semver.valid(minVersion);
            const validCurrent = semver.valid(currentVersion);
            
            if (!validMin) return current;
            if (!validCurrent) return min;
            
            return semver.lt(currentVersion, minVersion) ? current : min;
        }));
    }

    /**
     * Extracts the Django version from the content of a requirements file.
     * @param text Content of a Django file.
     * @returns The Django version or null if not found.
     */
    extractDjangoVersionFromRequirementsFile(text: string) {
        const pattern = /^django==([\d\.]+)/mi;

        const match = pattern.exec(text);
        if (match) {
            return match[1];
        }
        return null;
    };

    /**
     * Extracts the Django version from the content of a poetry file.
     * @param text Content of a Django file.
     * @returns The Django version or null if not found.
     */
    extractDjangoVersionFromPoetryFile(text: string) {
        const pattern = /^django = "([\d\.]+)"/mi;

        const match = pattern.exec(text);
        if (match) {
            return match[1];
        }
        return null;
    }

}