import semver from 'semver';
import { AnalyzeResult, Analyzer, NoMatchResult, AnalysisMatch } from "./analyzer";

/**
 * Result of the Angular version analyzer.
 */
export class AngularVersionAnalyzeResult extends AnalyzeResult {
    angularVersion: string;
    constructor(matched: boolean, angularVersion: string) {
        super(matched);
        this.angularVersion = angularVersion;
    }
}

/**
 * Analyzer that extracts the Angular version from package-lock.json.
 */
export class AngularVersionAnalyzer implements Analyzer {
    analyze(path: string, content: string): Promise<AnalyzeResult> {
        if (path.endsWith("package-lock.json")) {
            const angularVersion = this.extractAngularVersion(content);
            if (angularVersion) {
                return Promise.resolve(new AngularVersionAnalyzeResult(true, angularVersion));
            }
        }
        return Promise.resolve(NoMatchResult);
    }

    /**
     * Disambiguate the analysis results by choosing the one with the lowest Angular version.
     * @param analyses List of analysis results.
     * @returns The analysis result with the lowest Angular version.
     */
    disambiguate(analyses: AnalysisMatch[]): Promise<AnalysisMatch> {
        if (analyses.length === 0 || analyses.length === 1) {
            return Promise.resolve(analyses[0]);
        }

        return Promise.resolve(analyses.reduce((min, current) => {
            if (!(min.result instanceof AngularVersionAnalyzeResult) || 
                !(current.result instanceof AngularVersionAnalyzeResult)) {
                return min;
            }

            const minVersion = min.result.angularVersion;
            const currentVersion = current.result.angularVersion;
            
            const validMin = semver.valid(minVersion);
            const validCurrent = semver.valid(currentVersion);
            
            if (!validMin) return current;
            if (!validCurrent) return min;
            
            return semver.lt(currentVersion, minVersion) ? current : min;
        }));
    }

    /**
     * Extracts the Angular version from package-lock.json content.
     * @param text Content of package-lock.json file.
     * @returns The Angular version or null if not found.
     */
    private extractAngularVersion(text: string): string | null {
        if (!text) {
            return null;
        }
        
        try {
            const packageLock = JSON.parse(text);
            if (!packageLock || typeof packageLock !== 'object') {
                return null;
            }
            
            const dependencies = packageLock.dependencies;
            if (!dependencies || typeof dependencies !== 'object') {
                return null;
            }
            
            const angularCore = dependencies['@angular/core'];
            if (!angularCore || typeof angularCore !== 'object') {
                return null;
            }
            
            return typeof angularCore.version === 'string' ? angularCore.version : null;
        } catch {
            return null;
        }
    }
}