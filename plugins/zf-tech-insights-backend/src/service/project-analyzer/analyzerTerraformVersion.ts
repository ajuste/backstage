import semver from 'semver';
import { AnalyzeResult, Analyzer, NoMatchResult, AnalysisMatch } from "./analyzer";

/**
 * Result of the terraform version analyzer.
 */
export class TerraformVersionAnalyzeResult extends AnalyzeResult {
    terraformVersion: string;
    constructor(matched: boolean, terraformVersion: string) {
        super(matched);
        this.terraformVersion = terraformVersion;
    }
}

/**
 * Analyzer that extracts the terraform version from a terraform file.
 */
export class TerraformVersionAnalyzer implements Analyzer {
    analyze(path: string, content: string): Promise<AnalyzeResult> {
        if (path.endsWith(".tf") && content.includes("required_version")) {
            const terraformVersion = this.extractTerraformVersion(content);
            if (terraformVersion) {
                return Promise.resolve(new TerraformVersionAnalyzeResult(true, terraformVersion));
            }
        }
        return Promise.resolve(NoMatchResult);
    }

    /**
     * Disambiguate the analysis results by choosing the one with the lowest terraform version.
     * @param analyses List of analysis results.
     * @returns The analysis result with the lowest terraform version.
     */
    disambiguate(analyses: AnalysisMatch[]): Promise<AnalysisMatch> {
        if (analyses.length === 0) {
            return Promise.resolve(analyses[0]);
        }

        return Promise.resolve(analyses.reduce((min, current) => {
            const minVersion = (min.result as TerraformVersionAnalyzeResult).terraformVersion;
            const currentVersion = (current.result as TerraformVersionAnalyzeResult).terraformVersion;
            
            const validMin = semver.valid(minVersion);
            const validCurrent = semver.valid(currentVersion);
            
            if (!validMin) return current;
            if (!validCurrent) return min;
            
            return semver.lt(currentVersion, minVersion) ? current : min;
        }));
    }

    /**
     * Extracts the terraform version from the content of a terraform file.
     * @param text Content of a terraform file.
     * @returns The terraform version or null if not found.
     */
    extractTerraformVersion(text: string) {
        const regex = /required_version\s*=\s*"([\d.]+)"/;
        const match = text.match(regex);

        if (match && match[1]) {
            return match[1];
        }

        return null;
    };

}